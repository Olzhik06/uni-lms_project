'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown,
  AlertCircle, Target, List, MessageSquare, Zap, Loader2, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/form-elements';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { AiReviewResult } from '@/lib/types';

interface AiReviewPanelProps {
  result: AiReviewResult;
  maxScore: number;
  onInsertFeedback: (text: string) => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export function AiReviewPanel({
  result,
  maxScore,
  onInsertFeedback,
  onRegenerate,
  isRegenerating,
}: AiReviewPanelProps) {
  const t = useT();
  const [draftFeedback, setDraftFeedback] = useState(result.draftFeedback);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(draftFeedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidencePct = Math.round(result.confidence * 100);
  const confidenceLevel =
    result.confidence < 0.4 ? 'low' : result.confidence < 0.7 ? 'medium' : 'high';
  const confidenceColor = {
    low: 'text-rose-600 dark:text-rose-400',
    medium: 'text-amber-600 dark:text-amber-400',
    high: 'text-emerald-600 dark:text-emerald-400',
  }[confidenceLevel];

  const rangeMin = result.suggestedScore.min;
  const rangeMax = result.suggestedScore.max;
  const rangeMinPct = (rangeMin / maxScore) * 100;
  const rangeMaxPct = (rangeMax / maxScore) * 100;
  const rangeWidthPct = rangeMaxPct - rangeMinPct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
      className="rounded-2xl border border-violet-200/70 dark:border-violet-500/20 bg-gradient-to-b from-violet-50/90 to-indigo-50/60 dark:from-violet-950/25 dark:to-indigo-950/20 shadow-lg shadow-violet-500/5 dark:shadow-violet-900/10 overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-violet-200/50 dark:border-violet-500/15">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">{t.courseAssignments.aiReviewTitle}</p>
            <p className="text-[10px] text-violet-600/70 dark:text-violet-400/60 leading-tight">
              {result._demo
                ? t.courseAssignments.aiReviewDemoMode
                : t.courseAssignments.aiReviewPreliminary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground leading-tight">{t.courseAssignments.aiReviewConfidence}</p>
            <p className={cn('text-xs font-bold leading-tight', confidenceColor)}>
              {confidencePct}%
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs border-violet-200 dark:border-violet-500/30 hover:bg-violet-100 dark:hover:bg-violet-500/10"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <RotateCcw className="h-3 w-3" />}
            {t.courseAssignments.aiReviewRegenerate}
          </Button>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Summary ── */}
        <div>
          <SectionLabel icon={Zap}>{t.courseAssignments.aiReviewSummary}</SectionLabel>
          <p className="text-sm text-foreground/90 leading-relaxed bg-white/60 dark:bg-white/[0.04] rounded-xl px-4 py-3 border border-violet-100 dark:border-violet-500/10">
            {result.summary}
          </p>
        </div>

        {/* ── Strengths + Weaknesses ── */}
        <div className="grid sm:grid-cols-2 gap-3">
          <ListCard
            title={t.courseAssignments.aiReviewStrengths}
            icon={ThumbsUp}
            items={result.strengths}
            empty={t.courseAssignments.aiReviewNoneIdentified}
            palette="emerald"
            bullet="✓"
          />
          <ListCard
            title={t.courseAssignments.aiReviewWeaknesses}
            icon={ThumbsDown}
            items={result.weaknesses}
            empty={t.courseAssignments.aiReviewNoneIdentified}
            palette="rose"
            bullet="✗"
          />
        </div>

        {/* ── Missing requirements ── */}
        {result.missingRequirements.length > 0 && (
          <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-500/20 p-3.5">
            <SectionLabel icon={AlertCircle} color="amber">{t.courseAssignments.aiReviewMissingReqs}</SectionLabel>
            <ul className="space-y-1.5 mt-2">
              {result.missingRequirements.map((m, i) => (
                <li key={i} className="text-xs text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                  <span className="mt-px text-amber-500 shrink-0">○</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Suggested score range ── */}
        <div>
          <SectionLabel icon={Target}>{t.courseAssignments.aiReviewSuggestedScore}</SectionLabel>
          <div className="bg-white/60 dark:bg-white/[0.04] rounded-xl border border-violet-100 dark:border-violet-500/10 p-4 mt-2">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="text-center shrink-0">
                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300 tabular-nums">
                  {rangeMin}
                </p>
                <p className="text-[10px] text-muted-foreground">{t.courseAssignments.aiReviewMin}</p>
              </div>
              <p className="text-xs text-muted-foreground text-center leading-relaxed flex-1 pt-1">
                {result.suggestedScore.reason}
              </p>
              <div className="text-center shrink-0">
                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300 tabular-nums">
                  {rangeMax}
                </p>
                <p className="text-[10px] text-muted-foreground">{t.courseAssignments.aiReviewMax}</p>
              </div>
            </div>
            <div className="relative h-2.5 rounded-full bg-muted/60 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="absolute top-0 h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                style={{ left: `${rangeMinPct}%`, width: `${Math.max(rangeWidthPct, 2)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
              <span>0</span>
              <span>{maxScore} {t.courseAssignments.pointsShort}</span>
            </div>
          </div>
        </div>

        {/* ── Rubric hints ── */}
        {result.rubricHints.length > 0 && (
          <div>
            <SectionLabel icon={List}>{t.courseAssignments.aiReviewRubricHints}</SectionLabel>
            <div className="rounded-xl border border-violet-100 dark:border-violet-500/10 overflow-hidden bg-white/50 dark:bg-white/[0.02] mt-2">
              {result.rubricHints.map((hint, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 px-4 py-2.5 text-xs',
                    i < result.rubricHints.length - 1 &&
                      'border-b border-violet-100/70 dark:border-violet-500/10',
                  )}
                >
                  <span className="font-semibold text-violet-700 dark:text-violet-400 shrink-0 w-24">
                    {hint.criterion}
                  </span>
                  <span className="text-foreground/80 leading-relaxed">{hint.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Draft feedback ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel icon={MessageSquare}>{t.courseAssignments.aiReviewDraftFeedback}</SectionLabel>
            <p className="text-[10px] text-muted-foreground">{t.courseAssignments.aiReviewEditBefore}</p>
          </div>
          <Textarea
            value={draftFeedback}
            onChange={e => setDraftFeedback(e.target.value)}
            rows={6}
            className="text-sm resize-none bg-white/70 dark:bg-white/[0.04] border-violet-200 dark:border-violet-500/20 focus:ring-violet-500/20"
            placeholder={t.courseAssignments.aiReviewPlaceholder}
          />
          <div className="flex items-center gap-2 mt-2.5">
            <Button
              className="gap-1.5 h-8 text-xs flex-1 bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white shadow-sm"
              onClick={() => onInsertFeedback(draftFeedback)}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {t.courseAssignments.aiReviewInsert}
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 h-8 text-xs border-violet-200 dark:border-violet-500/30 hover:bg-violet-100 dark:hover:bg-violet-500/10 shrink-0"
              onClick={handleCopy}
            >
              {copied
                ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                : <Copy className="h-3.5 w-3.5" />}
              {copied ? t.courseAssignments.aiReviewCopied : t.courseAssignments.aiReviewCopy}
            </Button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  color = 'violet',
  children,
}: {
  icon: React.ElementType;
  color?: 'violet' | 'amber' | 'emerald' | 'rose';
  children: React.ReactNode;
}) {
  const colorMap = {
    violet: 'text-violet-700 dark:text-violet-400',
    amber: 'text-amber-700 dark:text-amber-400',
    emerald: 'text-emerald-700 dark:text-emerald-400',
    rose: 'text-rose-700 dark:text-rose-400',
  };
  return (
    <p className={cn('text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5', colorMap[color])}>
      <Icon className="h-3 w-3" />
      {children}
    </p>
  );
}

function ListCard({
  title,
  icon: Icon,
  items,
  empty,
  palette,
  bullet,
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  empty: string;
  palette: 'emerald' | 'rose';
  bullet: string;
}) {
  const bg = palette === 'emerald'
    ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-500/20'
    : 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-500/20';
  const labelColor = palette === 'emerald'
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-rose-700 dark:text-rose-400';
  const textColor = palette === 'emerald'
    ? 'text-emerald-900 dark:text-emerald-200'
    : 'text-rose-900 dark:text-rose-200';
  const bulletColor = palette === 'emerald'
    ? 'text-emerald-500'
    : 'text-rose-500';

  return (
    <div className={cn('rounded-xl border p-3.5', bg)}>
      <p className={cn('text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5', labelColor)}>
        <Icon className="h-3 w-3" />
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className={cn('text-xs flex items-start gap-1.5', textColor)}>
              <span className={cn('mt-px shrink-0', bulletColor)}>{bullet}</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
