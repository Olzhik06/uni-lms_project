'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/use-auth';
import {
  LayoutDashboard, Calendar, BookOpen, CalendarDays, Bell, User as UI,
  Shield, Users, Layers, GraduationCap, UserPlus, ChevronDown, Menu, X, Search, Activity,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { stagger, item, slideLeft, fade } from '@/lib/motion';
import { useT } from '@/lib/i18n';

const MN_KEYS = [
  { href: '/dashboard',     key: 'dashboard',     icon: LayoutDashboard },
  { href: '/schedule',      key: 'schedule',      icon: Calendar },
  { href: '/courses',       key: 'courses',       icon: BookOpen },
  { href: '/calendar',      key: 'calendar',      icon: CalendarDays },
  { href: '/search',        key: 'search',        icon: Search },
  { href: '/notifications', key: 'notifications', icon: Bell },
  { href: '/activity',      key: 'activity',      icon: Activity },
  { href: '/profile',       key: 'profile',       icon: UI },
] as const;

const AN_KEYS = [
  { href: '/admin',             key: 'adminOverview', icon: Shield },
  { href: '/admin/users',       key: 'adminUsers',    icon: Users },
  { href: '/admin/groups',      key: 'adminGroups',   icon: Layers },
  { href: '/admin/courses',     key: 'adminCourses',  icon: BookOpen },
  { href: '/admin/enrollments', key: 'adminEnroll',   icon: UserPlus },
] as const;

export function Sidebar() {
  const path = usePathname();
  const { data: user } = useMe();
  const t = useT();
  const [ao, sao] = useState(path.startsWith('/admin'));
  const [mo, smo] = useState(false);

  const ia = (h: string) => path === h || (h !== '/dashboard' && h !== '/admin' && path.startsWith(h + '/'));
  const roleLabel = user?.role
    ? {
        ADMIN: t.adminCrud.userRoleAdmin,
        TEACHER: t.adminCrud.userRoleTeacher,
        STUDENT: t.adminCrud.userRoleStudent,
      }[user.role]
    : '';

  const lk = (i: { href: string; key: keyof typeof t.nav; icon: React.ElementType }) => {
    const active = ia(i.href);
    return (
      <motion.div key={i.href} variants={item}>
        <Link
          href={i.href}
          onClick={() => smo(false)}
          className={cn(
            'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
            active
              ? 'text-primary font-medium dark:text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/[0.04]'
          )}
        >
          {/* Sliding background pill — layoutId causes it to animate between items */}
          {active && (
            <motion.div
              layoutId="nav-active-bg"
              className="absolute inset-0 rounded-md bg-accent dark:bg-primary/[0.12]"
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          {/* Left edge indicator bar — the signature design detail */}
          {active && (
            <span className="absolute left-0 inset-y-[5px] w-[3px] rounded-r-full bg-primary dark:shadow-glow-sm" />
          )}
          <i.icon className="relative z-10 h-4 w-4 shrink-0" />
          <span className="relative z-10">{t.nav[i.key]}</span>
        </Link>
      </motion.div>
    );
  };

  const inner = (
    <>
      <div className="px-5 py-5 border-b border-border dark:border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center dark:shadow-glow-sm dark:ring-1 dark:ring-primary/20">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-serif text-lg font-semibold text-foreground">UniLMS</span>
        </Link>
      </div>

      <motion.nav
        className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {MN_KEYS.map(lk)}
        {user?.role === 'ADMIN' && (
          <>
            <motion.button
              variants={item}
              onClick={() => sao(!ao)}
              aria-expanded={ao}
              aria-controls="admin-navigation"
              className="flex w-full items-center gap-2 px-3 py-2 mt-5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              {t.nav.admin}
              <ChevronDown className={cn('h-3 w-3 ml-auto transition-transform', ao && 'rotate-180')} />
            </motion.button>
            <AnimatePresence>
              {ao && (
                <motion.div
                  id="admin-navigation"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden space-y-0.5"
                >
                  {AN_KEYS.map(i => {
                    const active = ia(i.href);
                    return (
                      <Link
                        key={i.href}
                        href={i.href}
                        onClick={() => smo(false)}
                        className={cn(
                          'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          active
                            ? 'text-primary font-medium dark:text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/[0.04]'
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId="nav-active-bg"
                            className="absolute inset-0 rounded-md bg-accent dark:bg-primary/[0.12]"
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                          />
                        )}
                        {active && (
                          <span className="absolute left-0 inset-y-[5px] w-[3px] rounded-r-full bg-primary dark:shadow-glow-sm" />
                        )}
                        <i.icon className="relative z-10 h-4 w-4 shrink-0" />
                        <span className="relative z-10">{t.nav[i.key]}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.nav>

      <div className="border-t border-border dark:border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
            {user?.fullName?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => smo(true)}
        aria-label="Open navigation menu"
        className="fixed z-40 lg:hidden rounded-md border border-border bg-background p-2"
        style={{ top: 'max(1rem, env(safe-area-inset-top, 1rem))', left: 'max(1rem, env(safe-area-inset-left, 1rem))' }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mo && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              variants={fade}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 bg-foreground/20"
              onClick={() => smo(false)}
            />
            <motion.div
              variants={slideLeft}
              initial="hidden"
              animate="visible"
              exit="hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border dark:bg-card/90 dark:backdrop-blur-md dark:border-white/[0.07] flex flex-col z-50"
            >
              <button
                onClick={() => smo(false)}
                aria-label="Close navigation menu"
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              {inner}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        variants={slideLeft}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border lg:bg-background lg:fixed lg:inset-y-0 dark:bg-card/80 dark:backdrop-blur-md dark:border-r-white/[0.07]"
      >
        {inner}
      </motion.aside>
    </>
  );
}
