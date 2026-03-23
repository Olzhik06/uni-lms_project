'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/form-elements';
import { GraduationCap, Loader2, BookOpen, Users, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const features = [
  { icon: BookOpen, label: 'Course Management' },
  { icon: Users,    label: 'Collaboration'    },
  { icon: Award,    label: 'Progress Tracking' },
];

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onError: (err) => toast({ title: 'Login failed', description: err.message, variant: 'destructive' }) }
    );
  };

  return (
    <div className="min-h-screen flex items-stretch bg-background">

      {/* ── LEFT PANEL (decorative, hidden on mobile) ── */}
      <div className={cn(
        'hidden lg:flex lg:w-1/2 flex-col justify-between p-12',
        // Light: warm editorial wash
        'bg-accent/60',
        // Dark: deep space panel with ambient orbs
        'dark:bg-muted/30',
      )}>
        {/* Logo mark */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center dark:shadow-glow-sm">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold">UniLMS</span>
        </div>

        {/* Ambient decorative orbs (dark only) */}
        <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden pointer-events-none hidden dark:block">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/3 left-1/3 h-40 w-40 rounded-full bg-blue-500/[0.04] blur-2xl animate-pulse-glow" style={{ animationDelay: '1.4s' }} />
        </div>

        {/* Headline */}
        <div className="relative space-y-4">
          <h1 className="font-serif text-4xl font-bold leading-tight text-foreground">
            {/* Light: academic warmth */}
            <span className="dark:hidden">Your gateway to<br />academic excellence</span>
            {/* Dark: OS identity */}
            <span className="hidden dark:block">Learning<br />Operating System</span>
          </h1>
          <p className="text-muted-foreground max-w-xs dark:hidden">
            A unified platform for courses, assignments, and academic growth.
          </p>
          <p className="text-muted-foreground max-w-xs hidden dark:block">
            Intelligent. Connected. Adaptive. The future of education is here.
          </p>

          <div className="flex gap-6 pt-2">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <div className={cn(
                  'h-9 w-9 rounded-md flex items-center justify-center',
                  'bg-primary/10 text-primary',
                  'dark:bg-primary/10 dark:text-primary dark:shadow-[0_0_12px_-3px_hsl(var(--primary)/0.3)]'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground/60">© 2025 UniLMS. All rights reserved.</p>
      </div>

      {/* ── RIGHT PANEL (login form) ── */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center dark:shadow-glow-sm">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold">UniLMS</span>
          </div>

          {/* Pulsing logo ring (dark mode only) */}
          <div className="hidden dark:flex justify-center mb-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-glow scale-125" />
              <div className="relative h-16 w-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center dark:shadow-glow">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              <span className="dark:hidden">Welcome back</span>
              <span className="hidden dark:block">Sign in to your system</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              <span className="dark:hidden">Sign in to continue your academic journey</span>
              <span className="hidden dark:block">Access your personalized learning environment</span>
            </p>
          </div>

          <form onSubmit={go} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={login.isPending}
            >
              {login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <span className="dark:hidden">Sign In</span>
              <span className="hidden dark:block">Access System</span>
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            New here?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline underline-offset-4">
              Create an account
            </Link>
          </div>

          {/* Demo credentials */}
          <div className={cn(
            'rounded-lg border p-4 space-y-3',
            'bg-muted/50 border-border',
            'dark:bg-white/[0.03] dark:border-white/[0.07]'
          )}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Demo credentials</p>
            <div className="grid gap-2">
              {[
                { role: 'Admin',   email: 'admin@uni.kz',    password: 'Admin123!'   },
                { role: 'Teacher', email: 'teacher1@uni.kz', password: 'Teacher123!' },
                { role: 'Student', email: 'student1@uni.kz', password: 'Student123!' },
              ].map(({ role, email: e, password: p }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setEmail(e); setPassword(p); }}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 text-xs text-left transition-colors',
                    'bg-background border border-border hover:border-primary/40 hover:bg-accent',
                    'dark:bg-white/[0.03] dark:border-white/[0.07] dark:hover:bg-white/[0.06]'
                  )}
                >
                  <span className="font-semibold text-foreground/70">{role}</span>
                  <span className="font-mono text-muted-foreground">{e}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
