import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { JwtTokenUser } from 'src/common/types/jwtTokenUser';
import { hashPassword, matchHashedPassword } from '../../src/common/utils/password';
import { PrismaService } from '../prisma.services';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getToken(user: User) {
    const { email: username, id } = user;
    const payload: JwtTokenUser = { username, id };
    return this.jwtService.sign(payload);
  }

  public async findOne(whereUnique: Prisma.UserWhereUniqueInput, includeCredentials = false) {
    const foundUser = await this.prisma.user.findUnique({
      where: { ...whereUnique },
      include: { credentials: includeCredentials },
    });
    return foundUser;
  }

  private async getAuthenticatedUser(authenticateUserDto: AuthenticateUserDto) {
    const { email, password } = authenticateUserDto;
    const foundUser = await this.findOne({ email }, true);
    if (foundUser) {
      const isPasswordVerified = await matchHashedPassword(password, foundUser.password);
      return isPasswordVerified ? foundUser : null;
    }
    return null;
  }

  private isVerifiedAccess(authUser: User, resourceId: number) {
    if (!authUser?.isAdmin && authUser?.id !== resourceId) {
      throw new UnauthorizedException();
    }
    return true;
  }

  /**
   * Finds users with matching fields
   *
   * @param findUserDto
   * @returns User[]
   */
  async find(findUserDto: FindUserDto, authUser?: User): Promise<User[]> {
    if (!authUser?.isAdmin){
      return [authUser];
    }
    const { limit, offset, updatedSince, id: ids, name, credentials, email } = findUserDto;
    return this.prisma.user.findMany({
      where: {
        OR: {
          email: { contains: email },
          name: { contains: name },
        },
        AND: {
          updatedAt: { gte: updatedSince },
          id: { in: ids },
        },
      },
      take: Number(limit),
      skip: Number(offset),
      include: { credentials },
    });
  }

  /**
   * Finds single User by id, name or email
   *
   * @param whereUnique
   * @returns User
   */
  async findUnique(whereUnique: Prisma.UserWhereUniqueInput, includeCredentials = false, authUser?: User) {    
    this.isVerifiedAccess(authUser, whereUnique.id);
    if(authUser.id === whereUnique.id){
      return authUser;
    }
    const foundUser = await this.findOne(whereUnique, includeCredentials);
    if (foundUser) {
      return foundUser;
    }
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  /**
   * Creates a new user with credentials
   *
   * @param createUserDto
   * @returns result of create
   */
  async create(createUserDto: CreateUserDto) {
    const { hash, password: plainPassword, ...rest } = createUserDto;
    const password = await hashPassword(plainPassword);
    return hash
      ? this.prisma.user.create({ data: { ...rest, password, credentials: { create: { hash } } } })
      : this.prisma.user.create({ data: { ...rest, password } });
  }

  /**
   * Updates a user unless it does not exist or has been marked as deleted before
   *
   * @param updateUserDto
   * @returns result of update
   */
  async update(updateUserDto: UpdateUserDto, authUser?: User) {
    this.isVerifiedAccess(authUser, updateUserDto.id);
    const { hash, id, ...rest } = updateUserDto;
    const foundUser = await this.findOne({ id }, true);
    if (!foundUser.isDeleted) {
      const data =
        hash && foundUser.credentials
          ? { ...rest, credentials: { update: { hash } } }
          : hash
          ? { ...rest, credentials: { create: { hash } } }
          : { ...rest };
      return this.prisma.user.update({
        where: { id: updateUserDto.id },
        data,
        include: { credentials: true },
      });
    }
    throw new HttpException('User has been deleted', HttpStatus.NOT_FOUND);
  }

  /**
   * Deletes a user
   * Function does not actually remove the user from database but instead marks them as deleted by:
   * - removing the corresponding `credentials` row from your db
   * - changing the name to DELETED_USER_NAME constant (default: `(deleted)`)
   * - setting email to NULL
   *
   * @param deleteUserDto
   * @returns results of users and credentials table modification
   */
  async delete(deleteUserDto: DeleteUserDto, authUser?: User) {
    this.isVerifiedAccess(authUser, deleteUserDto.id);
    return this.prisma.user.update({
      where: { id: deleteUserDto.id },
      data: { isDeleted: true, credentials: { delete: true } },
    });
  }

  /**
   * Authenticates a user and returns a JWT token
   *
   * @param authenticateUserDto email and password for authentication
   * @returns a JWT token
   */
  async authenticateAndGetJwtToken(authenticateUserDto: AuthenticateUserDto) {
    const foundAuthenticatedUser = await this.getAuthenticatedUser(authenticateUserDto);
    if (foundAuthenticatedUser && !foundAuthenticatedUser.isDeleted) {
      return {
        token: this.getToken(foundAuthenticatedUser),
      };
    }
    throw new HttpException('Invalid user credentials', HttpStatus.BAD_REQUEST);
  }

  /**
   * Authenticates a user
   *
   * @param authenticateUserDto email and password for authentication
   * @returns true or false
   */
  async authenticate(authenticateUserDto: AuthenticateUserDto) {
    const foundAuthenticatedUser = await this.getAuthenticatedUser(authenticateUserDto);
    return foundAuthenticatedUser || false;
  }

  /**
   * Validates a JWT token
   *
   * @param token a JWT token
   * @returns the decoded token if valid
   */
  async validateToken(token: string) {
    if (token && token.length > 7) {
      const jwtToken = token.substring(7);
      const decoded = await this.jwtService.decode(jwtToken);
      return decoded || false;
    }
    return false;
  }
}
