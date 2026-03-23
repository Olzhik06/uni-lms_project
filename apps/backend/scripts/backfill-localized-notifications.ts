import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  getAnnouncementNotificationContent,
  getAssignmentNotificationContent,
  getGradeNotificationContent,
} from '../src/common/user-content';

const prisma = new PrismaClient();

function parseAssignment(notification: { title: string; body: string | null }) {
  const title = notification.title?.trim() || '';
  const body = notification.body?.trim() || '';

  const titleMatch = title.match(/^New assignment:\s*(.+)$/i);
  const bodyMatch = body.match(/^(.*?)(?:\s+[—-]\s+due\s+)(.+)$/i);
  if (titleMatch && bodyMatch) {
    return {
      assignmentTitle: titleMatch[1].trim(),
      courseTitle: bodyMatch[1].trim(),
      dueAt: new Date(bodyMatch[2].trim()),
    };
  }

  return null;
}

function parseGrade(notification: { body: string | null }) {
  const body = notification.body?.trim() || '';
  const match = body.match(/^"(.+)"\s+[·•-]?\s*([\d.]+)\/([\d.]+)$/)
    || body.match(/^"(.+)"\s+scored\s+([\d.]+)\/([\d.]+)$/i)
    || body.match(/^(.+?):\s*([\d.]+)\/([\d.]+)$/);
  if (!match) return null;

  return {
    assignmentTitle: match[1].trim(),
    score: Number(match[2]),
    maxScore: Number(match[3]),
  };
}

function parseAnnouncement(notification: { title: string; body: string | null }) {
  const title = notification.title?.trim() || '';
  const rawCourseTitle = title.replace(/^New:\s*/i, '').replace(/^New announcement:\s*/i, '').trim();
  const courseTitle = /^new announcement$/i.test(title) ? '' : rawCourseTitle;
  return {
    courseTitle,
    announcementTitle: notification.body?.trim() || title,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const notifications = await prisma.notification.findMany({
    include: {
      user: {
        select: {
          preferredLang: true,
        },
      },
    },
  });

  let updated = 0;

  for (const notification of notifications) {
    let next: { title: string; body: string } | null = null;

    if (notification.type === 'ASSIGNMENT_DUE') {
      const parsed = parseAssignment(notification);
      if (parsed && !Number.isNaN(parsed.dueAt.getTime())) {
        next = getAssignmentNotificationContent(
          parsed.assignmentTitle,
          parsed.courseTitle,
          parsed.dueAt,
          notification.user.preferredLang,
        );
      }
    } else if (notification.type === 'GRADE_PUBLISHED') {
      const parsed = parseGrade(notification);
      if (parsed) {
        next = getGradeNotificationContent(
          parsed.assignmentTitle,
          parsed.score,
          parsed.maxScore,
          notification.user.preferredLang,
        );
      }
    } else if (notification.type === 'ANNOUNCEMENT') {
      const parsed = parseAnnouncement(notification);
      if (parsed.announcementTitle) {
        next = getAnnouncementNotificationContent(
          parsed.courseTitle,
          parsed.announcementTitle,
          notification.user.preferredLang,
        );
      }
    }

    if (!next) continue;

    if (notification.title !== next.title || notification.body !== next.body) {
      if (!dryRun) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            title: next.title,
            body: next.body,
          },
        });
      }
      updated += 1;
    }
  }

  console.log(`${dryRun ? 'Would localize' : 'Localized'} ${updated} notification(s).`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
