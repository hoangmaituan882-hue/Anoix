import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CredentialsCoverflow, RiffleRecipeSlide } from '../../features/credentials/CredentialsCoverflow';
import { CredentialsShareModal } from '../../features/credentials/CredentialsShareModal';
import { FlameGraphCard } from '../../features/credentials/FlameGraphCard';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { VideoModal } from '../../components/ui/VideoModal';
import { community, WatchItem } from '../../lib/community';
import { nominations, VoteActivity, NominationActivity } from '../../lib/nominations';
import { getSession, SessionUser } from '../../lib/session';
import { catalog } from '../../lib/catalog';
import { uniqueFilmIds, buildCoverflowSlides } from '../../lib/credentialsCatalog.js';
import { Language } from '../../types';
import {
  Share2,
  Plus,
  Search,
  Film,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface BoardItem {
  id: string;
  title: string;
  underImage: string;
  coverImage: string;
  timeAgo: string;
  tag?: string;
  isShared?: boolean;
}

const INITIAL_BOARDS: BoardItem[] = [];

const SHARED_BOARDS: BoardItem[] = [
  {
    id: 'shared-1',
    title: 'TRIGGER 放映会社区公开展台 2026',
    tag: '官方联名',
    underImage: '/assets/riffle/image-004.webp',
    coverImage: '/assets/riffle/image-005.webp',
    timeAgo: '社区主理人 2 天前分享',
    isShared: true,
  },
  {
    id: 'shared-2',
    title: '今石洋之监督名作典藏原声连奏',
    tag: '精选合集',
    underImage: '/assets/riffle/image-006.webp',
    coverImage: '/assets/riffle/image-007.webp',
    timeAgo: '放映组 5 天前分享',
    isShared: true,
  },
];

interface CredentialsPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
  onPlayTrailer?: (url: string) => void;
}

