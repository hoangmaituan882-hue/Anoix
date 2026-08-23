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
    try { const b = await r.json(); if (b?.error) msg = b.error; } catch { /* keep */ }
    throw new Error(msg);
  }
  return r.json() as Promise<T>;
}

export interface NotificationItem {
  id: number;
  uid: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export interface FavoriteFilm {
  id: string;
  title: string;
  title_zh: string | null;
  title_en: string | null;
  year: string | null;
  category: string | null;
  image: string | null;
}

export interface CalendarEvent {
  date: string;
  type: 'screening' | 'film';
  id: string;
  title: string;
  venue: string;
  theme: string;
  image?: string;
  year?: string;
  films: { id: string; title: string; image: string; year: string }[];
}

export const community = {
  calendar: () => request<{ events: CalendarEvent[] }>('/api/calendar'),
  notifications: () => request<NotificationItem[]>('/api/notifications'),
  markRead: (id?: number) =>
    request<{ ok: boolean }>('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id != null ? { id } : {}),
    }),
  favorites: () => request<FavoriteFilm[]>('/api/favorites'),
  addFavorite: (filmId: string) =>
    request<{ ok: boolean }>('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filmId }),
    }),
  removeFavorite: (filmId: string) =>
    request<{ ok: boolean }>(`/api/favorites/${encodeURIComponent(filmId)}`, { method: 'DELETE' }),
};
