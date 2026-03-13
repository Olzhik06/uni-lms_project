import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('me/notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  all(@CurrentUser() u: any) { return this.svc.findForUser(u.id); }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  count(@CurrentUser() u: any) { return this.svc.getUnreadCount(u.id); }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  read(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.markRead(id, u.id); }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  readAll(@CurrentUser() u: any) { return this.svc.markAllRead(u.id); }
}
