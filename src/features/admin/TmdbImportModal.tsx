import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WorkItem } from '../../types';
import { Loader } from '../../components/motion/loader';
import { Search, X, Import, Clapperboard, Tv, Layers, Star, AlertCircle } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

interface TmdbSearchResult {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  originalTitle: string;
  year: string;
  overview: string;
  posterUrl: string | null;
  rating: number | null;
}

interface TmdbDetail extends TmdbSearchResult {
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
    id: `tmdb-${d.tmdbId}`,
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

export const TmdbImportModal: React.FC<{
  onClose: () => void;
  onSelect: (work: WorkItem) => void;
}> = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [mediaType, setMediaType] = useState<'movie' | 'tv' | 'multi'>('multi');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, mt: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/tmdb/search?q=${encodeURIComponent(q.trim())}&media_type=${mt}`);
      if (!r.ok) throw new Error(r.status === 503 ? '未配置 TMDB Key,或上游不可达' : `搜索失败 (${r.status})`);
      const data = await r.json();
      setResults(data.results ?? []);
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
    debounceRef.current = setTimeout(() => { void doSearch(query, mediaType); }, 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, mediaType, doSearch]);

  const pick = async (item: TmdbSearchResult) => {
    setLoadingDetail(item.tmdbId);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/tmdb/detail/${item.tmdbId}?media_type=${item.mediaType}`);
      if (!r.ok) throw new Error(`获取详情失败 (${r.status})`);
      const d: TmdbDetail = await r.json();
      onSelect(tmdbToWork(d));
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
              <Search className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-widest block">
                TMDB SCRAPE IMPORT
              </span>
              <h3 className="text-xl font-black text-white">刮削导入作品</h3>
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

        {/* Search bar + media type pills */}
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

          <div className="flex items-center gap-2">
            {MEDIA_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMediaType(key)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mediaType === key
                    ? 'bg-[#ff3650] text-white shadow-md'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
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
                  key={`${item.mediaType}-${item.tmdbId}`}
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
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        item.mediaType === 'movie' ? 'bg-[#ff3650]/20 text-[#ff3650]' : 'bg-[#e0fe3d]/15 text-[#e0fe3d]'
                      }`}>
                        {item.mediaType === 'movie' ? '电影' : '剧集'}
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
                    {loadingDetail === item.tmdbId ? (
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
          海报走 image.tmdb.org(国内可达)· API 需在服务端配置 TMDB_API_KEY 与可达的 TMDB_API_BASE_URL
        </p>
      </div>
    </div>
  );
};
