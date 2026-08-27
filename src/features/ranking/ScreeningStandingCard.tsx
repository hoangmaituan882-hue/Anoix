import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, Clock, Film, ArrowRight, Award, ExternalLink } from 'lucide-react';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { openLeaderboardModal } from './LeaderboardModal';

interface ScreeningStandingCardProps {
  className?: string;
  rank?: number;
  hours?: number;
  filmsCount?: number;
  weeklyGain?: number;
  beatRatio?: number;
  percentile?: string;
}

export const ScreeningStandingCard: React.FC<ScreeningStandingCardProps> = ({
  className = '',
  rank = 42,
  hours = 186.5,
  filmsCount = 28,
  weeklyGain = 12,
  beatRatio = 96.2,
  percentile = 'TOP 3.8%',
}) => {
  const navigate = useNavigate();

  // 26-Bar Normal Distribution Spectrum
  const totalBars = 26;
  const userBarIndex = Math.round((beatRatio / 100) * (totalBars - 1)); // Index 24 of 26

  const getBarColor = (index: number) => {
    if (index === userBarIndex) {
      return 'bg-black dark:bg-white shadow-xs';
    }
    if (index < userBarIndex) {
      const progressRatio = index / userBarIndex;
      if (progressRatio < 0.35) {
        return 'bg-neutral-300 dark:bg-[#333333]';
      } else if (progressRatio < 0.7) {
        return 'bg-neutral-400 dark:bg-[#4d4d4d]';
      } else {
        return 'bg-neutral-600 dark:bg-[#737373]';
      }
    }
    return 'bg-neutral-100 dark:bg-white/10';
  };

  return (
    <div
      className={`rounded-2xl p-5 bg-white dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-white/10 shadow-sm text-neutral-900 dark:text-white transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#e5e7eb] dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
              全站放映段位与时长档案
            </h3>
            <p className="text-[10px] font-mono text-neutral-400 dark:text-[#737373]">
              OFFICIAL SCREENING STANDING & SPECTRUM
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-white/90 border border-black/5 dark:border-white/10">
          {percentile}
        </span>
      </div>

      {/* 3 Core Metric Tiles */}
      <div className="grid grid-cols-3 gap-3 py-4 border-b border-[#e5e7eb] dark:border-white/10">
        {/* Col 1: Rank */}
        <div className="bg-[#f9fafb] dark:bg-[#141414] p-3 rounded-xl border border-[#e5e7eb] dark:border-white/5">
          <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
            全站位次
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-neutral-900 dark:text-white tabular-nums">
              <AnimatedNumber value={rank} prefix="#" duration={0.8} />
            </span>
            <span className="text-[9px] font-semibold text-neutral-400 dark:text-[#666666]">
              席位
            </span>
          </div>
        </div>

        {/* Col 2: Watch Hours */}
        <div className="bg-[#f9fafb] dark:bg-[#141414] p-3 rounded-xl border border-[#e5e7eb] dark:border-white/5">
          <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
            累计放映时长
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

        {/* Col 3: Weekly Gain */}
        <div className="bg-[#f9fafb] dark:bg-[#141414] p-3 rounded-xl border border-[#e5e7eb] dark:border-white/5">
          <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
            本周排位跃升
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-[#059669] dark:text-[#56ab7c] tabular-nums flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <AnimatedNumber value={weeklyGain} prefix="▲ " suffix=" 席" duration={0.8} />
            </span>
          </div>
        </div>
      </div>

      {/* Normal Distribution Micro-Spectrum */}
      <div className="pt-3.5 pb-2">
        <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-[#737373] mb-2 px-0.5">
          <span>全站放映时长正态分布</span>
          <span className="font-mono text-[9px] text-neutral-900 dark:text-white font-bold tabular-nums">
            超越全站 <AnimatedNumber value={beatRatio} decimals={1} suffix="%" duration={0.9} /> 社友
          </span>
        </div>

        <div className="relative flex items-end justify-between gap-[3px] h-11 px-0.5">
          {Array.from({ length: totalBars }).map((_, i) => {
            const isUserBar = i === userBarIndex;
            const sinWave = Math.sin((i / (totalBars - 1)) * Math.PI * 0.95);
            const baseHeight = 35 + sinWave * 58;

            return (
              <motion.div
                key={i}
                initial={{ scaleY: 0.1, opacity: 0 }}
                animate={{
                  scaleY: 1,
                  opacity: 1,
                }}
                transition={{
                  delay: i * 0.015,
                  duration: 0.45,
                }}
                style={{
                  height: `${baseHeight}%`,
                  transformOrigin: 'bottom',
                }}
                className={`flex-1 min-w-[4px] rounded-full transition-colors ${getBarColor(i)} ${
                  isUserBar ? 'ring-1 ring-black/30 dark:ring-white/40' : ''
                }`}
              />
            );
          })}

          {/* User Marker Dot */}
          <div
            className="absolute top-0 z-10 flex flex-col items-center pointer-events-none transition-all duration-300"
            style={{
              left: `${(userBarIndex / (totalBars - 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-black dark:bg-white shadow-sm ring-2 ring-white dark:ring-black" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-[#737373] mt-2 px-0.5 font-mono">
          <span>0h</span>
          <span className="text-neutral-900 dark:text-white font-bold">你在此处 (186.5h)</span>
          <span>300h+</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-[#e5e7eb] dark:border-white/10">
        <button
          type="button"
          onClick={() => openLeaderboardModal()}
          className="w-full py-2.5 px-3 rounded-xl text-center text-xs font-semibold text-neutral-700 hover:text-black dark:text-[#d4d4d4] dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-[#141414] dark:hover:bg-[#202020] border border-[#e5e7eb] dark:border-white/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
