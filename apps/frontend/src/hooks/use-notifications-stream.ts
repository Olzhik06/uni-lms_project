'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { getNotificationContent } from '@/lib/notification-content';
import type { Notification, NotificationStreamEvent } from '@/lib/types';

export function useNotificationsStream(enabled: boolean) {
  const qc = useQueryClient();
  const pathname = usePathname();
  const { t } = useLanguage();
  const toastedIds = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const mergeNotification = (notification: Notification) => {
      const merge = (current: Notification[] | undefined) => {
        const existing = current ?? [];
        const next = [notification, ...existing.filter(item => item.id !== notification.id)];
        return next.slice(0, 50);
      };

      qc.setQueryData(['notifications'], merge);
      qc.setQueryData(['notifs'], merge);
    };

    const refreshNotifications = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifs'] });
    };

    const showToastForNotification = (notification: Notification) => {
      if (pathname === '/notifications') return;
      if (toastedIds.current.has(notification.id)) return;

      toastedIds.current.add(notification.id);
      if (toastedIds.current.size > 100) {
        const first = toastedIds.current.values().next().value;
        if (first) toastedIds.current.delete(first);
      }

      const content = getNotificationContent(notification, t);
      toast({
        title: content.title,
        description: content.body,
      });
    };

    const connect = () => {
      if (disposed) return;

      source = new EventSource('/api/me/notifications/stream');

      const parsePayload = (event: MessageEvent<string>) => {
        try {
          return JSON.parse(event.data) as NotificationStreamEvent;
        } catch {
          return null;
        }
      };

      const handlePayload = (event: MessageEvent<string>) => {
        const payload = parsePayload(event);
        if (!payload) return null;

        if (typeof payload.unreadCount === 'number') {
          qc.setQueryData(['nc'], payload.unreadCount);
        }
        if (payload.notification) {
          mergeNotification(payload.notification);
        }
        if (payload.type === 'created' && payload.notification) {
          showToastForNotification(payload.notification);
        }

        return payload;
      };

      source.addEventListener('ready', ((event: Event) => {
        handlePayload(event as MessageEvent<string>);
      }) as EventListener);
      source.addEventListener('notification', ((event: Event) => {
        const payload = handlePayload(event as MessageEvent<string>);
        if (!payload) return;
        if (payload.type !== 'created' || !payload.notification) {
          refreshNotifications();
        }
      }) as EventListener);

      source.onerror = () => {
        source?.close();
        source = null;
        if (!disposed) {
          retryTimer = setTimeout(connect, 3_000);
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, [enabled, pathname, qc, t]);
}
