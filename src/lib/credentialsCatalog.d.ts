export function uniqueFilmIds(watches: Array<{ film_id?: string } | null | undefined>): string[];

export interface CoverflowSlide {
  id: string;
  filmId: string;
  title: string;
  author: string;
  image: string;
  videoUrl?: string;
  isWatched: boolean;
}

export function buildCoverflowSlides(opts?: {
  watches?: Array<{
    id?: number | string;
    film_id?: string;
    rating?: number;
    film_title?: string;
    image?: string;
  }>;
  films?: Array<{
    id: string;
    title?: string;
    titleZh?: string;
    titleEn?: string;
    image?: string;
    landscapeImage?: string;
    trailerUrl?: string;
    director?: string;
    year?: string;
  }>;
  library?: Array<{
    id: string;
    title?: string;
    titleZh?: string;
    titleEn?: string;
    image?: string;
    landscapeImage?: string;
    trailerUrl?: string;
    director?: string;
    year?: string;
  }>;
  lang?: string;
  limit?: number;
}): CoverflowSlide[];
