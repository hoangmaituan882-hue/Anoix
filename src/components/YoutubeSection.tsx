import React, { useRef } from 'react';
import { YoutubeItem, Language } from '../types';
import { YOUTUBE_LIST, I18N } from '../data/triggerData';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Youtube } from 'lucide-react';

interface YoutubeSectionProps {
  lang: Language;
  onSelectVideo: (video: YoutubeItem) => void;
}

export const YoutubeSection: React.FC<YoutubeSectionProps> = ({
  lang,
  onSelectVideo,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const t = I18N[lang];

  const scrollBy = (offset: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="cb_content_765"
      className="relative w-full py-20 md:py-32 px-4 sm:px-8 lg:px-16 overflow-hidden bg-[#0a0a0a]"
    >
      {/* Giant Typography Background */}
      <div className="absolute top-4 left-0 right-0 overflow-hidden pointer-events-none opacity-10 flex justify-center">
        <h2
          className="text-[120px] sm:text-[200px] lg:text-[280px] font-black tracking-tighter text-white leading-none uppercase whitespace-nowrap"
          style={{ fontFamily: "'Anton', 'Montserrat', sans-serif" }}
        >
          YOUTUBE
        </h2>
      </div>

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Section Header */}
        <div className="mb-10 md:mb-14">
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-[#ff3650] uppercase mb-2">
            <Youtube className="w-4 h-4" />
            <span>TRIGGER OFFICIAL CHANNEL</span>
          </div>
          <h2
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase"
            style={{ fontFamily: "'Anton', 'Montserrat', sans-serif" }}
          >
            {t.youtubeHeadline}
          </h2>
          <div className="w-16 h-1.5 bg-[#ff3650] mt-3 rounded-full" />
        </div>

        {/* Carousel Slider */}
        <div className="relative group/yt">
          <div
            ref={sliderRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {YOUTUBE_LIST.map((video) => (
              <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className="flex-shrink-0 w-[260px] sm:w-[320px] md:w-[360px] group/video cursor-pointer"
              >
                {/* 16:9 Thumbnail with YouTube Play Badge */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 group-hover/video:border-[#ff3650] transition-all duration-300">
                  <img
                    src={video.thumbnail}
                    alt={lang === 'zh' && video.titleZh ? video.titleZh : lang === 'en' && video.titleEn ? video.titleEn : video.title}
                    className="w-full h-full object-cover group-hover/video:scale-108 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/video:bg-black/20 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[#ff3650] text-white flex items-center justify-center shadow-2xl group-hover/video:scale-115 transition-transform duration-200">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {video.duration && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                      {video.duration}
                    </div>
                  )}
                </div>

                {/* Title and stats */}
                <div className="mt-3">
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover/video:text-[#ff3650] line-clamp-2 leading-snug transition-colors">
                    {lang === 'zh' && video.titleZh ? video.titleZh : lang === 'en' && video.titleEn ? video.titleEn : video.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-white/50 font-medium mt-1.5">
                    {video.views && <span>{video.views}</span>}
                    {video.date && <span>{video.date}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => scrollBy(-360)}
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/80 border border-white/20 text-white items-center justify-center opacity-0 group-hover/yt:opacity-100 transition-opacity hover:bg-[#ff3650] hover:border-[#ff3650] shadow-xl z-10 cursor-pointer"
            aria-label="Previous Video"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scrollBy(360)}
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/80 border border-white/20 text-white items-center justify-center opacity-0 group-hover/yt:opacity-100 transition-opacity hover:bg-[#ff3650] hover:border-[#ff3650] shadow-xl z-10 cursor-pointer"
            aria-label="Next Video"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Action Button: VIEW ALL */}
        <div className="mt-12 flex justify-start">
          <a
            id="btn-youtube-all"
            href="https://www.youtube.com/user/studiotrigger"
            target="_blank"
            rel="noopener noreferrer"
            className="design_button group/btn inline-flex items-center gap-3 bg-[#f5ffe5] text-[#121212] hover:bg-[#ff3650] hover:text-white px-8 py-3.5 rounded-full font-black text-sm md:text-base tracking-wider uppercase transition-all duration-300 shadow-xl hover:shadow-[0_8px_25px_rgba(255,54,80,0.4)]"
          >
            <span className="label font-extrabold tracking-widest">
              {t.viewAll}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#121212] text-[#f5ffe5] group-hover/btn:bg-white group-hover/btn:text-[#ff3650] flex items-center justify-center transition-transform group-hover/btn:translate-x-1 duration-200">
              <ArrowRight className="w-4 h-4" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};
