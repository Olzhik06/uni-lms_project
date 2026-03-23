import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const RUBRIC_INCLUDE = {
  criteria: {
    orderBy: { orderIndex: 'asc' as const },
    include: {
      levels: { orderBy: { orderIndex: 'asc' as const } },
    },
  },
};

@Injectable()
export class RubricService {
  constructor(private db: PrismaService) {}

  // ── Rubric CRUD ──────────────────────────────────────────────────────────────

  async getByAssignment(assignmentId: string) {
    return this.db.rubric.findUnique({
      where: { assignmentId },
      include: RUBRIC_INCLUDE,
    });
  }

  async create(assignmentId: string, userId: string, title: string) {
    // Verify assignment exists
    const assignment = await this.db.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return this.db.rubric.create({
      data: { assignmentId, createdById: userId, title },
      include: RUBRIC_INCLUDE,
    });
  }

  async updateTitle(rubricId: string, title: string) {
    await this._findRubric(rubricId);
    return this.db.rubric.update({ where: { id: rubricId }, data: { title }, include: RUBRIC_INCLUDE });
  }

  async deleteRubric(rubricId: string) {
    await this._findRubric(rubricId);
    await this.db.rubric.delete({ where: { id: rubricId } });
    return { ok: true };
  }

  // ── Criteria ─────────────────────────────────────────────────────────────────

  async addCriterion(rubricId: string, data: { title: string; description?: string; points: number }) {
    await this._findRubric(rubricId);
    const count = await this.db.rubricCriterion.count({ where: { rubricId } });
    return this.db.rubricCriterion.create({
      data: { rubricId, title: data.title, description: data.description ?? '', points: data.points, orderIndex: count },
      include: { levels: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  async updateCriterion(criterionId: string, data: { title?: string; description?: string; points?: number }) {
    await this._findCriterion(criterionId);
    return this.db.rubricCriterion.update({
      where: { id: criterionId },
      data,
      include: { levels: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  async deleteCriterion(criterionId: string) {
    await this._findCriterion(criterionId);
    await this.db.rubricCriterion.delete({ where: { id: criterionId } });
    return { ok: true };
  }

  // ── Levels ───────────────────────────────────────────────────────────────────

  async addLevel(criterionId: string, data: { title: string; description?: string; points: number }) {
    await this._findCriterion(criterionId);
    const count = await this.db.rubricLevel.count({ where: { criterionId } });
    return this.db.rubricLevel.create({
      data: { criterionId, title: data.title, description: data.description ?? '', points: data.points, orderIndex: count },
    });
  }

  async updateLevel(levelId: string, data: { title?: string; description?: string; points?: number }) {
    await this._findLevel(levelId);
    return this.db.rubricLevel.update({ where: { id: levelId }, data });
  }

  async deleteLevel(levelId: string) {
    await this._findLevel(levelId);
    await this.db.rubricLevel.delete({ where: { id: levelId } });
    return { ok: true };
  }

  // ── Evaluation (grading) ─────────────────────────────────────────────────────

  async evaluate(
    submissionId: string,
    evaluatedById: string,
    scores: { criterionId: string; levelId: string; comment?: string }[],
  ) {
    // Find rubric via submission -> assignment -> rubric
    const submission = await this.db.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { rubric: { include: RUBRIC_INCLUDE } } } },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    const rubric = submission.assignment.rubric;
    if (!rubric) throw new NotFoundException('No rubric for this assignment');

    // Calculate total score
    let totalScore = 0;
    for (const s of scores) {
      const level = await this.db.rubricLevel.findUnique({ where: { id: s.levelId } });
      if (level) totalScore += level.points;
    }

    // Upsert evaluation
    const existing = await this.db.rubricEvaluation.findUnique({ where: { submissionId } });
    if (existing) {
      // Delete old scores
      await this.db.rubricCriterionScore.deleteMany({ where: { evaluationId: existing.id } });
      await this.db.rubricEvaluation.update({ where: { id: existing.id }, data: { totalScore, evaluatedById } });
      await this.db.rubricCriterionScore.createMany({
        data: scores.map(s => ({ evaluationId: existing.id, criterionId: s.criterionId, levelId: s.levelId, comment: s.comment })),
      });
      return this.getEvaluation(submissionId);
    }

    const evaluation = await this.db.rubricEvaluation.create({
      data: {
        rubricId: rubric.id,
        submissionId,
        evaluatedById,
        totalScore,
        criterionScores: {
          create: scores.map(s => ({ criterionId: s.criterionId, levelId: s.levelId, comment: s.comment })),
        },
      },
    });

    // Auto-set the grade to match rubric total if no grade exists
    const maxScore = rubric.criteria.reduce((sum, c) => sum + c.points, 0);
    const assignmentMaxScore = submission.assignment.maxScore;
    const scaledScore = maxScore > 0 ? Math.round((totalScore / maxScore) * assignmentMaxScore * 10) / 10 : 0;

    const existingGrade = await this.db.grade.findUnique({ where: { submissionId } });
    if (!existingGrade) {
      await this.db.grade.create({ data: { submissionId, gradedById: evaluatedById, score: scaledScore } });
    }

    return this.getEvaluation(submissionId);
  }

  async getEvaluation(submissionId: string) {
    return this.db.rubricEvaluation.findUnique({
      where: { submissionId },
      include: {
        criterionScores: {
          include: {
            criterion: { include: { levels: { orderBy: { orderIndex: 'asc' } } } },
            level: true,
          },
        },
        evaluatedBy: { select: { fullName: true } },
        rubric: { include: RUBRIC_INCLUDE },
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async _findRubric(id: string) {
    const r = await this.db.rubric.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Rubric not found');
    return r;
  }

  private async _findCriterion(id: string) {
    const c = await this.db.rubricCriterion.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Criterion not found');
    return c;
  }

  private async _findLevel(id: string) {
    const l = await this.db.rubricLevel.findUnique({ where: { id } });
    if (!l) throw new NotFoundException('Level not found');
    return l;
  }
}
