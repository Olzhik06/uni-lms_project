'use client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMe } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import type {
  AdminStats,
  Announcement,
  Assignment,
  Course,
  Grade,
  GradeStats,
  Notification as N,
  ScheduleItem,
  Submission,
} from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/form-elements';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  LayoutDashboard,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { item, stagger } from '@/lib/motion';
import { useLanguage, useT } from '@/lib/i18n';
import { getNotificationContent } from '@/lib/notification-content';

const SCHEDULE_COLORS: Record<string, string> = {
  LECTURE: 'bg-blue-50 text-blue-700 border border-blue-100',
  PRACTICE: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  LAB: 'bg-violet-50 text-violet-700 border border-violet-100',
  EXAM: 'bg-red-50 text-red-700 border border-red-100',
};

const LOCALES = {
  en: 'en-US',
  ru: 'ru-RU',
  kz: 'kk-KZ',
} as const;

type TeacherDashboardData = {
  courses: Course[];
  assignments: Assignment[];
  pendingSubmissions: Submission[];
  courseStats: Array<{
    courseId: string;
    courseTitle: string;
    courseCode: string;
    courseAverage: number | null;
    gradedCount: number;
    assignmentsCount: number;
  }>;
};

function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { from: monday.toISOString(), to: sunday.toISOString() };
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full hover:-translate-y-1 hover:shadow-lift">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="hover:-translate-y-1 hover:shadow-lift">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: user } = useMe();
  const t = useT();
  const { lang } = useLanguage();
  const wk = weekRange();
  const locale = LOCALES[lang];

  const { data: schedule, isLoading: scheduleLoading } = useQuery<ScheduleItem[]>({
    queryKey: ['sched', wk.from],
    queryFn: () => api.get(`/me/schedule?from=${wk.from}&to=${wk.to}`),
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ['anns'],
    queryFn: () => api.get('/announcements'),
  });

  const { data: notifications = [] } = useQuery<N[]>({
    queryKey: ['notifs'],
    queryFn: () => api.get('/me/notifications'),
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['my-grades'],
    queryFn: () => api.get('/me/grades'),
    enabled: user?.role === 'STUDENT',
  });

  const { data: upcomingAssignments = [] } = useQuery<Assignment[]>({
    queryKey: ['upcoming-assignments'],
    queryFn: async () => {
      const courses = await api.get<Course[]>('/courses');
      const allAssignments = await Promise.all(
        (courses || []).slice(0, 5).map(course => api.get<Assignment[]>(`/courses/${course.id}/assignments`).catch(() => [])),
      );
      return allAssignments.flat()
        .filter(assignment => new Date(assignment.dueAt) > new Date())
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
        .slice(0, 5);
    },
    enabled: user?.role === 'STUDENT',
  });

  const { data: teacherData, isLoading: teacherLoading } = useQuery<TeacherDashboardData>({
    queryKey: ['teacher-dashboard'],
    queryFn: async () => {
      const courses = (await api.get<Course[]>('/courses')).filter(course => course.roleInCourse === 'TEACHER');
      const assignmentLists = await Promise.all(
        courses.map(course => api.get<Assignment[]>(`/courses/${course.id}/assignments`).catch(() => [])),
      );
      const assignments = assignmentLists.flat();

      const submissionLists = await Promise.all(
        assignments.map(assignment => api.get<Submission[]>(`/assignments/${assignment.id}/submissions`).catch(() => [])),
      );
      const pendingSubmissions = submissionLists.flat().filter(submission => !submission.grade);

      const stats = await Promise.all(
        courses.map(course => api.get<GradeStats>(`/courses/${course.id}/grades/stats`).catch(() => null)),
      );

      const courseStats = courses.map((course, index) => {
        const gradeStats = stats[index];
        return {
          courseId: course.id,
          courseTitle: course.title,
          courseCode: course.code,
          courseAverage: gradeStats?.courseAverage ?? null,
          gradedCount: gradeStats?.assignments.reduce((sum, item) => sum + item.gradedCount, 0) ?? 0,
          assignmentsCount: assignmentLists[index]?.length ?? 0,
        };
      });

      return { courses, assignments, pendingSubmissions, courseStats };
    },
    enabled: user?.role === 'TEACHER',
  });

  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => api.get('/admin/stats'),
    enabled: user?.role === 'ADMIN',
  });

  const today = new Date().toDateString();
  const todayClasses = useMemo(
    () => (schedule || [])
      .filter(item => new Date(item.startsAt).toDateString() === today)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [schedule, today],
  );

  const unreadNotifications = notifications.filter(notification => !notification.isRead).slice(0, 5);
  const heroSubtitle = user?.role === 'TEACHER'
    ? t.dashboard.teacherSubtitle
    : user?.role === 'ADMIN'
      ? t.dashboard.adminSubtitle
      : t.dashboard.subtitle;

  const quickLinks = user?.role === 'ADMIN'
    ? [
        { href: '/admin', label: t.admin.title, icon: Shield },
        { href: '/courses', label: t.nav.courses, icon: BookOpen },
        { href: '/activity', label: t.nav.activity, icon: LayoutDashboard },
        { href: '/notifications', label: t.nav.notifications, icon: Bell },
      ]
    : user?.role === 'TEACHER'
      ? [
          { href: '/courses', label: t.nav.courses, icon: BookOpen },
          { href: '/schedule', label: t.nav.schedule, icon: Calendar },
          { href: '/activity', label: t.nav.activity, icon: LayoutDashboard },
          { href: '/search', label: t.nav.search, icon: Search },
        ]
      : [
          { href: '/courses', label: t.nav.courses, icon: BookOpen },
          { href: '/schedule', label: t.nav.schedule, icon: Calendar },
          { href: '/calendar', label: t.nav.calendar, icon: Calendar },
          { href: '/notifications', label: t.nav.notifications, icon: Bell },
        ];

  const roleTitleLabel = user?.role === 'ADMIN'
    ? t.profile.roleAdmin
    : user?.role === 'TEACHER'
      ? t.profile.roleTeacher
      : t.profile.roleStudent;

  return (
    <div className="max-w-6xl space-y-8">
      <div className="relative overflow-hidden rounded-xl">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-foreground/75 backdrop-saturate-[0.3]" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/30 via-transparent to-transparent" />
        </div>

        <div className="relative px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-foreground/60">
              {new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-3xl font-semibold text-primary-foreground">
                {t.dashboard.welcomeBack}, {user?.fullName?.split(' ')[0]}
              </h1>
              {user && <Badge variant="outline" className="border-white/20 text-primary-foreground/80">{roleTitleLabel}</Badge>}
            </div>
            <p className="mt-1 text-sm text-primary-foreground/60">{heroSubtitle}</p>
          </motion.div>
        </div>
      </div>

      {user?.role === 'ADMIN' && adminStats && (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <motion.div variants={item}><StatTile label={t.dashboard.totalUsers} value={adminStats.users.total} /></motion.div>
          <motion.div variants={item}><StatTile label={t.admin.courses} value={adminStats.courses} /></motion.div>
          <motion.div variants={item}><StatTile label={t.admin.assignments} value={adminStats.assignments} /></motion.div>
          <motion.div variants={item}><StatTile label={t.admin.submissions} value={adminStats.submissions} /></motion.div>
        </motion.div>
      )}

      {user?.role === 'TEACHER' && (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <motion.div variants={item}>
            <StatTile label={t.dashboard.myCourses} value={teacherLoading ? '...' : teacherData?.courses.length ?? 0} />
          </motion.div>
          <motion.div variants={item}>
            <StatTile label={t.dashboard.totalAssignments} value={teacherLoading ? '...' : teacherData?.assignments.length ?? 0} />
          </motion.div>
          <motion.div variants={item}>
            <StatTile label={t.dashboard.pendingReviews} value={teacherLoading ? '...' : teacherData?.pendingSubmissions.length ?? 0} />
          </motion.div>
          <motion.div variants={item}>
            <StatTile
              label={t.dashboard.gradedSubmissions}
              value={teacherLoading ? '...' : teacherData?.courseStats.reduce((sum, stat) => sum + stat.gradedCount, 0) ?? 0}
            />
          </motion.div>
        </motion.div>
      )}

      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <motion.div variants={item}>
          <SectionCard title={t.dashboard.todayClasses} icon={Clock}>
            {scheduleLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : todayClasses.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.noClasses}</p>
            ) : (
              <div className="space-y-3">
                {todayClasses.map(item => (
                  <div key={item.id} className="flex items-start gap-3 border-b border-border py-2 last:border-0">
                    <div className="min-w-[44px] text-center">
                      <p className="text-xs font-semibold">{formatTime(item.startsAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(item.endsAt)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.course?.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SCHEDULE_COLORS[item.type] || ''}`}>{item.type}</span>
                        <span className="text-xs text-muted-foreground">{item.room}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>

        <motion.div variants={item}>
          <SectionCard title={t.dashboard.announcements} icon={Bell}>
            {announcementsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (announcements || []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.noAnnouncements}</p>
            ) : (
              <div className="space-y-3">
                {(announcements || []).slice(0, 5).map(announcement => (
                  <div key={announcement.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium">{announcement.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{announcement.author?.fullName}</span>
                      {announcement.course
                        ? <Badge variant="secondary" className="text-[10px]">{announcement.course.code}</Badge>
                        : <Badge variant="outline" className="text-[10px]">{t.dashboard.global}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>

        <motion.div variants={item}>
          <SectionCard title={t.dashboard.notifications} icon={Bell}>
            {unreadNotifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.allCaughtUp}</p>
            ) : (
              <div className="space-y-2">
                {unreadNotifications.map(notification => (
                  (() => {
                    const content = getNotificationContent(notification, t);
                    return (
                      <Link key={notification.id} href={notification.link || '#'} className="block rounded-md bg-accent/60 p-3 transition-colors hover:bg-accent">
                        <p className="text-sm font-medium">{content.title}</p>
                        {content.body && <p className="mt-0.5 truncate text-xs text-muted-foreground">{content.body}</p>}
                      </Link>
                    );
                  })()
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>

        {user?.role === 'STUDENT' && (
          <>
            <motion.div variants={item}>
              <SectionCard title={t.dashboard.upcoming} icon={ClipboardList}>
                {upcomingAssignments.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.noUpcoming}</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingAssignments.map(assignment => (
                      <Link key={assignment.id} href={`/courses/${assignment.courseId}/assignments`} className="block border-b border-border pb-3 last:border-0 last:pb-0 transition-opacity hover:opacity-75">
                        <p className="text-sm font-medium">{assignment.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{t.common.due} {formatDate(assignment.dueAt)}</span>
                          {assignment.course && <Badge variant="secondary" className="text-[10px]">{assignment.course.code}</Badge>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </SectionCard>
            </motion.div>

            <motion.div variants={item}>
              <SectionCard title={t.dashboard.recentGrades} icon={Award}>
                {grades.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.noGrades}</p>
                ) : (
                  <div className="space-y-3">
                    {grades.slice(0, 4).map(grade => (
                      <div key={grade.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{grade.submission?.assignment?.title}</p>
                          <p className="text-xs text-muted-foreground">{grade.submission?.assignment?.course?.code}</p>
                        </div>
                        <p className="ml-3 text-sm font-semibold text-primary">{grade.score} {t.common.of} {grade.submission?.assignment?.maxScore}</p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </motion.div>
          </>
        )}

        {user?.role === 'TEACHER' && (
          <>
            <motion.div variants={item}>
              <SectionCard title={t.dashboard.pendingReviews} icon={ClipboardList}>
                {teacherLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !teacherData || teacherData.pendingSubmissions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.teacherReviewEmpty}</p>
                ) : (
                  <div className="space-y-3">
                    {teacherData.pendingSubmissions.slice(0, 5).map(submission => (
                      <div key={submission.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                        <p className="text-sm font-medium">{submission.student?.fullName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{submission.student?.email}</p>
                        {submission.contentText && <p className="mt-1 truncate text-xs text-muted-foreground">{submission.contentText}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </motion.div>

            <motion.div variants={item}>
              <SectionCard title={t.dashboard.coursePerformance} icon={CheckCircle2}>
                {teacherLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !teacherData || teacherData.courseStats.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.noCourseStats}</p>
                ) : (
                  <div className="space-y-3">
                    {teacherData.courseStats.slice(0, 5).map(stat => (
                      <div key={stat.courseId} className="border-b border-border pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{stat.courseTitle}</p>
                            <p className="text-xs text-muted-foreground">{stat.courseCode}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {stat.courseAverage !== null ? `${t.dashboard.courseAverage}: ${stat.courseAverage}` : '—'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {stat.gradedCount} {t.dashboard.gradedSubmissions.toLowerCase()} - {stat.assignmentsCount} {t.dashboard.totalAssignments.toLowerCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </motion.div>
          </>
        )}

        {user?.role === 'ADMIN' && adminStats && (
          <>
            <motion.div variants={item}>
              <SectionCard title={t.dashboard.platformStats} icon={Shield}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t.admin.students}</p>
                    <p className="mt-1 text-xl font-semibold">{adminStats.users.students}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t.admin.teachers}</p>
                    <p className="mt-1 text-xl font-semibold">{adminStats.users.teachers}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t.admin.enrollments}</p>
                    <p className="mt-1 text-xl font-semibold">{adminStats.enrollments}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t.admin.grades}</p>
                    <p className="mt-1 text-xl font-semibold">{adminStats.grades}</p>
                  </div>
                </div>
              </SectionCard>
            </motion.div>

            <motion.div variants={item}>
              <SectionCard title={t.dashboard.platformHealth} icon={Users}>
                <div className="space-y-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t.dashboard.avgGrade}</p>
                    <p className="mt-1 text-xl font-semibold">{adminStats.avgGrade ?? '—'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t.dashboard.attendanceRate}</p>
                    <p className="mt-1 text-xl font-semibold">{adminStats.attendanceRate !== null && adminStats.attendanceRate !== undefined ? `${adminStats.attendanceRate}%` : '—'}</p>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          </>
        )}

        <motion.div variants={item}>
          <SectionCard title={t.dashboard.quickLinks} icon={BookOpen}>
            <div className="grid grid-cols-2 gap-2">
              {quickLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-md border border-border p-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted"
                >
                  <link.icon className="h-4 w-4 text-primary" />
                  {link.label}
                </Link>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
