import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto, UpdateAssignmentDto, SubmitDto, GradeDto } from './assignments.dto';
import { Role, CourseRole, SubmissionStatus, NotificationType } from '@prisma/client';

@Injectable()
export class AssignmentsService {
  constructor(private db: PrismaService) {}

  findByCourse(cid: string) { return this.db.assignment.findMany({ where: { courseId: cid }, orderBy: { dueAt: 'asc' }, include: { _count: { select: { submissions: true } } } }); }

  async findOne(id: string) { const a = await this.db.assignment.findUnique({ where: { id }, include: { course: { select: { id: true, title: true, code: true } }, _count: { select: { submissions: true } } } }); if (!a) throw new NotFoundException(); return a; }

  async create(cid: string, dto: CreateAssignmentDto, user: { id: string; role: Role }) {
    if (user.role === Role.TEACHER && !(await this.db.enrollment.findFirst({ where: { userId: user.id, courseId: cid, roleInCourse: CourseRole.TEACHER } })))
      throw new ForbiddenException('Not teacher');
    return this.db.assignment.create({ data: { courseId: cid, title: dto.title, description: dto.description ?? '', dueAt: new Date(dto.dueAt), maxScore: dto.maxScore ?? 100 } });
  }

  async update(id: string, dto: UpdateAssignmentDto) { await this.findOne(id); const d: any = { ...dto }; if (dto.dueAt) d.dueAt = new Date(dto.dueAt); return this.db.assignment.update({ where: { id }, data: d }); }
  async remove(id: string) { await this.findOne(id); await this.db.assignment.delete({ where: { id } }); return { deleted: true }; }

  async submit(aid: string, dto: SubmitDto, sid: string) {
    await this.findOne(aid);
    const ex = await this.db.submission.findUnique({ where: { assignmentId_studentId: { assignmentId: aid, studentId: sid } } });
    if (ex) return this.db.submission.update({ where: { id: ex.id }, data: { contentText: dto.contentText, contentUrl: dto.contentUrl, status: SubmissionStatus.SUBMITTED, submittedAt: new Date() } });
    return this.db.submission.create({ data: { assignmentId: aid, studentId: sid, contentText: dto.contentText, contentUrl: dto.contentUrl, status: SubmissionStatus.SUBMITTED, submittedAt: new Date() } });
  }

  getMySub(aid: string, sid: string) { return this.db.submission.findUnique({ where: { assignmentId_studentId: { assignmentId: aid, studentId: sid } }, include: { grade: true } }); }
  allSubs(aid: string) { return this.db.submission.findMany({ where: { assignmentId: aid }, include: { student: { select: { id: true, fullName: true, email: true } }, grade: true }, orderBy: { submittedAt: 'desc' } }); }

  async grade(subId: string, dto: GradeDto, byId: string) {
    const sub = await this.db.submission.findUnique({ where: { id: subId }, include: { assignment: { include: { course: true } } } });
    if (!sub) throw new NotFoundException();
    const ex = await this.db.grade.findUnique({ where: { submissionId: subId } });
    const grade = ex
      ? await this.db.grade.update({ where: { id: ex.id }, data: { score: dto.score, feedback: dto.feedback, gradedById: byId, gradedAt: new Date() } })
      : await this.db.grade.create({ data: { submissionId: subId, score: dto.score, feedback: dto.feedback, gradedById: byId } });
    await this.db.notification.create({ data: { userId: sub.studentId, type: NotificationType.GRADE_PUBLISHED, title: 'Grade published', body: '"' + sub.assignment.title + '" scored ' + dto.score + '/' + sub.assignment.maxScore, link: '/courses/' + sub.assignment.courseId + '/grades' } });
    return grade;
  }
}
