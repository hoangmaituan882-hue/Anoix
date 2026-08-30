import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Award, ArrowRight } from 'lucide-react';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { openLeaderboardModal } from './LeaderboardModal';
import { HoursSpectrum } from './HoursSpectrum';
import { getSession } from '../../lib/session';
import {
  EMPTY_RANKING,
  RankingPayload,
  fetchRanking,
} from '../../lib/ranking';

interface ScreeningStandingCardProps {
  className?: string;
}

export const ScreeningStandingCard: React.FC<ScreeningStandingCardProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<RankingPayload>(EMPTY_RANKING);

  useEffect(() => {
    let alive = true;
    (async () => {
      await getSession();
      try {
        const payload = await fetchRanking();
        if (alive) setData(payload);
      } catch {
        if (alive) setData(EMPTY_RANKING);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const ranked = data.me?.rank != null;
  const rank = data.me?.rank ?? null;
  const hours = data.me?.hours ?? 0;
  const filmsCount = data.me?.filmsCount ?? 0;
  const beatRatio = data.me?.beatRatio ?? 0;
  const percentile = data.me?.percentile;
  const highlightIndex = ranked ? data.me?.bucketIndex ?? null : null;

  return (
    <div
      className={`rounded-2xl p-5 bg-white dark:bg-white border border-[#e5e7eb] dark:border-black/10 shadow-sm text-neutral-900 dark:text-white transition-colors ${className}`}
    >
      <div className="flex items-center justify-between pb-3.5 border-b border-[#e5e7eb] dark:border-black/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
              全站放映时长位次
            </h3>
            <p className="text-[10px] font-mono text-neutral-400 dark:text-[#737373]">
              CLUB WATCHED HOURS · LIFETIME
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-white/90 border border-black/5 dark:border-black/10">
          {percentile ?? (ranked ? '' : '未上榜')}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 py-4 border-b border-[#e5e7eb] dark:border-black/10">
        <div className="bg-[#f9fafb] dark:bg-white p-3 rounded-xl border border-[#e5e7eb] dark:border-black/5">
          <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
            全站位次
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            {ranked && rank != null ? (
              <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
                <AnimatedNumber value={rank} prefix="#" duration={0.8} />
              </span>
            ) : (
              <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white">#—</span>
            )}
          </div>
        </div>

        <div className="bg-[#f9fafb] dark:bg-white p-3 rounded-xl border border-[#e5e7eb] dark:border-black/5">
          <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
            累计已看时长
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              <AnimatedNumber value={hours} decimals={1} suffix="h" duration={0.9} />
            </span>
            <span className="text-[9px] font-semibold text-neutral-400 dark:text-[#666666]">
              ({filmsCount}部)
            </span>
          </div>
        </div>

        <div className="bg-[#f9fafb] dark:bg-white p-3 rounded-xl border border-[#e5e7eb] dark:border-black/5">
          <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
            {ranked ? '已超越' : '上榜人数'}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              {ranked ? (
                <AnimatedNumber value={beatRatio} decimals={1} suffix="%" duration={0.8} />
              ) : (
                <AnimatedNumber value={data.total} duration={0.8} />
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3.5 pb-2">
        <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-[#737373] mb-2 px-0.5">
          <span>全站已看时长分布</span>
          <span className="font-mono text-[9px] text-neutral-900 dark:text-white font-bold tabular-nums">
            {ranked ? (
              <>超越全站 <AnimatedNumber value={beatRatio} decimals={1} suffix="%" duration={0.9} /> 上榜影迷</>
            ) : (
              '看过社内片目即可上榜'
            )}
          </span>
        </div>

        <HoursSpectrum counts={data.histogram} highlightIndex={highlightIndex} className="h-11" />

        <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-[#737373] mt-2 px-0.5 font-mono">
          <span>0h</span>
          <span className="text-neutral-900 dark:text-white font-bold">
            {ranked ? `你在此处 (${hours.toFixed(1)}h)` : '未上榜'}
          </span>
          <span>{data.histogramMaxHours > 0 ? `${data.histogramMaxHours}h` : '—'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-[#e5e7eb] dark:border-black/10">
        <button
          type="button"
          onClick={() => openLeaderboardModal()}
          className="w-full py-2.5 px-3 rounded-xl text-center text-xs font-semibold text-neutral-700 hover:text-black dark:text-[#d4d4d4] dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-white dark:hover:bg-[#202020] border border-[#e5e7eb] dark:border-black/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>查看名人堂总榜</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/credentials', { viewTransition: true })}
          className="w-full py-2.5 px-3 rounded-xl text-center text-xs font-semibold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5] shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Award className="w-3.5 h-3.5" />
          <span>我的资历通行证</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
