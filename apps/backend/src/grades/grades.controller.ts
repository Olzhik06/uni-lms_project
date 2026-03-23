import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Grades')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class GradesController {
  constructor(private svc: GradesService) {}

  @Get('me/grades')
  @ApiOperation({ summary: 'Get current student grades' })
  mine(@CurrentUser() u: any) { return this.svc.getMyGrades(u.id); }

  @Get('me/grades/summary')
  @ApiOperation({ summary: 'Get grade summary grouped by course (student)' })
  summary(@CurrentUser() u: any) { return this.svc.getStudentSummary(u.id); }

  @Get('courses/:id/grades')
  @ApiOperation({ summary: 'Get all grades for a course (teacher/admin)' })
  byCourse(@Param('id') id: string) { return this.svc.getCourseGrades(id); }

  @Get('courses/:id/grades/stats')
  @ApiOperation({ summary: 'Get grade statistics per assignment for a course' })
  courseStats(@Param('id') id: string) { return this.svc.getCourseStats(id); }

  // ── Weighted Gradebook ──────────────────────────────────────────────────

  @Get('courses/:id/gradebook')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Full weighted gradebook for all students (teacher/admin)' })
  gradebook(@Param('id') id: string) { return this.svc.getWeightedGradebook(id); }

  @Get('courses/:id/my-gradebook')
  @ApiOperation({ summary: 'My weighted grade breakdown for this course (student)' })
  myGradebook(@Param('id') id: string, @CurrentUser() u: any) {
    return this.svc.getMyWeightedGrade(id, u.id);
  }

  // ── Grade Categories ────────────────────────────────────────────────────

  @Get('courses/:id/grade-categories')
  @ApiOperation({ summary: 'List grade categories for a course' })
  listCategories(@Param('id') id: string) { return this.svc.getCategories(id); }

  @Post('courses/:id/grade-categories')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Create grade category' })
  createCategory(@Param('id') id: string, @Body() body: { name: string; weight: number; color?: string }) {
    return this.svc.createCategory(id, body);
  }

  @Patch('grade-categories/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Update grade category' })
  updateCategory(@Param('id') id: string, @Body() body: { name?: string; weight?: number; color?: string }) {
    return this.svc.updateCategory(id, body);
  }

  @Delete('grade-categories/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete grade category' })
  deleteCategory(@Param('id') id: string) { return this.svc.deleteCategory(id); }

  @Patch('assignments/:id/category')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Assign assignment to grade category' })
  assignCategory(@Param('id') id: string, @Body() body: { categoryId: string | null }) {
    return this.svc.assignCategory(id, body.categoryId);
  }

  @Patch('quizzes/:id/category')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Assign quiz to grade category' })
  assignQuizCategory(@Param('id') id: string, @Body() body: { categoryId: string | null }) {
    return this.svc.assignQuizCategory(id, body.categoryId);
  }
}
