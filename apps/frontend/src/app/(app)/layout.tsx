'use client';
import { useMe } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AiChat } from '@/components/ai-chat';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useMe();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (isError || !user)) router.push('/login');
  }, [isLoading, isError, user, router]);

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
    </div>
  );
}
