import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private db: PrismaService) {}

  async getStats() {
    const [
      usersCount, coursesCount, submissionsCount, assignmentsCount,
      enrollmentsCount, gradesCount, studentCount, teacherCount,
      gradesAgg, attendanceTotal, attendancePresent,
    ] = await Promise.all([
      this.db.user.count(),
      this.db.course.count(),
      this.db.submission.count(),
      this.db.assignment.count(),
      this.db.enrollment.count(),
      this.db.grade.count(),
      this.db.user.count({ where: { role: 'STUDENT' } }),
      this.db.user.count({ where: { role: 'TEACHER' } }),
      // Feature 8 — average grade across all graded submissions
      this.db.grade.aggregate({ _avg: { score: true } }),
      // Feature 8 — platform-wide attendance rate
      this.db.attendance.count(),
      this.db.attendance.count({ where: { status: 'PRESENT' } }),
    ]);

    return {
      users: { total: usersCount, students: studentCount, teachers: teacherCount },
      courses: coursesCount,
      assignments: assignmentsCount,
      submissions: submissionsCount,
      enrollments: enrollmentsCount,
      grades: gradesCount,
      // New analytics metrics
      avgGrade: gradesAgg._avg.score !== null ? Math.round((gradesAgg._avg.score as number) * 10) / 10 : null,
      attendanceRate: attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null,
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
      where: { studentId: userId, status: 'SUBMITTED', assignment: { courseId } },
    });

    return {
      courseId,
      progress: Math.round((completed / totalAssignments) * 100),
      completedAssignments: completed,
      totalAssignments,
    };
  }
}
