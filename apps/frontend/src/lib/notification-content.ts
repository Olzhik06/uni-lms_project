import type { Notification } from '@/lib/types';

type NotificationTranslations = {
  notifications: {
    assignmentDueTitle: string;
    announcementTitle: string;
    gradePublishedTitle: string;
    courseLabel: string;
    dueLabel: string;
    scoreLabel: string;
  };
};

function isGenericAssignmentTitle(title: string) {
  return /^(new assignment|due soon)$/i.test(title.trim());
}

function parseAssignmentBody(body: string) {
  const withCourse = body.match(/^(.*?)(?:\s+[—-]\s+due\s+)(.+)$/i);
  if (withCourse) {
    return {
      assignmentTitle: '',
      course: withCourse[1]?.trim() || '',
      due: withCourse[2]?.trim() || '',
    };
  }

  const legacy = body.match(/^(.*?)(?:\s+[—-]\s+)(.+)$/);
  if (legacy) {
    return {
      assignmentTitle: legacy[1]?.trim() || '',
      course: '',
      due: legacy[2]?.trim() || '',
    };
  }

  return {
    assignmentTitle: '',
    course: '',
    due: '',
  };
}

function parseGradeBody(body: string) {
  const modern = body.match(/^"(.+)"\s+[·•-]?\s*([\d.]+\/[\d.]+)$/i) || body.match(/^"(.+)"\s+scored\s+([\d.]+\/[\d.]+)$/i);
  if (modern) {
    return {
      assignmentTitle: modern[1]?.trim() || '',
      score: modern[2]?.trim() || '',
    };
  }

  const legacy = body.match(/^(.+?):\s*([\d.]+\/[\d.]+)$/);
  if (legacy) {
    return {
      assignmentTitle: legacy[1]?.trim() || '',
      score: legacy[2]?.trim() || '',
    };
  }

  return {
    assignmentTitle: '',
    score: '',
  };
}

export function getNotificationContent(notification: Notification, t: NotificationTranslations) {
  if (notification.type === 'ASSIGNMENT_DUE') {
    const parsedBody = parseAssignmentBody(notification.body || '');
    const rawTitle = notification.title.trim();
    const assignmentTitle = isGenericAssignmentTitle(rawTitle)
      ? parsedBody.assignmentTitle || ''
      : rawTitle.replace(/^New assignment:\s*/i, '').trim() || rawTitle;

    return {
      title: t.notifications.assignmentDueTitle,
      body: [
        assignmentTitle,
        parsedBody.course ? `${t.notifications.courseLabel}: ${parsedBody.course}` : '',
        parsedBody.due ? `${t.notifications.dueLabel}: ${parsedBody.due}` : notification.body || '',
      ].filter(Boolean).join(' • '),
    };
  }

  if (notification.type === 'ANNOUNCEMENT') {
    const rawTitle = notification.title.trim();
    const courseTitle = /^(new announcement)$/i.test(rawTitle)
      ? ''
      : rawTitle.replace(/^New:\s*/i, '').replace(/^New announcement:\s*/i, '').trim();
    return {
      title: t.notifications.announcementTitle,
      body: [
        notification.body || '',
        courseTitle ? `${t.notifications.courseLabel}: ${courseTitle}` : '',
      ].filter(Boolean).join(' • '),
    };
  }

  if (notification.type === 'GRADE_PUBLISHED') {
    const grade = parseGradeBody(notification.body || '');

    return {
      title: t.notifications.gradePublishedTitle,
      body: [
        grade.assignmentTitle || '',
        grade.score ? `${t.notifications.scoreLabel}: ${grade.score}` : notification.body || '',
      ].filter(Boolean).join(' • '),
    };
  }

  return {
    title: notification.title,
    body: notification.body || '',
  };
}
