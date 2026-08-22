import { auth } from './cloudbase';
import { WorkItem, NewsItem } from '../types';

/**
 * Admin PG REST client — drives CloudBase PG directly with the signed-in
 * admin session token. RLS policies (films_admin_write etc.) are the real
 * permission boundary; anonymous visitors simply have no token.
 */
const PG_BASE = `https://${import.meta.env.VITE_CLOUDBASE_ENV_ID as string}.api.tcloudbasegateway.com/v1/rdb/rest/v1`;

interface AdminSession {
  access_token?: string;
  user?: { is_anonymous?: boolean };
}

async function requireToken(): Promise<string> {
  const { data, error } = await auth.getSession();
  const session = (data?.session ?? null) as AdminSession | null;
  if (error || !session?.access_token || session.user?.is_anonymous) {
    throw new Error('未登录或会话已过期');
  }
  return session.access_token;
}

async function pg<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  const token = await requireToken();
  const r = await fetch(`${PG_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) {
    throw new Error(`PG ${r.status}: ${(await r.text()).slice(0, 150)}`);
  }
  return r.status === 204 ? null : ((await r.json()) as T);
}

// ---------- row shapes (snake_case, mirrors the DB schema) ----------
export interface FilmRow {
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

export interface NewsRow {
  id: string;
  date: string | null;
  category: string | null;
  title: string;
  title_zh: string | null;
  content: string | null;
  content_zh: string | null;
  sort_order: number;
}

// ---------- films ----------
export const adminFilms = {
  list: () => pg<FilmRow[]>('GET', '/films?select=*&order=sort_order.asc'),
  create: (row: Partial<FilmRow>) => pg<FilmRow[]>('POST', '/films', row),
  update: (id: string, row: Partial<FilmRow>) =>
    pg<FilmRow[]>('PATCH', `/films?id=eq.${encodeURIComponent(id)}`, row),
  remove: (id: string) => pg<null>('DELETE', `/films?id=eq.${encodeURIComponent(id)}`),
};

// ---------- news ----------
export const adminNews = {
  list: () => pg<NewsRow[]>('GET', '/news?select=*&order=sort_order.asc'),
  create: (row: Partial<NewsRow>) => pg<NewsRow[]>('POST', '/news', row),
  remove: (id: string) => pg<null>('DELETE', `/news?id=eq.${encodeURIComponent(id)}`),
};

// ---------- camelCase ⇄ snake_case mappers (for the edit form) ----------
const str = (v: string | undefined | null): string | null =>
  v === undefined || v === null || v === '' ? null : v;

export function filmToRow(w: WorkItem): Partial<FilmRow> {
  return {
    id: w.id,
    title: w.title,
    title_zh: str(w.titleZh),
    title_en: str(w.titleEn),
    year: str(w.year),
    category: str(w.category),
    image: str(w.image),
    landscape_image: str(w.landscapeImage),
    tagline: str(w.tagline),
    description: str(w.description),
    description_zh: str(w.descriptionZh),
    description_en: str(w.descriptionEn),
    director: str(w.director),
    character_design: str(w.characterDesign),
    series_composition: str(w.seriesComposition),
    cast_list: w.cast && w.cast.length ? w.cast : null,
    streaming_platforms: w.streamingPlatforms && w.streamingPlatforms.length ? w.streamingPlatforms : null,
    official_url: str(w.officialUrl),
    trailer_url: str(w.trailerUrl),
    is_new: w.isNew ?? false,
    sort_order: 0,
  };
}

export function rowToFilm(r: FilmRow): WorkItem {
  return {
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
  };
}
