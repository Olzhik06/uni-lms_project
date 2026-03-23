'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { Quiz, QuizAttempt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Clock, Hash, RotateCcw, ArrowLeft, Loader2, Play } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function QuizDetailPage() {
  const { id: courseId, quizId } = useParams<{ id: string; quizId: string }>();
  const router = useRouter();
  const t = useT();
  const { data: user } = useMe();

  const { data: quiz, isLoading } = useQuery<Quiz>({
    queryKey: ['quiz', quizId],
    queryFn: () => api.get(`/quizzes/${quizId}`),
  });

  const { data: attempts = [] } = useQuery<QuizAttempt[]>({
    queryKey: ['quiz-attempts', quizId],
    queryFn: () => api.get(`/quizzes/${quizId}/my-attempts`),
    enabled: user?.role === 'STUDENT',
  });

  const startMutation = useMutation({
    mutationFn: () => api.post<QuizAttempt>(`/quizzes/${quizId}/start`, {}),
    onSuccess: (attempt) => {
      router.push(`/courses/${courseId}/quiz/${quizId}/attempt/${attempt.id}`);
    },
    onError: (e: any) => toast({ title: e.message, variant: 'destructive' }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!quiz) return null;

  const submittedAttempts = attempts.filter(a => a.submittedAt);
  const openAttempt = attempts.find(a => !a.submittedAt);
  const attemptsLeft = quiz.maxAttempts - submittedAttempts.length;
  const bestScore = submittedAttempts.length > 0
    ? Math.max(...submittedAttempts.map(a => a.score ?? 0))
    : null;
  const bestPct = bestScore !== null && quiz._count
    ? null
    : null;

  return (
    <div className="max-w-2xl space-y-6 mt-4">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push(`/courses/${courseId}/quiz`)}>
        <ArrowLeft className="h-4 w-4" />{t.courseQuiz.quizBackToCourse}
      </Button>

      <div>
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        {quiz.description && <p className="text-muted-foreground mt-1">{quiz.description}</p>}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t.courseQuiz.quizQuestions}</p>
              <p className="font-semibold">{quiz._count?.questions ?? quiz.questions?.length ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t.courseQuiz.quizTimeLimit}</p>
              <p className="font-semibold">{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} ${t.courseQuiz.quizMinutes}` : '∞'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t.courseQuiz.quizMaxAttempts}</p>
              <p className={cn('font-semibold', attemptsLeft === 0 && 'text-rose-500')}>
                {attemptsLeft} {t.courseQuiz.quizAttemptsLeft}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Past attempts */}
      {submittedAttempts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{t.courseQuiz.quizViewResults}</p>
          {submittedAttempts.map((a) => (
            <Card key={a.id} className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push(`/courses/${courseId}/quiz/${quizId}/attempt/${a.id}/review`)}>
              <CardContent className="py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">#{a.attemptNumber}</span>
                <span className="font-semibold">
                  {a.score ?? '?'} / {a.maxScore ?? '?'} {t.courseQuiz.quizPoints}
                </span>
                <Badge className="bg-primary/10 text-primary text-xs">
                  {a.maxScore ? Math.round(((a.score ?? 0) / a.maxScore) * 100) : 0}%
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Start / Resume */}
      <div className="flex gap-3">
        {openAttempt ? (
          <Button className="flex-1 gap-2" onClick={() => router.push(`/courses/${courseId}/quiz/${quizId}/attempt/${openAttempt.id}`)}>
            <Play className="h-4 w-4" />{t.courseQuiz.quizResume}
          </Button>
        ) : attemptsLeft > 0 ? (
          <Button className="flex-1 gap-2" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
            {startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {t.courseQuiz.quizStart}
          </Button>
        ) : (
          <Button disabled className="flex-1">{t.courseQuiz.quizNoAttempts}</Button>
        )}
      </div>
    </div>
  );
}
