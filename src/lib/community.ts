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

export interface WatchItem {
  id: number;
  film_id: string;
  uid: string;
  rating: number;
  review: string | null;
  watched_at: string;
  film_title?: string;
  image?: string;
  year?: string;
}

export interface YearReviewData {
  year: number;
  nominations: number;
  nominatedFilms: { title: string; image: string; planned: boolean; status: string }[];
  votes: number;
  rounds: number;
  watches: number;
  avgRating: number;
  watchedFilms: { title: string; image: string; rating: number }[];
  favorites: number;
  rsvps: number;
  persona: string;
}

export const community = {
  calendar: () => request<{ events: CalendarEvent[] }>('/api/calendar'),
  notifications: () => request<NotificationItem[]>('/api/notifications'),
  yearReview: (year?: number) =>
    request<YearReviewData>(`/api/me/year-review?year=${year ?? new Date().getFullYear()}`),
  watchList: () => request<WatchItem[]>('/api/watch'),
  saveWatch: (filmId: string, rating: number, review: string) =>
    request<{ ok: boolean }>(`/api/watch/${encodeURIComponent(filmId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review }),
    }),
  removeWatch: (filmId: string) =>
    request<{ ok: boolean }>(`/api/watch/${encodeURIComponent(filmId)}`, { method: 'DELETE' }),
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
  screening: (id: string) => request<ScreeningDetail>(`/api/screenings/${encodeURIComponent(id)}`),
  rsvp: (id: string) => request<{ rsvped: boolean; count: number }>(`/api/rsvp/${encodeURIComponent(id)}`),
  joinRsvp: (id: string) => request<{ ok: boolean }>(`/api/rsvp/${encodeURIComponent(id)}`, { method: 'POST' }),
  cancelRsvp: (id: string) => request<{ ok: boolean }>(`/api/rsvp/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

export interface ScreeningDetail {
  id: string;
  title: string;
  screen_date: string;
  venue: string | null;
  theme: string | null;
  film_ids: string[] | null;
  recap: string | null;
  films: { id: string; title: string; title_zh: string | null; title_en: string | null; year: string | null; category: string | null; image: string | null }[];
}
