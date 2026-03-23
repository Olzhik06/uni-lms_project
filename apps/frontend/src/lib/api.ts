export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

const LANGUAGE_STORAGE_KEY = 'unilms-lang';

function getLanguageHeader() {
  if (typeof window === 'undefined') return 'en';
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || document.documentElement.lang || 'en';
}

function withLanguageHeader(headers?: HeadersInit) {
  const next = new Headers(headers || {});
  if (!next.has('Accept-Language')) next.set('Accept-Language', getLanguageHeader());
  return next;
}

async function handle<T>(r: Response): Promise<T> {
  if (!r.ok) { const b = await r.json().catch(() => ({ message: `Error ${r.status}` })); throw new ApiError(r.status, b.message ?? `Error ${r.status}`); }
  const t = await r.text(); return t ? JSON.parse(t) : ({} as T);
}
export const api = {
  get: <T=any>(p: string) => fetch(`/api${p}`, { credentials:'include', headers: withLanguageHeader() }).then(r => handle<T>(r)),
  post: <T=any>(p: string, body?: unknown) => fetch(`/api${p}`, { method:'POST', headers: withLanguageHeader({ 'Content-Type':'application/json' }), credentials:'include', body: body ? JSON.stringify(body) : undefined }).then(r => handle<T>(r)),
  patch: <T=any>(p: string, body: unknown) => fetch(`/api${p}`, { method:'PATCH', headers: withLanguageHeader({ 'Content-Type':'application/json' }), credentials:'include', body: JSON.stringify(body) }).then(r => handle<T>(r)),
  delete: <T=any>(p: string) => fetch(`/api${p}`, { method:'DELETE', headers: withLanguageHeader(), credentials:'include' }).then(r => handle<T>(r)),
  postForm: <T=any>(p: string, body: FormData) => fetch(`/api${p}`, { method:'POST', headers: withLanguageHeader(), credentials:'include', body }).then(r => handle<T>(r)),
  uploadWithProgress: <T=any>(p: string, body: FormData, onProgress: (pct: number) => void): Promise<T> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api${p}`);
      const h = withLanguageHeader();
      h.forEach((v, k) => xhr.setRequestHeader(k, v));
      xhr.withCredentials = true;
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({} as T); }
        } else {
          try { const b = JSON.parse(xhr.responseText); reject(new ApiError(xhr.status, b.message ?? `Error ${xhr.status}`)); }
          catch { reject(new ApiError(xhr.status, `Error ${xhr.status}`)); }
        }
      };
      xhr.onerror = () => reject(new ApiError(0, 'Network error'));
      xhr.send(body);
    }),
};
