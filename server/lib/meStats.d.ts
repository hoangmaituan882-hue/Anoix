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
