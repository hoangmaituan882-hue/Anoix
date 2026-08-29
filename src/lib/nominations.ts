import { getAccessToken } from './session';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
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

export interface Quota {
  kind: 'user' | 'anon';
  nominationsUsed: number;
  votesUsed: number;
  nominationsLimit: number;
  votesLimit: number;
  remainingNominations: number;
  remainingVotes: number;
}

export interface PlazaItem {
  filmId: string;
  title: string;
  image: string;
  year: string;
  category: string;
  nominations: number;
  votes: number;
  planned: boolean;
}

export interface NominationActivity {
  id: number;
  roundId: string;
  roundTitle: string;
  roundStatus: string;
  filmId: string;
  filmTitle: string;
  image: string;
  note: string;
  planned: boolean;
  source: string;
  createdAt: string;
}

export interface VoteActivity {
  roundId: string;
  roundTitle: string;
  roundStatus: string;
  filmId: string | null;
  filmTitle: string;
  image: string;
  planned: boolean;
  votedAt: string;
}

export interface TmdbNominationPayload {
  tmdbId: number;
  title: string;
  originalTitle: string;
  year: string;
  overview: string;
  posterUrl: string | null;
  director?: string;
}

export const nominations = {
  quota: () => request<Quota>('/api/quota'),

  nominate: (payload: { filmId?: string; tmdb?: TmdbNominationPayload; note: string }) =>
    request<{ ok: boolean }>(`/api/nominations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  plaza: (scope: 'week' | 'all' = 'week') =>
    request<{ items: PlazaItem[] }>(`/api/nominations/plaza?scope=${scope}`),

  myVotes: () =>
    request<{ items: { filmId: string; count: number }[] }>('/api/vote/mine'),

  vote: (filmId: string, count?: number) =>
    request<{ ok: boolean; count: number }>('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(count != null ? { filmId, count } : { filmId }),
    }),

  unvote: (filmId: string) =>
    request<{ ok: boolean; count: number }>('/api/vote', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filmId }),
    }),

  activity: () =>
    request<{ nominations: NominationActivity[]; votes: VoteActivity[] }>('/api/me/activity'),
};
