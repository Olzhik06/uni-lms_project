import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class NotificationsService {
  constructor(private db: PrismaService) {}
  findForUser(uid: string) { return this.db.notification.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  async markRead(id: string, uid: string) { await this.db.notification.updateMany({ where: { id, userId: uid }, data: { isRead: true } }); return { ok: true }; }
  async markAllRead(uid: string) { await this.db.notification.updateMany({ where: { userId: uid, isRead: false }, data: { isRead: true } }); return { ok: true }; }
  getUnreadCount(uid: string) { return this.db.notification.count({ where: { userId: uid, isRead: false } }); }
}
