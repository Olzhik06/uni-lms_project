import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { QuizService } from './quiz.service';
import { CreateQuizDto, UpdateQuizDto, AddQuestionDto, UpdateQuestionDto, ReorderQuestionsDto, SubmitAttemptDto, GradeShortAnswerDto } from './quiz.dto';

@ApiTags('quiz')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // ── Quiz CRUD ─────────────────────────────────────────────────────────────

  @Get('courses/:id/quizzes')
  @ApiOperation({ summary: 'List quizzes for a course' })
  list(@Param('id') courseId: string, @Req() req: any) {
    return this.quizService.listForCourse(courseId, req.user.id, req.user.role);
  }

  @Post('courses/:id/quizzes')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a quiz' })
  create(@Param('id') courseId: string, @Body() dto: CreateQuizDto, @Req() req: any) {
    return this.quizService.create(courseId, req.user.id, dto);
  }

  @Get('quizzes/:id')
  @ApiOperation({ summary: 'Get quiz details' })
  getOne(@Param('id') quizId: string, @Req() req: any) {
    return this.quizService.getOne(quizId, req.user.id, req.user.role);
  }

  @Patch('quizzes/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Update quiz settings' })
  update(@Param('id') quizId: string, @Body() dto: UpdateQuizDto, @Req() req: any) {
    return this.quizService.update(quizId, req.user.id, req.user.role, dto);
  }

  @Patch('quizzes/:id/publish')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Publish quiz' })
  publish(@Param('id') quizId: string, @Req() req: any) {
    return this.quizService.publish(quizId, req.user.id, req.user.role);
  }

  @Patch('quizzes/:id/close')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Close quiz' })
  close(@Param('id') quizId: string, @Req() req: any) {
    return this.quizService.close(quizId, req.user.id, req.user.role);
  }

  @Delete('quizzes/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete quiz' })
  remove(@Param('id') quizId: string, @Req() req: any) {
    return this.quizService.remove(quizId, req.user.id, req.user.role);
  }

  // ── Questions ─────────────────────────────────────────────────────────────

  @Post('quizzes/:id/questions')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Add question to quiz' })
  addQuestion(@Param('id') quizId: string, @Body() dto: AddQuestionDto, @Req() req: any) {
    return this.quizService.addQuestion(quizId, req.user.id, req.user.role, dto);
  }

  @Patch('quiz-questions/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Update a question' })
  updateQuestion(@Param('id') questionId: string, @Body() dto: UpdateQuestionDto, @Req() req: any) {
    return this.quizService.updateQuestion(questionId, req.user.id, req.user.role, dto);
  }

  @Delete('quiz-questions/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a question' })
  removeQuestion(@Param('id') questionId: string, @Req() req: any) {
    return this.quizService.removeQuestion(questionId, req.user.id, req.user.role);
  }

  @Patch('quizzes/:id/questions/reorder')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Reorder questions' })
  reorder(@Param('id') quizId: string, @Body() dto: ReorderQuestionsDto, @Req() req: any) {
    return this.quizService.reorderQuestions(quizId, req.user.id, req.user.role, dto);
  }

  // ── Student Attempts ──────────────────────────────────────────────────────

  @Post('quizzes/:id/start')
  @ApiOperation({ summary: 'Start a quiz attempt' })
  start(@Param('id') quizId: string, @Req() req: any) {
    return this.quizService.startAttempt(quizId, req.user.id);
  }

  @Get('quizzes/:id/my-attempts')
  @ApiOperation({ summary: 'List my attempts for a quiz' })
  myAttempts(@Param('id') quizId: string, @Req() req: any) {
    return this.quizService.listMyAttempts(quizId, req.user.id);
  }

  @Post('quiz-attempts/:id/submit')
  @ApiOperation({ summary: 'Submit quiz attempt' })
  submit(@Param('id') attemptId: string, @Body() dto: SubmitAttemptDto, @Req() req: any) {
    return this.quizService.submitAttempt(attemptId, req.user.id, dto);
  }

  @Get('quiz-attempts/:id')
  @ApiOperation({ summary: 'Get attempt result' })
  getAttempt(@Param('id') attemptId: string, @Req() req: any) {
    return this.quizService.getAttempt(attemptId, req.user.id, req.user.role);
  }

  // ── Teacher Analytics ─────────────────────────────────────────────────────

  @Get('quizzes/:id/results')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Get all student results for a quiz' })
  results(@Param('id') quizId: string, @Req() req: any) {
    return this.quizService.getResults(quizId, req.user.id, req.user.role);
  }

  @Get('quizzes/:id/analytics')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Get quiz analytics' })
  analytics(@Param('id') quizId: string, @Req() req: any) {
    return this.quizService.getAnalytics(quizId, req.user.id, req.user.role);
  }

  @Patch('quiz-attempts/:id/grade')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Grade short answer questions in an attempt' })
  gradeShortAnswers(@Param('id') attemptId: string, @Body() dto: GradeShortAnswerDto, @Req() req: any) {
    return this.quizService.gradeShortAnswers(attemptId, req.user.id, req.user.role, dto);
  }
}
