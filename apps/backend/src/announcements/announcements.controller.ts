import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './announcements.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Announcements') @ApiBearerAuth() @UseGuards(AuthGuard('jwt')) @Controller()
export class AnnouncementsController {
  constructor(private svc: AnnouncementsService) {}
  @Get('announcements') all(@CurrentUser() u: any) { return this.svc.findForUser(u); }
  @Post('announcements') create(@Body() dto: CreateAnnouncementDto, @CurrentUser() u: any) { return this.svc.create(dto, u); }
  @Get('courses/:id/announcements') byCourse(@Param('id') id: string) { return this.svc.findByCourse(id); }
  @Post('courses/:id/announcements') createFor(@Param('id') id: string, @Body() dto: CreateAnnouncementDto, @CurrentUser() u: any) { dto.courseId = id; return this.svc.create(dto, u); }
}
