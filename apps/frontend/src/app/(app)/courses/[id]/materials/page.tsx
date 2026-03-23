'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { CourseMaterial } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea, Select, Skeleton } from '@/components/ui/form-elements';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import {
  FileText, Link as LinkIcon, AlignLeft, Trash2, Plus,
  ExternalLink, BookMarked, ChevronRight, X, Upload, AlertTriangle,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  link: {
    icon: LinkIcon,
    label: 'Link',
    bg:     'bg-blue-50 dark:bg-blue-500/[0.12]',
    icon_c: 'text-blue-600 dark:text-blue-400',
    badge:  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/[0.1] dark:text-blue-300 dark:border-blue-500/25',
    accent: 'border-l-blue-400 dark:border-l-blue-500/50',
  },
  file: {
    icon: FileText,
    label: 'File',
    bg:     'bg-emerald-50 dark:bg-emerald-500/[0.12]',
    icon_c: 'text-emerald-600 dark:text-emerald-400',
    badge:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/[0.1] dark:text-emerald-300 dark:border-emerald-500/25',
    accent: 'border-l-emerald-400 dark:border-l-emerald-500/50',
  },
  text: {
    icon: AlignLeft,
    label: 'Note',
    bg:     'bg-purple-50 dark:bg-purple-500/[0.12]',
    icon_c: 'text-purple-600 dark:text-purple-400',
    badge:  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/[0.1] dark:text-purple-300 dark:border-purple-500/25',
    accent: 'border-l-purple-400 dark:border-l-purple-500/50',
  },
};

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyMaterials({ canManage, onAdd }: { canManage: boolean; onAdd: () => void }) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="relative mb-5">
        <div className="h-16 w-16 rounded-2xl bg-muted dark:bg-white/[0.04] flex items-center justify-center">
          <BookMarked className="h-8 w-8 text-muted-foreground/40" />
        </div>
        {canManage && (
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
            <Plus className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        )}
      </div>
      <p className="font-serif font-medium text-foreground mb-1">{t.courseMaterials.noMaterials}</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        {canManage ? t.courseMaterials.noMaterialsTeacher : t.courseMaterials.noMaterialsStudent}
      </p>
      {canManage && (
        <Button onClick={onAdd} size="sm" className="mt-5 gap-2">
          <Plus className="h-4 w-4" /> {t.courseMaterials.addFirstMaterial}
        </Button>
      )}
    </motion.div>
  );
}

// ─── Material card ────────────────────────────────────────────────────────────

