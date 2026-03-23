'use client';
import { useDeferredValue, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Group, PaginatedResponse, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label, Select, Skeleton } from '@/components/ui/form-elements';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { toast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const t = useT();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterGroupId, setFilterGroupId] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [groupId, setGroupId] = useState('');
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, filterRole, filterGroupId]);

  const usersParams = new URLSearchParams({ page: String(page), limit: String(pageSize) });
  if (deferredSearch.trim()) usersParams.set('search', deferredSearch.trim());
  if (filterRole !== 'ALL') usersParams.set('role', filterRole);
  if (filterGroupId !== 'ALL') usersParams.set('groupId', filterGroupId);

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['a-users', page, deferredSearch, filterRole, filterGroupId],
    queryFn: () => api.get(`/admin/users?${usersParams.toString()}`),
  });
  const users = data?.items || [];

  const { data: groupsData } = useQuery<PaginatedResponse<Group>>({
    queryKey: ['a-groups'],
    queryFn: () => api.get('/admin/groups?limit=200'),
  });
  const groups = groupsData?.items || [];

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.post('/admin/users', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['a-users'] });
      toast({ title: t.adminCrud.created });
      setOpen(false);
    },
    onError: (error: Error) => toast({ title: t.common.error, description: error.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) => api.patch(`/admin/users/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['a-users'] });
      toast({ title: t.adminCrud.updated });
      setOpen(false);
    },
    onError: (error: Error) => toast({ title: t.common.error, description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['a-users'] });
      toast({ title: t.adminCrud.deleted });
    },
    onError: (error: Error) => toast({ title: t.common.error, description: error.message, variant: 'destructive' }),
  });

  const resetForm = () => {
    setEditing(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('STUDENT');
    setGroupId('');
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setEmail(user.email);
    setPassword('');
    setFullName(user.fullName);
    setRole(user.role);
    setGroupId(user.groupId || '');
    setOpen(true);
  };

  const submit = () => {
    if (editing) {
      const payload: Record<string, unknown> = { email, fullName, role, groupId: groupId || null };
      if (password) payload.password = password;
      updateMutation.mutate({ id: editing.id, payload });
      return;
    }

    createMutation.mutate({
      email,
      password,
      fullName,
      role,
      groupId: groupId || undefined,
    });
  };

  const roleLabel = {
    ADMIN: t.adminCrud.userRoleAdmin,
    TEACHER: t.adminCrud.userRoleTeacher,
    STUDENT: t.adminCrud.userRoleStudent,
  };

  const badgeVariant = (value: string) => value === 'ADMIN'
    ? 'destructive'
    : value === 'TEACHER'
      ? 'default'
      : 'secondary';
  const hasActiveFilters = !!deferredSearch.trim() || filterRole !== 'ALL' || filterGroupId !== 'ALL';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t.adminCrud.usersTitle}</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t.adminCrud.usersAdd}
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Label htmlFor="users-search" className="sr-only">{t.common.search}</Label>
          <Input
            id="users-search"
            aria-label={`${t.common.search} ${t.adminCrud.usersTitle.toLowerCase()}`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.adminCrud.searchPlaceholder}
          />
          <Label htmlFor="users-role-filter" className="sr-only">{t.adminCrud.role}</Label>
          <Select id="users-role-filter" aria-label={t.adminCrud.role} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="ALL">{t.adminCrud.allRoles}</option>
            <option value="STUDENT">{t.adminCrud.userRoleStudent}</option>
            <option value="TEACHER">{t.adminCrud.userRoleTeacher}</option>
            <option value="ADMIN">{t.adminCrud.userRoleAdmin}</option>
          </Select>
          <Label htmlFor="users-group-filter" className="sr-only">{t.adminCrud.group}</Label>
          <Select id="users-group-filter" aria-label={t.adminCrud.group} value={filterGroupId} onChange={e => setFilterGroupId(e.target.value)}>
            <option value="ALL">{t.adminCrud.allGroups}</option>
            {groups?.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : !users?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">{hasActiveFilters ? t.common.noResults : t.adminCrud.usersEmpty}</p>
            <p className="mx-auto mt-1 max-w-md text-xs">{hasActiveFilters ? t.adminCrud.filteredEmpty : t.adminCrud.usersEmptyDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:hidden">
            {users.map(user => (
              <Card key={user.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{user.fullName}</p>
                      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={badgeVariant(user.role)}>{roleLabel[user.role]}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t.adminCrud.group}: {user.group?.name || '-'}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-2" onClick={() => openEdit(user)}>
                      <Pencil className="h-3.5 w-3.5" />
                      {t.adminCrud.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 text-destructive"
                      onClick={() => {
                        if (confirm(t.adminCrud.confirmDelete)) deleteMutation.mutate(user.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.adminCrud.remove}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">{t.adminCrud.fullName}</th>
                    <th className="p-3 text-left font-medium">{t.adminCrud.email}</th>
                    <th className="p-3 text-left font-medium">{t.adminCrud.role}</th>
                    <th className="p-3 text-left font-medium">{t.adminCrud.group}</th>
                    <th className="p-3 text-right font-medium">{t.adminCrud.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{user.fullName}</td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <Badge variant={badgeVariant(user.role)}>{roleLabel[user.role]}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{user.group?.name || '-'}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" aria-label={`${t.adminCrud.edit}: ${user.fullName}`} onClick={() => openEdit(user)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`${t.adminCrud.remove}: ${user.fullName}`}
                          onClick={() => {
                            if (confirm(t.adminCrud.confirmDelete)) deleteMutation.mutate(user.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <PaginationControls
            page={page}
            itemsCount={users.length}
            totalItems={data?.total}
            hasNext={data?.hasNext ?? false}
            isLoading={isLoading}
            onPrevious={() => setPage(current => Math.max(1, current - 1))}
            onNext={() => setPage(current => current + 1)}
          />
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? t.adminCrud.usersEdit : t.adminCrud.usersCreate}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="user-full-name">{t.adminCrud.fullName}</Label>
            <Input id="user-full-name" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="user-email">{t.adminCrud.email}</Label>
            <Input id="user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="user-password">
              {t.adminCrud.password}
              {editing ? ` (${t.adminCrud.passwordKeep})` : ''}
            </Label>
            <Input id="user-password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="user-role">{t.adminCrud.role}</Label>
            <Select id="user-role" value={role} onChange={e => setRole(e.target.value)}>
              <option value="STUDENT">{t.adminCrud.userRoleStudent}</option>
              <option value="TEACHER">{t.adminCrud.userRoleTeacher}</option>
              <option value="ADMIN">{t.adminCrud.userRoleAdmin}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="user-group">{t.adminCrud.group}</Label>
            <Select id="user-group" value={groupId} onChange={e => setGroupId(e.target.value)}>
              <option value="">{t.adminCrud.none}</option>
              {groups?.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
            </Select>
          </div>
          <Button className="w-full" onClick={submit} disabled={!email || !fullName || (!editing && !password)}>
            {editing ? t.adminCrud.update : t.adminCrud.create}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
