'use client';

/**
 * Dashboard-specific UI components.
 *
 * LIGHT (Premium Academic Editorial):
 *   warm cream · serif headings · thin borders · paper texture
 *
 * DARK (Futuristic Learning OS):
 *   glass panels · teal glow · animated grid hero · monospace details
 */

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
  type Variants,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatTime, formatDate } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Grade, Notification as N, ScheduleItem, Assignment } from '@/lib/types';

// ─── AnimatedCounter ──────────────────────────────────────────────────────────

export function AnimatedCounter({
  value,
  duration = 1.4,
}: {
  value: number;
  duration?: number;
}) {
  const ref     = useRef<HTMLSpanElement>(null);
  const inView  = useInView(ref, { once: true, margin: '-20px' });
  const mv      = useMotionValue(0);
  const display = useTransform(mv, v => Math.round(v).toLocaleString());

  useEffect(() => {
    if (inView) {
      animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] });
    }
  }, [inView, value, mv, duration]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

// ─── Urgency helpers ──────────────────────────────────────────────────────────

type UrgencyLevel = 'today' | 'week' | 'later';

function getDeadlineUrgency(dueAt: string): UrgencyLevel {
  const diffDays = (new Date(dueAt).getTime() - Date.now()) / 86_400_000;
  if (diffDays < 1) return 'today';
  if (diffDays < 7) return 'week';
  return 'later';
}

const URGENCY_DOT: Record<UrgencyLevel, string> = {
  today: 'bg-destructive dark:bg-red-400',
  week:  'bg-amber-500 dark:bg-amber-400',
  later: 'bg-emerald-500 dark:bg-emerald-400',
};

const URGENCY_TEXT: Record<UrgencyLevel, string> = {
  today: 'text-destructive dark:text-red-400 font-medium',
  week:  'text-amber-600 dark:text-amber-400',
  later: 'text-muted-foreground',
};

const URGENCY_RING: Record<UrgencyLevel, string> = {
  today: 'ring-destructive/30 dark:ring-red-400/25',
  week:  'ring-amber-500/30 dark:ring-amber-400/25',
  later: 'ring-emerald-500/25 dark:ring-emerald-400/15',
};

// ─── Schedule colours ─────────────────────────────────────────────────────────

const SCHED_COLORS: Record<string, { bar: string; badge: string; tint: string }> = {
  LECTURE:  {
    bar:   'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20',
    tint:  'dark:bg-blue-400/[0.03]',
  },
  PRACTICE: {
    bar:   'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20',
    tint:  'dark:bg-emerald-400/[0.03]',
  },
  LAB: {
    bar:   'bg-violet-500',
    badge: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-400/10 dark:text-violet-400 dark:border-violet-400/20',
    tint:  'dark:bg-violet-400/[0.03]',
  },
  EXAM: {
    bar:   'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20',
    tint:  'dark:bg-red-400/[0.03]',
  },
};

const FALLBACK_COLORS = {
  bar:   'bg-primary',
  badge: 'bg-muted text-muted-foreground border-border',
  tint:  '',
};

// ─── Hero animation variants ──────────────────────────────────────────────────

const HERO_CONTAINER: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const HERO_ITEM: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

// ─── DashboardHero ────────────────────────────────────────────────────────────

export interface HeroStat { label: string; value: string | number }

interface DashboardHeroProps {
  name?:         string;
  roleLabel:     string;
  subtitle:      string;
  formattedDate: string;
  stats:         HeroStat[];
}

