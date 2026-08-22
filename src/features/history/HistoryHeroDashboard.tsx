import React from 'react';
import { StudioStats } from '../../types/history';
import { Language } from '../../types';
import { DarkDiagnosticCarousel } from './DentalCheckCard';
import { 
  Flame, 
  Film, 
  Tv, 
  Trophy, 
  Award,
} from 'lucide-react';

interface HistoryHeroDashboardProps {
  stats: StudioStats;
  lang: Language;
}

export const HistoryHeroDashboard: React.FC<HistoryHeroDashboardProps> = ({ stats, lang }) => {
  return (
    <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-7 mb-10">
      
      {/* 2-Column Responsive Layout: Left Text & Metrics, Right Diagnostic Carousel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Title, Intro & 4 Stats Cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full">
          <div>
            {/* Top Header Section */}
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#ff3650] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                TRIGGER CHRONICLES
              </span>
              <span className="text-xs font-mono text-white/50">
                EST. 2011.08.22 TOKYO
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-2.5">
              {lang === 'zh' ? 'TRIGGER 历史编年史与创作数据' : 'STUDIO CHRONICLES & DATA ARCHIVE'}
            </h1>

            <p className="text-xs sm:text-sm text-white/60 font-normal max-w-xl leading-relaxed mb-6">
              {lang === 'zh'
                ? '自 2011 年由今石洋之与大冢雅彦创立至今，记录 15 年来 22 部动画大作的诞生轨迹、核心监督系谱与深层创作基因数据。'
                : 'Official visual archive documenting 15 years of boundary-pushing anime, core creator lineages, and deep production data from 2011 to 2026.'}
            </p>
          </div>

          {/* 4 Big Data Numbers in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 pt-4 border-t border-white/10">
            {/* Metric 1 */}
            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/40 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {lang === 'zh' ? '创制作品总量' : 'TOTAL WORKS'}
                </span>
                <Film className="w-3.5 h-3.5 text-[#ff3650]" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {stats.totalWorks}
                  <span className="text-[10px] font-normal text-white/40 ml-1">TITLES</span>
                </span>
                <span className="block text-[10px] text-white/50 mt-0.5 truncate">
                  {lang === 'zh' ? '含TV/剧场版/独占短篇' : 'TV, Movies, Shorts'}
                </span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/40 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {lang === 'zh' ? 'TV 连续剧集' : 'TV SERIES'}
                </span>
                <Tv className="w-3.5 h-3.5 text-white/70" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {stats.totalTvSeries}
                  <span className="text-[10px] font-normal text-white/40 ml-1">SEASONS</span>
                </span>
                <span className="block text-[10px] text-white/50 mt-0.5 truncate">
                  {lang === 'zh' ? '《斩服少女》至《迷宫饭》' : 'KLK to Dungeon Meshi'}
                </span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/40 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {lang === 'zh' ? '院线剧场版' : 'THEATRICAL FILMS'}
                </span>
                <Award className="w-3.5 h-3.5 text-[#ff3650]" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {stats.theatricalFilms}
                  <span className="text-[10px] font-normal text-white/40 ml-1">MOVIES</span>
                </span>
                <span className="block text-[10px] text-white/50 mt-0.5 truncate">
                  {lang === 'zh' ? '《普罗米亚》《古立特宇宙》' : 'Promare, Gridman'}
                </span>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-white/40 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {lang === 'zh' ? '全球荣誉' : 'AWARDS'}
                </span>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {stats.globalNominations}+
                  <span className="text-[10px] font-normal text-white/40 ml-1">HONORS</span>
                </span>
                <span className="block text-[10px] text-white/50 mt-0.5 truncate">
                  {lang === 'zh' ? 'CR年度最佳、星云赏等' : 'Crunchyroll & Seiun'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dark Diagnostic Carousel Component (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <DarkDiagnosticCarousel />
        </div>

      </div>
    </div>
  );
};
