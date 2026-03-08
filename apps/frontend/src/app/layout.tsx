import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
export const metadata: Metadata = { title: 'UniLMS', description: 'Academic Management Platform' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body><Providers>{children}<Toaster /></Providers></body></html>);
}
