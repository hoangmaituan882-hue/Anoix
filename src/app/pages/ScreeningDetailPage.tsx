import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language, OpenSiteModal } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { community, ScreeningDetail } from '../../lib/community';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Loader } from '../../components/motion/loader';
import { AvatarGroup } from '../../components/ui/avatar-group';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { useToast } from '../../components/ui/Toast';
import { ArrowLeft, MapPin, CalendarDays, Sparkles, Check, Ticket } from 'lucide-react';

const fmt = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
};

export const ScreeningDetailPage: React.FC<{
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: OpenSiteModal) => void;
}> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error: toastError } = useToast();

  const [s, setS] = useState<ScreeningDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [rsvped, setRsvped] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) {
      setMissing(true);
      setS(null);
      return;
    }
    let alive = true;
    setMissing(false);
    setS(null);
    Promise.all([community.screening(id), community.rsvp(id)])
      .then(([d, r]) => {
        if (!alive) return;
        setS(d); setRsvped(r.rsvped); setCount(r.count);
      })
      .catch(() => { if (alive) { setS(null); setMissing(true); } });
    return () => { alive = false; };
  }, [id]);

  const toggle = async () => {
    if (!id || busy) return;
    setBusy(true);
    try {
      if (rsvped) {
        await community.cancelRsvp(id);
        setRsvped(false); setCount((c) => Math.max(0, c - 1));
        success('已取消参与');
      } else {
        await community.joinRsvp(id);
        setRsvped(true); setCount((c) => c + 1);
        success('已参与，放映见！');
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header lang={lang} setLang={setLang} onNavigate={() => navigate('/')} onOpenModal={onOpenModal} />
      <main className="w-full min-h-screen bg-[#121212] px-4 sm:px-8 lg:px-12 py-24 lg:py-28 text-[#f5ffe5]">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-white/50 hover:text-[#ff3650] font-bold text-xs uppercase tracking-wider transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '返回' : 'BACK'}</span>
          </button>

          {missing ? (
            <div className="py-20 text-center space-y-4">
              <p className="text-white/50 text-sm font-bold">找不到这场放映。</p>
              <button
                type="button"
                onClick={() => navigate('/screenings', { viewTransition: true })}
                className="text-[#ff3650] text-xs font-black uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
              >
                返回放映档案
              </button>
            </div>
          ) : s === null ? (
            <div className="py-20 flex justify-center"><Loader variant="comet" size={36} label="加载放映会" className="text-[#ff3650]" /></div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: TRIGGER_EASE }} className="space-y-6">
              {/* Header card */}
              <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#151515] p-6 sm:p-8 overflow-hidden">
                <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#ff3650]/10 blur-3xl" />
                <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest">Screening</span>
                <h1 className="text-3xl sm:text-4xl font-black mt-1.5">{s.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-bold text-white/60">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-[#ff3650]" /> {fmt(s.screen_date)}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#e0fe3d]" /> {s.venue || '待定场地'}</span>
                  {s.theme && <span className="inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#ff3650]" /> {s.theme}</span>}
                </div>
              </div>

              {/* Participate */}
              <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <AvatarGroup count={count} />
                  <div>
                    <p className="text-2xl font-black text-white flex items-baseline gap-1.5">
                      <AnimatedNumber value={count} /> <span className="text-sm text-white/40 font-bold">人参与</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggle}
                  disabled={busy}
                  className={`group/btn sm:ml-auto inline-flex items-center gap-3 px-7 py-3 rounded-full font-black text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-lg ${
                    rsvped
                      ? 'bg-[#e0fe3d] text-[#121212] hover:bg-white shadow-[0_4px_20px_rgba(224,254,61,0.3)]'
                      : 'bg-[#ff3650] text-white hover:bg-[#ff203c] shadow-[0_8px_24px_rgba(255,54,80,0.35)]'
                  }`}
                >
                  <span className="font-extrabold tracking-wider">{rsvped ? '已参与' : '我要参与'}</span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5 ${
                      rsvped ? 'bg-[#121212] text-[#e0fe3d]' : 'bg-white text-[#ff3650]'
                    }`}
                  >
                    {rsvped ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Ticket className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </div>

              {/* Film list */}
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-4">放映片单</h2>
                {s.films.length === 0 ? (
                  <p className="text-white/40 text-sm">片单待定。</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {s.films.map((f, i) => (
                      <motion.button
                        key={f.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.06, ease: TRIGGER_EASE }}
                        onClick={() => navigate(`/films/${f.id}`, { viewTransition: true })}
                        className="group text-left rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff3650]/50 bg-black/30 transition-all hover:-translate-y-1 cursor-pointer"
                      >
                        <div className="aspect-[27/40] overflow-hidden bg-black/40">
                          {f.image ? <img src={f.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-white/20 font-black text-2xl">{f.title.slice(0, 1)}</div>}
                        </div>
                        <div className="p-2.5">
                          <p className="text-sm font-bold text-white truncate group-hover:text-[#ff3650] transition-colors">{f.title_zh || f.title_en || f.title}</p>
                          <p className="text-[11px] text-white/40">{f.year}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {s.recap && (
                <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5">
                  <h2 className="text-sm font-black uppercase tracking-wider text-white/50 mb-2">回顾</h2>
                  <p className="text-white/70 text-sm leading-relaxed">{s.recap}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
};
