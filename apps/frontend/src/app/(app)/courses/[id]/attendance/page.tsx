'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { Attendance } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-yellow-100 text-yellow-800',
};

export default function AttendancePage() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useMe();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: records, isLoading } = useQuery<Attendance[]>({
    queryKey: ['attendance', id],
    queryFn: () => api.get(`/courses/${id}/attendance`),
  });

  const markMutation = useMutation({
    mutationFn: (data: { studentId: string; date: string; status: string }) =>
      api.post(`/courses/${id}/attendance`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance', id] });
      toast({ title: 'Attendance recorded' });
    },
    onError: () => toast({ title: 'Error', variant: 'destructive' }),
  });

  const canMark = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg"/>)}</div>;

  // Group by date
  const byDate = (records || []).reduce<Record<string, Attendance[]>>((acc, r) => {
    const d = r.date.split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Attendance</h2>
        {canMark && (
          <p className="text-xs text-muted-foreground">Mark via the participant list for today&apos;s date</p>
        )}
      </div>

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
                            <Button
                              key={s}
                              size="sm"
                              variant={r.status === s ? 'default' : 'outline'}
                              className={`h-6 px-2 text-[10px] ${r.status === s ? '' : 'text-muted-foreground'}`}
                              onClick={() => markMutation.mutate({ studentId: r.studentId, date, status: s })}
                            >
                              {s[0]}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[r.status] || ''}`}>
                          {r.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
