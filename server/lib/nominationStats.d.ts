export function filmAttributionKey(row: {
  film_id?: string | null;
  tmdb_id?: string | null;
  title?: string | null;
}): string;

export function assembleNominationStats(opts?: {
  pool?: Array<{
    film_id?: string | null;
    tmdb_id?: string | null;
    title?: string | null;
    image?: string | null;
    year?: string | null;
    nominee_identity_id?: string | null;
  }>;
  weekVotes?: Array<{ identity_id?: string | null; film_id?: string | null; count?: number | null }>;
  members?: Array<{ uid?: string; username?: string | null; user_no?: string | null }>;
}): {
  films: Array<{
    filmId: string;
    title: string;
    image: string;
    year: string;
    anonymousNominations: number;
    anonymousVotes: number;
    members: Array<{ uid: string; name: string; nominations: number; votes: number }>;
  }>;
  totals: {
    films: number;
    anonymousNominations: number;
    anonymousVotes: number;
    memberNominations: number;
    memberVotes: number;
  };
};
