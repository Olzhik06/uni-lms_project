'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Announcement, Course, AiCourseSummary } from '@/lib/types';
import { useMe } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea, Skeleton } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';
import { useState } from 'react';
import { Send, MessageSquare, Sparkles, BookOpen, Lightbulb, BarChart3, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage, useT } from '@/lib/i18n';
import { getAnnouncementContent } from '@/lib/announcement-content';

export default function OverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useMe();
  const qc = useQueryClient();
  const t = useT();
  const { lang } = useLanguage();

  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [summary, setSummary] = useState<AiCourseSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`),
  });

  const { data: anns, isLoading } = useQuery<Announcement[]>({
    queryKey: ['c-anns', id],
    queryFn: () => api.get(`/courses/${id}/announcements`),
  });

  const post = useMutation({
    mutationFn: (d: { title: string; body: string }) => api.post(`/courses/${id}/announcements`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['c-anns', id] });
      toast({ title: t.courseOverview.posted });
      setTitle(''); setBody(''); setShow(false);
    },
    onError: (e: any) => toast({ title: t.common.error, description: e.message, variant: 'destructive' }),
  });

  const handleSummary = async () => {
    setSummaryLoading(true);
    setSummary(null);
    try {
      const result = await api.post<AiCourseSummary>('/ai/course-summary', { courseId: id, lang });
      setSummary(result);
    } catch (e: any) {
      toast({ title: t.courseOverview.aiUnavailable, description: e.message, variant: 'destructive' });
    } finally {
      setSummaryLoading(false);
    }
  };

  const canPost = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const workloadColor = {
    light: 'bg-green-100 text-green-800 dark:bg-green-500/[0.15] dark:text-green-300',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-amber-500/[0.15] dark:text-amber-300',
    heavy: 'bg-red-100 text-red-800 dark:bg-red-500/[0.15] dark:text-red-300',
  };
  const workloadLabel = {
    light: t.courseOverview.workloadLight,
    moderate: t.courseOverview.workloadModerate,
    heavy: t.courseOverview.workloadHeavy,
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Course info card */}
      <Card>
        <CardContent className="pt-6">
          {courseLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-4" />
            </div>
          ) : (
            <>
              <p className="text-sm">{course?.description || t.courseOverview.noDescription}</p>
              {(course as any)?._count?.enrollments != null && (
                <div className="mt-4 text-sm text-muted-foreground">
                  <span>{(course as any)._count.enrollments} {t.courseOverview.enrolled}</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Course Summary */}
      <div>
        {!summary && !summaryLoading && (
          <Button
            variant="outline"
            onClick={handleSummary}
            className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-500/30 dark:text-purple-300 dark:hover:bg-purple-500/[0.1]"
          >
            <Sparkles className="h-4 w-4" />
            {t.courseOverview.aiSummary}
          </Button>
        )}

        {summaryLoading && (
          <Card className="border-purple-100 dark:border-purple-500/20">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2 border-purple-400 dark:border-purple-400/70 border-t-transparent animate-spin" />
                {t.courseOverview.generatingSummary}
              </div>
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full" />)}
            </CardContent>
          </Card>
        )}

        {summary && (
          <Card className="border-purple-100 bg-purple-50/30 dark:border-purple-500/20 dark:bg-purple-500/[0.06]">
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-purple-800 dark:text-purple-300">
                  <Sparkles className="h-4 w-4" />
                  {t.courseOverview.aiSummary}
                  {(summary as any)._demo && (
                    <Badge variant="outline" className="text-xs font-normal border-purple-200 text-purple-600 dark:border-purple-500/30 dark:text-purple-400">{t.courseOverview.demo}</Badge>
                  )}
                </h3>
                <Badge className={cn('text-xs capitalize', workloadColor[summary.workload] ?? 'bg-gray-100 text-gray-700')}>
                  {workloadLabel[summary.workload] ?? summary.workload}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">{summary.summary}</p>

              {summary.keyTopics.length > 0 && (
                <div>
                  <p className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-foreground">
                    <BookOpen className="h-3.5 w-3.5" /> {t.courseOverview.keyTopics}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.keyTopics.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {summary.tips.length > 0 && (
                <div>
                  <p className="text-xs font-medium flex items-center gap-1.5 mb-1.5 text-foreground">
                    <Lightbulb className="h-3.5 w-3.5" /> {t.courseOverview.studyTips}
                  </p>
                  <ul className="space-y-1">
                    {summary.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-purple-400 mt-0.5">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSummary}
                className="text-xs text-muted-foreground h-auto py-1 px-2"
              >
                <FlaskConical className="h-3 w-3 mr-1" /> {t.courseOverview.regenerate}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Post announcement */}
      {canPost && (
        !show
          ? <Button variant="outline" onClick={() => setShow(true)} className="gap-2">
              <MessageSquare className="h-4 w-4" /> {t.courseOverview.postAnnouncement}
            </Button>
          : <Card>
              <CardContent className="pt-6 space-y-3">
                <Input placeholder={t.courseOverview.titlePlaceholder} value={title} onChange={e => setTitle(e.target.value)} />
                <Textarea placeholder={t.courseOverview.bodyPlaceholder} value={body} onChange={e => setBody(e.target.value)} rows={3} />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShow(false)}>{t.common.cancel}</Button>
                  <Button onClick={() => post.mutate({ title, body })} disabled={!title || !body} className="gap-2">
                    <Send className="h-4 w-4" /> {t.common.post}
                  </Button>
                </div>
              </CardContent>
            </Card>
      )}

      {/* Announcements stream */}
      <h2 className="text-lg font-semibold">{t.courseOverview.streamTitle}</h2>
      {isLoading
        ? <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
        : !anns?.length
          ? (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-muted dark:bg-white/[0.04] flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/70">{t.courseOverview.noAnnouncements}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {canPost
                    ? t.courseOverview.noAnnouncementsTeacher
                    : t.courseOverview.noAnnouncementsStudent}
                </p>
              </div>
              {canPost && (
                <button
                  onClick={() => setShow(true)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  {t.courseOverview.postFirstAnnouncement}
                </button>
              )}
            </div>
          )
          : <div className="space-y-3">
              {anns.map(a => (
                (() => {
                  const content = getAnnouncementContent(a, lang);
                  return (
                    <Card key={a.id}>
                      <CardContent className="pt-4">
                        <h3 className="font-semibold">{content.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{(a as any).author?.fullName} &middot; {formatDateTime(a.createdAt)}</p>
                        <p className="text-sm mt-2 text-muted-foreground whitespace-pre-wrap">{content.body}</p>
                      </CardContent>
                    </Card>
                  );
                })()
              ))}
            </div>
      }
    </div>
  );
}
