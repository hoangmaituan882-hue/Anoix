import { auth, CLOUDBASE_ENV_ID } from './cloudbase';
import { WorkItem, NewsItem } from '../types';

/**
 * Admin PG REST client — drives CloudBase PG directly with the signed-in
 * admin session token. RLS policies (films_admin_write etc.) are the real
 * permission boundary; anonymous visitors simply have no token.
 */
const PG_BASE = `https://${CLOUDBASE_ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest/v1`;

interface AdminSession {
  access_token?: string;
  user?: { is_anonymous?: boolean };
}

async function requireToken(): Promise<string> {
  // CloudBase session is the only accepted identity source. There is no
  // local "temporary admin" fallback: a fake token would never pass RLS.
  if (auth) {
    try {
      const { data, error } = await auth.getSession();
      const session = (data?.session ?? null) as AdminSession | null;
      if (!error && session?.access_token && !session.user?.is_anonymous) {
        return session.access_token;
      }
    } catch {
      // ignore
    }
  }

  throw new Error('未登录或会话已过期');
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
  release_date: string | null;
  duration: number | null;
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
  screening_date?: string | null;
  screening_status?: string | null;
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
  image: string | null;
  sort_order: number;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  published_at: string | null;
  pinned: boolean;
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
  update: (id: string, row: Partial<NewsRow>) => pg<NewsRow[]>('PATCH', `/news?id=eq.${encodeURIComponent(id)}`, row),
  remove: (id: string) => pg<null>('DELETE', `/news?id=eq.${encodeURIComponent(id)}`),
};

// ---------- screenings ----------
export interface ScreeningRow {
  id: string;
  title: string;
  screen_date: string;
  venue: string | null;
  theme: string | null;
  film_ids: string[] | null;
  recap: string | null;
}

export const adminScreenings = {
  list: () => pg<ScreeningRow[]>('GET', '/screenings?select=*&order=screen_date.desc'),
  create: (row: Partial<ScreeningRow>) => pg<ScreeningRow[]>('POST', '/screenings', row),
  update: (id: string, row: Partial<ScreeningRow>) =>
    pg<ScreeningRow[]>('PATCH', `/screenings?id=eq.${encodeURIComponent(id)}`, row),
  remove: (id: string) => pg<null>('DELETE', `/screenings?id=eq.${encodeURIComponent(id)}`),
};

// ---------- goods (merchandise) ----------
export interface GoodsRow {
  id: string;
  series: string | null;
  title: string;
  title_zh: string | null;
  title_en: string | null;
  price: string | null;
  image: string | null;
  taobao_url: string | null;
  is_preorder: boolean;
  description: string | null;
  sort_order: number;
}

export const adminGoods = {
  list: () => pg<GoodsRow[]>('GET', '/goods?select=*&order=sort_order.asc'),
  create: (row: Partial<GoodsRow>) => pg<GoodsRow[]>('POST', '/goods', row),
  update: (id: string, row: Partial<GoodsRow>) =>
    pg<GoodsRow[]>('PATCH', `/goods?id=eq.${encodeURIComponent(id)}`, row),
  remove: (id: string) => pg<null>('DELETE', `/goods?id=eq.${encodeURIComponent(id)}`),
};

// ---------- nomination rounds ----------
export interface RoundRow {
  id: string;
  title: string;
  status: 'collecting' | 'voting' | 'revealed';
  deadline: string | null;
  created_at: string;
}

export interface OptionRow {
  id: number;
  round_id: string;
  film_id: string | null;
  nominator: string | null;
  note: string | null;
}

export const adminRounds = {
  list: () => pg<RoundRow[]>('GET', '/nomination_rounds?select=*&order=created_at.desc'),
  create: (row: Partial<RoundRow>) => pg<RoundRow[]>('POST', '/nomination_rounds', row),
  update: (id: string, row: Partial<RoundRow>) =>
    pg<RoundRow[]>('PATCH', `/nomination_rounds?id=eq.${encodeURIComponent(id)}`, row),
  remove: (id: string) => pg<null>('DELETE', `/nomination_rounds?id=eq.${encodeURIComponent(id)}`),
  listOptions: () => pg<OptionRow[]>('GET', '/nomination_options?select=*&order=id.asc'),
  addOption: (row: Partial<OptionRow>) => pg<OptionRow[]>('POST', '/nomination_options', row),
  removeOption: (id: number) => pg<null>('DELETE', `/nomination_options?id=eq.${id}`),
};

// ---------- admin role ----------
export interface UserRoleRow {
  uid: string;
  username: string | null;
  role: string;
}

export const adminAuth = {
  /**
   * True when the CURRENT session's uid has role 'admin' in user_roles.
   * The user_roles self-read RLS policy returns only the caller's own row,
   * so the uid is resolved server-side and never trusted from the client.
   */
  checkAdmin: async (): Promise<boolean> => {
    const rows = await pg<UserRoleRow[]>('GET', '/user_roles?select=uid,role&limit=1');
    return rows?.[0]?.role === 'admin';
  },
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
    release_date: str(w.releaseDate),
    duration: w.duration ?? null,
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
    releaseDate: r.release_date ?? undefined,
    duration: r.duration ?? undefined,
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
