'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Layers, BookOpen, UserPlus, FileText, Award, GraduationCap, Briefcase, BarChart2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function AdminPage() {
  const t = useT();
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats'),
  });

  const cards = [
    { l: t.admin.totalUsers,  v: stats?.users.total ?? '—',      icon: Users,        href: '/admin/users',       c: 'text-blue-600 bg-blue-100'    },
    { l: t.admin.students,    v: stats?.users.students ?? '—',   icon: GraduationCap,href: '/admin/users',       c: 'text-sky-600 bg-sky-100'      },
    { l: t.admin.teachers,    v: stats?.users.teachers ?? '—',   icon: Briefcase,    href: '/admin/users',       c: 'text-indigo-600 bg-indigo-100' },
    { l: t.admin.courses,     v: stats?.courses ?? '—',           icon: BookOpen,     href: '/admin/courses',     c: 'text-purple-600 bg-purple-100' },
    { l: t.admin.enrollments, v: stats?.enrollments ?? '—',       icon: UserPlus,     href: '/admin/enrollments', c: 'text-amber-600 bg-amber-100'  },
    { l: t.admin.assignments, v: stats?.assignments ?? '—',       icon: FileText,     href: '/admin/courses',     c: 'text-orange-600 bg-orange-100' },
    { l: t.admin.submissions, v: stats?.submissions ?? '—',       icon: Layers,       href: '/admin/courses',     c: 'text-emerald-600 bg-emerald-100' },
    { l: t.admin.grades,      v: stats?.grades ?? '—',            icon: Award,        href: '/admin/courses',     c: 'text-rose-600 bg-rose-100'    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">{t.admin.title}</h1>

      {/* Core stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(s => (
          <Link key={s.l} href={s.href}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="pt-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.c}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-serif">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
              <BarChart2 className="h-5 w-5"/>
            </div>
            <div>
              <p className="text-2xl font-bold font-serif">
                {stats?.avgGrade !== null && stats?.avgGrade !== undefined ? `${stats.avgGrade} pts` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">{t.admin.avgGrade}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5"/>
            </div>
            <div>
              <p className="text-2xl font-bold font-serif">
                {stats?.attendanceRate !== null && stats?.attendanceRate !== undefined ? `${stats.attendanceRate}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">{t.admin.attendance}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick navigation */}
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { l: t.admin.manageUsers,       h: '/admin/users' },
          { l: t.admin.manageCourses,     h: '/admin/courses' },
          { l: t.admin.manageGroups,      h: '/admin/groups' },
          { l: t.admin.manageEnrollments, h: '/admin/enrollments' },
        ].map(x => (
          <Link key={x.h} href={x.h}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardHeader><CardTitle className="text-sm font-medium">{x.l}</CardTitle></CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
