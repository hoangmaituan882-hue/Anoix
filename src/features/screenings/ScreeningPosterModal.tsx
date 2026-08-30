import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Screening } from '../../types/screening';
import { Language, WorkItem } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { ScreeningTicketStub } from './ScreeningTicketStub';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
  Share2,
  Check
} from 'lucide-react';

interface ScreeningPosterModalProps {
  screening: Screening;
  lang?: Language;
  onClose: () => void;
  onSelectFilm?: (filmId: string) => void;
  films?: WorkItem[];
}

export const ScreeningPosterModal: React.FC<ScreeningPosterModalProps> = ({
  screening,
  lang = 'zh',
  onClose,
  onSelectFilm,
  films = [],
}) => {
  const [viewTab, setViewTab] = useState<'poster' | 'ticket'>('poster');
  const [copied, setCopied] = useState(false);

  const title = screening.title_zh || screening.title;
  const recapText = screening.recap_zh || screening.recap;
  const posterImage = screening.demo_poster_url || screening.poster_url || 'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/CPER2-2.jpg';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${title} - TRIGGER 特设放映会`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: TRIGGER_EASE }}
        className="relative w-full max-w-4xl bg-[#141416] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            {/* View Switcher: Poster vs Ticket Stub via Motion Tabs */}
            <Tabs
              value={viewTab}
              onValueChange={(v) => setViewTab(v as 'poster' | 'ticket')}
              variant="pill"
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="poster" className="flex items-center gap-1.5 text-[12px]">
                  <Film className="w-3.5 h-3.5" />
                  <span>特设海报</span>
                </TabsTrigger>
                <TabsTrigger value="ticket" className="flex items-center gap-1.5 text-[12px]">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>放映票根</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer text-[12px] flex items-center gap-1.5 font-bold"
              title="分享放映档案"
            >
              <span className="t-icon-swap-slot w-3.5 h-3.5">
                <Check className={`w-3.5 h-3.5 text-emerald-400 ${copied ? 'is-active' : ''}`} />
                <Share2 className={`w-3.5 h-3.5 ${!copied ? 'is-active' : ''}`} />
              </span>
              <span className="hidden sm:inline">{copied ? '已复制' : '分享'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-[#ff3650] text-white transition-colors cursor-pointer"
              aria-label="关闭弹窗"
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
                <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-lg">
                  <div className="relative aspect-[27/38]">
                    <img
                      src={posterImage}
                      alt={title}
                      className="w-full h-full object-cover"
                    />

                    {/* Date Badge */}
                    <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white border border-white/15">
                      {screening.screen_date}
                    </div>

                    <div className="absolute top-2.5 right-2.5 bg-[#ff3650] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      TRIGGER
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-center text-[12px] text-white/40">
                  放映海报
                </p>
              </div>

              {/* Right 7 cols: Detailed Screening Record */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="bg-[#ff3650]/15 text-[#ff3650] text-[12px] font-bold px-2.5 py-0.5 rounded-full border border-[#ff3650]/20">
                      {screening.screen_date}
                    </span>
                    {screening.format_tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-white/5 text-white/80 text-[12px] font-medium px-2.5 py-0.5 rounded-full border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Main Title: 24px Bold */}
                  <h2 className="text-[24px] font-black text-white leading-tight mb-1">
                    {title}
                  </h2>

                  {screening.theme && (
                    <p className="text-[14px] font-semibold text-[#ff3650] mb-3">
                      {screening.theme}
                    </p>
                  )}
                </div>

                {/* Recap */}
                {recapText && (
                  <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/10">
                    <h4 className="text-[12px] font-bold text-white/50 mb-1.5">
                      放映现场纪事
                    </h4>
                    <p className="text-[14px] text-white/85 leading-[1.55]">
                      {recapText}
                    </p>
                  </div>
                )}

                {/* Info Key-Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/10">
                    <span className="block text-[11px] font-normal text-white/40 mb-1">
                      放映影院
                    </span>
                    <p className="text-[12px] font-bold text-white flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#ff3650] shrink-0 mt-0.5" />
                      <span>{screening.venue ?? 'TOHO 影院新宿'}</span>
                    </p>
                  </div>

                  <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/10">
                    <span className="block text-[11px] font-normal text-white/40 mb-1">
                      放映时段
                    </span>
                    <p className="text-[12px] font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/50 shrink-0" />
                      <span>{screening.time ?? '19:00 - 21:30'}</span>
                    </p>
                  </div>
                </div>

                {/* Special Guests */}
                {screening.special_guests && screening.special_guests.length > 0 && (
                  <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/10">
                    <span className="block text-[11px] font-normal text-white/40 mb-1.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#ff3650]" />
                      <span>现场特邀主创嘉宾</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {screening.special_guests.map((guest, idx) => (
                        <span
                          key={idx}
                          className="bg-white/5 text-white/90 text-[12px] font-bold px-2.5 py-1 rounded-full border border-white/10 shadow-xs"
                        >
                          {guest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ticket Perks */}
                {screening.ticket_perks && (
                  <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/10">
                    <span className="block text-[11px] font-normal text-white/40 mb-1 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[#ff3650]" />
                      <span>限定入场特典</span>
                    </span>
                    <p className="text-[14px] font-bold text-white/90">
                      {screening.ticket_perks}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-2">
              <ScreeningTicketStub
                screening={screening}
                onSelectFilm={onSelectFilm}
                films={films}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
