import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Flame, Crown, LayoutGrid, ListOrdered } from 'lucide-react';

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

export const PlazaPage: React.FC<{
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const [scope, setScope] = useState<'week' | 'all'>('week');
  const [view, setView] = useState<'masonry' | 'ranking'>('masonry');
  const [items, setItems] = useState<PlazaItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    setItems(null);
    nominations.plaza(scope)
      .then((d) => { if (alive) setItems(d.items ?? []); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, [scope]);

  const ranking = (items ?? []).slice().sort((a, b) => b.votes - a.votes || b.nominations - a.nominations);

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
              <p className="text-sm text-white/50 mt-1.5">影迷提名的影片瀑布流与实时投票排行</p>
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
            <div className="space-y-2.5 max-w-3xl">
              {ranking.map((item, i) => (
                <div key={item.filmId} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${i === 0 ? 'border-[#ff3650]/50 bg-[#ff3650]/5' : 'border-white/10 bg-[#1a1a1a]'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${i === 0 ? 'bg-[#ff3650] text-white' : i < 3 ? 'bg-[#e0fe3d] text-[#121212]' : 'bg-white/10 text-white/60'}`}>
                    {i === 0 ? <Crown className="w-4 h-4" /> : i + 1}
                  </span>
                  {item.image && <img src={item.image} alt="" className="w-9 h-12 rounded-md object-cover shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{item.title}</p>
                    <p className="text-xs text-white/40">提名 {item.nominations} 次</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0"><AnimatedNumber value={item.votes} /> 票</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
};
