import { PrismaClient, Role, CourseRole, ScheduleType, SubmissionStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  getAnnouncementNotificationContent,
  getAssignmentNotificationContent,
  getGradeNotificationContent,
} from '../src/common/user-content';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@uni.kz' } });
  if (existing) { console.log('Seed data exists, skipping.'); return; }

  console.log('Seeding database...');
  const h = (pw: string) => bcrypt.hashSync(pw, 10);

  const group = await prisma.group.create({ data: { name: 'SE-2302', degree: 'Bachelor', year: 2 } });

  const admin = await prisma.user.create({ data: { email: 'admin@uni.kz', passwordHash: h('Admin123!'), fullName: 'System Admin', role: Role.ADMIN, preferredLang: 'en' } });
  const t1 = await prisma.user.create({ data: { email: 'teacher1@uni.kz', passwordHash: h('Teacher123!'), fullName: 'Dr. Aisha Nurlanovna', role: Role.TEACHER, preferredLang: 'ru' } });
  const t2 = await prisma.user.create({ data: { email: 'teacher2@uni.kz', passwordHash: h('Teacher123!'), fullName: 'Prof. Bolat Serikovich', role: Role.TEACHER, preferredLang: 'kz' } });

  const sn = ['Aliya Kanatova','Daulet Akhmetov','Madina Zhanseitova','Nursultan Bekmuratov','Zarina Tulegenova'];
  const students = await Promise.all(sn.map((fn, i) =>
    prisma.user.create({
      data: {
        email: `student${i+1}@uni.kz`,
        passwordHash: h('Student123!'),
        fullName: fn,
        role: Role.STUDENT,
        groupId: group.id,
        preferredLang: ['en', 'ru', 'kz', 'ru', 'en'][i],
      },
    })
  ));

  const c1 = await prisma.course.create({ data: { code: 'SE-ARCH-301', title: 'Software Architecture', description: 'Design patterns, architectural styles, system design.', teacherId: t1.id, semester: '2025-Spring' } });
  const c2 = await prisma.course.create({ data: { code: 'CS-DB-201', title: 'Database Systems', description: 'SQL, normalization, indexing, transactions.', teacherId: t1.id, semester: '2025-Spring' } });
  const c3 = await prisma.course.create({ data: { code: 'CS-ML-401', title: 'Machine Learning', description: 'Supervised/unsupervised learning, neural networks.', teacherId: t2.id, semester: '2025-Spring' } });

  await prisma.enrollment.createMany({ data: [
    { userId: t1.id, courseId: c1.id, roleInCourse: CourseRole.TEACHER },
    { userId: t1.id, courseId: c2.id, roleInCourse: CourseRole.TEACHER },
    { userId: t2.id, courseId: c3.id, roleInCourse: CourseRole.TEACHER },
    ...students.flatMap(s => [c1, c2, c3].map(c => ({ userId: s.id, courseId: c.id, roleInCourse: CourseRole.STUDENT as CourseRole })))
  ] });

  const now = new Date();
  const wd = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - (wd === 0 ? 6 : wd - 1)); mon.setHours(0,0,0,0);
  const slot = (d: number, sh: number, eh: number) => {
    const s = new Date(mon); s.setDate(mon.getDate() + d); s.setHours(sh,0,0,0);
    const e = new Date(s); e.setHours(eh,0,0,0);
    return { startsAt: s, endsAt: e };
  };
  const dfn = (d: number) => { const r = new Date(now); r.setDate(r.getDate() + d); r.setHours(23,59,0,0); return r; };

  await prisma.scheduleItem.createMany({ data: [
    { courseId: c1.id, groupId: group.id, ...slot(0,9,10), room: 'A-301', type: ScheduleType.LECTURE },
    { courseId: c1.id, groupId: group.id, ...slot(2,9,11), room: 'A-301', type: ScheduleType.PRACTICE },
    { courseId: c2.id, groupId: group.id, ...slot(0,11,13), room: 'B-205', type: ScheduleType.LECTURE },
    { courseId: c2.id, groupId: group.id, ...slot(3,14,16), room: 'Lab-102', type: ScheduleType.LAB },
    { courseId: c3.id, groupId: group.id, ...slot(1,10,12), room: 'C-410', type: ScheduleType.LECTURE },
    { courseId: c3.id, groupId: group.id, ...slot(4,10,12), room: 'Lab-103', type: ScheduleType.LAB },
    { courseId: c1.id, groupId: group.id, ...slot(7,9,10), room: 'A-301', type: ScheduleType.LECTURE },
    { courseId: c2.id, groupId: group.id, ...slot(7,11,13), room: 'B-205', type: ScheduleType.LECTURE },
  ] });

  const a1 = await prisma.assignment.create({ data: { courseId: c1.id, title: 'Design Patterns Essay', description: 'Compare Observer and Strategy patterns.', dueAt: dfn(3), maxScore: 100 } });
  await prisma.assignment.create({ data: { courseId: c1.id, title: 'Microservices Diagram', description: 'E-commerce microservices architecture.', dueAt: dfn(10), maxScore: 50 } });
  await prisma.assignment.create({ data: { courseId: c2.id, title: 'SQL Optimization', description: 'Optimize provided queries.', dueAt: dfn(5), maxScore: 100 } });
  await prisma.assignment.create({ data: { courseId: c3.id, title: 'Linear Regression', description: 'Implement from scratch in Python.', dueAt: dfn(7), maxScore: 100 } });
  const a5 = await prisma.assignment.create({ data: { courseId: c2.id, title: 'ER Diagram Design', description: 'Library management ER diagram.', dueAt: dfn(-2), maxScore: 80 } });

  const sub1 = await prisma.submission.create({ data: { assignmentId: a5.id, studentId: students[0].id, contentText: 'ER diagram: Book, Author, Member, Loan, Category.', contentUrl: 'https://example.com/er.png', submittedAt: dfn(-3), status: SubmissionStatus.SUBMITTED } });
  const sub2 = await prisma.submission.create({ data: { assignmentId: a5.id, studentId: students[1].id, contentText: '5 entities with junction tables.', submittedAt: dfn(-3), status: SubmissionStatus.SUBMITTED } });
  await prisma.submission.create({ data: { assignmentId: a1.id, studentId: students[0].id, contentText: 'Draft: Observer pattern allows...', status: SubmissionStatus.DRAFT } });

  await prisma.grade.create({ data: { submissionId: sub1.id, gradedById: t1.id, score: 72, feedback: 'Good entities. Add cardinality notations.' } });
  await prisma.grade.create({ data: { submissionId: sub2.id, gradedById: t1.id, score: 78, feedback: 'Well-structured. Nice Reservation entity.' } });

  await prisma.announcement.createMany({ data: [
    { authorId: admin.id, courseId: null, title: 'Welcome to Spring 2025', body: 'Check enrollments and schedules.' },
    { authorId: admin.id, courseId: null, title: 'Campus Wi-Fi Maintenance', body: 'Saturday 2-6 AM.' },
    { authorId: t1.id, courseId: c1.id, title: 'Office Hours Change', body: 'Wednesday 2-4 PM, room A-312.' },
    { authorId: t1.id, courseId: c2.id, title: 'Midterm Info', body: 'Week 8, Lab-102.' },
    { authorId: t2.id, courseId: c3.id, title: 'Guest Lecture', body: 'Dr. Kim, Friday 2 PM, C-410.' },
  ] });

  const welcomeNotifications = students.map(s => ({
    userId: s.id,
    type: NotificationType.ANNOUNCEMENT as NotificationType,
    ...getAnnouncementNotificationContent('', 'Welcome to Spring 2025', s.preferredLang),
    link: '/dashboard',
    isRead: false,
  }));
  const gradeOne = getGradeNotificationContent('ER Diagram Design', 72, 80, students[0].preferredLang);
  const gradeTwo = getGradeNotificationContent('ER Diagram Design', 78, 80, students[1].preferredLang);
  const assignmentReminders = students.slice(0, 3).map(s => ({
    userId: s.id,
    type: NotificationType.ASSIGNMENT_DUE as NotificationType,
    ...getAssignmentNotificationContent('Design Patterns Essay', c1.title, dfn(3), s.preferredLang),
    link: `/courses/${c1.id}/assignments`,
    isRead: false,
  }));

  await prisma.notification.createMany({ data: [
    ...welcomeNotifications,
    { userId: students[0].id, type: NotificationType.GRADE_PUBLISHED, ...gradeOne, link: `/courses/${c2.id}/grades`, isRead: false },
    { userId: students[1].id, type: NotificationType.GRADE_PUBLISHED, ...gradeTwo, link: `/courses/${c2.id}/grades`, isRead: true },
    ...assignmentReminders,
  ] });

  console.log('Seed complete.');
  console.log('  admin@uni.kz / Admin123!');
  console.log('  teacher1@uni.kz / Teacher123!');
  console.log('  student[1-5]@uni.kz / Student123!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
