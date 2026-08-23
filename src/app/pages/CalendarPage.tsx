import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { community, CalendarEvent } from '../../lib/community';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Loader } from '../../components/motion/loader';
import { ArrowLeft, ChevronLeft, ChevronRight, Radio, Flame, MapPin, Sparkles, Film } from 'lucide-react';

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];

const pad = (n: number) => String(n).padStart(2, '0');
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayKey = () => key(new Date());

const getMonthDays = (year: number, month: number): Date[] => {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const start = new Date(year, month, 1 - startOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  return days;
};

const fmtDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${WEEK[(d.getDay() + 6) % 7]}`;
};

export const CalendarPage: React.FC<{
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    community.calendar().then((d) => { if (alive) setEvents(d.events ?? []); }).catch(() => { if (alive) setEvents([]); });
    return () => { alive = false; };
  }, []);

  const byDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events ?? []) { const a = m.get(e.date) ?? []; a.push(e); m.set(e.date, a); }
    return m;
  }, [events]);

  const days = useMemo(() => getMonthDays(cursor.year, cursor.month), [cursor]);
  const monthId = cursor.year * 12 + cursor.month;

  const upcoming = useMemo(() => {
    const t = todayKey();
    return (events ?? []).filter((e) => e.date >= t).sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  const selectedEvents = selected ? byDate.get(selected) ?? [] : [];

  const nav = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta;
      return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  };

  return (
    <>
      <Header lang={lang} setLang={setLang} onNavigate={() => navigate('/')} onOpenModal={onOpenModal} />
      <main className="w-full min-h-screen bg-[#0f0f0f] px-4 sm:px-8 lg:px-12 py-24 lg:py-28 text-[#f5ffe5] overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-white/50 hover:text-[#ff3650] font-bold text-xs uppercase tracking-wider transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '返回首页' : 'BACK TO HOME'}</span>
          </button>

          {/* Title */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-black text-[#ff3650] uppercase tracking-widest mb-1 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#e0fe3d]" /> Live Schedule
              </p>
              <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight">放映日历</h1>
              <p className="text-white/50 font-bold mt-2">未来的放映会与直播计划，一目了然</p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => nav(-1)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => { const d = new Date(); setCursor({ year: d.getFullYear(), month: d.getMonth() }); }} className="px-4 h-10 rounded-full bg-white/10 hover:bg-[#e0fe3d] hover:text-[#121212] text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer">今日</button>
              <button onClick={() => nav(1)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Calendar */}
            <div className="bg-[#171717]/80 border border-white/10 rounded-3xl p-5 sm:p-7 backdrop-blur relative overflow-hidden">
              <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#ff3650]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#e0fe3d]/5 blur-3xl" />

              {/* Month title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={monthId}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.3, ease: TRIGGER_EASE }}
                  className="flex items-baseline gap-3 mb-5"
                >
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">{cursor.month + 1}<span className="text-[#ff3650]">月</span></span>
                  <span className="text-lg font-black text-white/40">{cursor.year}</span>
                </motion.div>
              </AnimatePresence>

              {/* Weekday header */}
              <div className="grid grid-cols-7 mb-2">
                {WEEK.map((w, i) => (
                  <div key={w} className={`text-center text-[11px] font-black uppercase tracking-wider py-2 ${i >= 5 ? 'text-[#ff3650]/70' : 'text-white/40'}`}>{w}</div>
                ))}
              </div>

              {/* Day grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={monthId}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3, ease: TRIGGER_EASE }}
                  className="grid grid-cols-7 gap-1.5"
                >
                  {days.map((d, i) => {
                    const k = key(d);
                    const inMonth = d.getMonth() === cursor.month;
                    const isToday = k === todayKey();
                    const isSel = k === selected;
                    const dayEvents = byDate.get(k) ?? [];
                    const hasScreening = dayEvents.some((e) => e.type === 'screening');
                    const hasFilm = dayEvents.some((e) => e.type === 'film');
                    return (
                      <button
                        key={k}
                        onClick={() => setSelected(isSel ? null : k)}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group
                          ${!inMonth ? 'opacity-25' : 'opacity-100'}
                          ${isSel ? 'bg-[#ff3650] text-white shadow-[0_8px_24px_rgba(255,54,80,0.5)] scale-[1.04]' : isToday ? 'bg-white/10 ring-1 ring-[#e0fe3d] hover:bg-white/15' : 'bg-white/[0.03] hover:bg-white/10 hover:scale-[1.04]'}`}
                      >
                        <span className={`text-sm font-bold ${isSel ? 'text-white' : isToday ? 'text-[#e0fe3d]' : 'text-white/80'}`}>{d.getDate()}</span>
                        {dayEvents.length > 0 && (
                          <span className="absolute bottom-1.5 flex items-center gap-0.5">
                            {hasScreening && <span className="w-1.5 h-1.5 rounded-full bg-[#ff3650] group-hover:animate-pulse" />}
                            {hasFilm && <span className="w-1.5 h-1.5 rounded-full bg-[#e0fe3d]" />}
                            {dayEvents.length > 2 && <span className="text-[8px] font-black text-white/50 ml-0.5">+</span>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-5 text-[11px] font-bold text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ff3650]" /> 放映会</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#e0fe3d]" /> 单片放映</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#e0fe3d] ring-1 ring-[#e0fe3d]/50" /> 今日</span>
              </div>
            </div>

            {/* Events panel */}
            <div className="space-y-4">
              {events === null ? (
                <div className="bg-[#171717]/80 border border-white/10 rounded-3xl p-8 flex justify-center">
                  <Loader variant="comet" size={32} label="加载放映计划" className="text-[#ff3650]" />
                </div>
              ) : selectedEvents.length > 0 ? (
                <div className="bg-[#171717]/80 border border-white/10 rounded-3xl p-5">
                  <h3 className="font-black uppercase tracking-tight flex items-center gap-2 mb-4">
                    <Flame className="w-4 h-4 text-[#ff3650]" /> {fmtDate(selected!)}
                  </h3>
                  <div className="space-y-3">
                    {selectedEvents.map((e, i) => (
                      <motion.div key={e.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.06, ease: TRIGGER_EASE }} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                        {e.type === 'screening' ? (
                          <div className="p-3.5">
                            <p className="font-black text-white">{e.title}</p>
                            <p className="text-xs text-white/40 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.venue || '待定场地'}{e.theme ? ` · ${e.theme}` : ''}</p>
                            {e.films.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {e.films.map((f) => (
                                  <span key={f.id} className="text-[11px] font-bold text-white/70 bg-white/5 rounded-full px-2 py-0.5">{f.title}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3">
                            {e.image ? <img src={e.image} alt="" className="w-11 h-16 rounded-md object-cover shrink-0 bg-black/40" /> : <div className="w-11 h-16 rounded-md bg-white/5 shrink-0 flex items-center justify-center text-white/20"><Film className="w-4 h-4" /></div>}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{e.title}</p>
                              <p className="text-xs text-white/40">{e.year || ''} · 单片放映</p>
                            </div>
                            <button onClick={() => navigate(`/films/${e.id}`, { viewTransition: true })} className="ml-auto shrink-0 text-[11px] font-black text-[#ff3650] hover:text-white transition-colors cursor-pointer">详情 →</button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#171717]/80 border border-white/10 rounded-3xl p-6">
                  <h3 className="font-black uppercase tracking-tight flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#e0fe3d]" /> 即将到来
                  </h3>
                  {upcoming.length === 0 ? (
                    <p className="text-white/40 text-sm py-4">暂无排期。选中日历上有标记的日期查看放映计划。</p>
                  ) : (
                    <div className="space-y-2.5">
                      {upcoming.slice(0, 6).map((e) => (
                        <button key={`${e.date}-${e.id}`} onClick={() => setSelected(e.date)} className="w-full flex items-center gap-3 text-left rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 hover:border-[#ff3650]/50 transition-colors cursor-pointer">
                          <span className={`w-1 h-10 rounded-full shrink-0 ${e.type === 'screening' ? 'bg-[#ff3650]' : 'bg-[#e0fe3d]'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">{e.type === 'screening' ? e.title : e.title}</p>
                            <p className="text-[11px] text-white/40">{e.date}</p>
                          </div>
                          {e.type === 'screening' && e.films.length > 0 && <span className="text-[10px] font-black text-white/40 shrink-0">{e.films.length} 部</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
};
