export function displayRankName(member: { username?: string | null; user_no?: string | null }): string;
export function hoursHistogram(
  hoursList: number[] | null | undefined,
  buckets?: number,
): { counts: number[]; maxHours: number };
export function assembleRanking(opts: {
  today: string;
  screenings?: unknown[];
  films?: Array<{ id?: string; duration?: number | null }>;
  members?: Array<{ uid?: string; username?: string | null; user_no?: string | null }>;
  watchLogs?: Array<{ uid?: string; film_id?: string }>;
  viewerId?: string | null;
  topN?: number;
  buckets?: number;
}): {
  total: number;
  top: Array<{ rank: number; uid: string; name: string; hours: number; filmsCount: number }>;
  histogram: number[];
  histogramMaxHours: number;
  me: {
    rank: number | null;
    hours: number;
    filmsCount: number;
    percentile: string | null;
    beatRatio: number;
    bucketIndex: number;
  } | null;
};
