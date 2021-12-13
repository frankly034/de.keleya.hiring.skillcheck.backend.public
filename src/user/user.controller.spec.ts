import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { PrismaService } from '../prisma.services';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { getRandomString } from '../common/utils/helpers';
import RequestWithUser from '../../src/common/types/requestWithUser';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  let id = 1;

  const dto = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password',
  };

  const defaultValues = {
    id: ++id,
    emailConfirmed: false,
    isAdmin: false,
    isDeleted: false,
    updatedAt: getRandomString(),
    createdAt: getRandomString(),
    credentialsId: id,
  };

  const defaultExpectValues = {
    id: expect.any(Number),
    emailConfirmed: expect.any(Boolean),
    isAdmin: expect.any(Boolean),
    isDeleted: expect.any(Boolean),
    credentialsId: expect.any(Number),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  };

  const mockRequestObject = () => {
    return createMock<RequestWithUser>({
      user: {...defaultValues, ...dto, isAdmin: true},
    });
  };
  
  const findDto = {
    limit: 20,
    offset: 0,
    email: '',
    name: '',
    id: [],
    updatedSince: "",
    credentials: true
  }

  const mockUserService = {
    create: jest.fn(({ hash, ...dto }) => ({
      ...dto,
      ...defaultValues,
    })),
    findUnique: jest.fn((id) => ({ ...defaultValues, ...dto})),
    update: jest.fn((updateData) => ({ ...defaultValues, ...dto, ...updateData })),
    delete: jest.fn(({id}) => ({ ...defaultValues, ...dto, id, isDeleted: true })),
    find: jest.fn((findDto) => ([{...dto, ...defaultValues, credentialsId: id}]))
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
    const req = mockRequestObject();
    expect(await userController.findUnique(id, req)).toEqual({
      ...dto,
      ...defaultExpectValues,
    });
    expect(mockUserService.findUnique).toHaveBeenCalled();
  });

  it('should update a user', async () => {
    const req = mockRequestObject();
    const updateData = { id: 1, name: "Franklyn Thomas"};
    expect(await userController.update(updateData, req)).toEqual({
      ...dto,
      ...defaultExpectValues,
      ...updateData,
    });
  });

  it('should update is_deleted to true and return user', async () => {
    const req = mockRequestObject();
    const updateData = { id: 1, name: "Franklyn Thomas"};
    expect(await userController.delete({id}, req)).toEqual({
      ...dto,
      ...defaultExpectValues,
      id, isDeleted: true,
    });
  });

  it('should fetch users', async () => {
    const req = mockRequestObject();
    expect(await userController.find(findDto, req)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          email: expect.any(String),
          emailConfirmed: expect.any(Boolean),
          isAdmin: expect.any(Boolean),
          isDeleted: expect.any(Boolean),
          password: expect.any(String),
          credentialsId: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      ])
    );
  });

});
