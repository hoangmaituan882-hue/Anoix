import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface ExpandArrowProps {
  className?: string;
  /** Tailwind group scope (default group-hover/btn) */
  groupHover?: string;
}

/**
 * Expanding arrow — on hover, one arrow slides out to the left while a second
 * slides in from the right. Place inside a `group/btn` button.
 */
export const ExpandArrow: React.FC<ExpandArrowProps> = ({
  className = 'w-4 h-4',
  groupHover = 'group-hover/btn',
}) => {
  const move = {
    duration: 0.28,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  };
  return (
    <span className="relative inline-flex w-4 h-4 overflow-hidden shrink-0">
      <motion.span
        className={`absolute inset-0 ${groupHover}:-translate-x-[120%]`}
        transition={move}
      >
        <ArrowRight className={className} />
      </motion.span>
      <motion.span
        className={`absolute inset-0 translate-x-[120%] ${groupHover}:translate-x-0`}
        transition={move}
      >
        <ArrowRight className={className} />
      </motion.span>
    </span>
  );
};
