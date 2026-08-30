/**
 * Shared scrape-search client: query TMDB + Bangumi through the server proxy
 * and normalize both into one shape (ScrapeResult).
 */
import { getAccessToken } from './session';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export type ScrapeSource = 'tmdb' | 'bangumi';

export interface ScrapeResult {
  source: ScrapeSource;
  id: string | number;
  mediaType?: 'movie' | 'tv';
  title: string;
  originalTitle: string;
  year: string;
  posterUrl: string | null;
  rating: number | null;
  overview: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function searchScrape(
  q: string,
  source: ScrapeSource,
  mediaType: 'movie' | 'tv' | 'multi' = 'multi',
): Promise<ScrapeResult[]> {
  if (source === 'tmdb') {
    const r = await fetch(`${API_BASE}/api/tmdb/search?q=${encodeURIComponent(q)}&media_type=${mediaType}`, {
      headers: await authHeaders(),
    });
    if (!r.ok) throw new Error(`TMDB 搜索失败 (${r.status})`);
    const d = await r.json();
    return (d.results ?? []).map((x: any) => ({
      source: 'tmdb' as const,
      id: x.tmdbId,
      mediaType: x.mediaType,
      title: x.title,
      originalTitle: x.originalTitle,
      year: x.year,
      posterUrl: x.posterUrl,
      rating: x.rating,
      overview: x.overview,
    }));
  }
  const r = await fetch(`${API_BASE}/api/bangumi/search?q=${encodeURIComponent(q)}`, {
    headers: await authHeaders(),
  });
  if (!r.ok) throw new Error(`Bangumi 搜索失败 (${r.status})`);
  const d = await r.json();
  return (d.results ?? []).map((x: any) => ({
    source: 'bangumi' as const,
    id: x.bgmId,
    title: x.title,
    originalTitle: x.originalTitle,
    year: x.year,
    posterUrl: x.posterUrl,
    rating: x.rating,
    overview: x.summary,
  }));
}

/** Detail for the pick step. Returns { title, year, posterUrl, rating, overview, director? }. */
export async function detailScrape(item: ScrapeResult): Promise<Record<string, unknown>> {
  if (item.source === 'tmdb') {
    const r = await fetch(`${API_BASE}/api/tmdb/detail/${item.id}?media_type=${item.mediaType}`, {
      headers: await authHeaders(),
    });
    if (!r.ok) throw new Error(`TMDB 详情失败 (${r.status})`);
    const d = await r.json();
    return { title: d.title, originalTitle: d.originalTitle, year: d.year, posterUrl: d.posterUrl, rating: d.rating, overview: d.overview, tagline: d.tagline, director: d.director };
  }
  const r = await fetch(`${API_BASE}/api/bangumi/detail/${item.id}`, {
    headers: await authHeaders(),
  });
  if (!r.ok) throw new Error(`Bangumi 详情失败 (${r.status})`);
  const d = await r.json();
  return { title: d.title, originalTitle: d.originalTitle, year: d.year, posterUrl: d.posterUrl, rating: d.rating, overview: d.summary };
}