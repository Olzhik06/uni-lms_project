'use client';
import { useMe } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useMe();
  const router = useRouter();
  useEffect(() => { if (!isLoading && (isError || !user)) router.push('/login'); }, [isLoading, isError, user, router]);
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;
  return (<div className="min-h-screen bg-muted/30"><Sidebar /><div className="lg:ml-64"><Topbar /><main className="p-6">{children}</main></div></div>);
}
