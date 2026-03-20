import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type SystemScreenProps = {
  status: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: ReactNode;
  details?: ReactNode;
  fullScreen?: boolean;
};

export function SystemScreen({
  status,
  title,
  description,
  icon: Icon,
  actions,
  details,
  fullScreen = true,
}: SystemScreenProps) {
  return (
    <div className={fullScreen ? 'relative min-h-screen overflow-hidden bg-background' : 'relative overflow-hidden'}>
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-accent/70 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-56 w-56 rounded-full bg-secondary blur-3xl" />

      <div className="relative flex min-h-[inherit] items-center justify-center px-6 py-16">
        <Card className="w-full max-w-2xl border-border/70 bg-card/95 shadow-xl shadow-primary/5 backdrop-blur">
          <CardContent className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full border border-primary/15 bg-primary/10 p-4 text-primary">
                <Icon className="h-8 w-8" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">{status}</p>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
            </div>

            {actions ? <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div> : null}
            {details ? <div className="mt-8">{details}</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
