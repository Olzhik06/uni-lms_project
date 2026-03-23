'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { SystemScreen } from '@/components/feedback/system-screen';
import { Button, buttonVariants } from '@/components/ui/button';
import { useT } from '@/lib/i18n';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SystemScreen
      status={t.systemPages.errorStatus}
      title={t.systemPages.errorTitle}
      description={t.systemPages.errorDescription}
      icon={AlertTriangle}
      actions={
        <>
          <Button onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t.systemPages.tryAgain}
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: 'outline' })}>
            {t.systemPages.goDashboard}
          </Link>
        </>
      }
      details={
        <div className="rounded-lg border border-border/70 bg-muted/60 px-4 py-3 text-left space-y-1">
          {error.message && (
            <p className="mt-1 text-xs font-mono text-destructive/80 break-all">{error.message}</p>
          )}
          {error.digest && (
            <p className="text-xs font-mono text-foreground/60">{error.digest}</p>
          )}
        </div>
      }
    />
  );
}
