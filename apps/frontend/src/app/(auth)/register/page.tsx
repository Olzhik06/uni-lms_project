'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/form-elements';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GraduationCap, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
export default function RegisterPage() {
  const [e, sE] = useState(''); const [p, sP] = useState(''); const [fn, sFn] = useState('');
  const reg = useRegister();
  const go = (ev: React.FormEvent) => { ev.preventDefault(); reg.mutate({ email: e, password: p, fullName: fn }, { onError: (err) => toast({ title: 'Failed', description: err.message, variant: 'destructive' }) }); };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md"><CardHeader className="text-center"><div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-primary flex items-center justify-center"><GraduationCap className="h-7 w-7 text-white"/></div><CardTitle className="text-2xl">Create Account</CardTitle><CardDescription>Register for UniLMS</CardDescription></CardHeader>
        <CardContent><form onSubmit={go} className="space-y-4"><div className="space-y-2"><Label>Full Name</Label><Input value={fn} onChange={x=>sFn(x.target.value)} required/></div><div className="space-y-2"><Label>Email</Label><Input type="email" value={e} onChange={x=>sE(x.target.value)} required/></div><div className="space-y-2"><Label>Password</Label><Input type="password" value={p} onChange={x=>sP(x.target.value)} required minLength={6}/></div><Button type="submit" className="w-full" disabled={reg.isPending}>{reg.isPending&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Register</Button></form><div className="mt-4 text-center text-sm text-muted-foreground">Have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></div></CardContent>
      </Card>
    </div>
  );
}
