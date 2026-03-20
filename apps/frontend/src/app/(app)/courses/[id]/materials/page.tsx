'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useMe } from '@/hooks/use-auth';
import type { CourseMaterial } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea, Select } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { FileText, Link as LinkIcon, AlignLeft, Trash2, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const TYPE_ICONS = { link: LinkIcon, file: FileText, text: AlignLeft };
const TYPE_COLORS: Record<string, string> = {
  link: 'bg-blue-100 text-blue-800',
  file: 'bg-green-100 text-green-800',
  text: 'bg-purple-100 text-purple-800',
};

export default function MaterialsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user } = useMe();
  const qc = useQueryClient();
  const t = useT();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'link', url: '', content: '' });

  const { data: materials, isLoading } = useQuery<CourseMaterial[]>({
    queryKey: ['materials', id],
    queryFn: () => api.get(`/courses/${id}/materials`),
  });

  const canManage = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post(`/courses/${id}/materials`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials', id] });
      setShowForm(false);
      setForm({ title: '', type: 'link', url: '', content: '' });
      toast({ title: t.courseMaterials.materialAdded });
    },
    onError: () => toast({
      title: t.courseMaterials.materialAddFailedTitle,
      description: t.courseMaterials.materialAddFailedDescription,
      variant: 'destructive',
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (matId: string) => api.delete(`/materials/${matId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials', id] });
      toast({ title: t.courseMaterials.materialDeleted });
    },
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"/>)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.courseMaterials.title}</h2>
        {canManage && (
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />{t.courseMaterials.addMaterial}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t.courseMaterials.addMaterialTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder={t.courseMaterials.titlePlaceholder} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="link">{t.courseMaterials.linkType}</option>
              <option value="file">{t.courseMaterials.fileType}</option>
              <option value="text">{t.courseMaterials.textType}</option>
            </Select>
            {(form.type === 'link' || form.type === 'file') && (
              <Input placeholder={t.courseMaterials.urlPlaceholder} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            )}
            {form.type === 'text' && (
              <Textarea placeholder={t.courseMaterials.contentPlaceholder} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} />
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMutation.mutate({ title: form.title, type: form.type, url: form.url || undefined, content: form.content || undefined })} disabled={!form.title || addMutation.isPending}>
                {addMutation.isPending ? t.courseMaterials.saving : t.common.save}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(materials || []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t.courseMaterials.noMaterials}</p>
      ) : (
        <div className="space-y-3">
          {(materials || []).map(m => {
            const Icon = TYPE_ICONS[m.type as keyof typeof TYPE_ICONS] || FileText;
            const typeLabel = m.type === 'link'
              ? t.courseMaterials.typeLink
              : m.type === 'file'
                ? t.courseMaterials.typeFile
                : t.courseMaterials.typeText;
            return (
              <Card key={m.id}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${TYPE_COLORS[m.type] || ''}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{m.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-[10px]">{typeLabel}</Badge>
                        {canManage && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteMutation.mutate(m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">{m.url}</a>}
                    {m.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{m.content}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(m.createdAt)}</p>
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
