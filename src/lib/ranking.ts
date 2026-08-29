import { api } from './api/client';

export interface RankingEntry {
  rank: number;
  uid: string;
  name: string;
  hours: number;
  filmsCount: number;
}

export interface RankingMe {
  rank: number | null;
  hours: number;
  filmsCount: number;
  percentile: string | null;
  beatRatio: number;
  bucketIndex: number;
}

export interface RankingPayload {
  total: number;
  top: RankingEntry[];
  histogram: number[];
  histogramMaxHours: number;
  me: RankingMe | null;
}

export const EMPTY_RANKING: RankingPayload = {
  total: 0,
  top: [],
  histogram: Array.from({ length: 26 }, () => 0),
  histogramMaxHours: 0,
  me: null,
};

let inflight: Promise<RankingPayload> | null = null;

export function fetchRanking(): Promise<RankingPayload> {
  if (inflight) return inflight;
  inflight = api<RankingPayload>('/api/ranking').finally(() => {
    inflight = null;
  });
  return inflight;
}

export function authRedirectPath(): string {
  return `/auth?redirect=${encodeURIComponent(
    `${window.location.pathname}${window.location.search}`,
  )}`;
}
