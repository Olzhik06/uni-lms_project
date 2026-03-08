import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './courses.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Courses') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('courses')
export class CoursesController {
  constructor(private svc: CoursesService) {}
  @Get() findAll(@CurrentUser() u: any) { return this.svc.findAll(u); }
  @Get(':id') findOne(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.findOne(id, u); }
  @Get(':id/participants') parts(@Param('id') id: string) { return this.svc.getParticipants(id); }
}

@ApiTags('Admin - Courses') @ApiBearerAuth() @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles(Role.ADMIN) @Controller('admin/courses')
export class AdminCoursesController {
  constructor(private svc: CoursesService) {}
  @Post() create(@Body() dto: CreateCourseDto) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCourseDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }
}
