'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Layers, BookOpen, UserPlus, FileText, Award, GraduationCap, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { data: stats } = useQuery<AdminStats>({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats') });

  const cards = [
    { l: 'Total Users', v: stats?.users.total ?? '-', icon: Users, href: '/admin/users', c: 'text-blue-600 bg-blue-100' },
    { l: 'Students', v: stats?.users.students ?? '-', icon: GraduationCap, href: '/admin/users', c: 'text-sky-600 bg-sky-100' },
    { l: 'Teachers', v: stats?.users.teachers ?? '-', icon: Briefcase, href: '/admin/users', c: 'text-indigo-600 bg-indigo-100' },
    { l: 'Courses', v: stats?.courses ?? '-', icon: BookOpen, href: '/admin/courses', c: 'text-purple-600 bg-purple-100' },
    { l: 'Enrollments', v: stats?.enrollments ?? '-', icon: UserPlus, href: '/admin/enrollments', c: 'text-amber-600 bg-amber-100' },
    { l: 'Assignments', v: stats?.assignments ?? '-', icon: FileText, href: '/admin/courses', c: 'text-orange-600 bg-orange-100' },
    { l: 'Submissions', v: stats?.submissions ?? '-', icon: Layers, href: '/admin/courses', c: 'text-emerald-600 bg-emerald-100' },
    { l: 'Grades', v: stats?.grades ?? '-', icon: Award, href: '/admin/courses', c: 'text-rose-600 bg-rose-100' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administration</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(s => (
          <Link key={s.l} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${s.c}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.v}</p>
                  <p className="text-sm text-muted-foreground">{s.l}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[{l:'Manage Users',h:'/admin/users'},{l:'Manage Groups',h:'/admin/groups'},{l:'Manage Enrollments',h:'/admin/enrollments'}].map(x=>(
          <Link key={x.h} href={x.h}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader><CardTitle className="text-base">{x.l}</CardTitle></CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
