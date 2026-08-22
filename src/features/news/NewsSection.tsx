import React from 'react';
import { NewsItem, Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { repository } from '../../lib/repository';
import { ArrowRight, Tag } from 'lucide-react';

interface NewsSectionProps {
  lang: Language;
  onSelectNews: (news: NewsItem) => void;
  onOpenAllNews: () => void;
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  lang,
  onSelectNews,
  onOpenAllNews,
}) => {
  const t = I18N[lang];

  return (
    <section
      id="cb_content_90"
      className="relative w-full py-20 md:py-32 px-4 sm:px-8 lg:px-16 overflow-hidden select-none"
      style={{ backgroundColor: '#4246ff' }}
    >
      {/* Giant Typography Watermark Background */}
      <div className="absolute top-4 left-0 right-0 overflow-hidden pointer-events-none opacity-25 flex justify-center">
        <h2
          className="cb_headline text-[130px] sm:text-[200px] lg:text-[280px] font-black tracking-tighter text-white leading-none uppercase whitespace-nowrap"
          style={{ fontFamily: "'Anton', 'Montserrat', sans-serif" }}
        >
          NEWS
        </h2>
      </div>

      <div className="relative max-w-6xl mx-auto z-10">
        {/* Section Header */}
        <div className="mb-12 md:mb-16">
          <h2
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase"
            style={{ fontFamily: "'Anton', 'Montserrat', sans-serif" }}
          >
            {t.news}
          </h2>
          <div className="w-16 h-1.5 bg-white mt-3 rounded-full" />
        </div>

        {/* News List */}
        <div className="news_list divide-y divide-white/20 border-t border-b border-white/20">
          {repository.news().map((item) => (
            <article
              key={item.id}
              onClick={() => onSelectNews(item)}
              className="py-6 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-8 group cursor-pointer hover:bg-white/10 px-4 md:px-6 -mx-4 md:-mx-6 rounded-2xl transition-all duration-200"
            >
              <div className="flex items-center gap-4 text-sm md:text-base font-bold text-white/80">
                <time className="font-mono tracking-wider text-white">
                  {item.date}
                </time>
                {item.category && (
                  <span className="bg-white text-[#4246ff] text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    {item.category}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-[#f5ffe5] flex-1 line-clamp-2 md:line-clamp-1 transition-colors">
                {lang === 'zh' && item.titleZh ? item.titleZh : lang === 'en' && item.titleEn ? item.titleEn : item.title}
              </h3>

              <div className="hidden md:flex items-center text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <ArrowRight className="w-6 h-6" />
              </div>
            </article>
          ))}
        </div>

        {/* Action Button: ALL NEWS */}
        <div className="mt-12 flex justify-start">
          <button
            id="btn-all-news"
            onClick={onOpenAllNews}
            className="design_button group/btn inline-flex items-center gap-3 bg-[#f5ffe5] text-[#121212] hover:bg-white px-7 py-3 rounded-full font-black text-sm md:text-base tracking-wider uppercase transition-all duration-300 shadow-xl hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] cursor-pointer"
          >
            <span className="label font-extrabold tracking-widest">
              {t.allNews}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#121212] text-[#f5ffe5] group-hover/btn:bg-[#4246ff] group-hover/btn:text-white flex items-center justify-center transition-transform group-hover/btn:translate-x-1 duration-200">
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
