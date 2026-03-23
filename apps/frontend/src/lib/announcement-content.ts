import type { Announcement } from '@/lib/types';

type Lang = 'en' | 'ru' | 'kz';

type AnnouncementTranslation = {
  title: string;
  body: string;
};

const DEMO_ANNOUNCEMENTS: Record<string, Record<Lang, AnnouncementTranslation>> = {
  'Welcome to Spring 2025\nCheck enrollments and schedules.': {
    en: {
      title: 'Welcome to Spring 2025',
      body: 'Check your enrollments and schedule updates.',
    },
    ru: {
      title: 'Добро пожаловать в весенний семестр 2025',
      body: 'Проверьте свои записи на курсы и обновления в расписании.',
    },
    kz: {
      title: '2025 жылғы көктемгі семестрге қош келдіңіз',
      body: 'Курсқа тіркелулеріңіз бен кестедегі жаңартуларды тексеріңіз.',
    },
  },
  'Campus Wi-Fi Maintenance\nSaturday 2-6 AM.': {
    en: {
      title: 'Campus Wi-Fi Maintenance',
      body: 'The campus Wi-Fi will be unavailable on Saturday from 2:00 AM to 6:00 AM.',
    },
    ru: {
      title: 'Технические работы с campus Wi-Fi',
      body: 'В субботу с 02:00 до 06:00 campus Wi-Fi будет недоступен.',
    },
    kz: {
      title: 'Campus Wi-Fi желісінде техникалық жұмыс',
      body: 'Сенбі күні 02:00-ден 06:00-ге дейін campus Wi-Fi қолжетімсіз болады.',
    },
  },
  'Office Hours Change\nWednesday 2-4 PM, room A-312.': {
    en: {
      title: 'Office Hours Update',
      body: 'Office hours have moved to Wednesday, 2:00 PM to 4:00 PM, room A-312.',
    },
    ru: {
      title: 'Изменение консультационных часов',
      body: 'Консультационные часы перенесены на среду, 14:00-16:00, кабинет A-312.',
    },
    kz: {
      title: 'Кеңес беру уақыты өзгерді',
      body: 'Кеңес беру уақыты сәрсенбіге, 14:00-16:00, A-312 аудиториясына ауыстырылды.',
    },
  },
  'Midterm Info\nWeek 8, Lab-102.': {
    en: {
      title: 'Midterm Information',
      body: 'The midterm is scheduled for week 8 in Lab-102.',
    },
    ru: {
      title: 'Информация о мидтерме',
      body: 'Мидтерм пройдет на 8-й неделе в аудитории Lab-102.',
    },
    kz: {
      title: 'Мидтерм туралы ақпарат',
      body: 'Мидтерм 8-аптада Lab-102 аудиториясында өтеді.',
    },
  },
  'Guest Lecture\nDr. Kim, Friday 2 PM, C-410.': {
    en: {
      title: 'Guest Lecture',
      body: 'Dr. Kim will deliver a guest lecture on Friday at 2:00 PM in room C-410.',
    },
    ru: {
      title: 'Гостевая лекция',
      body: 'Д-р Ким проведет гостевую лекцию в пятницу в 14:00, аудитория C-410.',
    },
    kz: {
      title: 'Қонақ дәрісі',
      body: 'Д-р Ким жұма күні сағат 14:00-де C-410 аудиториясында қонақ дәрісін өткізеді.',
    },
  },
};

function buildKey(title: string, body: string) {
  return `${title.trim()}\n${body.trim()}`;
}

export function getAnnouncementContent(announcement: Pick<Announcement, 'title' | 'body'>, lang: Lang) {
  const entry = DEMO_ANNOUNCEMENTS[buildKey(announcement.title, announcement.body)];
  return entry?.[lang] ?? { title: announcement.title, body: announcement.body };
}
