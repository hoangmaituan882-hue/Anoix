import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  /** Number of decimal places (e.g. 1 for 186.5) */
  decimals?: number;
  /** seconds */
  duration?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/** Counts from `from` (default 0) to `value` with a smooth spring and renders localized digits. */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  duration = 0.9,
  from = 0,
  prefix = '',
  suffix = '',
  className,
}) => {
  const spring = useSpring(from, { duration: duration * 1000, bounce: 0.15 });
  const display = useTransform(spring, (v) => {
    const formatted = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
};
