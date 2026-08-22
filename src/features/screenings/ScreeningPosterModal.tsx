import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Screening } from '../../types/screening';
import { Language, WorkItem } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { ScreeningTicketStub } from './ScreeningTicketStub';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Volume2, 
  Award, 
  Ticket, 
  Film, 
  ExternalLink,
  Share2,
  Check
} from 'lucide-react';

interface ScreeningPosterModalProps {
  screening: Screening;
  lang: Language;
  onClose: () => void;
  onSelectFilm?: (filmId: string) => void;
  films?: WorkItem[];
}

export const ScreeningPosterModal: React.FC<ScreeningPosterModalProps> = ({
  screening,
  lang,
  onClose,
  onSelectFilm,
  films = [],
}) => {
  const [viewTab, setViewTab] = useState<'poster' | 'ticket'>('poster');
  const [copied, setCopied] = useState(false);

  const title = (lang === 'zh' && screening.title_zh)
    ? screening.title_zh
    : (lang === 'en' && screening.title_en)
      ? screening.title_en
      : screening.title;

  const recapText = (lang === 'zh' && screening.recap_zh)
    ? screening.recap_zh
    : screening.recap;

  const posterImage = screening.demo_poster_url || screening.poster_url || 'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/CPER2-2.jpg';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${title} - TRIGGER Screening`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25, ease: TRIGGER_EASE }}
        className="relative w-full max-w-4xl bg-[#161616] border border-white/15 rounded-2xl overflow-hidden shadow-2xl my-8 text-[#f5ffe5] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#121212] sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="flex p-0.5 bg-white/5 rounded-lg border border-white/10">
              <button
                onClick={() => setViewTab('poster')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewTab === 'poster'
                    ? 'bg-[#ff3650] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '演示海报' : 'POSTER'}</span>
              </button>
              <button
                onClick={() => setViewTab('ticket')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewTab === 'ticket'
                    ? 'bg-[#ff3650] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '放映票根' : 'TICKET'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
              title={lang === 'zh' ? '分享放映档案' : 'Share'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? (lang === 'zh' ? '已复制' : 'Copied') : (lang === 'zh' ? '分享' : 'Share')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-[#ff3650] text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1">
          {viewTab === 'poster' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Left 5 cols: Cinema Poster Showcase */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative w-full rounded-xl overflow-hidden border border-white/15 bg-black/60">
                  <div className="relative aspect-[27/38]">
                    <img
                      src={posterImage}
                      alt={title}
                      className="w-full h-full object-cover"
                    />

                    {/* Clean Badges */}
                    <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white border border-white/15">
                      {screening.screen_date}
                    </div>

                    <div className="absolute top-2.5 right-2.5 bg-[#ff3650] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      TRIGGER
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-center text-[11px] text-white/40">
                  {lang === 'zh' ? 'TRIGGER 影院特设放映官方海报档案' : 'Official Screening Poster Archive'}
                </p>
              </div>

              {/* Right 7 cols: Detailed Screening Record */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="bg-[#ff3650]/15 text-[#ff3650] text-xs font-bold px-2.5 py-0.5 rounded border border-[#ff3650]/20 font-mono">
                      {screening.screen_date}
                    </span>
                    {screening.format_tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-white/5 text-white/80 text-xs font-medium px-2 py-0.5 rounded border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1">
                    {title}
                  </h2>

                  {screening.theme && (
                    <p className="text-xs sm:text-sm font-semibold text-[#ff3650] mb-3">
                      {screening.theme}
                    </p>
                  )}
                </div>

                {/* Recap */}
                {recapText && (
                  <div className="bg-white/[0.02] p-3.5 rounded-xl border border-white/10">
                    <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
                      {lang === 'zh' ? '放映现场纪事' : 'SCREENING NOTES'}
                    </h4>
                    <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                      {recapText}
                    </p>
                  </div>
                )}

                {/* Info Key-Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                    <span className="block text-[10px] font-bold text-white/40 uppercase mb-1">
                      {lang === 'zh' ? '放映影院' : 'VENUE'}
                    </span>
                    <p className="text-xs font-semibold text-white flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#ff3650] shrink-0 mt-0.5" />
                      <span>{screening.venue ?? 'TOHO Cinemas Shinjuku'}</span>
                    </p>
                  </div>

                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10">
                    <span className="block text-[10px] font-bold text-white/40 uppercase mb-1">
                      {lang === 'zh' ? '放映时段' : 'TIME'}
                    </span>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/50 shrink-0" />
                      <span>{screening.time ?? '19:00 - 21:30'}</span>
                    </p>
                  </div>
                </div>

                {/* Special Guests */}
                {screening.special_guests && screening.special_guests.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#ff3650]" />
                      <span>{lang === 'zh' ? '登台主创与嘉宾' : 'SPECIAL GUESTS'}</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {screening.special_guests.map((g, idx) => (
                        <span
                          key={idx}
                          className="bg-white/10 text-white/90 text-xs font-medium px-2.5 py-0.5 rounded"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Perks */}
                {screening.ticket_perks && (
                  <div className="p-3 bg-[#ff3650]/10 rounded-xl border border-[#ff3650]/20 flex items-start gap-2.5">
                    <Award className="w-4 h-4 text-[#ff3650] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[11px] font-bold text-white uppercase">
                        {lang === 'zh' ? '入场限定特典' : 'ADMISSION PERKS'}
                      </span>
                      <p className="text-xs text-white/80 mt-0.5">
                        {screening.ticket_perks}
                      </p>
                    </div>
                  </div>
                )}

                {/* Related Film Catalogs */}
                {screening.film_ids && screening.film_ids.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Film className="w-3.5 h-3.5 text-white/50" />
                      <span>{lang === 'zh' ? '放映收录作品' : 'FEATURED WORKS'}</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {screening.film_ids.map((fid) => {
                        const targetFilm = films.find((f) => f.id === fid);
                        const filmTitle = targetFilm
                          ? ((lang === 'zh' && targetFilm.titleZh) || targetFilm.title)
                          : fid;
                        return (
                          <button
                            key={fid}
                            onClick={() => {
                              onClose();
                              if (onSelectFilm) onSelectFilm(fid);
                            }}
                            className="inline-flex items-center gap-1 bg-white/5 hover:bg-[#ff3650] text-white text-xs font-medium px-2.5 py-1 rounded transition-colors cursor-pointer border border-white/10"
                          >
                            <span>{filmTitle}</span>
                            <ExternalLink className="w-3 h-3 text-white/40" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Virtual Commemorative Ticket Stub View */
            <div className="py-4 flex flex-col items-center">
              <div className="w-full max-w-2xl">
                <ScreeningTicketStub
                  screening={screening}
                  lang={lang}
                  films={films}
                  onSelectFilm={onSelectFilm}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
