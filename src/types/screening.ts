/** Screening archive & nomination voting shapes (mirror server JSON). */

export interface Screening {
  id: string;
  title: string;
  title_zh?: string | null;
  title_en?: string | null;
  screen_date: string;
  time?: string | null;
  venue: string | null;
  city?: string | null;
  country?: string | null;
  theme: string | null;
  film_ids: string[] | null;
  poster_url?: string | null;
  demo_poster_url?: string | null;
  landscape_poster_url?: string | null;
  gallery: string[] | null;
  recap: string | null;
  recap_zh?: string | null;
  format_tags?: string[] | null;
  special_guests?: string[] | null;
  ticket_perks?: string | null;
  status?: 'upcoming' | 'completed' | 'sold_out';
  ticket_price?: string | null;
  ticket_link?: string | null;
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
