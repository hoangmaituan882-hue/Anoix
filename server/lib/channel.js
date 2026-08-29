/**
 * Homepage official-channel helpers (no I/O).
 * Parse Bilibili / YouTube / other URLs; present PG rows for the public API.
 */

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const BV_ID = /^BV[0-9A-Za-z]+$/;

export function parseVideoUrl(raw) {
  const input = String(raw || '').trim();
  if (!input) return { ok: false, error: 'empty' };
  let href;
  try {
    href = new URL(input.includes('://') ? input : `https://${input}`);
  } catch {
    return { ok: false, error: 'bad_url' };
  }
  if (!/^https?:$/.test(href.protocol)) return { ok: false, error: 'bad_url' };

  const host = href.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be') {
    const id = (href.pathname.split('/').filter(Boolean)[0] || '').slice(0, 11);
    if (YT_ID.test(id)) return ytResult(id);
  }
  if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
    const shorts = href.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})/);
    if (shorts && YT_ID.test(shorts[1])) return ytResult(shorts[1]);
    const embed = href.pathname.match(/^\/embed\/([A-Za-z0-9_-]{11})/);
    if (embed && YT_ID.test(embed[1])) return ytResult(embed[1]);
    const v = href.searchParams.get('v');
    if (v && YT_ID.test(v)) return ytResult(v);
  }

  if (host === 'b23.tv' || host === 'bili2233.cn') {
    return {
      ok: true,
      platform: 'bilibili',
      videoKey: null,
      canonicalUrl: href.href,
      short: true,
    };
  }

  if (host === 'bilibili.com' || host.endsWith('.bilibili.com')) {
    const bv = href.pathname.match(/\/video\/(BV[0-9A-Za-z]+)/i);
    if (bv) {
      const key = bv[1];
      return {
        ok: true,
        platform: 'bilibili',
        videoKey: key,
        canonicalUrl: `https://www.bilibili.com/video/${key}`,
        short: false,
      };
    }
    const avPath = href.pathname.match(/\/video\/av(\d+)/i);
    const aid = avPath?.[1] || href.searchParams.get('aid');
    if (aid && /^\d+$/.test(aid)) {
      return {
        ok: true,
        platform: 'bilibili',
        videoKey: `av${aid}`,
        canonicalUrl: `https://www.bilibili.com/video/av${aid}`,
        short: false,
      };
    }
  }

  return {
    ok: true,
    platform: 'other',
    videoKey: null,
    canonicalUrl: href.href,
    short: false,
  };
}

function ytResult(id) {
  return {
    ok: true,
    platform: 'youtube',
    videoKey: id,
    canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
    short: false,
  };
}

export function youtubeThumbnail(id) {
  const key = String(id || '');
  if (!YT_ID.test(key)) return '';
  return `https://i.ytimg.com/vi/${key}/hqdefault.jpg`;
}

export function formatDuration(seconds) {
  if (seconds == null || seconds === '') return '';
  const n = Number(seconds);
  if (!Number.isFinite(n) || n < 0) return '';
  const s = Math.floor(n);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x) => String(x).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

function httpsUrl(u) {
  return String(u || '').replace(/^http:\/\//i, 'https://');
}

export function presentChannelItem(row) {
  return {
    id: String(row?.id ?? ''),
    title: String(row?.title ?? ''),
    titleZh: row?.title_zh ?? null,
    thumbnail: httpsUrl(row?.thumbnail),
    url: String(row?.url ?? ''),
    platform: String(row?.platform ?? 'other'),
    duration: row?.duration ?? '',
  };
}

export function assembleChannel(settingsRow, videos) {
  const hubUrl = String(settingsRow?.hub_url || '').trim();
  const items = [...(videos || [])]
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
    .map(presentChannelItem);
  return { hubUrl, items };
}

export { YT_ID, BV_ID };

async function followRedirect(url, fetchImpl) {
  try {
    const r = await fetchImpl(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(8000) });
    return r.url || url;
  } catch {
    return url;
  }
}

/** Resolve title/cover. fetchImpl is injectable for tests (defaults to global fetch). */
export async function resolveVideoMeta(raw, fetchImpl = fetch) {
  let parsed = parseVideoUrl(raw);
  if (!parsed.ok) return parsed;

  if (parsed.short) {
    const followed = await followRedirect(parsed.canonicalUrl, fetchImpl);
    parsed = parseVideoUrl(followed || parsed.canonicalUrl);
    if (!parsed.ok) return parsed;
  }

  if (parsed.platform === 'youtube' && parsed.videoKey) {
    let title = '';
    try {
      const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}&format=json`;
      const r = await fetchImpl(oembed, { signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const j = await r.json();
        title = String(j?.title || '');
      }
    } catch {
      /* keep empty title; thumbnail still works */
    }
    return {
      ok: true,
      platform: 'youtube',
      videoKey: parsed.videoKey,
      canonicalUrl: parsed.canonicalUrl,
      short: false,
      title,
      thumbnail: youtubeThumbnail(parsed.videoKey),
      duration: '',
    };
  }

  if (parsed.platform === 'bilibili' && parsed.videoKey) {
    const qs = parsed.videoKey.startsWith('av')
      ? `aid=${parsed.videoKey.slice(2)}`
      : `bvid=${encodeURIComponent(parsed.videoKey)}`;
    try {
      const r = await fetchImpl(`https://api.bilibili.com/x/web-interface/view?${qs}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 AnoixChannel/1.0',
          Referer: 'https://www.bilibili.com/',
        },
        signal: AbortSignal.timeout(8000),
      });
      const j = r.ok ? await r.json() : null;
      const data = j?.data;
      if (data) {
        const bvid = data.bvid || (parsed.videoKey.startsWith('BV') ? parsed.videoKey : null);
        const canonical = bvid
          ? `https://www.bilibili.com/video/${bvid}`
          : parsed.canonicalUrl;
        return {
          ok: true,
          platform: 'bilibili',
          videoKey: bvid || parsed.videoKey,
          canonicalUrl: canonical,
          short: false,
          title: String(data.title || ''),
          thumbnail: httpsUrl(data.pic),
          duration: formatDuration(data.duration),
        };
      }
    } catch {
      /* fall through */
    }
    return { ok: true, ...parsed, title: '', thumbnail: '', duration: '' };
  }

  return { ok: true, ...parsed, title: '', thumbnail: '', duration: '' };
}

