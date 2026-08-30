import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { community, YearReviewData } from '../../lib/community';
import { Rating } from '../../components/ui/rating';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { useToast } from '../../components/ui/Toast';
import { TRIGGER_EASE } from '../../lib/motion';
import { Sparkles, Trophy, CheckCircle2, ChevronRight, ChevronLeft, X, Share2 } from 'lucide-react';

const TOTAL = 5;

const StatChip: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex-1 min-w-[80px] rounded-2xl border border-black/10 bg-white/5 px-3 py-3 text-center">
    <p className={`text-2xl font-black ${color}`}><AnimatedNumber value={value} /></p>
    <p className="text-[11px] font-bold text-black/40 mt-0.5">{label}</p>
  </div>
);

/** Full-screen "Year in Review" (Spotify-Wrapped style) — 5-scene narrative. */
export const YearReview: React.FC<{ open: boolean; onClose: () => void; userName: string }> = ({ open, onClose, userName }) => {
  const [data, setData] = useState<YearReviewData | null>(null);
  const [step, setStep] = useState(0);
  const { success } = useToast();

  useEffect(() => {
    if (open) {
      setStep(0);
      setData(null);
      community.yearReview().then(setData).catch(() => setData(null));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, TOTAL - 1));
      else if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const share = async () => {
    if (!data) return;
    const text = `我在 Anoix 放映会的 ${data.year} 年度回顾：提名 ${data.nominations} 次 · 投票 ${data.votes} 次 · 观影 ${data.watches} 部 · ${data.persona}`;
    try { await navigator.clipboard.writeText(text); success('回顾已复制'); } catch { /* ignore */ }
  };

  const fiveStar = (data?.watchedFilms ?? []).filter((f) => f.rating >= 5);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[65] flex flex-col bg-[#0f0f0f] overflow-hidden"
        >
          {/* glow background */}
          <div className="pointer-events-none absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#ff3650]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#e0fe3d]/10 blur-3xl" />

          {/* top bar: close + progress */}
          <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4">
            <span className="text-xs font-black text-black/40">{step + 1} / {TOTAL}</span>
            <div className="flex-1 mx-4 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full bg-[#ff3650]" initial={false} animate={{ width: `${((step + 1) / TOTAL) * 100}%` }} transition={{ duration: 0.35, ease: TRIGGER_EASE }} />
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
          </div>

          {/* scene */}
          <div className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {data === null ? (
                <motion.p key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-black/40 font-bold">加载中…</motion.p>
              ) : (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 44 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -44 }}
                  transition={{ duration: 0.35, ease: TRIGGER_EASE }}
                  className="w-full max-w-2xl text-center"
                >
                  {step === 0 && (
                    <div className="space-y-6">
                      <Sparkles className="w-10 h-10 mx-auto text-[#e0fe3d] animate-pulse" />
                      <div>
                        <p className="text-7xl sm:text-8xl font-black leading-none bg-gradient-to-r from-[#ff3650] to-[#e0fe3d] bg-clip-text text-transparent">{data.year}</p>
                        <p className="text-2xl sm:text-3xl font-black mt-3">我的放映之年</p>
                        <p className="text-black/50 font-bold mt-2">{userName}</p>
                      </div>
                      <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] text-white font-black text-sm px-7 py-3 rounded-2xl shadow-[0_8px_24px_rgba(255,54,80,0.4)] transition-colors cursor-pointer">▶ 开始回顾</button>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-5">
                      <p className="text-xs font-black text-[#ff3650] uppercase tracking-widest">Nominate · 你的选片</p>
                      <p className="text-6xl font-black text-white"><AnimatedNumber value={data.nominations} /></p>
                      <p className="text-black/40 font-bold">次提名</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {data.nominatedFilms.slice(0, 8).map((f, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: TRIGGER_EASE }} className="relative rounded-xl overflow-hidden border border-black/10 bg-black/30 aspect-[27/40]">
                            {f.image ? <img src={f.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-black/20 font-black">{f.title.slice(0, 1)}</div>}
                            <p className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 py-1 text-[10px] font-bold text-white truncate">{f.title}</p>
                            {f.planned && <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />已通过</span>}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <p className="text-xs font-black text-[#e0fe3d] uppercase tracking-widest">Vote · 你的眼光</p>
                      <div className="flex items-end justify-center gap-2">
                        <p className="text-6xl font-black text-white"><AnimatedNumber value={data.votes} /></p>
                        <p className="text-black/40 font-bold pb-2">次投票</p>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-black/50 font-bold">
                        <Trophy className="w-5 h-5 text-[#e0fe3d]" /> 为 {data.rounds} 部片子叠过票
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <p className="text-xs font-black text-[#ff3650] uppercase tracking-widest">Watch · 你的放映</p>
                      <div className="flex items-end justify-center gap-2">
                        <p className="text-6xl font-black text-white"><AnimatedNumber value={data.watches} /></p>
                        <p className="text-black/40 font-bold pb-2">部</p>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Rating value={Math.round(data.avgRating)} readOnly size={20} />
                        <span className="text-black/50 font-bold">{data.avgRating}/5</span>
                      </div>
                      {fiveStar.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-black/40">你给满分的作品</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {fiveStar.map((f, i) => (
                              <motion.div key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: TRIGGER_EASE }} className="rounded-xl overflow-hidden border border-black/10 bg-black/30">
                                <div className="aspect-[27/40] overflow-hidden bg-black/40">
                                  {f.image ? <img src={f.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-black/20 font-black">{f.title.slice(0, 1)}</div>}
                                </div>
                                <p className="px-2 py-1.5 text-[10px] font-bold text-white truncate">{f.title}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6">
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.45, ease: TRIGGER_EASE }} className="mx-auto max-w-sm rounded-3xl border border-[#ff3650]/50 bg-gradient-to-br from-[#ff3650]/15 to-[#e0fe3d]/5 px-6 py-7">
                        <Trophy className="w-9 h-9 mx-auto text-[#e0fe3d]" />
                        <p className="text-3xl font-black text-white mt-3">{data.persona}</p>
                      </motion.div>
                      <div className="flex flex-wrap gap-2.5 justify-center">
                        <StatChip label="提名" value={data.nominations} color="text-[#ff3650]" />
                        <StatChip label="投票" value={data.votes} color="text-[#e0fe3d]" />
                        <StatChip label="观影" value={data.watches} color="text-white" />
                        <StatChip label="收藏" value={data.favorites} color="text-[#e0fe3d]" />
                        <StatChip label="参与放映" value={data.rsvps} color="text-[#ff3650]" />
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={share} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-sm px-5 py-2.5 rounded-2xl transition-colors cursor-pointer"><Share2 className="w-4 h-4" /> 复制回顾</button>
                        <button onClick={onClose} className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] text-white font-black text-sm px-5 py-2.5 rounded-2xl transition-colors cursor-pointer">回到资料</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* bottom nav */}
          <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4">
            <button onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0} className="inline-flex items-center gap-1 text-black/50 hover:text-white disabled:opacity-20 font-black text-sm transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /> 上一幕</button>
            <button onClick={() => step === TOTAL - 1 ? onClose() : setStep((s) => Math.min(s + 1, TOTAL - 1))} className="inline-flex items-center gap-1 text-[#ff3650] hover:text-white font-black text-sm transition-colors cursor-pointer">{step === TOTAL - 1 ? '完成' : '下一幕'} <ChevronRight className="w-4 h-4" /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
