import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { PrismaService } from '../prisma.services';
import { UserService } from './user.service';
import { getRandomString } from '../common/utils/helpers';

describe('UserService', () => {
  let userService: UserService;

  const id = '15669f06-6e7a-40b7-ba10-7c7dc9c9780';
  const dto = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password',
  };

  const defaultValues = {
    id: getRandomString(),
    email_confirmed: false,
    is_admin: false,
    is_deleted: false,
    updated_at: getRandomString(),
    created_at: getRandomString(),
    credentials_id: null,
    ...dto,
  }

  const defaultExpectValues = {
    id: expect.any(String),
    email_confirmed: expect.any(Boolean),
    is_admin: expect.any(Boolean),
    is_deleted: expect.any(Boolean),
    credentials_id: expect.any(Object),
    created_at: expect.any(String),
    updated_at: expect.any(String),
  };

  const mockPrismaService = {
    user: {
      create: jest.fn(({ data: {credentials: { create: { hash }}, ...dto } }) => defaultValues),
      findUnique: jest.fn(({id}) => defaultValues),
      update: jest.fn(({ data: {credentials, ...rest} }) => {
        return credentials?.delete
          ? {...defaultValues, ...rest, id}
          : {...defaultValues, id, ...rest}
      }),
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
    expect(await userService.findUnique({id})).toEqual(defaultValues)
  });

  it('should update a user record and return it', async() => {
    expect(await userService.update({id, name: 'Frank Tom'})).toEqual({...defaultValues, id, name: 'Frank Tom'})
  });

  it('should update a is_deleted to true and return user', async() => {
    expect(await userService.delete({id})).toEqual({...defaultValues, id, is_deleted: true})
  });
});
