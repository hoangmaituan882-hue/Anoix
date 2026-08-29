import { api } from './api/client';

export interface PoolItem {
  id: number;
  film_id: string | null;
  tmdb_id: string | null;
  title: string;
  original_title: string | null;
  year: string | null;
  image: string | null;
  overview: string | null;
  director: string | null;
  note: string | null;
  nominee_identity_id: string | null;
  source: string;
  status: string;
  planned: boolean;
  created_at: string;
}

function write<T>(method: string, path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const poolAdmin = {
  list: () => api<PoolItem[]>('/api/admin/pool'),
  promote: (id: number) => write<{ ok: boolean; filmId: string }>('POST', `/api/admin/pool/${id}/promote`),
  demote: (id: number) => write<{ ok: boolean }>('POST', `/api/admin/pool/${id}/demote`),
  schedule: (filmId: string, screeningStatus: string, screeningDate: string | null) =>
    write<{ ok: boolean }>('POST', `/api/admin/films/${encodeURIComponent(filmId)}/schedule`, {
      screening_status: screeningStatus,
      screening_date: screeningDate,
    }),
};

export interface StatsMember {
  uid: string;
  name: string;
  nominations: number;
  votes: number;
}
export interface StatsFilm {
  filmId: string;
  title: string;
  image: string;
  year: string;
  anonymousNominations: number;
  anonymousVotes: number;
  members: StatsMember[];
}
export interface StatsResponse {
  films: StatsFilm[];
  totals: {
    films: number;
    anonymousNominations: number;
    anonymousVotes: number;
    memberNominations: number;
    memberVotes: number;
  };
}

export const statsAdmin = {
  get: () => api<StatsResponse>('/api/admin/stats'),
};
