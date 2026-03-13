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
}
