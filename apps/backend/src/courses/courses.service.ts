import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './courses.dto';
import { Role } from '@prisma/client';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { getPagination, toPaginatedResult } from '../common/pagination';

@Injectable()
export class CoursesService {
  constructor(
    private db: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async findAll(
    user: { id: string; role: Role },
    paginationInput?: { page?: number; limit?: number },
    filters?: { search?: string; teacherId?: string; semester?: string },
  ) {
    const pagination = getPagination(paginationInput?.page, paginationInput?.limit);
    const search = filters?.search?.trim();
    const courseWhere = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { code: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(filters?.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters?.semester ? { semester: filters.semester } : {}),
    };

    if (user.role === Role.ADMIN) {
      const baseQuery = {
        where: courseWhere,
        include: { teacher: { select: { id: true, fullName: true } }, _count: { select: { enrollments: true, assignments: true } } },
        orderBy: { title: 'asc' },
      } as const;

      if (!pagination.usePagination) {
        return this.db.course.findMany(baseQuery);
      }

      const [items, total] = await this.db.$transaction([
        this.db.course.findMany({
          ...baseQuery,
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
        }),
        this.db.course.count({ where: courseWhere }),
      ]);

      return toPaginatedResult(items, pagination.page, pagination.limit, total);
    }

    const where = { userId: user.id, course: courseWhere };
    const baseQuery = {
      where,
      orderBy: { course: { title: 'asc' } },
      include: { course: { include: { teacher: { select: { id: true, fullName: true } }, _count: { select: { enrollments: true, assignments: true } } } } },
    } as const;

    if (!pagination.usePagination) {
      const enrollments = await this.db.enrollment.findMany(baseQuery);
      return enrollments.map(e => ({ ...e.course, roleInCourse: e.roleInCourse }));
    }

    const [enrollments, total] = await this.db.$transaction([
      this.db.enrollment.findMany({
        ...baseQuery,
        orderBy: { course: { title: 'asc' } },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.db.enrollment.count({ where }),
    ]);

    const items = enrollments.map(e => ({ ...e.course, roleInCourse: e.roleInCourse }));
    return toPaginatedResult(items, pagination.page, pagination.limit, total);
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const c = await this.db.course.findUnique({ where: { id }, include: { teacher: { select: { id: true, fullName: true, email: true } }, _count: { select: { enrollments: true, assignments: true } } } });
    if (!c) throw new NotFoundException();
    if (user.role !== Role.ADMIN) {
      const e = await this.db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: id } } });
      if (!e) throw new ForbiddenException('errors.course.notEnrolled');
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
