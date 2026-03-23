'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { QuizAttempt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Loader2, HelpCircle } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function AttemptReviewPage() {
  const { id: courseId, quizId, attemptId } = useParams<{ id: string; quizId: string; attemptId: string }>();
  const router = useRouter();
  const t = useT();

  const { data: attempt, isLoading } = useQuery<QuizAttempt>({
    queryKey: ['attempt', attemptId],
    queryFn: () => api.get(`/quiz-attempts/${attemptId}`),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!attempt) return null;

  const pct = attempt.maxScore ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100) : 0;
  const showResults = attempt.quiz?.showResults ?? true;

  return (
    <div className="max-w-2xl space-y-6 mt-4">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push(`/courses/${courseId}/quiz/${quizId}`)}>
        <ArrowLeft className="h-4 w-4" />{t.courseQuiz.quizBackToCourse}
      </Button>

      {/* Score card */}
      <Card className={cn('text-center border-2', pct >= 80 ? 'border-emerald-300 dark:border-emerald-600' : pct >= 60 ? 'border-amber-300 dark:border-amber-600' : 'border-rose-300 dark:border-rose-600')}>
        <CardContent className="py-8 space-y-3">
          <p className="text-5xl font-bold tabular-nums">{pct}%</p>
          <p className="text-muted-foreground text-sm">
            {attempt.score ?? 0} {t.courseQuiz.quizOf} {attempt.maxScore ?? 0} {t.courseQuiz.quizPoints}
          </p>
          {attempt.timeTakenSeconds && (
            <p className="flex items-center gap-1 justify-center text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {Math.floor(attempt.timeTakenSeconds / 60)}m {attempt.timeTakenSeconds % 60}s
            </p>
          )}
          <Badge className={cn('text-sm px-4 py-1', pct >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : pct >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}>
            {pct >= 80 ? t.courseQuiz.quizCorrect : pct >= 60 ? '👍 Good' : t.courseQuiz.quizIncorrect}
          </Badge>
        </CardContent>
      </Card>

      {/* Answer review */}
      {showResults && attempt.answers && attempt.answers.length > 0 && (
        <div className="space-y-3">
          {attempt.answers.map((record) => {
            const q = record.question;
            if (!q) return null;
            const statusIcon =
              record.isCorrect === true ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> :
              record.isCorrect === false ? <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" /> :
              <HelpCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;

            return (
              <Card key={record.id} className={cn('border', record.isCorrect === true ? 'border-emerald-200 dark:border-emerald-700' : record.isCorrect === false ? 'border-rose-200 dark:border-rose-700' : 'border-amber-200 dark:border-amber-700')}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {statusIcon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{q.body}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        {/* Student answer */}
                        <p className="text-muted-foreground">
                          Your answer:{' '}
                          <span className={cn('font-medium', record.isCorrect === true ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                            {q.type === 'TRUE_FALSE'
                              ? (record.answer ? t.courseQuiz.quizTrue : t.courseQuiz.quizFalse)
                              : q.type === 'MCQ_SINGLE' && q.options && typeof record.answer === 'number'
                              ? q.options[record.answer]
                              : q.type === 'MCQ_MULTI' && q.options && Array.isArray(record.answer)
                              ? (record.answer as number[]).map(i => q.options![i]).join(', ')
                              : String(record.answer ?? '—')}
                          </span>
                        </p>
                        {/* Correct answer (if shown and wrong) */}
                        {record.isCorrect === false && q.correctOption !== undefined && q.correctOption !== null && (
                          <p className="text-muted-foreground">
                            Correct:{' '}
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">
                              {q.type === 'TRUE_FALSE'
                                ? (q.correctOption ? t.courseQuiz.quizTrue : t.courseQuiz.quizFalse)
                                : q.type === 'MCQ_SINGLE' && q.options
                                ? q.options[q.correctOption as number]
                                : q.type === 'MCQ_MULTI' && q.options
                                ? (q.correctOption as number[]).map(i => q.options![i]).join(', ')
                                : String(q.correctOption)}
                            </span>
                          </p>
                        )}
                        {/* Pending review */}
                        {record.isCorrect === null && (
                          <p className="text-amber-600 dark:text-amber-400 font-medium">{t.courseQuiz.quizPending}</p>
                        )}
                        {/* Teacher note */}
                        {record.teacherNote && (
                          <p className="text-muted-foreground italic">{record.teacherNote}</p>
                        )}
                        {/* Points */}
                        <p className="text-muted-foreground">
                          {record.pointsEarned ?? '?'} / {q.points} pts
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Explanation */}
                  {q.explanation && record.isCorrect !== null && (
                    <p className="text-xs text-muted-foreground italic border-t border-border pt-2">{q.explanation}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!showResults && (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">
          Results are hidden by your instructor.
        </CardContent></Card>
      )}
    </div>
  );
}
