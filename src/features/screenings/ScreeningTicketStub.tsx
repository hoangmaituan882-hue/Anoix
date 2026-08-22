import React from 'react';
import { motion } from 'motion/react';
import { Screening } from '../../types/screening';
import { Language, WorkItem } from '../../types';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Volume2, 
  Users, 
  QrCode, 
  Award,
  Film
} from 'lucide-react';

interface ScreeningTicketStubProps {
  screening: Screening;
  lang: Language;
  onSelectFilm?: (filmId: string) => void;
  films?: WorkItem[];
}

export const ScreeningTicketStub: React.FC<ScreeningTicketStubProps> = ({
  screening,
  lang,
  onSelectFilm,
  films = [],
}) => {
  const title = (lang === 'zh' && screening.title_zh) 
    ? screening.title_zh 
    : (lang === 'en' && screening.title_en) 
      ? screening.title_en 
      : screening.title;

  return (
    <div className="w-full select-none">
      {/* Authentic Japanese Cinema Roadshow Ticket Card */}
      <div className="relative flex flex-col sm:flex-row bg-[#181818] border border-white/15 rounded-2xl overflow-hidden shadow-lg">
        
        {/* Red Accent Header Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff3650]" />

        {/* Left / Main Ticket Section */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between relative">
          <div>
            {/* Top Meta Line */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#ff3650] text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                  TRIGGER THEATER ROADSHOW
                </span>
                <span className="text-[11px] font-mono text-white/50">
                  NO. {screening.id.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] font-mono text-white/60 font-bold">
                {lang === 'zh' ? '特设放映入场券' : 'SPECIAL ADMISSION TICKET'}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug mb-1">
              {title}
            </h3>

            {/* Subtitle / Theme */}
            {screening.theme && (
              <p className="text-xs sm:text-sm text-[#ff3650] font-semibold mb-3.5">
                {screening.theme}
              </p>
            )}

            {/* Key-Value Ticket Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/40 p-3 rounded-xl border border-white/10 text-xs mb-3">
              <div>
                <span className="block text-[10px] uppercase font-bold text-white/40 mb-0.5">
                  {lang === 'zh' ? '放映日期' : 'DATE'}
                </span>
                <span className="font-mono font-bold text-white flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#ff3650]" />
                  {screening.screen_date}
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold text-white/40 mb-0.5">
                  {lang === 'zh' ? '开映时间' : 'TIME'}
                </span>
                <span className="font-mono font-bold text-white flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/50" />
                  {screening.time ? screening.time.split(' ')[0] : '19:00'}
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold text-white/40 mb-0.5">
                  {lang === 'zh' ? '音响规格' : 'AUDIO'}
                </span>
                <span className="font-mono font-medium text-white/90 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-[#ff3650]" />
                  {screening.format_tags?.[0] ?? 'Dolby Atmos'}
                </span>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold text-white/40 mb-0.5">
                  {lang === 'zh' ? '席位' : 'SEAT'}
                </span>
                <span className="font-mono font-bold text-white">
                  ALL SEATS RESERVED
                </span>
              </div>
            </div>
          </div>

          {/* Venue & Featured Films Row */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#ff3650] shrink-0" />
              <span>{screening.venue ?? 'TOHO Cinemas Shinjuku'}</span>
            </div>

            {/* Film Badges */}
            {screening.film_ids && (
              <div className="flex flex-wrap items-center gap-1">
                {screening.film_ids.map((fid) => {
                  const targetFilm = films.find((f) => f.id === fid);
                  const filmTitle = targetFilm
                    ? ((lang === 'zh' && targetFilm.titleZh) || targetFilm.title)
                    : fid;
                  return (
                    <button
                      key={fid}
                      onClick={() => onSelectFilm && onSelectFilm(fid)}
                      className="text-[10px] font-medium text-white/80 bg-white/5 hover:bg-[#ff3650] hover:text-white px-2 py-0.5 rounded transition-colors cursor-pointer border border-white/10"
                    >
                      {filmTitle}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Perforated Dotted Divider Line */}
        <div className="relative flex sm:flex-col items-center justify-between my-0 sm:my-3">
          {/* Top cutout */}
          <div className="w-4 h-4 rounded-full bg-[#121212] -mt-2 -ml-2 sm:-ml-2 sm:-mt-5 border border-white/10" />
          {/* Dashed line */}
          <div className="flex-1 border-t sm:border-t-0 sm:border-l-2 border-dashed border-white/20 w-full sm:w-0 sm:h-full my-1 sm:my-0" />
          {/* Bottom cutout */}
          <div className="w-4 h-4 rounded-full bg-[#121212] -mb-2 -mr-2 sm:-mr-2 sm:-mb-5 border border-white/10" />
        </div>

        {/* Right / Stub Section (Tear-off Part) */}
        <div className="w-full sm:w-48 p-4 sm:p-5 bg-black/30 flex flex-col justify-between items-center sm:items-end text-right border-t sm:border-t-0 sm:border-l border-white/10">
          <div className="w-full flex items-center justify-between sm:justify-end gap-2">
            <span className="text-[10px] font-bold text-[#ff3650] uppercase tracking-widest">
              STUB
            </span>
            <span className="text-[10px] font-mono text-white/50">
              AUDITORIUM 01
            </span>
          </div>

          {/* Clean Barcode & QR Code */}
          <div className="my-2 flex items-center justify-center gap-2.5 w-full">
            <div className="p-1 bg-white rounded">
              <QrCode className="w-8 h-8 text-black" />
            </div>
            <div className="flex flex-col gap-0.5 justify-center">
              <div className="flex gap-0.5 h-6 items-center">
                {[3, 1, 4, 1, 2, 4, 2, 3, 1, 4, 2, 1, 3, 1, 3].map((w, i) => (
                  <div
                    key={i}
                    className="bg-white/60 h-full rounded-xs"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
              <span className="text-[8px] font-mono text-white/40 tracking-wider text-center">
                TRG-2026-CINEMA
              </span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between text-[10px] font-mono text-white/50 pt-2 border-t border-white/10">
            <span>TRIGGER INC.</span>
            <span className="text-white/80 font-bold">{screening.screen_date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
