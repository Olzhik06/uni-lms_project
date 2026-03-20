'use client';
import { useMe } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ScheduleItem, Announcement, Grade, Notification as N, Assignment } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/form-elements';
import { formatTime, formatDate } from '@/lib/utils';
import { Clock, Bell, Award, BookOpen, Calendar, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { stagger, item } from '@/lib/motion';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { useT } from '@/lib/i18n';

function weekRange() {
  const now = new Date();
  const d = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (d === 0 ? 6 : d - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { from: mon.toISOString(), to: sun.toISOString() };
}

const TC: Record<string, string> = {
  LECTURE:  'bg-blue-50 text-blue-700 border border-blue-100',
  PRACTICE: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  LAB:      'bg-violet-50 text-violet-700 border border-violet-100',
  EXAM:     'bg-red-50 text-red-700 border border-red-100',
};

export default function DashboardPage() {
  const { data: user } = useMe();
  const t = useT();
  const wk = weekRange();

  const { data: schedule, isLoading: sl } = useQuery<ScheduleItem[]>({
    queryKey: ['sched', wk.from],
    queryFn: () => api.get(`/me/schedule?from=${wk.from}&to=${wk.to}`),
  });
  const { data: anns, isLoading: al } = useQuery<Announcement[]>({
    queryKey: ['anns'],
    queryFn: () => api.get('/announcements'),
  });
  const { data: notifs } = useQuery<N[]>({
    queryKey: ['notifs'],
    queryFn: () => api.get('/me/notifications'),
  });
  const { data: grades } = useQuery<Grade[]>({
    queryKey: ['my-grades'],
    queryFn: () => api.get('/me/grades'),
    enabled: user?.role === 'STUDENT',
  });
  const { data: upcomingAssignments } = useQuery<Assignment[]>({
    queryKey: ['upcoming-assignments'],
    queryFn: async () => {
      const courses = await api.get<any[]>('/courses');
      const all: Assignment[] = [];
      for (const c of (courses || []).slice(0, 5)) {
        try { const a = await api.get<Assignment[]>(`/courses/${c.id}/assignments`); all.push(...a); } catch {}
      }
      return all
        .filter(a => new Date(a.dueAt) > new Date())
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
        .slice(0, 5);
    },
    enabled: user?.role === 'STUDENT',
  });

  const today = new Date().toDateString();
  const todayClasses = (schedule || [])
    .filter(s => new Date(s.startsAt).toDateString() === today)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const unread = (notifs || []).filter(n => !n.isRead).slice(0, 5);

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Hero banner with background image */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          {/* Dark desaturating overlay */}
          <div className="absolute inset-0 bg-foreground/75 backdrop-saturate-[0.3]" />
          {/* Gradient vignette for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/30 via-transparent to-transparent" />
        </div>

        <div className="relative px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-primary-foreground/60 text-xs font-medium uppercase tracking-widest mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-serif text-3xl font-semibold text-primary-foreground">
              {t.dashboard.welcomeBack}, {user?.fullName?.split(' ')[0]}
            </h1>
            <p className="text-primary-foreground/60 mt-1 text-sm">{t.dashboard.subtitle}</p>
          </motion.div>
        </div>
      </div>

      {/* Widget grid — staggered */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        {/* Today's Classes */}
        <motion.div variants={item}>
          <Card className="h-full hover:-translate-y-1 hover:shadow-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> {t.dashboard.todayClasses}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sl ? (
                <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : todayClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t.dashboard.noClasses}</p>
              ) : (
                <div className="space-y-3">
                  {todayClasses.map(s => (
                    <div key={s.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className="text-center min-w-[44px]">
                        <p className="text-xs font-semibold">{formatTime(s.startsAt)}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(s.endsAt)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.course?.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TC[s.type] || ''}`}>{s.type}</span>
                          <span className="text-xs text-muted-foreground">{s.room}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Announcements */}
        <motion.div variants={item}>
          <Card className="h-full hover:-translate-y-1 hover:shadow-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <Bell className="h-3.5 w-3.5" /> {t.dashboard.announcements}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {al ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (anns || []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t.dashboard.noAnnouncements}</p>
              ) : (
                <div className="space-y-3">
                  {(anns || []).slice(0, 5).map(a => (
                    <div key={a.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                      <p className="text-sm font-medium">{a.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{a.author?.fullName}</span>
                        {a.course
                          ? <Badge variant="secondary" className="text-[10px]">{a.course.code}</Badge>
                          : <Badge variant="outline" className="text-[10px]">Global</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={item}>
          <Card className="h-full hover:-translate-y-1 hover:shadow-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <Bell className="h-3.5 w-3.5" /> {t.dashboard.notifications}
                {unread.length > 0 && (
                  <Badge variant="destructive" className="ml-auto text-[10px]">{unread.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unread.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">{t.dashboard.allCaughtUp}</p>
              ) : (
                <div className="space-y-2">
                  {unread.map(n => (
                    <Link key={n.id} href={n.link || '#'} className="block p-3 rounded-md bg-accent/60 hover:bg-accent transition-colors">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Assignments (students) */}
        {user?.role === 'STUDENT' && (
          <motion.div variants={item}>
            <Card className="h-full hover:-translate-y-1 hover:shadow-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                  <ClipboardList className="h-3.5 w-3.5" /> {t.dashboard.upcoming}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(upcomingAssignments || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">{t.dashboard.noUpcoming}</p>
                ) : (
                  <div className="space-y-3">
                    {(upcomingAssignments || []).map(a => (
                      <Link key={a.id} href={`/courses/${a.courseId}/assignments`} className="block border-b border-border last:border-0 pb-3 last:pb-0 hover:opacity-75 transition-opacity">
                        <p className="text-sm font-medium">{a.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{t.common.due} {formatDate(a.dueAt)}</span>
                          {a.course && <Badge variant="secondary" className="text-[10px]">{a.course.code}</Badge>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Grades (students) */}
        {user?.role === 'STUDENT' && (
          <motion.div variants={item}>
            <Card className="h-full hover:-translate-y-1 hover:shadow-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                  <Award className="h-3.5 w-3.5" /> {t.dashboard.recentGrades}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(grades || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">{t.dashboard.noGrades}</p>
                ) : (
                  <div className="space-y-3">
                    {(grades || []).slice(0, 4).map(g => (
                      <div key={g.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{g.submission?.assignment?.title}</p>
                          <p className="text-xs text-muted-foreground">{g.submission?.assignment?.course?.code}</p>
                        </div>
                        <p className="text-sm font-semibold text-primary ml-3">{g.score} {t.common.of} {g.submission?.assignment?.maxScore}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Links */}
        <motion.div variants={item}>
          <Card className="h-full hover:-translate-y-1 hover:shadow-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" /> {t.dashboard.quickLinks}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { h: '/courses',       l: t.nav.courses,       i: BookOpen },
                  { h: '/schedule',      l: t.nav.schedule,      i: Calendar },
                  { h: '/calendar',      l: t.nav.calendar,      i: Calendar },
                  { h: '/notifications', l: t.nav.notifications, i: Bell },
                ].map(x => (
                  <Link key={x.h} href={x.h} className="flex items-center gap-2 p-3 rounded-md border border-border hover:bg-muted hover:-translate-y-0.5 transition-all duration-200 text-sm font-medium">
                    <x.i className="h-4 w-4 text-primary" />
                    {x.l}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
