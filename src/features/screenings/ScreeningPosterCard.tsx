import React from 'react';
import { motion } from 'motion/react';
import { Screening } from '../../types/screening';
import { Language, WorkItem } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { 
  Calendar, 
  MapPin, 
  Ticket,
  Maximize2 
} from 'lucide-react';

interface ScreeningPosterCardProps {
  screening: Screening;
  lang: Language;
  index: number;
  onOpenPoster: (screening: Screening) => void;
  films?: WorkItem[];
}

export const ScreeningPosterCard: React.FC<ScreeningPosterCardProps> = ({
  screening,
  lang,
  index,
  onOpenPoster,
}) => {
  const title = (lang === 'zh' && screening.title_zh)
    ? screening.title_zh
    : (lang === 'en' && screening.title_en)
      ? screening.title_en
      : screening.title;

  const poster = screening.demo_poster_url || screening.poster_url || 'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/CPER2-2.jpg';

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: TRIGGER_EASE }}
      className="group flex flex-col bg-[#181818] border border-white/10 hover:border-[#ff3650]/60 rounded-2xl overflow-hidden transition-colors duration-200"
    >
      {/* Poster Image Frame */}
      <div 
        onClick={() => onOpenPoster(screening)}
        className="relative aspect-[27/38] overflow-hidden bg-black/60 cursor-pointer"
      >
        <img
          src={poster}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300 ease-out"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
          <span className="bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white border border-white/15">
            {screening.screen_date}
          </span>

          {screening.format_tags?.[0] && (
            <span className="bg-[#ff3650] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {screening.format_tags[0]}
            </span>
          )}
        </div>

        {/* Center Hover Action */}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <span className="bg-[#ff3650] text-white text-xs font-bold px-3.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-md">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '查看演示海报与票根' : 'Inspect Poster & Ticket'}</span>
          </span>
        </div>

        {/* Bottom Venue Strip */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
          <p className="text-[11px] font-medium text-white/90 line-clamp-1 flex items-center gap-1 bg-black/80 backdrop-blur-sm px-2 py-1 rounded border border-white/10">
            <MapPin className="w-3 h-3 text-[#ff3650] shrink-0" />
            <span className="truncate">{screening.venue ?? 'Tokyo Theater'}</span>
          </p>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <h3 
            onClick={() => onOpenPoster(screening)}
            className="text-sm sm:text-base font-bold text-white leading-snug tracking-tight hover:text-[#ff3650] transition-colors cursor-pointer line-clamp-2 mb-1"
          >
            {title}
          </h3>
          {screening.theme && (
            <p className="text-xs text-[#ff3650] font-medium line-clamp-1">
              {screening.theme}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
          <div className="text-[11px] font-mono text-white/50">
            {screening.film_ids?.length ?? 0} {lang === 'zh' ? '部作品' : 'TITLES'}
          </div>

          <button
            onClick={() => onOpenPoster(screening)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#ff3650] hover:text-white transition-colors cursor-pointer"
          >
            <Ticket className="w-3 h-3" />
            <span>{lang === 'zh' ? '放映详情' : 'DETAILS'}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
};
