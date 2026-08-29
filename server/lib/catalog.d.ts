export function shanghaiDateString(now?: number): string;
export function latestPastClubDate(dates: string[] | null | undefined, today: string): string | null;
export function filmVoteGate(dates: string[] | null | undefined, today: string): 'open' | 'frozen' | 'screened';
export function clubIndexByFilm(screenings: unknown[]): Map<string, { dates: string[]; order: Map<string, number> }>;
export const FILM_CARD_COLUMNS: string;
export function featuredIdsFromScreenings(screenings: unknown[], today: string): Array<{ id: string; past: string; nightOrder: number }>;
export function assembleFeatured<T extends { id: string }>(filmsById: Map<string, T> | Record<string, T>, ranked: Array<{ id: string; past: string; nightOrder?: number }>): Array<T & { isNew: boolean; screeningDate: string }>;
export function rankFeatured<T extends { id: string }>(films: T[], screenings: unknown[], today: string): Array<T & { isNew: boolean; screeningDate: string }>;
export function yearNum(str: string | null | undefined): number;
export function sortScreenedDesc<T extends { id: string; year?: string }>(films: T[], latestById: Record<string, string | null>): T[];
export function matchFilmQuery(film: Record<string, unknown>, q: string): boolean;
export function matchFilmCategory(film: Record<string, unknown>, category: string): boolean;
export function filmListPath(opts?: { q?: string; category?: string; sort?: string; select?: string }): string;
export function filmsByIdPath(ids: string[], select?: string): string | null;
export function parseContentRangeTotal(header: string | null | undefined): number | null;
export function rangeHeader(offset: number, limit: number): { Range: string };
export function stampIsNew<T extends { id: string }>(cards: T[], newIds: string[]): Array<T & { isNew: boolean }>;
export function paginate<T>(items: T[] | null | undefined, offset: number, limit: number): { items: T[]; total: number; offset: number; limit: number };
export function clampAddVotes(requested: number | null | undefined, remaining: number): { ok: true; count: number } | { ok: false; error: string };
export function placeFilmOnNight<T extends { screen_date?: string; film_ids?: string[] | null }>(screenings: T[], filmId: string, date: string, insertIndex?: number): T[];
export function moveFilmBetweenNights<T extends { screen_date?: string; film_ids?: string[] | null }>(screenings: T[], filmId: string, fromDate: string | null, toDate: string, insertIndex?: number): T[];
export function reorderNight<T extends { screen_date?: string; film_ids?: string[] | null }>(screenings: T[], date: string, orderedIds: string[]): T[];
export function filmScheduleFields(dates: string[] | null | undefined, today: string): { screening_date: string | null; screening_status: 'screened' | 'scheduled' | 'unscheduled' };
export type ScreeningRoundStatus = 'screened' | 'tonight' | 'upcoming' | 'unscheduled';
export function screeningRoundStatus(screenDate: string | null | undefined, today: string): ScreeningRoundStatus;
export function screeningAutoTitle(screenDate: string | null | undefined): string;
export function displayScreeningTitle(row: { title?: string | null; screen_date?: string | null }): string;
export function assembleUpcomingNights(opts?: {
  screenings?: Array<{
    id?: string;
    title?: string | null;
    screen_date?: string | null;
    film_ids?: string[] | null;
    venue?: string | null;
  }>;
  films?: Array<{
    id?: string;
    title?: string | null;
    title_zh?: string | null;
    title_en?: string | null;
    year?: string | null;
    category?: string | null;
    image?: string | null;
  }>;
  today: string;
}): {
  nights: Array<{
    id: string;
    screenDate: string;
    title: string;
    status: 'tonight' | 'upcoming';
    venue: string | null;
    films: Array<{
      id: string;
      title: string;
      titleZh: string | null;
      titleEn: string | null;
      year: string;
      category: string;
      image: string;
    }>;
  }>;
};