export function DashboardHero({
  name,
  roleLabel,
  subtitle,
  formattedDate,
  stats,
}: DashboardHeroProps) {
  const t         = useT();
  const firstName = name?.split(' ')[0] ?? '';

  return (
    <div className="relative overflow-hidden rounded-2xl">

      {/* ── LIGHT: Ken Burns editorial photo — text-dominant overlay ── */}
      <div className="absolute inset-0 dark:hidden overflow-hidden">
        <motion.div
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 14, ease: 'linear' }}
          className="absolute inset-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&q=75&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover object-[center_40%]"
            priority
          />
        </motion.div>
        {/* Primary left-to-right fade — text must dominate */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/[0.99] via-background/92 to-background/50" />
        {/* Extra left anchor — ensures heading area is always fully readable */}
        <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-background/95 to-transparent" />
        {/* Bottom vignette — grounding the layout */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/88 via-background/15 to-transparent" />
      </div>

      {/* ── DARK: animated grid + pulsing orbs + scan sweep ── */}
      <div className="absolute inset-0 hidden dark:block bg-card overflow-hidden">
        {/* Slowly-scrolling tech grid */}
        <div
          className="absolute inset-0 opacity-[0.32]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),' +
              'linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            animation: 'grid-shift 8s linear infinite',
          }}
        />
        {/* Orb 1 — primary teal, top-left */}
        <motion.div
          className="absolute -top-20 -left-20 h-[28rem] w-[28rem] rounded-full bg-primary/[0.13] blur-[110px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.45, 0.72, 0.45] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Orb 2 — blue, mid-right */}
        <motion.div
          className="absolute top-1/3 right-0 h-52 w-52 rounded-full bg-blue-500/[0.08] blur-[80px]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
        />

        {/* ── SIGNATURE EFFECT: system scan sweep ──────────────────────────
            A translucent band crosses the hero every ~10s — "alive system" cue.
            Width is narrow, opacity is at the threshold of perception.          */}
        <motion.div
          className="absolute inset-y-0 w-40 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.035) 35%, hsl(var(--primary) / 0.06) 50%, hsl(var(--primary) / 0.035) 65%, transparent 100%)',
            left: 0,
          }}
          animate={{ x: ['-160px', '1600px'] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            repeatDelay: 7.5,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-card/10 to-card/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/55 via-transparent to-transparent" />
      </div>

      {/* ── Two-column layout: content left + stats right ── */}
      <motion.div
        variants={HERO_CONTAINER}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col lg:flex-row"
      >
        {/* ── LEFT: content panel ── */}
        <div className="flex-1 px-7 pt-8 pb-6 lg:px-10 lg:pt-10 lg:pb-10">

          {/* Row: date / OS status + role badge */}
          <motion.div
            variants={HERO_ITEM}
            className="flex items-start justify-between gap-4 mb-5"
          >
            <p className="text-[11px] tracking-widest uppercase text-muted-foreground/65 dark:hidden">
              {formattedDate}
            </p>
            <div className="hidden dark:flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-55" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-primary/75">
                {t.dashboard.systemActive}
              </span>
              <span className="hidden lg:block font-mono text-[10px] text-muted-foreground/45 ml-2">
                · {formattedDate}
              </span>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 border-foreground/12 text-foreground/50 text-[11px] dark:border-primary/30 dark:text-primary/70 dark:bg-primary/5"
            >
              {roleLabel}
            </Badge>
          </motion.div>

          {/* Main heading */}
          <motion.div variants={HERO_ITEM}>
            {/* LIGHT: Playfair Display — maximum contrast on cream */}
            <h1
              className="font-serif text-4xl font-bold leading-[1.1] text-foreground dark:hidden lg:text-[2.75rem]"
              style={{ textShadow: '0 1px 3px hsl(38 25% 96% / 0.9)' }}
            >
              {t.dashboard.goodToSee}<br />
              <span className="text-primary italic">{firstName}.</span>
            </h1>

            {/* DARK: Futuristic OS */}
            <div className="hidden dark:block">
              <p className="mb-1.5 font-mono text-[10px] tracking-[0.3em] uppercase text-primary/55">
                {t.dashboard.welcomeBack}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                {firstName}
              </h1>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-0.5 w-10 rounded-full bg-primary shadow-glow-sm" />
                <span className="font-mono text-[11px] text-muted-foreground/60 tracking-wider">
                  {subtitle}
                </span>
              </div>
            </div>
          </motion.div>

          {/* LIGHT: subtitle */}
          <motion.p
            variants={HERO_ITEM}
            className="mt-2.5 text-sm text-foreground/65 dark:hidden max-w-sm leading-relaxed"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* ── RIGHT: stats panel (lg only) ── */}
        {stats.length > 0 && (
          <motion.div
            variants={HERO_ITEM}
            className="hidden lg:flex lg:flex-col lg:justify-center lg:gap-5 lg:w-52 xl:w-60 border-l border-foreground/[0.07] dark:border-white/[0.07] px-7 py-8"
          >
            {stats.slice(0, 3).map((stat, i) => (
              <div key={i}>
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 dark:text-primary/50">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground dark:text-primary">
                  {typeof stat.value === 'number'
                    ? <AnimatedCounter value={stat.value} />
                    : stat.value}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ── Mobile: stats strip ── */}
      {stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative lg:hidden border-t border-foreground/[0.07] dark:border-white/[0.06] grid mx-7 pb-5"
          style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` }}
        >
          {stats.slice(0, 4).map((stat, i) => (
            <div
              key={i}
              className="pt-4 pr-4 border-r border-foreground/[0.07] dark:border-white/[0.06] last:border-0"
            >
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/65 dark:text-primary/50">
                {stat.label}
              </p>
              <p className="mt-1 text-lg font-bold text-foreground dark:text-primary">
                {typeof stat.value === 'number'
                  ? <AnimatedCounter value={stat.value} />
                  : stat.value}
              </p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
// Subtle grain texture on dark cards is the signature design detail:
// it references the paper grain from the light theme, adapted as a
// "digital noise" feel for the dark OS theme.

interface SectionCardProps {
  title:      string;
  icon:       React.ComponentType<{ className?: string }>;
  children:   React.ReactNode;
  className?: string;
  action?:    React.ReactNode;
  variant?:   'default' | 'primary';
}

export function SectionCard({
  title,
  icon: Icon,
  children,
  className,
  action,
  variant = 'default',
}: SectionCardProps) {
  const isPrimary = variant === 'primary';
  return (
    <Card
      className={cn(
        'relative h-full overflow-hidden',
        'border-border/55 transition-shadow duration-200',
        isPrimary ? 'hover:shadow-lift shadow-card' : 'hover:shadow-card',
        'dark:bg-card/85 dark:backdrop-blur-[6px] dark:border-white/[0.07] dark:shadow-glass',
        isPrimary
          ? 'dark:hover:border-primary/30 dark:hover:shadow-glow'
          : 'dark:hover:border-primary/20 dark:hover:shadow-glow-sm',
        className,
      )}
    >
      {/* Signature: subtle digital grain on dark cards */}
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none hidden dark:block opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Top accent line */}
      <div
        className={cn(
          'relative bg-gradient-to-r from-primary/40 via-primary/15 to-transparent dark:from-primary/60 dark:via-primary/25 dark:to-transparent',
          isPrimary ? 'h-[3px]' : 'h-px',
        )}
      />

      <CardHeader className={cn('pb-3', isPrimary ? 'pt-5' : 'pt-4')}>
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'flex items-center justify-center rounded',
                isPrimary ? 'h-7 w-7' : 'h-6 w-6',
                'bg-primary/10 text-primary',
                'dark:bg-primary/[0.12] dark:text-primary dark:ring-1 dark:ring-primary/15',
                isPrimary && 'dark:shadow-glow-sm',
              )}
            >
              <Icon className={isPrimary ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
            </div>
            <span
              className={cn(
                'font-semibold uppercase tracking-widest text-muted-foreground/75 dark:text-primary/55',
                isPrimary ? 'text-[12px]' : 'text-[11px]',
              )}
            >
              {title}
            </span>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-5">{children}</CardContent>
    </Card>
  );
}

// ─── StatTile ─────────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
}

export function StatTile({ label, value, icon: Icon }: StatTileProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 transition-all duration-200',
        'bg-card border-border/50 hover:shadow-card',
        'dark:bg-card/80 dark:backdrop-blur-sm dark:border-white/[0.07]',
        'dark:hover:border-primary/25 dark:hover:shadow-glow-sm',
      )}
    >
      <div className="absolute left-0 inset-y-0 w-[3px] rounded-r bg-primary/20 dark:hidden" />
      <div className="absolute top-0 right-0 h-14 w-14 rounded-bl-full bg-primary/[0.06] hidden dark:block" />

      <div className="flex items-start justify-between gap-2">
        <div className="pl-1 dark:pl-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/65 dark:text-primary/50">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-foreground dark:text-primary">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
        </div>
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary/65 dark:bg-primary/10 dark:text-primary/70">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ScheduleRow — Calendar block style ───────────────────────────────────────
// Distinct "calendar block" identity: prominent time pill left, colored
// course badge, subtle course-type tint in dark mode.

export function ScheduleRow({ item }: { item: ScheduleItem }) {
  const colors = SCHED_COLORS[item.type] ?? FALLBACK_COLORS;

  return (
    <div
      className={cn(
        'flex items-stretch overflow-hidden rounded-lg border transition-colors duration-150',
        'border-border/40 bg-background hover:bg-muted/30',
        'dark:border-white/[0.05] dark:hover:bg-white/[0.04]',
        colors.tint,
      )}
    >
      {/* Type colour bar */}
      <div className={cn('w-[3px] shrink-0', colors.bar)} />

      {/* Time block — calendar-style left column */}
      <div
        className={cn(
          'flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-border/30 dark:border-white/[0.05] px-1 py-3',
          'bg-muted/20 dark:bg-white/[0.015]',
        )}
      >
        <p className="text-[11px] font-bold tabular-nums text-foreground dark:font-mono dark:text-primary dark:text-[10px]">
          {formatTime(item.startsAt)}
        </p>
        <div className="h-px w-4 bg-border/50 dark:bg-white/[0.1]" />
        <p className="text-[10px] tabular-nums text-muted-foreground dark:font-mono dark:text-muted-foreground/55">
          {formatTime(item.endsAt)}
        </p>
      </div>

      {/* Course info */}
      <div className="flex flex-1 flex-col justify-center gap-1 px-3 py-3">
        <p className="truncate text-sm font-medium leading-none">{item.course?.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-medium', colors.badge)}>
            {item.type}
          </span>
          {item.room && (
            <span className="text-[10px] text-muted-foreground">{item.room}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DeadlineRow + DeadlineTimeline — Timeline style ─────────────────────────
// Identity: urgency dot is a timeline node, vertical track connects items.
// The card is the content; the dot lives OUTSIDE the card, as a timeline marker.

export function DeadlineRow({ assignment }: { assignment: Assignment }) {
  const urgency = getDeadlineUrgency(assignment.dueAt);

  return (
    <Link href={`/courses/${assignment.courseId}/assignments`}>
      <div className="group flex items-start gap-3">
        {/* Timeline node */}
        <div className="relative mt-[0.6rem] flex shrink-0 flex-col items-center">
          <div
            className={cn(
              'relative z-10 h-2.5 w-2.5 rounded-full ring-2 ring-offset-2 ring-offset-card dark:ring-offset-card',
              URGENCY_DOT[urgency],
              URGENCY_RING[urgency],
              urgency === 'today' && 'animate-pulse',
            )}
          />
        </div>
        {/* Card */}
        <div
          className={cn(
            'flex-1 rounded-lg border px-3 py-2.5 transition-all duration-150 cursor-pointer',
            'border-border/40 bg-background hover:bg-muted/30 hover:border-border',
            'dark:border-white/[0.05] dark:bg-white/[0.02] dark:hover:bg-white/[0.04] dark:hover:border-white/[0.1]',
          )}
        >
          <p className="truncate text-sm font-medium group-hover:text-primary transition-colors duration-150">
            {assignment.title}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {assignment.course && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {assignment.course.code}
              </Badge>
            )}
            <span className={cn('text-xs', URGENCY_TEXT[urgency])}>
              {formatDate(assignment.dueAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function DeadlineTimeline({ assignments }: { assignments: Assignment[] }) {
  return (
    <div className="relative">
      {/* Vertical timeline track — fades out at bottom */}
      <div className="absolute left-[0.3rem] top-4 bottom-2 w-px bg-gradient-to-b from-border/60 via-border/35 to-transparent dark:from-white/[0.1] dark:via-white/[0.04] dark:to-transparent" />
      <div className="space-y-2.5">
        {assignments.map(a => (
          <DeadlineRow key={a.id} assignment={a} />
        ))}
      </div>
    </div>
  );
}

// ─── GradeRow — Metric card style ────────────────────────────────────────────
// Identity: animated progress bar shows score at a glance.
// The percentage is the primary data point; bar makes magnitude physical.

export function GradeRow({ grade }: { grade: Grade }) {
  const score    = grade.score;
  const maxScore = grade.submission?.assignment?.maxScore ?? 100;
  const pct      = Math.round((score / maxScore) * 100);
  const title    = grade.submission?.assignment?.title ?? '—';
  const code     = grade.submission?.assignment?.course?.code;
  const ref      = useRef<HTMLDivElement>(null);
  const inView   = useInView(ref, { once: true });

  const textColor =
    pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    pct >= 60 ? 'text-amber-600   dark:text-amber-400'   :
                'text-destructive  dark:text-red-400';

  const bgColor =
    pct >= 80 ? 'bg-emerald-50 dark:bg-emerald-400/10' :
    pct >= 60 ? 'bg-amber-50   dark:bg-amber-400/10'   :
                'bg-red-50      dark:bg-red-400/10';

  const barColor =
    pct >= 80 ? 'bg-emerald-500 dark:bg-emerald-400' :
    pct >= 60 ? 'bg-amber-500   dark:bg-amber-400'   :
                'bg-destructive  dark:bg-red-400';

  return (
    <div ref={ref} className="rounded-lg border border-border/35 dark:border-white/[0.05] px-3 py-2.5">
      <div className="flex items-center gap-3">
        {/* Score circle */}
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            textColor, bgColor,
          )}
        >
          {score}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-none">{title}</p>
          <div className="mt-1 flex items-center gap-1.5">
            {code && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{code}</Badge>
            )}
            <span className="text-xs text-muted-foreground">{score} / {maxScore}</span>
          </div>
        </div>

        <span className={cn('shrink-0 text-xs font-bold tabular-nums', textColor)}>
          {pct}%
        </span>
      </div>

      {/* Progress track — animates on enter */}
      <div className="mt-2 h-[3px] w-full rounded-full bg-muted dark:bg-white/[0.06] overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: inView ? `${pct}%` : 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </div>
    </div>
  );
}

// ─── NotificationItem — Feed list style ──────────────────────────────────────
// Identity: left accent bar marks unread state, like an RSS/inbox feed.
// Background is subtly tinted; bar fades on read.

export function NotificationItem({
  notification,
  content,
}: {
  notification: N;
  content:      { title: string; body: string };
}) {
  return (
    <Link href={notification.link || '#'}>
      <div
        className={cn(
          'group relative flex cursor-pointer items-start gap-3 rounded-lg transition-all duration-150 pl-3 pr-3 py-2.5',
          'border border-l-[3px]',
          // Light: soft tinted background, green left bar
          'border-border/30 border-l-primary/40 bg-accent/20 hover:bg-accent/40 hover:border-l-primary/70',
          // Dark: glass surface, teal left bar
          'dark:border-white/[0.05] dark:border-l-primary/50 dark:bg-white/[0.025] dark:hover:bg-white/[0.05] dark:hover:border-l-primary/80',
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors duration-150">
            {content.title}
          </p>
          {content.body && (
            <p className="mt-0.5 text-xs text-muted-foreground/75 line-clamp-2 leading-relaxed">
              {content.body}
            </p>
          )}
        </div>
        {/* Unread dot (right side) */}
        <div className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 dark:bg-primary dark:shadow-glow-sm" />
      </div>
    </Link>
  );
}

// ─── QuickActionCard ──────────────────────────────────────────────────────────

export function QuickActionCard({
  href,
  label,
  description,
  icon: Icon,
}: {
  href:        string;
  label:       string;
  description: string;
  icon:        React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.18 }}
        className={cn(
          'group relative flex cursor-pointer items-start gap-3.5 overflow-hidden rounded-xl border p-4 transition-all duration-200',
          'border-border/50 bg-background hover:bg-muted/40 hover:border-primary/20 hover:shadow-card',
          'dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-primary/[0.07] dark:hover:border-primary/25 dark:hover:shadow-glow-sm',
        )}
      >
        {/* Shimmer sweep — dark only */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/[0.06] to-transparent hidden dark:block group-hover:animate-shimmer pointer-events-none" />

        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
            'bg-primary/10 text-primary',
            'dark:bg-primary/[0.12] dark:text-primary',
            'group-hover:bg-primary/15 dark:group-hover:bg-primary/20 dark:group-hover:shadow-glow-sm',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none mb-1 group-hover:text-primary transition-colors duration-150">
            {label}
          </p>
          <p className="text-xs text-muted-foreground/75 leading-snug line-clamp-2">
            {description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
