export type Language = 'ja' | 'zh' | 'en';

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

export interface NewsItem {
  id: string;
  date: string;
  category?: 'Event' | 'Goods' | 'Info' | 'Media';
  title: string;
  titleZh?: string;
  titleEn?: string;
  content: string;
  contentZh?: string;
  contentEn?: string;
  image?: string;
  link?: string;
}

export interface GoodsItem {
  id: string;
  series: string;
  title: string;
  titleZh?: string;
  titleEn?: string;
  price: string;
  image: string;
  url: string;
  isPreorder?: boolean;
  description?: string;
}

export interface YoutubeItem {
  id: string;
  title: string;
  titleZh?: string;
  titleEn?: string;
  thumbnail: string;
  youtubeId: string;
  url: string;
  duration?: string;
  views?: string;
  date?: string;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  descJa: string;
  descZh: string;
  descEn: string;
  icon: string;
}
