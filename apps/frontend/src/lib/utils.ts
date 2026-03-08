import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatTime(iso: string) { return new Date(iso).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false}); }
export function formatDate(iso: string) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
export function formatDateTime(iso: string) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }
