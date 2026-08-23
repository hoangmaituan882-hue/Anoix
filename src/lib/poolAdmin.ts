import { getAccessToken } from './session';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getAccessToken();
  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) {
    throw new Error(`API ${r.status}: ${(await r.text()).slice(0, 160)}`);
  }
  return r.json() as Promise<T>;
}

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

export const poolAdmin = {
  list: () => api<PoolItem[]>('GET', '/api/admin/pool'),
  promote: (id: number) => api<{ ok: boolean; filmId: string }>('POST', `/api/admin/pool/${id}/promote`),
  demote: (id: number) => api<{ ok: boolean }>('POST', `/api/admin/pool/${id}/demote`),
  schedule: (filmId: string, screeningStatus: string, screeningDate: string | null) =>
    api<{ ok: boolean }>('POST', `/api/admin/films/${encodeURIComponent(filmId)}/schedule`, {
      screening_status: screeningStatus,
      screening_date: screeningDate,
    }),
  setRoundStatus: (roundId: string, status: string) =>
    api<{ ok: boolean }>('POST', `/api/admin/rounds/${encodeURIComponent(roundId)}/status`, { status }),
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
  get: () => api<StatsResponse>('GET', '/api/admin/stats'),
};
