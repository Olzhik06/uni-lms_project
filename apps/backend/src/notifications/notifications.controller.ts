import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller('me/notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get() all(@CurrentUser() u: any) { return this.svc.findForUser(u.id); }
  @Get('unread-count') count(@CurrentUser() u: any) { return this.svc.getUnreadCount(u.id); }
  @Post(':id/read') read(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.markRead(id, u.id); }
  @Post('read-all') readAll(@CurrentUser() u: any) { return this.svc.markAllRead(u.id); }
}
