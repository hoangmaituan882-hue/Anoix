import React from 'react';
import { motion } from 'motion/react';

const BARS = 26;

export function HoursSpectrum({
  counts,
  highlightIndex,
  className = '',
}: {
  counts: number[];
  highlightIndex: number | null;
  className?: string;
}) {
  const bars = counts.length ? counts : Array.from({ length: BARS }, () => 0);
  const peak = Math.max(1, ...bars);
  const n = Math.max(1, bars.length - 1);

  return (
    <div className={`relative flex items-end justify-between gap-[3px] h-12 px-0.5 ${className}`}>
      {bars.map((count, i) => {
        const isUserBar = highlightIndex != null && i === highlightIndex;
        const height = 12 + (count / peak) * 88;
        return (
          <motion.div
            key={i}
            initial={{ scaleY: 0.1, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{
              delay: i * 0.015,
              duration: 0.45,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{ height: `${height}%`, transformOrigin: 'bottom' }}
            className={`flex-1 min-w-[4px] rounded-full ${
              isUserBar
                ? 'bg-black dark:bg-white shadow-xs ring-1 ring-black/30 dark:ring-white/40'
                : count > 0
                  ? 'bg-neutral-400 dark:bg-[#4d4d4d]'
                  : 'bg-neutral-100 dark:bg-white/10'
            }`}
          />
        );
      })}
      {highlightIndex != null && bars.length > 1 && (
        <div
          className="absolute top-0 z-10 flex flex-col items-center pointer-events-none"
          style={{
            left: `${(highlightIndex / n) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-black dark:bg-white shadow-sm ring-2 ring-white dark:ring-black" />
        </div>
      )}
    </div>
  );
}
