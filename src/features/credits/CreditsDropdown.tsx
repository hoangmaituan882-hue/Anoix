import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Zap } from 'lucide-react';
import { openCreditsModal } from './CreditsSheetModal';

interface CreditsDropdownProps {
  lang?: 'zh' | 'ja' | 'en';
}

export const CreditsDropdown: React.FC<CreditsDropdownProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [balance] = useState(30947);
  const [used] = useState(69053);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const total = balance + used;
  const usedRatio = Math.min(1, Math.max(0, used / total)); // ~0.69 (69%)
  const totalBars = 26;
  const activeBarsCount = Math.round(usedRatio * totalBars); // ~18 bars

  // Color mapping across the 26 bars
  const getBarColor = (index: number) => {
    if (index >= activeBarsCount) {
      return 'bg-neutral-200/90 dark:bg-white/12';
    }

    const ratio = index / activeBarsCount;
    if (ratio < 0.22) {
      return 'bg-[#e55928]';
    } else if (ratio < 0.42) {
      return 'bg-[#9a5474]';
    } else if (ratio < 0.62) {
      return 'bg-[#585ab0]';
    } else if (ratio < 0.82) {
      return 'bg-[#2b65cb]';
    } else {
      return 'bg-[#1e58c8]';
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
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

  const handleAddCredits = () => {
    setIsOpen(false);
    openCreditsModal('topup');
  };

  const handleCheckUsage = () => {
    setIsOpen(false);
    openCreditsModal('usage');
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block select-none"
    >
      {/* Header Trigger Capsule Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#f5ffe5] dark:text-white text-xs font-bold transition-all cursor-pointer outline-none border border-white/10 shadow-xs"
        aria-label="点数账户"
        title="放映点数账户"
      >
        <div className="relative flex items-center justify-center w-3.5 h-3.5">
          <Coins className="w-3.5 h-3.5 text-white/90" />
        </div>

        <span className="font-bold tracking-tight text-[11px] font-mono">
          {balance.toLocaleString()} 点
        </span>

        {/* Active Underline Glow Indicator */}
        {isOpen && (
          <motion.div
            layoutId="credits_glow_line"
            className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-[#e55928] via-[#8b5cf6] to-[#1e58c8]"
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          />
        )}
      </button>

      {/* Dropdown Card Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="credits-popover-card absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[295px] sm:w-[320px] p-4 rounded-[22px] bg-[#1c1c1f] text-white border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-2xl transition-colors"
          >
            {/* Top 3-Columns Stats Header */}
            <div className="grid grid-cols-3 gap-2 pb-3.5 border-b border-white/10">
              {/* Col 1: Credit Balance */}
              <div>
                <p className="credits-stat-label text-[11px] font-normal text-white/50 mb-0.5 leading-none">
                  点数余额
                </p>
                <p className="text-[15px] font-bold text-white tracking-tight font-mono">
                  {balance.toLocaleString()}
                </p>
              </div>

              {/* Col 2: Used Credits */}
              <div>
                <p className="credits-stat-label text-[11px] font-normal text-white/50 mb-0.5 leading-none">
                  已消耗点数
                </p>
                <p className="text-[15px] font-bold text-white tracking-tight font-mono">
                  {used.toLocaleString()}
                </p>
              </div>

              {/* Col 3: Next Renew */}
              <div>
                <p className="credits-stat-label text-[11px] font-normal text-white/50 mb-0.5 leading-none">
                  下次重置
                </p>
                <p className="text-[12px] font-bold text-white/90 tracking-tight pt-0.5">
                  8月14日
                </p>
              </div>
            </div>

            {/* Equalizer Spectrum Gauge Section */}
            <div className="pt-3.5 pb-2">
              <div className="relative flex items-end justify-between gap-[3.5px] h-12 px-1">
                {Array.from({ length: totalBars }).map((_, i) => {
                  const isActive = i < activeBarsCount;
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
                        delay: i * 0.02,
                        duration: 0.45,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                      style={{
                        height: `${baseHeight}%`,
                        transformOrigin: 'bottom',
                      }}
                      className={`flex-1 min-w-[5px] rounded-full transition-colors duration-200 ${getBarColor(i)}`}
                    />
                  );
                })}

                {/* Blue Indicator Pip */}
                <div
                  className="absolute top-0 z-10 flex flex-col items-center pointer-events-none transition-all duration-300"
                  style={{
                    left: `${(activeBarsCount / totalBars) * 100}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#1e58c8] shadow-[0_0_8px_#2b65cb] ring-2 ring-white" />
                </div>
              </div>

              {/* Percentage Indicator */}
              <div className="flex items-center justify-between text-[11px] font-bold text-white/50 mt-2 px-1">
                <span>0%</span>
                <span className="text-[#1e58c8] dark:text-[#60a5fa] font-mono">
                  已消耗 {Math.round(usedRatio * 100)}%
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleCheckUsage}
                className="credits-action-btn w-full py-2 rounded-xl text-center text-[12px] font-bold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                查看明细
              </button>
              <button
                type="button"
                onClick={handleAddCredits}
                className="w-full py-2 rounded-xl text-center text-[12px] font-bold text-white bg-gradient-to-r from-[#ff3650] to-[#e02640] hover:brightness-110 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>充值点数</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
