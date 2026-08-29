import { api } from './api/client';

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
  filmId: string;
  filmTitle: string;
  image: string;
  note: string;
  planned: boolean;
  status: string;
  source: string;
  createdAt: string;
}

export interface VoteActivity {
  filmId: string;
  filmTitle: string;
  image: string;
  count: number;
  weeks: number;
  planned: boolean;
  gate: 'open' | 'frozen' | 'screened';
  lastWeek: string;
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
  quota: () => api<Quota>('/api/quota'),

  nominate: (payload: { filmId?: string; tmdb?: TmdbNominationPayload; note: string }) =>
    api<{ ok: boolean }>(`/api/nominations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  plaza: (scope: 'week' | 'all' = 'week') =>
    api<{ items: PlazaItem[] }>(`/api/nominations/plaza?scope=${scope}`),

  myVotes: () =>
    api<{ items: { filmId: string; count: number }[] }>('/api/vote/mine'),

  vote: (filmId: string, count?: number) =>
    api<{ ok: boolean; count: number }>('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(count != null ? { filmId, count } : { filmId }),
    }),

  unvote: (filmId: string) =>
    api<{ ok: boolean; count: number }>('/api/vote', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filmId }),
    }),

  activity: () =>
    api<{ nominations: NominationActivity[]; votes: VoteActivity[] }>('/api/me/activity'),
};
