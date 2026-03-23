'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMe } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { useLanguage, type Lang } from '@/lib/i18n';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/form-elements';
import { Globe, KeyRound, Mail, ShieldCheck, UserCircle2, Users } from 'lucide-react';
import type { User } from '@/lib/types';

const roleVariant = {
  ADMIN: 'destructive',
  TEACHER: 'default',
  STUDENT: 'secondary',
} as const;

export default function ProfilePage() {
  const { data: user } = useMe();
  const qc = useQueryClient();
  const { lang, setLang, t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || '');
    setEmail(user.email || '');
  }, [user]);

  const roleLabel = {
    ADMIN: t.profile.roleAdmin,
    TEACHER: t.profile.roleTeacher,
    STUDENT: t.profile.roleStudent,
  };

  const updateProfile = useMutation({
    mutationFn: (payload: { fullName: string; email: string; preferredLang?: string }) => api.patch<User>('/me/profile', payload),
    onSuccess: async data => {
      await qc.invalidateQueries({ queryKey: ['me'] });
      qc.setQueryData(['me'], data);
      toast({ title: t.profile.updateSuccess });
    },
    onError: (error: Error) => {
      toast({
        title: t.common.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const saveLang = (l: Lang) => {
    setLang(l);
    api.patch('/me/profile', { preferredLang: l }).catch(() => null);
    toast({ title: t.profile.langSaved });
  };

  const changePassword = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) => api.patch('/me/password', payload),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: t.profile.passwordChanged });
    },
    onError: (error: Error) => {
      toast({
        title: t.common.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!user) return null;

  const groupName = user.group?.name || t.profile.noGroup;

  const submitProfile = () => {
    updateProfile.mutate({ fullName: fullName.trim(), email: email.trim() });
  };

  const submitPassword = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: t.profile.passwordMismatch, variant: 'destructive' });
      return;
    }
    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.profile.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.profile.subtitle}</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary">
              {user.fullName?.charAt(0)}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold">{user.fullName}</h2>
                  <Badge variant={roleVariant[user.role]}>{roleLabel[user.role]}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {t.profile.email}
                  </div>
                  <p className="mt-2 text-sm font-medium">{user.email}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {t.profile.group}
                  </div>
                  <p className="mt-2 text-sm font-medium">{groupName}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5" />
              {t.profile.personalInfo}
            </CardTitle>
            <CardDescription>{t.profile.accountInfo}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t.profile.fullName}</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t.profile.email}</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t.profile.role}</Label>
              <Input value={roleLabel[user.role]} disabled />
            </div>

            <div className="space-y-2">
              <Label>{t.profile.group}</Label>
              <Input value={groupName} disabled />
            </div>

            <Button
              className="w-full"
              onClick={submitProfile}
              disabled={!fullName.trim() || !email.trim() || updateProfile.isPending}
            >
              {updateProfile.isPending ? t.profile.saving : t.profile.saveProfile}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              {t.profile.security}
            </CardTitle>
            <CardDescription>{t.profile.changePassword}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t.profile.currentPassword}</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t.profile.newPassword}</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t.profile.confirmPassword}</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>

            <Button
              className="w-full gap-2"
              onClick={submitPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword || changePassword.isPending}
            >
              <KeyRound className="h-4 w-4" />
              {changePassword.isPending ? t.profile.saving : t.profile.changePassword}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.profile.language}
          </CardTitle>
          <CardDescription>{t.profile.languageDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {([
              { code: 'en' as Lang, label: t.profile.langEn, flag: '🇬🇧' },
              { code: 'ru' as Lang, label: t.profile.langRu, flag: '🇷🇺' },
              { code: 'kz' as Lang, label: t.profile.langKz, flag: '🇰🇿' },
            ] as const).map(({ code, label, flag }) => (
              <button
                key={code}
                type="button"
                onClick={() => saveLang(code)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  lang === code
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-input bg-background hover:bg-muted'
                }`}
              >
                <span className="text-base">{flag}</span>
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
