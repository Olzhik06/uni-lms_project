'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchResults } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, Calendar, BookOpen, CalendarDays,
  Bell, User, Shield, Activity, BookMarked, FileText,
  Megaphone, ArrowRight, Hash, X, Loader2,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ResultItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ElementType;
  group: string;
}

// ─── Keyboard shortcut hint ────────────────────────────────────────────────

function KbdHint({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
      {children}
    </kbd>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const NAV_ITEMS = [
    { label: t.nav.dashboard,     href: '/dashboard',    icon: LayoutDashboard, group: t.commandPalette.groupPages },
    { label: t.nav.courses,       href: '/courses',       icon: BookOpen,        group: t.commandPalette.groupPages },
    { label: t.nav.schedule,      href: '/schedule',      icon: Calendar,        group: t.commandPalette.groupPages },
    { label: t.nav.calendar,      href: '/calendar',      icon: CalendarDays,    group: t.commandPalette.groupPages },
    { label: t.nav.notifications, href: '/notifications', icon: Bell,            group: t.commandPalette.groupPages },
    { label: t.nav.activity,      href: '/activity',      icon: Activity,        group: t.commandPalette.groupPages },
    { label: t.nav.profile,       href: '/profile',       icon: User,            group: t.commandPalette.groupPages },
    { label: t.nav.admin,         href: '/admin',         icon: Shield,          group: t.commandPalette.groupAdmin },
    { label: t.nav.adminUsers,    href: '/admin/users',   icon: User,            group: t.commandPalette.groupAdmin },
  ];

  // ── Keyboard shortcut to open/close ──────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // ── Search API ────────────────────────────────────────────────────────────
  const { data: searchData, isFetching } = useQuery<SearchResults>({
    queryKey: ['cmd-search', query],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    staleTime: 10_000,
  });

  // ── Build flat result list ─────────────────────────────────────────────────
  const items: ResultItem[] = [];

  if (query.length < 2) {
    // Show nav items when no query
    NAV_ITEMS.forEach(n => {
      items.push({ id: n.href, label: n.label, href: n.href, icon: n.icon, group: n.group });
    });
  } else {
    searchData?.courses?.forEach(c => items.push({
      id: `course-${c.id}`, label: c.title, sublabel: c.code,
      href: `/courses/${c.id}`, icon: BookOpen, group: t.commandPalette.groupCourses,
    }));
    searchData?.assignments?.forEach(a => items.push({
      id: `asgn-${a.id}`, label: a.title, sublabel: a.course?.title,
      href: `/courses/${a.courseId}/assignments`, icon: FileText, group: t.commandPalette.groupAssignments,
    }));
    searchData?.materials?.forEach(m => items.push({
      id: `mat-${m.id}`, label: m.title, sublabel: m.course?.title,
      href: `/courses/${m.courseId}/materials`, icon: BookMarked, group: t.commandPalette.groupMaterials,
    }));
    searchData?.announcements?.forEach(a => items.push({
      id: `ann-${a.id}`, label: a.title, sublabel: a.course?.title ?? t.commandPalette.platformLabel,
      href: '/notifications', icon: Megaphone, group: t.commandPalette.groupAnnouncements,
    }));

    // Also filter nav items by query
    const q = query.toLowerCase();
    NAV_ITEMS.filter(n => n.label.toLowerCase().includes(q)).forEach(n => {
      items.push({ id: n.href, label: n.label, href: n.href, icon: n.icon, group: t.commandPalette.groupPages });
    });
  }

  // Group items
  const grouped: Record<string, ResultItem[]> = {};
  items.forEach(it => {
    if (!grouped[it.group]) grouped[it.group] = [];
    grouped[it.group].push(it);
  });

  const flat = items;

  // ── Navigate item ──────────────────────────────────────────────────────────
  const go = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[activeIdx]) go(flat[activeIdx].href);
    }
  };

  // Keep active item in view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(0); }, [query, searchData]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'fixed left-1/2 top-[15vh] z-50 w-full max-w-[560px] -translate-x-1/2',
              'rounded-xl border border-border/60 bg-background/95 dark:bg-card/95',
              'shadow-2xl dark:shadow-black/40 backdrop-blur-xl',
              'overflow-hidden',
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
              {isFetching
                ? <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
                : <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.commandPalette.placeholder}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="hidden sm:flex items-center"
              >
                <KbdHint>Esc</KbdHint>
              </button>
            </div>

            {/* Results list */}
            <div ref={listRef} className="max-h-[min(420px,60vh)] overflow-y-auto">
              {flat.length === 0 && query.length >= 2 && !isFetching && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Hash className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-foreground">{t.commandPalette.noResults}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.commandPalette.noResultsTip}</p>
                </div>
              )}

              {Object.entries(grouped).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 bg-muted/30 dark:bg-white/[0.02] border-b border-border/30">
                    {group}
                  </div>
                  {groupItems.map(it => {
                    const idx = flat.indexOf(it);
                    const Icon = it.icon;
                    const isActive = idx === activeIdx;
                    return (
                      <button
                        key={it.id}
                        data-idx={idx}
                        onClick={() => go(it.href)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isActive
                            ? 'bg-accent dark:bg-primary/10'
                            : 'hover:bg-muted/50 dark:hover:bg-white/[0.03]',
                        )}
                      >
                        <div className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                          isActive
                            ? 'bg-primary/10 border-primary/20 text-primary dark:bg-primary/15'
                            : 'bg-muted border-border/40 text-muted-foreground dark:bg-white/[0.04] dark:border-white/[0.08]',
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm truncate', isActive ? 'text-foreground font-medium' : 'text-foreground/90')}>
                            {it.label}
                          </p>
                          {it.sublabel && (
                            <p className="text-xs text-muted-foreground truncate">{it.sublabel}</p>
                          )}
                        </div>
                        {isActive && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border/40 bg-muted/20 dark:bg-white/[0.02]">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <KbdHint>↑</KbdHint><KbdHint>↓</KbdHint> {t.commandPalette.navigate}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <KbdHint>↵</KbdHint> {t.commandPalette.open}
              </span>
              <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                <Command className="h-3 w-3" />K {t.commandPalette.toggle}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
