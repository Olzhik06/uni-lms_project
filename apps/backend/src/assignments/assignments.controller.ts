import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto, UpdateAssignmentDto, SubmitDto, GradeDto } from './assignments.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Assignments') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller()
export class AssignmentsController {
  constructor(private svc: AssignmentsService) {}
  @Get('courses/:id/assignments') byCourse(@Param('id') id: string) { return this.svc.findByCourse(id); }
  @Post('courses/:id/assignments') @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.TEACHER)
  create(@Param('id') id: string, @Body() dto: CreateAssignmentDto, @CurrentUser() u: any) { return this.svc.create(id, dto, u); }
  @Get('assignments/:id') one(@Param('id') id: string) { return this.svc.findOne(id); }
  @Patch('assignments/:id') @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.TEACHER) update(@Param('id') id: string, @Body() dto: UpdateAssignmentDto) { return this.svc.update(id, dto); }
  @Delete('assignments/:id') @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.TEACHER) remove(@Param('id') id: string) { return this.svc.remove(id); }
  @Post('assignments/:id/submit') @UseGuards(RolesGuard) @Roles(Role.STUDENT) submit(@Param('id') id: string, @Body() dto: SubmitDto, @CurrentUser() u: any) { return this.svc.submit(id, dto, u.id); }
  @Get('assignments/:id/submission') mySub(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.getMySub(id, u.id); }
  @Get('assignments/:id/submissions') @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.TEACHER) allSubs(@Param('id') id: string) { return this.svc.allSubs(id); }
  @Post('submissions/:id/grade') @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.TEACHER) grade(@Param('id') id: string, @Body() dto: GradeDto, @CurrentUser() u: any) { return this.svc.grade(id, dto, u.id); }
}
