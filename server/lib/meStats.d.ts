export function minutesToHours(minutes: number): number;
export function firstScreenedByFilm(
  screenings: Array<{ screen_date?: string; film_ids?: string[] | null }> | null | undefined,
  today: string,
): Map<string, string>;
export function assembleMeStats(input: {
  today: string;
  screenings?: Array<{ screen_date?: string; film_ids?: string[] | null }>;
  films?: Array<{ id?: string; duration?: number | null }>;
  watchIds?: Array<string | null | undefined>;
  poolFilmIds?: Array<string | null | undefined>;
  weekVotes?: Array<{ count?: number | null }>;
}): {
  watchedMinutes: number;
  unwatchedMinutes: number;
  totalScreenedMinutes: number;
  watchedCount: number;
  unwatchedCount: number;
  totalScreenedCount: number;
  nominations: number;
  votes: number;
  monthly: Array<{ yearMonth: string; minutes: number; filmCount: number }>;
};

export function assembleMeActivity(input: {
  today: string;
  pool?: Array<Record<string, unknown>>;
  weekVotes?: Array<{ film_id?: string; count?: number; week_start?: string }>;
  films?: Array<{ id?: string; title?: string; title_zh?: string; title_en?: string; image?: string }>;
  screenings?: Array<{ screen_date?: string; film_ids?: string[] | null }>;
}): {
  nominations: Array<{
    id: unknown;
    filmId: string;
    filmTitle: string;
    image: string;
    note: string;
    planned: boolean;
    status: string;
    source: string;
    createdAt: string;
  }>;
  votes: Array<{
    filmId: string;
    filmTitle: string;
    image: string;
    count: number;
    weeks: number;
    planned: boolean;
    gate: string;
    lastWeek: string;
  }>;
};