export const CredentialsPage: React.FC<CredentialsPageProps> = ({
  lang,
  setLang,
  onOpenModal,
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [topTab, setTopTab] = useState<'boards' | 'drops'>('boards');
  const [subTab, setSubTab] = useState<'recents' | 'shared'>('recents');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [boards, setBoards] = useState<BoardItem[]>(INITIAL_BOARDS);
  const [newBoardModalOpen, setNewBoardModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Dynamic slides for 3D Coverflow
  const [coverflowSlides, setCoverflowSlides] = useState<RiffleRecipeSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);

  // Stats for passport export
  const [statsData, setStatsData] = useState({
    totalScreenings: 4,
    totalNominations: 3,
    totalWatches: 12,
    avgRating: 4.8,
    joinDays: 186,
    level: 'LV.8 资深放映主理人',
    rank: 42,
    percentile: 'TOP 3.8%',
    totalHours: 186.5,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);

    getSession().then((u) => {
      if (alive) setUser(u);
    });

    const loadData = async () => {
      try {
        let watchList: WatchItem[] = [];
        let userActivity: { votes: VoteActivity[]; nominations: NominationActivity[] } = {
          votes: [],
          nominations: [],
        };

        try {
          watchList = (await community.watchList()) || [];
        } catch {
          // fallback
        }

        try {
          userActivity = await nominations.activity();
        } catch {
          // fallback
        }

        if (!alive) return;

        const shuffledWatched = [...watchList].sort(() => 0.5 - Math.random());
        const pickedWatches = shuffledWatched.slice(0, 5);
        const filmRows = await Promise.all(
          uniqueFilmIds(pickedWatches).map((id) => catalog.get(id).catch(() => null)),
        );
        const films = filmRows.filter((row) => row != null);

        let library = [];
        try {
          library = await catalog.featured();
        } catch {
          library = [];
        }
        if (library.length < 5) {
          try {
            const page = await catalog.list({ limit: 24, offset: 0 });
            library = [...library, ...(page.items || [])];
          } catch {
            /* keep featured-only */
          }
        }

        if (!alive) return;

        // Compute stats
        const totalWatches = Math.max(watchList.length, 12);
        const totalNominations = Math.max(userActivity.nominations?.length || 0, 3);
        const avgRating =
          watchList.length > 0
            ? watchList.reduce((acc, cur) => acc + (cur.rating || 5), 0) / watchList.length
            : 4.9;

        setStatsData({
          totalScreenings: 4,
          totalNominations,
          totalWatches,
          avgRating,
          joinDays: 186,
          level: 'LV.8 资深放映主理人',
        });

        const libraryShuffled = [...library].sort(() => 0.5 - Math.random());
        setCoverflowSlides(
          buildCoverflowSlides({
            watches: pickedWatches,
            films,
            library: libraryShuffled,
            lang,
            limit: 5,
          }),
        );
      } catch (err) {
        console.error('Failed to load credentials data', err);
      } finally {
        if (alive) {
          setTimeout(() => {
            if (alive) setLoading(false);
          }, 320);
        }
      }
    };

    loadData();

    return () => {
      alive = false;
    };
  }, [lang]);

  // Filter boards based on search query and subTab
  const currentList = subTab === 'recents' ? boards : SHARED_BOARDS;
  const filteredBoards = useMemo(() => {
    return currentList.filter((b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [currentList, searchQuery]);

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    const newBoard: BoardItem = {
      id: `board-${Date.now()}`,
      title: newBoardTitle.trim(),
      tag: '自定义看板',
      underImage: '/assets/riffle/image-008.webp',
      coverImage: '/assets/riffle/image-009.webp',
      timeAgo: '刚刚创建',
    };
    setBoards([newBoard, ...boards]);
    setNewBoardTitle('');
    setNewBoardModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfb] dark:bg-[#050505] text-neutral-900 dark:text-[#e5e5e5] font-sans antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      {/* Website Universal Header */}
      <Header
        lang={lang}
        setLang={setLang}
        onNavigate={() => navigate('/')}
        onOpenModal={onOpenModal}
      />

      {/* Main Container */}
      <main className="flex-1 min-h-0 pt-20">
        <div className="relative flex h-full flex-col">
          {/* Sub-Header HUD Bar with Light & Dark adaptation */}
          <section className="w-full bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-neutral-200 dark:border-[#1f1f1f] sticky top-16 z-40 transition-colors duration-300">
            <div className="container mx-auto px-4 md:px-6">
              <div className="relative flex flex-wrap items-center justify-between gap-3 h-16 md:flex-nowrap">
                {/* Left: System code & Status */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white tracking-wide">
                      放映资历通行证
                    </span>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-neutral-100 dark:bg-[#161616] border border-neutral-200 dark:border-[#262626] text-neutral-600 dark:text-[#888888] px-2.5 py-0.5 text-[11px] font-medium select-none">
                    成就与藏品档案
                  </span>
                </div>

                {/* Center: Boards vs Drops switcher */}
                <div className="flex items-center justify-center">
                  <div className="p-1 bg-neutral-100 dark:bg-[#141414] rounded-lg border border-neutral-200 dark:border-[#242424] flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTopTab('boards')}
                      className={`relative px-4 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        topTab === 'boards'
                          ? 'bg-white text-black shadow-xs dark:bg-[#262626] dark:text-white font-semibold'
                          : 'text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white'
                      }`}
                    >
                      放映成就看板
                    </button>

                    <button
                      type="button"
                      onClick={() => setTopTab('drops')}
                      className={`relative px-4 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        topTab === 'drops'
                          ? 'bg-white text-black shadow-xs dark:bg-[#262626] dark:text-white font-semibold'
                          : 'text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white'
                      }`}
                    >
                      限定物料藏品
                    </button>
                  </div>
                </div>

                {/* Right: Search, Export Card, New Board */}
                <div className="flex items-center justify-end gap-2.5">
                  {/* Search */}
                  <div
                    className={`relative h-8 transition-[width] duration-300 ease-in-out ${
                      searchFocused || searchQuery ? 'w-44 sm:w-52' : 'w-7'
                    }`}
                  >
                    <button
                      type="button"
                      aria-label="Search boards"
                      onClick={() => setSearchFocused(true)}
                      className="absolute inset-y-0 left-0 flex h-8 w-7 items-center justify-start text-neutral-400 hover:text-black dark:text-[#737373] dark:hover:text-white focus:outline-none cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                    <input
                      aria-label="Search boards"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      placeholder={lang === 'zh' ? '搜索放映看板...' : 'Search boards...'}
                      className={`relative h-8 w-full bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-lg pl-7 pr-6 text-xs text-black dark:text-white placeholder:text-neutral-400 dark:placeholder:text-[#666666] focus:outline-none focus:border-neutral-500 dark:focus:border-[#404040] transition-all ${
                        searchFocused || searchQuery
                          ? 'opacity-100 pointer-events-auto'
                          : 'opacity-0 pointer-events-none'
                      }`}
                      type="text"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-2 text-xs text-neutral-400 hover:text-black dark:text-[#737373] dark:hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Export Passport / Share Button */}
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 dark:bg-[#141414] dark:border-[#242424] dark:hover:bg-[#1f1f1f] dark:hover:border-[#383838] text-neutral-700 hover:text-black dark:text-[#cccccc] dark:hover:text-white text-xs font-medium transition-all cursor-pointer"
                    title="生成并导出放映资历通行证"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-500 dark:text-[#888888]" />
                    <span className="hidden sm:inline">
                      {lang === 'zh' ? '导出资历卡' : 'Export Passport'}
                    </span>
                  </button>

                  {/* CTA Button: New Board */}
                  <button
                    onClick={() => setNewBoardModalOpen(true)}
                    className="items-center justify-center whitespace-nowrap transition-all hover:bg-neutral-800 dark:hover:bg-[#e5e5e5] active:scale-95 h-8 px-3.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-semibold gap-1 inline-flex cursor-pointer shadow-xs"
                    type="button"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{lang === 'zh' ? '新建看板' : 'New Board'}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Body Scroll Content */}
          <div className="w-full flex-1 px-4 sm:px-6 pt-4 pb-20 md:pt-6">
            {topTab === 'boards' ? (
              <div>
                {/* 3D Coverflow Showcase Section */}
                <CredentialsCoverflow
                  items={coverflowSlides}
                  loading={loading}
                  onPlay={(slide) => {
                    const url = slide.videoUrl || 'https://www.youtube.com/watch?v=JtqIas3bYhg';
                    setActiveVideo({ url, title: slide.title });
                  }}
                  onSelect={(slide) => {
                    const url = slide.videoUrl || 'https://www.youtube.com/watch?v=JtqIas3bYhg';
                    setActiveVideo({ url, title: slide.title });
                  }}
                />

                {/* Boards Gallery Grid Section */}
                <div className="mx-auto w-full max-w-[976px] mt-6">
                  <div className="w-full min-w-0">
                    {/* Sticky Sub-tabs bar */}
                    <div className="sticky top-32 z-30 -mx-6 bg-[#fbfbfb]/90 dark:bg-[#050505]/90 backdrop-blur-md px-6 pt-3 pb-2 border-b border-neutral-200 dark:border-[#1f1f1f] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-6 text-sm font-medium">
                          <button
                            onClick={() => setSubTab('recents')}
                            className={`relative pb-2 transition-colors focus:outline-none cursor-pointer ${
                              subTab === 'recents'
                                ? 'text-neutral-900 dark:text-white font-semibold'
                                : 'text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white'
                            }`}
                          >
                            <span>{lang === 'zh' ? '最新看板' : 'Recents'}</span>
                            {subTab === 'recents' && (
                              <motion.div
                                layoutId="subtab-active"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"
                                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                              />
                            )}
                          </button>
                          <button
                            onClick={() => setSubTab('shared')}
                            className={`relative pb-2 transition-colors focus:outline-none cursor-pointer ${
                              subTab === 'shared'
                                ? 'text-neutral-900 dark:text-white font-semibold'
                                : 'text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white'
                            }`}
                          >
                            <span>{lang === 'zh' ? '放映会联名' : 'Shared with me'}</span>
                            {subTab === 'shared' && (
                              <motion.div
                                layoutId="subtab-active"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"
                                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                              />
                            )}
                          </button>
                        </div>

                        <span className="text-xs text-neutral-400 dark:text-[#737373]">
                          {filteredBoards.length} {lang === 'zh' ? '项放映看板' : 'BOARDS'}
                        </span>
                      </div>
                    </div>

                    {/* Content Section based on subTab */}
                    <div className="w-full min-w-0 pt-6">
                      {subTab === 'recents' ? (
                        /* Recents: Flame Graph Data Visualization Component */
                        <div className="space-y-8">
                          <FlameGraphCard />

                          {/* If user created custom boards, display them below */}
                          {filteredBoards.length > 0 && (
                            <div className="pt-4">
                              <h4 className="text-xs font-mono font-bold text-neutral-500 dark:text-[#888888] uppercase tracking-wider mb-4">
                                自定义放映看板 ({filteredBoards.length})
                              </h4>
                              <div className="grid w-full grid-flow-row justify-center justify-items-start gap-x-4 gap-y-10 sm:gap-x-10 [grid-template-columns:repeat(1,max-content)] min-[360px]:[grid-template-columns:repeat(2,max-content)] sm:[grid-template-columns:repeat(auto-fill,13.10rem)]">
                                {filteredBoards.map((b, idx) => (
                                  <motion.div
                                    key={b.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                                  >
                                    <div className="group relative flex flex-col cursor-pointer">
                                      <div className="block">
                                        <div className="w-36 h-36 sm:w-44 sm:h-44 bg-neutral-100 dark:bg-[#141414] rounded-xl overflow-hidden mb-3 relative border border-neutral-200 dark:border-[#202020] group-hover:border-neutral-400 dark:group-hover:border-[#383838] shadow-md transition-all duration-500 ease-out">
                                          <img
                                            alt={b.title}
                                            className="w-full h-full object-cover"
                                            src={b.underImage}
                                            style={{
                                              position: 'absolute',
                                              height: '100%',
                                              width: '100%',
                                              inset: '0px',
                                              color: 'transparent',
                                            }}
                                            draggable={false}
                                          />
                                          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:translate-x-3">
                                            <img
                                              alt={`${b.title} cover`}
                                              className="w-full h-full object-cover"
                                              src={b.coverImage}
                                              style={{
                                                position: 'absolute',
                                                height: '100%',
                                                width: '100%',
                                                inset: '0px',
                                                color: 'transparent',
                                              }}
                                              draggable={false}
                                            />
                                            {b.tag && (
                                              <div className="absolute top-2 left-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/80 dark:bg-black/70 backdrop-blur-md text-neutral-800 dark:text-[#d4d4d4] border border-black/10 dark:border-white/10">
                                                  {b.tag}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="w-36 sm:w-44 text-left relative">
                                        <div className="flex items-center justify-between gap-2 h-6">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate group-hover:text-neutral-700 dark:group-hover:text-white/80 transition-colors">
                                              {b.title}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-[11px] text-neutral-500 dark:text-[#737373]">
                                          <span>{b.timeAgo}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Shared tab: Community / Partner Boards */
                        filteredBoards.length > 0 ? (
                          <div className="grid w-full grid-flow-row justify-center justify-items-start gap-x-4 gap-y-10 sm:gap-x-10 [grid-template-columns:repeat(1,max-content)] min-[360px]:[grid-template-columns:repeat(2,max-content)] sm:[grid-template-columns:repeat(auto-fill,13.10rem)]">
                            {filteredBoards.map((b, idx) => (
                              <motion.div
                                key={b.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: idx * 0.04 }}
                              >
                                <div className="group relative flex flex-col cursor-pointer">
                                  <div className="block">
                                    <div className="w-36 h-36 sm:w-44 sm:h-44 bg-neutral-100 dark:bg-[#141414] rounded-xl overflow-hidden mb-3 relative border border-neutral-200 dark:border-[#202020] group-hover:border-neutral-400 dark:group-hover:border-[#383838] shadow-md transition-all duration-500 ease-out">
                                      <img
                                        alt={b.title}
                                        className="w-full h-full object-cover"
                                        src={b.underImage}
                                        style={{
                                          position: 'absolute',
                                          height: '100%',
                                          width: '100%',
                                          inset: '0px',
                                          color: 'transparent',
                                        }}
                                        draggable={false}
                                      />
                                      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:translate-x-3">
                                        <img
                                          alt={`${b.title} cover`}
                                          className="w-full h-full object-cover"
                                          src={b.coverImage}
                                          style={{
                                            position: 'absolute',
                                            height: '100%',
                                            width: '100%',
                                            inset: '0px',
                                            color: 'transparent',
                                          }}
                                          draggable={false}
                                        />
                                        {b.tag && (
                                          <div className="absolute top-2 left-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/80 dark:bg-black/70 backdrop-blur-md text-neutral-800 dark:text-[#d4d4d4] border border-black/10 dark:border-white/10">
                                              {b.tag}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="w-36 sm:w-44 text-left relative">
                                    <div className="flex items-center justify-between gap-2 h-6">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate group-hover:text-neutral-700 dark:group-hover:text-white/80 transition-colors">
                                          {b.title}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-[11px] text-neutral-500 dark:text-[#737373]">
                                      <span>{b.timeAgo}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          /* Empty State for Shared */
                          <div className="flex flex-col items-center justify-center py-20 px-6">
                            <div className="w-14 h-14 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl flex items-center justify-center mb-4">
                              <Film className="w-6 h-6 text-neutral-400 dark:text-[#737373]" />
                            </div>
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                              {lang === 'zh' ? '暂无联名放映看板' : 'No shared boards'}
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-[#737373]">
                              {lang === 'zh' ? '来自放映组和社区官方的联名企划将在此呈现' : 'Shared boards will appear here'}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Drops Tab */
              <div className="mx-auto w-full max-w-[800px] py-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] flex items-center justify-center mb-5">
                  <Layers className="w-8 h-8 text-neutral-700 dark:text-[#d4d4d4]" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                  {lang === 'zh' ? '专属放映特典与绝版票根馆' : 'EXCLUSIVE SCREENING DROPS'}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-[#888888] max-w-md mx-auto leading-relaxed">
                  {lang === 'zh'
                    ? '在这里查看你已解锁的历届放映会实体通行证、特制烫金 B2 海报与限定特典徽章。'
                    : 'View all your unlocked screening physical passports, foil posters, and official badges.'}
                </p>
                <button
                  onClick={() => navigate('/screenings')}
                  className="mt-6 inline-flex items-center gap-2 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5] text-xs font-semibold px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{lang === 'zh' ? '浏览历届特设放映档案' : 'Explore Screenings'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Website Universal Footer */}
      <Footer lang={lang} />

      {/* New Board Modal */}
      <AnimatePresence>
        {newBoardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
              onClick={() => setNewBoardModalOpen(false)}
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleCreateBoard}
              className="relative w-full max-w-md bg-white dark:bg-[#121212] border border-neutral-200 dark:border-[#242424] rounded-2xl p-6 shadow-2xl z-10 space-y-4 text-neutral-900 dark:text-white"
            >
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {lang === 'zh' ? '创建新的放映看板' : 'Create a new board'}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-[#888888]">
                {lang === 'zh'
                  ? '为你的私人放映会片单、特设打卡或音乐合集命名。'
                  : 'Name your board to start curating records, stacks, and screening credentials.'}
              </p>
              <input
                type="text"
                autoFocus
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder={lang === 'zh' ? '例如：赛博朋克夜之城原声特设' : 'e.g. midnight cyberpunk tapes'}
                className="w-full bg-neutral-50 dark:bg-[#181818] border border-neutral-200 dark:border-[#2a2a2a] rounded-lg px-3.5 py-2.5 text-xs text-black dark:text-white focus:outline-none focus:border-neutral-500 dark:focus:border-white/50 transition-colors"
              />
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBoardModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-black dark:text-[#888888] dark:hover:text-white transition-colors cursor-pointer"
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!newBoardTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5] disabled:opacity-40 rounded-lg transition-all cursor-pointer"
                >
                  {lang === 'zh' ? '立即创建' : 'Create board'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Passport Share Modal */}
      <CredentialsShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        userName={user?.name || '放映会先锋会员'}
        avatarUrl={user?.avatarUrl}
        stats={statsData}
      />

      {/* Video Trailer Modal */}
      {activeVideo && (
        <VideoModal
          videoUrl={activeVideo.url}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
};
