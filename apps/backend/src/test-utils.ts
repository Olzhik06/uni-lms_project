import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import type supertest from 'supertest';
import request from 'supertest';
import { AppModule } from './app.module';
import { LocalizedHttpExceptionFilter } from './common/filters/localized-http-exception.filter';

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

export async function createTestApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new LocalizedHttpExceptionFilter());
  await app.init();
  return app;
}

export function uniqueValue(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function registerUser(
  app: INestApplication,
  payload: { email: string; password: string; fullName: string; role?: Role },
): Promise<supertest.Response> {
  return request(app.getHttpServer())
    .post('/api/auth/register')
    .send(payload);
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
): Promise<supertest.Response> {
  return request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password });
}

export async function createAdminToken(app: INestApplication) {
  const email = `${uniqueValue('admin')}@example.com`;
  const password = 'Admin123!';
  const register = await registerUser(app, { email, password, fullName: 'Smoke Admin', role: Role.ADMIN });
  const login = await loginUser(app, email, password);

  return {
    token: login.body.accessToken as string,
    email,
    password,
    userId: register.body.user.id as string,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
