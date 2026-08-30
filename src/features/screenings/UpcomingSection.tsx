import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { catalog } from '../../lib/catalog';
import { community, UpcomingNight, UpcomingPoster } from '../../lib/community';
import { openFilmPreview } from '../../lib/filmPreview';

interface UpcomingSectionProps {
  lang: Language;
}

function posterTitle(film: UpcomingPoster, lang: Language) {
  if (lang === 'zh' && film.titleZh) return film.titleZh;
  if (lang === 'en' && film.titleEn) return film.titleEn;
  return film.title;
}

function nightParts(iso: string) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const week = ['日', '一', '二', '三', '四', '五', '六'][dt.getUTCDay()];
  return {
    md: `${m}.${String(d).padStart(2, '0')}`,
    week: `周${week}`,
    long: `${y}年${m}月${d}日`,
  };
}

/** Lime viewfinder that replaces the pointer while hovering a poster. */
const LookCursor: React.FC<{ x: number; y: number; on: boolean; label: string }> = ({
  x, y, on, label,
}) => (
  <div
    aria-hidden
    className={`pointer-events-none fixed top-0 left-0 z-[80] mix-blend-difference transition-opacity duration-150 ${
      on ? 'opacity-100' : 'opacity-0'
    }`}
    style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
  >
    <div className="relative w-24 h-24">
      <span className="absolute inset-0 rounded-full border-2 border-[#e0fe3d] animate-spin" style={{ animationDuration: '8s' }} />
      <span className="absolute inset-2 rounded-full border border-[#e0fe3d]/40" />
      <span className="absolute left-1/2 top-0 bottom-0 w-px bg-[#e0fe3d]/80" />
      <span className="absolute top-1/2 left-0 right-0 h-px bg-[#e0fe3d]/80" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="bg-[#e0fe3d] text-[#121212] text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full">
          {label || 'LOOK'}
        </span>
      </span>
    </div>
  </div>
);

