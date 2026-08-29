import { getAccessToken } from './session';
import { WorkItem } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };
  const r = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });
  if (!r.ok) {
    let msg = `请求失败 (${r.status})`;
    try {
      const body = await r.json();
      if (body?.error) msg = body.error;
    } catch { /* keep */ }
    throw new Error(msg);
  }
  if (r.status === 204) return undefined as T;
  return r.json() as Promise<T>;
}

export function mapFilmCard(r: Record<string, unknown>): WorkItem {
  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    titleZh: (r.title_zh as string | null) ?? (r.titleZh as string | undefined) ?? undefined,
    titleEn: (r.title_en as string | null) ?? (r.titleEn as string | undefined) ?? undefined,
    year: String(r.year ?? ''),
    category: String(r.category ?? ''),
    image: String(r.image ?? ''),
    director: (r.director as string | null) ?? undefined,
    isNew: Boolean(r.isNew ?? r.is_new),
    description: String(r.description ?? r.description_zh ?? ''),
    descriptionZh: (r.description_zh as string | null) ?? undefined,
    descriptionEn: (r.description_en as string | null) ?? undefined,
    landscapeImage: (r.landscape_image as string | null) ?? undefined,
    tagline: (r.tagline as string | null) ?? undefined,
    characterDesign: (r.character_design as string | null) ?? undefined,
    seriesComposition: (r.series_composition as string | null) ?? undefined,
    cast: (r.cast_list as string[] | null) ?? undefined,
    streamingPlatforms: (r.streaming_platforms as string[] | null) ?? undefined,
    officialUrl: (r.official_url as string | null) ?? undefined,
    trailerUrl: (r.trailer_url as string | null) ?? undefined,
    releaseDate: r.release_date ? String(r.release_date) : undefined,
    duration: typeof r.duration === 'number' ? r.duration : undefined,
  };
}

export type FilmListPage = {
  items: WorkItem[];
  total: number;
  offset: number;
  limit: number;
};

export const catalog = {
  featured: async (): Promise<WorkItem[]> => {
    const rows = await api<Record<string, unknown>[]>('/api/films/featured');
    return (rows || []).map(mapFilmCard);
  },

  list: async (opts: {
    q?: string;
    category?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<FilmListPage> => {
    const params = new URLSearchParams();
    if (opts.q) params.set('q', opts.q);
    if (opts.category && opts.category !== 'all') params.set('category', opts.category);
    params.set('sort', opts.sort || 'screened_desc');
    params.set('limit', String(opts.limit ?? 24));
    params.set('offset', String(opts.offset ?? 0));
    const page = await api<FilmListPage>(`/api/films?${params.toString()}`);
    return {
      ...page,
      items: (page.items || []).map((row) => mapFilmCard(row as unknown as Record<string, unknown>)),
    };
  },

  get: async (id: string): Promise<WorkItem | null> => {
    const row = await api<Record<string, unknown> | null>(`/api/films/${encodeURIComponent(id)}`);
    return row ? mapFilmCard(row) : null;
  },
};
