'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { Course, CourseProgress } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/form-elements';
import { Users, FileText } from 'lucide-react';
import Link from 'next/link';

const colors = ['from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-purple-500 to-purple-600', 'from-amber-500 to-amber-600', 'from-rose-500 to-rose-600'];

function ProgressBar({ courseId }: { courseId: string }) {
  const { data } = useQuery<CourseProgress>({
    queryKey: ['progress', courseId],
    queryFn: () => api.get(`/courses/${courseId}/progress`),
  });
  if (!data) return null;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Progress</span>
        <span>{data.completedAssignments}/{data.totalAssignments}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${data.progress}%` }} />
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const { data: user } = useMe();
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: () => api.get('/courses') });
  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">Enrolled courses this semester</p>
      </div>
      {isLoading
        ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl"/>)}</div>
        : !courses?.length
          ? <Card><CardContent className="py-12 text-center text-muted-foreground">No courses found</CardContent></Card>
          : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((c, i) => (
                <Link key={c.id} href={`/courses/${c.id}/overview`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className={`h-24 bg-gradient-to-r ${colors[i % colors.length]} p-4 flex flex-col justify-end`}>
                      <h3 className="text-white font-bold text-lg">{c.code}</h3>
                      <p className="text-white/80 text-sm truncate">{c.title}</p>
                    </div>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {c.teacher && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5"/>{c.teacher.fullName}</span>}
                        {c._count && <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5"/>{c._count.assignments} assignments</span>}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Badge variant="secondary">{c.semester}</Badge>
                        {c.roleInCourse && <Badge variant={c.roleInCourse === 'TEACHER' ? 'default' : 'outline'}>{c.roleInCourse}</Badge>}
                      </div>
                      {isStudent && <ProgressBar courseId={c.id} />}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
      }
    </div>
  );
}
