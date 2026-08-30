import React from 'react';

interface SectionWatermarkProps {
  text: string;
  subText?: string;
  className?: string;
}

/**
 * TRIGGER-style oversized typographic background watermark.
 * Adds extreme editorial scale without interfering with foreground interactions.
 */
export const SectionWatermark: React.FC<SectionWatermarkProps> = ({
  text,
  subText,
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute right-0 top-0 select-none overflow-hidden leading-none z-0 ${className}`}
    >
      <div className="flex flex-col items-end opacity-[0.035] dark:opacity-[0.045] transition-opacity duration-300">
        {subText && (
          <span className="font-mono text-[2.5vw] font-black tracking-[0.3em] uppercase text-black dark:text-[#1e1f21]">
            // {subText}
          </span>
        )}
        <span className="font-black italic uppercase text-[15vw] tracking-tighter text-black dark:text-[#1e1f21] -mr-4 -mt-2">
          {text}
        </span>
      </div>
    </div>
  );
};
