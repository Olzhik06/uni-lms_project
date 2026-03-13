import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './courses.dto';
import { Role } from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class CoursesService {
  constructor(
    private db: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async findAll(user: { id: string; role: Role }, page = 1, limit = 20) {
    if (user.role === Role.ADMIN)
      return this.db.course.findMany({
        include: { teacher: { select: { id: true, fullName: true } }, _count: { select: { enrollments: true, assignments: true } } },
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    const enrs = await this.db.enrollment.findMany({
      where: { userId: user.id },
      include: { course: { include: { teacher: { select: { id: true, fullName: true } }, _count: { select: { enrollments: true, assignments: true } } } } },
      skip: (page - 1) * limit,
      take: limit,
    });
    return enrs.map(e => ({ ...e.course, roleInCourse: e.roleInCourse }));
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const c = await this.db.course.findUnique({ where: { id }, include: { teacher: { select: { id: true, fullName: true, email: true } }, _count: { select: { enrollments: true, assignments: true } } } });
    if (!c) throw new NotFoundException();
    if (user.role !== Role.ADMIN) {
      const e = await this.db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: id } } });
      if (!e) throw new ForbiddenException('Not enrolled');
    }
    return c;
  }

  getParticipants(courseId: string) {
    return this.db.enrollment.findMany({ where: { courseId }, include: { user: { select: { id: true, email: true, fullName: true, role: true, group: { select: { name: true } } } } }, orderBy: { createdAt: 'asc' } });
  }

  async create(dto: CreateCourseDto, userId?: string) {
    const course = await this.db.course.create({
      data: { code: dto.code, title: dto.title, description: dto.description ?? '', teacherId: dto.teacherId || null, semester: dto.semester ?? '2025-Spring' },
      include: { teacher: { select: { id: true, fullName: true } } },
    });
    if (userId) await this.activityLog.log(userId, 'CREATE', 'Course', course.id);
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    if (!(await this.db.course.findUnique({ where: { id } }))) throw new NotFoundException();
    return this.db.course.update({ where: { id }, data: dto, include: { teacher: { select: { id: true, fullName: true } } } });
  }

  async remove(id: string) {
    if (!(await this.db.course.findUnique({ where: { id } }))) throw new NotFoundException();
    await this.db.course.delete({ where: { id } }); return { deleted: true };
  }
}
