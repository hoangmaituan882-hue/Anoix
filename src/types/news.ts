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
