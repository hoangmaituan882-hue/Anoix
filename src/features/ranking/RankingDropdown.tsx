import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, TrendingUp, Share2, Sparkles } from 'lucide-react';
import { openLeaderboardModal } from './LeaderboardModal';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { useToast } from '../../components/ui/Toast';

interface RankingDropdownProps {
  lang?: 'zh' | 'ja' | 'en';
}

export const RankingDropdown: React.FC<RankingDropdownProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { success } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // User Stats Data
  const userRank = 42;
  const userPercentile = 'TOP 3.8%';
  const userHours = 186.5;
  const userFilmsCount = 28;
  const weeklyGain = 12;
  const beatRatio = 96.2; // 96.2%

  // 26-Bar Normal Distribution Spectrum
  const totalBars = 26;
  const userBarIndex = Math.round((beatRatio / 100) * (totalBars - 1)); // Index 24 of 26

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleOpenLeaderboard = () => {
    setIsOpen(false);
    openLeaderboardModal();
  };

  const handleExportRankCard = () => {
    setIsOpen(false);
    navigator.clipboard.writeText(window.location.href);
    success(`已复制荣誉榜位 (#${userRank} · ${userHours}h · 超越 ${beatRatio}%)！`);
  };

  // Minimalist Monochrome Grayscale Color Scheme with Focus Highlight
  const getBarColor = (index: number) => {
    if (index === userBarIndex) {
      // Focus bar: Pure High-Contrast Solid Black (Light Mode) / Solid White (Dark Mode)
      return 'bg-black dark:bg-white shadow-xs';
    }
    if (index < userBarIndex) {
      // Progressed percentile bars in monochromatic slate grays
      const progressRatio = index / userBarIndex;
      if (progressRatio < 0.35) {
        return 'bg-neutral-300 dark:bg-[#333333]';
      } else if (progressRatio < 0.7) {
        return 'bg-neutral-400 dark:bg-[#4d4d4d]';
      } else {
        return 'bg-neutral-600 dark:bg-[#737373]';
      }
    }
    // Ahead bars in soft light gray
    return 'bg-neutral-100 dark:bg-white/10';
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block select-none"
    >
      {/* Header Trigger Capsule Button with Animated Rolling Digits */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#f5ffe5] dark:text-white text-xs font-bold transition-all cursor-pointer outline-none border border-white/10 shadow-xs"
        aria-label="放映排行榜位"
        title={`全站放映位次 #${userRank} · ${userHours}小时`}
      >
        <div className="relative flex items-center justify-center w-3.5 h-3.5">
          <Trophy className="w-3.5 h-3.5 text-white/90" />
        </div>

        <span className="font-bold tracking-tight text-[11px] font-mono tabular-nums">
          <AnimatedNumber value={userRank} prefix="#" duration={0.8} /> ·{' '}
          <AnimatedNumber value={userHours} decimals={1} suffix="h" duration={0.9} />
        </span>

        {/* Minimal High-Contrast Underline Indicator on Active */}
        {isOpen && (
          <motion.div
            layoutId="rank_active_line"
            className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-white dark:bg-white"
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          />
        )}
      </button>

      {/* Dropdown Card Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[310px] sm:w-[330px] p-4.5 rounded-2xl bg-white dark:bg-[#141414] text-neutral-900 dark:text-white border border-[#e5e7eb] dark:border-[#242424] shadow-2xl transition-colors"
          >
            {/* Top 3-Columns Stats Header with Animated Rolling Numbers */}
            <div className="grid grid-cols-3 gap-2 pb-3.5 border-b border-[#e5e7eb] dark:border-[#202020]">
              {/* Col 1: Rank */}
              <div>
                <p className="text-[10px] font-medium text-neutral-400 dark:text-[#737373] mb-0.5 leading-none">
                  全站位次
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[15px] font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
                    <AnimatedNumber value={userRank} prefix="#" duration={0.8} />
                  </p>
                  <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-neutral-100 dark:bg-[#202020] text-neutral-600 dark:text-[#a3a3a3]">
                    {userPercentile}
                  </span>
                </div>
              </div>

              {/* Col 2: Watch Time */}
              <div>
                <p className="text-[10px] font-medium text-neutral-400 dark:text-[#737373] mb-0.5 leading-none">
                  累计放映
                </p>
                <p className="text-[15px] font-bold font-mono tracking-tight text-neutral-900 dark:text-white mt-0.5 tabular-nums">
                  <AnimatedNumber value={userHours} decimals={1} suffix="h" duration={0.9} />
                </p>
                <p className="text-[9px] text-neutral-400 dark:text-[#666666] leading-none mt-0.5">
                  收录 <AnimatedNumber value={userFilmsCount} duration={0.8} /> 部
                </p>
              </div>

              {/* Col 3: Trend */}
              <div>
                <p className="text-[10px] font-medium text-neutral-400 dark:text-[#737373] mb-0.5 leading-none">
                  本周变动
                </p>
                <p className="text-[13px] font-bold font-mono text-[#059669] dark:text-[#56ab7c] mt-0.5 flex items-center gap-0.5 tabular-nums">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>▲ <AnimatedNumber value={weeklyGain} suffix=" 席" duration={0.8} /></span>
                </p>
                <p className="text-[9px] text-neutral-400 dark:text-[#666666] leading-none mt-0.5">
                  超越 <AnimatedNumber value={beatRatio} decimals={1} suffix="%" duration={0.9} />
                </p>
              </div>
            </div>

            {/* Equalizer Normal Distribution Spectrum Gauge Section */}
            <div className="pt-3.5 pb-2">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-[#737373] mb-1.5 px-0.5">
                <span>全站放映时长分布谱系</span>
                <span className="font-mono text-[9px]">NORMAL DISTRIBUTION</span>
              </div>

              <div className="relative flex items-end justify-between gap-[3px] h-12 px-0.5">
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
                      whileHover={{
                        scaleY: 1.15,
                        transition: { duration: 0.15 },
                      }}
                      transition={{
                        delay: i * 0.018,
                        duration: 0.45,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                      style={{
                        height: `${baseHeight}%`,
                        transformOrigin: 'bottom',
                      }}
                      className={`flex-1 min-w-[5px] rounded-full transition-colors duration-200 cursor-pointer ${getBarColor(i)} ${
                        isUserBar ? 'ring-1 ring-black/30 dark:ring-white/40' : ''
                      }`}
                    />
                  );
                })}

                {/* Focus Position Marker Dot */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.35, type: 'spring', stiffness: 500 }}
                  className="absolute top-0 z-10 flex flex-col items-center pointer-events-none transition-all duration-300"
                  style={{
                    left: `${(userBarIndex / (totalBars - 1)) * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-black dark:bg-white shadow-sm ring-2 ring-white dark:ring-black" />
                </motion.div>
              </div>

              {/* Percentage Indicator with Rolling Counter */}
              <div className="flex items-center justify-between text-[10px] font-medium text-neutral-400 dark:text-[#737373] mt-2 px-0.5">
                <span>0h 入门</span>
                <span className="text-neutral-900 dark:text-white font-mono font-bold tabular-nums">
                  你在此处 · 超越 <AnimatedNumber value={beatRatio} decimals={1} suffix="%" duration={0.9} />
                </span>
                <span>300h+ 殿堂</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#e5e7eb] dark:border-[#202020]">
              <button
                type="button"
                onClick={handleOpenLeaderboard}
                className="w-full py-2 rounded-lg text-center text-xs font-semibold text-neutral-700 hover:text-black dark:text-[#d4d4d4] dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-[#202020] dark:hover:bg-[#282828] transition-colors cursor-pointer"
              >
                查看总排行榜
              </button>
              <button
                type="button"
                onClick={handleExportRankCard}
                className="w-full py-2 rounded-lg text-center text-xs font-semibold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3 h-3" />
                <span>导出荣誉榜位</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
