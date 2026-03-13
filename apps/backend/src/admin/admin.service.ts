import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private db: PrismaService) {}

  async getStats() {
    const [usersCount, coursesCount, submissionsCount, assignmentsCount,
      enrollmentsCount, gradesCount, studentCount, teacherCount] = await Promise.all([
      this.db.user.count(),
      this.db.course.count(),
      this.db.submission.count(),
      this.db.assignment.count(),
      this.db.enrollment.count(),
      this.db.grade.count(),
      this.db.user.count({ where: { role: 'STUDENT' } }),
      this.db.user.count({ where: { role: 'TEACHER' } }),
    ]);

    return {
      users: { total: usersCount, students: studentCount, teachers: teacherCount },
      courses: coursesCount,
      assignments: assignmentsCount,
      submissions: submissionsCount,
      enrollments: enrollmentsCount,
      grades: gradesCount,
    };
  }

  async getCourseProgress(courseId: string, userId: string, userRole: string) {
    const course = await this.db.course.findUnique({
      where: { id: courseId },
      include: { assignments: { select: { id: true } } },
    });
    if (!course) return null;

    const totalAssignments = course.assignments.length;
    if (totalAssignments === 0) return { courseId, progress: 0, completedAssignments: 0, totalAssignments: 0 };

    const completed = await this.db.submission.count({
      where: {
        studentId: userId,
        status: 'SUBMITTED',
        assignment: { courseId },
      },
    });

    return {
      courseId,
      progress: Math.round((completed / totalAssignments) * 100),
      completedAssignments: completed,
      totalAssignments,
    };
  }
}
