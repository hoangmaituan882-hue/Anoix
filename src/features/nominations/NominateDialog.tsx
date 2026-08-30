import React, { useEffect, useState } from 'react';
import { catalog } from '../../lib/catalog';
import { nominations, TmdbNominationPayload, BangumiNominationPayload } from '../../lib/nominations';
import { searchScrape, ScrapeResult, ScrapeSource } from '../../lib/scrape';
import { WorkItem } from '../../types';
import { Loader } from '../../components/motion/loader';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { useToast } from '../../components/ui/Toast';
import { Search, X, Clapperboard, Film, Star, Plus } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export const NominateDialog: React.FC<{
  roundTitle?: string;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  initialFilmId?: string | null;
}> = ({ roundTitle, open, onClose, onSubmitted, initialFilmId }) => {
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<'library' | 'scrape'>('library');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const [libQuery, setLibQuery] = useState('');
  const [libFilms, setLibFilms] = useState<WorkItem[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<WorkItem | null>(null);

  const [source, setSource] = useState<ScrapeSource>('tmdb');
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [scrapeResults, setScrapeResults] = useState<ScrapeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedScrape, setSelectedScrape] = useState<ScrapeResult | null>(null);

  // reset on open (pre-select a film when opened from the plaza)
  useEffect(() => {
    if (open) {
      setNote(''); setSelectedScrape(null);
      setLibQuery(''); setScrapeQuery(''); setScrapeResults([]); setSource('tmdb');
      if (initialFilmId) {
        setTab('library');
        catalog.get(initialFilmId).then((f) => setSelectedFilm(f)).catch(() => setSelectedFilm(null));
      } else {
        setSelectedFilm(null);
      }
    }
  }, [open, initialFilmId]);

  useEffect(() => {
    if (!open || tab !== 'library') return;
    let alive = true;
    const timer = setTimeout(() => {
      setLibLoading(true);
      catalog
        .list({ q: libQuery, limit: 20, offset: 0 })
        .then((page) => {
          if (alive) setLibFilms(page.items);
        })
        .catch(() => {
          if (alive) setLibFilms([]);
        })
        .finally(() => {
          if (alive) setLibLoading(false);
        });
    }, libQuery.trim() ? 300 : 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, tab, libQuery]);

  // scrape search (debounced): TMDB or Bangumi
  useEffect(() => {
    if (!open || tab !== 'scrape' || scrapeQuery.trim().length < 2) { setScrapeResults([]); return; }
    let alive = true;
    setSearching(true);
    const t = setTimeout(() => {
      searchScrape(scrapeQuery.trim(), source)
        .then((r) => { if (alive) setScrapeResults(r); })
        .catch(() => { if (alive) setScrapeResults([]); })
        .finally(() => { if (alive) setSearching(false); });
    }, 450);
    return () => { alive = false; clearTimeout(t); };
  }, [open, tab, scrapeQuery, source]);

  const canSubmit = Boolean(selectedFilm || selectedScrape) && note.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      const payload: { filmId?: string; tmdb?: TmdbNominationPayload; bangumi?: BangumiNominationPayload; note: string } = { note: note.trim() };
      if (selectedFilm) {
        payload.filmId = selectedFilm.id;
      } else if (selectedScrape) {
        if (selectedScrape.source === 'tmdb') {
          payload.tmdb = {
            tmdbId: Number(selectedScrape.id),
            title: selectedScrape.title,
            originalTitle: selectedScrape.originalTitle,
            year: selectedScrape.year,
            overview: selectedScrape.overview,
            posterUrl: selectedScrape.posterUrl,
          };
        } else {
          payload.bangumi = {
            bgmId: Number(selectedScrape.id),
            title: selectedScrape.title,
            originalTitle: selectedScrape.originalTitle,
            year: selectedScrape.year,
            overview: selectedScrape.overview,
            posterUrl: selectedScrape.posterUrl,
          };
        }
      }
      await nominations.nominate(payload);
      success('提名已提交');
      onSubmitted();
      onClose();
    } catch (e) {
      toastError(e instanceof Error ? e.message : '提名失败');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-white border border-black/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/30 flex items-center justify-center text-[#ff3650]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-widest block">Nominate</span>
              <h3 className="text-xl font-black">提名一部影片</h3>
              <p className="text-xs text-black/40">{roundTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer border border-black/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'library' | 'scrape')}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="library" className="flex-1 sm:flex-none">从片库选</TabsTrigger>
              <TabsTrigger value="scrape" className="flex-1 sm:flex-none">刮削（TMDB/Bangumi）</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
                <Input value={libQuery} onChange={(e) => setLibQuery(e.target.value)} placeholder="搜索片库..." className="pl-9" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto">
                {libLoading && libFilms.length === 0 ? (
                  <div className="col-span-full py-8 flex justify-center">
                    <Loader variant="dots" size={24} label="加载片库" className="text-[#ff3650]" />
                  </div>
                ) : (
                  libFilms.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { setSelectedFilm(f); setSelectedScrape(null); }}
                    className={`rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${selectedFilm?.id === f.id ? 'border-[#ff3650]' : 'border-black/10 hover:border-white/30'}`}
                  >
                    <div className="aspect-[2/3] bg-black/40 overflow-hidden">
                      {f.image ? <img src={f.image} alt={f.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-black/20"><Film className="w-5 h-5" /></div>}
                    </div>
                    <p className="p-1.5 text-xs font-bold truncate">{f.titleZh ?? f.title}</p>
                  </button>
                  ))
                )}
              </div>
              {selectedFilm && <p className="text-xs text-[#e0fe3d] font-bold">已选：{selectedFilm.titleZh ?? selectedFilm.title}</p>}
            </TabsContent>

            <TabsContent value="scrape" className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSource('tmdb')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${source === 'tmdb' ? 'bg-[#ff3650] text-white' : 'bg-white/5 text-black/60 hover:text-white'}`}
                >
                  TMDB
                </button>
                <button
                  onClick={() => setSource('bangumi')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${source === 'bangumi' ? 'bg-[#ff3650] text-white' : 'bg-white/5 text-black/60 hover:text-white'}`}
                >
                  Bangumi
                </button>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
                <Input value={scrapeQuery} onChange={(e) => setScrapeQuery(e.target.value)} placeholder={source === 'tmdb' ? '搜索 TMDB（片名/关键词）...' : '搜索 Bangumi（片名/关键词）...'} className="pl-9" />
              </div>
              {searching ? (
                <div className="py-8 flex justify-center"><Loader variant="dots" size={24} label="搜索中" className="text-[#ff3650]" /></div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scrapeResults.map((r) => (
                    <button
                      key={`${r.source}-${r.id}`}
                      type="button"
                      onClick={() => { setSelectedScrape(r); setSelectedFilm(null); }}
                      className={`w-full flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all cursor-pointer ${selectedScrape?.id === r.id && selectedScrape?.source === r.source ? 'border-[#ff3650]' : 'border-black/10 hover:border-white/30'}`}
                    >
                      {r.posterUrl ? <img src={r.posterUrl} alt={r.title} className="w-10 h-14 rounded-md object-cover shrink-0 bg-black/40" /> : <div className="w-10 h-14 rounded-md bg-white/5 shrink-0 flex items-center justify-center"><Clapperboard className="w-4 h-4 text-black/30" /></div>}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-white/10 text-black/60">{r.source === 'tmdb' ? 'TMDB' : 'BGM'}</span>
                          <p className="text-sm font-bold truncate">{r.title}</p>
                        </div>
                        <p className="text-xs text-black/40 truncate">{r.originalTitle}{r.year ? ` · ${r.year}` : ''}</p>
                      </div>
                      {r.rating != null && <span className="inline-flex items-center gap-1 text-xs font-black text-[#ff3650] shrink-0"><Star className="w-3 h-3 fill-current" /> {r.rating}</span>}
                    </button>
                  ))}
                  {scrapeResults.length === 0 && scrapeQuery.trim().length >= 2 && <p className="text-xs text-black/40 py-4 text-center">没有匹配结果</p>}
                </div>
              )}
              {selectedScrape && <p className="text-xs text-[#e0fe3d] font-bold">已选：{selectedScrape.title}</p>}
            </TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label className="text-black/60 uppercase text-xs font-black">推荐语 *</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="为什么推荐这部影片？（必填）"
              className="w-full bg-black/50 border border-black/15 rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none transition-all placeholder:text-black/30 resize-none"
            />
            <p className="text-[11px] text-black/30 text-right">{note.length}/200</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-black/20 hover:border-white/40 text-black/70 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || busy}
            className="group/btn inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-40 text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(255,54,80,0.35)]"
          >
            <span className="tracking-wider">{busy ? '提交中...' : '提交提名'}</span>
            <span className="w-5 h-5 rounded-full bg-white text-[#ff3650] flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5">
              <Plus className="w-3 h-3 stroke-[3]" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
