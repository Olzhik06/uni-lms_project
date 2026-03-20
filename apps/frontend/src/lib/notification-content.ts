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

export function getNotificationContent(notification: Notification, t: NotificationTranslations) {
  if (notification.type === 'ASSIGNMENT_DUE') {
    const assignmentTitle = notification.title.replace(/^New assignment:\s*/i, '').trim() || notification.title;
    const bodyMatch = (notification.body || '').match(/^(.*?)(?:\s+[—-]\s+due\s+)(.+)$/i);
    const course = bodyMatch?.[1]?.trim();
    const due = bodyMatch?.[2]?.trim();

    return {
      title: t.notifications.assignmentDueTitle,
      body: [
        assignmentTitle,
        course ? `${t.notifications.courseLabel}: ${course}` : '',
        due ? `${t.notifications.dueLabel}: ${due}` : notification.body || '',
      ].filter(Boolean).join(' • '),
    };
  }

  if (notification.type === 'ANNOUNCEMENT') {
    const courseTitle = notification.title.replace(/^New:\s*/i, '').trim();
    return {
      title: t.notifications.announcementTitle,
      body: [
        notification.body || '',
        courseTitle ? `${t.notifications.courseLabel}: ${courseTitle}` : '',
      ].filter(Boolean).join(' • '),
    };
  }

  if (notification.type === 'GRADE_PUBLISHED') {
    const gradeMatch = (notification.body || '').match(/^"(.+)"\s+scored\s+([\d.]+\/[\d.]+)$/i);
    const assignmentTitle = gradeMatch?.[1]?.trim();
    const score = gradeMatch?.[2]?.trim();

    return {
      title: t.notifications.gradePublishedTitle,
      body: [
        assignmentTitle || '',
        score ? `${t.notifications.scoreLabel}: ${score}` : notification.body || '',
      ].filter(Boolean).join(' • '),
    };
  }

  return {
    title: notification.title,
    body: notification.body || '',
  };
}
