export function isHttpsUrl(raw: string | null | undefined): boolean;
export function inferSocialIcon(url: string, name?: string): string;
export function presentSocialLink(row: {
  id?: string;
  name?: string | null;
  url?: string | null;
  desc_zh?: string | null;
  desc_en?: string | null;
  desc_ja?: string | null;
}): {
  id: string;
  name: string;
  url: string;
  descZh: string;
  descEn: string;
  descJa: string;
  icon: string;
} | null;
export function assembleSocialLinks(rows: unknown[] | null | undefined): {
  items: Array<{
    id: string;
    name: string;
    url: string;
    descZh: string;
    descEn: string;
    descJa: string;
    icon: string;
  }>;
};
export function socialPayload(
  row: Record<string, unknown> | null | undefined,
  patch?: {
    name?: string;
    url?: string;
    descZh?: string;
    descEn?: string;
    descJa?: string;
    sortOrder?: number;
  },
): { ok: false; error: string } | { ok: true; body: Record<string, unknown> };
