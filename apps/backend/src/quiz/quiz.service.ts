import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuizStatus, QuestionType, Role } from '@prisma/client';
import { CreateQuizDto, UpdateQuizDto, AddQuestionDto, UpdateQuestionDto, ReorderQuestionsDto, SubmitAttemptDto, GradeShortAnswerDto } from './quiz.dto';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async assertCourseAccess(courseId: string, userId: string, role: Role) {
    if (role === Role.ADMIN) return;
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this course');
  }

  private async assertQuizTeacher(quizId: string, userId: string, role: Role) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (role === Role.ADMIN) return quiz;
    if (quiz.createdById !== userId) throw new ForbiddenException('Not quiz owner');
    return quiz;
  }

  private autoGrade(type: QuestionType, answer: unknown, correctOption: unknown, points: number) {
    if (type === QuestionType.SHORT_ANSWER) return { isCorrect: null, pointsEarned: null };
    if (type === QuestionType.MCQ_SINGLE || type === QuestionType.TRUE_FALSE) {
      const correct = answer === correctOption;
      return { isCorrect: correct, pointsEarned: correct ? points : 0 };
    }
    if (type === QuestionType.MCQ_MULTI) {
      const a = JSON.stringify([...(answer as number[])].sort());
      const c = JSON.stringify([...(correctOption as number[])].sort());
      const correct = a === c;
      return { isCorrect: correct, pointsEarned: correct ? points : 0 };
    }
    return { isCorrect: false, pointsEarned: 0 };
  }

  // ── Quiz CRUD ─────────────────────────────────────────────────────────────

  async listForCourse(courseId: string, userId: string, role: Role) {
    await this.assertCourseAccess(courseId, userId, role);
    const where = role === Role.STUDENT
      ? { courseId, status: QuizStatus.PUBLISHED }
      : { courseId };
    const quizzes = await this.prisma.quiz.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });
    // For each quiz, attach student's own attempt count
    if (role === Role.STUDENT) {
      return Promise.all(quizzes.map(async (q) => {
        const myAttempts = await this.prisma.quizAttempt.count({
          where: { quizId: q.id, studentId: userId },
        });
        return { ...q, myAttempts };
      }));
    }
    return quizzes;
  }

  async getOne(quizId: string, userId: string, role: Role) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { attempts: true } },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    await this.assertCourseAccess(quiz.courseId, userId, role);

    // Students: hide correct answers + only see published
    if (role === Role.STUDENT) {
      if (quiz.status !== QuizStatus.PUBLISHED) throw new ForbiddenException('Quiz not available');
      return {
        ...quiz,
        questions: quiz.questions.map(({ correctOption: _co, explanation: _ex, ...q }) => q),
      };
    }
    return quiz;
  }

  async create(courseId: string, userId: string, dto: CreateQuizDto) {
    return this.prisma.quiz.create({
      data: {
        courseId,
        createdById: userId,
        title: dto.title,
        description: dto.description ?? '',
        timeLimitMinutes: dto.timeLimitMinutes,
        maxAttempts: dto.maxAttempts ?? 1,
        shuffleQuestions: dto.shuffleQuestions ?? false,
        showResults: dto.showResults ?? true,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
        availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null,
      },
    });
  }

  async update(quizId: string, userId: string, role: Role, dto: UpdateQuizDto) {
    await this.assertQuizTeacher(quizId, userId, role);
    return this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.timeLimitMinutes !== undefined && { timeLimitMinutes: dto.timeLimitMinutes }),
        ...(dto.maxAttempts !== undefined && { maxAttempts: dto.maxAttempts }),
        ...(dto.shuffleQuestions !== undefined && { shuffleQuestions: dto.shuffleQuestions }),
        ...(dto.showResults !== undefined && { showResults: dto.showResults }),
        ...(dto.availableFrom !== undefined && { availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null }),
        ...(dto.availableUntil !== undefined && { availableUntil: dto.availableUntil ? new Date(dto.availableUntil) : null }),
      },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  async publish(quizId: string, userId: string, role: Role) {
    const quiz = await this.assertQuizTeacher(quizId, userId, role);
    const qCount = await this.prisma.quizQuestion.count({ where: { quizId } });
    if (qCount === 0) throw new BadRequestException('Add at least one question before publishing');
    return this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: QuizStatus.PUBLISHED },
    });
  }

  async close(quizId: string, userId: string, role: Role) {
    await this.assertQuizTeacher(quizId, userId, role);
    return this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: QuizStatus.CLOSED },
    });
  }

  async remove(quizId: string, userId: string, role: Role) {
    await this.assertQuizTeacher(quizId, userId, role);
    await this.prisma.quiz.delete({ where: { id: quizId } });
    return { ok: true };
  }

  // ── Questions ─────────────────────────────────────────────────────────────

  async addQuestion(quizId: string, userId: string, role: Role, dto: AddQuestionDto) {
    await this.assertQuizTeacher(quizId, userId, role);
    const lastQ = await this.prisma.quizQuestion.findFirst({
      where: { quizId }, orderBy: { orderIndex: 'desc' },
    });
    return this.prisma.quizQuestion.create({
      data: {
        quizId,
        type: dto.type,
        body: dto.body,
        options: dto.options ?? undefined,
        correctOption: dto.correctOption !== undefined ? dto.correctOption as any : undefined,
        explanation: dto.explanation,
        points: dto.points ?? 1,
        orderIndex: dto.orderIndex ?? (lastQ ? lastQ.orderIndex + 1 : 0),
      },
    });
  }

  async updateQuestion(questionId: string, userId: string, role: Role, dto: UpdateQuestionDto) {
    const q = await this.prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question not found');
    await this.assertQuizTeacher(q.quizId, userId, role);
    return this.prisma.quizQuestion.update({
      where: { id: questionId },
      data: {
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.options !== undefined && { options: dto.options }),
        ...(dto.correctOption !== undefined && { correctOption: dto.correctOption as any }),
        ...(dto.explanation !== undefined && { explanation: dto.explanation }),
        ...(dto.points !== undefined && { points: dto.points }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      },
    });
  }

  async removeQuestion(questionId: string, userId: string, role: Role) {
    const q = await this.prisma.quizQuestion.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Question not found');
    await this.assertQuizTeacher(q.quizId, userId, role);
    await this.prisma.quizQuestion.delete({ where: { id: questionId } });
    return { ok: true };
  }

  async reorderQuestions(quizId: string, userId: string, role: Role, dto: ReorderQuestionsDto) {
    await this.assertQuizTeacher(quizId, userId, role);
    await Promise.all(dto.order.map((id, idx) =>
      this.prisma.quizQuestion.update({ where: { id }, data: { orderIndex: idx } })
    ));
    return { ok: true };
  }

  // ── Student Attempts ──────────────────────────────────────────────────────

  async startAttempt(quizId: string, studentId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.status !== QuizStatus.PUBLISHED) throw new ForbiddenException('Quiz not available');

    // Check availability window
    const now = new Date();
    if (quiz.availableFrom && now < quiz.availableFrom) throw new ForbiddenException('Quiz not yet available');
    if (quiz.availableUntil && now > quiz.availableUntil) throw new ForbiddenException('Quiz is closed');

    // Check attempt count
    const existingCount = await this.prisma.quizAttempt.count({ where: { quizId, studentId } });
    if (existingCount >= quiz.maxAttempts) throw new ForbiddenException('Max attempts reached');

    // Check no open attempt
    const openAttempt = await this.prisma.quizAttempt.findFirst({
      where: { quizId, studentId, submittedAt: null },
    });
    if (openAttempt) return openAttempt;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        attemptNumber: existingCount + 1,
      },
    });

    // Shuffle if needed
    let questions = [...quiz.questions];
    if (quiz.shuffleQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    return {
      ...attempt,
      quiz: { ...quiz, questions: questions.map(({ correctOption: _co, explanation: _ex, ...q }) => q) },
    };
  }

  async submitAttempt(attemptId: string, studentId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: { include: { questions: true } } },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentId !== studentId) throw new ForbiddenException();
    if (attempt.submittedAt) throw new BadRequestException('Already submitted');

    // Check time limit
    if (attempt.quiz.timeLimitMinutes) {
      const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;
      if (elapsed > attempt.quiz.timeLimitMinutes * 60 + 30) {
        throw new BadRequestException('Time limit exceeded');
      }
    }

    const questions = attempt.quiz.questions;
    const maxScore = questions.reduce((s, q) => s + q.points, 0);

    // Create answer records + auto-grade
    await Promise.all(questions.map(async (q) => {
      const answer = dto.answers[q.id] ?? null;
      const { isCorrect, pointsEarned } = this.autoGrade(q.type, answer, q.correctOption, q.points);
      await this.prisma.quizAnswerRecord.upsert({
        where: { attemptId_questionId: { attemptId, questionId: q.id } },
        create: { attemptId, questionId: q.id, answer: answer as any, isCorrect, pointsEarned },
        update: { answer: answer as any, isCorrect, pointsEarned },
      });
    }));

    // Compute score from auto-graded questions only
    const graded = await this.prisma.quizAnswerRecord.findMany({ where: { attemptId } });
    const score = graded.reduce((s, r) => s + (r.pointsEarned ?? 0), 0);

    return this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        timeTakenSeconds: dto.timeTakenSeconds,
        score,
        maxScore,
      },
      include: {
        answers: { include: { question: true } },
        quiz: true,
      },
    });
  }

  async getAttempt(attemptId: string, userId: string, role: Role) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { include: { question: true } },
        quiz: { include: { questions: true } },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (role === Role.STUDENT && attempt.studentId !== userId) throw new ForbiddenException();
    return attempt;
  }

  async listMyAttempts(quizId: string, studentId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId, studentId },
      orderBy: { attemptNumber: 'asc' },
    });
  }

  // ── Teacher Analytics ─────────────────────────────────────────────────────

  async getResults(quizId: string, userId: string, role: Role) {
    await this.assertQuizTeacher(quizId, userId, role);
    return this.prisma.quizAttempt.findMany({
      where: { quizId, submittedAt: { not: null } },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        answers: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getAnalytics(quizId: string, userId: string, role: Role) {
    await this.assertQuizTeacher(quizId, userId, role);
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, submittedAt: { not: null } },
    });
    if (attempts.length === 0) return { totalAttempts: 0, avgScore: 0, avgPct: 0, questions: [] };

    const scores = attempts.map(a => a.score ?? 0);
    const maxScores = attempts.map(a => a.maxScore ?? 1);
    const avgScore = scores.reduce((s, x) => s + x, 0) / scores.length;
    const avgPct = attempts.reduce((s, a, i) => s + (scores[i] / (maxScores[i] || 1)) * 100, 0) / attempts.length;

    const questions = await this.prisma.quizQuestion.findMany({ where: { quizId }, orderBy: { orderIndex: 'asc' } });
    const qStats = await Promise.all(questions.map(async (q) => {
      const answers = await this.prisma.quizAnswerRecord.findMany({
        where: { questionId: q.id, isCorrect: { not: null } },
      });
      const correctCount = answers.filter(a => a.isCorrect).length;
      return {
        id: q.id,
        body: q.body,
        type: q.type,
        correctRate: answers.length ? Math.round((correctCount / answers.length) * 100) : null,
        totalAnswers: answers.length,
      };
    }));

    return { totalAttempts: attempts.length, avgScore: Math.round(avgScore * 10) / 10, avgPct: Math.round(avgPct), questions: qStats };
  }

  async gradeShortAnswers(attemptId: string, userId: string, role: Role, dto: GradeShortAnswerDto) {
    const attempt = await this.prisma.quizAttempt.findUnique({ where: { id: attemptId }, include: { quiz: true } });
    if (!attempt) throw new NotFoundException('Attempt not found');
    await this.assertQuizTeacher(attempt.quizId, userId, role);

    await Promise.all(Object.entries(dto.grades).map(([answerId, { points, note }]) =>
      this.prisma.quizAnswerRecord.update({
        where: { id: answerId },
        data: { pointsEarned: points, teacherNote: note, isCorrect: points > 0 },
      })
    ));

    // Recompute total score
    const allAnswers = await this.prisma.quizAnswerRecord.findMany({ where: { attemptId } });
    const score = allAnswers.reduce((s, r) => s + (r.pointsEarned ?? 0), 0);
    return this.prisma.quizAttempt.update({ where: { id: attemptId }, data: { score } });
  }
}
