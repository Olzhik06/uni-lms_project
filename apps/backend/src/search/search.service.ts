import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private db: PrismaService) {}

  async search(q: string, userId: string, userRole: string) {
    if (!q || q.trim().length < 2) return { courses: [], materials: [], assignments: [], announcements: [], users: [] };
    const term = q.trim();

    const courseFilter = userRole === 'ADMIN' ? {} : { enrollments: { some: { userId } } };
    const annFilter = userRole === 'ADMIN'
      ? {}
      : { OR: [{ courseId: null }, { course: { enrollments: { some: { userId } } } }] };

    const [courses, materials, assignments, announcements, users] = await Promise.all([
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
      // Feature 6 — announcements in search
      this.db.announcement.findMany({
        where: {
          AND: [
            annFilter as any,
            { OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { body: { contains: term, mode: 'insensitive' } },
            ]},
          ],
        },
        select: { id: true, title: true, body: true, courseId: true, createdAt: true, course: { select: { code: true, title: true } } },
        take: 8,
      }),
      // Feature 6 — users in search (admin only)
      userRole === 'ADMIN'
        ? this.db.user.findMany({
            where: {
              OR: [
                { fullName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
              ],
            },
            select: { id: true, fullName: true, email: true, role: true },
            take: 8,
          })
        : Promise.resolve([]),
    ]);

    return { courses, materials, assignments, announcements, users };
  }
}
