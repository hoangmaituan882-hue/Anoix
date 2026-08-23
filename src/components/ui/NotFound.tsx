import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import { TRIGGER_EASE } from '../../lib/motion';

interface NotFoundProps {
  /** main heading */
  title?: string;
  description?: string;
  /** optional home nav fallback */
  showHome?: boolean;
}

/** 404 / empty-state screen — big ghost number + TRIGGER red accent. */
export const NotFound: React.FC<NotFoundProps> = ({
  title = '404',
  description = '这个页面似乎不存在，它可能已被移动或删除。',
  showHome = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#121212] text-[#f5ffe5] flex flex-col items-center justify-center px-6 text-center selection:bg-[#ff3650] selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: TRIGGER_EASE }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-6">
          <span
            className="text-[120px] sm:text-[180px] font-black leading-none text-transparent"
            style={{ WebkitTextStroke: '2px rgba(255,54,80,0.55)' }}
          >
            {title}
          </span>
          <motion.span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 0.06, scale: 1 }}
            transition={{ duration: 0.8, ease: TRIGGER_EASE, delay: 0.15 }}
          >
            <SearchX className="w-40 h-40 text-[#ff3650]" />
          </motion.span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3">
          Page Not Found
        </h1>
        <p className="text-sm sm:text-base text-white/60 max-w-md leading-relaxed mb-8">
          {description}
        </p>

        {showHome && (
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2.5 bg-[#ff3650] hover:bg-[#ff203c] text-white font-black text-sm uppercase tracking-wider px-7 py-3 rounded-full transition-all shadow-[0_8px_25px_rgba(255,54,80,0.35)] cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>返回首页</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};
