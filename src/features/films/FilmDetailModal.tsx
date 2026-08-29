import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { WorkItem, Language } from '../../types';
import { FilmDetailBody } from './FilmDetailBody';
import { WatchPanel } from './WatchPanel';
import { TRIGGER_EASE } from '../../lib/motion';
import { community } from '../../lib/community';
import { useToast } from '../../components/ui/Toast';
import { catalog } from '../../lib/catalog';
import { ArrowRight, X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';

interface FilmDetailModalProps {
  work: WorkItem | null;
  lang: Language;
  onClose: () => void;
  onSelectWork: (work: WorkItem) => void;
  onPlayTrailer?: (url: string) => void;
}

/** Quick-preview modal — full detail content lives in FilmDetailBody. */
export const FilmDetailModal: React.FC<FilmDetailModalProps> = ({
  work,
  lang,
  onClose,
  onSelectWork,
  onPlayTrailer,
}) => {
  const { success } = useToast();
  const [favorited, setFavorited] = useState(false);
  const [neighbors, setNeighbors] = useState<WorkItem[]>([]);

  useEffect(() => {
    let alive = true;
    catalog
      .list({ limit: 24, offset: 0 })
      .then((page) => {
        if (alive) setNeighbors(page.items);
      })
      .catch(() => {
        if (alive) setNeighbors([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!work) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [work, onClose]);

  useEffect(() => {
    if (!work) return;
    let alive = true;
    community.favorites()
      .then((list) => { if (alive) setFavorited(list.some((f) => f.id === work.id)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [work]);

  if (!work) return null;

  const index = neighbors.findIndex((w) => w.id === work.id);
  const prev = index > 0 ? neighbors[index - 1] : null;
  const next = index >= 0 && index < neighbors.length - 1 ? neighbors[index + 1] : null;

  const goNeighbor = async (item: WorkItem) => {
    const full = await catalog.get(item.id).catch(() => item);
    onSelectWork(full ?? item);
  };

  const toggleFavorite = async () => {
    try {
      if (favorited) { await community.removeFavorite(work.id); setFavorited(false); }
      else { await community.addFavorite(work.id); setFavorited(true); success(`已收藏「${work.titleZh ?? work.title}」`); }
    } catch { /* ignore */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      {/* Prev / Next floating arrows */}
      {prev && (
        <button
          onClick={(e) => { e.stopPropagation(); void goNeighbor(prev); }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-[#ff3650] text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
          aria-label="上一个作品"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {next && (
        <button
          onClick={(e) => { e.stopPropagation(); void goNeighbor(next); }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-[#ff3650] text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
          aria-label="下一个作品"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: TRIGGER_EASE }}
        className="relative w-full max-w-4xl bg-[#1a1a1a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl my-8 text-[#f5ffe5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close + Favorite */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className="w-10 h-10 rounded-full bg-black/70 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
            title={favorited ? '取消收藏' : '收藏'}
            aria-label="收藏"
          >
            <Heart className={`w-5 h-5 ${favorited ? 'fill-[#ff3650] text-[#ff3650]' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/70 hover:bg-[#ff3650] text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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

        {/* Watch log + rating inside the modal */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <WatchPanel filmId={work.id} filmTitle={work.titleZh ?? work.title} />
        </div>
      </motion.div>
    </motion.div>
  );
};
