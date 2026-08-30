/**
 * Film entries — the core catalog entity.
 * List/search/carousel use FilmCard; GET /api/films/:id returns WorkItem.
 */
export interface FilmCard {
  id: string;
  title: string;
  titleZh?: string;
  titleEn?: string;
  year: string;
  category: string;
  image: string;
  landscapeImage?: string;
  director?: string;
  isNew?: boolean;
}

export interface WorkItem extends FilmCard {
  /** 上映/放映日期（YYYY-MM-DD，可选）。 */
  releaseDate?: string;
  /** 电影时长（分钟，可选，TV 系列可能为空）。 */
  duration?: number;
  /** 放映会日期（俱乐部放映时间，YYYY-MM-DD，可选）。 */
  screeningDate?: string;
  tagline?: string;
  description: string;
  descriptionZh?: string;
  descriptionEn?: string;
  characterDesign?: string;
  seriesComposition?: string;
  cast?: string[];
  streamingPlatforms?: string[];
  officialUrl?: string;
  trailerUrl?: string;
}
