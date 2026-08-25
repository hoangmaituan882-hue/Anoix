import { useSyncExternalStore } from 'react';
import {
  HERO_IMAGE,
  RECRUIT_IMAGE,
  WORKS_LIST,
  NEWS_LIST,
  YOUTUBE_LIST,
  SOCIAL_LINKS,
} from '../data/triggerData';
import { WorkItem, NewsItem, GoodsItem, YoutubeItem, SocialLink } from '../types';

/**
 * Single data entry point for every UI component.
 *
 * Reads start from the static seed (instant first paint), then
 * `repository.refresh()` pulls live rows from the anoix-api CloudRun service
 * and swaps the caches — subscribed components re-render via useRepo().
 * If the API is unreachable the static fallback keeps the site working.
 */

// ---------- CloudBase PG row shapes (snake_case) ----------
interface FilmRow {
  id: string;
  title: string;
  title_zh: string | null;
  title_en: string | null;
  year: string | null;
  category: string | null;
  image: string | null;
  landscape_image: string | null;
  tagline: string | null;
  description: string | null;
  description_zh: string | null;
  description_en: string | null;
  director: string | null;
  character_design: string | null;
  series_composition: string | null;
  cast_list: string[] | null;
  streaming_platforms: string[] | null;
  official_url: string | null;
  trailer_url: string | null;
  is_new: boolean | null;
  sort_order: number;
}

interface NewsRow {
  id: string;
  date: string | null;
  category: NewsItem['category'] | null;
  title: string;
  title_zh: string | null;
  title_en: string | null;
  content: string | null;
  content_zh: string | null;
  content_en: string | null;
  image: string | null;
  link: string | null;
  sort_order: number;
}

interface GoodsRow {
  id: string;
  series: string | null;
  title: string;
  title_zh: string | null;
  title_en: string | null;
  price: string | null;
  image: string | null;
  taobao_url: string | null;
  is_preorder: boolean | null;
  description: string | null;
  sort_order: number;
}

const mapFilm = (r: FilmRow): WorkItem => ({
  id: r.id,
  title: r.title,
  titleZh: r.title_zh ?? undefined,
  titleEn: r.title_en ?? undefined,
  year: r.year ?? '',
  category: r.category ?? '',
  image: r.image ?? '',
  landscapeImage: r.landscape_image ?? undefined,
  tagline: r.tagline ?? undefined,
  description: r.description ?? '',
  descriptionZh: r.description_zh ?? undefined,
  descriptionEn: r.description_en ?? undefined,
  director: r.director ?? undefined,
  characterDesign: r.character_design ?? undefined,
  seriesComposition: r.series_composition ?? undefined,
  cast: r.cast_list ?? undefined,
  streamingPlatforms: r.streaming_platforms ?? undefined,
  officialUrl: r.official_url ?? undefined,
  trailerUrl: r.trailer_url ?? undefined,
  isNew: r.is_new ?? false,
});

const mapNews = (r: NewsRow): NewsItem => ({
  id: r.id,
  date: r.date ?? '',
  category: r.category ?? undefined,
  title: r.title,
  titleZh: r.title_zh ?? undefined,
  titleEn: r.title_en ?? undefined,
  content: r.content ?? '',
  contentZh: r.content_zh ?? undefined,
  contentEn: r.content_en ?? undefined,
  image: r.image ?? undefined,
  link: r.link ?? undefined,
});

const mapGoods = (r: GoodsRow): GoodsItem => ({
  id: r.id,
  series: r.series ?? '',
  title: r.title,
  titleZh: r.title_zh ?? undefined,
  titleEn: r.title_en ?? undefined,
  price: r.price ?? '',
  image: r.image ?? '',
  url: r.taobao_url ?? '',
  isPreorder: r.is_preorder ?? false,
  description: r.description ?? undefined,
});

// ---------- Cache + subscription ----------
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribeRepo = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

let filmsCache: WorkItem[] = WORKS_LIST;
let newsCache: NewsItem[] = NEWS_LIST;
let goodsCache: GoodsItem[] = [];

export const repository = {
  /** Featured hero artwork for the landing section. */
  heroImage: (): string => HERO_IMAGE,

  /** Studio atmosphere image for the recruit/about section. */
  recruitImage: (): string => RECRUIT_IMAGE,

  /** Film catalog (seed first, replaced by live PG rows on refresh). */
  films: (): WorkItem[] => filmsCache,

  /** Announcements (seed first, replaced by live PG rows on refresh). */
  news: (): NewsItem[] => newsCache,

  /** Merchandise catalog (live PG rows; no static fallback). */
  goods: (): GoodsItem[] => goodsCache,

  /** Video feed entries (static seed). */
  videos: (): YoutubeItem[] => YOUTUBE_LIST,

  /** External social/profile links for the footer. */
  socialLinks: (): SocialLink[] => SOCIAL_LINKS,

  /** Pull live content from the anoix-api CloudRun service; keeps static data on failure. */
  async refresh(): Promise<void> {
    const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
    const timer = new AbortController();
    const timeout = setTimeout(() => timer.abort(), 8000);
    try {
      const [filmsRes, newsRes] = await Promise.all([
        fetch(`${base}/api/films`, { signal: timer.signal }),
        fetch(`${base}/api/news`, { signal: timer.signal }),
      ]);
      if (!filmsRes.ok || !newsRes.ok) throw new Error(`api status ${filmsRes.status}/${newsRes.status}`);

      const films = ((await filmsRes.json()) as FilmRow[]).map(mapFilm);
      const news = ((await newsRes.json()) as NewsRow[]).map(mapNews);
      if (films.length > 0) filmsCache = films;
      if (news.length > 0) newsCache = news;
      notify();
    } catch (err) {
      console.warn('[repository] cloud fetch failed, keeping static fallback:', err);
    }

    // Goods is fetched separately so a failure there never blocks films/news.
    try {
      const goodsRes = await fetch(`${base}/api/goods`, { signal: timer.signal });
      if (goodsRes.ok) goodsCache = ((await goodsRes.json()) as GoodsRow[]).map(mapGoods);
      notify();
    } catch (err) {
      console.warn('[repository] goods fetch failed:', err);
    } finally {
      clearTimeout(timeout);
    }
  },
};

/**
 * Subscribe a component to repository caches.
 * `useRepo(repository.films)` re-renders when refresh() swaps the cache.
 */
export function useRepo<T>(select: () => T): T {
  return useSyncExternalStore(subscribeRepo, select, select);
}
