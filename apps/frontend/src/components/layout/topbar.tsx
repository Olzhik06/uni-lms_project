'use client';
import { useLogout } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useLanguage, type Lang } from '@/lib/i18n';

function ThemeToggle() {
  const { t } = useLanguage();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label={t.common.toggleTheme}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  const langs: Lang[] = ['en', 'ru', 'kz'];
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border dark:border-white/[0.08] p-0.5 dark:bg-white/[0.03]">
      {langs.map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={
            lang === l
              ? 'px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary text-primary-foreground'
              : 'px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors'
          }
        >
          {t.langName[l]}
        </button>
      ))}
    </div>
  );
}

export function Topbar() {
  const lo = useLogout();
  const { t } = useLanguage();
  const { data: uc } = useQuery<number>({
    queryKey: ['nc'],
    queryFn: () => api.get<number>('/me/notifications/unread-count'),
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-6 dark:bg-card/70 dark:backdrop-blur-md dark:border-white/[0.07]">
      <div className="flex-1 lg:ml-0 ml-12" />
      <LanguageToggle />
      <ThemeToggle />
      <Link
        href="/notifications"
        aria-label={t.nav.notifications}
        className="relative text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {typeof uc === 'number' && uc > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">
            {uc > 9 ? '9+' : uc}
          </span>
        )}
      </Link>
      <Button variant="ghost" size="sm" onClick={() => lo.mutate()} className="gap-2 text-muted-foreground">
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">{t.common.logout}</span>
      </Button>
    </header>
  );
}
