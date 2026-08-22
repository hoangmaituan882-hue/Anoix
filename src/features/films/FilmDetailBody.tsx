import React from 'react';
import { WorkItem, Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { Play, ExternalLink, Film, User, Users, Calendar } from 'lucide-react';

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
          src={work.image}
          alt={title}
          className="w-full h-full object-cover object-center blur-xs opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent" />

        <div className="absolute inset-0 p-6 sm:p-8 flex items-end">
          <div className="flex gap-6 items-end">
            <img
              src={work.image}
              alt={title}
              className="hidden sm:block w-32 md:w-40 aspect-[27/40] rounded-xl object-cover shadow-2xl border-2 border-[#ff3650]"
            />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-[#ff3650] text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
                  {work.category}
                </span>
                <span className="text-xs font-bold text-white/70 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {work.year}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {title}
              </h2>
              {work.tagline && (
                <p className="text-xs sm:text-sm text-[#f5ffe5]/80 italic mt-1 font-medium">
                  {work.tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-sm font-black text-[#ff3650] uppercase tracking-wider mb-2">
            STORY & INTRO
          </h3>
          <p className="text-base sm:text-lg text-white/90 leading-relaxed font-normal">
            {description}
          </p>
        </div>

        {/* Credits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-sm">
          {work.director && (
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-[#ff3650] font-bold mb-1">
                <User className="w-3.5 h-3.5" />
                <span>{t.directorLabel}</span>
              </div>
              <p className="font-bold text-white">{work.director}</p>
            </div>
          )}

          {work.characterDesign && (
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-[#ff3650] font-bold mb-1">
                <Film className="w-3.5 h-3.5" />
                <span>{t.designLabel}</span>
              </div>
              <p className="font-bold text-white">{work.characterDesign}</p>
            </div>
          )}

          {work.seriesComposition && (
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-[#ff3650] font-bold mb-1">
                <Film className="w-3.5 h-3.5" />
                <span>{t.seriesLabel}</span>
              </div>
              <p className="font-bold text-white">{work.seriesComposition}</p>
            </div>
          )}
        </div>

        {/* Cast */}
        {work.cast && work.cast.length > 0 && (
          <div className="bg-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-[#ff3650] font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>{t.castLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {work.cast.map((actor, idx) => (
                <span key={idx} className="bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-white">
                  {actor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
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
