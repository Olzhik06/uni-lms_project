'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LayoutDashboard, SearchX } from 'lucide-react';
import { SystemScreen } from '@/components/feedback/system-screen';
import { Button, buttonVariants } from '@/components/ui/button';
import { useT } from '@/lib/i18n';

export default function NotFound() {
  const router = useRouter();
  const t = useT();

  return (
    <SystemScreen
      status={t.systemPages.notFoundStatus}
      title={t.systemPages.notFoundTitle}
      description={t.systemPages.notFoundDescription}
      icon={SearchX}
      actions={
        <>
          <Link href="/dashboard" className={buttonVariants({ variant: 'default' })}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {t.systemPages.goDashboard}
          </Link>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.systemPages.goBack}
          </Button>
        </>
      }
    />
  );
}
