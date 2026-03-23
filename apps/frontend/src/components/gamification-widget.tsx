'use client';
import { useMemo } from 'react';
import type { Grade } from '@/lib/types';
import { useT } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Zap, Flame, Trophy, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── XP / Level config ─────────────────────────────────────────────────────

const LEVELS = [
  { level: 1, label: 'Starter',    xpMin: 0,    xpMax: 199,  color: 'text-slate-500',          bg: 'bg-slate-100 dark:bg-slate-500/[0.12]',   ring: 'ring-slate-200 dark:ring-slate-500/25' },
  { level: 2, label: 'Learner',    xpMin: 200,  xpMax: 499,  color: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-500/[0.12]',     ring: 'ring-blue-200 dark:ring-blue-500/25' },
  { level: 3, label: 'Scholar',    xpMin: 500,  xpMax: 999,  color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/[0.12]', ring: 'ring-violet-200 dark:ring-violet-500/25' },
  { level: 4, label: 'Expert',     xpMin: 1000, xpMax: 1999, color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/[0.12]',   ring: 'ring-amber-200 dark:ring-amber-500/25' },
  { level: 5, label: 'Master',     xpMin: 2000, xpMax: 9999, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/[0.12]', ring: 'ring-emerald-200 dark:ring-emerald-500/25' },
];

function computeStats(grades: Grade[]) {
  // XP = sum of all grade scores
  const xp = grades.reduce((sum, g) => sum + (g.score ?? 0), 0);

  // Level
  const lvlData = LEVELS.slice().reverse().find(l => xp >= l.xpMin) ?? LEVELS[0];
  const nextLvl = LEVELS[lvlData.level] ?? null;
  const progress = nextLvl
    ? Math.min(100, Math.round(((xp - lvlData.xpMin) / (nextLvl.xpMin - lvlData.xpMin)) * 100))
    : 100;

  // Streak: consecutive days with a graded submission (based on gradedAt)
  const days = new Set(
    grades
      .filter(g => g.gradedAt)
      .map(g => new Date(g.gradedAt).toDateString())
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return { xp, lvlData, nextLvl, progress, streak };
}

// ─── Component ─────────────────────────────────────────────────────────────

interface GamificationWidgetProps {
  grades: Grade[];
  compact?: boolean;
}

export function GamificationWidget({ grades, compact = false }: GamificationWidgetProps) {
  const t = useT();
  const { xp, lvlData, nextLvl, progress, streak } = useMemo(
    () => computeStats(grades),
    [grades],
  );
  const levelLabels: Record<number, string> = {
    1: t.gamification.levelStarter,
    2: t.gamification.levelLearner,
    3: t.gamification.levelScholar,
    4: t.gamification.levelExpert,
    5: t.gamification.levelMaster,
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Level badge */}
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-2',
          lvlData.bg, lvlData.ring,
        )}>
          <Trophy className={cn('h-4 w-4', lvlData.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={cn('text-xs font-semibold', lvlData.color)}>
              {t.gamification.lvlPrefix} {lvlData.level} · {levelLabels[lvlData.level]}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">{xp} XP</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-4',
      'bg-background dark:bg-card/80',
      'border-border/50 dark:border-white/[0.07]',
      'shadow-card',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg ring-2',
            lvlData.bg, lvlData.ring,
          )}>
            <Trophy className={cn('h-4 w-4', lvlData.color)} />
          </div>
          <div>
            <p className="text-sm font-semibold">{t.gamification.progress}</p>
            <p className={cn('text-xs font-medium', lvlData.color)}>
              {t.gamification.levelPrefix} {lvlData.level} · {levelLabels[lvlData.level]}
            </p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-sm font-semibold text-orange-500">
            <Flame className="h-4 w-4" />
            {streak}d
          </div>
        )}
      </div>

      {/* XP bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            {xp} XP
          </span>
          {nextLvl && (
            <span className="text-xs text-muted-foreground">
              {nextLvl.xpMin - xp} {t.gamification.toLevel} {nextLvl.level}
            </span>
          )}
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center rounded-lg bg-muted/50 dark:bg-white/[0.03] border border-border/30 dark:border-white/[0.06] py-2.5 px-2">
          <Star className="h-3.5 w-3.5 text-amber-500 mb-1" />
          <span className="text-sm font-semibold tabular-nums">{grades.length}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{t.gamification.grades}</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-muted/50 dark:bg-white/[0.03] border border-border/30 dark:border-white/[0.06] py-2.5 px-2">
          <Zap className="h-3.5 w-3.5 text-primary mb-1" />
          <span className="text-sm font-semibold tabular-nums">{xp}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">XP</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-muted/50 dark:bg-white/[0.03] border border-border/30 dark:border-white/[0.06] py-2.5 px-2">
          <Flame className={cn('h-3.5 w-3.5 mb-1', streak > 0 ? 'text-orange-500' : 'text-muted-foreground/40')} />
          <span className="text-sm font-semibold tabular-nums">{streak}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{t.gamification.streak}</span>
        </div>
      </div>

      {/* Motivational message */}
      {grades.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-0.5">
          {t.gamification.earnXp}
        </p>
      ) : progress === 100 ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 justify-center">
          <TrendingUp className="h-3.5 w-3.5" />
          {t.gamification.maxLevel}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-0.5">
          {nextLvl
            ? `${nextLvl.xpMin - xp} ${t.gamification.xpUntilRank} ${levelLabels[nextLvl.level]}${t.gamification.rank ? ' ' + t.gamification.rank : ''}`
            : t.gamification.keepGoing}
        </p>
      )}
    </div>
  );
}
