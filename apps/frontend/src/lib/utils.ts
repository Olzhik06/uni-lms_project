import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatTime(iso: string) { return new Date(iso).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}); }
export function formatDate(iso: string) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
export function formatDateTime(iso: string) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return formatDate(iso);
}
