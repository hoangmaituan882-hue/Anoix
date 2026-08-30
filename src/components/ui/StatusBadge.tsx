import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 font-bold text-[12px] tracking-normal leading-none transition-colors select-none',
  {
    variants: {
      variant: {
        // Red - active / hot / voting
        voting:
          'bg-[#ff3650] text-white shadow-[0_0_12px_rgba(255,54,80,0.35)] border border-[#ff3650]/50',
        hot:
          'bg-[#ff3650]/15 text-[#ff3650] border border-[#ff3650]/30 hover:bg-[#ff3650]/25',
        
        // Lime - winner / top 1 / fresh
        top1:
          'bg-[#e0fe3d] text-[#121212] font-extrabold shadow-[0_0_14px_rgba(224,254,61,0.4)] border border-[#e0fe3d]',
        success:
          'bg-[#e0fe3d]/15 text-[#b0d410] dark:text-[#e0fe3d] border border-[#e0fe3d]/30',

        // Cobalt Blue - official / news / archive
        official:
          'bg-[#4246ff] text-white shadow-[0_0_12px_rgba(66,70,255,0.3)] border border-[#4246ff]/60',
        archive:
          'bg-[#4246ff]/15 text-[#5559ff] dark:text-[#7f83ff] border border-[#4246ff]/30',

        // Amber - upcoming / countdown / pending
        scheduled:
          'bg-[#ff9900]/15 text-[#ff9900] border border-[#ff9900]/30',
        warning:
          'bg-[#ff9900] text-white shadow-[0_0_12px_rgba(255,153,0,0.35)]',

        // Neutral / Tech Tag
        tag:
          'bg-white/10 dark:bg-white/5 text-black/80 dark:text-black/80 border border-black/10 dark:border-black/10 hover:border-[#ff3650]/50',
        outline:
          'bg-transparent text-black/60 dark:text-black/60 border border-black/20 dark:border-black/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px] rounded',
        md: 'px-2.5 py-1 text-[11px] rounded-md',
        lg: 'px-3 py-1.5 text-xs rounded-md',
      },
      cut: {
        true: 'clip-corner',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'tag',
      size: 'md',
      cut: false,
    },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  dot?: boolean;
  dotPulse?: boolean;
  shimmer?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  className,
  variant,
  size,
  cut,
  dot,
  dotPulse = false,
  shimmer = false,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(statusBadgeVariants({ variant, size, cut, className }))}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full bg-current',
            dotPulse && 'animate-ping opacity-75'
          )}
        />
      )}
      {shimmer ? <span className="t-shimmer">{children}</span> : children}
    </span>
  );
};
