import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GradesService {
  constructor(private db: PrismaService) {}

  getMyGrades(sid: string) {
    return this.db.grade.findMany({
      where: { submission: { studentId: sid } },
      include: { submission: { include: { assignment: { include: { course: { select: { id: true, code: true, title: true } }, category: { select: { id: true, name: true, weight: true, color: true } } } } } }, gradedBy: { select: { fullName: true } } },
      orderBy: { gradedAt: 'desc' },
    });
  }

  getCourseGrades(cid: string) {
    return this.db.grade.findMany({
      where: { submission: { assignment: { courseId: cid } } },
      include: { submission: { include: { student: { select: { id: true, fullName: true, email: true } }, assignment: { select: { id: true, title: true, maxScore: true, categoryId: true } } } }, gradedBy: { select: { fullName: true } } },
      orderBy: { gradedAt: 'desc' },
    });
  }

  // ── Grade Categories ──────────────────────────────────────────────────────

  async getCategories(courseId: string) {
    return this.db.gradeCategory.findMany({
      where: { courseId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { assignments: true, quizzes: true } },
      },
    });
  }

  async createCategory(courseId: string, data: { name: string; weight: number; color?: string }) {
    return this.db.gradeCategory.create({
      data: { courseId, name: data.name, weight: data.weight, color: data.color ?? '#6366f1' },
    });
  }

  async updateCategory(id: string, data: { name?: string; weight?: number; color?: string }) {
    const cat = await this.db.gradeCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.db.gradeCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    const cat = await this.db.gradeCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.db.gradeCategory.delete({ where: { id } });
    return { ok: true };
  }

  async assignCategory(assignmentId: string, categoryId: string | null) {
    return this.db.assignment.update({ where: { id: assignmentId }, data: { categoryId } });
  }

  async assignQuizCategory(quizId: string, categoryId: string | null) {
    return this.db.quiz.update({ where: { id: quizId }, data: { categoryId } });
  }

  // ── Weighted gradebook ────────────────────────────────────────────────────

  async getWeightedGradebook(courseId: string) {
    const [categories, assignments, quizAttempts, enrollments] = await Promise.all([
      this.db.gradeCategory.findMany({ where: { courseId }, orderBy: { name: 'asc' } }),
      this.db.assignment.findMany({
        where: { courseId },
        include: { submissions: { include: { grade: true, student: { select: { id: true, fullName: true, email: true } } } } },
        orderBy: { dueAt: 'asc' },
      }),
      this.db.quizAttempt.findMany({
        where: { quiz: { courseId }, submittedAt: { not: null } },
        include: { quiz: { select: { id: true, title: true, categoryId: true } }, student: { select: { id: true, fullName: true, email: true } } },
        orderBy: { submittedAt: 'desc' },
      }),
      this.db.enrollment.findMany({
        where: { courseId, roleInCourse: 'STUDENT' },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      }),
    ]);

    const students = enrollments.map(e => e.user);
    const totalWeight = categories.reduce((s, c) => s + c.weight, 0);

    // Build per-student weighted grade
    const studentGrades = students.map(student => {
      // Group assignment grades by category
      const catScores: Record<string, { earned: number; possible: number; items: number }> = {};

      for (const a of assignments) {
        const catId = a.categoryId ?? 'uncategorized';
        const sub = a.submissions.find(s => s.studentId === student.id);
        if (sub?.grade) {
          if (!catScores[catId]) catScores[catId] = { earned: 0, possible: 0, items: 0 };
          catScores[catId].earned += sub.grade.score;
          catScores[catId].possible += a.maxScore;
          catScores[catId].items++;
        }
      }

      // Group quiz best-attempt scores by category
      const quizzesByCat: Record<string, { quizId: string; score: number; maxScore: number }[]> = {};
      const seenQuiz = new Set<string>();
      for (const attempt of quizAttempts) {
        if (attempt.studentId !== student.id) continue;
        const qid = attempt.quizId;
        const catId = attempt.quiz?.categoryId ?? 'uncategorized';
        if (!quizzesByCat[catId]) quizzesByCat[catId] = [];
        // keep best attempt per quiz
        if (!seenQuiz.has(qid)) {
          seenQuiz.add(qid);
          quizzesByCat[catId].push({ quizId: qid, score: attempt.score ?? 0, maxScore: attempt.maxScore ?? 100 });
        }
      }

      // Merge quiz scores into catScores
      for (const [catId, quizList] of Object.entries(quizzesByCat)) {
        if (!catScores[catId]) catScores[catId] = { earned: 0, possible: 0, items: 0 };
        for (const q of quizList) {
          catScores[catId].earned += q.score;
          catScores[catId].possible += q.maxScore;
          catScores[catId].items++;
        }
      }

      // Compute weighted final grade
      let weightedSum = 0;
      let appliedWeight = 0;
      const categoryBreakdown = categories.map(cat => {
        const cs = catScores[cat.id];
        const pct = cs && cs.possible > 0 ? (cs.earned / cs.possible) * 100 : null;
        if (pct !== null) {
          weightedSum += pct * cat.weight;
          appliedWeight += cat.weight;
        }
        return {
          categoryId: cat.id,
          name: cat.name,
          weight: cat.weight,
          color: cat.color,
          earned: cs?.earned ?? null,
          possible: cs?.possible ?? null,
          percentage: pct !== null ? Math.round(pct * 10) / 10 : null,
          items: cs?.items ?? 0,
        };
      });

      const finalPct = appliedWeight > 0
        ? Math.round((weightedSum / (totalWeight || appliedWeight)) * 10) / 10
        : null;
      const letterGrade = finalPct === null ? null : finalPct >= 90 ? 'A' : finalPct >= 80 ? 'B' : finalPct >= 70 ? 'C' : finalPct >= 60 ? 'D' : 'F';

      return { student, categoryBreakdown, finalPct, letterGrade };
    });

    return { categories, students: studentGrades, totalWeight };
  }

  async getMyWeightedGrade(courseId: string, studentId: string) {
    const gb = await this.getWeightedGradebook(courseId);
    const mine = gb.students.find(s => s.student.id === studentId);
    return { categories: gb.categories, totalWeight: gb.totalWeight, ...mine };
  }

  // ── Existing stats (keep for backward compat) ─────────────────────────────

  async getCourseStats(courseId: string) {
    const assignments = await this.db.assignment.findMany({
      where: { courseId },
      include: { submissions: { include: { grade: true } }, category: { select: { id: true, name: true, color: true, weight: true } } },
      orderBy: { dueAt: 'asc' },
    });

    const perAssignment = assignments.map(a => {
      const scored = a.submissions.filter(s => s.grade).map(s => s.grade!.score);
      const avg = scored.length ? scored.reduce((x, y) => x + y, 0) / scored.length : null;
      return {
        assignmentId: a.id,
        title: a.title,
        maxScore: a.maxScore,
        categoryId: a.categoryId,
        category: a.category,
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
