import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  EyeOff,
  Heart,
  HeartOff,
  Play,
  Share2,
  Trophy,
  Moon,
  Sun,
  Search,
  ArrowUp,
  Film,
  Sparkles,
  Check,
} from 'lucide-react';
import { WorkItem } from '../../types';
import { catalog } from '../../lib/catalog';
import { community } from '../../lib/community';
import { openFilmPreview } from '../../lib/filmPreview';
import { openAllWorksModal } from '../../lib/worksModal';
import { openSearch } from '../../features/search/SearchPalette';
import { toggleGlobalTheme, getStoredTheme } from './ThemeToggle';
import { useToast } from './Toast';

interface ContextMenuState {
  open: boolean;
  x: number;
  y: number;
  type: 'film' | 'global';
  film: WorkItem | null;
  isWatched: boolean;
  isFavorite: boolean;
}

export const DynamicContextMenu: React.FC = () => {
  const [state, setState] = useState<ContextMenuState>({
    open: false,
    x: 0,
    y: 0,
    type: 'global',
    film: null,
    isWatched: false,
    isFavorite: false,
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    const handleContextMenu = async (e: MouseEvent) => {
      // Allow native menu on inputs/textareas
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      e.preventDefault();

      // Check if clicked inside a film card
      const filmEl = target.closest('[data-film-id]') as HTMLElement | null;
      const filmId = filmEl?.getAttribute('data-film-id');

      let currentFilm: WorkItem | null = null;
      let isWatched = false;
      let isFavorite = false;

      if (filmId) {
        currentFilm = await catalog.get(filmId).catch(() => null);

        if (currentFilm) {
          try {
            const [watchList, favorites] = await Promise.all([
              community.watchList().catch(() => []),
              community.favorites().catch(() => []),
            ]);
            isWatched = (watchList || []).some((w) => w.film_id === filmId);
            isFavorite = (favorites || []).some((fav) => fav.film_id === filmId);
          } catch {}
        }
      }

      // Screen boundary clamping
      const menuWidth = 230;
      const menuHeight = currentFilm ? 240 : 200;
      const clampedX = Math.min(e.clientX, window.innerWidth - menuWidth - 12);
      const clampedY = Math.min(e.clientY, window.innerHeight - menuHeight - 12);

      setState({
        open: true,
        x: Math.max(12, clampedX),
        y: Math.max(12, clampedY),
        type: currentFilm ? 'film' : 'global',
        film: currentFilm,
        isWatched,
        isFavorite,
      });
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setState((prev) => (prev.open ? { ...prev, open: false } : prev));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setState((prev) => (prev.open ? { ...prev, open: false } : prev));
      }
    };

    const handleScroll = () => {
      setState((prev) => (prev.open ? { ...prev, open: false } : prev));
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const closeMenu = () => {
    setState((prev) => ({ ...prev, open: false }));
  };

  // Film Context Actions
  const handleToggleWatch = async () => {
    if (!state.film) return;
    const film = state.film;
    closeMenu();

    try {
      if (state.isWatched) {
        await community.removeWatch(film.id);
        success(`已取消《${film.titleZh || film.title}》的观影标记`);
      } else {
        await community.saveWatch(film.id, 5, '右键快捷标记已看');
        success(`已将《${film.titleZh || film.title}》标记为「已看过」！`);
      }
    } catch {
      toastError('操作失败，请重试');
    }
  };

  const handleToggleFavorite = async () => {
    if (!state.film) return;
    const film = state.film;
    closeMenu();

    try {
      if (state.isFavorite) {
        await community.removeFavorite(film.id);
        success(`已从心愿单中移除《${film.titleZh || film.title}》`);
      } else {
        await community.addFavorite(film.id);
        success(`已将《${film.titleZh || film.title}》加入我的心愿单！`);
      }
    } catch {
      toastError('操作失败，请重试');
    }
  };

  const handleViewDetail = () => {
    if (!state.film) return;
    const film = state.film;
    closeMenu();
    openFilmPreview(film);
  };

  const handleCopyFilmLink = () => {
    if (!state.film) return;
    closeMenu();
    const url = `${window.location.origin}/screenings?film=${encodeURIComponent(state.film.id)}`;
    navigator.clipboard.writeText(url);
    success(`已复制《${state.film.titleZh || state.film.title}》专属链接！`);
  };

  // Global Canvas Actions
  const handleOpenWorks = () => {
    closeMenu();
    openAllWorksModal();
  };

  const handleToggleTheme = () => {
    const coords = { x: state.x, y: state.y };
    closeMenu();
    toggleGlobalTheme(coords);
  };

  const handleOpenSearch = () => {
    closeMenu();
    openSearch();
  };

  const handleScrollTop = () => {
    closeMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCurrentDark = getStoredTheme() === 'dark';

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.94, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 4 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            left: `${state.x}px`,
            top: `${state.y}px`,
            zIndex: 9999,
          }}
          className="w-56 p-1.5 rounded-2xl bg-[#1c1c1f]/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-neutral-100 text-xs select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {state.type === 'film' && state.film ? (
            /* ====================================================================
               1. Film Card Context Menu (作品卡片专属右键菜单)
               ==================================================================== */
            <div>
              {/* Film Title Header */}
              <div className="px-3 py-1.5 mb-1 border-b border-white/10">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                  ANIMATION WORK
                </span>
                <p className="font-bold text-white text-xs truncate">
                  {state.film.titleZh || state.film.title}
                </p>
              </div>

              {/* Action 1: Mark / Unmark Watched */}
              <button
                type="button"
                onClick={handleToggleWatch}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {state.isWatched ? (
                    <EyeOff className="w-4 h-4 text-[#ff3650]" />
                  ) : (
                    <Eye className="w-4 h-4 text-[#e0fe3d]" />
                  )}
                  <span>{state.isWatched ? '取消标记已看' : '⚡ 标记为已看过'}</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">W</span>
              </button>

              {/* Action 2: Favorite / Unfavorite */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {state.isFavorite ? (
                    <HeartOff className="w-4 h-4 text-white/60" />
                  ) : (
                    <Heart className="w-4 h-4 text-[#ff3650]" />
                  )}
                  <span>{state.isFavorite ? '移初心愿单' : '💖 收藏至心愿单'}</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">F</span>
              </button>

              <div className="w-full border-t border-white/10 my-1" />

              {/* Action 3: Quick View Detail */}
              <button
                type="button"
                onClick={handleViewDetail}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 text-white/80" />
                  <span>查看作品详情</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">Space</span>
              </button>

              {/* Action 4: Copy Share Link */}
              <button
                type="button"
                onClick={handleCopyFilmLink}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 text-white/80" />
                  <span>复制作品专属链接</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">⌘C</span>
              </button>
            </div>
          ) : (
            /* ====================================================================
               2. Global Canvas Fallback Context Menu (全站空白处/全局兜底右键菜单)
               ==================================================================== */
            <div>
              {/* Header Label */}
              <div className="px-3 py-1.5 mb-1 border-b border-white/10">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                  QUICK NAVIGATION
                </span>
              </div>

              {/* Action 1: Open Animation Library */}
              <button
                type="button"
                onClick={handleOpenWorks}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Film className="w-4 h-4 text-[#ff3650]" />
                  <span>🏆 打开动画库</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">All</span>
              </button>

              {/* Action 2: Toggle Dark / Light Theme */}
              <button
                type="button"
                onClick={handleToggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {isCurrentDark ? (
                    <Sun className="w-4 h-4 text-amber-300" />
                  ) : (
                    <Moon className="w-4 h-4 text-white" />
                  )}
                  <span>{isCurrentDark ? '🌓 切换浅色模式' : '🌓 切换深色模式'}</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">T</span>
              </button>

              {/* Action 3: Open Global Search */}
              <button
                type="button"
                onClick={handleOpenSearch}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-[#e0fe3d]" />
                  <span>🔍 唤起全局搜索</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">⌘K</span>
              </button>

              <div className="w-full border-t border-white/10 my-1" />

              {/* Action 4: Smooth Scroll to Top */}
              <button
                type="button"
                onClick={handleScrollTop}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ArrowUp className="w-4 h-4 text-white/80" />
                  <span>⬆️ 平滑返回顶部</span>
                </div>
                <span className="text-[10px] font-mono text-white/40">Top</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
