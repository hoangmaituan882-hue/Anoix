import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkItem, Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { catalog } from '../../lib/catalog';
import { community, WatchItem } from '../../lib/community';
import { TRIGGER_EASE } from '../../lib/motion';
import { TiltCard } from '../../components/motion/TiltCard';
import { AnimatedBadge } from '../../components/motion/AnimatedBadge';
import { useToast } from '../../components/ui/Toast';
import { Loader } from '../../components/motion/loader';
import {
  X,
  Play,
  Filter,
  Search,
  Sparkles,
  Film,
  ArrowUpDown,
  Check,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

interface FilmsLibraryModalProps {
  lang: Language;
  onClose: () => void;
  onSelectWork: (work: WorkItem) => void;
}

export const FilmsLibraryModal: React.FC<FilmsLibraryModalProps> = ({
  lang,
  onClose,
  onSelectWork,
}) => {
  const [filter, setFilter] = useState<'all' | 'TV Series' | 'Movie' | 'Original Animation'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [sortKey, setSortKey] = useState<'screened' | 'year'>('screened');
  const [films, setFilms] = useState<WorkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const t = I18N[lang];
  const { success, error: toastError } = useToast();

  // Batch Selection & Watched Records State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [watchedMap, setWatchedMap] = useState<Record<string, WatchItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    const category =
      filter === 'TV Series' ? 'tv' : filter === 'Movie' ? 'movie' : filter === 'Original Animation' ? 'original' : 'all';
    const sort = sortKey === 'year' ? (sortOrder === 'asc' ? 'year_asc' : 'year_desc') : 'screened_desc';
    const timer = setTimeout(() => {
      setLoadingList(true);
      catalog
        .list({ q: searchQuery, category, sort, limit: 24, offset: 0 })
        .then((page) => {
          if (!alive) return;
          setFilms(page.items);
          setTotal(page.total);
        })
        .catch(() => {
          if (alive) {
            setFilms([]);
            setTotal(0);
          }
        })
        .finally(() => {
          if (alive) setLoadingList(false);
        });
    }, searchQuery.trim() ? 300 : 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [filter, searchQuery, sortOrder, sortKey]);

  const loadMore = () => {
    const category =
      filter === 'TV Series' ? 'tv' : filter === 'Movie' ? 'movie' : filter === 'Original Animation' ? 'original' : 'all';
    const sort = sortKey === 'year' ? (sortOrder === 'asc' ? 'year_asc' : 'year_desc') : 'screened_desc';
    catalog
      .list({ q: searchQuery, category, sort, limit: 24, offset: films.length })
      .then((page) => {
        setFilms((prev) => [...prev, ...page.items]);
        setTotal(page.total);
      })
      .catch(() => {});
  };

  // Load existing watch-log on mount
  useEffect(() => {
    let alive = true;
    community
      .watchList()
      .then((list) => {
        if (!alive) return;
        const map: Record<string, WatchItem> = {};
        (list || []).forEach((w) => {
          map[w.film_id] = w;
        });
        setWatchedMap(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const filteredWorks = films;

  // Toggle selection for a single work
  const handleToggleSelect = (workId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(workId)) {
        next.delete(workId);
      } else {
        next.add(workId);
      }
      return next;
    });
  };

  // Toggle Select All filtered items
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredWorks.length && filteredWorks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWorks.map((w) => w.id)));
    }
  };

  // Batch mark selected as Watched
  const handleBatchMarkWatched = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    const ids: string[] = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id: string) => community.saveWatch(String(id), 5, '批量标记已看过')));
      const updatedList = await community.watchList();
      const map: Record<string, WatchItem> = {};
      (updatedList || []).forEach((w) => {
        map[w.film_id] = w;
      });
      setWatchedMap(map);
      success(`已成功将 ${ids.length} 部作品批量标记为「已看过」！`);
      setSelectedIds(new Set());
      setIsBatchMode(false);
    } catch {
      toastError('批量标记失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batch remove watch record
  const handleBatchRemoveWatched = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    const ids: string[] = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id: string) => community.removeWatch(String(id))));
      const updatedList = await community.watchList();
      const map: Record<string, WatchItem> = {};
      (updatedList || []).forEach((w) => {
        map[w.film_id] = w;
      });
      setWatchedMap(map);
      success(`已成功清除 ${ids.length} 部作品的观影记录`);
      setSelectedIds(new Set());
      setIsBatchMode(false);
    } catch {
      toastError('清除失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAllSelected = filteredWorks.length > 0 && selectedIds.size === filteredWorks.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: TRIGGER_EASE }}
        className="relative w-full max-w-6xl bg-[#181818] border border-white/20 rounded-3xl overflow-hidden shadow-2xl my-8 text-[#f5ffe5] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-[#151515]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff3650]/15 border border-[#ff3650]/40 flex items-center justify-center text-[#ff3650]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black text-[#ff3650] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                FANSHI ANIMATION ARCHIVE
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {t.allWorksModalTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Toggle Batch Management Button */}
            <button
              onClick={() => {
                if (isBatchMode) {
                  setIsBatchMode(false);
                  setSelectedIds(new Set());
                } else {
                  setIsBatchMode(true);
                }
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                isBatchMode
                  ? 'bg-[#ff3650] text-white border-[#ff3650] shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white/90 border-white/15'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isBatchMode ? '退出批量' : '批量标记已看'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 sm:px-8 py-4 bg-[#1e1e1e] border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <Filter className="w-4 h-4 text-[#ff3650] flex-shrink-0" />
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#ff3650] text-white shadow-md'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              {lang === 'zh' ? (filter === 'all' ? `全部 (${total})` : '全部') : (filter === 'all' ? `ALL (${total})` : 'ALL')}
            </button>
            <button
              onClick={() => setFilter('TV Series')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer ${
                filter === 'TV Series'
                  ? 'bg-[#ff3650] text-white shadow-md'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              {lang === 'zh' ? '电视动画 (TV Series)' : 'TV Series'}
            </button>
            <button
              onClick={() => setFilter('Movie')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer ${
                filter === 'Movie'
                  ? 'bg-[#ff3650] text-white shadow-md'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              {lang === 'zh' ? '剧场版电影 (Movie)' : 'Theatrical Movie'}
            </button>
            <button
              onClick={() => setFilter('Original Animation')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase transition-all whitespace-nowrap cursor-pointer ${
                filter === 'Original Animation'
                  ? 'bg-[#ff3650] text-white shadow-md'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              {lang === 'zh' ? '原创/网播动画 (Original)' : 'Original / Streaming'}
            </button>
          </div>

          {/* Search Input & Sort Button */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'zh'
                    ? '搜索作品/监督/年份...'
                    : lang === 'ja'
                    ? '作品名・監督・年代で検索...'
                    : 'Search titles, staff, year...'
                }
                className="w-full bg-white/5 border border-white/15 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff3650] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => setSortKey((prev) => (prev === 'screened' ? 'year' : 'screened'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white/80 transition-colors cursor-pointer whitespace-nowrap border border-white/10"
              title={sortKey === 'screened' ? '按社内放映日' : '按制作年份'}
            >
              <span>{sortKey === 'screened' ? (lang === 'zh' ? '放映日' : 'Screened') : (lang === 'zh' ? '年份' : 'Year')}</span>
            </button>
            {sortKey === 'year' && (
              <button
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white/80 transition-colors cursor-pointer whitespace-nowrap border border-white/10"
                title={sortOrder === 'desc' ? '最新在前' : '早期在前'}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#ff3650]" />
                <span>
                  {sortOrder === 'desc'
                    ? lang === 'zh'
                      ? '最新优先'
                      : 'Newest'
                    : lang === 'zh'
                    ? '年代顺序'
                    : 'Oldest'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Batch Selection Banner (when in Batch Mode) */}
        <AnimatePresence>
          {isBatchMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 sm:px-8 py-2.5 bg-[#141414] border-b border-white/10 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-1.5 font-bold text-white hover:text-[#ff3650] transition-colors cursor-pointer"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#ff3650]" />
                  ) : (
                    <Square className="w-4 h-4 text-white/50" />
                  )}
                  <span>{isAllSelected ? '取消全选' : `全选当前页 (${filteredWorks.length})`}</span>
                </button>

                <span className="text-white/40">|</span>

                <span className="font-mono text-white/80">
                  已勾选 <span className="font-bold text-[#ff3650]">{selectedIds.size}</span> 部作品
                </span>
              </div>

              <div className="flex items-center gap-2 text-white/50 text-[11px]">
                <span>点击任意卡片即可快速勾选/取消</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid of works with layout animations */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 relative pb-28">
          <AnimatePresence mode="popLayout">
            {loadingList && films.length === 0 ? (
              <div className="py-16 flex justify-center">
                <Loader variant="comet" size={32} label={lang === 'zh' ? '加载片库' : 'Loading'} className="text-[#ff3650]" />
              </div>
            ) : filteredWorks.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="py-16 text-center text-white/60"
              >
                <p className="text-lg font-bold mb-2">
                  {lang === 'zh'
                    ? '未找到匹配的作品'
                    : lang === 'ja'
                    ? '該当する作品が見つかりませんでした'
                    : 'No matching titles found'}
                </p>
                <p className="text-xs text-white/40 mb-4">
                  {lang === 'zh'
                    ? '请尝试切换分类或更换搜索关键词'
                    : 'Try adjusting your search or category filter.'}
                </p>
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#ff3650] text-white text-xs font-bold hover:bg-[#ff203c] transition-colors cursor-pointer"
                >
                  {lang === 'zh' ? '重置筛选' : 'Reset Filters'}
                </button>
              </motion.div>
            ) : (
              <>
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredWorks.map((work) => {
                    const isSelected = selectedIds.has(work.id);
                    const isWatched = !!watchedMap[work.id];

                    return (
                      <motion.div
                        layout
                        key={work.id}
                        data-film-id={work.id}
                        initial={{ opacity: 0, scale: 0.88, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: -12 }}
                        transition={{
                          duration: 0.32,
                          ease: TRIGGER_EASE,
                          layout: { duration: 0.35, ease: TRIGGER_EASE },
                        }}
                      >
                        <TiltCard
                          data-film-id={work.id}
                          onClick={() => {
                            if (isBatchMode) {
                              handleToggleSelect(work.id);
                            } else {
                              void catalog.get(work.id).then((full) => onSelectWork(full ?? work)).catch(() => onSelectWork(work));
                            }
                          }}
                          className={`group/item cursor-pointer flex flex-col bg-[#222222] rounded-2xl overflow-hidden border transition-all duration-300 relative ${
                            isSelected
                              ? 'border-[#ff3650] ring-2 ring-[#ff3650] shadow-[0_12px_30px_rgba(255,54,80,0.35)]'
                              : 'border-white/10 hover:border-[#ff3650] hover:shadow-[0_12px_30px_rgba(255,54,80,0.25)]'
                          }`}
                        >
                          <div className="relative aspect-[27/40] overflow-hidden bg-black/40">
                            <img
                              src={work.image}
                              alt={
                                lang === 'zh' && work.titleZh
                                  ? work.titleZh
                                  : lang === 'en' && work.titleEn
                                  ? work.titleEn
                                  : work.title
                              }
                              className={`w-full h-full object-cover transition-transform duration-500 ${
                                isBatchMode ? '' : 'group-hover/item:scale-108'
                              }`}
                              loading="lazy"
                            />

                            {/* Batch Selection Checkbox Indicator */}
                            {isBatchMode ? (
                              <div
                                onClick={(e) => handleToggleSelect(work.id, e)}
                                className={`absolute top-2.5 right-2.5 z-20 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-[#ff3650] text-white shadow-lg ring-2 ring-white'
                                    : 'bg-black/60 backdrop-blur-md text-white/40 border border-white/30 hover:border-white'
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  <span className="w-2 h-2 rounded-sm bg-white/30" />
                                )}
                              </div>
                            ) : null}

                            {/* Watched Status Badge (Always Visible If Marked) */}
                            {isWatched && (
                              <div className="absolute top-2.5 right-2.5 z-10 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-[#e0fe3d] border border-[#e0fe3d]/40 flex items-center gap-1 shadow-sm">
                                <Eye className="w-3 h-3" />
                                <span>已看</span>
                              </div>
                            )}

                            {/* Year Badge */}
                            <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[10px] font-black text-white border border-white/15">
                              {work.year}{work.releaseDate ? ` · ${work.releaseDate}` : ''}
                            </div>

                            {/* Normal Hover Play Badge */}
                            {!isBatchMode && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#ff3650] px-3.5 py-1.5 rounded-full shadow-lg transform scale-90 group-hover/item:scale-100 transition-transform">
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>{lang === 'zh' ? '查看详情' : 'VIEW'}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-wider block mb-1">
                                {work.category}
                              </span>
                              <h3 className="text-xs sm:text-sm font-black text-white line-clamp-2 leading-snug group-hover/item:text-[#ff3650] transition-colors">
                                {lang === 'zh' && work.titleZh
                                  ? work.titleZh
                                  : lang === 'en' && work.titleEn
                                  ? work.titleEn
                                  : work.title}
                              </h3>
                              {(work.director || work.duration != null) && (
                                <p className="text-[11px] text-white/50 line-clamp-1 mt-1 font-medium">
                                  {work.director}{work.director && work.duration != null ? ' · ' : ''}{work.duration != null ? `${work.duration} 分钟` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </TiltCard>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
              {films.length < total && (
                <div className="flex justify-center pt-6">
                  <button
                    type="button"
                    onClick={loadMore}
                    className="px-5 py-2 rounded-full bg-white/10 hover:bg-[#ff3650] text-xs font-black text-white border border-white/15 transition-colors cursor-pointer"
                  >
                    {lang === 'zh' ? `加载更多（${films.length}/${total}）` : `Load more (${films.length}/${total})`}
                  </button>
                </div>
              )}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Bottom Batch Action Bar */}
        <AnimatePresence>
          {isBatchMode && selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25, ease: TRIGGER_EASE }}
              className="absolute bottom-6 left-6 right-6 z-30 bg-[#151515]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#ff3650] text-white flex items-center justify-center font-bold text-xs">
                  {selectedIds.size}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    已勾选 {selectedIds.size} 部作品
                  </p>
                  <p className="text-[11px] text-white/50">
                    可一键批量记录为「已看过」并同步至资历档案
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleBatchRemoveWatched}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/15 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>批量清除已看</span>
                </button>

                <button
                  type="button"
                  onClick={handleBatchMarkWatched}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-[#ff3650] hover:bg-[#ff203c] shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmitting ? '正在标记...' : '批量标记为已看过'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
