import React from 'react';
import { Screening } from '../../types/screening';
import { Language, WorkItem } from '../../types';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Volume2, 
  QrCode, 
} from 'lucide-react';

interface ScreeningTicketStubProps {
  screening: Screening;
  lang?: Language;
  onSelectFilm?: (filmId: string) => void;
  films?: WorkItem[];
}

export const ScreeningTicketStub: React.FC<ScreeningTicketStubProps> = ({
  screening,
  onSelectFilm,
  films = [],
}) => {
  const title = screening.title_zh || screening.title;

  return (
    <div className="w-full select-none">
      {/* Authentic Cinema Roadshow Ticket Card */}
      <div className="relative flex flex-col sm:flex-row bg-[#181818] border border-white/15 rounded-2xl overflow-hidden shadow-lg transition-colors">
        {/* Red Accent Header Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff3650]" />

        {/* Left / Main Ticket Section */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between relative">
          <div>
            {/* Top Meta Line */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#ff3650] text-white text-[11px] font-bold px-2.5 py-0.5 rounded">
                  TRIGGER 影院特设放映
                </span>
                <span className="text-[11px] font-mono text-white/50">
                  NO. {screening.id.toUpperCase()}
                </span>
              </div>
              <div className="text-[12px] text-white/60 font-bold">
                特设放映入场券
              </div>
            </div>

            {/* Title: 18px Bold */}
            <h3 className="text-[18px] font-bold text-white tracking-tight leading-snug mb-1">
              {title}
            </h3>

            {/* Subtitle / Theme: 14px */}
            {screening.theme && (
              <p className="text-[14px] text-[#ff3650] font-semibold mb-3">
                {screening.theme}
              </p>
            )}

            {/* Key-Value Ticket Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-black/40 p-3 rounded-xl border border-white/10 text-xs mb-3">
              <div>
                <span className="block text-[11px] font-normal text-white/40 mb-0.5">
                  放映日期
                </span>
                <span className="font-bold text-white flex items-center gap-1 text-[12px]">
                  <Calendar className="w-3 h-3 text-[#ff3650]" />
                  {screening.screen_date}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-normal text-white/40 mb-0.5">
                  开映时间
                </span>
                <span className="font-bold text-white flex items-center gap-1 text-[12px]">
                  <Clock className="w-3 h-3 text-white/50" />
                  {screening.time ? screening.time.split(' ')[0] : '19:00'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-normal text-white/40 mb-0.5">
                  音响规格
                </span>
                <span className="font-bold text-white/90 flex items-center gap-1 text-[12px]">
                  <Volume2 className="w-3 h-3 text-[#ff3650]" />
                  {screening.format_tags?.[0] ?? '杜比全景声'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-normal text-white/40 mb-0.5">
                  座位规则
                </span>
                <span className="font-bold text-white text-[12px]">
                  全场对号入座
                </span>
              </div>
            </div>
          </div>

          {/* Venue & Featured Films Row */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[12px] text-white/70">
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#ff3650] shrink-0" />
              <span>{screening.venue ?? 'TOHO 影院新宿'}</span>
            </div>

            {/* Film Badges */}
            {screening.film_ids && (
              <div className="flex flex-wrap items-center gap-1">
                {screening.film_ids.map((fid) => {
                  const targetFilm = films.find((f) => f.id === fid);
                  const filmTitle = targetFilm
                    ? (targetFilm.titleZh || targetFilm.title)
                    : fid;
                  return (
                    <button
                      key={fid}
                      onClick={() => onSelectFilm && onSelectFilm(fid)}
                      className="text-[11px] font-medium text-white/80 bg-white/5 hover:bg-[#ff3650] hover:text-white px-2 py-0.5 rounded transition-colors cursor-pointer border border-white/10"
                    >
                      {filmTitle}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Perforated Stub Line Divider */}
        <div className="relative flex sm:flex-col items-center justify-between py-0 sm:py-2 px-2 sm:px-0">
          <div className="w-4 h-4 rounded-full bg-[#121212] -ml-2 sm:ml-0 sm:-mt-2" />
          <div className="flex-1 border-t sm:border-t-0 sm:border-l border-dashed border-white/20 my-1 sm:my-0 w-full sm:w-auto" />
          <div className="w-4 h-4 rounded-full bg-[#121212] -mr-2 sm:mr-0 sm:-mb-2" />
        </div>

        {/* Right / Stub Section */}
        <div className="w-full sm:w-44 bg-black/50 p-5 sm:p-6 flex flex-col items-center justify-between text-center shrink-0">
          <div className="w-full">
            <span className="text-[11px] font-bold text-white/40 block mb-2">
              入场核销二维码
            </span>
            <div className="w-24 h-24 bg-white p-2 rounded-xl mx-auto shadow-md flex items-center justify-center">
              <QrCode className="w-full h-full text-black" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 w-full">
            <span className="text-[10px] text-white/40 block">
              扫码登记放映资历
            </span>
            <span className="text-[12px] font-bold text-[#ff3650] font-mono">
              ★ 官方认证票根
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
