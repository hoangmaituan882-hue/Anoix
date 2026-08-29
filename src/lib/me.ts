import { AdminUser } from '../types/user';
import { api } from './api/client';

export interface ProfilePatch {
  nickname?: string;
  avatarUrl?: string;
}

export interface MonthlyScreened {
  yearMonth: string;
  minutes: number;
  filmCount: number;
}

export interface MeStats {
  watchedMinutes: number;
  unwatchedMinutes: number;
  totalScreenedMinutes: number;
  watchedHours: number;
  unwatchedHours: number;
  totalScreenedHours: number;
  watchedCount: number;
  unwatchedCount: number;
  totalScreenedCount: number;
  nominations: number;
  votes: number;
  monthly: MonthlyScreened[];
}

export function hoursFromMinutes(minutes: number) {
  return Math.round((Number(minutes) || 0) / 6) / 10;
}

export const EMPTY_ME_STATS: MeStats = {
  watchedMinutes: 0,
  unwatchedMinutes: 0,
  totalScreenedMinutes: 0,
  watchedHours: 0,
  unwatchedHours: 0,
  totalScreenedHours: 0,
  watchedCount: 0,
  unwatchedCount: 0,
  totalScreenedCount: 0,
  nominations: 0,
  votes: 0,
  monthly: [],
};

export const me = {
  get: () => api<AdminUser>('/api/me'),

  stats: () => api<MeStats>('/api/me/stats'),

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
