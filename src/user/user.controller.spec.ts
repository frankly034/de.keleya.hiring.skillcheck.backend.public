import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { PrismaService } from '../prisma.services';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { getRandomString } from '../common/utils/helpers';

describe('UserController', () => {
  let userController: UserController;
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
  };

  const defaultExpectValues = {
    id: expect.any(String),
    email_confirmed: expect.any(Boolean),
    is_admin: expect.any(Boolean),
    is_deleted: expect.any(Boolean),
    credentials_id: expect.any(Object),
    created_at: expect.any(String),
    updated_at: expect.any(String),
  };

  const mockUserService = {
    create: jest.fn(({ hash, ...dto }) => ({
      ...dto,
      ...defaultValues,
    })),
    findUnique: jest.fn((id) => ({ ...defaultValues, ...dto})),
    update: jest.fn((updateData) => ({ ...defaultValues, ...dto, ...updateData })),
    delete: jest.fn(({id}) => ({ ...defaultValues, ...dto, id, is_deleted: true })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
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
      .overrideProvider(UserService)
      .useValue(mockUserService)
      .compile();
    userService = module.get<UserService>(UserService);
    userController = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
    expect(userService).toBeDefined();
  });

  it('should create a user', async () => {
    expect(await userController.create(dto)).toEqual({
      ...dto,
      ...defaultExpectValues,
    });
  });

  it('should create a user with credentials', async () => {
    expect(await userController.create({ ...dto, hash: 'xyz' })).toEqual({
      ...dto,
      ...defaultExpectValues,
    });
  });

  it('should call user service with appropriate dto data', async () => {
    expect(await userController.create(dto));
    expect(mockUserService.create).toHaveBeenCalledWith(dto);
  });

  it('should fetch a user with id param', async () => {
    expect(await userController.findUnique(id)).toEqual({
      ...dto,
      ...defaultExpectValues,
    });
    expect(mockUserService.findUnique).toHaveBeenCalled();
  });

  it('should update a user', async () => {
    const updateData = { id: getRandomString(), name: "Franklyn Thomas"};
    expect(await userController.update(updateData)).toEqual({
      ...dto,
      ...defaultExpectValues,
      ...updateData,
    });
  });

  it('should update is_deleted to true and return user', async () => {
    const updateData = { id: getRandomString(), name: "Franklyn Thomas"};
    expect(await userController.delete({id})).toEqual({
      ...dto,
      ...defaultExpectValues,
      id, is_deleted: true,
    });
  });

});
