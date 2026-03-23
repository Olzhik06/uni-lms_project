import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationType } from '@prisma/client';
import { getDeadlineReminderNotificationContent } from '../common/user-content';

@Injectable()
export class DeadlineReminderService {
  private readonly logger = new Logger(DeadlineReminderService.name);

  constructor(private db: PrismaService, private mail: MailService) {}

  // Run every 15 minutes
  @Cron('0 */15 * * * *')
  async sendReminders() {
    await this.processWindow(24);
    await this.processWindow(1);
  }

  private async processWindow(hoursLeft: number) {
    const now = new Date();
    // ±15 minute window around the target time
    const windowStart = new Date(now.getTime() + (hoursLeft * 60 - 15) * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + (hoursLeft * 60 + 15) * 60 * 1000);
    const reminderType = `${hoursLeft}h`;

    const assignments = await this.db.assignment.findMany({
      where: { dueAt: { gte: windowStart, lte: windowEnd } },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            enrollments: {
              where: { roleInCourse: 'STUDENT' },
              select: {
                user: {
                  select: { id: true, email: true, fullName: true, preferredLang: true },
                },
              },
            },
          },
        },
      },
    });

    for (const assignment of assignments) {
      for (const { user } of assignment.course.enrollments) {
        // Skip if already sent
        const alreadySent = await this.db.deadlineReminder.findUnique({
          where: {
            assignmentId_userId_reminderType: {
              assignmentId: assignment.id,
              userId: user.id,
              reminderType,
            },
          },
        });
        if (alreadySent) continue;

        // Skip if already submitted
        const submitted = await this.db.submission.findUnique({
          where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: user.id } },
        });
        if (submitted) continue;

        const content = getDeadlineReminderNotificationContent(
          assignment.title,
          assignment.course.title,
          hoursLeft,
          user.preferredLang,
        );

        await this.db.notification.create({
          data: {
            userId: user.id,
            type: NotificationType.ASSIGNMENT_DUE,
            title: content.title,
            body: content.body,
            link: `/courses/${assignment.courseId}/assignments`,
          },
        });

        await this.mail.sendDeadlineReminder(
          user.email,
          assignment.title,
          assignment.course.title,
          assignment.dueAt,
          hoursLeft,
          user.preferredLang,
        );

        await this.db.deadlineReminder.create({
          data: { assignmentId: assignment.id, userId: user.id, reminderType },
        });

        this.logger.log(`[${reminderType}] reminder → ${user.email} for "${assignment.title}"`);
      }
    }
  }
}
