export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
async function handle<T>(r: Response): Promise<T> {
  if (!r.ok) { const b = await r.json().catch(() => ({ message: `Error ${r.status}` })); throw new ApiError(r.status, b.message ?? `Error ${r.status}`); }
  const t = await r.text(); return t ? JSON.parse(t) : ({} as T);
}
export const api = {
  get: <T=any>(p: string) => fetch(`/api${p}`, { credentials: 'include' }).then(r => handle<T>(r)),
  post: <T=any>(p: string, body?: unknown) => fetch(`/api${p}`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: body ? JSON.stringify(body) : undefined }).then(r => handle<T>(r)),
  patch: <T=any>(p: string, body: unknown) => fetch(`/api${p}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(body) }).then(r => handle<T>(r)),
  delete: <T=any>(p: string) => fetch(`/api${p}`, { method:'DELETE', credentials:'include' }).then(r => handle<T>(r)),
};
