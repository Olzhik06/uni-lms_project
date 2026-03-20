'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ScheduleItem, Course } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, Skeleton } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTime } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TYPE_COLORS: Record<string, string> = {
  LECTURE: 'bg-blue-100 border-blue-300 text-blue-900',
  PRACTICE: 'bg-green-100 border-green-300 text-green-900',
  LAB: 'bg-purple-100 border-purple-300 text-purple-900',
  EXAM: 'bg-red-100 border-red-300 text-red-900',
};
// Course color palette for color-coding by course
const COURSE_COLORS = [
  'bg-sky-50 border-sky-300',
  'bg-emerald-50 border-emerald-300',
  'bg-violet-50 border-violet-300',
  'bg-amber-50 border-amber-300',
  'bg-pink-50 border-pink-300',
  'bg-teal-50 border-teal-300',
];

function getMon(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

export default function SchedulePage() {
  const [ws, setWs] = useState(getMon(new Date()));
  const [filterDay, setFilterDay] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  we.setHours(23, 59, 59, 999);

  const { data: items, isLoading } = useQuery<ScheduleItem[]>({
    queryKey: ['sched', ws.toISOString()],
    queryFn: () => api.get(`/me/schedule?from=${ws.toISOString()}&to=${we.toISOString()}`),
  });

  const dayDate = (i: number) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return d; };
  const isToday = (i: number) => dayDate(i).toDateString() === new Date().toDateString();

  // Build course color map
  const courseIds = useMemo(() => Array.from(new Set((items || []).map(s => s.courseId))), [items]);
  const courseColorMap = useMemo(() => Object.fromEntries(courseIds.map((id, i) => [id, COURSE_COLORS[i % COURSE_COLORS.length]])), [courseIds]);

  // Unique courses for filter dropdown
  const coursesInView = useMemo(() => {
    const seen = new Set<string>();
    return (items || []).filter(s => { if (seen.has(s.courseId)) return false; seen.add(s.courseId); return true; });
  }, [items]);

  const filtered = useMemo(() => (items || []).filter(s => {
    if (filterCourse && s.courseId !== filterCourse) return false;
    if (filterDay) {
      const dayIdx = DAYS.indexOf(filterDay);
      if (dayIdx === -1) return true;
      return new Date(s.startsAt).toDateString() === dayDate(dayIdx).toDateString();
    }
    return true;
  }), [items, filterDay, filterCourse]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="w-28 h-8 text-sm">
            <option value="">All Days</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="w-36 h-8 text-sm">
            <option value="">All Courses</option>
            {coursesInView.map(s => <option key={s.courseId} value={s.courseId}>{s.course?.code}</option>)}
          </Select>
          <Button variant="outline" size="sm" onClick={() => { setWs(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; })}}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWs(getMon(new Date()))}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => { setWs(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; })}}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {isLoading
            ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full"/>)}</div>
            : (
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day, i) => {
                  if (filterDay && filterDay !== day) return null;
                  const dayItems = filtered.filter(s => new Date(s.startsAt).toDateString() === dayDate(i).toDateString());
                  return (
                    <div key={day} className={`border rounded-lg p-3 min-h-[200px] ${isToday(i) ? 'bg-primary/5 border-primary/30' : ''}`}>
                      <p className="text-xs font-semibold text-muted-foreground">{day}</p>
                      <p className={`text-lg font-bold mb-2 ${isToday(i) ? 'text-primary' : ''}`}>{dayDate(i).getDate()}</p>
                      <div className="space-y-2">
                        {dayItems.map(s => (
                          <div key={s.id} className={`p-2 rounded border text-xs ${courseColorMap[s.courseId] || 'bg-muted/50'}`}>
                            <p className="font-semibold">{s.course?.code}</p>
                            <p>{formatTime(s.startsAt)}-{formatTime(s.endsAt)}</p>
                            <p className="text-muted-foreground">{s.room}</p>
                            <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[s.type] || ''}`}>{s.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
