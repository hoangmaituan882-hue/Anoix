import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { TRIGGER_EASE } from '../../lib/motion';

export interface PageHeroProps {
  title: string;
  titleZh?: string;
  subtitle?: string;
  backLabel?: string;
  backUrl?: string;
  onBack?: () => void;
  actionSlot?: React.ReactNode;
  className?: string;
  // Deprecated badge & icon support for backward compatibility if any
  badge?: React.ReactNode;
  icon?: any;
}

/**
 * Standardized Clean PageHero adhering to the Anoix 6-level typography scale:
 * Main Title: 24px (font-black, line-height 1.25)
 * Subtitle: 14px (font-normal, line-height 1.55)
 */
export const PageHero: React.FC<PageHeroProps> = ({
  title,
  subtitle,
  backLabel,
  backUrl = '/',
  onBack,
  actionSlot,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(backUrl, { viewTransition: true });
    }
  };

  return (
    <div className={`relative w-full mb-3 sm:mb-4 ${className}`}>
      {/* Top Streamlined Breadcrumb */}
      <div className="flex items-center gap-2 mb-1.5">
        <button
          onClick={handleBack}
          className="group inline-flex items-center gap-1 text-xs font-bold text-black/50 dark:text-white/50 hover:text-[#ff3650] dark:hover:text-[#ff3650] transition-colors cursor-pointer"
        >
          <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 group-hover:bg-[#ff3650] group-hover:text-white transition-all">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
          </div>
          <span>{backLabel || '返回首页'}</span>
        </button>
      </div>

      {/* Hero Header Body: Main title 24px + Subtitle 14px */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: 24px Main Title & 14px Subtitle */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: TRIGGER_EASE }}
          className="max-w-3xl flex-1"
        >
          <h1 className="text-[24px] font-black text-black dark:text-[#f5ffe5] leading-[1.25] tracking-tight mb-1.5">
            {title}
          </h1>

          {subtitle && (
            <p className="text-[14px] font-normal text-black/65 dark:text-white/65 leading-[1.55]">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Right: Optional Compact Action Slot */}
        {actionSlot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.06, ease: TRIGGER_EASE }}
            className="flex items-center gap-3 shrink-0 self-start lg:self-center"
          >
            {actionSlot}
          </motion.div>
        )}
      </div>
    </div>
  );
};
