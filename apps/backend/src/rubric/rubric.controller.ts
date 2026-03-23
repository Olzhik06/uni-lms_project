import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RubricService } from './rubric.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Rubrics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class RubricController {
  constructor(private svc: RubricService) {}

  // ── Rubric ────────────────────────────────────────────────────────────────────

  @Get('assignments/:id/rubric')
  @ApiOperation({ summary: 'Get rubric for an assignment' })
  get(@Param('id') id: string) { return this.svc.getByAssignment(id); }

  @Post('assignments/:id/rubric')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Create rubric for an assignment' })
  create(@Param('id') id: string, @Body() body: { title: string }, @CurrentUser() u: any) {
    return this.svc.create(id, u.id, body.title);
  }

  @Patch('rubrics/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Update rubric title' })
  update(@Param('id') id: string, @Body() body: { title: string }) {
    return this.svc.updateTitle(id, body.title);
  }

  @Delete('rubrics/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete rubric' })
  remove(@Param('id') id: string) { return this.svc.deleteRubric(id); }

  // ── Criteria ──────────────────────────────────────────────────────────────────

  @Post('rubrics/:id/criteria')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Add criterion to rubric' })
  addCriterion(@Param('id') id: string, @Body() body: { title: string; description?: string; points: number }) {
    return this.svc.addCriterion(id, body);
  }

  @Patch('rubric-criteria/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Update criterion' })
  updateCriterion(@Param('id') id: string, @Body() body: { title?: string; description?: string; points?: number }) {
    return this.svc.updateCriterion(id, body);
  }

  @Delete('rubric-criteria/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete criterion' })
  deleteCriterion(@Param('id') id: string) { return this.svc.deleteCriterion(id); }

  // ── Levels ────────────────────────────────────────────────────────────────────

  @Post('rubric-criteria/:id/levels')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Add level to criterion' })
  addLevel(@Param('id') id: string, @Body() body: { title: string; description?: string; points: number }) {
    return this.svc.addLevel(id, body);
  }

  @Patch('rubric-levels/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Update level' })
  updateLevel(@Param('id') id: string, @Body() body: { title?: string; description?: string; points?: number }) {
    return this.svc.updateLevel(id, body);
  }

  @Delete('rubric-levels/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete level' })
  deleteLevel(@Param('id') id: string) { return this.svc.deleteLevel(id); }

  // ── Evaluation ────────────────────────────────────────────────────────────────

  @Post('submissions/:id/rubric-evaluate')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Grade submission with rubric' })
  evaluate(
    @Param('id') id: string,
    @CurrentUser() u: any,
    @Body() body: { scores: { criterionId: string; levelId: string; comment?: string }[] },
  ) {
    return this.svc.evaluate(id, u.id, body.scores);
  }

  @Get('submissions/:id/rubric-evaluation')
  @ApiOperation({ summary: 'Get rubric evaluation for a submission' })
  getEvaluation(@Param('id') id: string) { return this.svc.getEvaluation(id); }
}
