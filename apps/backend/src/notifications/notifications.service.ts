import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type NotificationListener = (event: { type: 'refresh'; unreadCount: number }) => void;

@Injectable()
export class NotificationsService {
  private listeners = new Map<string, Set<NotificationListener>>();

  constructor(private db: PrismaService) {}
  findForUser(uid: string) { return this.db.notification.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 50 }); }

  subscribe(uid: string, listener: NotificationListener) {
    const current = this.listeners.get(uid) ?? new Set<NotificationListener>();
    current.add(listener);
    this.listeners.set(uid, current);

    return () => {
      const next = this.listeners.get(uid);
      if (!next) return;
      next.delete(listener);
      if (next.size === 0) this.listeners.delete(uid);
    };
  }

  async create(data: Prisma.NotificationUncheckedCreateInput & { type: NotificationType }) {
    const notification = await this.db.notification.create({ data });
    await this.emitRefresh(notification.userId);
    return notification;
  }

  async createMany(data: Array<Prisma.NotificationCreateManyInput & { type: NotificationType }>) {
    if (!data.length) return { count: 0 };
    const result = await this.db.notification.createMany({ data });
    const affectedUsers = [...new Set(data.map(item => item.userId))];
    await Promise.all(affectedUsers.map(uid => this.emitRefresh(uid)));
    return result;
  }

  async markRead(id: string, uid: string) {
    await this.db.notification.updateMany({ where: { id, userId: uid }, data: { isRead: true } });
    await this.emitRefresh(uid);
    return { ok: true };
  }

  async markAllRead(uid: string) {
    await this.db.notification.updateMany({ where: { userId: uid, isRead: false }, data: { isRead: true } });
    await this.emitRefresh(uid);
    return { ok: true };
  }

  getUnreadCount(uid: string) { return this.db.notification.count({ where: { userId: uid, isRead: false } }); }

  private async emitRefresh(uid: string) {
    const unreadCount = await this.getUnreadCount(uid);
    for (const listener of this.listeners.get(uid) ?? []) {
      listener({ type: 'refresh', unreadCount });
    }
  }
}
