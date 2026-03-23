'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { QuizAttempt, QuizAnalytics } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart2, Users, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function QuizResultsPage() {
  const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
  const router = useRouter();
  const t = useT();
  const [view, setView] = useState<'results' | 'analytics'>('results');

  const { data: results = [], isLoading: loadingResults } = useQuery<QuizAttempt[]>({
    queryKey: ['quiz-results', quizId],
    queryFn: () => api.get(`/quizzes/${quizId}/results`),
    enabled: view === 'results',
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery<QuizAnalytics>({
    queryKey: ['quiz-analytics', quizId],
    queryFn: () => api.get(`/quizzes/${quizId}/analytics`),
    enabled: view === 'analytics',
  });

  const isLoading = view === 'results' ? loadingResults : loadingAnalytics;

  return (
    <div className="max-w-3xl space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push(`/courses/${courseId}/quiz`)}>
          <ArrowLeft className="h-4 w-4" />{t.courseQuiz.quizBackToCourse}
        </Button>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit border border-border/40">
        {(['results', 'analytics'] as const).map((key) => (
          <button key={key} onClick={() => setView(key)}
            className={cn('flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md font-medium transition-colors',
              view === key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}>
            {key === 'results' ? <><Users className="h-3.5 w-3.5" />{t.courseQuiz.quizResults}</> : <><BarChart2 className="h-3.5 w-3.5" />{t.courseQuiz.quizAnalytics}</>}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}

      {/* Results table */}
      {view === 'results' && !isLoading && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">{t.courseQuiz.quizNoResults}</div>
          ) : (
            results.map((attempt) => {
              const pct = attempt.maxScore ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100) : 0;
              return (
                <Card key={attempt.id} className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => router.push(`/courses/${courseId}/quiz/${quizId}/attempt/${attempt.id}/review`)}>
                  <CardContent className="py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attempt.student?.fullName}</p>
                      <p className="text-xs text-muted-foreground">{attempt.student?.email}</p>
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0">#{attempt.attemptNumber}</div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{attempt.score ?? '?'} / {attempt.maxScore ?? '?'}</p>
                      <Badge className={cn('text-xs', pct >= 80 ? 'bg-emerald-100 text-emerald-800' : pct >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}>
                        {pct}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Analytics */}
      {view === 'analytics' && !isLoading && analytics && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{analytics.totalAttempts}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.courseQuiz.quizTotalAttempts}</p>
            </CardContent></Card>
            <Card><CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{analytics.avgScore}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.courseQuiz.quizAvgScore}</p>
            </CardContent></Card>
            <Card><CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{analytics.avgPct}%</p>
              <p className="text-xs text-muted-foreground mt-1">{t.courseQuiz.quizCorrectRate}</p>
            </CardContent></Card>
          </div>

          {/* Per-question stats */}
          {analytics.questions.length > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm font-semibold">{t.courseQuiz.quizQuestions}</p>
                {analytics.questions.map((q, i) => (
                  <div key={q.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground flex-1 mr-2">Q{i + 1}. {q.body}</span>
                      <span className="font-medium shrink-0">
                        {q.correctRate !== null ? `${q.correctRate}%` : '—'}
                      </span>
                    </div>
                    {q.correctRate !== null && (
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', q.correctRate >= 60 ? 'bg-emerald-500' : 'bg-rose-500')}
                          style={{ width: `${q.correctRate}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
