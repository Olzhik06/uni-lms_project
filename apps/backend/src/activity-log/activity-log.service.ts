import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private db: PrismaService) {}

  log(userId: string, action: string, entity: string, entityId?: string) {
    return this.db.activityLog.create({ data: { userId, action, entity, entityId } });
  }

  findForUser(userId: string, limit = 20) {
    return this.db.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findAll(limit = 50) {
    return this.db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
    });
  }
}
