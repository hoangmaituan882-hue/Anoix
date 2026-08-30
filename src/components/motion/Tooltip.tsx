import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  /** tooltip position relative to trigger */
  side?: 'top' | 'bottom';
  className?: string;
  /** positioning applied to the wrapper (default 'relative'); pass absolute classes for absolute-positioned triggers */
  wrapperClassName?: string;
}

/** Hover tooltip that fades/slides in — replaces native title attributes. */
export const Tooltip: React.FC<TooltipProps> = ({
  label,
  children,
  side = 'top',
  className,
  wrapperClassName = 'relative',
}) => {
  const [open, setOpen] = useState(false);

  const pos =
    side === 'top'
      ? { className: 'bottom-full mb-2', initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } }
      : { className: 'top-full mt-2', initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 } };

  return (
    <span
      className={`inline-flex ${wrapperClassName} ${className ?? ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            initial={pos.initial}
            animate={pos.animate}
            exit={{ opacity: 0, y: side === 'top' ? 6 : -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute ${pos.className} left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#262626] text-white/90 border border-black/10 shadow-xl`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};