function MaterialCard({
  material, canManage, onDelete,
}: {
  material: CourseMaterial;
  canManage: boolean;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const cfg = TYPE_CONFIG[material.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.file;
  const Icon = cfg.icon;
  const badgeLabels: Record<string, string> = {
    link: t.courseMaterials.badgeLink,
    file: t.courseMaterials.badgeFile,
    text: t.courseMaterials.badgeText,
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      <motion.div
        whileHover={{ y: -2, scale: 1.005 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'group relative rounded-lg border border-l-[3px] overflow-hidden',
          'bg-background dark:bg-card/80 dark:backdrop-blur-sm',
          'shadow-card hover:shadow-lift',
          'dark:border-white/[0.07] dark:hover:border-white/[0.12]',
          'transition-shadow duration-150',
          cfg.accent,
        )}
      >
        <div className="flex items-start gap-4 p-4">
          {/* Icon */}
          <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5',
            cfg.bg,
          )}>
            <Icon className={cn('h-4 w-4', cfg.icon_c)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground leading-snug">{material.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(material.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn(
                  'inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                  cfg.badge,
                )}>
                  {badgeLabels[material.type] ?? cfg.label}
                </span>
                {canManage && (
                  <button
                    onClick={() => onDelete(material.id)}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-150"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* URL */}
            {material.url && (
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'mt-2 inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-100',
                  'text-primary/80 hover:text-primary',
                )}
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[280px]">{material.url}</span>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            {/* Text content */}
            {material.content && (
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {material.content}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add form ─────────────────────────────────────────────────────────────────

function AddMaterialForm({
  onSave, onCancel, isPending, uploadProgress, t,
}: {
  onSave: (data: any, file?: File) => void;
  onCancel: () => void;
  isPending: boolean;
  uploadProgress: number | null;
  t: ReturnType<typeof useT>;
}) {
  const [form, setForm] = useState({ title: '', type: 'link', url: '', content: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDrag, setIsDrag] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canSave = !!form.title && (
    form.type === 'text'
      ? !!form.content
      : form.type === 'link'
      ? !!form.url
      : !!uploadFile // file type requires a file
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.99 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-xl border p-5 space-y-4',
        'bg-background dark:bg-card/80',
        'border-primary/20 dark:border-primary/25',
        'shadow-lift',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{t.courseMaterials.addMaterialTitle}</p>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input
            placeholder={form.type === 'file' && uploadFile ? uploadFile.name : t.courseMaterials.titlePlaceholder}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="text-sm"
          />
        </div>
        <Select value={form.type} onChange={e => { set('type', e.target.value); setUploadFile(null); }} className="text-sm">
          <option value="link">{t.courseMaterials.linkType}</option>
          <option value="file">{t.courseMaterials.fileType}</option>
          <option value="text">{t.courseMaterials.textType}</option>
        </Select>
      </div>

      {form.type === 'link' && (
        <Input
          placeholder={t.courseMaterials.urlPlaceholder}
          value={form.url}
          onChange={e => set('url', e.target.value)}
          className="text-sm"
        />
      )}

      {form.type === 'file' && (
        uploadFile ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-border/50 dark:border-white/[0.07] bg-emerald-50/50 dark:bg-emerald-500/[0.07] px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-500/[0.15]">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{uploadFile.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {uploadFile.size >= 1048576 ? `${(uploadFile.size/1048576).toFixed(1)} MB` : `${(uploadFile.size/1024).toFixed(0)} KB`}
              </p>
            </div>
            <button onClick={() => setUploadFile(null)} className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={e => {
              e.preventDefault(); setIsDrag(false);
              const f = e.dataTransfer.files[0];
              if (f) { setUploadFile(f); if (!form.title) set('title', f.name); }
            }}
            onClick={() => {
              const inp = document.createElement('input');
              inp.type = 'file';
              inp.onchange = ev => {
                const f = (ev.target as HTMLInputElement).files?.[0];
                if (f) { setUploadFile(f); if (!form.title) set('title', f.name); }
              };
              inp.click();
            }}
            className={cn(
              'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all duration-150 select-none',
              isDrag
                ? 'border-primary bg-primary/[0.06] dark:bg-primary/[0.1]'
                : 'border-border/60 dark:border-white/[0.1] hover:border-primary/40 hover:bg-muted/30',
            )}
          >
            <motion.div animate={{ scale: isDrag ? 1.15 : 1 }} transition={{ duration: 0.15 }}>
              <Upload className={cn('mx-auto mb-2 h-7 w-7 transition-colors', isDrag ? 'text-primary' : 'text-muted-foreground/40')} />
            </motion.div>
            <p className="text-sm font-medium">{isDrag ? t.courseMaterials.dropFile : t.courseMaterials.dragDropOrClick}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t.courseMaterials.fileTypesHint}</p>
          </div>
        )
      )}

      {form.type === 'text' && (
        <Textarea
          placeholder={t.courseMaterials.contentPlaceholder}
          value={form.content}
          onChange={e => set('content', e.target.value)}
          rows={3}
          className="text-sm resize-none"
        />
      )}

      {uploadProgress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{t.courseMaterials.uploading}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          disabled={!canSave || isPending}
          onClick={() => onSave(
            { title: form.title, type: form.type, url: form.url || undefined, content: form.content || undefined },
            form.type === 'file' ? uploadFile ?? undefined : undefined,
          )}
          className="gap-1.5"
        >
          {isPending ? (
            <><div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> {t.profile.saving}</>
          ) : (
            t.common.save
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>{t.common.cancel}</Button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useMe();
  const qc = useQueryClient();
  const t = useT();
  const [showForm, setShowForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const canManage = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const { data: materials, isLoading } = useQuery<CourseMaterial[]>({
    queryKey: ['materials', id],
    queryFn: () => api.get(`/courses/${id}/materials`),
  });

  const addMutation = useMutation({
    mutationFn: async ({ data, file }: { data: any; file?: File }) => {
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        if (data.title) fd.append('title', data.title);
        setUploadProgress(0);
        return api.uploadWithProgress(`/courses/${id}/materials/upload`, fd, pct => setUploadProgress(pct));
      }
      return api.post(`/courses/${id}/materials`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials', id] });
      setShowForm(false);
      setUploadProgress(null);
      toast({ title: t.courseMaterials.materialAdded });
    },
    onError: () => {
      setUploadProgress(null);
      toast({
        title: t.courseMaterials.materialAddFailedTitle,
        description: t.courseMaterials.materialAddFailedDescription,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (matId: string) => api.delete(`/materials/${matId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials', id] });
      setConfirmDeleteId(null);
      toast({ title: t.courseMaterials.materialDeleted });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-lg border border-l-[3px] border-l-muted bg-background dark:bg-card/80 p-4 flex gap-4 items-start">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const list = materials || [];

  return (
    <div className="space-y-4 mt-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">{t.courseMaterials.title}</h2>
        {canManage && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />{t.courseMaterials.addMaterial}
          </Button>
        )}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <AddMaterialForm
            onSave={(data, file) => addMutation.mutate({ data, file })}
            onCancel={() => setShowForm(false)}
            isPending={addMutation.isPending}
            uploadProgress={uploadProgress}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* List */}
      {list.length === 0 ? (
        <EmptyMaterials canManage={canManage} onAdd={() => setShowForm(true)} />
      ) : (
        <motion.div
          className="space-y-2.5"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          animate="visible"
        >
          {list.map(m => (
            <MaterialCard
              key={m.id}
              material={m}
              canManage={canManage}
              onDelete={matId => setConfirmDeleteId(matId)}
            />
          ))}
        </motion.div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!confirmDeleteId} onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {t.courseMaterials.deleteConfirmTitle}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-5">{t.courseMaterials.deleteConfirmBody}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>{t.common.cancel}</Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
          >
            {deleteMutation.isPending
              ? <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
            {t.courseMaterials.deleteConfirmButton}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
