import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  /** seconds */
  duration?: number;
  className?: string;
}

/** Counts from 0 to value with a spring, renders as a localized number. */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1.1,
  className,
}) => {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0.12 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
};
