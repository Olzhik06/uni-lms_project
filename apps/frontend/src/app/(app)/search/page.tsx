'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMe } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import type { SearchResults } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, FileText, ClipboardList, Bell, Users, Hash, Sparkles, Clock, TrendingUp, X, Command } from 'lucide-react';
import Link from 'next/link';
import { formatDate, cn } from '@/lib/utils';
import { useLanguage, useT } from '@/lib/i18n';
import { getAnnouncementContent } from '@/lib/announcement-content';
import { motion, AnimatePresence } from 'framer-motion';

const RECENT_KEY = 'unilms-recent-searches';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(term: string) {
  try {
    const prev = loadRecent().filter(s => s !== term);
    localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}
function removeRecent(term: string) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(loadRecent().filter(s => s !== term)));
  } catch {}
}

const TRENDING_BY_ROLE = {
  STUDENT: ['lecture notes', 'midterm exam', 'lab report', 'physics', 'mathematics'],
  TEACHER:  ['assignment submissions', 'grade distribution', 'attendance', 'final exam'],
  ADMIN:    ['student enrollment', 'active courses', 'teacher', 'group statistics'],
} as const;

export default function SearchPage() {
  const { data: me } = useMe();
  const t = useT();
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => { setRecent(loadRecent()); }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery<SearchResults>({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const result = await api.get<SearchResults>(`/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (debouncedQuery.trim().length >= 2) {
        saveRecent(debouncedQuery.trim());
        setRecent(loadRecent());
      }
      return result;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const total = (data?.courses.length || 0) + (data?.materials.length || 0) +
    (data?.assignments.length || 0) + (data?.announcements?.length || 0) + (data?.users?.length || 0);

  const applyQuery = (s: string) => {
    setQuery(s);
    saveRecent(s);
    setRecent(loadRecent());
  };

  const deleteRecent = (s: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecent(s);
    setRecent(loadRecent());
  };

  const trending = TRENDING_BY_ROLE[me?.role ?? 'STUDENT'];

  const roleLabel = {
    ADMIN: t.adminCrud.userRoleAdmin,
    TEACHER: t.adminCrud.userRoleTeacher,
    STUDENT: t.adminCrud.userRoleStudent,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">{t.search.title}</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder={t.search.placeholder} value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      </div>

      <AnimatePresence mode="wait">
        {debouncedQuery.length < 2 && (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            className="space-y-6 max-w-xl"
          >
            {/* Tip — command palette */}
            <div className="flex items-center gap-2.5 rounded-lg border border-border/40 dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.02] px-3.5 py-2.5">
              <Command className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t.search.proTip.split('⌘K')[0]}<kbd className="mx-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>{t.search.proTip.split('⌘K')[1]}
              </p>
            </div>

            {/* Recent searches */}
            {recent.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2.5 px-0.5 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />{t.search.recent}
                </p>
                <div className="flex flex-wrap gap-2">
                  {recent.map(s => (
                    <div key={s} className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 pl-3 pr-1.5 py-1 text-xs text-foreground/80 hover:bg-muted transition-colors">
                      <button type="button" className="hover:text-foreground" onClick={() => applyQuery(s)}>{s}</button>
                      <button
                        type="button"
                        onClick={e => deleteRecent(s, e)}
                        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Remove"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2.5 px-0.5 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />{t.search.trending}
              </p>
              <div className="flex flex-wrap gap-2">
                {trending.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applyQuery(s)}
                    className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Sparkles className="h-3 w-3 text-primary/50" />{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Category cards */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3 px-0.5">{t.search.searchAcross}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { icon: BookOpen,      label: t.search.coursesSection,       hint: t.search.coursesHint,       color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-500/[0.1]' },
                  { icon: ClipboardList, label: t.search.assignmentsSection,   hint: t.search.assignmentsHint,   color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/[0.1]' },
                  { icon: FileText,      label: t.search.materialsSection,     hint: t.search.materialsHint,     color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/[0.1]' },
                  { icon: Bell,          label: t.search.announcementsSection, hint: t.search.announcementsHint, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/[0.1]' },
                  ...(me?.role === 'ADMIN' ? [
                    { icon: Users, label: t.search.usersSection, hint: t.search.usersHint, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/[0.1]' },
                  ] : []),
                ].map(({ icon: Icon, label, hint, color, bg }) => (
                  <div
                    key={label}
                    className={cn(
                      'flex items-start gap-2.5 rounded-lg border border-border/30 dark:border-white/[0.06] p-3',
                      'bg-background dark:bg-white/[0.02]',
                    )}
                  >
                    <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md', bg)}>
                      <Icon className={cn('h-3.5 w-3.5', color)} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-14 bg-muted animate-pulse rounded-lg"/>)}</div>
      )}

      {data && !isLoading && (
        <>
          <p className="text-sm text-muted-foreground">{total} {total !== 1 ? t.search.results_pl : t.search.results} {t.search.for} &quot;{debouncedQuery}&quot;</p>

          {/* Courses */}
          {data.courses.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4"/>{t.search.coursesSection}</h2>
              {data.courses.map(c => (
                <Link key={c.id} href={`/courses/${c.id}/overview`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                      </div>
                      <Badge variant="secondary">{c.code}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Materials */}
          {data.materials.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4"/>{t.search.materialsSection}</h2>
              {data.materials.map(m => (
                <Link key={m.id} href={`/courses/${m.courseId}/materials`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.course?.code} · {m.course?.title}</p>
                      </div>
                      <Badge variant="outline">
                        {m.type === 'link'
                          ? t.courseMaterials.linkType
                          : m.type === 'file'
                            ? t.courseMaterials.fileType
                            : t.courseMaterials.textType}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Assignments */}
          {data.assignments.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4"/>{t.search.assignmentsSection}</h2>
              {data.assignments.map(a => (
                <Link key={a.id} href={`/courses/${a.courseId}/assignments`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.course?.code} · {t.common.due} {formatDate(a.dueAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Feature 6 — Announcements in search */}
          {(data.announcements?.length || 0) > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4"/>{t.search.announcementsSection}</h2>
              {data.announcements!.map(a => (
                (() => {
                  const content = getAnnouncementContent(a, lang);
                  return (
                    <Link key={a.id} href={a.courseId ? `/courses/${a.courseId}/overview` : '/dashboard'}>
                      <Card className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{content.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{content.body}</p>
                            </div>
                            <p className="text-xs text-muted-foreground shrink-0">{formatDate(a.createdAt)}</p>
                          </div>
                          {a.course && <Badge variant="secondary" className="mt-1 text-[10px]">{a.course.code}</Badge>}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })()
              ))}
            </div>
          )}

          {/* Feature 6 — Users in search (admin only) */}
          {(data.users?.length || 0) > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4"/>{t.search.usersSection}</h2>
              {data.users!.map(u => (
                <Link key={u.id} href={`/admin/users`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{roleLabel[u.role]}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {total === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-14 text-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-muted dark:bg-white/[0.04] flex items-center justify-center mb-4">
                <Hash className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="font-serif font-medium text-foreground mb-1">{t.search.noResults}</p>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                &ldquo;{debouncedQuery}&rdquo; — {t.search.noResultsTip}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {trending.slice(0, 3).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => applyQuery(s)}
                    className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />{s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
