import { getAccessToken } from '../session';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export function apiBase(): string {
  return API_BASE;
}

/** Single /api fetch helper: Bearer token, credentials cookie, JSON error body. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };
  const r = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });
  if (!r.ok) {
    let msg = `请求失败 (${r.status})`;
    try {
      const body = await r.json();
      if (body?.error) msg = body.error;
    } catch { /* keep */ }
    throw new Error(msg);
  }
  if (r.status === 204) return undefined as T;
  return r.json() as Promise<T>;
}
