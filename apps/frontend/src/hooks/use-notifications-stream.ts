'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useNotificationsStream(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const refreshNotifications = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifs'] });
    };

    const connect = () => {
      if (disposed) return;

      source = new EventSource('/api/me/notifications/stream');

      const handlePayload = (event: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(event.data) as { unreadCount?: number };
          if (typeof payload.unreadCount === 'number') {
            qc.setQueryData(['nc'], payload.unreadCount);
          }
        } catch {}
      };

      source.addEventListener('ready', handlePayload as EventListener);
      source.addEventListener('notification', ((event: Event) => {
        handlePayload(event as MessageEvent<string>);
        refreshNotifications();
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
  }, [enabled, qc]);
}
