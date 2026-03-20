'use client';

import './globals.css';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RefreshCcw } from 'lucide-react';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { SystemScreen } from '@/components/feedback/system-screen';
import { Button, buttonVariants } from '@/components/ui/button';
import { useT } from '@/lib/i18n';

function GlobalErrorContent({
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
      title={t.systemPages.globalErrorTitle}
      description={t.systemPages.globalErrorDescription}
      icon={AlertOctagon}
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
        error.digest ? (
          <div className="rounded-lg border border-border/70 bg-muted/60 px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t.systemPages.technicalDetails}
            </p>
            <p className="mt-2 text-sm font-mono text-foreground/80">{error.digest}</p>
          </div>
        ) : null
      }
    />
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <GlobalErrorContent error={error} reset={reset} />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
