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
