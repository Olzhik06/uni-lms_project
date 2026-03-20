import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GradesService {
  constructor(private db: PrismaService) {}

  getMyGrades(sid: string) {
    return this.db.grade.findMany({
      where: { submission: { studentId: sid } },
      include: { submission: { include: { assignment: { include: { course: { select: { id: true, code: true, title: true } } } } } }, gradedBy: { select: { fullName: true } } },
      orderBy: { gradedAt: 'desc' },
    });
  }

  getCourseGrades(cid: string) {
    return this.db.grade.findMany({
      where: { submission: { assignment: { courseId: cid } } },
      include: { submission: { include: { student: { select: { id: true, fullName: true, email: true } }, assignment: { select: { id: true, title: true, maxScore: true } } } }, gradedBy: { select: { fullName: true } } },
      orderBy: { gradedAt: 'desc' },
    });
  }

  // Feature 3 — Gradebook: per-assignment averages + course-level stats
  async getCourseStats(courseId: string) {
    const assignments = await this.db.assignment.findMany({
      where: { courseId },
      include: { submissions: { include: { grade: true } } },
      orderBy: { dueAt: 'asc' },
    });

    const perAssignment = assignments.map(a => {
      const scored = a.submissions.filter(s => s.grade).map(s => s.grade!.score);
      const avg = scored.length ? scored.reduce((x, y) => x + y, 0) / scored.length : null;
      return {
        assignmentId: a.id,
        title: a.title,
        maxScore: a.maxScore,
        submissionsCount: a.submissions.length,
        gradedCount: scored.length,
        averageScore: avg !== null ? Math.round(avg * 10) / 10 : null,
        minScore: scored.length ? Math.min(...scored) : null,
        maxScore2: scored.length ? Math.max(...scored) : null,
      };
    });

    const allAvgs = perAssignment.filter(s => s.averageScore !== null).map(s => s.averageScore as number);
    const courseAverage = allAvgs.length ? Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10 : null;

    return { assignments: perAssignment, courseAverage };
  }

  // Feature 3 — Gradebook: student grade summary grouped by course
  async getStudentSummary(userId: string) {
    const grades = await this.db.grade.findMany({
      where: { submission: { studentId: userId } },
      include: { submission: { include: { assignment: { include: { course: { select: { id: true, code: true, title: true } } } } } } },
    });

    const byCourse = grades.reduce<Record<string, { course: any; earned: number; possible: number; count: number }>>((acc, g) => {
      const cid = g.submission.assignment.course?.id ?? 'unknown';
      if (!acc[cid]) acc[cid] = { course: g.submission.assignment.course, earned: 0, possible: 0, count: 0 };
      acc[cid].earned += g.score;
      acc[cid].possible += g.submission.assignment.maxScore;
      acc[cid].count++;
      return acc;
    }, {});

    return Object.values(byCourse).map(c => ({
      course: c.course,
      gradesCount: c.count,
      totalEarned: c.earned,
      totalPossible: c.possible,
      percentage: c.possible > 0 ? Math.round((c.earned / c.possible) * 1000) / 10 : 0,
    }));
  }
}
