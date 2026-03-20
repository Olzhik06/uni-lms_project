import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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
}
