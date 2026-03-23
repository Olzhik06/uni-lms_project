'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { QuizAttempt, QuizQuestionItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Clock, Loader2, CheckSquare, Square } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function Timer({ endsAt, onExpire }: { endsAt: Date; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000)));
  const expired = useRef(false);

  useEffect(() => {
    const iv = setInterval(() => {
      const r = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
      setRemaining(r);
      if (r === 0 && !expired.current) { expired.current = true; onExpire(); }
    }, 1000);
    return () => clearInterval(iv);
  }, [endsAt, onExpire]);

  const m = Math.floor(remaining / 60), s = remaining % 60;
  const urgent = remaining < 60;
  return (
    <span className={cn('flex items-center gap-1 font-mono text-sm font-semibold tabular-nums', urgent && 'text-rose-500 animate-pulse')}>
      <Clock className="h-4 w-4" />{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  );
}

export default function AttemptPage() {
  const { id: courseId, quizId, attemptId } = useParams<{ id: string; quizId: string; attemptId: string }>();
  const router = useRouter();
  const t = useT();

  const { data: attempt, isLoading } = useQuery<QuizAttempt>({
    queryKey: ['attempt', attemptId],
    queryFn: () => api.get(`/quiz-attempts/${attemptId}`),
  });

  const [answers, setAnswers] = useState<Record<string, number | number[] | boolean | string | null>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const submitMutation = useMutation({
    mutationFn: (timeTaken: number) => api.post(`/quiz-attempts/${attemptId}/submit`, { answers, timeTakenSeconds: timeTaken }),
    onSuccess: () => router.push(`/courses/${courseId}/quiz/${quizId}/attempt/${attemptId}/review`),
    onError: (e: any) => { setSubmitting(false); toast({ title: e.message, variant: 'destructive' }); },
  });

  const handleSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = attempt ? Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000) : 0;
    submitMutation.mutate(timeTaken);
  };

  const handleExpire = () => {
    toast({ title: t.courseQuiz.quizTimeUp, description: t.courseQuiz.quizAutoSubmitted });
    handleSubmit();
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!attempt?.quiz) return null;

  const questions: QuizQuestionItem[] = attempt.quiz.questions ?? [];
  if (questions.length === 0) return null;

  const q = questions[current];
  const endsAt = attempt.quiz.timeLimitMinutes
    ? new Date(new Date(attempt.startedAt).getTime() + attempt.quiz.timeLimitMinutes * 60 * 1000)
    : null;

  const setAnswer = (val: number | number[] | boolean | string) => {
    setAnswers(prev => ({ ...prev, [q.id]: val }));
  };

  const toggleMulti = (idx: number) => {
    const prev = (answers[q.id] as number[] | undefined) ?? [];
    const next = prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx];
    setAnswers(a => ({ ...a, [q.id]: next }));
  };

  const answered = answers[q.id] !== undefined && answers[q.id] !== null;

  return (
    <div className="max-w-2xl space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{attempt.quiz.title}</p>
          <p className="font-semibold">{t.courseQuiz.quizQuestions} {current + 1} / {questions.length}</p>
        </div>
        {endsAt && <Timer endsAt={endsAt} onExpire={handleExpire} />}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="font-medium text-base leading-relaxed">{q.body}</p>
          <p className="text-xs text-muted-foreground">{q.points} pt{q.points !== 1 ? 's' : ''}</p>

          {/* MCQ_SINGLE */}
          {q.type === 'MCQ_SINGLE' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => setAnswer(i)}
                  className={cn('w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                    answers[q.id] === i ? 'border-primary bg-primary/5 text-foreground' : 'border-border hover:border-primary/40 hover:bg-muted/40'
                  )}>
                  <span className="font-medium mr-2">{['A','B','C','D','E'][i]}.</span>{opt}
                </button>
              ))}
            </div>
          )}

          {/* MCQ_MULTI */}
          {q.type === 'MCQ_MULTI' && q.options && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground italic">Select all that apply</p>
              {q.options.map((opt, i) => {
                const selected = ((answers[q.id] as number[]) ?? []).includes(i);
                return (
                  <button key={i} onClick={() => toggleMulti(i)}
                    className={cn('w-full text-left px-4 py-3 rounded-lg border text-sm flex items-center gap-3 transition-colors',
                      selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    )}>
                    {selected ? <CheckSquare className="h-4 w-4 text-primary shrink-0" /> : <Square className="h-4 w-4 text-muted-foreground shrink-0" />}
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* TRUE_FALSE */}
          {q.type === 'TRUE_FALSE' && (
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button key={String(val)} onClick={() => setAnswer(val)}
                  className={cn('flex-1 py-3 rounded-lg border text-sm font-medium transition-colors',
                    answers[q.id] === val ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'
                  )}>
                  {val ? t.courseQuiz.quizTrue : t.courseQuiz.quizFalse}
                </button>
              ))}
            </div>
          )}

          {/* SHORT_ANSWER */}
          {q.type === 'SHORT_ANSWER' && (
            <textarea
              rows={4}
              value={(answers[q.id] as string) ?? ''}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Type your answer here…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Prev</Button>
        {current < questions.length - 1 ? (
          <Button className="flex-1" onClick={() => setCurrent(c => c + 1)}>Next →</Button>
        ) : (
          <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t.courseQuiz.quizSubmit}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={cn('h-7 w-7 rounded-md text-xs font-medium transition-colors border',
              i === current ? 'bg-primary text-primary-foreground border-primary' :
              answers[questions[i].id] !== undefined ? 'bg-primary/10 text-primary border-primary/30' :
              'bg-muted text-muted-foreground border-border hover:border-primary/40'
            )}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
