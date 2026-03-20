'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { ActivityLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, Skeleton } from '@/components/ui/form-elements';
import { Activity, Award, BookOpen, FileText, Layers3, User } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-700',
  SUBMIT: 'bg-amber-100 text-amber-700',
  GRADE: 'bg-green-100 text-green-700',
  DELETE: 'bg-red-100 text-red-700',
  UPDATE: 'bg-purple-100 text-purple-700',
};

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Assignment: FileText,
  Submission: BookOpen,
  Grade: Award,
  Course: Layers3,
  User: User,
};

type ActionFilter = 'ALL' | 'CREATE' | 'SUBMIT' | 'GRADE' | 'UPDATE' | 'DELETE';

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function ActivityPage() {
  const { data: me } = useMe();
  const t = useT();
  const isAdmin = me?.role === 'ADMIN';
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');

  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['activity', isAdmin],
    queryFn: () => api.get(isAdmin ? '/admin/activity' : '/me/activity'),
    enabled: !!me,
  });

  const actionLabels = {
    CREATE: t.activity.create,
    SUBMIT: t.activity.submit,
    GRADE: t.activity.gradeAction,
    UPDATE: t.activity.update,
    DELETE: t.activity.delete,
  };

  const entityLabels = {
    Assignment: t.activity.assignment,
    Submission: t.activity.submission,
    Grade: t.activity.gradeEntity,
    Course: t.activity.course,
    User: t.activity.userEntity,
  };

  const filteredLogs = (logs || []).filter(log => actionFilter === 'ALL' || log.action === actionFilter);
  const counts = {
    total: logs?.length || 0,
    create: (logs || []).filter(log => log.action === 'CREATE').length,
    submit: (logs || []).filter(log => log.action === 'SUBMIT').length,
    grade: (logs || []).filter(log => log.action === 'GRADE').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <h1 className="text-2xl font-bold">{t.activity.title}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? t.activity.adminSubtitle : t.activity.userSubtitle}
          </p>
        </div>

        <div className="w-full max-w-xs">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t.activity.filterAction}
          </label>
          <Select value={actionFilter} onChange={e => setActionFilter(e.target.value as ActionFilter)}>
            <option value="ALL">{t.activity.allActions}</option>
            <option value="CREATE">{t.activity.create}</option>
            <option value="SUBMIT">{t.activity.submit}</option>
            <option value="GRADE">{t.activity.gradeAction}</option>
            <option value="UPDATE">{t.activity.update}</option>
            <option value="DELETE">{t.activity.delete}</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t.activity.total} value={counts.total} />
        <SummaryCard label={t.activity.create} value={counts.create} />
        <SummaryCard label={t.activity.submit} value={counts.submit} />
        <SummaryCard label={t.activity.gradeAction} value={counts.grade} />
      </div>

      {!filteredLogs.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Activity className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">{t.activity.noActivity}</p>
            <p className="mx-auto mt-1 max-w-md text-xs">
              {isAdmin ? t.activity.noActivityAdminDescription : t.activity.noActivityUserDescription}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map(log => {
            const Icon = ENTITY_ICONS[log.entity] || FileText;
            const entityLabel = entityLabels[log.entity as keyof typeof entityLabels] || log.entity;
            const actionLabel = actionLabels[log.action as keyof typeof actionLabels] || log.action;

            return (
              <Card key={log.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {actionLabel}
                        </Badge>
                        <CardTitle className="text-sm">{entityLabel}</CardTitle>
                        {isAdmin && log.user && (
                          <CardDescription className="text-xs">
                            {t.activity.by} {log.user.fullName}
                          </CardDescription>
                        )}
                      </div>
                      <CardDescription className="mt-1 text-xs">
                        {formatDateTime(log.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {log.entityId && (
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="rounded-md bg-muted/60 px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t.activity.itemId}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs">{log.entityId}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
