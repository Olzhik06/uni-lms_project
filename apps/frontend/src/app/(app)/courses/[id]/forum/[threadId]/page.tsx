'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import { useT } from '@/lib/i18n';
import { cn, formatDate } from '@/lib/utils';
import type { ForumThread, ForumPost } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/form-elements';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pin, MessageSquare, Trash2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function RoleBadge({ role }: { role: string }) {
  if (role === 'TEACHER') return (
    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-primary">
      Teacher
    </span>
  );
  if (role === 'ADMIN') return (
    <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
      Admin
    </span>
  );
  return null;
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
      {name?.charAt(0) ?? '?'}
    </div>
  );
}

export default function ThreadPage() {
  const { id: courseId, threadId } = useParams<{ id: string; threadId: string }>();
  const { data: user } = useMe();
  const t = useT();
  const qc = useQueryClient();
  const tf = t.courseForum;

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: thread, isLoading: tLoading } = useQuery<ForumThread>({
    queryKey: ['forum-thread', threadId],
    queryFn: () => api.get(`/forum-threads/${threadId}`),
  });

  const { data: posts = [], isLoading: pLoading } = useQuery<ForumPost[]>({
    queryKey: ['forum-posts', threadId],
    queryFn: () => api.get(`/forum-threads/${threadId}/posts`),
  });

  // ── Reply form ───────────────────────────────────────────────────────────

  const [replyBody, setReplyBody] = useState('');
  const replyMut = useMutation({
    mutationFn: (body: string) => api.post(`/forum-threads/${threadId}/posts`, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts', threadId] });
      qc.invalidateQueries({ queryKey: ['forum-threads', courseId] });
      setReplyBody('');
    },
  });

  // ── Delete post ──────────────────────────────────────────────────────────

  const [delPostId, setDelPostId] = useState<string | null>(null);
  const deletePostMut = useMutation({
    mutationFn: (id: string) => api.delete(`/forum-posts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts', threadId] });
      qc.invalidateQueries({ queryKey: ['forum-threads', courseId] });
      setDelPostId(null);
    },
  });

  const canDeletePost = (p: ForumPost) =>
    user?.id === p.authorId || user?.role === 'TEACHER' || user?.role === 'ADMIN';

  if (tLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted/40 rounded-lg animate-pulse" />
        <div className="h-40 bg-muted/40 rounded-xl animate-pulse" />
        <div className="h-24 bg-muted/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!thread) return null;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href={`/courses/${courseId}/forum`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {tf.backToForum}
      </Link>

      {/* Original thread post */}
      <div className={cn(
        'rounded-xl border bg-card p-5',
        thread.isPinned && 'border-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04]',
      )}>
        <div className="flex items-start gap-3">
          <Avatar name={thread.author.fullName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{thread.author.fullName}</span>
              <RoleBadge role={thread.author.role} />
              {thread.isPinned && (
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                  <Pin className="h-3 w-3" /> {tf.pinned}
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">{formatDate(thread.createdAt)}</span>
            </div>
            <h1 className="mt-2 text-lg font-bold text-foreground leading-snug">{thread.title}</h1>
            <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{thread.body}</p>
          </div>
        </div>
      </div>

      {/* Replies header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          {posts.length} {posts.length === 1 ? tf.replySingular : tf.replies}
        </span>
      </div>

      {/* Reply list */}
      {pLoading && (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />)}
        </div>
      )}

      <AnimatePresence initial={false}>
        {posts.map(post => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="group rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <Avatar name={post.author.fullName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{post.author.fullName}</span>
                    <RoleBadge role={post.author.role} />
                    <span className="ml-auto text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                    {canDeletePost(post) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => setDelPostId(post.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.body}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reply form */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <Textarea
          rows={3}
          placeholder={tf.writeReplyPlaceholder}
          value={replyBody}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyBody(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!replyBody.trim() || replyMut.isPending}
            onClick={() => replyMut.mutate(replyBody)}
          >
            {tf.reply}
          </Button>
        </div>
      </div>

      {/* Delete post confirm dialog */}
      <Dialog open={!!delPostId} onOpenChange={(o: boolean) => !o && setDelPostId(null)}>
        <DialogHeader>
          <DialogTitle>{tf.deletePost}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">{tf.deleteConfirm}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDelPostId(null)}>{tf.cancel}</Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deletePostMut.isPending}
            onClick={() => delPostId && deletePostMut.mutate(delPostId)}
          >
            {tf.deletePost}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
