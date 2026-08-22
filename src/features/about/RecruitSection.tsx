import React from 'react';
import { Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { repository } from '../../lib/repository';
import { ArrowRight, Sparkles, Users, Award } from 'lucide-react';

interface RecruitSectionProps {
  lang: Language;
  onOpenRecruitModal: () => void;
  onOpenAboutModal: () => void;
}

export const RecruitSection: React.FC<RecruitSectionProps> = ({
  lang,
  onOpenRecruitModal,
  onOpenAboutModal,
}) => {
  const t = I18N[lang];

  return (
    <section
      id="cb_content_427"
      className="relative w-full min-h-[85vh] flex flex-col justify-center py-24 md:py-36 px-4 sm:px-8 lg:px-16 overflow-hidden bg-[#111111]"
    >
      {/* Background Graphic with dark overlay */}
      <div className="absolute inset-0 z-0">
        <picture className="w-full h-full">
          <source media="(max-width: 767px)" srcSet={repository.recruitImage()} />
          <img
            src={repository.recruitImage()}
            alt="Studio TRIGGER Studio Work Environment"
            className="w-full h-full object-cover object-center opacity-30 transform hover:scale-105 transition-transform duration-1000 ease-out"
            loading="lazy"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/70 to-[#111111]/80" />
      </div>

      {/* Giant Typography Background */}
      <div className="absolute top-8 left-0 right-0 overflow-hidden pointer-events-none opacity-10 flex justify-center z-0">
        <h2
          className="text-[120px] sm:text-[190px] lg:text-[280px] font-black tracking-tighter text-[#e0fe3d] leading-none uppercase whitespace-nowrap"
          style={{ fontFamily: "'Anton', 'Montserrat', sans-serif" }}
        >
          RECRUIT
        </h2>
      </div>

      <div className="relative max-w-6xl mx-auto z-10 w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e0fe3d]/20 border border-[#e0fe3d]/40 text-[#e0fe3d] text-xs font-black tracking-widest uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CAREERS & TALENT</span>
        </div>

        <h2
          className="text-5xl sm:text-7xl lg:text-8xl font-black text-[#e0fe3d] tracking-tight uppercase leading-none mb-8"
          style={{ fontFamily: "'Anton', 'Montserrat', sans-serif" }}
        >
          RECRUIT
        </h2>

        <div className="max-w-2xl">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-snug tracking-tight mb-4">
            {t.recruitTagline}
          </p>
          <p className="text-base sm:text-lg text-white/80 font-medium leading-relaxed mb-10">
            {t.recruitDesc}
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              id="btn-join-us"
              onClick={onOpenRecruitModal}
              className="design_button group/btn inline-flex items-center gap-3 bg-[#e0fe3d] text-[#121212] hover:bg-white px-8 py-3.5 rounded-full font-black text-base tracking-wider uppercase transition-all duration-300 shadow-xl hover:shadow-[0_8px_30px_rgba(224,254,61,0.35)] cursor-pointer"
            >
              <span className="label font-extrabold tracking-widest">
                {t.joinUs}
              </span>
              <span className="w-7 h-7 rounded-full bg-[#121212] text-[#e0fe3d] group-hover/btn:bg-[#e0fe3d] group-hover/btn:text-[#121212] flex items-center justify-center transition-transform group-hover/btn:translate-x-1 duration-200">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <button
              id="btn-recruit-about"
              onClick={onOpenAboutModal}
              className="design_button group/btn inline-flex items-center gap-3 bg-transparent border-2 border-white/40 text-white hover:border-[#e0fe3d] hover:text-[#e0fe3d] px-8 py-3.5 rounded-full font-black text-base tracking-wider uppercase transition-all duration-300 cursor-pointer"
            >
              <span className="label font-extrabold tracking-widest">
                {t.aboutUs}
              </span>
              <span className="w-7 h-7 rounded-full bg-white/10 group-hover/btn:bg-[#e0fe3d] group-hover/btn:text-[#121212] flex items-center justify-center transition-transform group-hover/btn:translate-x-1 duration-200">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
