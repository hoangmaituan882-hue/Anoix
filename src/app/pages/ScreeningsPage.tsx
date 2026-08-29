import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Language, OpenSiteModal, WorkItem } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { Screening } from '../../types/screening';
import { presentLiveScreenings } from '../../lib/screeningsArchive.js';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ScreeningPosterModal } from '../../features/screenings/ScreeningPosterModal';
import {
  ScreeningFilterPills,
  FilterCondition,
  evaluateScreeningFilters,
} from '../../features/screenings/ScreeningFilterPills';
import { community } from '../../lib/community';
import { mapFilmCard } from '../../lib/catalog';
import { PageHero } from '../../components/layout/PageHero';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ScreeningSkeletonGrid } from '../../features/screenings/ScreeningSkeleton';
import {
  Film,
  Calendar,
  MapPin,
  Clock,
  Volume2,
  Ticket,
  Search,
  List,
  LayoutGrid,
  Layers,
  Eye,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

export const tabOptions = [
  { id: 1, label: '时间列表', value: 'list_view', icon: List },
  { id: 2, label: '海报画廊', value: 'card_view', icon: LayoutGrid },
  { id: 3, label: '特设叠卡', value: 'pack_view', icon: Layers },
];

interface TabButtonProps {
  key?: React.Key;
  label: string;
  onClick: () => void;
  isActive: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

export function TabButton({ isActive, label, onClick, icon: Icon }: TabButtonProps) {
  return (
    <button
      type="button"
      className="relative px-3.5 py-1.5 rounded-full cursor-pointer transition-colors select-none flex items-center gap-1.5"
      onClick={onClick}
    >
      {isActive && (
        <motion.div
          layoutId="screenings_view_tab"
          className="absolute inset-0 rounded-full bg-[#ff3650] shadow-[0_2px_8px_rgba(255,54,80,0.35)]"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <span
        className={`relative z-10 flex items-center gap-1.5 text-[12px] font-bold transition-colors ${
          isActive
            ? 'text-white font-black'
            : 'text-white/60 hover:text-white'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </span>
    </button>
  );
}

interface ScreeningsPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (modalName: OpenSiteModal) => void;
}

export const ScreeningsPage: React.FC<ScreeningsPageProps> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Screening[] | null>(null);
  const [tab, setTab] = useState('list_view');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([]);
  const [activePosterModal, setActivePosterModal] = useState<Screening | null>(null);
  const [modalFilms, setModalFilms] = useState<WorkItem[]>([]);
  const [packHoveredKey, setPackHoveredKey] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
    fetch(`${base}/api/screenings`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Screening[]) => {
        if (!alive) return;
        setRows(presentLiveScreenings(data) as Screening[]);
      })
      .catch(() => {
        if (alive) setRows([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Available years - strictly extract 4-digit years
  const availableYears = useMemo(() => {
    if (!rows) return [];
    const yearsSet = new Set<string>();
    rows.forEach((s) => {
      const match = s.screen_date.match(/\b(19\d\d|20\d\d)\b/);
      const year = match ? match[1] : s.screen_date.slice(0, 4);
      if (year && year.length === 4) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [rows]);

  // Filtered screenings through search, year chips, and multi-dimensional filter pills
  const filteredRows = useMemo(() => {
    if (!rows) return [];

    // Step 1: Multi-dimensional condition filter pills
    let result = evaluateScreeningFilters(rows, filterConditions);

    // Step 2: Year Selector chip
    if (selectedYear !== 'all') {
      result = result.filter((s) => s.screen_date.includes(selectedYear));
    }

    // Step 3: Text Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const matchTitle =
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.title_zh && s.title_zh.toLowerCase().includes(q)) ||
          (s.title_en && s.title_en.toLowerCase().includes(q));
        const matchVenue = s.venue && s.venue.toLowerCase().includes(q);
        const matchTheme = s.theme && s.theme.toLowerCase().includes(q);
        const matchGuest =
          s.special_guests && s.special_guests.some((g) => g.toLowerCase().includes(q));
        return Boolean(matchTitle || matchVenue || matchTheme || matchGuest);
      });
    }

    return result;
  }, [rows, selectedYear, searchQuery, filterConditions]);

  // Monthly grouped timeline cards for Pack View
  const monthGroups = useMemo(() => {
    if (!filteredRows || filteredRows.length === 0) return [];
    const groupsMap = new Map<string, Screening[]>();

    filteredRows.forEach((item) => {
      const match = item.screen_date.match(/^(\d{4})[.-](\d{2})/);
      const key = match ? `${match[1]}.${match[2]}` : item.screen_date.slice(0, 7);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(item);
    });

    return Array.from(groupsMap.entries())
      .map(([monthKey, items]) => {
        const [year, month] = monthKey.split('.');
        const monthNum = parseInt(month, 10);
        return {
          monthKey,
          year,
          month,
          label: `${year}年${monthNum}月`,
          items,
        };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredRows]);

  const handleSelectFilm = (filmId: string) => {
    navigate(`/films/${filmId}`, { viewTransition: true });
  };

  const openPoster = (item: Screening) => {
    setActivePosterModal(item);
    setModalFilms([]);
    community
      .screening(item.id)
      .then((detail) => {
        setModalFilms((detail.films || []).map((row) => mapFilmCard(row as unknown as Record<string, unknown>)));
      })
      .catch(() => setModalFilms([]));
  };

  // Quick preset filter helper
  const addQuickPreset = (preset: FilterCondition) => {
    setSelectedYear('all');
    setFilterConditions((prev) => {
      const exists = prev.some((p) => p.field === preset.field && p.value === preset.value);
      if (exists) return prev;
      return [...prev, preset];
    });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#f5ffe5] font-sans antialiased selection:bg-[#ff3650] selection:text-white transition-colors duration-300">
      {/* Top Floating Action Loading Toast */}
      <AnimatePresence>
        {rows === null && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -30, x: '-50%' }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-5 left-1/2 z-[2147483647] pointer-events-none select-none"
          >
            <div className="flex items-center gap-2.5 px-6 py-2 rounded-full bg-[#181818] text-white shadow-xl border border-white/10 text-[12px] font-bold tracking-wide">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
              <span>正在载解放映档案...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Website Header */}
      <Header
        lang={lang}
        setLang={setLang}
        onNavigate={() => navigate('/')}
        onOpenModal={onOpenModal}
      />

      <main
        id="screening_container"
        className="w-full min-h-screen bg-[#121212] px-4 sm:px-8 lg:px-12 pt-14 sm:pt-16 pb-12 text-[#f5ffe5]"
      >
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Unified Clean Page Hero adhering to 24px Main Title & 14px Subtitle */}
          <PageHero
            title="放映会档案与特设物料"
            subtitle="只记社内放过的夜：海报、场地与当场片子。接口失败则空列表，不混工作室首映种子。"
          />

          {/* Concise Unified Controls HUD Toolbar */}
          <div className="my-4 sm:my-5 p-2 bg-[#181818]/90 backdrop-blur-md rounded-2xl border border-white/10 sticky top-16 sm:top-20 z-30 transition-colors space-y-2.5">
            {/* Top Toolbar Row: Switcher + Search + Year Chips */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* View Mode Switcher with Morphing Pill */}
              <div className="flex items-center gap-1 p-1 bg-black/40 rounded-full border border-white/10">
                {tabOptions.map((item) => (
                  <TabButton
                    key={item.id}
                    isActive={tab === item.value}
                    label={item.label}
                    icon={item.icon}
                    onClick={() => setTab(item.value)}
                  />
                ))}
              </div>

              {/* Search & Year Filtering */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-52">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索放映 / 影院 / 嘉宾..."
                    className="w-full bg-black/40 border border-white/10 focus:border-[#ff3650] rounded-full pl-8 pr-3 py-1.5 text-[12px] text-white placeholder-white/40 focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Year Selector Chips */}
                <div className="flex items-center gap-1 overflow-x-auto p-0.5">
                  <button
                    onClick={() => setSelectedYear('all')}
                    className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer shrink-0 ${
                      selectedYear === 'all' && filterConditions.length === 0
                        ? 'bg-[#ff3650] text-white shadow-sm'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    全部年份
                  </button>
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer shrink-0 ${
                        selectedYear === year
                          ? 'bg-[#ff3650] text-white shadow-sm'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {year}年
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: Pure Chinese Filter Pills Bar */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <ScreeningFilterPills
                  conditions={filterConditions}
                  onChange={setFilterConditions}
                  availableYears={availableYears}
                />
              </div>

              {/* Quick Preset Badges when no condition is active */}
              {filterConditions.length === 0 && (
                <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-white/40">
                  <span>快捷预设：</span>
                  <button
                    onClick={() =>
                      addQuickPreset({
                        id: `qp_recent_${Date.now()}`,
                        field: 'date',
                        operator: '晚于',
                        value: '2023',
                      })
                    }
                    className="px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10"
                  >
                    📅 晚于 2023年
                  </button>
                  <button
                    onClick={() =>
                      addQuickPreset({
                        id: `qp_audio_${Date.now()}`,
                        field: 'audio',
                        operator: '包含',
                        value: '杜比全景声',
                      })
                    }
                    className="px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/10"
                  >
                    🔊 杜比全景声
                  </button>
                  <button
                    onClick={() =>
                      addQuickPreset({
                        id: `qp_status_${Date.now()}`,
                        field: 'status',
                        operator: '为',
                        value: 'upcoming',
                      })
                    }
                    className="px-2.5 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-[#ff3650] hover:bg-[#ff3650] hover:text-white transition-colors cursor-pointer border border-[#ff3650]/20 font-bold"
                  >
                    🎟️ 即将上映
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content with 1:1 Reference Shared layoutId Morphing */}
          {rows === null ? (
            <div className="py-4">
              <ScreeningSkeletonGrid viewMode={tab} />
            </div>
          ) : filteredRows.length === 0 ? (
            /* Empty State */
            <div className="bg-[#181818] border border-white/10 rounded-3xl p-10 text-center max-w-md mx-auto my-8">
              <Film className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <h3 className="text-[18px] font-bold text-white mb-1">
                未找到符合条件的放映记录
              </h3>
              <p className="text-[14px] text-white/55 mb-5 leading-[1.55]">
                请尝试调整筛选条件或清空搜索关键词。
              </p>
              <button
                onClick={() => {
                  setSelectedYear('all');
                  setSearchQuery('');
                  setFilterConditions([]);
                }}
                className="bg-white/10 hover:bg-[#ff3650] text-white text-[16px] font-bold px-5 py-2.5 rounded-full transition-colors cursor-pointer shadow-sm"
              >
                重置所有筛选条件
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {/* Mode 1: List View (1:1 with reference List structure) */}
              {tab === tabOptions[0].value && (
                <motion.div
                  key="list_view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3 flex-1 flex-col"
                >
                  {filteredRows.map((item) => {
                    const title = item.title_zh || item.title;
                    const poster =
                      item.demo_poster_url ||
                      item.poster_url ||
                      'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/CPER2-2.jpg';

                    return (
                      <div
                        key={item.id}
                        onClick={() => openPoster(item)}
                        className="group flex justify-between items-center p-3.5 rounded-2xl bg-[#181818] border border-white/10 hover:border-[#ff3650]/50 transition-colors cursor-pointer shadow-xs"
                      >
                        <div className="flex gap-3.5 items-center min-w-0 flex-1">
                          <motion.div
                            layoutId={`app_motion_stack_profile_${item.id}`}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10"
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <img
                              src={poster}
                              alt={title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {item.status === 'upcoming' && (
                              <div className="absolute top-1 left-1 bg-[#ff3650] text-white text-[8px] font-black px-1.5 py-0.2 rounded">
                                即将上映
                              </div>
                            )}
                          </motion.div>

                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <motion.div
                              layoutId={`app_motion_stack_name_${item.id}`}
                              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            >
                              <h3 className="text-[16px] font-bold text-white group-hover:text-[#ff3650] transition-colors truncate">
                                {title}
                              </h3>
                            </motion.div>

                            <div className="flex items-center gap-2">
                              <motion.div
                                layoutId={`app_motion_stack_price_${item.id}`}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                              >
                                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff3650] bg-[#ff3650]/10 px-2 py-0.5 rounded-full">
                                  <Calendar className="w-3 h-3" />
                                  {item.screen_date}
                                </span>
                              </motion.div>

                              {item.format_tags?.[0] && (
                                <span className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                  {item.format_tags[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <motion.div
                          layoutId={`app_motion_stack_nos_${item.id}`}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="text-[12px] text-white/50 flex items-center gap-1 shrink-0 ml-4"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#ff3650]" />
                          <span className="truncate max-w-[160px] sm:max-w-[220px]">{item.venue}</span>
                        </motion.div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* Mode 2: Card View (1:1 with reference Card structure) */}
              {tab === tabOptions[1].value && (
                <motion.div
                  key="card_view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1"
                >
                  {filteredRows.map((item) => {
                    const title = item.title_zh || item.title;
                    const poster =
                      item.demo_poster_url ||
                      item.poster_url ||
                      'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/CPER2-2.jpg';

                    return (
                      <div
                        key={item.id}
                        onClick={() => openPoster(item)}
                        className="group flex-1 flex flex-col gap-3 w-full p-3.5 rounded-2xl bg-[#181818] border border-white/10 hover:border-[#ff3650]/50 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden t-tilt-card"
                      >
                        <motion.div
                          layoutId={`app_motion_stack_profile_${item.id}`}
                          className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/60 border border-white/10"
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <img
                            src={poster}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
                            <span className="bg-[#ff3650] text-white text-[14px] font-bold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-[0_4px_16px_rgba(255,54,80,0.4)]">
                              <Eye className="w-3.5 h-3.5" />
                              <span>检视海报与票根</span>
                            </span>
                          </div>
                        </motion.div>

                        <div className="flex flex-col gap-1.5">
                          <motion.div
                            layoutId={`app_motion_stack_name_${item.id}`}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <h3 className="text-[16px] font-bold text-white group-hover:text-[#ff3650] transition-colors truncate">
                              {title}
                            </h3>
                          </motion.div>

                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <motion.div
                              layoutId={`app_motion_stack_price_${item.id}`}
                              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            >
                              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ff3650] bg-[#ff3650]/10 px-2 py-0.5 rounded-full">
                                <Calendar className="w-3 h-3" />
                                {item.screen_date}
                              </span>
                            </motion.div>

                            <motion.div
                              layoutId={`app_motion_stack_nos_${item.id}`}
                              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                              className="text-[12px] text-white/50 flex items-center gap-1 truncate max-w-[130px]"
                            >
                              <MapPin className="w-3 h-3 shrink-0 text-[#ff3650]" />
                              <span className="truncate">{item.venue}</span>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* Mode 3: Pack View (1:1 with reference Pack Stack structure) */}
              {tab === tabOptions[2].value && (
                <motion.div
                  key="pack_view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 relative min-h-[420px] flex flex-col items-center justify-center py-12 select-none"
                >
                  <div className="relative w-44 h-44 sm:w-56 sm:h-56">
                    {filteredRows.slice(0, 2).map((item, idx) => {
                      const poster =
                        item.demo_poster_url ||
                        item.poster_url ||
                        'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/CPER2-2.jpg';

                      return (
                        <motion.div
                          key={item.id}
                          className="w-full h-full absolute inset-0 cursor-pointer"
                          animate={{
                            rotate: idx === 0 ? "-15deg" : "15deg",
                            scale: packHoveredKey === item.id ? 1.08 : 1,
                          }}
                          whileHover={{ scale: 1.1 }}
                          transition={{
                            duration: 0.3,
                          }}
                          onClick={() => openPoster(item)}
                          onMouseEnter={() => setPackHoveredKey(item.id)}
                          onMouseLeave={() => setPackHoveredKey(null)}
                        >
                          <motion.div
                            layoutId={`app_motion_stack_profile_${item.id}`}
                            className="absolute left-0 top-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black/90 group-hover:border-[#ff3650]"
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <img
                              src={poster}
                              alt="image"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-14 flex flex-col items-center gap-1.5 text-center">
                    {filteredRows[0] && (
                      <motion.div
                        layoutId={`app_motion_stack_name_${filteredRows[0].id}`}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <h3 className="text-[18px] font-bold text-white">
                          {filteredRows[0].title_zh || filteredRows[0].title}
                        </h3>
                      </motion.div>
                    )}

                    {filteredRows[0] && (
                      <div className="flex items-center gap-2">
                        <motion.div
                          layoutId={`app_motion_stack_price_${filteredRows[0].id}`}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <span className="text-[12px] font-bold text-[#ff3650] bg-[#ff3650]/10 px-3 py-1 rounded-full">
                            {filteredRows[0].screen_date}
                          </span>
                        </motion.div>

                        <motion.div
                          layoutId={`app_motion_stack_nos_${filteredRows[0].id}`}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <span className="text-[12px] text-white/50">
                            共收录 {filteredRows.length} 部放映典藏
                          </span>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Poster / Details Modal */}
      <AnimatePresence>
        {activePosterModal && (
          <ScreeningPosterModal
            screening={activePosterModal}
            lang={lang}
            films={modalFilms}
            onClose={() => {
              setActivePosterModal(null);
              setModalFilms([]);
            }}
            onSelectFilm={handleSelectFilm}
          />
        )}
      </AnimatePresence>

      <Footer lang={lang} />
    </div>
  );
};
