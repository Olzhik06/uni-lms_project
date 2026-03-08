'use client';
import { useLogout } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
export function Topbar(){const lo=useLogout();const{data:uc}=useQuery<number>({queryKey:['nc'],queryFn:()=>api.get<number>('/me/notifications/unread-count'),refetchInterval:30_000});return(<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-6"><div className="flex-1 lg:ml-0 ml-12"/><Link href="/notifications" className="relative"><Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"/>{typeof uc==='number'&&uc>0&&<span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">{uc>9?'9+':uc}</span>}</Link><Button variant="ghost" size="sm" onClick={()=>lo.mutate()} className="gap-2 text-muted-foreground"><LogOut className="h-4 w-4"/><span className="hidden sm:inline">Logout</span></Button></header>);}
