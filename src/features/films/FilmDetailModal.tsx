import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { WorkItem, Language } from '../../types';
import { FilmDetailBody } from './FilmDetailBody';
import { TRIGGER_EASE } from '../../lib/motion';
import { ArrowRight, X } from 'lucide-react';

interface FilmDetailModalProps {
  work: WorkItem | null;
  lang: Language;
  onClose: () => void;
  onPlayTrailer?: (url: string) => void;
}

/** Quick-preview modal — full detail content lives in FilmDetailBody. */
export const FilmDetailModal: React.FC<FilmDetailModalProps> = ({
  work,
  lang,
  onClose,
  onPlayTrailer,
}) => {
  if (!work) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: TRIGGER_EASE }}
        className="relative w-full max-w-4xl bg-[#1a1a1a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl my-8 text-[#f5ffe5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-[#ff3650] text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <FilmDetailBody
          work={work}
          lang={lang}
          onPlayTrailer={onPlayTrailer}
          posterViewTransitionName={`film-poster-${work.id}`}
          footerExtra={
            <Link
              to={`/films/${work.id}`}
              viewTransition
              className="inline-flex items-center gap-2 text-[#ff3650] hover:text-white px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider transition-colors border-2 border-[#ff3650]/60 hover:border-[#ff3650] bg-[#ff3650]/10"
            >
              <span>{lang === 'zh' ? '查看完整详情' : 'FULL DETAILS'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      </motion.div>
    </motion.div>
  );
};

