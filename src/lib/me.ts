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

export interface ProfilePatch {
  nickname?: string;
  avatarUrl?: string;
}

export const me = {
  get: () => request<AdminUser>('/api/me'),

  update: (patch: ProfilePatch) =>
    request<{ ok: boolean }>('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/api/me/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
