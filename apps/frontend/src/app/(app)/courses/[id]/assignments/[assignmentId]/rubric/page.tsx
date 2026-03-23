'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Rubric, RubricCriterion, RubricLevel } from '@/lib/types';
import { useMe } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea, Label } from '@/components/ui/form-elements';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Plus, Trash2, ChevronLeft, GripVertical, Edit2, Check, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import Link from 'next/link';

// ── Inline editable text ──────────────────────────────────────────────────────
function InlineEdit({ value, onSave, className = '' }: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (!editing) return (
    <span className={`group flex items-center gap-1 cursor-pointer ${className}`} onClick={() => { setVal(value); setEditing(true); }}>
      {value}
      <Edit2 className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 shrink-0" />
    </span>
  );
  return (
    <span className="flex items-center gap-1">
      <Input value={val} onChange={e => setVal(e.target.value)} className="h-7 text-sm py-0" autoFocus
        onKeyDown={e => { if (e.key === 'Enter') { onSave(val); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
      />
      <button onClick={() => { onSave(val); setEditing(false); }}><Check className="h-4 w-4 text-emerald-600" /></button>
      <button onClick={() => setEditing(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
    </span>
  );
}

// ── Level row ─────────────────────────────────────────────────────────────────
function LevelRow({ level, onUpdate, onDelete }: {
  level: RubricLevel;
  onUpdate: (id: string, d: Partial<RubricLevel>) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  return (
    <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-2">
      <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <InlineEdit value={level.title} onSave={v => onUpdate(level.id, { title: v })} className="font-medium text-sm" />
          <span className="ml-auto shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
            <InlineEdit value={String(level.points)} onSave={v => onUpdate(level.id, { points: parseInt(v) || 0 })} className="w-10 text-right font-mono" />
            {t.rubric.levelPoints}
          </span>
        </div>
        {level.description && (
          <InlineEdit value={level.description} onSave={v => onUpdate(level.id, { description: v })} className="text-xs text-muted-foreground" />
        )}
      </div>
      <button onClick={() => onDelete(level.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Add level form ────────────────────────────────────────────────────────────
function AddLevelForm({ onAdd, onCancel }: { onAdd: (d: { title: string; description: string; points: number }) => void; onCancel: () => void }) {
  const t = useT();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [pts, setPts] = useState('');
  return (
    <div className="space-y-2 rounded-md border border-dashed p-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t.rubric.levelTitle} className="h-8 text-sm" autoFocus />
        </div>
        <Input type="number" min={0} value={pts} onChange={e => setPts(e.target.value)} placeholder={t.rubric.levelPoints} className="h-8 text-sm" />
      </div>
      <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder={t.rubric.levelDesc} className="h-8 text-sm" />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { if (title && pts) { onAdd({ title, description: desc, points: parseInt(pts) || 0 }); } }} disabled={!title || !pts}>
          {t.rubric.save}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>{t.rubric.cancel}</Button>
      </div>
    </div>
  );
}

// ── Criterion card ────────────────────────────────────────────────────────────
function CriterionCard({ criterion, onUpdateCriterion, onDeleteCriterion, onAddLevel, onUpdateLevel, onDeleteLevel }: {
  criterion: RubricCriterion;
  onUpdateCriterion: (id: string, d: any) => void;
  onDeleteCriterion: (id: string) => void;
  onAddLevel: (criterionId: string, d: any) => void;
  onUpdateLevel: (id: string, d: any) => void;
  onDeleteLevel: (id: string) => void;
}) {
  const t = useT();
  const [addingLevel, setAddingLevel] = useState(false);
  const maxPts = Math.max(...criterion.levels.map(l => l.points), 0);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start gap-3">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <InlineEdit
              value={criterion.title}
              onSave={v => onUpdateCriterion(criterion.id, { title: v })}
              className="font-semibold"
            />
            {criterion.description && (
              <InlineEdit
                value={criterion.description}
                onSave={v => onUpdateCriterion(criterion.id, { description: v })}
                className="text-xs text-muted-foreground mt-0.5"
              />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {t.rubric.maxPoints}:{' '}
              <InlineEdit
                value={String(criterion.points)}
                onSave={v => onUpdateCriterion(criterion.id, { points: parseInt(v) || 0 })}
                className="font-mono font-medium"
              />
            </span>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => { if (confirm(t.rubric.deleteCriterion + '?')) onDeleteCriterion(criterion.id); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {!criterion.levels.length ? (
          <p className="text-xs text-muted-foreground italic py-1">{t.rubric.noLevels}</p>
        ) : criterion.levels.map(level => (
          <LevelRow key={level.id} level={level} onUpdate={onUpdateLevel} onDelete={onDeleteLevel} />
        ))}

        {addingLevel ? (
          <AddLevelForm
            onAdd={d => { onAddLevel(criterion.id, d); setAddingLevel(false); }}
            onCancel={() => setAddingLevel(false)}
          />
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => setAddingLevel(true)}>
            <Plus className="h-3 w-3" />{t.rubric.addLevel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Add criterion form ────────────────────────────────────────────────────────
function AddCriterionForm({ onAdd, onCancel }: { onAdd: (d: { title: string; description: string; points: number }) => void; onCancel: () => void }) {
  const t = useT();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [pts, setPts] = useState('10');
  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label>{t.rubric.criterionTitle}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Code Quality" autoFocus />
          </div>
          <div>
            <Label>{t.rubric.maxPoints}</Label>
            <Input type="number" min={0} value={pts} onChange={e => setPts(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>{t.rubric.criterionDesc}</Label>
          <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder={t.rubric.criterionDesc} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { if (title) onAdd({ title, description: desc, points: parseInt(pts) || 10 }); }} disabled={!title}>
            {t.rubric.save}
          </Button>
          <Button variant="outline" onClick={onCancel}>{t.rubric.cancel}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RubricBuilderPage() {
  const { id: courseId, assignmentId } = useParams<{ id: string; assignmentId: string }>();
  const router = useRouter();
  const t = useT();
  const qc = useQueryClient();
  const { data: me } = useMe();

  const { data: rubric, isLoading } = useQuery<Rubric | null>({
    queryKey: ['rubric', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}/rubric`),
  });

  const [addingCriterion, setAddingCriterion] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['rubric', assignmentId] });

  const createM = useMutation({
    mutationFn: (title: string) => api.post(`/assignments/${assignmentId}/rubric`, { title }),
    onSuccess: invalidate,
  });
  const deleteRubricM = useMutation({
    mutationFn: (id: string) => api.delete(`/rubrics/${id}`),
    onSuccess: () => { invalidate(); toast({ title: t.rubric.deleteRubric }); },
  });
  const updateTitleM = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.patch(`/rubrics/${id}`, { title }),
    onSuccess: invalidate,
  });

  const addCriterionM = useMutation({
    mutationFn: ({ rubricId, d }: { rubricId: string; d: any }) => api.post(`/rubrics/${rubricId}/criteria`, d),
    onSuccess: invalidate,
  });
  const updateCriterionM = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => api.patch(`/rubric-criteria/${id}`, d),
    onSuccess: invalidate,
  });
  const deleteCriterionM = useMutation({
    mutationFn: (id: string) => api.delete(`/rubric-criteria/${id}`),
    onSuccess: invalidate,
  });

  const addLevelM = useMutation({
    mutationFn: ({ criterionId, d }: { criterionId: string; d: any }) => api.post(`/rubric-criteria/${criterionId}/levels`, d),
    onSuccess: invalidate,
  });
  const updateLevelM = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => api.patch(`/rubric-levels/${id}`, d),
    onSuccess: invalidate,
  });
  const deleteLevelM = useMutation({
    mutationFn: (id: string) => api.delete(`/rubric-levels/${id}`),
    onSuccess: invalidate,
  });

  if (!me || (me.role !== 'TEACHER' && me.role !== 'ADMIN')) {
    return <div className="py-10 text-center text-muted-foreground">{t.common.error}</div>;
  }

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}</div>;

  const totalPoints = rubric?.criteria?.reduce((s, c) => s + c.points, 0) ?? 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{t.rubric.rubric}</h1>
          {rubric && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.rubric.totalPoints}: <span className="font-semibold text-foreground">{totalPoints}</span>
            </p>
          )}
        </div>
        {rubric && (
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
            onClick={() => { if (confirm(t.rubric.deleteRubricConfirm)) deleteRubricM.mutate(rubric.id); }}>
            <Trash2 className="h-3.5 w-3.5" />{t.rubric.deleteRubric}
          </Button>
        )}
      </div>

      {!rubric ? (
        /* Empty state — create rubric */
        <div className="flex flex-col items-center py-16 text-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <Plus className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-serif font-medium text-lg">{t.rubric.noRubric}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">{t.rubric.noRubricDesc}</p>
          </div>
          <Button onClick={() => createM.mutate('Rubric')} disabled={createM.isPending} className="gap-2">
            <Plus className="h-4 w-4" />{t.rubric.createRubric}
          </Button>
        </div>
      ) : (
        <>
          {/* Rubric title */}
          <Card>
            <CardContent className="p-4">
              <Label>{t.rubric.rubricTitle}</Label>
              <InlineEdit
                value={rubric.title}
                onSave={v => updateTitleM.mutate({ id: rubric.id, title: v })}
                className="text-base font-medium mt-1"
              />
            </CardContent>
          </Card>

          {/* Criteria */}
          <div className="space-y-3">
            {!rubric.criteria.length ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {t.rubric.noCriteria}
                </CardContent>
              </Card>
            ) : rubric.criteria.map(criterion => (
              <CriterionCard
                key={criterion.id}
                criterion={criterion}
                onUpdateCriterion={(id, d) => updateCriterionM.mutate({ id, d })}
                onDeleteCriterion={id => deleteCriterionM.mutate(id)}
                onAddLevel={(criterionId, d) => addLevelM.mutate({ criterionId, d })}
                onUpdateLevel={(id, d) => updateLevelM.mutate({ id, d })}
                onDeleteLevel={id => deleteLevelM.mutate(id)}
              />
            ))}

            {addingCriterion ? (
              <AddCriterionForm
                onAdd={d => { addCriterionM.mutate({ rubricId: rubric.id, d }); setAddingCriterion(false); }}
                onCancel={() => setAddingCriterion(false)}
              />
            ) : (
              <Button variant="outline" className="w-full gap-2" onClick={() => setAddingCriterion(true)}>
                <Plus className="h-4 w-4" />{t.rubric.addCriterion}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
