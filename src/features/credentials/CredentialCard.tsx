import React from 'react';
import { motion } from 'motion/react';
import { Star, MapPin, Award, Vote, ExternalLink } from 'lucide-react';

export interface CredentialCardData {
  id: string;
  type: 'screening' | 'nomination' | 'watch' | 'badge';
  title: string;
  titleZh?: string;
  image: string;
  secondaryImage?: string;
  tag: string;
  date?: string;
  rating?: number;
  votesCount?: number;
  venue?: string;
  quote?: string;
  perks?: string;
  statusText?: string;
  highlight?: boolean;
}

interface CredentialCardProps {
  data: CredentialCardData;
  onClick?: () => void;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({ data, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className="group relative flex flex-col cursor-pointer select-none"
    >
      {/* Dual-Layer Card Cover */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-neutral-100 dark:bg-white rounded-xl overflow-hidden mb-2.5 border border-neutral-200 dark:border-[#202020] group-hover:border-neutral-400 dark:group-hover:border-[#383838] shadow-sm transition-all duration-500">
        
        {/* Backing Reveal Layer (Revealed on hover) */}
        <div className="absolute inset-0 bg-neutral-50 dark:bg-[#f5ffe5] p-4 flex flex-col justify-between text-neutral-900 dark:text-white transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-bold text-neutral-500 dark:text-[#888888] uppercase tracking-widest">
              // ARCHIVE #{data.id.slice(-4)}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 dark:text-[#666666]">{data.date}</span>
          </div>

          <div className="space-y-1.5 my-auto">
            {data.venue && (
              <p className="text-xs text-neutral-700 dark:text-[#cccccc] font-medium flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 text-neutral-500 dark:text-[#737373] shrink-0" />
                <span className="truncate">{data.venue}</span>
              </p>
            )}
            {data.quote && (
              <p className="text-xs text-neutral-600 dark:text-[#999999] italic line-clamp-2 leading-relaxed bg-white dark:bg-white p-2 rounded border border-neutral-200 dark:border-[#242424]">
                "{data.quote}"
              </p>
            )}
            {data.perks && (
              <p className="text-[11px] text-neutral-700 dark:text-[#cccccc] font-medium truncate flex items-center gap-1">
                <Award className="w-3 h-3 text-neutral-500 dark:text-[#888888] shrink-0" />
                <span className="truncate">{data.perks}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 dark:text-[#666666] pt-2 border-t border-neutral-200 dark:border-[#202020]">
            <span>ANOIX</span>
            <span className="text-black dark:text-white font-medium group-hover:underline flex items-center gap-0.5">
              VIEW <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Front Poster / Image Layer (Slides horizontally on hover) */}
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:-translate-x-2.5 group-hover:-translate-y-1.5">
          <img
            src={data.image}
            alt={data.title}
            className="w-full h-full object-cover select-none"
            draggable={false}
          />
          {/* Subtle gradient on front image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {/* Front Badges in Minimal Flat Monochrome */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/80 dark:bg-black/70 backdrop-blur-md text-neutral-800 dark:text-[#d4d4d4] border border-black/10 dark:border-black/10">
              {data.tag}
            </span>
          </div>

          {/* Rating stars or Votes if available */}
          {data.rating !== undefined && (
            <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold text-white border border-black/10">
              <Star className="w-2.5 h-2.5 fill-current text-black/80" />
              <span>{data.rating}.0</span>
            </div>
          )}

          {data.votesCount !== undefined && (
            <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold text-white border border-black/10 font-mono">
              <Vote className="w-2.5 h-2.5" />
              <span>{data.votesCount} 票</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="space-y-0.5 text-left">
        <h4 className="text-xs font-semibold text-neutral-900 dark:text-white group-hover:text-neutral-700 dark:group-hover:text-black/80 transition-colors truncate">
          {data.titleZh || data.title}
        </h4>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-[#737373]">
          <span className="truncate">{data.statusText || data.venue || '放映会社区档案'}</span>
          {data.date && <span className="shrink-0 font-mono">{data.date}</span>}
        </div>
      </div>
    </motion.div>
  );
};
