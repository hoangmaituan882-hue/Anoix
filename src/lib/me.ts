import { AdminUser } from '../types/user';
import { api } from './api/client';

export interface ProfilePatch {
  nickname?: string;
  avatarUrl?: string;
}

export const me = {
  get: () => api<AdminUser>('/api/me'),

  update: (patch: ProfilePatch) =>
    api<{ ok: boolean }>('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ ok: boolean }>('/api/me/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
