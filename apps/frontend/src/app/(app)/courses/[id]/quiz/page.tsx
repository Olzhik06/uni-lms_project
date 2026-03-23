'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { AiQuiz, AiQuizQuestion, Quiz } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label, Select } from '@/components/ui/form-elements';
import { toast } from '@/hooks/use-toast';
import {
  Sparkles, CheckCircle2, XCircle, RotateCcw, Trophy, Brain,
  Plus, Clock, BarChart2, ChevronRight, Lock, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage, useT } from '@/lib/i18n';

// ── Quiz list tab ──────────────────────────────────────────────────────────

function QuizListTab({ courseId }: { courseId: string }) {
  const t = useT();
  const router = useRouter();
  const { data: user } = useMe();
  const qc = useQueryClient();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes', courseId],
    queryFn: () => api.get(`/courses/${courseId}/quizzes`),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post<Quiz>(`/courses/${courseId}/quizzes`, { title: 'New Quiz' }),
    onSuccess: (quiz) => {
      qc.invalidateQueries({ queryKey: ['quizzes', courseId] });
      router.push(`/courses/${courseId}/quiz/${quiz.id}/edit`);
    },
  });

  const statusColor = {
    DRAFT: 'bg-muted text-muted-foreground',
    PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    CLOSED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  };
  const statusLabel = {
    DRAFT: t.courseQuiz.quizDraft,
    PUBLISHED: t.courseQuiz.quizPublished,
    CLOSED: t.courseQuiz.quizClosed,
  };

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  );

  return (
    <div className="space-y-4 mt-4">
      {isTeacher && (
        <div className="flex justify-end">
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="gap-2">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t.courseQuiz.quizCreate}
          </Button>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Brain className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-foreground">{t.courseQuiz.quizEmpty}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher ? t.courseQuiz.quizEmptyTeacher : t.courseQuiz.quizEmptyStudent}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {quizzes.map((quiz) => {
            const attemptsLeft = quiz.maxAttempts - (quiz.myAttempts ?? 0);
            const canStart = quiz.status === 'PUBLISHED' && attemptsLeft > 0;
            return (
              <Card key={quiz.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full', statusColor[quiz.status])}>
                        {statusLabel[quiz.status]}
                      </span>
                      {quiz.timeLimitMinutes && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{quiz.timeLimitMinutes} {t.courseQuiz.quizMinutes}
                        </span>
                      )}
                    </div>
                    <p className="font-medium truncate">{quiz.title}</p>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{quiz._count?.questions ?? 0} {t.courseQuiz.quizQuestions}</span>
                      {!isTeacher && quiz.status === 'PUBLISHED' && (
                        <span className={cn(attemptsLeft === 0 && 'text-rose-500')}>
                          {attemptsLeft} {t.courseQuiz.quizAttemptsLeft}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isTeacher ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/courses/${courseId}/quiz/${quiz.id}/results`)}>
                          <BarChart2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" onClick={() => router.push(`/courses/${courseId}/quiz/${quiz.id}/edit`)}>
                          {t.courseQuiz.quizEdit}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!canStart}
                        onClick={() => router.push(`/courses/${courseId}/quiz/${quiz.id}`)}
                        className="gap-1.5"
                      >
                        {!canStart && <Lock className="h-3.5 w-3.5" />}
                        {canStart ? t.courseQuiz.quizStart : t.courseQuiz.quizClosed}
                        {canStart && <ChevronRight className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── AI Practice tab (existing logic) ──────────────────────────────────────

type QuizMode = 'config' | 'quiz' | 'results';

function AiPracticeTab({ courseId }: { courseId: string }) {
  const t = useT();
  const { lang } = useLanguage();
  const { data: user } = useMe();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [topic, setTopic] = useState('');
  const [count, setCount] = useState('5');
  const [difficulty, setDifficulty] = useState('medium');
  const [quiz, setQuiz] = useState<AiQuiz | null>(null);
  const [mode, setMode] = useState<QuizMode>('config');
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const difficultyLabel = { easy: t.courseQuiz.easy, medium: t.courseQuiz.medium, hard: t.courseQuiz.hard };

  const handleGenerate = async () => {
    if (!topic.trim()) { toast({ title: t.courseQuiz.enterTopic, variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const result = await api.post<AiQuiz>('/ai/generate-quiz', { courseId, topic, questionCount: parseInt(count), difficulty, lang });
      setQuiz(result); setAnswers({}); setCurrent(0); setShowExplanation(false); setMode('quiz');
    } catch (e: any) {
      toast({ title: t.courseQuiz.failedGenerate, description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleAnswer = (i: number) => {
    if (answers[current] !== undefined) return;
    setAnswers(prev => ({ ...prev, [current]: i }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (!quiz) return;
    setShowExplanation(false);
    if (current + 1 >= quiz.questions.length) { setMode('results'); } else { setCurrent(c => c + 1); }
  };

  const handleReset = () => { setMode('config'); setQuiz(null); setAnswers({}); setCurrent(0); setShowExplanation(false); };

  const score = quiz ? quiz.questions.filter((q, i) => answers[i] === q.correctIndex).length : 0;
  const pct = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;

  if (mode === 'results') {
    return (
      <div className="mt-4 max-w-lg space-y-4">
        <Card><CardContent className="pt-6 text-center space-y-3">
          <Trophy className={cn('h-12 w-12 mx-auto', pct >= 70 ? 'text-yellow-500' : 'text-muted-foreground')} />
          <h2 className="text-2xl font-bold">{pct}%</h2>
          <p className="text-muted-foreground">{score} {t.courseQuiz.of} {quiz!.questions.length} {t.courseQuiz.correctCount}</p>
          <Badge className={cn('text-sm px-3 py-1', pct >= 80 ? 'bg-green-100 text-green-800' : pct >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}>
            {pct >= 80 ? t.courseQuiz.excellent : pct >= 60 ? t.courseQuiz.goodEffort : t.courseQuiz.keepStudying}
          </Badge>
        </CardContent></Card>
        <div className="space-y-3">
          {quiz!.questions.map((q: AiQuizQuestion, i: number) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <Card key={i} className={cn('border', correct ? 'border-green-200' : 'border-red-200')}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    {correct ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" /> : <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium">{q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.courseQuiz.correctAnswer}: <span className="font-medium text-green-700">{q.options[q.correctIndex]}</span></p>
                      {!correct && <p className="text-xs text-red-600 mt-0.5">{t.courseQuiz.yourAnswer}: {q.options[answers[i]]}</p>}
                      <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Button variant="outline" className="w-full gap-2" onClick={handleReset}><RotateCcw className="h-4 w-4" /> {t.courseQuiz.newQuiz}</Button>
      </div>
    );
  }

  if (mode === 'quiz') {
    const q: AiQuizQuestion = quiz!.questions[current];
    const answered = answers[current] !== undefined;
    const isCorrect = answered && answers[current] === q.correctIndex;
    return (
      <div className="mt-4 max-w-lg space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.courseQuiz.questionProgress} {current + 1} {t.courseQuiz.of} {quiz!.questions.length}</span>
          <Badge variant="outline" className="capitalize">{difficultyLabel[difficulty as keyof typeof difficultyLabel] ?? difficulty}</Badge>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${((current + 1) / quiz!.questions.length) * 100}%` }} />
        </div>
        <Card><CardContent className="pt-5"><p className="font-medium text-base">{q.question}</p></CardContent></Card>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const isSelected = answers[current] === i;
            const isRight = i === q.correctIndex;
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
                className={cn('w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                  !answered && 'hover:border-primary hover:bg-primary/5 cursor-pointer',
                  answered && isRight && 'border-green-500 bg-green-50 text-green-800',
                  answered && isSelected && !isRight && 'border-red-500 bg-red-50 text-red-800',
                  answered && !isSelected && !isRight && 'opacity-50',
                  !answered && 'border-border bg-card'
                )}>
                <span className="font-medium mr-2">{['A','B','C','D'][i]}.</span>{opt}
                {answered && isRight && <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-600" />}
                {answered && isSelected && !isRight && <XCircle className="inline h-4 w-4 ml-2 text-red-600" />}
              </button>
            );
          })}
        </div>
        {showExplanation && (
          <Card className={cn('border', isCorrect ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50')}>
            <CardContent className="py-3 text-sm">
              <p className="font-medium mb-1">{isCorrect ? `✓ ${t.courseQuiz.correct}` : `✗ ${t.courseQuiz.incorrect}`}</p>
              <p className="text-muted-foreground">{q.explanation}</p>
            </CardContent>
          </Card>
        )}
        {answered && <Button className="w-full" onClick={handleNext}>{current + 1 >= quiz!.questions.length ? t.courseQuiz.seeResults : `${t.courseQuiz.nextQuestion} ->`}</Button>}
      </div>
    );
  }

  return (
    <div className="mt-4 max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><Brain className="h-5 w-5 text-purple-600" />{t.courseQuiz.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{isTeacher ? t.courseQuiz.teacherSubtitle : t.courseQuiz.studentSubtitle}</p>
      </div>
      <Card><CardContent className="pt-5 space-y-4">
        <div>
          <Label>{t.courseQuiz.topic}</Label>
          <Input placeholder={t.courseQuiz.topicPlaceholder} value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t.courseQuiz.questions}</Label>
            <Select value={count} onChange={e => setCount(e.target.value)}>
              {[3,5,8,10,15].map(n => <option key={n} value={String(n)}>{n} {t.courseQuiz.questionsSuffix}</option>)}
            </Select>
          </div>
          <div>
            <Label>{t.courseQuiz.difficulty}</Label>
            <Select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">{t.courseQuiz.easy}</option>
              <option value="medium">{t.courseQuiz.medium}</option>
              <option value="hard">{t.courseQuiz.hard}</option>
            </Select>
          </div>
        </div>
        <Button className="w-full gap-2" onClick={handleGenerate} disabled={loading || !topic.trim()}>
          {loading ? <><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />{t.courseQuiz.generating}</> : <><Sparkles className="h-4 w-4" />{t.courseQuiz.generateQuiz}</>}
        </Button>
      </CardContent></Card>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2.5">{t.courseQuiz.suggestedTopics}</p>
        <div className="flex flex-wrap gap-2">
          {['SQL Joins & Aggregation','Entity-Relationship Diagrams','Normalization (1NF–3NF)','Indexing & Query Optimization','Transactions & ACID','NoSQL vs Relational'].map(s => (
            <button key={s} type="button" onClick={() => setTopic(s)}
              className="flex items-center gap-1.5 rounded-full border border-border/50 dark:border-white/[0.1] bg-background dark:bg-white/[0.03] hover:bg-muted/60 hover:border-primary/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Sparkles className="h-3 w-3 text-purple-400 shrink-0" />{s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const t = useT();
  const [tab, setTab] = useState<'quizzes' | 'practice'>('quizzes');

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit border border-border/40">
        {(['quizzes', 'practice'] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-4 py-1.5 text-sm rounded-md font-medium transition-colors',
              tab === key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}>
            {key === 'quizzes' ? t.courseQuiz.tabQuizzes : t.courseQuiz.tabPractice}
          </button>
        ))}
      </div>

      {tab === 'quizzes' ? <QuizListTab courseId={id} /> : <AiPracticeTab courseId={id} />}
    </div>
  );
}
