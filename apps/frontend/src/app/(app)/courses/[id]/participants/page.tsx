'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Enrollment } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/form-elements';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function ParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const [search, setSearch] = useState('');
  const { data: parts, isLoading } = useQuery<Enrollment[]>({
    queryKey: ['c-parts', id],
    queryFn: () => api.get(`/courses/${id}/participants`),
  });

  const teachers = (parts || []).filter(p => p.roleInCourse === 'TEACHER');
  const students = (parts || []).filter(p => p.roleInCourse === 'STUDENT');
  const filteredStudents = search.trim()
    ? students.filter(p =>
        p.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
        <h2 className="text-lg font-semibold">{t.courseParticipants.title}
          {' '}<span className="text-muted-foreground font-normal text-base">({parts?.length || 0})</span>
        </h2>
        {(parts?.length || 0) > 3 && (
          <div className="relative sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-xs"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <>
          {teachers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t.courseParticipants.instructors}</h3>
              <div className="space-y-2">
                {teachers.map(p => (
                  <Card key={p.id}>
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {p.user?.fullName?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.user?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                      </div>
                      <Badge>{t.courseParticipants.teacher}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t.courseParticipants.students} ({students.length})</h3>
            <div className="space-y-2">
              {filteredStudents.length === 0 && !search ? (
                <div className="flex flex-col items-center py-10 text-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-muted dark:bg-white/[0.04] flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t.courseParticipants.noStudents}</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students match &ldquo;{search}&rdquo;
                </p>
              ) : filteredStudents.map(p => (
                <Card key={p.id}>
                  <CardContent className="py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                      {p.user?.fullName?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.user?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
