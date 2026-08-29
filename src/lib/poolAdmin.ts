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
  setRoundStatus: (roundId: string, status: string) =>
    write<{ ok: boolean }>('POST', `/api/admin/rounds/${encodeURIComponent(roundId)}/status`, { status }),
};

export interface StatsNomination {
  id: number;
  title: string;
  note: string | null;
  source: string;
  status: string;
  nominee: string;
  created_at: string;
}
export interface StatsVote {
  round_id: string;
  round_title: string;
  film_id: string | null;
  film_title: string;
  voter: string;
  voted_at: string;
}
export interface StatsResponse {
  nominations: StatsNomination[];
  votes: StatsVote[];
}

export const statsAdmin = {
  get: () => api<StatsResponse>('/api/admin/stats'),
};
