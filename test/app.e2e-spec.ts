import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRandomString } from '../src/common/utils/helpers';
import { PrismaService } from '../src/prisma.services';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const id = '15669f06-6e7a-40b7-ba10-7c7dc9c9780f';
  const data = { email: 'example@example.com', name: 'John Snnow', password: 'password' };
  const defaultResponseData = {
    email_confirmed: false,
    is_admin: false,
    is_deleted: false,
    updated_at: getRandomString(),
    created_at: getRandomString(),
    credentials_id: 'xyz',
  };

  const defaultUserExpectValues = {
    id: expect.any(String),
    name: expect.any(String),
    email: expect.any(String),
    email_confirmed: expect.any(Boolean),
    is_admin: expect.any(Boolean),
    is_deleted: expect.any(Boolean),
    credentials_id: expect.any(String),
    created_at: expect.any(String),
    updated_at: expect.any(String),
  };

  const expectedValidationError = {
    timestamp: expect.any(String),
    path: expect.any(String),
    method: expect.any(String),
    message: expect.arrayContaining([expect.any(String)]),
    errorCode: expect.any(Number),
    name: expect.any(String),
    meta: expect.any(String),
  }

  const mockPrismaService = {
    user: {
      create: jest.fn().mockResolvedValue({
        id: getRandomString(),
        ...data,
        ...defaultResponseData
      }),
      findMany: jest.fn().mockResolvedValue([{ id: getRandomString(), ...data, ...defaultResponseData }]),
      findUnique: jest.fn().mockResolvedValue({ id: getRandomString(), ...data, ...defaultResponseData }),
      update: jest.fn().mockResolvedValue({ id: getRandomString(), ...data, ...defaultResponseData }),
      delete: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('/api/_health (GET)', () => {
    return request(app.getHttpServer()).get('/api/_health').expect(200).expect('OK');
  });

  it('/user (GET)', async () => {
    return request(app.getHttpServer())
      .get('/user')
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              email: expect.any(String),
              is_deleted: expect.any(Boolean),
              ...defaultUserExpectValues,
            }),
          ]),
        );
      });
  });

  it('/user (POST) --> create a new user - without hash', async () => {
    return request(app.getHttpServer())
      .post('/user')
      .send(data)
      .expect(201)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ...defaultUserExpectValues,
          }),
        );
      });
  });

  it('/user (POST) --> create a new user - with hash', async () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({...data, hash: 'xyz'})
      .expect(201)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ...defaultUserExpectValues,
          }),
        );
      });
  });

  it('/user (POST)--> return 400 validation error - incomplete dto ', async () => {
    const {email, ...rest} = data;
    return request(app.getHttpServer())
      .post('/user')
      .send(rest)
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ...expectedValidationError
          }),
        );
      });
  });

  it('/user (POST)--> return 400 validation error - invalid email ', async () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({...data, email: "me"})
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ...expectedValidationError
          }),
        );
      });
  });

  it('/user (POST)--> return 400 validation error - empty request body ', async () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({})
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ...expectedValidationError
          }),
        );
      });
  });

  it('/user/:id (GET) --> return a single user data', async () => {
    return request(app.getHttpServer())
      .get(`/user/${id}`)
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ...defaultUserExpectValues,
          }),
        );
      });
  });

  it('/user/:id (GET)--> return 400 validation error - invalid uuid param ', async () => {
    return request(app.getHttpServer())
      .get(`/user/123`)
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ...expectedValidationError,
          }),
        );
      });
  });

  it('/user (PATCH) --> return 400 if id is not sent', async () => {
    return request(app.getHttpServer())
      .patch('/user')
      .send(data)
      .expect(400)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ...expectedValidationError,
          }),
        );
      });
  });

  it('/user (PATCH) --> return 200', async () => {
    const updateData = { id: getRandomString(), name: 'Franklyn Thomas'};
    return request(app.getHttpServer())
      .patch('/user')
      .send(updateData)
      .expect(200)
      .then((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            ...defaultUserExpectValues,
          }),
        );
      });
  });

});
