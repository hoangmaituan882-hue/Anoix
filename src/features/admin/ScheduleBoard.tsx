import React, { useEffect, useMemo, useState } from 'react';
import { adminFilms, adminScreenings, FilmRow, ScreeningRow } from '../../lib/pgAdmin';
import {
  shanghaiDateString,
  rankFeatured,
  clubIndexByFilm,
  placeFilmOnNight,
  moveFilmBetweenNights,
  filmScheduleFields,
} from '../../lib/scheduleOps';
import { Loader } from '../../components/motion/loader';
import { ChevronLeft, ChevronRight, Film, GripVertical, Save, Sparkles } from 'lucide-react';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const DRAG_MIME = 'application/x-anoix-film';

type DragPayload = { filmId: string; fromDate: string | null };

function monthMatrix(year: number, month: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month, 1));
  const startWeekday = (first.getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function filmsOnDate(screenings: ScreeningRow[], date: string): string[] {
  const ids: string[] = [];
  for (const s of screenings) {
    if (String(s.screen_date || '').slice(0, 10) !== date) continue;
    for (const id of s.film_ids || []) if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function parseDrag(e: React.DragEvent): DragPayload | null {
  try {
    const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain');
    const data = JSON.parse(raw) as DragPayload;
    return data?.filmId ? data : null;
  } catch {
    return null;
  }
}

function setDrag(e: React.DragEvent, payload: DragPayload) {
  const raw = JSON.stringify(payload);
  e.dataTransfer.setData(DRAG_MIME, raw);
  e.dataTransfer.setData('text/plain', raw);
  e.dataTransfer.effectAllowed = 'move';
}

export const ScheduleBoard: React.FC<{
  films: FilmRow[];
  screenings: ScreeningRow[];
  onSaved: () => void;
}> = ({ films, screenings, onSaved }) => {
  const today = shanghaiDateString();
  const [draft, setDraft] = useState<ScreeningRow[]>(screenings);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(() => {
    const [y, m] = today.split('-').map(Number);
    return { year: y, month: m - 1 };
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dropDay, setDropDay] = useState<string | null>(null);

  useEffect(() => {
    setDraft(screenings);
  }, [screenings]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(screenings);
  const filmById = useMemo(() => new Map(films.map((f) => [f.id, f])), [films]);

  const scheduledIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of draft) for (const id of s.film_ids || []) if (id) set.add(id);
    return set;
  }, [draft]);

  const unscheduled = useMemo(() => {
    const q = query.trim().toLowerCase();
    return films.filter((f) => {
      if (scheduledIds.has(f.id)) return false;
      if (!q) return true;
      return [f.title, f.title_zh, f.title_en, f.year, f.director].some(
        (v) => v && String(v).toLowerCase().includes(q),
      );
    });
  }, [films, scheduledIds, query]);

  const preview = useMemo(
    () => rankFeatured(films, draft, today).slice(0, 12),
    [films, draft, today],
  );

  const weeks = monthMatrix(cursor.year, cursor.month);
  const monthLabel = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`;

  const applyDrop = (toDate: string, insertIndex?: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setDropDay(null);
    const payload = parseDrag(e);
    if (!payload) return;
    setDraft((prev) => {
      if (payload.fromDate) {
        return moveFilmBetweenNights(prev, payload.filmId, payload.fromDate, toDate, insertIndex);
      }
      return placeFilmOnNight(prev, payload.filmId, toDate, insertIndex);
    });
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const origById = new Map<string, ScreeningRow>(screenings.map((s) => [s.id, s]));
      for (const s of draft) {
        const orig = origById.get(s.id);
        const empty = !(s.film_ids || []).length;
        if (!orig) {
          if (empty) continue;
          await adminScreenings.create(s);
          continue;
        }
        const changed =
          JSON.stringify(orig.film_ids || []) !== JSON.stringify(s.film_ids || []) ||
          String(orig.screen_date).slice(0, 10) !== String(s.screen_date).slice(0, 10);
        if (changed) {
          await adminScreenings.update(s.id, {
            film_ids: s.film_ids,
            screen_date: s.screen_date,
          });
        }
      }
      for (const orig of screenings) {
        const cur = draft.find((s) => s.id === orig.id);
        const empty = cur ? !(cur.film_ids || []).length : true;
        const auto = orig.id.startsWith('night-') && !orig.venue && !orig.theme && !orig.recap;
        if (empty && auto) await adminScreenings.remove(orig.id);
      }

      const index = clubIndexByFilm(draft);
      const touched = new Set<string>();
      for (const s of [...screenings, ...draft]) {
        for (const id of s.film_ids || []) if (id) touched.add(id);
      }
      for (const id of touched) {
        const dates = index.get(id)?.dates ?? [];
        const fields = filmScheduleFields(dates, today);
        await adminFilms.update(id, {
          screening_date: fields.screening_date,
          screening_status: fields.screening_status,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存时刻表失败');
    } finally {
      setBusy(false);
    }
  };

  const poster = (id: string) => filmById.get(id);

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> 首页时刻表
          </span>
          <p className="text-xs text-white/50 mt-1">
            拖到某一天即排期。右侧 12 格只含已放过的片子；未来场次会冻结投票，但不上首页。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || busy}
          className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-40 text-white font-black text-xs px-4 py-2 rounded-xl cursor-pointer"
        >
          {busy ? <Loader variant="dots" size={14} className="text-white" /> : <Save className="w-3.5 h-3.5" />}
          <span>{busy ? '保存中' : dirty ? '保存排期' : '已同步'}</span>
        </button>
      </div>

      {error && (
        <p className="text-xs font-bold text-[#ff3650] bg-[#ff3650]/10 border border-[#ff3650]/30 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_200px] gap-4">
        {/* Unscheduled */}
        <div className="space-y-2 min-h-[320px]">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-wider">未排期 ({unscheduled.length})</p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜片库..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-[#ff3650] focus:outline-none"
          />
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
            {unscheduled.slice(0, 80).map((f) => (
              <div
                key={f.id}
                draggable
                onDragStart={(e) => setDrag(e, { filmId: f.id, fromDate: null })}
                className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1.5 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="w-3 h-3 text-white/30 shrink-0" />
                {f.image ? (
                  <img src={f.image} alt="" className="w-8 h-11 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-11 rounded bg-white/5 shrink-0 flex items-center justify-center">
                    <Film className="w-3 h-3 text-white/30" />
                  </div>
                )}
                <p className="text-[11px] font-bold text-white truncate">{f.title_zh || f.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))}
              className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-black text-white font-mono">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))}
              className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-white/40 uppercase">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="min-h-[88px] rounded-xl bg-black/20" />;
              const ids = filmsOnDate(draft, day);
              const isToday = day === today;
              const isFuture = day > today;
              return (
                <div
                  key={day}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropDay(day);
                  }}
                  onDragLeave={() => setDropDay((d) => (d === day ? null : d))}
                  onDrop={applyDrop(day)}
                  className={`min-h-[88px] rounded-xl border p-1 space-y-1 transition-colors ${
                    dropDay === day
                      ? 'border-[#ff3650] bg-[#ff3650]/15'
                      : isToday
                      ? 'border-[#e0fe3d]/40 bg-[#e0fe3d]/5'
                      : 'border-white/10 bg-black/30'
                  }`}
                >
                  <div className="flex items-center justify-between px-0.5">
                    <span className={`text-[10px] font-mono font-bold ${isToday ? 'text-[#e0fe3d]' : 'text-white/50'}`}>
                      {day.slice(8)}
                    </span>
                    {isFuture && ids.length > 0 && (
                      <span className="text-[8px] font-black text-white/30">未开</span>
                    )}
                  </div>
                  {ids.map((id, idx) => {
                    const f = poster(id);
                    return (
                      <div
                        key={`${day}-${id}`}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDrag(e, { filmId: id, fromDate: day });
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.stopPropagation();
                          applyDrop(day, idx)(e);
                        }}
                        className="flex items-center gap-1 bg-white/5 rounded px-0.5 py-0.5 cursor-grab"
                        title={f?.title_zh || f?.title || id}
                      >
                        {f?.image ? (
                          <img src={f.image} alt="" className="w-5 h-7 rounded-sm object-cover shrink-0" />
                        ) : (
                          <div className="w-5 h-7 rounded-sm bg-white/10 shrink-0" />
                        )}
                        <span className="text-[9px] font-bold text-white truncate hidden sm:block">
                          {f?.title_zh || f?.title || id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured preview */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-wider">首页预览 · 已放映 12</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => {
              const f = preview[i];
              return (
                <div key={i} className="relative aspect-[2/3] rounded-lg overflow-hidden bg-black/40 border border-white/10">
                  {f?.image ? (
                    <img src={f.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/15 text-[10px] font-black">
                      {i + 1}
                    </div>
                  )}
                  {f?.isNew && (
                    <span className="absolute top-1 left-1 bg-[#ff3650] text-white text-[8px] font-black px-1 rounded">NEW</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
