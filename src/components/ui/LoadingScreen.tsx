import React, { useState, useEffect } from 'react';
import { TriggerLogo } from './TriggerLogo';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
              onComplete();
            }, 600);
          }, 300);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 15) + 8;
        return next > 100 ? 100 : next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      id="loading_screen"
      className={`fixed inset-0 z-[100] bg-[#f5ffe5] flex flex-col items-center justify-center transition-opacity duration-600 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6 max-w-xs w-full px-6">
        <TriggerLogo className="w-48 text-[#ff3650] animate-pulse" />

        <div className="w-full flex items-center justify-between font-mono text-sm font-black text-[#1e1f21]">
          <span>LOADING</span>
          <span className="loading_text text-[#ff3650]">{percent}%</span>
        </div>

        {/* Loading Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="loading_bar h-full bg-[#ff3650] transition-all duration-75 ease-out shadow-[0_0_12px_#ff3650]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
