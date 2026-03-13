import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Activity Log')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class ActivityLogController {
  constructor(private svc: ActivityLogService) {}

  @Get('me/activity')
  @ApiOperation({ summary: 'Get current user activity log' })
  myActivity(@CurrentUser() u: any, @Query('limit') limit?: string) {
    return this.svc.findForUser(u.id, limit ? +limit : 20);
  }

  @Get('admin/activity')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users activity log (admin)' })
  allActivity(@Query('limit') limit?: string) {
    return this.svc.findAll(limit ? +limit : 50);
  }
}
