import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Masonry } from 'masonic';
import { Language } from '../../types';
import { nominations, PlazaItem } from '../../lib/nominations';
import { TRIGGER_EASE } from '../../lib/motion';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Loader } from '../../components/motion/loader';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { ArrowLeft, Flame, Crown, Trophy, LayoutGrid, ListOrdered, Radio } from 'lucide-react';

const PlazaCard: React.FC<{ item: PlazaItem }> = ({ item }) => (
  <div className="bg-[#1a1a1a] border border-white/10 hover:border-[#ff3650]/50 rounded-2xl overflow-hidden transition-all duration-300 group">
    <div className="relative aspect-[2/3] overflow-hidden bg-black/40">
      {item.image ? (
        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/20 font-black text-3xl">{item.title.slice(0, 1)}</div>
      )}
      {item.planned && (
        <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">已通过</span>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">提名 {item.nominations}</span>
        <span className="bg-[#ff3650]/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Flame className="w-2.5 h-2.5" /> {item.votes}</span>
      </div>
    </div>
    <div className="p-3">
      <p className="text-sm font-bold text-white truncate">{item.title}</p>
      <p className="text-xs text-white/40 font-mono">{item.year}{item.category ? ` · ${item.category}` : ''}</p>
    </div>
  </div>
);

const RANK_STYLES = [
  { ring: 'border-[#ff3650]/60 bg-[#ff3650]/10', chip: 'bg-[#ff3650] text-white shadow-[0_0_16px_rgba(255,54,80,0.5)]', bar: 'bg-[#ff3650]' },
  { ring: 'border-[#e0fe3d]/50 bg-[#e0fe3d]/5', chip: 'bg-[#e0fe3d] text-[#121212]', bar: 'bg-[#e0fe3d]' },
  { ring: 'border-[#ff9900]/50 bg-[#ff9900]/5', chip: 'bg-[#ff9900] text-white', bar: 'bg-[#ff9900]' },
];

export const PlazaPage: React.FC<{
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const [scope, setScope] = useState<'week' | 'all'>('week');
  const [view, setView] = useState<'masonry' | 'ranking'>('masonry');
  const [items, setItems] = useState<PlazaItem[] | null>(null);

  // Load + silent poll every 8s (real-time ranking).
  useEffect(() => {
    let alive = true;
    const load = () => {
      nominations.plaza(scope)
        .then((d) => { if (alive) setItems(d.items ?? []); })
        .catch(() => { if (alive && items === null) setItems([]); });
    };
    load();
    const timer = setInterval(load, 8000);
    return () => { alive = false; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const ranking = (items ?? []).slice().sort((a, b) => b.votes - a.votes || b.nominations - a.nominations);
  const maxVotes = ranking.length ? ranking[0].votes : 0;

  return (
    <>
      <Header lang={lang} setLang={setLang} onNavigate={() => navigate('/')} onOpenModal={onOpenModal} />
      <main className="w-full min-h-screen bg-[#121212] px-4 sm:px-8 lg:px-12 py-20 lg:py-24 text-[#f5ffe5]">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-white/50 hover:text-[#ff3650] font-bold text-xs uppercase tracking-wider transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '返回首页' : 'BACK TO HOME'}</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-black text-[#ff3650] uppercase tracking-widest mb-1">Nomination Plaza</p>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">提名广场</h1>
              <p className="text-sm text-white/50 mt-1.5 flex items-center gap-2">
                影迷提名的影片瀑布流与实时投票排行
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#e0fe3d]"><Radio className="w-3 h-3 animate-pulse" /> 实时</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tabs value={scope} onValueChange={(v) => setScope(v as 'week' | 'all')}>
                <TabsList>
                  <TabsTrigger value="week">本周</TabsTrigger>
                  <TabsTrigger value="all">总榜</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-0.5">
                <button onClick={() => setView('masonry')} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${view === 'masonry' ? 'bg-[#ff3650] text-white' : 'text-white/50 hover:text-white'}`} title="瀑布流"><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setView('ranking')} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${view === 'ranking' ? 'bg-[#ff3650] text-white' : 'text-white/50 hover:text-white'}`} title="排行"><ListOrdered className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {items === null ? (
            <div className="py-20 flex justify-center"><Loader variant="comet" size={36} label="加载提名广场" className="text-[#ff3650]" /></div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-white/40">
              <Flame className="w-10 h-10 mx-auto mb-3 text-white/20" />
              <p className="font-bold">还没有提名影片，去提名页投一票吧</p>
            </div>
          ) : view === 'masonry' ? (
            <Masonry
              items={items}
              columnGutter={16}
              columnWidth={240}
              overscanBy={4}
              render={({ data }) => <div className="mb-4"><PlazaCard item={data} /></div>}
            />
          ) : (
            <div className="space-y-3 max-w-3xl">
              {ranking.map((item, i) => {
                const style = RANK_STYLES[i] ?? { ring: 'border-white/10 bg-[#1a1a1a]', chip: 'bg-white/10 text-white/60', bar: 'bg-white/40' };
                const share = maxVotes > 0 ? item.votes / maxVotes : 0;
                return (
                  <motion.div
                    key={item.filmId}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.05, ease: TRIGGER_EASE }}
                    className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 ${style.ring}`}
                  >
                    <motion.span
                      layout
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${style.chip}`}
                    >
                      {i === 0 ? <Crown className="w-4 h-4" /> : i === 1 ? <Trophy className="w-4 h-4" /> : i === 2 ? <Trophy className="w-4 h-4" /> : i + 1}
                    </motion.span>

                    {item.image ? (
                      <img src={item.image} alt="" className="w-10 h-14 rounded-lg object-cover shrink-0 border border-white/10" />
                    ) : (
                      <div className="w-10 h-14 rounded-lg bg-white/5 shrink-0 flex items-center justify-center text-white/20 font-black">{item.title.slice(0, 1)}</div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white truncate">{item.title}</p>
                        {item.planned && <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shrink-0">已通过</Badge>}
                      </div>
                      <p className="text-xs text-white/40 mb-1.5">提名 {item.nominations} 次</p>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${style.bar}`}
                          initial={false}
                          animate={{ width: `${share * 100}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0 min-w-[64px]">
                      <div className="flex items-baseline justify-end gap-1">
                        <AnimatedNumber value={item.votes} className="text-xl font-black text-white tabular-nums" />
                        <span className="text-[11px] font-bold text-white/40">{lang === 'zh' ? '票' : 'votes'}</span>
                      </div>
                      <p className="text-[10px] font-mono text-white/30">{Math.round(share * 100)}%</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
};
