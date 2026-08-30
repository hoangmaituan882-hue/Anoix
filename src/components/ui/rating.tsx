import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  /** 0–5 current rating */
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}

/**
 * Five-star rating (TRIGGER red fill, lime hover). Click to set / click again
 * to clear; keyboard-focusable buttons with ARIA radiogroup semantics.
 */
export const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 24,
  className,
}) => {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const clamped = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`评分 ${clamped}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= active;
        return (
          <motion.button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(i === value ? 0 : i)}
            onMouseEnter={() => !readOnly && setHover(i)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => !readOnly && setHover(i)}
            onBlur={() => setHover(0)}
            whileHover={!readOnly ? { scale: 1.25, rotate: -8 } : undefined}
            whileTap={!readOnly ? { scale: 0.85 } : undefined}
            className={cn(
              'rounded-md p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3650]/60',
              readOnly ? 'cursor-default' : 'cursor-pointer',
            )}
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} 星`}
          >
            <Star
              size={size}
              strokeWidth={1.5}
              className={cn(
                'transition-colors duration-150',
                filled ? 'fill-[#ff3650] text-[#ff3650] drop-shadow-[0_0_6px_rgba(255,54,80,0.5)]' : 'fill-transparent text-white/25',
                hover && i <= hover && !filled && 'fill-[#e0fe3d] text-[#e0fe3d]',
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
};
