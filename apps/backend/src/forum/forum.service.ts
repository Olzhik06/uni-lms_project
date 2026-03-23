import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

const AUTHOR_SELECT = { id: true, fullName: true, role: true } as const;

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  listThreads(courseId: string) {
    return this.prisma.forumThread.findMany({
      where: { courseId },
      include: { author: { select: AUTHOR_SELECT }, _count: { select: { posts: true } } },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  createThread(courseId: string, authorId: string, title: string, body: string) {
    return this.prisma.forumThread.create({
      data: { courseId, authorId, title, body },
      include: { author: { select: AUTHOR_SELECT }, _count: { select: { posts: true } } },
    });
  }

  getThread(threadId: string) {
    return this.prisma.forumThread.findUniqueOrThrow({
      where: { id: threadId },
      include: { author: { select: AUTHOR_SELECT }, _count: { select: { posts: true } } },
    });
  }

  pinThread(threadId: string, isPinned: boolean) {
    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isPinned },
    });
  }

  async deleteThread(threadId: string, userId: string, role: Role) {
    const thread = await this.prisma.forumThread.findUniqueOrThrow({ where: { id: threadId } });
    if (thread.authorId !== userId && role === Role.STUDENT) throw new ForbiddenException();
    return this.prisma.forumThread.delete({ where: { id: threadId } });
  }

  listPosts(threadId: string) {
    return this.prisma.forumPost.findMany({
      where: { threadId },
      include: { author: { select: AUTHOR_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  createPost(threadId: string, authorId: string, body: string) {
    return this.prisma.forumPost.create({
      data: { threadId, authorId, body },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  async deletePost(postId: string, userId: string, role: Role) {
    const post = await this.prisma.forumPost.findUniqueOrThrow({ where: { id: postId } });
    if (post.authorId !== userId && role === Role.STUDENT) throw new ForbiddenException();
    return this.prisma.forumPost.delete({ where: { id: postId } });
  }
}
