import { api } from './api/client';

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
  calendar: () => api<{ events: CalendarEvent[] }>('/api/calendar'),
  notifications: () => api<NotificationItem[]>('/api/notifications'),
  yearReview: (year?: number) =>
    api<YearReviewData>(`/api/me/year-review?year=${year ?? new Date().getFullYear()}`),
  watchList: () => api<WatchItem[]>('/api/watch'),
  saveWatch: (filmId: string, rating: number, review: string) =>
    api<{ ok: boolean }>(`/api/watch/${encodeURIComponent(filmId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review }),
    }),
  removeWatch: (filmId: string) =>
    api<{ ok: boolean }>(`/api/watch/${encodeURIComponent(filmId)}`, { method: 'DELETE' }),
  markRead: (id?: number) =>
    api<{ ok: boolean }>('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id != null ? { id } : {}),
    }),
  favorites: () => api<FavoriteFilm[]>('/api/favorites'),
  addFavorite: (filmId: string) =>
    api<{ ok: boolean }>('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filmId }),
    }),
  removeFavorite: (filmId: string) =>
    api<{ ok: boolean }>(`/api/favorites/${encodeURIComponent(filmId)}`, { method: 'DELETE' }),
  screening: (id: string) => api<ScreeningDetail>(`/api/screenings/${encodeURIComponent(id)}`),
  rsvp: (id: string) => api<{ rsvped: boolean; count: number }>(`/api/rsvp/${encodeURIComponent(id)}`),
  joinRsvp: (id: string) => api<{ ok: boolean }>(`/api/rsvp/${encodeURIComponent(id)}`, { method: 'POST' }),
  cancelRsvp: (id: string) => api<{ ok: boolean }>(`/api/rsvp/${encodeURIComponent(id)}`, { method: 'DELETE' }),
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
