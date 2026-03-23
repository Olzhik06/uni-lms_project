import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createTestApp, loginUser, registerUser, uniqueValue, authHeader } from '../test-utils';

describe('Auth and Profile (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
    if (app) {
      await app.close();
    }
  });

  it('registers, authenticates, updates profile, and changes password', async () => {
    const email = `${uniqueValue('student')}@example.com`;
    const password = 'Student123!';

    const register = await registerUser(app, {
      email,
      password,
      fullName: 'Smoke Student',
    });

    expect(register.status).toBe(201);
    expect(register.body).toHaveProperty('accessToken');
    expect(register.body.user.email).toBe(email);
    createdUserIds.push(register.body.user.id);

    const login = await loginUser(app, email, password);
    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('refreshToken');

    const token = login.body.accessToken as string;

    const profile = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set(authHeader(token));
    expect(profile.status).toBe(200);
    expect(profile.body.email).toBe(email);

    const updatedEmail = `${uniqueValue('student-updated')}@example.com`;
    const updateProfile = await request(app.getHttpServer())
      .patch('/api/me/profile')
      .set(authHeader(token))
      .send({ fullName: 'Updated Smoke Student', email: updatedEmail });
    expect(updateProfile.status).toBe(200);
    expect(updateProfile.body.fullName).toBe('Updated Smoke Student');
    expect(updateProfile.body.email).toBe(updatedEmail);

    const changePassword = await request(app.getHttpServer())
      .patch('/api/me/password')
      .set(authHeader(token))
      .send({ currentPassword: password, newPassword: 'Student456!' });
    expect(changePassword.status).toBe(200);
    expect(changePassword.body.updated).toBe(true);

    const relogin = await loginUser(app, updatedEmail, 'Student456!');
    expect(relogin.status).toBe(200);
    expect(relogin.body.user.fullName).toBe('Updated Smoke Student');
  });

  it('rejects invalid credentials', async () => {
    const login = await loginUser(app, 'missing@example.com', 'wrong-password');
    expect(login.status).toBe(401);
  });

  it('localizes auth errors from Accept-Language', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Accept-Language', 'ru-RU')
      .send({ email: 'missing@example.com', password: 'wrong-password' });

    expect(login.status).toBe(401);
    expect(login.body.message).toBe('Неверный логин или пароль');
  });
});
