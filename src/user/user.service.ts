import { HttpCode, HttpException, HttpStatus, Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
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

  /**
   * Finds users with matching fields
   *
   * @param findUserDto
   * @returns User[]
   */
  async find(findUserDto: FindUserDto): Promise<User[]> {
    const { limit, offset, updatedSince, id: ids, name, credentials, email } = findUserDto;
    return this.prisma.user.findMany();
  }

  /**
   * Finds single User by id, name or email
   *
   * @param whereUnique
   * @returns User
   */
  async findUnique(whereUnique: Prisma.UserWhereUniqueInput, includeCredentials = false) {
    const foundUser = await this.prisma.user.findUnique({
      where: { ...whereUnique },
      include: { credentials: true },
    });
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
    const { hash, ...rest } = createUserDto;
    return hash
      ? this.prisma.user.create({ data: { ...rest, credentials: { create: { hash } } } })
      : this.prisma.user.create({ data: { ...rest } });
  }

  /**
   * Updates a user unless it does not exist or has been marked as deleted before
   *
   * @param updateUserDto
   * @returns result of update
   */
  async update(updateUserDto: UpdateUserDto) {
    const { hash, ...rest } = updateUserDto;
    const foundUser = await this.findUnique({ id: rest.id }, true);
    if (!foundUser.is_deleted) {
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
  async delete(deleteUserDto: DeleteUserDto) {
    return this.prisma.user.update({
      where: { id: deleteUserDto.id },
      data: { is_deleted: true, credentials: { delete: true } },
    });
  }

  /**
   * Authenticates a user and returns a JWT token
   *
   * @param authenticateUserDto email and password for authentication
   * @returns a JWT token
   */
  async authenticateAndGetJwtToken(authenticateUserDto: AuthenticateUserDto) {
    throw new NotImplementedException();
  }

  /**
   * Authenticates a user
   *
   * @param authenticateUserDto email and password for authentication
   * @returns true or false
   */
  async authenticate(authenticateUserDto: AuthenticateUserDto) {
    throw new NotImplementedException();
  }

  /**
   * Validates a JWT token
   *
   * @param token a JWT token
   * @returns the decoded token if valid
   */
  async validateToken(token: string) {
    throw new NotImplementedException();
  }
}
