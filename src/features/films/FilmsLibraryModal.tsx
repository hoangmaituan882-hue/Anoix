import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkItem, Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { repository, useRepo } from '../../lib/repository';
import { TRIGGER_EASE } from '../../lib/motion';
import { TiltCard } from '../../components/motion/TiltCard';
import { X, Play, Filter, Search, Sparkles, Film, ArrowUpDown } from 'lucide-react';

interface FilmsLibraryModalProps {
  lang: Language;
  onClose: () => void;
  onSelectWork: (work: WorkItem) => void;
}

export const FilmsLibraryModal: React.FC<FilmsLibraryModalProps> = ({
  lang,
  onClose,
  onSelectWork,
}) => {
  const [filter, setFilter] = useState<'all' | 'TV Series' | 'Movie' | 'Original Animation'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const films = useRepo(repository.films);
  const t = I18N[lang];

  const filteredWorks = useMemo(() => {
    return films
      .filter((w) => {
        const matchesCategory =
          filter === 'all' ||
          w.category.toLowerCase().includes(filter.toLowerCase()) ||
          (filter === 'Original Animation' && (w.category.includes('Netflix') || w.category.includes('Original')));

        if (!matchesCategory) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const titleMatch =
          w.title.toLowerCase().includes(q) ||
          (w.titleZh && w.titleZh.toLowerCase().includes(q)) ||
          (w.titleEn && w.titleEn.toLowerCase().includes(q));
        const directorMatch = w.director && w.director.toLowerCase().includes(q);
        const tagMatch = w.tagline && w.tagline.toLowerCase().includes(q);
        const yearMatch = w.year && w.year.toLowerCase().includes(q);

        return titleMatch || directorMatch || tagMatch || yearMatch;
      })
      .sort((a, b) => {
        // Sort by year
        const getYearNum = (str: string) => {
          const match = str.match(/\d{4}/);
          return match ? parseInt(match[0], 10) : 0;
        };
        const yearA = getYearNum(a.year);
        const yearB = getYearNum(b.year);
        return sortOrder === 'desc' ? yearB - yearA : yearA - yearB;
      });
  }, [films, filter, searchQuery, sortOrder]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: TRIGGER_EASE }}
        className="relative w-full max-w-6xl bg-[#181818] border border-white/20 rounded-3xl overflow-hidden shadow-2xl my-8 text-[#f5ffe5] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-[#151515]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff3650]/15 border border-[#ff3650]/40 flex items-center justify-center text-[#ff3650]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black text-[#ff3650] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                ANIMATION STUDIO TRIGGER
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {t.allWorksModalTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 sm:px-8 py-4 bg-[#1e1e1e] border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-[#ff3650] flex-shrink-0" />
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer ${
                filter === 'all' ? 'bg-[#ff3650] text-white shadow-md' : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              {lang === 'zh' ? `全部 (${films.length})` : `ALL (${films.length})`}
            </button>
            <button
              onClick={() => setFilter('TV Series')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer ${
                filter === 'TV Series' ? 'bg-[#ff3650] text-white shadow-md' : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              {lang === 'zh' ? '电视动画 (TV Series)' : 'TV Series'}
            </button>
            <button
              onClick={() => setFilter('Movie')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer ${
                filter === 'Movie' ? 'bg-[#ff3650] text-white shadow-md' : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              {lang === 'zh' ? '剧场版电影 (Movie)' : 'Theatrical Movie'}
            </button>
            <button
              onClick={() => setFilter('Original Animation')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer ${
                filter === 'Original Animation' ? 'bg-[#ff3650] text-white shadow-md' : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              {lang === 'zh' ? '原创/网播动画 (Original)' : 'Original / Streaming'}
            </button>
          </div>

          {/* Search Input & Sort Button */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'zh' ? '搜索作品/监督/年份...' : lang === 'ja' ? '作品名・監督・年代で検索...' : 'Search titles, staff, year...'}
                className="w-full bg-white/5 border border-white/15 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff3650] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white/80 transition-colors cursor-pointer whitespace-nowrap border border-white/10"
              title={sortOrder === 'desc' ? '最新在前' : '早期在前'}
            >
              <ArrowUpDown className="w-3 h-3 text-[#ff3650]" />
              <span>{sortOrder === 'desc' ? (lang === 'zh' ? '最新优先' : 'Newest') : (lang === 'zh' ? '年代顺序' : 'Oldest')}</span>
            </button>
          </div>
        </div>

        {/* Grid of works with layout animations & automatic fade-in/out */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          <AnimatePresence mode="popLayout">
            {filteredWorks.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="py-16 text-center text-white/60"
              >
                <p className="text-lg font-bold mb-2">
                  {lang === 'zh' ? '未找到匹配的作品' : lang === 'ja' ? '該当する作品が見つかりませんでした' : 'No matching titles found'}
                </p>
                <p className="text-xs text-white/40 mb-4">
                  {lang === 'zh' ? '请尝试切换分类或更换搜索关键词' : 'Try adjusting your search or category filter.'}
                </p>
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#ff3650] text-white text-xs font-bold hover:bg-[#ff203c] transition-colors cursor-pointer"
                >
                  {lang === 'zh' ? '重置筛选' : 'Reset Filters'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredWorks.map((work) => (
                    <motion.div
                      layout
                      key={work.id}
                      initial={{ opacity: 0, scale: 0.88, y: 16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.88, y: -12 }}
                      transition={{
                        duration: 0.32,
                        ease: TRIGGER_EASE,
                        layout: { duration: 0.35, ease: TRIGGER_EASE },
                      }}
                    >
                      <TiltCard
                        onClick={() => onSelectWork(work)}
                        className="group/item cursor-pointer flex flex-col bg-[#222222] rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff3650] hover:shadow-[0_12px_30px_rgba(255,54,80,0.25)] transition-colors duration-300"
                      >
                      <div className="relative aspect-[27/40] overflow-hidden bg-black/40">
                        <img
                          src={work.image}
                          alt={lang === 'zh' && work.titleZh ? work.titleZh : lang === 'en' && work.titleEn ? work.titleEn : work.title}
                          className="w-full h-full object-cover group-hover/item:scale-108 transition-transform duration-500"
                          loading="lazy"
                        />
                        
                        {/* Dark gradient backdrop & Quick hover badge */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#ff3650] px-3.5 py-1.5 rounded-full shadow-lg transform scale-90 group-hover/item:scale-100 transition-transform">
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{lang === 'zh' ? '查看详情' : 'VIEW'}</span>
                          </div>
                        </div>

                        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[10px] font-black text-white border border-white/15">
                          {work.year}
                        </div>

                        {work.isNew && (
                          <span className="absolute top-2.5 right-2.5 bg-[#ff3650] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-wider block mb-1">
                            {work.category}
                          </span>
                          <h3 className="text-xs sm:text-sm font-black text-white line-clamp-2 leading-snug group-hover/item:text-[#ff3650] transition-colors">
                            {lang === 'zh' && work.titleZh ? work.titleZh : lang === 'en' && work.titleEn ? work.titleEn : work.title}
                          </h3>
                          {work.director && (
                            <p className="text-[11px] text-white/50 line-clamp-1 mt-1 font-medium">
                              {work.director}
                            </p>
                          )}
                        </div>
                      </div>
                      </TiltCard>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
