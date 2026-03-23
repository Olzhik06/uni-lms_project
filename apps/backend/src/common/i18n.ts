export const APP_LANGS = ['en', 'ru', 'kz'] as const;

export type AppLang = typeof APP_LANGS[number];

const LANG_ALIASES: Record<string, AppLang> = {
  en: 'en',
  ru: 'ru',
  kk: 'kz',
  kz: 'kz',
};

const MESSAGES: Record<AppLang, Record<string, string>> = {
  en: {
    'errors.auth.invalidCredentials': 'Invalid credentials',
    'errors.auth.invalidRefreshToken': 'Invalid refresh token',
    'errors.user.emailInUse': 'Email already in use',
    'errors.user.currentPasswordIncorrect': 'Current password is incorrect',
    'errors.announcement.onlyAdminsGlobal': 'Only admins can post global announcements',
    'errors.announcement.notTeacherOfCourse': 'You are not a teacher of this course',
    'errors.course.notEnrolled': 'You are not enrolled in this course',
    'errors.enrollment.alreadyEnrolled': 'User is already enrolled in this course',
    'errors.material.onlyTeachersOrAdmins': 'Only course teachers or admins can add materials',
    'errors.common.notTeacher': 'Only course teachers can perform this action',
    'errors.ai.onlyTeachersAndAdmins': 'Only teachers and admins can generate quizzes',
    'errors.ai.ownSubmissionOnly': 'You can only get AI feedback on your own submissions',
    'errors.ai.ownAnalysisOnly': 'Students can only view their own analysis',
    'errors.ai.submissionNotFound': 'Submission not found',
    'errors.ai.courseNotFound': 'Course not found',
    'errors.ai.studentNotFound': 'Student not found',
    'errors.ai.noResponse': 'No response from AI',
    'errors.ai.failedToParseQuiz': 'Failed to parse quiz response',
    'Not Found': 'Resource not found',
    'Forbidden resource': 'You do not have access to this action',
    Unauthorized: 'Unauthorized',
    Forbidden: 'Forbidden',
    Conflict: 'Conflict',
    'Bad Request': 'Bad request',
    'Internal Server Error': 'Internal server error',
  },
  ru: {
    'errors.auth.invalidCredentials': 'Неверный логин или пароль',
    'errors.auth.invalidRefreshToken': 'Недействительный refresh token',
    'errors.user.emailInUse': 'Этот email уже используется',
    'errors.user.currentPasswordIncorrect': 'Текущий пароль указан неверно',
    'errors.announcement.onlyAdminsGlobal': 'Только администраторы могут публиковать глобальные объявления',
    'errors.announcement.notTeacherOfCourse': 'Вы не являетесь преподавателем этого курса',
    'errors.course.notEnrolled': 'Вы не записаны на этот курс',
    'errors.enrollment.alreadyEnrolled': 'Пользователь уже записан на этот курс',
    'errors.material.onlyTeachersOrAdmins': 'Материалы могут добавлять только преподаватели курса или администраторы',
    'errors.common.notTeacher': 'Это действие доступно только преподавателям курса',
    'errors.ai.onlyTeachersAndAdmins': 'Только преподаватели и администраторы могут генерировать тесты',
    'errors.ai.ownSubmissionOnly': 'AI-обратную связь можно получать только по своим работам',
    'errors.ai.ownAnalysisOnly': 'Студенты могут просматривать только собственный анализ',
    'errors.ai.submissionNotFound': 'Работа не найдена',
    'errors.ai.courseNotFound': 'Курс не найден',
    'errors.ai.studentNotFound': 'Студент не найден',
    'errors.ai.noResponse': 'AI-сервис не вернул ответ',
    'errors.ai.failedToParseQuiz': 'Не удалось обработать ответ AI с тестом',
    'Not Found': 'Ресурс не найден',
    'Forbidden resource': 'У вас нет доступа к этому действию',
    Unauthorized: 'Требуется авторизация',
    Forbidden: 'Доступ запрещен',
    Conflict: 'Конфликт данных',
    'Bad Request': 'Некорректный запрос',
    'Internal Server Error': 'Внутренняя ошибка сервера',
  },
  kz: {
    'errors.auth.invalidCredentials': 'Логин немесе құпиясөз қате',
    'errors.auth.invalidRefreshToken': 'Refresh token жарамсыз',
    'errors.user.emailInUse': 'Бұл email бұрыннан қолданылып тұр',
    'errors.user.currentPasswordIncorrect': 'Ағымдағы құпиясөз қате',
    'errors.announcement.onlyAdminsGlobal': 'Жаһандық хабарландыруларды тек әкімшілер жариялай алады',
    'errors.announcement.notTeacherOfCourse': 'Сіз бұл курстың оқытушысы емессіз',
    'errors.course.notEnrolled': 'Сіз бұл курсқа тіркелмегенсіз',
    'errors.enrollment.alreadyEnrolled': 'Пайдаланушы бұл курсқа әлдеқашан тіркелген',
    'errors.material.onlyTeachersOrAdmins': 'Материалдарды тек курс оқытушылары немесе әкімшілер қоса алады',
    'errors.common.notTeacher': 'Бұл әрекетті тек курс оқытушылары орындай алады',
    'errors.ai.onlyTeachersAndAdmins': 'Тесттерді тек оқытушылар мен әкімшілер жасай алады',
    'errors.ai.ownSubmissionOnly': 'AI пікірін тек өз жұмысыңызға ала аласыз',
    'errors.ai.ownAnalysisOnly': 'Студенттер тек өз талдауын көре алады',
    'errors.ai.submissionNotFound': 'Жұмыс табылмады',
    'errors.ai.courseNotFound': 'Курс табылмады',
    'errors.ai.studentNotFound': 'Студент табылмады',
    'errors.ai.noResponse': 'AI сервисі жауап бермеді',
    'errors.ai.failedToParseQuiz': 'AI тест жауабын өңдеу мүмкін болмады',
    'Not Found': 'Ресурс табылмады',
    'Forbidden resource': 'Бұл әрекетке рұқсат жоқ',
    Unauthorized: 'Авторизация қажет',
    Forbidden: 'Қол жеткізуге тыйым салынған',
    Conflict: 'Деректер қақтығысы',
    'Bad Request': 'Сұраныс қате',
    'Internal Server Error': 'Сервердің ішкі қатесі',
  },
};

export function resolveLang(value?: string | string[]): AppLang {
  const raw = Array.isArray(value) ? value[0] : value;
  const primary = raw?.split(',')[0]?.trim().toLowerCase();
  const base = primary?.split('-')[0];
  return (base && LANG_ALIASES[base]) || 'en';
}

export function translateBackendMessage(message: string, lang: AppLang) {
  return MESSAGES[lang][message] ?? message;
}

export function localizeBackendMessage(message: unknown, lang: AppLang): unknown {
  if (Array.isArray(message)) {
    return message.map(item => typeof item === 'string' ? translateBackendMessage(item, lang) : item);
  }

  if (typeof message === 'string') {
    return translateBackendMessage(message, lang);
  }

  return message;
}
