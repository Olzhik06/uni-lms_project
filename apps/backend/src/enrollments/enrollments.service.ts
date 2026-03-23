import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CourseRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getPagination, toPaginatedResult } from '../common/pagination';
import { CreateEnrollmentDto } from './enrollments.dto';
@Injectable()
export class EnrollmentsService {
  constructor(private db: PrismaService) {}
  async findAll(
    paginationInput?: { page?: number; limit?: number },
    filters?: { search?: string; roleInCourse?: CourseRole; courseId?: string; userId?: string },
  ) {
    const pagination = getPagination(paginationInput?.page, paginationInput?.limit);
    const search = filters?.search?.trim();
    const where = {
      ...(filters?.roleInCourse ? { roleInCourse: filters.roleInCourse } : {}),
      ...(filters?.courseId ? { courseId: filters.courseId } : {}),
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(search
        ? {
            OR: [
              { user: { fullName: { contains: search, mode: 'insensitive' as const } } },
              { user: { email: { contains: search, mode: 'insensitive' as const } } },
              { course: { title: { contains: search, mode: 'insensitive' as const } } },
              { course: { code: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };
    const baseQuery = {
      where,
      include: {
        user: { select: { id: true, email: true, fullName: true, role: true } },
        course: { select: { id: true, code: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    } as const;

    if (!pagination.usePagination) {
      return this.db.enrollment.findMany(baseQuery);
    }

    const [items, total] = await this.db.$transaction([
      this.db.enrollment.findMany({
        ...baseQuery,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.db.enrollment.count({ where }),
    ]);

    return toPaginatedResult(items, pagination.page, pagination.limit, total);
  }
  async create(dto: CreateEnrollmentDto) {
    try { return await this.db.enrollment.create({ data: dto, include: { user: { select: { id: true, email: true, fullName: true } }, course: { select: { id: true, code: true, title: true } } } }); }
    catch (e: any) { if (e.code === 'P2002') throw new ConflictException('errors.enrollment.alreadyEnrolled'); throw e; }
  }
  async remove(id: string) { if (!(await this.db.enrollment.findUnique({ where: { id } }))) throw new NotFoundException(); await this.db.enrollment.delete({ where: { id } }); return { deleted: true }; }
}
