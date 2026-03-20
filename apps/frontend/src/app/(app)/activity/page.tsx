'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { ActivityLog } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, FileText, BookOpen, Award, User } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-700',
  SUBMIT: 'bg-amber-100 text-amber-700',
  GRADE:  'bg-green-100 text-green-700',
  DELETE: 'bg-red-100 text-red-700',
  UPDATE: 'bg-purple-100 text-purple-700',
};

const ENTITY_ICONS: Record<string, any> = {
  Assignment: FileText,
  Submission: BookOpen,
  Grade:      Award,
  Course:     BookOpen,
  User:       User,
};

export default function ActivityPage() {
  const { data: me } = useMe();
  const isAdmin = me?.role === 'ADMIN';

  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['activity', isAdmin],
    queryFn: () => api.get(isAdmin ? '/admin/activity' : '/me/activity'),
    enabled: !!me,
  });

  if (isLoading) return (
    <div className="space-y-3">
      {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"/>)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5"/>
        <h1 className="text-2xl font-bold">Activity Log</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        {isAdmin ? 'All system actions across the platform' : 'Your recent actions'}
      </p>

      {!logs?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-30"/>
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const Icon = ENTITY_ICONS[log.entity] || FileText;
            return (
              <Card key={log.id}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-[10px] ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>{log.action}</Badge>
                      <span className="text-sm font-medium">{log.entity}</span>
                      {isAdmin && log.user && (
                        <span className="text-xs text-muted-foreground">by {log.user.fullName}</span>
                      )}
                    </div>
                    {log.entityId && <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{log.entityId}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(log.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
