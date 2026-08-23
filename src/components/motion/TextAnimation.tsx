import React from 'react';
import { motion } from 'motion/react';
import { TRIGGER_EASE } from '../../lib/motion';

interface TextAnimationProps {
  text: string;
  /** stagger in seconds between characters */
  stagger?: number;
  className?: string;
  /** per-char animation */
  variant?: 'rise' | 'blur';
}

/**
 * Per-character staggered entrance. 'rise' slides each char up; 'blur'
 * resolves each char from a blur.
 */
export const TextAnimation: React.FC<TextAnimationProps> = ({
  text,
  stagger = 0.028,
  className,
  variant = 'rise',
}) => {
  const chars = Array.from(text);

  return (
    <span className={className} aria-label={text}>
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={
            variant === 'blur'
              ? { opacity: 0, filter: 'blur(6px)', y: 8 }
              : { opacity: 0, y: 20 }
          }
          animate={
            variant === 'blur'
              ? { opacity: 1, filter: 'blur(0px)', y: 0 }
              : { opacity: 1, y: 0 }
          }
          transition={{ duration: 0.5, delay: i * stagger, ease: TRIGGER_EASE }}
          className="inline-block"
          style={{ whiteSpace: ch === ' ' ? 'pre' : undefined }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </motion.span>
      ))}
    </span>
  );
};
