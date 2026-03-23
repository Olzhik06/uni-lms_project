import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './announcements.dto';
import { Role, CourseRole, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { getAnnouncementNotificationContent } from '../common/user-content';

const INC = { author: { select: { fullName: true } }, course: { select: { id: true, code: true, title: true } } };

@Injectable()
export class AnnouncementsService {
  constructor(
    private db: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findForUser(user: { id: string; role: Role }) {
    if (user.role === Role.ADMIN) return this.db.announcement.findMany({ include: INC, orderBy: { createdAt: 'desc' }, take: 50 });
    const cids = (await this.db.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } })).map(e => e.courseId);
    return this.db.announcement.findMany({ where: { OR: [{ courseId: null }, { courseId: { in: cids } }] }, include: INC, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  findByCourse(courseId: string) { return this.db.announcement.findMany({ where: { courseId }, include: { author: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } }); }

  async create(dto: CreateAnnouncementDto, user: { id: string; role: Role }) {
    if (!dto.courseId && user.role !== Role.ADMIN) throw new ForbiddenException('errors.announcement.onlyAdminsGlobal');
    if (dto.courseId && user.role === Role.TEACHER) {
      if (!(await this.db.enrollment.findFirst({ where: { userId: user.id, courseId: dto.courseId, roleInCourse: CourseRole.TEACHER } })))
        throw new ForbiddenException('errors.announcement.notTeacherOfCourse');
    }
    const ann = await this.db.announcement.create({ data: { title: dto.title, body: dto.body, courseId: dto.courseId || null, authorId: user.id }, include: INC });
    if (dto.courseId) {
      const enrs = await this.db.enrollment.findMany({
        where: { courseId: dto.courseId, roleInCourse: CourseRole.STUDENT },
        select: { userId: true, user: { select: { preferredLang: true } } },
      });
      if (enrs.length) {
        await this.notifications.createMany(enrs.map(e => ({
          userId: e.userId,
          type: NotificationType.ANNOUNCEMENT,
          ...getAnnouncementNotificationContent(ann.course?.title ?? '', dto.title, e.user.preferredLang),
          link: '/courses/' + dto.courseId + '/overview',
        })));
      }
    }
    return ann;
  }
}
