import React from 'react';

interface MarqueeProps {
  children: React.ReactNode;
  /** seconds for one full loop */
  duration?: number;
  /** pause on hover */
  pauseOnHover?: boolean;
  /** reverse direction */
  reverse?: boolean;
  className?: string;
}

/**
 * Infinite horizontal marquee — duplicates content, translates by -50% on a
 * seamless CSS loop. CSS animation (not JS) so hover-pause works cleanly.
 */
export const Marquee: React.FC<MarqueeProps> = ({
  children,
  duration = 22,
  pauseOnHover = true,
  reverse = false,
  className,
}) => {
  return (
    <div className={`marquee-wrap relative overflow-hidden ${className ?? ''}`}>
      <div
        className="marquee-track flex w-max items-center"
        style={{
          animationDuration: `${duration}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        <div className="flex items-center shrink-0">{children}</div>
        <div className="flex items-center shrink-0" aria-hidden>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation-name: marquee-scroll; animation-timing-function: linear; animation-iteration-count: infinite; }
        ${pauseOnHover ? '.marquee-wrap:hover .marquee-track { animation-play-state: paused; }' : ''}
      `}</style>
    </div>
  );
};
