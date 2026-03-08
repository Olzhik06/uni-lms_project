'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
export interface Toast { id:string; title:string; description?:string; variant?:'default'|'destructive'; }
const bus = typeof window!=='undefined' ? ((window as any).__TB ??= new EventTarget()) : null;
export function toast(t: Omit<Toast,'id'>) { bus?.dispatchEvent(new CustomEvent('t',{detail:{...t,id:String(Date.now()+Math.random())}})); }
export function useToast() {
  const [toasts,set]=useState<Toast[]>([]); const tm=useRef<Map<string,any>>(new Map());
  const dismiss=useCallback((id:string)=>{set(p=>p.filter(x=>x.id!==id));clearTimeout(tm.current.get(id));tm.current.delete(id);},[]);
  useEffect(()=>{ if(!bus)return; const h=(e:Event)=>{const t=(e as CustomEvent<Toast>).detail;set(p=>[...p,t]);tm.current.set(t.id,setTimeout(()=>dismiss(t.id),4000));}; bus.addEventListener('t',h); return()=>bus.removeEventListener('t',h); },[dismiss]);
  return{toasts,dismiss};
}
