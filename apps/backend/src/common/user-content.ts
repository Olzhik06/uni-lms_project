import { AppLang, resolveLang } from './i18n';

const LOCALES: Record<AppLang, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  kz: 'kk-KZ',
};

function langOf(value?: string | null) {
  return resolveLang(value ?? 'en');
}

function formatDate(date: Date, lang: AppLang) {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function getAssignmentNotificationContent(
  assignmentTitle: string,
  courseTitle: string,
  dueAt: Date,
  preferredLang?: string | null,
) {
  const lang = langOf(preferredLang);
  const dueDate = formatDate(dueAt, lang);

  if (lang === 'ru') {
    return {
      title: `Новое задание: ${assignmentTitle}`,
      body: `${courseTitle} · срок до ${dueDate}`,
    };
  }

  if (lang === 'kz') {
    return {
      title: `Жаңа тапсырма: ${assignmentTitle}`,
      body: `${courseTitle} · тапсыру мерзімі ${dueDate}`,
    };
  }

  return {
    title: `New assignment: ${assignmentTitle}`,
    body: `${courseTitle} · due ${dueDate}`,
  };
}

export function getAnnouncementNotificationContent(
  courseTitle: string,
  announcementTitle: string,
  preferredLang?: string | null,
) {
  const lang = langOf(preferredLang);

  if (lang === 'ru') {
    return {
      title: `Новое объявление: ${courseTitle}`,
      body: announcementTitle,
    };
  }

  if (lang === 'kz') {
    return {
      title: `Жаңа хабарландыру: ${courseTitle}`,
      body: announcementTitle,
    };
  }

  return {
    title: `New announcement: ${courseTitle}`,
    body: announcementTitle,
  };
}

export function getGradeNotificationContent(
  assignmentTitle: string,
  score: number,
  maxScore: number,
  preferredLang?: string | null,
) {
  const lang = langOf(preferredLang);

  if (lang === 'ru') {
    return {
      title: 'Оценка опубликована',
      body: `"${assignmentTitle}" · ${score}/${maxScore}`,
    };
  }

  if (lang === 'kz') {
    return {
      title: 'Баға жарияланды',
      body: `"${assignmentTitle}" · ${score}/${maxScore}`,
    };
  }

  return {
    title: 'Grade published',
    body: `"${assignmentTitle}" · ${score}/${maxScore}`,
  };
}

export function getAssignmentEmailContent(
  assignmentTitle: string,
  courseTitle: string,
  dueAt: Date,
  preferredLang?: string | null,
) {
  const lang = langOf(preferredLang);
  const dueDate = formatDate(dueAt, lang);

  if (lang === 'ru') {
    return {
      subject: `Новое задание: ${assignmentTitle}`,
      html: `<p>В курсе <strong>${courseTitle}</strong> появилось новое задание <strong>${assignmentTitle}</strong>.</p><p>Срок сдачи: <strong>${dueDate}</strong></p>`,
    };
  }

  if (lang === 'kz') {
    return {
      subject: `Жаңа тапсырма: ${assignmentTitle}`,
      html: `<p><strong>${courseTitle}</strong> курсында <strong>${assignmentTitle}</strong> атты жаңа тапсырма пайда болды.</p><p>Тапсыру мерзімі: <strong>${dueDate}</strong></p>`,
    };
  }

  return {
    subject: `New assignment: ${assignmentTitle}`,
    html: `<p>A new assignment <strong>${assignmentTitle}</strong> has been added to <strong>${courseTitle}</strong>.</p><p>Due date: <strong>${dueDate}</strong></p>`,
  };
}

export function getDeadlineReminderNotificationContent(
  assignmentTitle: string,
  courseTitle: string,
  hoursLeft: number,
  preferredLang?: string | null,
) {
  const lang = langOf(preferredLang);
  const timeRu = hoursLeft === 1 ? '1 часа' : '24 часов';
  const timeKz = hoursLeft === 1 ? '1 сағат' : '24 сағат';
  const timeEn = hoursLeft === 1 ? '1 hour' : '24 hours';

  if (lang === 'ru') {
    return { title: `Дедлайн через ${timeRu}`, body: `"${assignmentTitle}" · ${courseTitle}` };
  }
  if (lang === 'kz') {
    return { title: `Дедлайн ${timeKz} ішінде`, body: `"${assignmentTitle}" · ${courseTitle}` };
  }
  return { title: `Deadline in ${timeEn}`, body: `"${assignmentTitle}" · ${courseTitle}` };
}

export function getDeadlineReminderEmailContent(
  assignmentTitle: string,
  courseTitle: string,
  dueAt: Date,
  hoursLeft: number,
  preferredLang?: string | null,
) {
  const lang = langOf(preferredLang);
  const dueDate = formatDate(dueAt, lang);
  const timeRu = hoursLeft === 1 ? '1 часа' : '24 часов';
  const timeKz = hoursLeft === 1 ? '1 сағат' : '24 сағат';
  const timeEn = hoursLeft === 1 ? '1 hour' : '24 hours';

  if (lang === 'ru') {
    return {
      subject: `Дедлайн через ${timeRu}: ${assignmentTitle}`,
      html: `<p>Через <strong>${timeRu}</strong> заканчивается срок сдачи задания <strong>${assignmentTitle}</strong> в курсе <strong>${courseTitle}</strong>.</p><p>Срок: <strong>${dueDate}</strong></p>`,
    };
  }
  if (lang === 'kz') {
    return {
      subject: `Дедлайн ${timeKz} ішінде: ${assignmentTitle}`,
      html: `<p><strong>${courseTitle}</strong> курсындағы <strong>${assignmentTitle}</strong> тапсырмасының мерзімі <strong>${timeKz}</strong> ішінде аяқталады.</p><p>Мерзім: <strong>${dueDate}</strong></p>`,
    };
  }
  return {
    subject: `Deadline in ${timeEn}: ${assignmentTitle}`,
    html: `<p>Your assignment <strong>${assignmentTitle}</strong> in <strong>${courseTitle}</strong> is due in <strong>${timeEn}</strong>.</p><p>Due: <strong>${dueDate}</strong></p>`,
  };
}

export function getGradeEmailContent(
  assignmentTitle: string,
  score: number,
  maxScore: number,
  feedback?: string | null,
  preferredLang?: string | null,
) {
  const lang = langOf(preferredLang);

  if (lang === 'ru') {
    return {
      subject: `Оценка опубликована: ${assignmentTitle}`,
      html: `<p>Работа <strong>${assignmentTitle}</strong> проверена.</p><p>Результат: <strong>${score} / ${maxScore}</strong></p>${feedback ? `<p>Комментарий: ${feedback}</p>` : ''}`,
    };
  }

  if (lang === 'kz') {
    return {
      subject: `Баға жарияланды: ${assignmentTitle}`,
      html: `<p><strong>${assignmentTitle}</strong> жұмысы тексерілді.</p><p>Нәтиже: <strong>${score} / ${maxScore}</strong></p>${feedback ? `<p>Пікір: ${feedback}</p>` : ''}`,
    };
  }

  return {
    subject: `Grade published: ${assignmentTitle}`,
    html: `<p>Your assignment <strong>${assignmentTitle}</strong> has been graded.</p><p>Score: <strong>${score} / ${maxScore}</strong></p>${feedback ? `<p>Feedback: ${feedback}</p>` : ''}`,
  };
}