export const UpcomingSection: React.FC<UpcomingSectionProps> = ({ lang }) => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [nights, setNights] = useState<UpcomingNight[] | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, on: false, label: '' });
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    let alive = true;
    community.upcomingNights()
      .then((d) => { if (alive) setNights(d.nights ?? []); })
      .catch(() => { if (alive) setNights([]); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setFinePointer(fine.matches && !reduce.matches);
    sync();
    fine.addEventListener('change', sync);
    reduce.addEventListener('change', sync);
    return () => {
      fine.removeEventListener('change', sync);
      reduce.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !nights?.length) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [nights]);

  const onPosterEnter = (title: string) => {
    setCursor((c) => ({ ...c, on: true, label: title.slice(0, 8) }));
  };
  const onPosterMove = (e: React.PointerEvent) => {
    setCursor((c) => ({ ...c, x: e.clientX, y: e.clientY, on: true }));
  };
  const onPosterLeave = () => setCursor((c) => ({ ...c, on: false }));

  const openPoster = async (film: UpcomingPoster) => {
    const full = await catalog.get(film.id).catch(() => null);
    openFilmPreview(full ?? {
      id: film.id,
      title: film.title,
      titleZh: film.titleZh ?? undefined,
      titleEn: film.titleEn ?? undefined,
      year: film.year,
      category: film.category,
      image: film.image,
      description: '',
    });
  };

  return (
    <section
      id="cb_content_427"
      className="relative w-full min-h-[85vh] flex flex-col justify-center py-24 md:py-32 overflow-hidden bg-[#111111]"
    >
      {finePointer && <LookCursor {...cursor} />}

      <div className="absolute top-8 left-0 right-0 overflow-hidden pointer-events-none opacity-10 flex justify-center z-0">
        <h2
          className="text-[120px] sm:text-[190px] lg:text-[280px] font-black tracking-tighter text-[#e0fe3d] leading-none uppercase whitespace-nowrap"
          style={{ fontFamily: "'Fjordic-Heavy', 'Arial Black', sans-serif" }}
        >
          NEXT
        </h2>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#111111] to-transparent z-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#111111] to-transparent z-20" />

      <div className="relative z-10 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e0fe3d]/20 border border-[#e0fe3d]/40 text-[#e0fe3d] text-xs font-black tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>UPCOMING NIGHTS</span>
          </div>
          <h2
            className="text-5xl sm:text-7xl lg:text-8xl font-black text-[#e0fe3d] tracking-tight uppercase leading-none mb-4"
            style={{ fontFamily: "'Fjordic-Heavy', 'Arial Black', sans-serif" }}
          >
            NEXT
          </h2>
          <p className="text-lg sm:text-2xl font-extrabold text-white tracking-tight max-w-xl">
            {lang === 'en' ? 'One node each night. Every poster that evening.' : '一场一个节点，当晚的海报都在这里。'}
          </p>
        </div>

        {nights === null ? (
          <p className="px-4 sm:px-8 lg:px-16 text-black/40 text-sm">加载未来场次…</p>
        ) : nights.length === 0 ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16">
            <div className="rounded-3xl border border-dashed border-[#e0fe3d]/30 bg-[#e0fe3d]/5 px-6 py-12 text-center">
              <CalendarDays className="w-8 h-8 text-[#e0fe3d] mx-auto mb-3" />
              <p className="text-white font-bold">近期暂无排期</p>
              <p className="text-black/50 text-sm mt-1">排期确定后，时间线上会出现当晚的海报。</p>
            </div>
          </div>
        ) : (
          <div
            ref={scrollerRef}
            className="relative overflow-x-auto scrollbar-none px-4 sm:px-8 lg:px-16 pb-6"
            style={{ scrollbarWidth: 'none' }}
          >
            <div className="relative min-w-max">
              <div className="absolute top-[4.75rem] left-8 right-8 h-px bg-gradient-to-r from-[#e0fe3d]/10 via-[#e0fe3d] to-[#e0fe3d]/10" />
              <div className="flex gap-10 sm:gap-16 pr-8">
                {nights.map((night, i) => {
                  const parts = nightParts(night.screenDate);
                  const live = night.status === 'tonight';
                  return (
                    <motion.article
                      key={night.id}
                      initial={{ x: 80, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.7, delay: i * 0.08, ease: TRIGGER_EASE }}
                      className="relative flex-shrink-0 w-[min(92vw,420px)] pt-2"
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/screenings/${encodeURIComponent(night.id)}`, { viewTransition: true })}
                        className="text-left mb-5 cursor-pointer group/node"
                      >
                        <p className="text-[10px] font-black tracking-[0.25em] uppercase text-[#e0fe3d]/80 mb-1">
                          {live ? (lang === 'en' ? 'Tonight' : '今晚') : parts.week}
                        </p>
                        <p
                          className="text-4xl sm:text-5xl font-black text-white leading-none group-hover/node:text-[#e0fe3d] transition-colors"
                          style={{ fontFamily: "'Fjordic-Heavy', 'Arial Black', sans-serif" }}
                        >
                          {parts.md}
                        </p>
                        <p className="text-xs font-bold text-black/50 mt-1 truncate max-w-[280px]">{night.title}</p>
                      </button>

                      <span
                        className={`absolute top-[4.35rem] left-0 w-3.5 h-3.5 rounded-full border-2 border-[#111111] ${
                          live ? 'bg-[#ff3650] shadow-[0_0_16px_rgba(255,54,80,0.8)]' : 'bg-[#e0fe3d]'
                        }`}
                      >
                        {live && (
                          <span className="absolute inset-0 rounded-full bg-[#ff3650] animate-ping opacity-40" />
                        )}
                      </span>

                      <div className="flex items-end mt-8 pl-1">
                        {night.films.length === 0 ? (
                          <p className="text-xs text-white/35 font-bold py-10">片单待公布</p>
                        ) : (
                          night.films.map((film, fi) => (
                            <button
                              key={film.id}
                              type="button"
                              onClick={() => void openPoster(film)}
                              onPointerEnter={() => { if (finePointer) onPosterEnter(posterTitle(film, lang)); }}
                              onPointerMove={finePointer ? onPosterMove : undefined}
                              onPointerLeave={finePointer ? onPosterLeave : undefined}
                              className="relative flex-shrink-0 w-[132px] sm:w-[158px] -ml-8 first:ml-0 group/poster"
                              style={{
                                zIndex: night.films.length - fi,
                                rotate: `${(fi - (night.films.length - 1) / 2) * 3.5}deg`,
                                cursor: finePointer ? 'none' : 'pointer',
                              }}
                            >
                              <span className="block aspect-[27/40] rounded-2xl overflow-hidden border-2 border-black/15 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-transform duration-500 ease-out group-hover/poster:-translate-y-4 group-hover/poster:scale-105 group-hover/poster:border-[#e0fe3d] group-hover/poster:z-20">
                                {film.image ? (
                                  <img
                                    src={film.image}
                                    alt={posterTitle(film, lang)}
                                    className="w-full h-full object-cover"
                                    draggable={false}
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="w-full h-full flex items-center justify-center text-[#e0fe3d]/40 text-xs font-black">
                                    POSTER
                                  </span>
                                )}
                                <span className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                                  <span className="block text-[11px] font-black text-white line-clamp-2 leading-tight">
                                    {posterTitle(film, lang)}
                                  </span>
                                </span>
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 mt-10">
          <button
            type="button"
            onClick={() => navigate('/screenings', { viewTransition: true })}
            className="design_button group/btn inline-flex items-center gap-3 bg-[#e0fe3d] text-[#121212] hover:bg-white px-8 py-3.5 rounded-full font-black text-base tracking-wider uppercase transition-all duration-300 shadow-xl hover:shadow-[0_8px_30px_rgba(224,254,61,0.35)] cursor-pointer"
          >
            <span className="label font-extrabold tracking-widest">
              {lang === 'en' ? 'All screenings' : '放映档案'}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#f5ffe5] text-[#e0fe3d] group-hover/btn:bg-[#e0fe3d] group-hover/btn:text-[#121212] flex items-center justify-center transition-transform group-hover/btn:translate-x-1 duration-200">
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
