'use client';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Course } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/form-elements';
import { ArrowLeft } from 'lucide-react';
const tabs=[{l:'Overview',h:'overview'},{l:'Assignments',h:'assignments'},{l:'Materials',h:'materials'},{l:'Grades',h:'grades'},{l:'Attendance',h:'attendance'},{l:'Participants',h:'participants'}];
export default function CourseLayout({children}:{children:React.ReactNode}){const{id}=useParams<{id:string}>();const path=usePathname();const{data:course,isLoading}=useQuery<Course>({queryKey:['course',id],queryFn:()=>api.get(`/courses/${id}`)});if(isLoading)return<div className="space-y-4"><Skeleton className="h-8 w-64"/><Skeleton className="h-10 w-full"/><Skeleton className="h-64 w-full"/></div>;return(<div className="space-y-4"><div className="flex items-center gap-3"><Link href="/courses" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5"/></Link><div><h1 className="text-2xl font-bold">{course?.title}</h1><p className="text-sm text-muted-foreground">{course?.code} &middot; {course?.teacher?.fullName} &middot; {course?.semester}</p></div></div><div className="border-b flex gap-0 overflow-x-auto">{tabs.map(t=>{const href=`/courses/${id}/${t.h}`;return(<Link key={t.h} href={href} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',path.endsWith(t.h)?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground')}>{t.l}</Link>);})}</div>{children}</div>);}
