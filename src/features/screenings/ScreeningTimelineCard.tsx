import React from 'react';
import { motion } from 'motion/react';
import { Screening } from '../../types/screening';
import { Language, WorkItem } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Award, 
  Film, 
  ArrowRight,
  Eye,
  Ticket
} from 'lucide-react';

interface ScreeningTimelineCardProps {
  screening: Screening;
  lang: Language;
  index: number;
  onOpenPoster: (screening: Screening) => void;
  onSelectFilm?: (filmId: string) => void;
  films?: WorkItem[];
}

export const ScreeningTimelineCard: React.FC<ScreeningTimelineCardProps> = ({
  screening,
  lang,
  index,
  onOpenPoster,
  onSelectFilm,
  films = [],
}) => {
  const title = (lang === 'zh' && screening.title_zh)
    ? screening.title_zh
    : (lang === 'en' && screening.title_en)
      ? screening.title_en
      : screening.title;

  const recapText = (lang === 'zh' && screening.recap_zh)
    ? screening.recap_zh
    : screening.recap;

  const poster = screening.demo_poster_url || screening.poster_url || 'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/CPER2-2.jpg';
  const year = screening.screen_date.split('.')[0] || screening.screen_date.slice(0, 4);

  return (
    <div className="relative flex items-start gap-4 sm:gap-6 group">
      
      {/* Central / Left Timeline Axis Node */}
      <div className="flex flex-col items-center shrink-0 pt-3 z-10">
        {/* Crisp Studio Dot */}
        <div className="w-8 h-8 rounded-full bg-[#181818] border-2 border-[#ff3650] flex items-center justify-center group-hover:bg-[#ff3650] transition-colors duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff3650] group-hover:bg-white transition-colors duration-200" />
        </div>

        {/* Year indicator */}
        <span className="mt-1.5 text-[11px] font-mono font-bold text-white/50 group-hover:text-white transition-colors">
          {year}
        </span>
      </div>

      {/* Main Screening Content Card - Optimized Information Density */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: TRIGGER_EASE }}
        className="flex-1 bg-[#181818] border border-white/10 hover:border-[#ff3650]/60 rounded-2xl p-4 sm:p-6 transition-colors duration-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          
          {/* Left / Poster Column (3.5 cols) */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center">
            <div 
              onClick={() => onOpenPoster(screening)}
              className="relative w-full aspect-[27/38] rounded-xl overflow-hidden border border-white/10 cursor-pointer group/poster bg-black/60"
            >
              <img
                src={poster}
                alt={title}
                className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              {/* Clean Dark Hover Overlay */}
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/poster:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center">
                <span className="bg-[#ff3650] text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{lang === 'zh' ? '检视海报与票根' : 'Inspect Poster'}</span>
                </span>
              </div>

              {/* Date Chip */}
              <div className="absolute top-2 left-2 bg-black/85 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white border border-white/10">
                {screening.screen_date}
              </div>

              {screening.status === 'upcoming' && (
                <div className="absolute top-2 right-2 bg-[#ff3650] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  UPCOMING
                </div>
              )}
            </div>

            <button
              onClick={() => onOpenPoster(screening)}
              className="mt-2 text-[11px] font-bold text-white/50 hover:text-[#ff3650] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Ticket className="w-3 h-3 text-[#ff3650]" />
              <span>{lang === 'zh' ? '查看高清海报 / 票根' : 'HD Poster & Ticket'}</span>
            </button>
          </div>

          {/* Right / Details Column (8.5 cols) */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-between h-full">
            <div>
              {/* Meta Tags Row */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-[#ff3650] bg-[#ff3650]/10 px-2.5 py-0.5 rounded border border-[#ff3650]/20">
                  <Calendar className="w-3 h-3" />
                  {screening.screen_date}
                </span>

                {screening.time && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-white/70 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                    <Clock className="w-3 h-3 text-white/40" />
                    {screening.time}
                  </span>
                )}

                {screening.format_tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium text-white/80 bg-white/5 px-2 py-0.5 rounded border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title & Theme */}
              <h3 
                onClick={() => onOpenPoster(screening)}
                className="text-lg sm:text-xl font-bold text-white leading-snug tracking-tight hover:text-[#ff3650] transition-colors cursor-pointer mb-1"
              >
                {title}
              </h3>

              {screening.theme && (
                <p className="text-xs sm:text-sm font-semibold text-[#ff3650] mb-2.5">
                  {screening.theme}
                </p>
              )}

              {/* Venue */}
              {screening.venue && (
                <div className="flex items-center gap-1.5 text-xs text-white/75 font-medium mb-3">
                  <MapPin className="w-3.5 h-3.5 text-[#ff3650] shrink-0" />
                  <span>{screening.venue}</span>
                </div>
              )}

              {/* Structured Specs Grid - Clean & Dense */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs bg-white/[0.02] p-3 rounded-xl border border-white/5">
                {/* Special Guests */}
                {screening.special_guests && screening.special_guests.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">
                      {lang === 'zh' ? '登台嘉宾 GUESTS' : 'GUESTS'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {screening.special_guests.map((g, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] text-white/90 bg-white/10 px-2 py-0.5 rounded"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admission Perks */}
                {screening.ticket_perks && (
                  <div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">
                      {lang === 'zh' ? '入场特典 PERKS' : 'ADMISSION PERKS'}
                    </span>
                    <p className="text-[11px] text-white/80 line-clamp-2">
                      {screening.ticket_perks}
                    </p>
                  </div>
                )}
              </div>

              {/* Recap Summary */}
              {recapText && (
                <p className="text-xs text-white/70 leading-relaxed mb-4 pl-3 border-l-2 border-[#ff3650]/50">
                  {recapText}
                </p>
              )}
            </div>

            {/* Bottom Controls & Featured Films */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              {/* Featured Films */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-white/40 uppercase">
                  {lang === 'zh' ? '放映作品:' : 'FILMS:'}
                </span>
                {screening.film_ids?.map((fid) => {
                  const targetFilm = films.find((f) => f.id === fid);
                  const filmTitle = targetFilm
                    ? ((lang === 'zh' && targetFilm.titleZh) || (lang === 'en' && targetFilm.titleEn) || targetFilm.title)
                    : fid;
                  return (
                    <button
                      key={fid}
                      onClick={() => onSelectFilm && onSelectFilm(fid)}
                      className="text-[11px] font-medium text-white/80 bg-white/5 hover:bg-[#ff3650] hover:text-white px-2.5 py-0.5 rounded transition-colors cursor-pointer border border-white/10"
                    >
                      {filmTitle}
                    </button>
                  );
                })}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onOpenPoster(screening)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#ff3650] hover:bg-[#ff203c] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ml-auto"
              >
                <span>{lang === 'zh' ? '查看详情与票根' : 'Details & Ticket'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
};
