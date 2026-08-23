import React from 'react';
import { motion } from 'motion/react';

interface AnimatedBadgeProps {
  children: React.ReactNode;
  className?: string;
  /** animate a subtle pulse on the badge dot/icon */
  pulse?: boolean;
}

/** Badge that pops in with a scale + fade and optional pulse accent. */
export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  className,
  pulse = false,
}) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center gap-1.5 ${className ?? ''}`}
    >
      {pulse && (
        <motion.span
          className="relative flex h-2 w-2"
        >
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </motion.span>
      )}
      {children}
    </motion.span>
  );
};
