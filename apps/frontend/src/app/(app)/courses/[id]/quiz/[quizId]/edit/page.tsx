'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { Quiz, QuizQuestionItem, QuestionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label, Select } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Save, Globe, X, Loader2, GripVertical, CheckSquare, Square } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const Q_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'MCQ_SINGLE', label: 'Multiple Choice (single)' },
  { value: 'MCQ_MULTI', label: 'Multiple Choice (multi)' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
];

function QuestionEditor({
  question,
  index,
  onSave,
  onDelete,
}: {
  question: QuizQuestionItem;
  index: number;
  onSave: (id: string, data: Partial<QuizQuestionItem>) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const [body, setBody] = useState(question.body);
  const [type, setType] = useState<QuestionType>(question.type);
  const [options, setOptions] = useState<string[]>(question.options ?? ['', '']);
  const [correctOption, setCorrectOption] = useState<number | number[] | boolean | null>(
    question.correctOption !== undefined ? question.correctOption as any : null
  );
  const [explanation, setExplanation] = useState(question.explanation ?? '');
  const [points, setPoints] = useState(question.points);
  const [dirty, setDirty] = useState(false);

  const mark = () => setDirty(true);

  const handleSave = () => {
    onSave(question.id, { body, type, options: type === 'SHORT_ANSWER' ? undefined : options, correctOption, explanation, points });
    setDirty(false);
  };

  const addOption = () => { setOptions(o => [...o, '']); mark(); };
  const removeOption = (i: number) => { setOptions(o => o.filter((_, idx) => idx !== i)); mark(); };
  const setOption = (i: number, val: string) => { setOptions(o => o.map((x, idx) => idx === i ? val : x)); mark(); };

  const toggleMultiCorrect = (i: number) => {
    const prev = (correctOption as number[] | null) ?? [];
    setCorrectOption(prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
    mark();
  };

  return (
    <Card className="border-border/60">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0 cursor-grab" />
          <span className="text-xs font-semibold text-muted-foreground mt-2.5 shrink-0">Q{index + 1}</span>
          <div className="flex-1 space-y-3">
            {/* Question body */}
            <textarea
              value={body}
              onChange={e => { setBody(e.target.value); mark(); }}
              placeholder={t.courseQuiz.quizQuestionBody}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t.courseQuiz.quizQuestionType}</Label>
                <Select value={type} onChange={e => { setType(e.target.value as QuestionType); mark(); }}>
                  {Q_TYPES.map(qt => <option key={qt.value} value={qt.value}>{qt.label}</option>)}
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t.courseQuiz.quizPoints}</Label>
                <Input type="number" min={1} value={points} onChange={e => { setPoints(Number(e.target.value)); mark(); }} />
              </div>
            </div>

            {/* Options */}
            {(type === 'MCQ_SINGLE' || type === 'MCQ_MULTI') && (
              <div className="space-y-2">
                <Label className="text-xs">{t.courseQuiz.quizOptions}</Label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {type === 'MCQ_SINGLE' ? (
                      <button type="button" onClick={() => { setCorrectOption(i); mark(); }}
                        className={cn('h-4 w-4 rounded-full border-2 shrink-0 transition-colors',
                          correctOption === i ? 'border-primary bg-primary' : 'border-border'
                        )} />
                    ) : (
                      <button type="button" onClick={() => toggleMultiCorrect(i)}>
                        {((correctOption as number[]) ?? []).includes(i)
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    )}
                    <Input value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-1 h-8 text-sm" />
                    {options.length > 2 && (
                      <button type="button" onClick={() => removeOption(i)}><X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <Button type="button" variant="ghost" size="sm" onClick={addOption} className="gap-1.5 text-xs h-7">
                    <Plus className="h-3 w-3" />{t.courseQuiz.quizAddOption}
                  </Button>
                )}
              </div>
            )}

            {/* True/False */}
            {type === 'TRUE_FALSE' && (
              <div className="flex gap-3">
                {[true, false].map(val => (
                  <button key={String(val)} type="button" onClick={() => { setCorrectOption(val); mark(); }}
                    className={cn('flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
                      correctOption === val ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    )}>
                    {val ? t.courseQuiz.quizTrue : t.courseQuiz.quizFalse}
                  </button>
                ))}
              </div>
            )}

            {/* Explanation */}
            <div>
              <Label className="text-xs">{t.courseQuiz.quizExplanation}</Label>
              <Input value={explanation} onChange={e => { setExplanation(e.target.value); mark(); }} placeholder="Why is this the correct answer?" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" onClick={() => onDelete(question.id)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {dirty && (
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} className="gap-1.5 h-7 text-xs">
              <Save className="h-3 w-3" />{t.courseQuiz.quizSave}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function QuizEditPage() {
  const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
  const router = useRouter();
  const t = useT();
  const qc = useQueryClient();

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: ['quiz-edit', quizId],
    queryFn: () => api.get(`/quizzes/${quizId}`),
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [settingsInit, setSettingsInit] = useState(false);

  if (quiz && !settingsInit) {
    setTitle(quiz.title);
    setDescription(quiz.description);
    setTimeLimitMinutes(quiz.timeLimitMinutes ? String(quiz.timeLimitMinutes) : '');
    setMaxAttempts(String(quiz.maxAttempts));
    setShuffleQuestions(quiz.shuffleQuestions);
    setShowResults(quiz.showResults);
    setSettingsInit(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => api.patch(`/quizzes/${quizId}`, {
      title, description,
      timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
      maxAttempts: Number(maxAttempts),
      shuffleQuestions, showResults,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quiz-edit', quizId] }); toast({ title: 'Saved!' }); },
  });

  const publishMutation = useMutation({
    mutationFn: () => api.patch(`/quizzes/${quizId}/publish`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz-edit', quizId] });
      qc.invalidateQueries({ queryKey: ['quizzes', courseId] });
      toast({ title: 'Quiz published!' });
      router.push(`/courses/${courseId}/quiz`);
    },
    onError: (e: any) => toast({ title: e.message, variant: 'destructive' }),
  });

  const addQuestionMutation = useMutation({
    mutationFn: () => api.post(`/quizzes/${quizId}/questions`, { type: 'MCQ_SINGLE', body: '', options: ['', ''], points: 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz-edit', quizId] }),
  });

  const saveQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QuizQuestionItem> }) => api.patch(`/quiz-questions/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz-edit', quizId] }),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quiz-questions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz-edit', quizId] }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!quiz) return null;

  const questions = quiz.questions ?? [];
  const isDraft = quiz.status === 'DRAFT';

  return (
    <div className="max-w-3xl space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push(`/courses/${courseId}/quiz`)}>
          <ArrowLeft className="h-4 w-4" />{t.courseQuiz.quizBackToCourse}
        </Button>
        <div className="flex items-center gap-2">
          <Badge className={quiz.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}>
            {quiz.status === 'PUBLISHED' ? t.courseQuiz.quizPublished : quiz.status === 'CLOSED' ? t.courseQuiz.quizClosed : t.courseQuiz.quizDraft}
          </Badge>
          {isDraft && (
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              {t.courseQuiz.quizPublish}
            </Button>
          )}
        </div>
      </div>

      {/* Settings */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Settings</h2>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz title" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t.courseQuiz.quizTimeLimit} ({t.courseQuiz.quizMinutes})</Label>
              <Input type="number" min={1} max={300} value={timeLimitMinutes} onChange={e => setTimeLimitMinutes(e.target.value)} placeholder="No limit" />
            </div>
            <div>
              <Label className="text-xs">{t.courseQuiz.quizMaxAttempts}</Label>
              <Input type="number" min={1} max={10} value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} className="h-4 w-4 rounded border-border" />
              {t.courseQuiz.quizShuffle}
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showResults} onChange={e => setShowResults(e.target.checked)} className="h-4 w-4 rounded border-border" />
              {t.courseQuiz.quizShowResults}
            </label>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5" size="sm">
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t.courseQuiz.quizSave}
          </Button>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t.courseQuiz.quizQuestions} ({questions.length})</h2>
          <Button size="sm" variant="outline" onClick={() => addQuestionMutation.mutate()} disabled={addQuestionMutation.isPending} className="gap-1.5">
            {addQuestionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {t.courseQuiz.quizAddQuestion}
          </Button>
        </div>

        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">{t.courseQuiz.quizNeedMoreQuestions}</p>
        )}

        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            onSave={(id, data) => saveQuestionMutation.mutate({ id, data })}
            onDelete={(id) => deleteQuestionMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
