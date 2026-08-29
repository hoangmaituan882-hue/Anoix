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
 * Site chrome data: news, goods, static hero/social seeds.
 * Film catalog is `src/lib/catalog.ts` (featured / list / get) — boot does not
 * download every film row.
 */

// ---------- CloudBase PG row shapes (snake_case) ----------
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

  /** Seed catalog only (homepage / library use catalog.*). */
  films: (): WorkItem[] => filmsCache,

  /** Announcements (seed first, replaced by live PG rows on refresh). */
  news: (): NewsItem[] => newsCache,

  /** Merchandise catalog (live PG rows; no static fallback). */
  goods: (): GoodsItem[] => goodsCache,

  /** Video feed entries (static seed). */
  videos: (): YoutubeItem[] => YOUTUBE_LIST,

  /** External social/profile links for the footer. */
  socialLinks: (): SocialLink[] => SOCIAL_LINKS,

  /** Pull live news + goods. Films are not part of boot — use catalog.*. */
  async refresh(): Promise<void> {
    const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
    const timer = new AbortController();
    const timeout = setTimeout(() => timer.abort(), 8000);
    try {
      const newsRes = await fetch(`${base}/api/news`, { signal: timer.signal, credentials: 'include' });
      if (!newsRes.ok) throw new Error(`api status ${newsRes.status}`);
      const news = ((await newsRes.json()) as NewsRow[]).map(mapNews);
      if (news.length > 0) newsCache = news;
      notify();
    } catch (err) {
      console.warn('[repository] cloud fetch failed, keeping static fallback:', err);
    }

    // Goods is fetched separately so a failure there never blocks news.
    try {
      const goodsRes = await fetch(`${base}/api/goods`, { signal: timer.signal, credentials: 'include' });
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
 * `useRepo(select)` re-renders when refresh() swaps news/goods caches.
 */
export function useRepo<T>(select: () => T): T {
  return useSyncExternalStore(subscribeRepo, select, select);
}
