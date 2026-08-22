/** Screening archive & nomination voting shapes (mirror server JSON). */

export interface Screening {
  id: string;
  title: string;
  screen_date: string;
  venue: string | null;
  theme: string | null;
  film_ids: string[] | null;
  gallery: string[] | null;
  recap: string | null;
}

export interface NominationFilm {
  id: string;
  title: string;
  title_zh: string | null;
  title_en: string | null;
  year: string | null;
  category: string | null;
  image: string | null;
}

export interface NominationOption {
  id: number;
  round_id: string;
  film_id: string | null;
  nominator: string | null;
  note: string | null;
  votes_count: number;
  film: NominationFilm | null;
}

export type NominationStatus = 'collecting' | 'voting' | 'revealed';

export interface NominationRound {
  id: string;
  title: string;
  status: NominationStatus;
  deadline: string | null;
  created_at: string;
  options: NominationOption[];
}
