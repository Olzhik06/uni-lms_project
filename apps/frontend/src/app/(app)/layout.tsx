'use client';
import { useMe } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AiChat } from '@/components/ai-chat';
import { CommandPalette } from '@/components/command-palette';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { useNotificationsStream } from '@/hooks/use-notifications-stream';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LANGUAGE_STORAGE_KEY, useLanguage } from '@/lib/i18n';
import type { User } from '@/lib/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { lang, setLang } = useLanguage();
  useNotificationsStream(!!user);

  const syncPreferredLang = useMutation({
    mutationFn: (preferredLang: 'en' | 'ru' | 'kz') => api.patch<User>('/me/profile', { preferredLang }),
    onSuccess: data => {
      qc.setQueryData(['me'], data);
    },
  });

  useEffect(() => {
    if (!isLoading && (isError || !user)) router.push('/login');
  }, [isLoading, isError, user, router]);

  useEffect(() => {
    if (!user) return;

    let stored: 'en' | 'ru' | 'kz' | null = null;
    try {
      const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      stored = raw === 'en' || raw === 'ru' || raw === 'kz' ? raw : null;
    } catch {}

    if (!stored) {
      if (user.preferredLang && user.preferredLang !== lang) {
        setLang(user.preferredLang);
      }
      return;
    }

    if (stored !== lang) {
      setLang(stored);
      return;
    }

    if (stored !== user.preferredLang && !syncPreferredLang.isPending) {
      syncPreferredLang.mutate(stored);
    }
  }, [lang, setLang, syncPreferredLang, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        >
          <Loader2 className="h-7 w-7 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Topbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="p-6 lg:p-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
      <AiChat />
      <CommandPalette />
    </div>
  );
}
