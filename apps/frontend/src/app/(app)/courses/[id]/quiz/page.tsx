'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { AiQuiz, QuizQuestion } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Select } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Sparkles, CheckCircle2, XCircle, RotateCcw, Trophy, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage, useT } from '@/lib/i18n';

type QuizMode = 'config' | 'quiz' | 'results';

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useMe();
  const t = useT();
  const { lang } = useLanguage();

  // Config
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState('5');
  const [difficulty, setDifficulty] = useState('medium');

  // Quiz state
  const [quiz, setQuiz] = useState<AiQuiz | null>(null);
  const [mode, setMode] = useState<QuizMode>('config');
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const difficultyLabel = {
    easy: t.courseQuiz.easy,
    medium: t.courseQuiz.medium,
    hard: t.courseQuiz.hard,
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: t.courseQuiz.enterTopic, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await api.post<AiQuiz>('/ai/generate-quiz', {
        courseId: id,
        topic,
        questionCount: parseInt(count),
        difficulty,
        lang,
      });
      setQuiz(result);
      setAnswers({});
      setCurrent(0);
      setShowExplanation(false);
      setMode('quiz');
    } catch (e: any) {
      toast({ title: t.courseQuiz.failedGenerate, description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (answers[current] !== undefined) return; // already answered
    setAnswers(prev => ({ ...prev, [current]: optionIndex }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (!quiz) return;
    setShowExplanation(false);
    if (current + 1 >= quiz.questions.length) {
      setMode('results');
    } else {
      setCurrent(c => c + 1);
    }
  };

  const handleReset = () => {
    setMode('config');
    setQuiz(null);
    setAnswers({});
    setCurrent(0);
    setShowExplanation(false);
  };

  const score = quiz
    ? quiz.questions.filter((q, i) => answers[i] === q.correctIndex).length
    : 0;
  const pct = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;

  if (mode === 'config') {
    return (
      <div className="mt-4 max-w-lg space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            {t.courseQuiz.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher
              ? t.courseQuiz.teacherSubtitle
              : t.courseQuiz.studentSubtitle}
          </p>
        </div>

        <Card>
          <CardContent className="pt-5 space-y-4">
            <div>
              <Label>{t.courseQuiz.topic}</Label>
              <Input
                placeholder={t.courseQuiz.topicPlaceholder}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t.courseQuiz.questions}</Label>
                <Select value={count} onChange={e => setCount(e.target.value)}>
                  {[3, 5, 8, 10, 15].map(n => (
                    <option key={n} value={String(n)}>{n} {t.courseQuiz.questionsSuffix}</option>
                  ))}
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

            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  {t.courseQuiz.generating}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t.courseQuiz.generateQuiz}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'results') {
    return (
      <div className="mt-4 max-w-lg space-y-4">
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Trophy className={cn('h-12 w-12 mx-auto', pct >= 70 ? 'text-yellow-500' : 'text-muted-foreground')} />
            <h2 className="text-2xl font-bold">{pct}%</h2>
            <p className="text-muted-foreground">
              {score} {t.courseQuiz.of} {quiz!.questions.length} {t.courseQuiz.correctCount}
            </p>
            <Badge className={cn(
              'text-sm px-3 py-1',
              pct >= 80 ? 'bg-green-100 text-green-800' :
              pct >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            )}>
              {pct >= 80 ? t.courseQuiz.excellent : pct >= 60 ? t.courseQuiz.goodEffort : t.courseQuiz.keepStudying}
            </Badge>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {quiz!.questions.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <Card key={i} className={cn('border', correct ? 'border-green-200' : 'border-red-200')}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    {correct
                      ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      : <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-medium">{q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.courseQuiz.correctAnswer}: <span className="font-medium text-green-700">{q.options[q.correctIndex]}</span>
                      </p>
                      {!correct && (
                        <p className="text-xs text-red-600 mt-0.5">
                          {t.courseQuiz.yourAnswer}: {q.options[answers[i]]}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button variant="outline" className="w-full gap-2" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" /> {t.courseQuiz.newQuiz}
        </Button>
      </div>
    );
  }

  // Quiz mode
  const q: QuizQuestion = quiz!.questions[current];
  const answered = answers[current] !== undefined;
  const isCorrect = answered && answers[current] === q.correctIndex;

  return (
    <div className="mt-4 max-w-lg space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t.courseQuiz.questionProgress} {current + 1} {t.courseQuiz.of} {quiz!.questions.length}</span>
        <Badge variant="outline" className="capitalize">{difficultyLabel[difficulty as keyof typeof difficultyLabel] ?? difficulty}</Badge>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((current + 1) / quiz!.questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="pt-5">
          <p className="font-medium text-base">{q.question}</p>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isSelected = answers[current] === i;
          const isRight = i === q.correctIndex;
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={answered}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                !answered && 'hover:border-primary hover:bg-primary/5 cursor-pointer',
                answered && isRight && 'border-green-500 bg-green-50 text-green-800',
                answered && isSelected && !isRight && 'border-red-500 bg-red-50 text-red-800',
                answered && !isSelected && !isRight && 'opacity-50',
                !answered && 'border-border bg-card',
              )}
            >
              <span className="font-medium mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
              {opt}
              {answered && isRight && <CheckCircle2 className="inline h-4 w-4 ml-2 text-green-600" />}
              {answered && isSelected && !isRight && <XCircle className="inline h-4 w-4 ml-2 text-red-600" />}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <Card className={cn('border', isCorrect ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50')}>
          <CardContent className="py-3 text-sm">
            <p className="font-medium mb-1">{isCorrect ? `✓ ${t.courseQuiz.correct}` : `✗ ${t.courseQuiz.incorrect}`}</p>
            <p className="text-muted-foreground">{q.explanation}</p>
          </CardContent>
        </Card>
      )}

      {answered && (
        <Button className="w-full" onClick={handleNext}>
          {current + 1 >= quiz!.questions.length ? t.courseQuiz.seeResults : `${t.courseQuiz.nextQuestion} ->`}
        </Button>
      )}
    </div>
  );
}
