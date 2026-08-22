import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language } from '../../types';
import { repository } from '../../lib/repository';
import { TRIGGER_EASE } from '../../lib/motion';
import { Screening } from '../../types/screening';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ArrowLeft, CalendarDays, MapPin, Clapperboard } from 'lucide-react';

interface ScreeningsPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}

/** Screening archive — past events timeline, film lists resolved from the catalog. */
export const ScreeningsPage: React.FC<ScreeningsPageProps> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Screening[] | null>(null);
  const films = repository.films();

  useEffect(() => {
    let alive = true;
    const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
    fetch(`${base}/api/screenings`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Screening[]) => { if (alive) setRows(data); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const titleOf = (filmId: string): string => {
    const f = films.find((x) => x.id === filmId);
    if (!f) return filmId;
    return (lang === 'zh' && f.titleZh) || (lang === 'en' && f.titleEn) || f.title;
  };

  return (
    <>
      <Header lang={lang} setLang={setLang} onNavigate={() => navigate('/')} onOpenModal={onOpenModal} />

      <motion.main
        id="container"
        className="w-full min-h-screen bg-[#151515] px-4 sm:px-8 lg:px-16 py-24 lg:py-28"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: TRIGGER_EASE }}
      >
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-white/60 hover:text-[#ff3650] font-black text-sm uppercase tracking-wider transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'zh' ? '返回首页' : 'BACK TO HOME'}</span>
          </button>

          <p className="text-xs font-black text-[#ff3650] uppercase tracking-widest mb-1">Screening Archive</p>
          <h1 className="text-4xl sm:text-6xl font-black text-[#f5ffe5] uppercase tracking-tight mb-2">
            {lang === 'zh' ? '放映会档案' : 'SCREENINGS'}
          </h1>
          <p className="text-white/50 font-bold mb-10">
            {lang === 'zh' ? '每一场放映,都值得被记住。' : 'Every screening, remembered.'}
          </p>

          {rows === null ? (
            <p className="text-white/50 font-bold">{lang === 'zh' ? '加载中...' : 'LOADING...'}</p>
          ) : rows.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-12 text-center">
              <Clapperboard className="w-10 h-10 text-[#ff3650] mx-auto mb-3" />
              <p className="text-white/60 font-bold">
                {lang === 'zh' ? '还没有放映会记录,第一场即将到来。' : 'No screenings yet — the first one is coming.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {rows.map((s, i) => (
                <motion.article
                  key={s.id}
                  initial={{ x: 60, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: TRIGGER_EASE }}
                  className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-[#ff3650]/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <span className="inline-flex items-center gap-2 bg-[#ff3650]/15 text-[#ff3650] font-black text-sm px-3 py-1 rounded-full">
                      <CalendarDays className="w-4 h-4" />
                      {s.screen_date}
                    </span>
                    {s.venue && (
                      <span className="inline-flex items-center gap-1.5 text-white/60 text-sm font-bold">
                        <MapPin className="w-4 h-4" /> {s.venue}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-[#f5ffe5] mb-1">{s.title}</h2>
                  {s.theme && <p className="text-[#ff3650] font-bold text-sm mb-3">{s.theme}</p>}
                  {s.film_ids && s.film_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {s.film_ids.map((fid) => (
                        <span key={fid} className="bg-white/10 text-white/90 text-xs font-bold px-3 py-1 rounded-full">
                          {titleOf(fid)}
                        </span>
                      ))}
                    </div>
                  )}
                  {s.recap && <p className="text-white/70 text-sm leading-relaxed">{s.recap}</p>}
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </motion.main>

      <Footer lang={lang} />
    </>
  );
};
