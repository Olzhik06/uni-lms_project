'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Grade, Assignment, Submission, GradeStats, GradeSummary } from '@/lib/types';
import { useMe } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea, Label, Select } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { TrendingUp, Award, BarChart2, Download } from 'lucide-react';
import { useT } from '@/lib/i18n';

// ── Student view ──────────────────────────────────────────────────────────────
function StudentGrades({ courseId }: { courseId: string }) {
  const t = useT();
  const { data: myGrades, isLoading } = useQuery<Grade[]>({
    queryKey: ['my-grades'],
    queryFn: () => api.get('/me/grades'),
  });
  const { data: summary } = useQuery<GradeSummary[]>({
    queryKey: ['grade-summary'],
    queryFn: () => api.get('/me/grades/summary'),
  });

  const courseGrades = (myGrades || []).filter(g => g.submission?.assignment?.course?.id === courseId);
  const courseSummary = (summary || []).find(s => s.course?.id === courseId);

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-muted animate-pulse rounded-lg"/>)}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t.grades.myGrades}</h2>

      {courseSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-7 w-7 text-primary"/>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
              <div><p className="text-2xl font-bold text-primary">{courseSummary.percentage}%</p><p className="text-xs text-muted-foreground">{t.courseGrades.overall}</p></div>
              <div><p className="text-2xl font-bold">{courseSummary.totalEarned}</p><p className="text-xs text-muted-foreground">{t.grades.pointsEarned}</p></div>
              <div><p className="text-2xl font-bold">{courseSummary.gradesCount}</p><p className="text-xs text-muted-foreground">{t.grades.graded}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {!courseGrades.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">{t.grades.noGrades}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {courseGrades.map(g => (
            <Card key={g.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{g.submission?.assignment?.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.courseGrades.gradedBy} {g.gradedBy?.fullName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{g.score}<span className="text-sm text-muted-foreground font-normal">/{g.submission?.assignment?.maxScore}</span></p>
                    <p className="text-xs text-muted-foreground">{Math.round((g.score / (g.submission?.assignment?.maxScore || 100)) * 100)}%</p>
                  </div>
                </div>
                {g.feedback && <p className="text-sm text-muted-foreground mt-2 border-t pt-2 italic">&ldquo;{g.feedback}&rdquo;</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Teacher view ──────────────────────────────────────────────────────────────
function TeacherGrades({ courseId }: { courseId: string }) {
  const t = useT();
  const qc = useQueryClient();
  const { data: asgns } = useQuery<Assignment[]>({ queryKey: ['c-asgn', courseId], queryFn: () => api.get(`/courses/${courseId}/assignments`) });
  const { data: stats } = useQuery<GradeStats>({ queryKey: ['grade-stats', courseId], queryFn: () => api.get(`/courses/${courseId}/grades/stats`) });
  const [selA, setSelA] = useState('');
  const { data: subs } = useQuery<Submission[]>({ queryKey: ['subs', selA], queryFn: () => api.get(`/assignments/${selA}/submissions`), enabled: !!selA });
  const [gOpen, setGOpen] = useState<Submission | null>(null);
  const [gs, setGs] = useState('');
  const [gf, setGf] = useState('');

  const gradeM = useMutation({
    mutationFn: ({ sid, d }: { sid: string; d: any }) => api.post(`/submissions/${sid}/grade`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subs', selA] }); qc.invalidateQueries({ queryKey: ['grade-stats', courseId] }); toast({ title: t.courseGrades.gradeSaved }); setGOpen(null); },
    onError: () => toast({ title: t.common.error, variant: 'destructive' }),
  });

  const exportCsv = () => {
    if (!stats) return;
    const rows: string[] = ['Assignment,Max Score,Avg Score,Submissions Graded'];
    stats.assignments.forEach(a => {
      rows.push(`"${a.title}",${a.maxScore},${a.averageScore ?? ''},${a.gradedCount}/${a.submissionsCount}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.courseGrades.exportFilename}-${courseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{t.courseGrades.gradebook}</h2>
        <Button size="sm" variant="outline" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" />{t.common.export}
        </Button>
      </div>

      {stats && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <TrendingUp className="h-6 w-6 text-blue-600"/>
            <div>
              <p className="text-sm font-medium">{t.grades.courseAvg}</p>
              <p className="text-2xl font-bold text-blue-700">{stats.courseAverage !== null ? `${stats.courseAverage} ${t.courseGrades.pointsShort}` : '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center sm:ml-auto sm:flex sm:gap-6">
              <div><p className="text-lg font-bold">{stats.assignments.length}</p><p className="text-xs text-muted-foreground">{t.courseLayout.assignments}</p></div>
              <div><p className="text-lg font-bold">{stats.assignments.reduce((a, b) => a + b.gradedCount, 0)}</p><p className="text-xs text-muted-foreground">{t.grades.graded}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {stats && stats.assignments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><BarChart2 className="h-4 w-4"/>{t.courseGrades.perAssignmentAverages}</h3>
          <div className="space-y-2">
            {stats.assignments.map(a => (
              <Card key={a.assignmentId}>
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.gradedCount}/{a.submissionsCount} {t.grades.graded.toLowerCase()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{a.averageScore !== null ? `${a.averageScore}/${a.maxScore}` : '—'}</p>
                    {a.averageScore !== null && <p className="text-xs text-muted-foreground">{Math.round((a.averageScore / a.maxScore) * 100)}%</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2">{t.courseGrades.gradeSubmissions}</h3>
        <div className="mb-3">
          <Label>{t.grades.selectAssignment}</Label>
          <Select value={selA} onChange={e => setSelA(e.target.value)}>
            <option value="">{t.courseGrades.chooseAssignment}</option>
            {asgns?.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </Select>
        </div>

        {selA && subs && (
          <div className="space-y-3">
            {!subs.length ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">{t.grades.noGrades}</CardContent></Card>
            ) : subs.map(s => (
              <Card key={s.id}>
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.student?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.student?.email}</p>
                    {s.contentText && <p className="text-xs mt-1 text-muted-foreground truncate">{s.contentText}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {s.grade ? <Badge variant="secondary">{s.grade.score} {t.courseGrades.pointsShort}</Badge> : <Badge variant="outline" className="text-amber-600 border-amber-300">{t.grades.notGraded}</Badge>}
                    <Button size="sm" variant="outline" onClick={() => { setGOpen(s); setGs(s.grade?.score?.toString() || ''); setGf(s.grade?.feedback || ''); }}>
                      {s.grade ? t.courseGrades.edit : t.common.grade}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!gOpen} onOpenChange={() => setGOpen(null)}>
        <DialogHeader><DialogTitle>{t.common.grade}: {gOpen?.student?.fullName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {gOpen?.contentText && <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">{gOpen.contentText}</div>}
          <div><Label>{t.courseGrades.score}</Label><Input type="number" min={0} value={gs} onChange={e => setGs(e.target.value)} placeholder={t.courseGrades.score}/></div>
          <div><Label>{t.courseGrades.feedbackOptional}</Label><Textarea rows={3} value={gf} onChange={e => setGf(e.target.value)} placeholder={t.courseGrades.feedbackPlaceholder}/></div>
          <Button className="w-full" onClick={() => gradeM.mutate({ sid: gOpen!.id, d: { score: parseFloat(gs), feedback: gf || undefined } })} disabled={!gs || gradeM.isPending}>
            {gradeM.isPending ? t.common.loading : `${t.common.save} ${t.common.grade}`}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GradesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useMe();
  if (!user) return null;
  return user.role === 'STUDENT' ? <StudentGrades courseId={id} /> : <TeacherGrades courseId={id} />;
}
