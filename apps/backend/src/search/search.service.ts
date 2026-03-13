import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private db: PrismaService) {}

  async search(q: string, userId: string, userRole: string) {
    if (!q || q.trim().length < 2) return { courses: [], materials: [], assignments: [] };
    const term = q.trim();

    const courseFilter =
      userRole === 'ADMIN'
        ? {}
        : { enrollments: { some: { userId } } };

    const [courses, materials, assignments] = await Promise.all([
      this.db.course.findMany({
        where: {
          ...courseFilter,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { code: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, code: true, title: true, description: true },
        take: 10,
      }),
      this.db.courseMaterial.findMany({
        where: {
          course: courseFilter,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { content: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, courseId: true, title: true, type: true, url: true, course: { select: { code: true, title: true } } },
        take: 10,
      }),
      this.db.assignment.findMany({
        where: {
          course: courseFilter,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, courseId: true, title: true, description: true, dueAt: true, course: { select: { code: true, title: true } } },
        take: 10,
      }),
    ]);

    return { courses, materials, assignments };
  }
}
