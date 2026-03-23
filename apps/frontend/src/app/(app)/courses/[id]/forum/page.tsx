'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import { useT } from '@/lib/i18n';
import { cn, formatDate } from '@/lib/utils';
import type { ForumThread } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/form-elements';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pin, MessageSquare, Plus, Trash2, PinOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForumPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const { data: user } = useMe();
  const t = useT();
  const qc = useQueryClient();
  const tf = t.courseForum;
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // ── Thread list ──────────────────────────────────────────────────────────

  const { data: threads = [], isLoading } = useQuery<ForumThread[]>({
    queryKey: ['forum-threads', courseId],
    queryFn: () => api.get(`/courses/${courseId}/forum/threads`),
  });

  // ── New thread dialog ────────────────────────────────────────────────────

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });

  const createMut = useMutation({
    mutationFn: (d: { title: string; body: string }) =>
      api.post(`/courses/${courseId}/forum/threads`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-threads', courseId] });
      setOpen(false);
      setForm({ title: '', body: '' });
    },
  });

  // ── Delete thread ────────────────────────────────────────────────────────

  const [delId, setDelId] = useState<string | null>(null);
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/forum-threads/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-threads', courseId] });
      setDelId(null);
    },
  });

  // ── Pin thread ───────────────────────────────────────────────────────────

  const pinMut = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      api.patch(`/forum-threads/${id}/pin`, { isPinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-threads', courseId] }),
  });

  const canDelete = (thread: ForumThread) =>
    user?.id === thread.authorId || user?.role === 'TEACHER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t.courseLayout.forum}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {threads.length} {threads.length === 1 ? tf.replySingular : tf.replies}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          {tf.newThread}
        </Button>
      </div>

      {/* Thread list */}
      {isLoading && (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && threads.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">{tf.noThreads}</p>
          <p className="text-xs text-muted-foreground mt-1">{tf.noThreadsHint}</p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {threads.map(thread => (
          <motion.div
            key={thread.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <div className={cn(
              'group relative rounded-xl border bg-card p-4 transition-colors',
              'hover:border-primary/25 dark:hover:border-primary/25',
              thread.isPinned && 'border-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04]',
            )}>
              {thread.isPinned && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                  <Pin className="h-3 w-3" /> {tf.pinned}
                </span>
              )}

              <Link href={`/courses/${courseId}/forum/${thread.id}`} className="block">
                <h3 className="text-sm font-semibold text-foreground leading-snug pr-20 hover:text-primary transition-colors">
                  {thread.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {thread.body}
                </p>
              </Link>

              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {tf.by} <span className="font-medium text-foreground">{thread.author.fullName}</span>
                  {' · '}{formatDate(thread.createdAt)}
                </span>
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  {thread._count?.posts ?? 0}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isTeacher && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title={thread.isPinned ? tf.unpin : tf.pin}
                      onClick={() => pinMut.mutate({ id: thread.id, isPinned: !thread.isPinned })}
                    >
                      {thread.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  {canDelete(thread) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      title={tf.deleteThread}
                      onClick={() => setDelId(thread.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* New thread dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{tf.newThread}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-sm font-medium mb-1 block">{tf.titleLabel}</label>
            <Input
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={tf.bodyPlaceholder}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{tf.bodyLabel}</label>
            <Textarea
              rows={4}
              value={form.body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder={tf.bodyPlaceholder}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>{tf.cancel}</Button>
          <Button
            disabled={!form.title.trim() || !form.body.trim() || createMut.isPending}
            onClick={() => createMut.mutate(form)}
          >
            {tf.post}
          </Button>
        </div>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!delId} onOpenChange={(o: boolean) => !o && setDelId(null)}>
        <DialogHeader>
          <DialogTitle>{tf.deleteThread}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">{tf.deleteConfirm}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDelId(null)}>{tf.cancel}</Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteMut.isPending}
            onClick={() => delId && deleteMut.mutate(delId)}
          >
            {tf.deleteThread}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
