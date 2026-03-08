import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class GradesService {
  constructor(private db: PrismaService) {}
  getMyGrades(sid: string) {
    return this.db.grade.findMany({ where: { submission: { studentId: sid } }, include: { submission: { include: { assignment: { include: { course: { select: { id: true, code: true, title: true } } } } } }, gradedBy: { select: { fullName: true } } }, orderBy: { gradedAt: 'desc' } });
  }
  getCourseGrades(cid: string) {
    return this.db.grade.findMany({ where: { submission: { assignment: { courseId: cid } } }, include: { submission: { include: { student: { select: { id: true, fullName: true, email: true } }, assignment: { select: { id: true, title: true, maxScore: true } } } }, gradedBy: { select: { fullName: true } } }, orderBy: { gradedAt: 'desc' } });
  }
}
