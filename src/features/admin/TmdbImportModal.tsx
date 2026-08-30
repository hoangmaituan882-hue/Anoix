import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WorkItem } from '../../types';
import { Loader } from '../../components/motion/loader';
import { searchScrape, detailScrape, ScrapeResult, ScrapeSource } from '../../lib/scrape';
import { Search, X, Import, Clapperboard, Tv, Layers, Star, AlertCircle, Database } from 'lucide-react';

/** Fields an enrich (补全) pick fills back onto an existing film. */
export interface EnrichPatch {
  title?: string;
  titleZh?: string;
  titleEn?: string;
  year?: string;
  image?: string;
  description?: string;
  rating?: string;
  director?: string;
}

interface TmdbDetail extends ScrapeResult {
  tagline: string;
  director?: string;
}

const MEDIA_TYPES = [
  { key: 'multi', label: '全部', icon: Layers },
  { key: 'movie', label: '电影', icon: Clapperboard },
  { key: 'tv', label: '剧集', icon: Tv },
] as const;

/** Map a TMDB detail into a WorkItem, admin edits before saving. */
function tmdbToWork(d: TmdbDetail): WorkItem {
  return {
    id: `tmdb-${d.id}`,
    title: d.originalTitle || d.title,
    titleZh: d.title || undefined,
    titleEn: d.originalTitle || undefined,
    year: d.year || '',
    category: d.mediaType === 'movie' ? 'Movie' : 'TV Series',
    image: d.posterUrl ?? '',
    tagline: d.tagline || undefined,
    description: d.overview || '',
    descriptionZh: d.overview || undefined,
    director: d.director || undefined,
    isNew: false,
  };
}

/** Map a scrape result/detail into an EnrichPatch (fill existing film). */
function toEnrichPatch(d: Record<string, any>): EnrichPatch {
  return {
    title: d.originalTitle || d.title || undefined,
    titleZh: d.title || undefined,
    titleEn: d.originalTitle || undefined,
    year: d.year || undefined,
    image: d.posterUrl ?? undefined,
    description: d.overview || d.summary || undefined,
    rating: d.rating != null ? String(d.rating) : undefined,
    director: d.director || undefined,
  };
}

export const TmdbImportModal: React.FC<{
  onClose: () => void;
  onSelect: (work: WorkItem) => void;
  /** When set → enrich mode: pick fills this existing film instead of importing a new one. */
  enrichTarget?: { id: string; title: string };
  onEnrich?: (patch: EnrichPatch) => void;
}> = ({ onClose, onSelect, enrichTarget, onEnrich }) => {
  const isEnrich = Boolean(enrichTarget);
  const [query, setQuery] = useState(enrichTarget?.title ?? '');
  const [source, setSource] = useState<ScrapeSource>('tmdb');
  const [mediaType, setMediaType] = useState<'movie' | 'tv' | 'multi'>('multi');
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, src: ScrapeSource, mt: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    setError('');
    try {
      const r = await searchScrape(q.trim(), src, mt as 'movie' | 'tv' | 'multi');
      setResults(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : '搜索失败');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // 450ms debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void doSearch(query, source, mediaType); }, 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, source, mediaType, doSearch]);

  const pick = async (item: ScrapeResult) => {
    setLoadingDetail(String(item.id));
    setError('');
    try {
      const d = await detailScrape(item);
      if (isEnrich && onEnrich) onEnrich(toEnrichPatch(d));
      else onSelect(tmdbToWork({ ...d, id: item.id, mediaType: item.mediaType ?? 'movie' } as TmdbDetail));
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取详情失败');
    } finally {
      setLoadingDetail(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#181818] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/30 flex items-center justify-center text-[#ff3650]">
              {isEnrich ? <Database className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-widest block">
                {isEnrich ? 'MANUAL SCRAPE ENRICH' : 'SCRAPE IMPORT'}
              </span>
              <h3 className="text-xl font-black text-white">
                {isEnrich ? `刮削补全《${enrichTarget?.title}》` : '刮削导入作品'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar + source pills */}
        <div className="flex flex-col gap-3 pt-4 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索片名(中文 / 原名 / 关键词)..."
              className="w-full bg-black/50 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-white text-sm font-medium focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none transition-all placeholder:text-white/30"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Source toggle */}
            <button
              onClick={() => setSource('tmdb')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${source === 'tmdb' ? 'bg-[#ff3650] text-white shadow-md' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              TMDB
            </button>
            <button
              onClick={() => setSource('bangumi')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${source === 'bangumi' ? 'bg-[#ff3650] text-white shadow-md' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
            >
              Bangumi
            </button>

            {/* Media type pills (TMDB only) */}
            {source === 'tmdb' && MEDIA_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMediaType(key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mediaType === key ? 'bg-[#e0fe3d] text-[#121212] shadow-md' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-[#ff3650]/15 border border-[#ff3650]/40 flex items-center gap-2.5 text-sm font-bold text-[#ff3650] shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto mt-3 min-h-[150px]">
          {searching ? (
            <div className="flex justify-center py-8">
              <Loader variant="dots" size={32} label="搜索中" className="text-[#ff3650]" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <Search className="w-7 h-7 text-white/20" />
              <p className="text-sm font-bold text-white/40">
                {query.trim().length < 2 ? '输入至少 2 个字符开始搜索' : '没有匹配的结果'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {results.map((item) => (
                <button
                  key={`${item.source}-${item.id}`}
                  onClick={() => pick(item)}
                  disabled={loadingDetail !== null}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-2xl p-2.5 transition-colors cursor-pointer disabled:opacity-50 text-left border border-white/5 hover:border-white/15"
                >
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-14 h-[84px] rounded-xl object-cover shrink-0 bg-black/40 border border-white/10"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-14 h-[84px] rounded-xl bg-black/40 border border-white/10 shrink-0 flex items-center justify-center">
                      <Clapperboard className="w-5 h-5 text-white/20" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-white/10 text-white/60">
                        {item.source === 'tmdb' ? (item.mediaType === 'movie' ? 'TMDB·电影' : 'TMDB·剧集') : 'BGM'}
                      </span>
                      {item.rating != null && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-[#ff3650]">
                          <Star className="w-3 h-3 fill-current" /> {item.rating}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-[#f5ffe5] text-sm truncate">{item.title}</p>
                    <p className="text-xs text-white/50 truncate">{item.originalTitle}{item.year ? ` · ${item.year}` : ''}</p>
                  </div>
                  <div className="shrink-0">
                    {loadingDetail === String(item.id) ? (
                      <Loader variant="spinner" size={16} label="获取详情" className="text-[#ff3650]" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 group-hover:text-[#ff3650] transition-colors">
                        <Import className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-white/30 font-bold mt-3 pt-2 border-t border-white/10 shrink-0">
          TMDB 海报走 image.tmdb.org · Bangumi 走 bgmimg.anibt.net（国内可达）
        </p>
      </div>
    </div>
  );
};