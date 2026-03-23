import { INestApplication } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import request from 'supertest';
import { authHeader, createAdminToken, createTestApp, loginUser, uniqueValue } from '../test-utils';

describe('Admin CRUD and Courses (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;

  const created = {
    groups: [] as string[],
    users: [] as string[],
    courses: [] as string[],
  };

  beforeAll(async () => {
    app = await createTestApp();
    const admin = await createAdminToken(app);
    adminToken = admin.token;
    created.users.push(admin.userId);
  });

  afterAll(async () => {
    if (created.courses.length) {
      await prisma.course.deleteMany({ where: { id: { in: created.courses } } });
    }
    if (created.users.length) {
      await prisma.user.deleteMany({ where: { id: { in: created.users } } });
    }
    if (created.groups.length) {
      await prisma.group.deleteMany({ where: { id: { in: created.groups } } });
    }
    await prisma.$disconnect();
    if (app) {
      await app.close();
    }
  });

  it('lets an admin create users, groups, courses, and enrollments that become visible to participants', async () => {
    const suffix = uniqueValue('crud');

    const groupRes = await request(app.getHttpServer())
      .post('/api/admin/groups')
      .set(authHeader(adminToken))
      .send({ name: `QA-${suffix}`, degree: 'Bachelor', year: 2 });
    expect(groupRes.status).toBe(201);
    created.groups.push(groupRes.body.id);

    const teacherEmail = `${suffix}-teacher@example.com`;
    const studentEmail = `${suffix}-student@example.com`;

    const teacherRes = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set(authHeader(adminToken))
      .send({
        email: teacherEmail,
        password: 'Teacher123!',
        fullName: 'Smoke Teacher',
        role: Role.TEACHER,
      });
    expect(teacherRes.status).toBe(201);
    created.users.push(teacherRes.body.id);

    const studentRes = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set(authHeader(adminToken))
      .send({
        email: studentEmail,
        password: 'Student123!',
        fullName: 'Smoke Student',
        role: Role.STUDENT,
        groupId: groupRes.body.id,
      });
    expect(studentRes.status).toBe(201);
    created.users.push(studentRes.body.id);

    const courseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set(authHeader(adminToken))
      .send({
        code: `QA-${suffix}`.toUpperCase(),
        title: 'Smoke Testing Course',
        description: 'Course used by automated smoke tests',
        semester: '2026-Spring',
        teacherId: teacherRes.body.id,
      });
    expect(courseRes.status).toBe(201);
    created.courses.push(courseRes.body.id);

    const teacherEnrollment = await request(app.getHttpServer())
      .post('/api/admin/enrollments')
      .set(authHeader(adminToken))
      .send({ userId: teacherRes.body.id, courseId: courseRes.body.id, roleInCourse: 'TEACHER' });
    expect(teacherEnrollment.status).toBe(201);

    const studentEnrollment = await request(app.getHttpServer())
      .post('/api/admin/enrollments')
      .set(authHeader(adminToken))
      .send({ userId: studentRes.body.id, courseId: courseRes.body.id, roleInCourse: 'STUDENT' });
    expect(studentEnrollment.status).toBe(201);

    const adminUsers = await request(app.getHttpServer())
      .get('/api/admin/users?page=1&limit=5')
      .set(authHeader(adminToken));
    expect(adminUsers.status).toBe(200);
    expect(Array.isArray(adminUsers.body.items)).toBe(true);
    expect(adminUsers.body.page).toBe(1);
    expect(typeof adminUsers.body.total).toBe('number');

    const adminGroups = await request(app.getHttpServer())
      .get('/api/admin/groups?page=1&limit=5')
      .set(authHeader(adminToken));
    expect(adminGroups.status).toBe(200);
    expect(adminGroups.body.items.some((group: { id: string }) => group.id === groupRes.body.id)).toBe(true);

    const adminEnrollments = await request(app.getHttpServer())
      .get('/api/admin/enrollments?page=1&limit=10')
      .set(authHeader(adminToken));
    expect(adminEnrollments.status).toBe(200);
    expect(adminEnrollments.body.items.some((enrollment: { courseId: string; userId: string }) => enrollment.courseId === courseRes.body.id && enrollment.userId === studentRes.body.id)).toBe(true);

    const filteredUsers = await request(app.getHttpServer())
      .get(`/api/admin/users?page=1&limit=10&search=${encodeURIComponent('Smoke Teacher')}&role=TEACHER`)
      .set(authHeader(adminToken));
    expect(filteredUsers.status).toBe(200);
    expect(filteredUsers.body.items).toHaveLength(1);
    expect(filteredUsers.body.items[0].email).toBe(teacherEmail);

    const filteredCourses = await request(app.getHttpServer())
      .get(`/api/courses?page=1&limit=10&search=${encodeURIComponent('Smoke Testing')}&teacherId=${teacherRes.body.id}&semester=2026-Spring`)
      .set(authHeader(adminToken));
    expect(filteredCourses.status).toBe(200);
    expect(filteredCourses.body.items.some((course: { id: string }) => course.id === courseRes.body.id)).toBe(true);

    const filteredEnrollments = await request(app.getHttpServer())
      .get(`/api/admin/enrollments?page=1&limit=10&courseId=${courseRes.body.id}&roleInCourse=STUDENT&search=${encodeURIComponent(studentEmail)}`)
      .set(authHeader(adminToken));
    expect(filteredEnrollments.status).toBe(200);
    expect(filteredEnrollments.body.items).toHaveLength(1);
    expect(filteredEnrollments.body.items[0].userId).toBe(studentRes.body.id);

    teacherToken = (await loginUser(app, teacherEmail, 'Teacher123!')).body.accessToken;
    studentToken = (await loginUser(app, studentEmail, 'Student123!')).body.accessToken;

    const teacherCourses = await request(app.getHttpServer())
      .get('/api/courses')
      .set(authHeader(teacherToken));
    expect(teacherCourses.status).toBe(200);
    expect(teacherCourses.body.some((course: { id: string; roleInCourse?: string }) => course.id === courseRes.body.id && course.roleInCourse === 'TEACHER')).toBe(true);

    const studentCourses = await request(app.getHttpServer())
      .get('/api/courses')
      .set(authHeader(studentToken));
    expect(studentCourses.status).toBe(200);
    expect(studentCourses.body.some((course: { id: string; roleInCourse?: string }) => course.id === courseRes.body.id && course.roleInCourse === 'STUDENT')).toBe(true);

    const courseDetails = await request(app.getHttpServer())
      .get(`/api/courses/${courseRes.body.id}`)
      .set(authHeader(studentToken));
    expect(courseDetails.status).toBe(200);
    expect(courseDetails.body.title).toBe('Smoke Testing Course');
  });
});
