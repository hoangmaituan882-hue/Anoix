import React, { useState } from 'react';
import { WorkItem, Language } from '../types';
import { WORKS_LIST, I18N } from '../data/triggerData';
import { X, Play, Filter } from 'lucide-react';

interface AllWorksModalProps {
  lang: Language;
  onClose: () => void;
  onSelectWork: (work: WorkItem) => void;
}

export const AllWorksModal: React.FC<AllWorksModalProps> = ({
  lang,
  onClose,
  onSelectWork,
}) => {
  const [filter, setFilter] = useState<'all' | 'TV Series' | 'Movie' | 'Original Animation'>('all');
  const t = I18N[lang];

  const filteredWorks = filter === 'all' 
    ? WORKS_LIST 
    : WORKS_LIST.filter(w => w.category.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-6xl bg-[#181818] border border-white/20 rounded-3xl overflow-hidden shadow-2xl my-8 text-[#f5ffe5] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-[#151515]">
          <div>
            <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest">
              ANIMATION STUDIO TRIGGER
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              {lang === 'zh' ? '全部工作作品' : t.allWorksModalTitle}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 sm:px-8 py-4 bg-[#1e1e1e] border-b border-white/10 flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-[#ff3650] flex-shrink-0" />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all ${
              filter === 'all' ? 'bg-[#ff3650] text-white' : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            ALL ({WORKS_LIST.length})
          </button>
          <button
            onClick={() => setFilter('TV Series')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all ${
              filter === 'TV Series' ? 'bg-[#ff3650] text-white' : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            TV Series
          </button>
          <button
            onClick={() => setFilter('Movie')}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all ${
              filter === 'Movie' ? 'bg-[#ff3650] text-white' : 'bg-white/10 text-white/70 hover:text-white'
            }`}
          >
            Theatrical Movie
          </button>
        </div>

        {/* Grid of works */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {filteredWorks.map((work) => (
            <div
              key={work.id}
              onClick={() => {
                onSelectWork(work);
              }}
              className="group/item cursor-pointer flex flex-col bg-[#222222] rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff3650] transition-all duration-300 transform hover:-translate-y-1.5"
            >
              <div className="relative aspect-[27/40] overflow-hidden bg-black/40">
                <img
                  src={work.image}
                  alt={lang === 'zh' && work.titleZh ? work.titleZh : lang === 'en' && work.titleEn ? work.titleEn : work.title}
                  className="w-full h-full object-cover group-hover/item:scale-108 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white">
                  {work.year}
                </div>
                {work.isNew && (
                  <span className="absolute top-2 right-2 bg-[#ff3650] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#ff3650] uppercase tracking-wider block mb-1">
                    {work.category}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover/item:text-[#f5ffe5]">
                    {lang === 'zh' && work.titleZh ? work.titleZh : lang === 'en' && work.titleEn ? work.titleEn : work.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
