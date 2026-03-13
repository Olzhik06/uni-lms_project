import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto, UpdateAssignmentDto, SubmitDto, GradeDto } from './assignments.dto';
import { Role, CourseRole, SubmissionStatus, NotificationType } from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AssignmentsService {
  constructor(
    private db: PrismaService,
    private activityLog: ActivityLogService,
    private mail: MailService,
  ) {}

  findByCourse(cid: string, page = 1, limit = 20) {
    return this.db.assignment.findMany({
      where: { courseId: cid },
      orderBy: { dueAt: 'asc' },
      include: { _count: { select: { submissions: true } } },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string) {
    const a = await this.db.assignment.findUnique({
      where: { id },
      include: { course: { select: { id: true, title: true, code: true } }, _count: { select: { submissions: true } } },
    });
    if (!a) throw new NotFoundException();
    return a;
  }

  async create(cid: string, dto: CreateAssignmentDto, user: { id: string; role: Role }) {
    if (user.role === Role.TEACHER && !(await this.db.enrollment.findFirst({ where: { userId: user.id, courseId: cid, roleInCourse: CourseRole.TEACHER } })))
      throw new ForbiddenException('Not teacher');

    const assignment = await this.db.assignment.create({
      data: { courseId: cid, title: dto.title, description: dto.description ?? '', dueAt: new Date(dto.dueAt), maxScore: dto.maxScore ?? 100 },
      include: { course: { select: { title: true } } },
    });

    await this.activityLog.log(user.id, 'CREATE', 'Assignment', assignment.id);

    // Notify enrolled students
    const enrollments = await this.db.enrollment.findMany({
      where: { courseId: cid, roleInCourse: CourseRole.STUDENT },
      include: { user: { select: { id: true, email: true } } },
    });

    await Promise.all(
      enrollments.map(async (e) => {
        await this.db.notification.create({
          data: {
            userId: e.userId,
            type: NotificationType.ASSIGNMENT_DUE,
            title: 'New assignment: ' + dto.title,
            body: (assignment.course?.title || '') + ' — due ' + new Date(dto.dueAt).toLocaleDateString(),
            link: '/courses/' + cid + '/assignments',
          },
        });
        await this.mail.sendAssignmentCreated(e.user.email, dto.title, assignment.course?.title || '', new Date(dto.dueAt));
      }),
    );

    return assignment;
  }

  async update(id: string, dto: UpdateAssignmentDto) {
    await this.findOne(id);
    const d: any = { ...dto };
    if (dto.dueAt) d.dueAt = new Date(dto.dueAt);
    return this.db.assignment.update({ where: { id }, data: d });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.assignment.delete({ where: { id } });
    return { deleted: true };
  }

  async submit(aid: string, dto: SubmitDto, sid: string) {
    await this.findOne(aid);
    const ex = await this.db.submission.findUnique({ where: { assignmentId_studentId: { assignmentId: aid, studentId: sid } } });
    const sub = ex
      ? await this.db.submission.update({ where: { id: ex.id }, data: { contentText: dto.contentText, contentUrl: dto.contentUrl, fileUrl: dto.fileUrl, status: SubmissionStatus.SUBMITTED, submittedAt: new Date() } })
      : await this.db.submission.create({ data: { assignmentId: aid, studentId: sid, contentText: dto.contentText, contentUrl: dto.contentUrl, fileUrl: dto.fileUrl, status: SubmissionStatus.SUBMITTED, submittedAt: new Date() } });

    await this.activityLog.log(sid, 'SUBMIT', 'Submission', sub.id);
    return sub;
  }

  getMySub(aid: string, sid: string) {
    return this.db.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: aid, studentId: sid } },
      include: { grade: true },
    });
  }

  allSubs(aid: string) {
    return this.db.submission.findMany({
      where: { assignmentId: aid },
      include: { student: { select: { id: true, fullName: true, email: true } }, grade: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async grade(subId: string, dto: GradeDto, byId: string) {
    const sub = await this.db.submission.findUnique({
      where: { id: subId },
      include: { assignment: { include: { course: true } }, student: { select: { email: true } } },
    });
    if (!sub) throw new NotFoundException();

    const ex = await this.db.grade.findUnique({ where: { submissionId: subId } });
    const grade = ex
      ? await this.db.grade.update({ where: { id: ex.id }, data: { score: dto.score, feedback: dto.feedback, gradedById: byId, gradedAt: new Date() } })
      : await this.db.grade.create({ data: { submissionId: subId, score: dto.score, feedback: dto.feedback, gradedById: byId } });

    await this.activityLog.log(byId, 'GRADE', 'Grade', grade.id);

    await this.db.notification.create({
      data: {
        userId: sub.studentId,
        type: NotificationType.GRADE_PUBLISHED,
        title: 'Grade published',
        body: '"' + sub.assignment.title + '" scored ' + dto.score + '/' + sub.assignment.maxScore,
        link: '/courses/' + sub.assignment.courseId + '/grades',
      },
    });

    await this.mail.sendGradePublished(
      sub.student.email,
      sub.assignment.title,
      dto.score,
      sub.assignment.maxScore,
      dto.feedback,
    );

    return grade;
  }
}
