import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { fetchChannel, ChannelClip } from '../../lib/channel';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Clapperboard } from 'lucide-react';

interface MediaSectionProps {
  lang: Language;
}

const PLATFORM_LABEL: Record<string, string> = {
  bilibili: 'Bilibili',
  youtube: 'YouTube',
  other: '',
};

export const MediaSection: React.FC<MediaSectionProps> = ({ lang }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const t = I18N[lang];
  const [hubUrl, setHubUrl] = useState('');
  const [items, setItems] = useState<ChannelClip[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchChannel()
      .then((d) => {
        if (!alive) return;
        setHubUrl(d.hubUrl || '');
        setItems(d.items || []);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => { alive = false; };
  }, []);

  const scrollBy = (offset: number) => {
    sliderRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const openClip = (clip: ChannelClip) => {
    if (!clip.url) return;
    window.open(clip.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      id="cb_content_765"
      className="relative w-full py-20 md:py-32 px-4 sm:px-8 lg:px-16 overflow-hidden bg-[#0a0a0a]"
    >
      <div className="absolute top-4 left-0 right-0 overflow-hidden pointer-events-none opacity-10 flex justify-center">
        <h2
          className="text-[120px] sm:text-[200px] lg:text-[280px] font-black tracking-tighter text-white leading-none uppercase whitespace-nowrap"
          style={{ fontFamily: "'Fjordic-Heavy', 'Arial Black', sans-serif" }}
        >
          CHANNEL
        </h2>
      </div>

      <div className="relative max-w-7xl mx-auto z-10">
        <div className="mb-10 md:mb-14">
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-[#ff3650] uppercase mb-2">
            <Clapperboard className="w-4 h-4" />
            <span>OFFICIAL CHANNEL</span>
          </div>
          <h2
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase"
            style={{ fontFamily: "'Fjordic-Heavy', 'Arial Black', sans-serif" }}
          >
            {t.youtubeHeadline}
          </h2>
          <div className="w-16 h-1.5 bg-[#ff3650] mt-3 rounded-full" />
        </div>

        <div className="relative group/yt">
          <div
            ref={sliderRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items === null && (
              <p className="text-sm text-white/40 py-16">加载频道…</p>
            )}
            {items && items.length === 0 && (
              <p className="text-sm text-white/40 py-16">频道内容筹备中，请稍后再来。</p>
            )}
            {(items ?? []).map((video) => {
              const title = lang === 'zh' && video.titleZh ? video.titleZh : video.title;
              const plat = PLATFORM_LABEL[video.platform] || '';
              return (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    openClip(video);
                  }}
                  className="flex-shrink-0 w-[260px] sm:w-[320px] md:w-[360px] group/video cursor-pointer"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 group-hover/video:border-[#ff3650] transition-all duration-300">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={title}
                        className="w-full h-full object-cover group-hover/video:scale-108 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Play className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/video:bg-black/20 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-[#ff3650] text-white flex items-center justify-center shadow-2xl group-hover/video:scale-115 transition-transform duration-200">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    {plat && (
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-black px-2 py-0.5 rounded-md bg-black/70 border border-white/10">
                        {plat}
                      </span>
                    )}
                    {video.duration && (
                      <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                        {video.duration}
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover/video:text-[#ff3650] line-clamp-2 leading-snug transition-colors">
                      {title}
                    </h3>
                  </div>
                </a>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollBy(-360)}
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/80 border border-white/20 text-white items-center justify-center opacity-0 group-hover/yt:opacity-100 transition-opacity hover:bg-[#ff3650] hover:border-[#ff3650] shadow-xl z-10 cursor-pointer"
            aria-label="Previous Video"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(360)}
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/80 border border-white/20 text-white items-center justify-center opacity-0 group-hover/yt:opacity-100 transition-opacity hover:bg-[#ff3650] hover:border-[#ff3650] shadow-xl z-10 cursor-pointer"
            aria-label="Next Video"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {hubUrl ? (
          <div className="mt-12 flex justify-start">
            <a
              id="btn-channel-all"
              href={hubUrl}
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
        ) : null}
      </div>
    </section>
  );
};
