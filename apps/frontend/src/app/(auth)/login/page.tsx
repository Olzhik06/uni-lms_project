'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/form-elements';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GraduationCap, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const go = (e: React.FormEvent) => { e.preventDefault(); login.mutate({ email, password }, { onError: (err) => toast({ title: 'Login failed', description: err.message, variant: 'destructive' }) }); };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-11 w-11 rounded-lg bg-primary flex items-center justify-center"><GraduationCap className="h-6 w-6 text-white" /></div>
          <CardTitle className="font-serif text-2xl font-semibold">Welcome to UniLMS</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={go} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="admin@uni.kz" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" placeholder="Admin123!" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={login.isPending}>{login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign In</Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground"><Link href="/register" className="text-primary hover:underline">Create an account</Link></div>
          <div className="mt-6 border-t pt-4"><p className="text-xs text-muted-foreground mb-2 font-medium">Demo:</p><div className="grid gap-1 text-xs text-muted-foreground"><p>Admin: admin@uni.kz / Admin123!</p><p>Teacher: teacher1@uni.kz / Teacher123!</p><p>Student: student1@uni.kz / Student123!</p></div></div>
        </CardContent>
      </Card>
    </div>
  );
}
