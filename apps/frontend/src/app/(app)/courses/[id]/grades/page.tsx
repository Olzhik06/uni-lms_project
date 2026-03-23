'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Grade, Assignment, Submission, GradeStats, GradeSummary, StudentAttendanceStat,
  GradeCategory, WeightedGradebook, MyWeightedGrade,
  Rubric, RubricEvaluation,
} from '@/lib/types';
import { useMe } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea, Label, Select } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Award, BarChart2, Download, AlertTriangle, Sparkles, Plus, Edit2, Trash2, Tag, BookOpen, Users, CheckCircle2, Circle, ClipboardList } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { downloadCsv } from '@/lib/csv';
import { formatDateTime } from '@/lib/utils';

// ── Rubric grading dialog (teacher) ───────────────────────────────────────────
function RubricGradingDialog({ submission, rubric, evaluation, onClose }: {
  submission: Submission;
  rubric: Rubric;
  evaluation: RubricEvaluation | null;
  onClose: () => void;
}) {
  const t = useT();
  const qc = useQueryClient();
  const [scores, setScores] = useState<Record<string, { levelId: string; comment: string }>>(() => {
    const init: Record<string, { levelId: string; comment: string }> = {};
    if (evaluation) {
      for (const s of evaluation.criterionScores) {
        init[s.criterionId] = { levelId: s.levelId, comment: s.comment ?? '' };
      }
    }
    return init;
  });

  const evaluateM = useMutation({
    mutationFn: (data: { scores: { criterionId: string; levelId: string; comment?: string }[] }) =>
      api.post(`/submissions/${submission.id}/rubric-evaluate`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rubric-eval', submission.id] });
      qc.invalidateQueries({ queryKey: ['subs'] });
      toast({ title: t.rubric.evaluationSaved });
      onClose();
    },
    onError: () => toast({ title: t.common.error, variant: 'destructive' }),
  });

  const totalEarned = (rubric.criteria ?? []).reduce((sum, c) => {
    const sel = scores[c.id];
    if (!sel) return sum;
    const level = c.levels.find(l => l.id === sel.levelId);
    return sum + (level?.points ?? 0);
  }, 0);
  const totalMax = (rubric.criteria ?? []).reduce((s, c) => s + c.points, 0);

  const handleSubmit = () => {
    const missing = (rubric.criteria ?? []).filter(c => !scores[c.id]?.levelId);
    if (missing.length) { toast({ title: `Select a level for: ${missing.map(c => c.title).join(', ')}`, variant: 'destructive' }); return; }
    evaluateM.mutate({ scores: Object.entries(scores).map(([criterionId, v]) => ({ criterionId, levelId: v.levelId, comment: v.comment || undefined })) });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Score summary */}
      <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
        <span className="text-sm font-medium">{t.rubric.rubricScore}</span>
        <span className="text-xl font-bold text-primary">{totalEarned} / {totalMax}</span>
      </div>

      {(rubric.criteria ?? []).map(criterion => {
        const sel = scores[criterion.id];
        return (
          <div key={criterion.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{criterion.title}</p>
                {criterion.description && <p className="text-xs text-muted-foreground">{criterion.description}</p>}
              </div>
              <Badge variant="outline" className="shrink-0">{t.rubric.maxPoints}: {criterion.points}</Badge>
            </div>
            <div className="grid gap-1.5">
              {criterion.levels.map(level => {
                const isSelected = sel?.levelId === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => setScores(prev => ({ ...prev, [criterion.id]: { levelId: level.id, comment: prev[criterion.id]?.comment ?? '' } }))}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground/40'}`}>
                      {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{level.title}</span>
                        <span className={`text-sm font-bold shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{level.points} pts</span>
                      </div>
                      {level.description && <p className="text-xs text-muted-foreground mt-0.5">{level.description}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
            {sel?.levelId && (
              <Input
                value={sel.comment}
                onChange={e => setScores(prev => ({ ...prev, [criterion.id]: { ...prev[criterion.id], comment: e.target.value } }))}
                placeholder={t.rubric.commentOptional}
                className="h-8 text-sm"
              />
            )}
          </div>
        );
      })}

      <Button className="w-full" onClick={handleSubmit} disabled={evaluateM.isPending}>
        {evaluateM.isPending ? t.common.loading : evaluation ? t.rubric.updateEvaluation : t.rubric.submitEvaluation}
      </Button>
    </div>
  );
}

// ── Rubric evaluation view (student) ──────────────────────────────────────────
function RubricEvaluationView({ submissionId }: { submissionId: string }) {
  const t = useT();
  const { data: evaluation, isLoading } = useQuery<RubricEvaluation | null>({
    queryKey: ['rubric-eval', submissionId],
    queryFn: () => api.get(`/submissions/${submissionId}/rubric-evaluation`),
  });

  if (isLoading) return <div className="h-8 bg-muted animate-pulse rounded" />;
  if (!evaluation) return null;

  const totalMax = (evaluation.rubric?.criteria ?? []).reduce((s, c) => s + c.points, 0);

  return (
    <div className="mt-3 border-t pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" />{t.rubric.rubricEvaluation}</span>
        <span className="text-sm font-bold text-primary">{evaluation.totalScore} / {totalMax}</span>
      </div>
      <div className="space-y-2">
        {evaluation.criterionScores.map(cs => (
          <div key={cs.id} className="rounded-md bg-muted/40 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{cs.criterion.title}</span>
              <Badge variant="secondary" className="text-xs">{cs.level.title} · {cs.level.points} pts</Badge>
            </div>
            {cs.comment && <p className="text-xs text-muted-foreground mt-1 italic">"{cs.comment}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Letter grade badge ─────────────────────────────────────────────────────────
function LetterBadge({ letter }: { letter: string | null }) {
  if (!letter) return <span className="text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    B: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    D: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    F: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  };
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${colors[letter] ?? ''}`}>
      {letter}
    </span>
  );
}

// ── Weighted grade bar ─────────────────────────────────────────────────────────
function CategoryBar({ pct, color }: { pct: number | null; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct ?? 0}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ── Category Form ──────────────────────────────────────────────────────────────
function CategoryForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: Partial<GradeCategory>;
  onSave: (d: { name: string; weight: number; color: string }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? '');
  const [weight, setWeight] = useState(String(initial?.weight ?? ''));
  const [color, setColor] = useState(initial?.color ?? '#6366f1');

  return (
    <div className="space-y-3">
      <div>
        <Label>{t.courseGrades.categoryName}</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Assignments" autoFocus />
      </div>
      <div>
        <Label>{t.courseGrades.categoryWeight}</Label>
        <Input type="number" min={0} max={100} value={weight} onChange={e => setWeight(e.target.value)} placeholder="30" />
      </div>
      <div className="flex items-center gap-3">
        <Label>{t.courseGrades.categoryColor}</Label>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-14 cursor-pointer rounded border" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={() => onSave({ name, weight: parseFloat(weight) || 0, color })} disabled={!name || !weight || isPending}>
          {isPending ? t.common.loading : t.courseGrades.saveCategory}
        </Button>
        <Button variant="outline" onClick={onCancel}>{t.common.cancel}</Button>
      </div>
    </div>
  );
}

// ── Teacher: Categories tab ────────────────────────────────────────────────────
function CategoriesTab({ courseId }: { courseId: string }) {
  const t = useT();
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery<GradeCategory[]>({
    queryKey: ['grade-categories', courseId],
    queryFn: () => api.get(`/courses/${courseId}/grade-categories`),
  });
  const { data: stats } = useQuery<GradeStats>({
    queryKey: ['grade-stats', courseId],
    queryFn: () => api.get(`/courses/${courseId}/grades/stats`),
  });
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const createM = useMutation({
    mutationFn: (d: { name: string; weight: number; color: string }) =>
      api.post(`/courses/${courseId}/grade-categories`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grade-categories', courseId] }); setAdding(false); toast({ title: t.common.save }); },
  });
  const updateM = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => api.patch(`/grade-categories/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grade-categories', courseId] }); setEditId(null); toast({ title: t.common.save }); },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => api.delete(`/grade-categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grade-categories', courseId] }); toast({ title: t.courseGrades.deleteCategory }); },
  });

  const assignCategoryM = useMutation({
    mutationFn: ({ assignmentId, categoryId }: { assignmentId: string; categoryId: string | null }) =>
      api.patch(`/assignments/${assignmentId}/category`, { categoryId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grade-stats', courseId] });
      qc.invalidateQueries({ queryKey: ['gradebook', courseId] });
      toast({ title: t.common.save });
    },
  });

  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"/>)}</div>;

  return (
    <div className="space-y-6">
      {/* Total weight indicator */}
      <Card className={totalWeight !== 100 && categories.length > 0 ? 'border-amber-300 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/[0.05]' : ''}>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">{t.courseGrades.totalWeight}</p>
            <p className="text-2xl font-bold">{totalWeight}%</p>
            {totalWeight !== 100 && categories.length > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{t.courseGrades.weightWarning}</p>
            )}
          </div>
          <Button size="sm" onClick={() => { setAdding(true); setEditId(null); }} className="gap-2">
            <Plus className="h-4 w-4" />{t.courseGrades.addCategory}
          </Button>
        </CardContent>
      </Card>

      {/* Add form */}
      {adding && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t.courseGrades.addCategory}</CardTitle></CardHeader>
          <CardContent>
            <CategoryForm
              onSave={d => createM.mutate(d)}
              onCancel={() => setAdding(false)}
              isPending={createM.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Category list */}
      {!categories.length && !adding ? (
        <div className="flex flex-col items-center py-14 text-center gap-3">
          <Tag className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-medium">{t.courseGrades.noCategories}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <Card key={cat.id}>
              <CardContent className="p-4">
                {editId === cat.id ? (
                  <CategoryForm
                    initial={cat}
                    onSave={d => updateM.mutate({ id: cat.id, d })}
                    onCancel={() => setEditId(null)}
                    isPending={updateM.isPending}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <div className="min-w-0">
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">{cat._count?.assignments ?? 0} assignments · {cat._count?.quizzes ?? 0} quizzes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary">{cat.weight}%</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(cat.id)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => {
                          if (confirm(t.courseGrades.deleteCategoryConfirm)) deleteM.mutate(cat.id);
                        }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <CategoryBar pct={cat.weight} color={cat.color} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign assignments to categories */}
      {stats && stats.assignments.length > 0 && categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4"/>{t.courseGrades.assignToCategory}</h3>
          <div className="space-y-2">
            {stats.assignments.map(a => (
              <Card key={a.assignmentId}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.maxScore} pts</p>
                  </div>
                  <Select
                    value={a.categoryId ?? ''}
                    onChange={e => assignCategoryM.mutate({ assignmentId: a.assignmentId, categoryId: e.target.value || null })}
                    className="w-44 text-sm"
                  >
                    <option value="">{t.courseGrades.uncategorized}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Teacher: Gradebook tab ────────────────────────────────────────────────────
function GradebookTab({ courseId }: { courseId: string }) {
  const t = useT();
  const { data: gradebook, isLoading } = useQuery<WeightedGradebook>({
    queryKey: ['gradebook', courseId],
    queryFn: () => api.get(`/courses/${courseId}/gradebook`),
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"/>)}</div>;
  if (!gradebook) return null;

  if (!gradebook.categories.length) {
    return (
      <div className="flex flex-col items-center py-14 text-center gap-3">
        <Tag className="h-10 w-10 text-muted-foreground/30" />
        <p className="font-medium">{t.courseGrades.noCategories}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium w-40 min-w-[160px]">{t.courseGrades.studentName}</th>
              {gradebook.categories.map(cat => (
                <th key={cat.id} className="px-3 py-3 text-center font-medium min-w-[110px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">{cat.weight}%</span>
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center font-medium min-w-[90px]">{t.courseGrades.finalGrade}</th>
              <th className="px-3 py-3 text-center font-medium min-w-[60px]">{t.courseGrades.letterGrade}</th>
            </tr>
          </thead>
          <tbody>
            {!gradebook.students.length ? (
              <tr><td colSpan={gradebook.categories.length + 3} className="py-10 text-center text-muted-foreground">{t.grades.noGrades}</td></tr>
            ) : gradebook.students.map(row => (
              <tr key={row.student.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{row.student.fullName}</p>
                  <p className="text-xs text-muted-foreground">{row.student.email}</p>
                </td>
                {row.categoryBreakdown.map(cb => (
                  <td key={cb.categoryId} className="px-3 py-3 text-center">
                    {cb.percentage !== null ? (
                      <div>
                        <p className="font-medium">{cb.percentage}%</p>
                        <p className="text-xs text-muted-foreground">{cb.earned}/{cb.possible}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-3 text-center">
                  {row.finalPct !== null ? (
                    <span className="font-bold">{row.finalPct}%</span>
                  ) : '—'}
                </td>
                <td className="px-3 py-3 text-center">
                  <LetterBadge letter={row.letterGrade} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Student: Weighted grade view ──────────────────────────────────────────────
function MyWeightedGradeView({ courseId }: { courseId: string }) {
  const t = useT();
  const { data, isLoading } = useQuery<MyWeightedGrade>({
    queryKey: ['my-gradebook', courseId],
    queryFn: () => api.get(`/courses/${courseId}/my-gradebook`),
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"/>)}</div>;
  if (!data) return null;

  if (!data.categories.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {t.courseGrades.noCategoriesStudent}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Final grade card */}
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/[0.07]">
        <CardContent className="flex items-center gap-6 p-5">
          <div className="flex flex-col items-center justify-center h-16 w-16 rounded-full bg-primary/10 shrink-0">
            <LetterBadge letter={data.letterGrade ?? null} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.courseGrades.finalGrade}</p>
            <p className="text-3xl font-bold text-primary">{data.finalPct !== null ? `${data.finalPct}%` : '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.courseGrades.totalWeight}: {data.totalWeight}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t.courseGrades.categoryBreakdown}</h3>
        {data.categoryBreakdown.map(cb => (
          <Card key={cb.categoryId}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cb.color }} />
                  <span className="font-medium text-sm">{cb.name}</span>
                  <Badge variant="outline" className="text-xs">{cb.weight}%</Badge>
                </div>
                <div className="text-right">
                  {cb.percentage !== null ? (
                    <span className="font-bold text-sm">{cb.percentage}%</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </div>
              </div>
              <CategoryBar pct={cb.percentage} color={cb.color} />
              {cb.earned !== null && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {cb.earned}/{cb.possible} {t.courseGrades.pointsShort} · {cb.items} {t.courseGrades.items}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Student view ──────────────────────────────────────────────────────────────
function StudentGrades({ courseId }: { courseId: string }) {
  const t = useT();
  const [tab, setTab] = useState<'weighted' | 'list'>('weighted');
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

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b pb-0 -mb-2">
        {[
          { key: 'weighted', label: t.courseGrades.myGrade },
          { key: 'list', label: t.grades.myGrades },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'weighted' && <MyWeightedGradeView courseId={courseId} />}

      {tab === 'list' && (
        <>
          {courseSummary && (
            <Card className="border-primary/20 bg-primary/5 dark:bg-primary/[0.07]">
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

          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-muted animate-pulse rounded-lg"/>)}</div>
          ) : !courseGrades.length ? (
            <div className="flex flex-col items-center py-14 text-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <Award className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <div>
                <p className="font-serif font-medium">{t.grades.noGrades}</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t.grades.noGradesDesc}</p>
              </div>
              <Link href={`/courses/${courseId}/assignments`} className="text-sm text-primary hover:underline">
                {t.grades.submitLink}
              </Link>
            </div>
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
                    {g.submission?.id && <RubricEvaluationView submissionId={g.submission.id} />}
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

// ── Teacher view ──────────────────────────────────────────────────────────────
function TeacherGrades({ courseId }: { courseId: string }) {
  const t = useT();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'gradebook' | 'categories' | 'grading'>('gradebook');
  const [exporting, setExporting] = useState(false);
  const { data: asgns } = useQuery<Assignment[]>({ queryKey: ['c-asgn', courseId], queryFn: () => api.get(`/courses/${courseId}/assignments`) });
  const { data: stats } = useQuery<GradeStats>({ queryKey: ['grade-stats', courseId], queryFn: () => api.get(`/courses/${courseId}/grades/stats`) });
  const { data: courseGrades = [] } = useQuery<Grade[]>({ queryKey: ['course-grades', courseId], queryFn: () => api.get(`/courses/${courseId}/grades`) });
  const { data: attendanceStats = [] } = useQuery<StudentAttendanceStat[]>({ queryKey: ['attendance-stats', courseId], queryFn: () => api.get(`/courses/${courseId}/attendance/stats`) });
  const [selA, setSelA] = useState('');
  const { data: subs } = useQuery<Submission[]>({ queryKey: ['subs', selA], queryFn: () => api.get(`/assignments/${selA}/submissions`), enabled: !!selA });
  const { data: selRubric } = useQuery<Rubric | null>({ queryKey: ['rubric', selA], queryFn: () => api.get(`/assignments/${selA}/rubric`), enabled: !!selA });
  const [gOpen, setGOpen] = useState<Submission | null>(null);
  const [gs, setGs] = useState('');
  const [gf, setGf] = useState('');
  const [rubricOpen, setRubricOpen] = useState<Submission | null>(null);
  const { data: rubricEval } = useQuery<RubricEvaluation | null>({
    queryKey: ['rubric-eval', rubricOpen?.id],
    queryFn: () => api.get(`/submissions/${rubricOpen!.id}/rubric-evaluation`),
    enabled: !!rubricOpen,
  });

  const gradeM = useMutation({
    mutationFn: ({ sid, d }: { sid: string; d: any }) => api.post(`/submissions/${sid}/grade`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subs', selA] }); qc.invalidateQueries({ queryKey: ['grade-stats', courseId] }); toast({ title: t.courseGrades.gradeSaved }); setGOpen(null); },
    onError: () => toast({ title: t.common.error, variant: 'destructive' }),
  });

  const exportCsv = async () => {
    if (!asgns?.length) { toast({ title: t.courseGrades.exportEmpty, variant: 'destructive' }); return; }
    setExporting(true);
    try {
      const submissionLists = await Promise.all(
        asgns.map(async assignment => ({
          assignment,
          submissions: await api.get<Submission[]>(`/assignments/${assignment.id}/submissions`).catch(() => []),
        })),
      );
      const rows = submissionLists.flatMap(({ assignment, submissions }) =>
        submissions.map(submission => {
          const score = submission.grade?.score ?? '';
          const percentage = submission.grade ? Math.round((submission.grade.score / assignment.maxScore) * 1000) / 10 : '';
          return [assignment.title, submission.student?.fullName || '', submission.student?.email || '', submission.status, submission.submittedAt ? formatDateTime(submission.submittedAt) : '', score, assignment.maxScore, percentage, submission.grade?.feedback || '', submission.grade?.gradedAt ? formatDateTime(submission.grade.gradedAt) : ''];
        }),
      );
      if (!rows.length) { toast({ title: t.courseGrades.exportEmpty, variant: 'destructive' }); return; }
      downloadCsv(`${t.courseGrades.exportFilename}-${courseId}.csv`, [t.courseGrades.exportAssignment, t.courseGrades.exportStudent, t.courseGrades.exportEmail, t.courseGrades.exportStatus, t.courseGrades.exportSubmittedAt, t.courseGrades.exportScore, t.courseGrades.exportMaxScore, t.courseGrades.exportPercentage, t.courseGrades.exportFeedback, t.courseGrades.exportGradedAt], rows);
      toast({ title: t.courseGrades.exportReady });
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    } finally { setExporting(false); }
  };

  const attendanceByStudent = Object.fromEntries(attendanceStats.map(s => [s.student.id, s]));
  const studentInsights = Object.values(
    courseGrades.reduce<Record<string, { student: { id: string; fullName: string; email?: string }; totalScore: number; gradedItems: number; attendanceRate: number | null }>>((acc, grade) => {
      const student = grade.submission?.student;
      if (!student) return acc;
      if (!acc[student.id]) acc[student.id] = { student, totalScore: 0, gradedItems: 0, attendanceRate: attendanceByStudent[student.id]?.presentRate ?? null };
      acc[student.id].totalScore += grade.score;
      acc[student.id].gradedItems += 1;
      return acc;
    }, {}),
  ).map(item => ({ ...item, averageScore: item.gradedItems > 0 ? Math.round((item.totalScore / item.gradedItems) * 10) / 10 : null }));

  const topStudents = [...studentInsights].filter(s => s.averageScore !== null).sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0)).slice(0, 3);
  const attentionStudents = [...studentInsights].filter(s => (s.averageScore ?? 101) < 60 || (s.attendanceRate ?? 101) < 75).slice(0, 4);
  const averageAttendance = attendanceStats.length ? Math.round((attendanceStats.reduce((sum, s) => sum + s.presentRate, 0) / attendanceStats.length) * 10) / 10 : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">{t.courseGrades.gradebook}</h2>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={exporting} className="gap-2">
          <Download className="h-4 w-4" />{t.common.export}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { key: 'gradebook', label: t.courseGrades.gradebookTab, icon: Users },
          { key: 'categories', label: t.courseGrades.categoriesTab, icon: Tag },
          { key: 'grading', label: t.courseGrades.gradeSubmissions, icon: Award },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {tab === 'gradebook' && (
        <>
          {/* Insights summary */}
          {stats && (
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/[0.07]">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                <div>
                  <p className="text-sm font-medium">{t.grades.courseAvg}</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.courseAverage !== null ? `${stats.courseAverage} ${t.courseGrades.pointsShort}` : '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center sm:ml-auto sm:flex sm:gap-6">
                  <div><p className="text-lg font-bold">{stats.assignments.length}</p><p className="text-xs text-muted-foreground">{t.courseLayout.assignments}</p></div>
                  <div><p className="text-lg font-bold">{stats.assignments.reduce((a, b) => a + b.gradedCount, 0)}</p><p className="text-xs text-muted-foreground">{t.grades.graded}</p></div>
                </div>
              </CardContent>
            </Card>
          )}
          <GradebookTab courseId={courseId} />

          {/* Per-assignment averages */}
          {stats && stats.assignments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><BarChart2 className="h-4 w-4"/>{t.courseGrades.perAssignmentAverages}</h3>
              <div className="space-y-2">
                {stats.assignments.map(a => (
                  <Card key={a.assignmentId}>
                    <CardContent className="p-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          {a.category && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: a.category.color + '30', color: a.category.color }}>
                              {a.category.name}
                            </span>
                          )}
                        </div>
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

          {/* Student insights */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4"/>{t.courseGrades.insights}</h3>
            {!studentInsights.length ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{t.courseGrades.noInsights}</CardContent></Card>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]">
                    <CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{t.courseGrades.studentsTracked}</p><p className="mt-2 text-2xl font-bold text-emerald-800 dark:text-emerald-300">{studentInsights.length}</p></CardContent>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/[0.07]">
                    <CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">{t.courseGrades.atRiskCount}</p><p className="mt-2 text-2xl font-bold text-amber-800 dark:text-amber-300">{attentionStudents.length}</p></CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/[0.07]">
                    <CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-400">{t.courseGrades.courseHealth}</p><p className="mt-2 text-2xl font-bold text-blue-800 dark:text-blue-300">{averageAttendance !== null ? `${averageAttendance}%` : '—'}</p></CardContent>
                  </Card>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">{t.courseGrades.topStudents}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {topStudents.map(student => (
                        <div key={student.student.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                          <div className="min-w-0"><p className="font-medium text-sm">{student.student.fullName}</p><p className="text-xs text-muted-foreground">{student.student.email}</p></div>
                          <div className="text-right shrink-0"><p className="text-sm font-semibold">{student.averageScore} {t.courseGrades.pointsShort}</p><p className="text-xs text-muted-foreground">{student.attendanceRate ?? '—'}% {t.courseGrades.attendanceRate.toLowerCase()}</p></div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600"/>{t.courseGrades.needsAttention}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {attentionStudents.map(student => (
                        <div key={student.student.id} className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/[0.07] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0"><p className="font-medium text-sm">{student.student.fullName}</p><p className="text-xs text-muted-foreground">{student.student.email}</p></div>
                            <Badge variant="outline" className="border-amber-300 text-amber-800">{student.gradedItems} {t.courseGrades.gradedItems.toLowerCase()}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{t.courseGrades.avgScore}: {student.averageScore ?? '—'} {t.courseGrades.pointsShort}</span>
                            <span>{t.courseGrades.attendanceRate}: {student.attendanceRate ?? '—'}%</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {tab === 'categories' && <CategoriesTab courseId={courseId} />}

      {tab === 'grading' && (
        <div>
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
                      {selRubric && (
                        <Button size="sm" variant="outline" className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-300"
                          onClick={() => setRubricOpen(s)}>
                          <ClipboardList className="h-3.5 w-3.5" />{t.rubric.rubricGrading}
                        </Button>
                      )}
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
      )}

      <Dialog open={!!gOpen} onOpenChange={() => setGOpen(null)}>
        <DialogHeader><DialogTitle>{t.common.grade}: {gOpen?.student?.fullName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {gOpen?.contentText && <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">{gOpen.contentText}</div>}
          <div><Label>{t.courseGrades.score}</Label><Input type="number" min={0} value={gs} onChange={e => setGs(e.target.value)} placeholder={t.courseGrades.score} autoFocus /></div>
          <div><Label>{t.courseGrades.feedbackOptional}</Label><Textarea rows={3} value={gf} onChange={e => setGf(e.target.value)} placeholder={t.courseGrades.feedbackPlaceholder}/></div>
          <Button className="w-full" onClick={() => {
            const parsed = parseFloat(gs);
            const selectedAsgn = asgns?.find(a => a.id === selA);
            const max = selectedAsgn?.maxScore ?? 10000;
            if (isNaN(parsed) || parsed < 0 || parsed > max) { toast({ title: `${t.courseGrades.scoreRangeError} ${max}`, variant: 'destructive' }); return; }
            gradeM.mutate({ sid: gOpen!.id, d: { score: parsed, feedback: gf || undefined } });
          }} disabled={!gs || gradeM.isPending}>
            {gradeM.isPending ? t.common.loading : `${t.common.save} ${t.common.grade}`}
          </Button>
        </div>
      </Dialog>

      {/* Rubric grading dialog */}
      <Dialog open={!!rubricOpen} onOpenChange={() => setRubricOpen(null)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-500" />
            {t.rubric.rubricGrading}: {rubricOpen?.student?.fullName}
          </DialogTitle>
        </DialogHeader>
        {rubricOpen && selRubric && (
          <RubricGradingDialog
            submission={rubricOpen}
            rubric={selRubric}
            evaluation={rubricEval ?? null}
            onClose={() => setRubricOpen(null)}
          />
        )}
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
