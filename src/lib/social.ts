import { api } from './api/client';
import { SocialLink } from '../types';

export interface SocialLinksPayload {
  items: SocialLink[];
}

export interface SocialLinkRow {
  id: string;
  name: string;
  url: string;
  desc_zh: string | null;
  desc_en: string | null;
  desc_ja: string | null;
  sort_order: number;
}

export interface SocialLinkDraft {
  name: string;
  url: string;
  descZh: string;
  descEn: string;
  descJa: string;
}

function write<T>(method: string, path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const socialLinksApi = {
  list: () => api<SocialLinksPayload>('/api/social-links'),
};

export const adminSocial = {
  list: () => api<SocialLinkRow[]>('/api/admin/social-links'),
  create: (body: SocialLinkDraft) => write<{ ok: boolean; id: string }>('POST', '/api/admin/social-links', body),
  update: (id: string, body: SocialLinkDraft) =>
    write<{ ok: boolean }>('PATCH', `/api/admin/social-links/${encodeURIComponent(id)}`, body),
  remove: (id: string) => write<{ ok: boolean }>('DELETE', `/api/admin/social-links/${encodeURIComponent(id)}`),
  reorder: (ids: string[]) => write<{ ok: boolean }>('POST', '/api/admin/social-links/reorder', { ids }),
};
