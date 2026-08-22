import {
  HERO_IMAGE,
  RECRUIT_IMAGE,
  WORKS_LIST,
  NEWS_LIST,
  GOODS_LIST,
  YOUTUBE_LIST,
  SOCIAL_LINKS,
} from '../data/triggerData';
import { WorkItem, NewsItem, GoodsItem, YoutubeItem, SocialLink } from '../types';

/**
 * Single data entry point for every UI component.
 *
 * Components must never import seed data files directly — they read through
 * this repository so the backend can be swapped (static seed → CloudBase)
 * without touching component code. Method signatures intentionally mirror
 * the shapes the CloudBase implementation will expose in stage 3.
 */
export const repository = {
  /** Featured hero artwork for the landing section. */
  heroImage: (): string => HERO_IMAGE,

  /** Studio atmosphere image for the recruit/about section. */
  recruitImage: (): string => RECRUIT_IMAGE,

  /** Full film catalog, newest first. */
  films: (): WorkItem[] => WORKS_LIST,

  /** Announcements, newest first. */
  news: (): NewsItem[] => NEWS_LIST,

  /** Merchandise catalog. */
  goods: (): GoodsItem[] => GOODS_LIST,

  /** Video feed entries. */
  videos: (): YoutubeItem[] => YOUTUBE_LIST,

  /** External social/profile links for the footer. */
  socialLinks: (): SocialLink[] => SOCIAL_LINKS,
};
