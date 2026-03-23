'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Award, ClipboardList, Megaphone, Info } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/form-elements';
import { useT } from '@/lib/i18n';
import { getNotificationContent } from '@/lib/notification-content';

export default function NotificationsPage() {
  const t = useT();
  const qc = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/me/notifications'),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.post('/me/notifications/read-all', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifs'] });
      qc.invalidateQueries({ queryKey: ['nc'] });
    },
  });

  const readOneMutation = useMutation({
    mutationFn: (id: string) => api.post(`/me/notifications/${id}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifs'] });
      qc.invalidateQueries({ queryKey: ['nc'] });
    },
  });

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">{t.notifications.title}</h1>
          {unread > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unread} {t.notifications.unread}</p>
          )}
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            {t.notifications.markAll}
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          {/* Empty hero */}
          <div className="flex flex-col items-center py-10 text-center">
            <div className="relative mb-4">
              <div className="h-16 w-16 rounded-2xl bg-muted dark:bg-white/[0.04] flex items-center justify-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </div>
            <p className="font-serif font-semibold text-foreground text-lg mb-1">{t.notifications.allCaughtUp}</p>
            <p className="text-sm text-muted-foreground max-w-xs">{t.notifications.empty}</p>
          </div>

          {/* What to expect */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3 px-1">
              {t.notifications.whatYoullSee}
            </p>
            <div className="space-y-2">
              {[
                {
                  Icon: ClipboardList,
                  color: 'bg-amber-50 dark:bg-amber-500/[0.1] text-amber-600 dark:text-amber-400',
                  title: t.notifications.dueReminderPreviewTitle,
                  body: t.notifications.dueReminderPreviewBody,
                },
                {
                  Icon: Award,
                  color: 'bg-emerald-50 dark:bg-emerald-500/[0.1] text-emerald-600 dark:text-emerald-400',
                  title: t.notifications.gradePublishedTitle,
                  body: t.notifications.gradePreviewBody,
                },
                {
                  Icon: Megaphone,
                  color: 'bg-blue-50 dark:bg-blue-500/[0.1] text-blue-600 dark:text-blue-400',
                  title: t.notifications.announcementsPreviewTitle,
                  body: t.notifications.announcementsPreviewBody,
                },
                {
                  Icon: Info,
                  color: 'bg-purple-50 dark:bg-purple-500/[0.1] text-purple-600 dark:text-purple-400',
                  title: t.notifications.systemUpdatesPreviewTitle,
                  body: t.notifications.systemUpdatesPreviewBody,
                },
              ].map(({ Icon, color, title, body }) => (
                <div key={title} className="flex items-start gap-3 rounded-lg border border-border/40 dark:border-white/[0.06] bg-background/60 dark:bg-white/[0.02] px-4 py-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color.split(' ').slice(0, 2).join(' ')}`}>
                    <Icon className={`h-3.5 w-3.5 ${color.split(' ').slice(2).join(' ')}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        className="space-y-1.5"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        <AnimatePresence>
          {notifications.map(n => (
            (() => {
              const content = getNotificationContent(n, t);
              return (
                <motion.div
                  key={n.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                  }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={n.isRead ? 'opacity-55 hover:-translate-y-0.5 hover:opacity-70' : 'border-primary/20 bg-accent/40 hover:-translate-y-0.5'}
                    onClick={() => !n.isRead && readOneMutation.mutate(n.id)}
                  >
                    <CardContent className="p-4 flex items-start gap-3 cursor-pointer">
                      <div
                        className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                        style={{ background: n.isRead ? 'transparent' : 'hsl(var(--primary))' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{content.title}</p>
                        {content.body && <p className="text-xs text-muted-foreground mt-0.5">{content.body}</p>}
                        <p className="text-xs text-muted-foreground mt-1.5">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
