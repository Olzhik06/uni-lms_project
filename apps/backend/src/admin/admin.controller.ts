import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private svc: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiResponse({ status: 200, description: 'Platform statistics' })
  getStats() {
    return this.svc.getStats();
  }
}

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('courses')
export class CourseProgressController {
  constructor(private svc: AdminService) {}

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get course progress for current student' })
  getProgress(@Param('id') id: string, @CurrentUser() u: any) {
    return this.svc.getCourseProgress(id, u.id, u.role);
  }
}
