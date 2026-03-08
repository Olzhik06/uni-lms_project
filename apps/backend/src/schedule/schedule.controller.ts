import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ScheduleService } from './schedule.service';
import { CreateScheduleItemDto } from './schedule.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Schedule') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller()
export class ScheduleController {
  constructor(private svc: ScheduleService) {}
  @Get('me/schedule') my(@CurrentUser() u: any, @Query('from') from: string, @Query('to') to: string) { return this.svc.getMySchedule(u, from, to); }
  @Get('me/calendar') cal(@CurrentUser() u: any, @Query('month') month: string) { return this.svc.getCalendar(u, month); }
  @Get('courses/:id/schedule') cs(@Param('id') id: string, @Query('from') f?: string, @Query('to') t?: string) { return this.svc.getCourseSchedule(id, f, t); }
  @Post('courses/:id/schedule') @UseGuards(RolesGuard) @Roles(Role.ADMIN, Role.TEACHER) create(@Param('id') id: string, @Body() dto: CreateScheduleItemDto, @CurrentUser() u: any) { return this.svc.create(id, dto, u); }
}
