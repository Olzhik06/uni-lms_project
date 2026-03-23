import { INestApplication } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import request from 'supertest';
import { authHeader, createAdminToken, createTestApp, loginUser, uniqueValue } from '../test-utils';

describe('Assignment Submission and Grading (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let teacherId: string;
  let studentId: string;
  let courseId: string;

  const created = {
    users: [] as string[],
    courses: [] as string[],
  };

  beforeAll(async () => {
    app = await createTestApp();
    const admin = await createAdminToken(app);
    adminToken = admin.token;
    created.users.push(admin.userId);

    const suffix = uniqueValue('asgn');
    const teacherEmail = `${suffix}-teacher@example.com`;
    const studentEmail = `${suffix}-student@example.com`;

    const teacherRes = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set(authHeader(adminToken))
      .send({
        email: teacherEmail,
        password: 'Teacher123!',
        fullName: 'Assignment Teacher',
        role: Role.TEACHER,
      });
    teacherId = teacherRes.body.id;
    created.users.push(teacherId);

    const studentRes = await request(app.getHttpServer())
      .post('/api/admin/users')
      .set(authHeader(adminToken))
      .send({
        email: studentEmail,
        password: 'Student123!',
        fullName: 'Assignment Student',
        role: Role.STUDENT,
      });
    studentId = studentRes.body.id;
    created.users.push(studentId);

    const courseRes = await request(app.getHttpServer())
      .post('/api/admin/courses')
      .set(authHeader(adminToken))
      .send({
        code: `ASGN-${suffix}`.toUpperCase(),
        title: 'Assignment Flow Course',
        description: 'Course used for assignment smoke tests',
        semester: '2026-Spring',
        teacherId,
      });
    courseId = courseRes.body.id;
    created.courses.push(courseId);

    await request(app.getHttpServer())
      .post('/api/admin/enrollments')
      .set(authHeader(adminToken))
      .send({ userId: teacherId, courseId, roleInCourse: 'TEACHER' });

    await request(app.getHttpServer())
      .post('/api/admin/enrollments')
      .set(authHeader(adminToken))
      .send({ userId: studentId, courseId, roleInCourse: 'STUDENT' });

    teacherToken = (await loginUser(app, teacherEmail, 'Teacher123!')).body.accessToken;
    studentToken = (await loginUser(app, studentEmail, 'Student123!')).body.accessToken;
  });

  afterAll(async () => {
    if (created.courses.length) {
      await prisma.course.deleteMany({ where: { id: { in: created.courses } } });
    }
    if (created.users.length) {
      await prisma.user.deleteMany({ where: { id: { in: created.users } } });
    }
    await prisma.$disconnect();
    if (app) {
      await app.close();
    }
  });

  it('covers teacher assignment creation, student submission, and teacher grading', async () => {
    const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const createAssignment = await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/assignments`)
      .set(authHeader(teacherToken))
      .send({
        title: 'Smoke Assignment',
        description: 'Submit a short structured answer',
        dueAt,
        maxScore: 100,
      });
    expect(createAssignment.status).toBe(201);

    const assignmentId = createAssignment.body.id as string;

    const studentAssignments = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/assignments?page=1&limit=10`)
      .set(authHeader(studentToken));
    expect(studentAssignments.status).toBe(200);
    expect(studentAssignments.body.items.some((assignment: { id: string }) => assignment.id === assignmentId)).toBe(true);

    const submitAssignment = await request(app.getHttpServer())
      .post(`/api/assignments/${assignmentId}/submit`)
      .set(authHeader(studentToken))
      .send({
        contentText: 'Smoke submission content for automated verification.',
      });
    expect(submitAssignment.status).toBe(201);

    const submissionId = submitAssignment.body.id as string;

    const teacherSubmissions = await request(app.getHttpServer())
      .get(`/api/assignments/${assignmentId}/submissions`)
      .set(authHeader(teacherToken));
    expect(teacherSubmissions.status).toBe(200);
    expect(teacherSubmissions.body.some((submission: { id: string; studentId: string }) => submission.id === submissionId && submission.studentId === studentId)).toBe(true);

    const gradeSubmission = await request(app.getHttpServer())
      .post(`/api/submissions/${submissionId}/grade`)
      .set(authHeader(teacherToken))
      .send({ score: 91, feedback: 'Strong structure and clear reasoning.' });
    expect(gradeSubmission.status).toBe(201);

    const studentGrades = await request(app.getHttpServer())
      .get('/api/me/grades')
      .set(authHeader(studentToken));
    expect(studentGrades.status).toBe(200);
    expect(studentGrades.body.some((grade: { score: number; submissionId: string }) => grade.score === 91 && grade.submissionId === submissionId)).toBe(true);

    const studentNotifications = await request(app.getHttpServer())
      .get('/api/me/notifications')
      .set(authHeader(studentToken));
    expect(studentNotifications.status).toBe(200);
    expect(studentNotifications.body.some((notification: { type: string; link?: string }) => notification.type === 'GRADE_PUBLISHED' && notification.link?.includes(`/courses/${courseId}/grades`))).toBe(true);
  });
});
