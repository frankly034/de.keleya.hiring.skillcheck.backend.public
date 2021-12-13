import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { PrismaService } from '../prisma.services';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let prismaService: PrismaService;

  let id = 1;
  const dto = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password',
  };

  const defaultValues = {
    id: ++id,
    emailConfirmed: false,
    isAdmin: true,
    isDeleted: false,
    updatedAt: new Date(),
    createdAt: new Date(),
    credentialsId: id,
    ...dto,
  }

  const defaultExpectValues = {
    id: expect.any(Number),
    emailConfirmed: expect.any(Boolean),
    isAdmin: expect.any(Boolean),
    isDeleted: expect.any(Boolean),
    credentialsId: expect.any(Number),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  };

  const findDto = {
    limit: 20,
    offset: 0,
    email: '',
    name: '',
    id: [],
    updatedSince: "",
    credentials: true
  };

  const authUser = {...defaultValues, ...dto, isAdmin: true};

  const mockPrismaService = {
    user: {
      create: jest.fn(({ data: {credentials: { create: { hash }}, ...dto } }) => defaultValues),
      findUnique: jest.fn(({id}) => defaultValues),
      findOne: jest.fn(({email}) => defaultValues),
      update: jest.fn(({ data: {credentials, ...rest} }) => {
        return credentials?.delete
          ? {...defaultValues, ...rest, id}
          : {...defaultValues, id, ...rest}
      }),
      findMany: jest.fn((findDto) => [{...defaultValues}]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'JWT_SECRET',
          signOptions: {
            expiresIn: '1year',
            algorithm: 'HS256',
          },
        }),
      ],
      providers: [UserService, PrismaService, JwtStrategy, ConfigService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();
    userService = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  it('should create user record and return it', async () => {
    expect(await userService.create({ hash: 'xyz', ...dto })).toEqual({
      ...defaultExpectValues,
      ...dto,
    });
  });

  it('should fetch a user record and return it', async() => {
    expect(await userService.findUnique({id}, true, authUser)).toEqual(defaultValues)
  });

  it('should update a user record and return it', async() => {
    expect(await userService.update({id, name: 'Frank Tom'}, authUser)).toEqual({...defaultValues, id, name: 'Frank Tom'})
  });

  it('should update a is_deleted to true and return user', async() => {
    expect(await userService.delete({id}, authUser)).toEqual({...defaultValues, id, isDeleted: true})
  });

  it('should find all users with query params and return user', async() => {
    expect(await userService.find(findDto, authUser)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ...defaultValues
        })
      ])
    );
    expect(prismaService.user.findMany).toHaveBeenCalledTimes(1);
  });
});
