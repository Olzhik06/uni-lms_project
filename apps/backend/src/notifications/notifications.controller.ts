import { Controller, Get, Post, Param, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
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

  @Get('stream')
  @ApiOperation({ summary: 'Realtime notification events for current user (SSE)' })
  async stream(@CurrentUser() u: any, @Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('retry: 3000\n\n');

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send('ready', { unreadCount: await this.svc.getUnreadCount(u.id) });

    const unsubscribe = this.svc.subscribe(u.id, payload => send('notification', payload));
    const heartbeat = setInterval(() => send('ping', { ts: Date.now() }), 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  read(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.markRead(id, u.id); }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  readAll(@CurrentUser() u: any) { return this.svc.markAllRead(u.id); }
}
