'use client';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Course } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/form-elements';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { useT } from '@/lib/i18n';

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const path = usePathname();
  const t = useT();

  const tabs = [
    { l: t.courseLayout.overview,      h: 'overview' },
    { l: t.courseLayout.assignments,   h: 'assignments' },
    { l: t.courseLayout.materials,     h: 'materials' },
    { l: t.courseLayout.grades,        h: 'grades' },
    { l: t.courseLayout.attendance,    h: 'attendance' },
    { l: t.courseLayout.participants,  h: 'participants' },
    { l: t.courseLayout.quiz,          h: 'quiz' },
  ];
  const activeTab = path.split('/').pop() ?? '';

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Course hero header with background image */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative rounded-xl overflow-hidden mb-5"
      >
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80&auto=format&fit=crop"
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-foreground/70 backdrop-saturate-[0.25]" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
        </div>

        <div className="relative flex items-start gap-4 px-6 py-8">
          <Link href="/courses" className="mt-0.5 text-primary-foreground/60 hover:text-primary-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-primary-foreground/50 text-[10px] font-semibold uppercase tracking-widest mb-1">{course?.code}</p>
            <h1 className="font-serif text-2xl font-semibold text-primary-foreground leading-tight">{course?.title}</h1>
            <p className="text-primary-foreground/60 text-sm mt-1">
              {course?.teacher?.fullName} &middot; {course?.semester}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <div className="border-b border-border flex gap-0 overflow-x-auto -mx-1">
        {tabs.map(tab => {
          const href = `/courses/${id}/${tab.h}`;
          const isActive = path.endsWith(tab.h);
          return (
            <Link
              key={tab.h}
              href={href}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.l}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Tab content with fade transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="pt-5"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
