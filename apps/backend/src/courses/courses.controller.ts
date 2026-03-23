import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './courses.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('courses')
export class CoursesController {
  constructor(private svc: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List courses (filtered by enrollment for non-admins)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiQuery({ name: 'semester', required: false, type: String })
  findAll(
    @CurrentUser() u: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('teacherId') teacherId?: string,
    @Query('semester') semester?: string,
  ) {
    return this.svc.findAll(
      u,
      { page: page ? +page : undefined, limit: limit ? +limit : undefined },
      { search, teacherId, semester },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details' })
  findOne(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.findOne(id, u); }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get course participants' })
  parts(@Param('id') id: string) { return this.svc.getParticipants(id); }
}

@ApiTags('Admin - Courses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/courses')
export class AdminCoursesController {
  constructor(private svc: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'Create course (admin)' })
  create(@Body() dto: CreateCourseDto, @CurrentUser() u: any) { return this.svc.create(dto, u.id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update course (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) { return this.svc.update(id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete course (admin)' })
  remove(@Param('id') id: string) { return this.svc.remove(id); }
}
