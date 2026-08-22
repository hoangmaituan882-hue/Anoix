import React from 'react';
import { WorkItem, Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { Play, ExternalLink, Film, User, Users, Calendar, Tv, Sparkles } from 'lucide-react';

interface FilmDetailBodyProps {
  work: WorkItem;
  lang: Language;
  onPlayTrailer?: (url: string) => void;
  /** Extra action rendered inside the footer action row (e.g. "full detail" link). */
  footerExtra?: React.ReactNode;
}

/**
 * Shared film detail content — the single source of truth for both the
 * quick-preview modal and the routed /films/:id page.
 */
export const FilmDetailBody: React.FC<FilmDetailBodyProps> = ({
  work,
  lang,
  onPlayTrailer,
  footerExtra,
}) => {
  const t = I18N[lang];

  const title = lang === 'zh' && work.titleZh ? work.titleZh : lang === 'en' && work.titleEn ? work.titleEn : work.title;
  const description = lang === 'zh' && work.descriptionZh ? work.descriptionZh : lang === 'en' && work.descriptionEn ? work.descriptionEn : work.description;

  return (
    <>
      {/* Hero Header */}
      <div className="relative aspect-video sm:aspect-[21/9] w-full bg-black overflow-hidden">
        <img
          src={work.landscapeImage || work.image}
          alt={title}
          className="w-full h-full object-cover object-center blur-xs opacity-50 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent" />

        <div className="absolute inset-0 p-6 sm:p-8 flex items-end">
          <div className="flex gap-5 sm:gap-6 items-end w-full">
            <img
              src={work.image}
              alt={title}
              className="hidden sm:block w-28 md:w-36 lg:w-40 aspect-[27/40] rounded-2xl object-cover shadow-2xl border-2 border-[#ff3650] flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="bg-[#ff3650] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  {work.category}
                </span>
                <span className="text-xs font-bold text-white/80 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/15">
                  <Calendar className="w-3.5 h-3.5 text-[#ff3650]" />
                  {work.year}
                </span>
                {work.isNew && (
                  <span className="bg-[#e0fe3d] text-[#121212] text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    NEW
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                {title}
              </h2>
              {work.tagline && (
                <p className="text-xs sm:text-sm text-[#f5ffe5]/85 italic mt-1.5 font-medium line-clamp-2">
                  {work.tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Story / Intro */}
        <div>
          <h3 className="text-xs font-black text-[#ff3650] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff3650]" />
            {lang === 'zh' ? '作品故事与介绍 · STORY' : 'STORY & INTRO'}
          </h3>
          <p className="text-base sm:text-lg text-white/90 leading-relaxed font-normal">
            {description}
          </p>
        </div>

        {/* Streaming Platforms (if available) */}
        {work.streamingPlatforms && work.streamingPlatforms.length > 0 && (
          <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-xs text-[#ff3650] font-black uppercase tracking-wider mb-2.5">
              <Tv className="w-4 h-4" />
              <span>{lang === 'zh' ? '播放与上线平台' : lang === 'ja' ? '配信・放送プラットフォーム' : 'Streaming Platforms'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {work.streamingPlatforms.map((platform, idx) => (
                <span
                  key={idx}
                  className="bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white border border-white/10 transition-colors"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Credits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {work.director && (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-[#ff3650] font-black uppercase tracking-wider mb-1">
                <User className="w-3.5 h-3.5" />
                <span>{t.directorLabel}</span>
              </div>
              <p className="font-bold text-white text-sm sm:text-base">{work.director}</p>
            </div>
          )}

          {work.characterDesign && (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-[#ff3650] font-black uppercase tracking-wider mb-1">
                <Film className="w-3.5 h-3.5" />
                <span>{t.designLabel}</span>
              </div>
              <p className="font-bold text-white text-sm sm:text-base">{work.characterDesign}</p>
            </div>
          )}

          {work.seriesComposition && (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-[#ff3650] font-black uppercase tracking-wider mb-1">
                <Film className="w-3.5 h-3.5" />
                <span>{t.seriesLabel}</span>
              </div>
              <p className="font-bold text-white text-sm sm:text-base">{work.seriesComposition}</p>
            </div>
          )}
        </div>

        {/* Cast */}
        {work.cast && work.cast.length > 0 && (
          <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-[#ff3650] font-black uppercase tracking-wider mb-2.5">
              <Users className="w-4 h-4" />
              <span>{t.castLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {work.cast.map((actor, idx) => (
                <span key={idx} className="bg-white/10 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white border border-white/10">
                  {actor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
          {work.trailerUrl && (
            <button
              onClick={() => {
                if (onPlayTrailer && work.trailerUrl) {
                  onPlayTrailer(work.trailerUrl);
                } else {
                  window.open(work.trailerUrl, '_blank');
                }
              }}
              className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#e02640] text-white px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t.playTrailer}</span>
            </button>
          )}

          {work.officialUrl && (
            <a
              href={work.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-colors border border-white/20"
            >
              <span>{t.officialSite}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {footerExtra}
        </div>
      </div>
    </>
  );
};
