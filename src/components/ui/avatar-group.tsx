import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Overlapping avatar stack showing participant count (generic avatars + "+N"). */
export const AvatarGroup: React.FC<{ count: number; size?: number; className?: string }> = ({
  count,
  size = 30,
  className,
}) => {
  const show = Math.min(count, 4);
  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2.5">
        {Array.from({ length: show }).map((_, i) => (
          <div
            key={i}
            className="rounded-full ring-2 ring-[#151515] bg-gradient-to-br from-[#ff3650]/70 to-[#ff203c]/30 flex items-center justify-center text-white shrink-0"
            style={{ width: size, height: size }}
          >
            <User style={{ width: size * 0.5, height: size * 0.5 }} className="opacity-70" />
          </div>
        ))}
      </div>
      {count > show && (
        <div
          className="rounded-full ring-2 ring-[#151515] bg-white/10 text-white/60 flex items-center justify-center font-black shrink-0 -ml-2.5"
          style={{ width: size, height: size, fontSize: size * 0.32 }}
        >
          +{count - show}
        </div>
      )}
    </div>
  );
};
