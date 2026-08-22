import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language } from '../../types';
import { repository } from '../../lib/repository';
import { TRIGGER_EASE } from '../../lib/motion';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { STUDIO_HISTORY_STATS, STUDIO_HISTORY_ERAS } from '../../data/historyData';
import { HistoryHeroDashboard } from '../../features/history/HistoryHeroDashboard';
import { HistoryVisualCharts } from '../../features/history/HistoryVisualCharts';
import { HistoryEraTimeline } from '../../features/history/HistoryEraTimeline';
import { 
  ArrowLeft, 
  Layers, 
  GitCommit, 
  BarChart3, 
  Award, 
  Calendar,
  Sparkles,
  Flame,
  Search
} from 'lucide-react';

interface HistoryPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  lang,
  setLang,
  onOpenModal,
}) => {
  const navigate = useNavigate();
  const [selectedEraId, setSelectedEraId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const films = repository.films();

  const filteredEras = useMemo(() => {
    return STUDIO_HISTORY_ERAS.filter((era) => {
      if (selectedEraId !== 'all' && era.id !== selectedEraId) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchEra = era.name.toLowerCase().includes(q) || 
        era.nameZh.toLowerCase().includes(q) || 
        era.taglineZh.toLowerCase().includes(q);
      const matchMilestone = era.milestones.some((m) => 
        m.title.toLowerCase().includes(q) ||
        m.titleZh.toLowerCase().includes(q) ||
        m.descriptionZh.toLowerCase().includes(q) ||
        (m.director && m.director.toLowerCase().includes(q)) ||
        (m.directorZh && m.directorZh.toLowerCase().includes(q))
      );
      return matchEra || matchMilestone;
    });
  }, [selectedEraId, searchQuery]);

  const handleSelectFilm = (filmId: string) => {
    navigate(`/films/${filmId}`);
  };

  return (
    <>
      <Header
        lang={lang}
        setLang={setLang}
        onNavigate={() => navigate('/')}
        onOpenModal={onOpenModal}
      />

      <main
        id="history_page_container"
        className="w-full min-h-screen bg-[#121212] px-4 sm:px-8 lg:px-12 py-20 lg:py-24 text-[#f5ffe5]"
      >
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-[#ff3650] font-bold text-xs uppercase tracking-wider transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '返回首页' : 'BACK TO HOME'}</span>
          </button>

          {/* Top Hero Stats Dashboard */}
          <HistoryHeroDashboard
            stats={STUDIO_HISTORY_STATS}
            lang={lang}
          />

          {/* Visual Charts Section: Genre & Directors */}
          <HistoryVisualCharts
            stats={STUDIO_HISTORY_STATS}
            lang={lang}
            onSelectFilm={handleSelectFilm}
          />

          {/* Section Divider & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#ff3650]" />
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {lang === 'zh' ? '四大纪元历史编年演进' : 'FOUR ERAS OF STUDIO EVOLUTION'}
                </h2>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {lang === 'zh' ? '点击纪元快速筛选特定创作时期的重大事件' : 'Filter milestones across 4 distinct eras'}
              </p>
            </div>

            {/* Era Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'zh' ? '搜索事件/监督...' : 'Search history...'}
                  className="bg-white/5 border border-white/10 focus:border-[#ff3650] rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none transition-colors w-40"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setSelectedEraId('all')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedEraId === 'all'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {lang === 'zh' ? '全部纪元' : 'ALL ERAS'}
                </button>
                {STUDIO_HISTORY_ERAS.map((era) => (
                  <button
                    key={era.id}
                    onClick={() => setSelectedEraId(era.id)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                      selectedEraId === era.id
                        ? 'bg-[#ff3650] text-white font-bold'
                        : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                    }`}
                  >
                    {era.period.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History Timeline */}
          <HistoryEraTimeline
            eras={filteredEras}
            lang={lang}
            films={films}
            onSelectFilm={handleSelectFilm}
          />
        </div>
      </main>

      <Footer lang={lang} />
    </>
  );
};
