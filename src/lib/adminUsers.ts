import { AdminUser } from '../types/user';
import { getAccessToken } from './session';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...(init.headers || {}) },
  });
  if (!r.ok) {
    let msg = `请求失败 (${r.status})`;
    try {
      const body = await r.json();
      if (body?.error) msg = body.error;
    } catch { /* keep generic */ }
    throw new Error(msg);
  }
  return r.json() as Promise<T>;
}

export const adminUsers = {
  list: () =>
    request<{ total: number; users: AdminUser[] }>('/api/admin/users?limit=100&offset=0'),

  create: (username: string, password: string) =>
    request<{ ok: boolean; uid: string | null }>('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  update: (
    uid: string,
    patch: { role?: 'user' | 'admin'; disabled?: boolean; password?: string },
  ) =>
    request<{ ok: boolean }>(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),

  remove: (uid: string) =>
    request<{ ok: boolean }>(`/api/admin/users/${encodeURIComponent(uid)}`, { method: 'DELETE' }),
};
