import React, { useEffect, useMemo, useState } from 'react';
import { repository, useRepo } from '../../lib/repository';
import { nominations, TmdbNominationPayload } from '../../lib/nominations';
import { WorkItem } from '../../types';
import { Loader } from '../../components/motion/loader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/Toast';
import { Search, X, Clapperboard, Film, Star, Plus } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

interface TmdbResult {
  tmdbId: number;
  title: string;
  originalTitle: string;
  year: string;
  overview: string;
  posterUrl: string | null;
  rating: number | null;
}

export const NominateDialog: React.FC<{
  roundTitle?: string;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  initialFilmId?: string | null;
}> = ({ roundTitle, open, onClose, onSubmitted, initialFilmId }) => {
  const films = useRepo(repository.films);
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<'library' | 'tmdb'>('library');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const [libQuery, setLibQuery] = useState('');
  const [selectedFilm, setSelectedFilm] = useState<WorkItem | null>(null);

  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<TmdbResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTmdb, setSelectedTmdb] = useState<TmdbResult | null>(null);

  // reset on open (pre-select a film when opened from the plaza)
  useEffect(() => {
    if (open) {
      setNote(''); setSelectedTmdb(null);
      setLibQuery(''); setTmdbQuery(''); setTmdbResults([]);
      if (initialFilmId) {
        const f = films.find((x) => x.id === initialFilmId);
        setSelectedFilm(f ?? null);
        setTab(f ? 'library' : 'tmdb');
      } else {
        setSelectedFilm(null);
      }
    }
  }, [open, initialFilmId, films]);

  // TMDB search (debounced)
  useEffect(() => {
    if (!open || tab !== 'tmdb' || tmdbQuery.trim().length < 2) { setTmdbResults([]); return; }
    let alive = true;
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`${API_BASE}/api/tmdb/search?q=${encodeURIComponent(tmdbQuery.trim())}&media_type=multi`)
        .then((r) => r.json())
        .then((d) => { if (alive) setTmdbResults(d.results ?? []); })
        .catch(() => { if (alive) setTmdbResults([]); })
        .finally(() => { if (alive) setSearching(false); });
    }, 450);
    return () => { alive = false; clearTimeout(t); };
  }, [open, tab, tmdbQuery]);

  const filteredFilms = useMemo(() => {
    const q = libQuery.trim().toLowerCase();
    if (!q) return films.slice(0, 30);
    return films.filter((f) => [f.title, f.titleZh, f.titleEn, f.year].some((v) => v && String(v).toLowerCase().includes(q))).slice(0, 30);
  }, [films, libQuery]);

  const canSubmit = Boolean(selectedFilm || selectedTmdb) && note.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      const payload: { filmId?: string; tmdb?: TmdbNominationPayload; note: string } = { note: note.trim() };
      if (selectedFilm) {
        payload.filmId = selectedFilm.id;
      } else if (selectedTmdb) {
        payload.tmdb = {
          tmdbId: selectedTmdb.tmdbId,
          title: selectedTmdb.title,
          originalTitle: selectedTmdb.originalTitle,
          year: selectedTmdb.year,
          overview: selectedTmdb.overview,
          posterUrl: selectedTmdb.posterUrl,
        };
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
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-[#181818] border border-white/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/30 flex items-center justify-center text-[#ff3650]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-widest block">Nominate</span>
              <h3 className="text-xl font-black">提名一部影片</h3>
              <p className="text-xs text-white/40">{roundTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'library' | 'tmdb')}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="library" className="flex-1 sm:flex-none">从片库选</TabsTrigger>
              <TabsTrigger value="tmdb" className="flex-1 sm:flex-none">TMDB 刮削</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <Input value={libQuery} onChange={(e) => setLibQuery(e.target.value)} placeholder="搜索片库..." className="pl-9" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto">
                {filteredFilms.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { setSelectedFilm(f); setSelectedTmdb(null); }}
                    className={`rounded-xl overflow-hidden border-2 text-left transition-all cursor-pointer ${selectedFilm?.id === f.id ? 'border-[#ff3650]' : 'border-white/10 hover:border-white/30'}`}
                  >
                    <div className="aspect-[2/3] bg-black/40 overflow-hidden">
                      {f.image ? <img src={f.image} alt={f.title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><Film className="w-5 h-5" /></div>}
                    </div>
                    <p className="p-1.5 text-xs font-bold truncate">{f.titleZh ?? f.title}</p>
                  </button>
                ))}
              </div>
              {selectedFilm && <p className="text-xs text-[#e0fe3d] font-bold">已选：{selectedFilm.titleZh ?? selectedFilm.title}</p>}
            </TabsContent>

            <TabsContent value="tmdb" className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <Input value={tmdbQuery} onChange={(e) => setTmdbQuery(e.target.value)} placeholder="搜索 TMDB（片名/关键词）..." className="pl-9" />
              </div>
              {searching ? (
                <div className="py-8 flex justify-center"><Loader variant="dots" size={24} label="搜索中" className="text-[#ff3650]" /></div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tmdbResults.map((r) => (
                    <button
                      key={`${r.tmdbId}`}
                      type="button"
                      onClick={() => { setSelectedTmdb(r); setSelectedFilm(null); }}
                      className={`w-full flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all cursor-pointer ${selectedTmdb?.tmdbId === r.tmdbId ? 'border-[#ff3650]' : 'border-white/10 hover:border-white/30'}`}
                    >
                      {r.posterUrl ? <img src={r.posterUrl} alt={r.title} className="w-10 h-14 rounded-md object-cover shrink-0 bg-black/40" /> : <div className="w-10 h-14 rounded-md bg-white/5 shrink-0 flex items-center justify-center"><Clapperboard className="w-4 h-4 text-white/30" /></div>}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate">{r.title}</p>
                        <p className="text-xs text-white/40 truncate">{r.originalTitle}{r.year ? ` · ${r.year}` : ''}</p>
                      </div>
                      {r.rating != null && <span className="inline-flex items-center gap-1 text-xs font-black text-[#ff3650] shrink-0"><Star className="w-3 h-3 fill-current" /> {r.rating}</span>}
                    </button>
                  ))}
                  {tmdbResults.length === 0 && tmdbQuery.trim().length >= 2 && <p className="text-xs text-white/40 py-4 text-center">没有匹配结果</p>}
                </div>
              )}
              {selectedTmdb && <p className="text-xs text-[#e0fe3d] font-bold">已选：{selectedTmdb.title}</p>}
            </TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label className="text-white/60 uppercase text-xs font-black">推荐语 *</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="为什么推荐这部影片？（必填）"
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none transition-all placeholder:text-white/30 resize-none"
            />
            <p className="text-[11px] text-white/30 text-right">{note.length}/200</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit} disabled={!canSubmit || busy}>
            <Plus className="w-4 h-4" /> {busy ? '提交中...' : '提交提名'}
          </Button>
        </div>
      </div>
    </div>
  );
};
