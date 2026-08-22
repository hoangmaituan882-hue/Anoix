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
