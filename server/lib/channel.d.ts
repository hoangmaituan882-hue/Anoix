export function parseVideoUrl(raw: string | null | undefined):
  | { ok: false; error: string }
  | { ok: true; platform: 'youtube' | 'bilibili' | 'other'; videoKey: string | null; canonicalUrl: string; short: boolean };
export function youtubeThumbnail(id: string | null | undefined): string;
export function formatDuration(seconds: number | null | undefined): string;
export function presentChannelItem(row: Record<string, unknown>): {
  id: string;
  title: string;
  titleZh: string | null;
  thumbnail: string;
  url: string;
  platform: string;
  duration: string;
};
export function assembleChannel(
  settingsRow: { hub_url?: string | null } | null | undefined,
  videos: Array<Record<string, unknown>> | null | undefined,
): { hubUrl: string; items: ReturnType<typeof presentChannelItem>[] };
export function resolveVideoMeta(
  raw: string,
  fetchImpl?: typeof fetch,
): Promise<
  | { ok: false; error: string }
  | {
      ok: true;
      platform: 'youtube' | 'bilibili' | 'other';
      videoKey: string | null;
      canonicalUrl: string;
      short: boolean;
      title: string;
      thumbnail: string;
      duration: string;
    }
>;
