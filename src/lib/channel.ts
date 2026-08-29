import { api } from './api/client';

export interface ChannelClip {
  id: string;
  title: string;
  titleZh: string | null;
  thumbnail: string;
  url: string;
  platform: string;
  duration: string;
}

export interface ChannelPayload {
  hubUrl: string;
  items: ChannelClip[];
}

export interface ChannelResolve {
  ok: true;
  platform: 'youtube' | 'bilibili' | 'other';
  videoKey: string | null;
  canonicalUrl: string;
  short: boolean;
  title: string;
  thumbnail: string;
  duration: string;
}

export function fetchChannel(): Promise<ChannelPayload> {
  return api<ChannelPayload>('/api/channel');
}

export function resolveChannelUrl(url: string): Promise<ChannelResolve> {
  return api<ChannelResolve>('/api/admin/channel/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
}
