import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto } from './attendance.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private db: PrismaService) {}

  async findByCourse(courseId: string, user: { id: string; role: Role }) {
    const where: any = { courseId };
    if (user.role === Role.STUDENT) where.studentId = user.id;
    return this.db.attendance.findMany({
      where,
      include: { student: { select: { id: true, fullName: true, email: true } } },
      orderBy: [{ date: 'desc' }, { student: { fullName: 'asc' } }],
    });
  }

  async mark(courseId: string, dto: MarkAttendanceDto) {
    const date = new Date(dto.date);
    date.setUTCHours(0, 0, 0, 0);
    return this.db.attendance.upsert({
      where: { courseId_studentId_date: { courseId, studentId: dto.studentId, date } },
      create: { courseId, studentId: dto.studentId, date, status: dto.status },
      update: { status: dto.status },
    });
  }

  // Feature 2 — Attendance stats: summary per student for a course (teacher view)
  async getCourseStudentStats(courseId: string) {
    const records = await this.db.attendance.findMany({
      where: { courseId },
      include: { student: { select: { id: true, fullName: true, email: true } } },
    });

    const byStudent = records.reduce<Record<string, any>>((acc, r) => {
      const sid = r.studentId;
      if (!acc[sid]) acc[sid] = { student: r.student, total: 0, present: 0, late: 0, absent: 0 };
      acc[sid].total++;
      if (r.status === 'PRESENT') acc[sid].present++;
      else if (r.status === 'LATE') acc[sid].late++;
      else acc[sid].absent++;
      return acc;
    }, {});

    return Object.values(byStudent).map((s: any) => ({
      ...s,
      presentRate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));
  }

  // Feature 2 — Attendance stats: personal summary for a student
  async getMyStats(courseId: string, studentId: string) {
    const records = await this.db.attendance.findMany({ where: { courseId, studentId } });
    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    return {
      total, present, late, absent,
      presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
      lateRate:    total > 0 ? Math.round((late    / total) * 100) : 0,
      absentRate:  total > 0 ? Math.round((absent  / total) * 100) : 0,
    };
  }
}
