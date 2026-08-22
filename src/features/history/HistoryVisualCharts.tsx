import React from 'react';
import { StudioStats } from '../../types/history';
import { Language } from '../../types';
import { 
  PieChart, 
  Layers, 
  Users, 
  ArrowRight,
  Sparkles,
  Clapperboard
} from 'lucide-react';

interface HistoryVisualChartsProps {
  stats: StudioStats;
  lang: Language;
  onSelectFilm?: (filmId: string) => void;
}

export const HistoryVisualCharts: React.FC<HistoryVisualChartsProps> = ({
  stats,
  lang,
  onSelectFilm,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
      
      {/* Chart 1: Genre Breakdown (7 cols) */}
      <div className="lg:col-span-7 bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ff3650]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {lang === 'zh' ? '作品题材基因分布 (Genre Distribution)' : 'GENRE GENETICS DISTRIBUTION'}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-white/40">
              22 PRODUCTIONS
            </span>
          </div>

          <p className="text-xs text-white/60 mb-5 leading-relaxed">
            {lang === 'zh'
              ? 'TRIGGER 作品以极具辨识度的“绝顶动作”为基底，逐步向特摄机甲、温情奇幻与波普先锋多维延展。'
              : 'Defined by iconic hyper-dynamic action, expanding across tokusatsu mecha, ecological fantasy, and pop art experiments.'}
          </p>

          {/* Segmented Percentage Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden bg-black/60 flex mb-5 border border-white/10">
            {stats.genreBreakdown.map((item, idx) => (
              <div
                key={idx}
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                className="h-full transition-all duration-500 hover:opacity-90"
                title={`${item.genreZh}: ${item.percentage}%`}
              />
            ))}
          </div>

          {/* Detailed Item List */}
          <div className="space-y-3">
            {stats.genreBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <span className="font-bold text-white block">
                      {lang === 'zh' ? item.genreZh : item.genre}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {item.count} {lang === 'zh' ? '部作品' : 'works'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-white text-sm">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formats Mini Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {stats.formatBreakdown.map((fmt, idx) => (
            <div key={idx} className="bg-black/30 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-white/40 block">{lang === 'zh' ? fmt.formatZh.split(' ')[0] : fmt.format}</span>
              <span className="text-xs font-mono font-bold text-white">{fmt.count} 部</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Core Directors & Lineages (5 cols) */}
      <div className="lg:col-span-5 bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ff3650]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {lang === 'zh' ? '核心监督与主创系谱 (Directors)' : 'CORE DIRECTORS & LINEAGE'}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-white/40">
              AUTEUR CRAFT
            </span>
          </div>

          <p className="text-xs text-white/60 mb-4 leading-relaxed">
            {lang === 'zh'
              ? 'TRIGGER 始终坚持“创作者中心主义”，赋予监督极致的艺术自由度与作画表现空间。'
              : 'TRIGGER champions creator-driven storytelling, granting directors supreme visual freedom.'}
          </p>

          {/* Director Cards */}
          <div className="space-y-3">
            {stats.directorStats.map((d, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#ff3650]/40 transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white text-sm">
                      {lang === 'zh' ? d.nameZh : d.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#ff3650] bg-[#ff3650]/10 px-1.5 py-0.2 rounded">
                      {d.worksCount} WORKS
                    </span>
                  </div>

                  <span className="block text-[11px] text-white/40 mb-1">
                    {lang === 'zh' ? d.roleZh : d.role}
                  </span>

                  <span className="block text-[11px] text-white/80 font-medium line-clamp-1">
                    ✦ {lang === 'zh' ? d.iconicWorkZh : d.iconicWork}
                  </span>
                </div>

                {d.filmId && onSelectFilm && (
                  <button
                    onClick={() => onSelectFilm(d.filmId!)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-[#ff3650] text-white/70 hover:text-white transition-colors cursor-pointer self-center shrink-0"
                    title={lang === 'zh' ? '查看代表作详情' : 'View iconic film'}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
          <span>{lang === 'zh' ? '原画师・作画监督驱动模式' : 'Animator-driven Studio Culture'}</span>
          <span className="text-[#ff3650] font-bold">100% IN-HOUSE PASSION</span>
        </div>
      </div>

    </div>
  );
};
