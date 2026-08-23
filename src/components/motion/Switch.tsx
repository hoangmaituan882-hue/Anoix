import React from 'react';
import { motion } from 'motion/react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/** iOS-style toggle switch with a springy thumb. */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-[#ff3650]' : 'bg-white/15'
      } ${className ?? ''}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="block h-4.5 w-4.5 rounded-full bg-white shadow-md"
        style={{ marginLeft: checked ? 'auto' : '2px', marginRight: checked ? '2px' : 'auto' }}
      />
    </button>
  );
};
