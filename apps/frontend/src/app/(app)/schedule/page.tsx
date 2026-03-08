'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ScheduleItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/form-elements';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTime } from '@/lib/utils';
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
function gM(d:Date){const r=new Date(d);const day=r.getDay();r.setDate(r.getDate()-(day===0?6:day-1));r.setHours(0,0,0,0);return r;}
const TC:Record<string,string>={LECTURE:'default',PRACTICE:'success',LAB:'secondary',EXAM:'destructive'};
export default function SchedulePage(){const[ws,sWs]=useState(gM(new Date()));const we=new Date(ws);we.setDate(ws.getDate()+6);we.setHours(23,59,59,999);const{data:items,isLoading}=useQuery<ScheduleItem[]>({queryKey:['sched',ws.toISOString()],queryFn:()=>api.get(`/me/schedule?from=${ws.toISOString()}&to=${we.toISOString()}`)});const prev=()=>{const d=new Date(ws);d.setDate(d.getDate()-7);sWs(d);};const next=()=>{const d=new Date(ws);d.setDate(d.getDate()+7);sWs(d);};const dd=(i:number)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return d;};const ic=(i:number)=>dd(i).toDateString()===new Date().toDateString();
return(<div className="space-y-4"><div className="flex items-center justify-between flex-wrap gap-2"><h1 className="text-2xl font-bold">Schedule</h1><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={prev}><ChevronLeft className="h-4 w-4"/></Button><Button variant="outline" size="sm" onClick={()=>sWs(gM(new Date()))}>Today</Button><Button variant="outline" size="sm" onClick={next}><ChevronRight className="h-4 w-4"/></Button></div></div><Card><CardContent className="p-4">{isLoading?<div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-12 w-full"/>)}</div>:<div className="grid grid-cols-7 gap-2">{DAYS.map((day,i)=>{const dayItems=(items||[]).filter(s=>new Date(s.startsAt).toDateString()===dd(i).toDateString());return(<div key={day} className={`border rounded-lg p-3 min-h-[200px] ${ic(i)?'bg-primary/5 border-primary/30':''}`}><p className="text-xs font-semibold text-muted-foreground">{day}</p><p className={`text-lg font-bold mb-2 ${ic(i)?'text-primary':''}`}>{dd(i).getDate()}</p><div className="space-y-2">{dayItems.map(s=>(<div key={s.id} className="p-2 rounded bg-muted/50 text-xs"><p className="font-semibold">{s.course?.code}</p><p>{formatTime(s.startsAt)}-{formatTime(s.endsAt)}</p><p className="text-muted-foreground">{s.room}</p><Badge variant={(TC[s.type]||'secondary') as any} className="mt-1 text-[10px]">{s.type}</Badge></div>))}</div></div>);})}</div>}</CardContent></Card></div>);}
