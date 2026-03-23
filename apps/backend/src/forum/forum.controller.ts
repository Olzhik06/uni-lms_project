import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ForumService } from './forum.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Forum')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class ForumController {
  constructor(private svc: ForumService) {}

  // ── Threads ───────────────────────────────────────────────────────────────

  @Get('courses/:id/forum/threads')
  @ApiOperation({ summary: 'List threads for a course' })
  listThreads(@Param('id') courseId: string) {
    return this.svc.listThreads(courseId);
  }

  @Post('courses/:id/forum/threads')
  @ApiOperation({ summary: 'Create a new thread' })
  createThread(
    @Param('id') courseId: string,
    @Body() body: { title: string; body: string },
    @CurrentUser() u: any,
  ) {
    return this.svc.createThread(courseId, u.id, body.title, body.body);
  }

  @Get('forum-threads/:id')
  @ApiOperation({ summary: 'Get a single thread' })
  getThread(@Param('id') id: string) {
    return this.svc.getThread(id);
  }

  @Patch('forum-threads/:id/pin')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Pin / unpin a thread' })
  pinThread(@Param('id') id: string, @Body() body: { isPinned: boolean }) {
    return this.svc.pinThread(id, body.isPinned);
  }

  @Delete('forum-threads/:id')
  @ApiOperation({ summary: 'Delete a thread (author / teacher / admin)' })
  deleteThread(@Param('id') id: string, @CurrentUser() u: any) {
    return this.svc.deleteThread(id, u.id, u.role);
  }

  // ── Posts (replies) ───────────────────────────────────────────────────────

  @Get('forum-threads/:id/posts')
  @ApiOperation({ summary: 'List posts in a thread' })
  listPosts(@Param('id') threadId: string) {
    return this.svc.listPosts(threadId);
  }

  @Post('forum-threads/:id/posts')
  @ApiOperation({ summary: 'Add a reply to a thread' })
  createPost(
    @Param('id') threadId: string,
    @Body() body: { body: string },
    @CurrentUser() u: any,
  ) {
    return this.svc.createPost(threadId, u.id, body.body);
  }

  @Delete('forum-posts/:id')
  @ApiOperation({ summary: 'Delete a post (author / teacher / admin)' })
  deletePost(@Param('id') id: string, @CurrentUser() u: any) {
    return this.svc.deletePost(id, u.id, u.role);
  }
}
