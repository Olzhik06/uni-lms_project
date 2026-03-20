'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { Attendance, AttendanceStats, StudentAttendanceStat } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, UserCheck } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-yellow-100 text-yellow-800',
};

function StatBadge({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`rounded-xl p-3 text-center ${color}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

export default function AttendancePage() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useMe();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'records'|'stats'>('records');

  const { data: records, isLoading } = useQuery<Attendance[]>({
    queryKey: ['attendance', id],
    queryFn: () => api.get(`/courses/${id}/attendance`),
  });

  const { data: statsRaw } = useQuery({
    queryKey: ['attendance-stats', id],
    queryFn: () => api.get(`/courses/${id}/attendance/stats`),
  });

  const markMutation = useMutation({
    mutationFn: (data: { studentId: string; date: string; status: string }) =>
      api.post(`/courses/${id}/attendance`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance', id] });
      qc.invalidateQueries({ queryKey: ['attendance-stats', id] });
      toast({ title: 'Attendance recorded' });
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const canMark = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-14 bg-muted animate-pulse rounded-lg"/>)}</div>;

  // Group records by date
  const byDate = (records || []).reduce<Record<string, Attendance[]>>((acc, r) => {
    const d = r.date.split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];

  // Student stats view
  const myStats = isStudent ? statsRaw as AttendanceStats | undefined : undefined;
  // Teacher stats view (array per student)
  const studentStats = canMark ? statsRaw as StudentAttendanceStat[] | undefined : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Attendance</h2>
        <div className="flex gap-1">
          <Button size="sm" variant={tab === 'records' ? 'default' : 'outline'} onClick={() => setTab('records')}>Records</Button>
          <Button size="sm" variant={tab === 'stats' ? 'default' : 'outline'} onClick={() => setTab('stats')}>Stats</Button>
        </div>
      </div>

      {/* ── STATS TAB ── */}
      {tab === 'stats' && (
        <>
          {isStudent && myStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatBadge label="Sessions" value={myStats.total} color="bg-slate-100 text-slate-700"/>
                <StatBadge label="Present rate" value={`${myStats.presentRate}%`} color="bg-green-50 text-green-700"/>
                <StatBadge label="Present" value={myStats.present} color="bg-green-100 text-green-800"/>
                <StatBadge label="Late" value={myStats.late} color="bg-yellow-100 text-yellow-800"/>
                <StatBadge label="Absent" value={myStats.absent} color="bg-red-100 text-red-800"/>
                <StatBadge label="Absent rate" value={`${myStats.absentRate}%`} color="bg-red-50 text-red-700"/>
              </div>
              {myStats.total === 0 && <p className="text-sm text-muted-foreground text-center py-4">No attendance data yet</p>}
            </div>
          )}

          {canMark && (
            <div className="space-y-3">
              {!studentStats?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No attendance data yet</p>
              ) : studentStats.map(s => (
                <Card key={s.student.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{s.student.fullName}</p>
                      <p className="text-xs text-muted-foreground">{s.student.email}</p>
                    </div>
                    <div className="flex gap-3 text-center text-xs shrink-0">
                      <div className="text-green-700"><CheckCircle2 className="h-4 w-4 mx-auto"/>{s.present}</div>
                      <div className="text-yellow-700"><Clock className="h-4 w-4 mx-auto"/>{s.late}</div>
                      <div className="text-red-700"><XCircle className="h-4 w-4 mx-auto"/>{s.absent}</div>
                    </div>
                    <Badge className={s.presentRate >= 75 ? 'bg-green-100 text-green-800' : s.presentRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                      {s.presentRate}%
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── RECORDS TAB ── */}
      {tab === 'records' && (
        <>
          {/* Teacher: mark today's attendance */}
          {canMark && (
            <Card className="border-dashed">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4"/>Mark Today ({formatDate(today)})</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0">
                {(byDate[today] || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Load students from the Participants tab first, then mark here once records exist.</p>
                ) : (
                  <div className="space-y-2">
                    {byDate[today].map(r => (
                      <div key={r.id} className="flex items-center justify-between">
                        <p className="text-sm">{r.student?.fullName}</p>
                        <div className="flex gap-1">
                          {(['PRESENT', 'LATE', 'ABSENT'] as const).map(s => (
                            <Button key={s} size="sm" variant={r.status === s ? 'default' : 'outline'}
                              className={`h-7 px-2 text-[10px] ${r.status === s ? '' : 'text-muted-foreground'}`}
                              onClick={() => markMutation.mutate({ studentId: r.studentId, date: today, status: s })}>
                              {s[0]}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {Object.keys(byDate).length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No attendance records yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, rows]) => (
                <Card key={date}>
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold mb-3">{formatDate(date)}</p>
                    <div className="space-y-2">
                      {rows.map(r => (
                        <div key={r.id} className="flex items-center justify-between">
                          <p className="text-sm">{r.student?.fullName || r.studentId}</p>
                          {canMark ? (
                            <div className="flex gap-1">
                              {(['PRESENT', 'LATE', 'ABSENT'] as const).map(s => (
                                <Button key={s} size="sm" variant={r.status === s ? 'default' : 'outline'}
                                  className={`h-6 px-2 text-[10px] ${r.status === s ? '' : 'text-muted-foreground'}`}
                                  onClick={() => markMutation.mutate({ studentId: r.studentId, date, status: s })}>
                                  {s[0]}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
