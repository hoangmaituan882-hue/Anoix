import React from 'react';
import { motion } from 'motion/react';
import { HistoryEra } from '../../types/history';
import { Language, WorkItem } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  Award, 
  Tv, 
  Film as FilmIcon, 
  Globe 
} from 'lucide-react';

interface HistoryEraTimelineProps {
  eras: HistoryEra[];
  lang: Language;
  onSelectFilm?: (filmId: string) => void;
  films?: WorkItem[];
}

export const HistoryEraTimeline: React.FC<HistoryEraTimelineProps> = ({
  eras,
  lang,
  onSelectFilm,
  films = [],
}) => {
  return (
    <div className="space-y-12">
      {eras.map((era, eraIdx) => (
        <section key={era.id} className="relative">
          
          {/* Era Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-[#181818] border-l-4 border-[#ff3650] border-y border-r border-white/10 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono font-bold text-[#ff3650] bg-[#ff3650]/10 px-2.5 py-0.5 rounded">
                  {era.period}
                </span>
                <span className="text-xs text-white/40 uppercase font-mono">
                  ERA 0{eraIdx + 1}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {lang === 'zh' ? era.nameZh : era.name}
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                {lang === 'zh' ? era.taglineZh : era.tagline}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono text-white/40 block">
                {era.milestones.length} {lang === 'zh' ? '项重大纪事' : 'MILESTONES'}
              </span>
            </div>
          </div>

          {/* Timeline Milestones Track */}
          <div className="relative pl-3 sm:pl-6 space-y-6">
            {/* Axis Ruler */}
            <div className="absolute left-[20px] sm:left-[32px] top-3 bottom-3 w-px bg-white/15 pointer-events-none" />

            {era.milestones.map((m, mIdx) => (
              <motion.div
                key={mIdx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: mIdx * 0.05, ease: TRIGGER_EASE }}
                className="relative flex items-start gap-4 group"
              >
                {/* Node Dot */}
                <div className="flex flex-col items-center shrink-0 pt-2.5 z-10">
                  <div className="w-6 h-6 rounded-full bg-[#181818] border-2 border-[#ff3650] flex items-center justify-center group-hover:bg-[#ff3650] transition-colors duration-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="mt-1 text-[10px] font-mono font-bold text-white/40 group-hover:text-white transition-colors">
                    {m.year}
                  </span>
                </div>

                {/* Milestone Detail Card */}
                <div className="flex-1 bg-[#181818] border border-white/10 hover:border-[#ff3650]/60 rounded-xl p-4 sm:p-5 transition-colors duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono text-white bg-white/10 px-2 py-0.5 rounded">
                        {m.dateStr ?? m.year}
                      </span>
                      <span className="text-[10px] font-bold text-[#ff3650] bg-[#ff3650]/10 px-2 py-0.5 rounded border border-[#ff3650]/20">
                        {lang === 'zh' ? m.categoryLabelZh : m.categoryLabel}
                      </span>
                    </div>

                    {m.highlightStats && (
                      <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        {lang === 'zh' ? m.highlightStats.labelZh : m.highlightStats.label}: {m.highlightStats.value}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight mb-1.5">
                    {lang === 'zh' ? m.titleZh : m.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-3">
                    {lang === 'zh' ? m.descriptionZh : m.description}
                  </p>

                  {/* Footer Row: Director & Film Link */}
                  <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {m.director && (
                      <span className="text-white/50 text-[11px]">
                        {lang === 'zh' ? '监督 / 创作者: ' : 'Director: '}
                        <strong className="text-white/90 font-semibold">{lang === 'zh' ? m.directorZh : m.director}</strong>
                      </span>
                    )}

                    {m.filmId && onSelectFilm && (
                      <button
                        onClick={() => onSelectFilm(m.filmId!)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#ff3650] hover:text-white transition-colors cursor-pointer ml-auto"
                      >
                        <span>{lang === 'zh' ? '浏览收录作品' : 'View Film'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
