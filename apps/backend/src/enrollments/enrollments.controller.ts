import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './enrollments.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Admin - Enrollments') @ApiBearerAuth() @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles(Role.ADMIN) @Controller('admin/enrollments')
export class EnrollmentsController {
  constructor(private svc: EnrollmentsService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Post() create(@Body() dto: CreateEnrollmentDto) { return this.svc.create(dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }
}
