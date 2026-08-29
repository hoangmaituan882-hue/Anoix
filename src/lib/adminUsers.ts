import { AdminUser } from '../types/user';
import { api } from './api/client';

export const adminUsers = {
  list: () =>
    api<{ total: number; users: AdminUser[] }>('/api/admin/users?limit=100&offset=0'),

  create: (username: string, password: string) =>
    api<{ ok: boolean; uid: string | null }>('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  update: (
    uid: string,
    patch: { role?: 'user' | 'admin'; disabled?: boolean; password?: string },
  ) =>
    api<{ ok: boolean }>(`/api/admin/users/${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),

  remove: (uid: string) =>
    api<{ ok: boolean }>(`/api/admin/users/${encodeURIComponent(uid)}`, { method: 'DELETE' }),
};
