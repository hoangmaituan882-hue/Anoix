/**
 * Film entries — the core catalog entity.
 * Evolves into the full `Film` model (type/runtime/genres) in the CloudBase stage;
 * field names stay stable so the migration is additive only.
 */
export interface WorkItem {
  id: string;
  title: string;
  titleZh?: string;
  titleEn?: string;
  year: string;
  /** 上映/放映日期（YYYY-MM-DD，可选）。 */
  releaseDate?: string;
  /** 电影时长（分钟，可选，TV 系列可能为空）。 */
  duration?: number;
  category: string;
  image: string;
  landscapeImage?: string;
  tagline?: string;
  description: string;
  descriptionZh?: string;
  descriptionEn?: string;
  director?: string;
  characterDesign?: string;
  seriesComposition?: string;
  cast?: string[];
  streamingPlatforms?: string[];
  officialUrl?: string;
  trailerUrl?: string;
  isNew?: boolean;
}
