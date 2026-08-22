import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../../types';
import { repository } from '../../lib/repository';
import { TRIGGER_EASE } from '../../lib/motion';
import { Screening } from '../../types/screening';
import { SCREENINGS_DATA } from '../../data/screeningData';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Loader } from '../../components/motion/loader';
import { ScreeningTimelineCard } from '../../features/screenings/ScreeningTimelineCard';
import { ScreeningPosterCard } from '../../features/screenings/ScreeningPosterCard';
import { ScreeningPosterModal } from '../../features/screenings/ScreeningPosterModal';
import { ScreeningTicketStub } from '../../features/screenings/ScreeningTicketStub';
import { 
  ArrowLeft, 
  CalendarDays, 
  MapPin, 
  Clapperboard, 
  Film, 
  LayoutGrid, 
  GitCommit, 
  Ticket, 
  Search, 
  SlidersHorizontal,
  Flame,
  Volume2
} from 'lucide-react';

interface ScreeningsPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}

type ViewMode = 'timeline' | 'posters' | 'tickets';

/** Screening archive — rich visual timeline, demonstration posters, and interactive tickets */
export const ScreeningsPage: React.FC<ScreeningsPageProps> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Screening[] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePosterModal, setActivePosterModal] = useState<Screening | null>(null);

  const films = repository.films();

  useEffect(() => {
    let alive = true;
    const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
    fetch(`${base}/api/screenings`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Screening[]) => {
        if (!alive) return;
        if (data && data.length > 0) {
          const merged = data.map((apiItem) => {
            const richItem = SCREENINGS_DATA.find((s) => s.id === apiItem.id || s.title === apiItem.title);
            return {
              ...richItem,
              ...apiItem,
              demo_poster_url: richItem?.demo_poster_url || apiItem.gallery?.[0] || 'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/CPER2-2.jpg',
              format_tags: richItem?.format_tags || ['Dolby Atmos', 'Special Sound'],
              special_guests: richItem?.special_guests || ['TRIGGER Staff'],
              ticket_perks: richItem?.ticket_perks || '入场特典：限定纪念票根与海报',
            };
          });
          const existingIds = new Set(data.map((d) => d.id));
          const additions = SCREENINGS_DATA.filter((s) => !existingIds.has(s.id));
          setRows([...merged, ...additions]);
        } else {
          setRows(SCREENINGS_DATA);
        }
      })
      .catch(() => {
        if (alive) setRows(SCREENINGS_DATA);
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Available years
  const availableYears = useMemo(() => {
    if (!rows) return [];
    const yearsSet = new Set<string>();
    rows.forEach((s) => {
      const year = s.screen_date.split('.')[0] || s.screen_date.slice(0, 4);
      if (year) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [rows]);

  // Filtered screenings
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((s) => {
      const matchesYear = selectedYear === 'all' || s.screen_date.startsWith(selectedYear);
      if (!matchesYear) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = (s.title && s.title.toLowerCase().includes(q)) ||
        (s.title_zh && s.title_zh.toLowerCase().includes(q)) ||
        (s.title_en && s.title_en.toLowerCase().includes(q));
      const matchVenue = s.venue && s.venue.toLowerCase().includes(q);
      const matchTheme = s.theme && s.theme.toLowerCase().includes(q);
      const matchGuest = s.special_guests && s.special_guests.some((g) => g.toLowerCase().includes(q));
      return Boolean(matchTitle || matchVenue || matchTheme || matchGuest);
    });
  }, [rows, selectedYear, searchQuery]);

  const handleSelectFilm = (filmId: string) => {
    navigate(`/films/${filmId}`);
  };

  return (
    <>
      <Header
        lang={lang}
        setLang={setLang}
        onNavigate={() => navigate('/')}
        onOpenModal={onOpenModal}
      />

      <main
        id="screening_container"
        className="w-full min-h-screen bg-[#121212] px-4 sm:px-8 lg:px-12 py-20 lg:py-24 text-[#f5ffe5]"
      >
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-[#ff3650] font-bold text-xs uppercase tracking-wider transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '返回首页' : 'BACK TO HOME'}</span>
          </button>

          {/* Clean Studio Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-[#ff3650] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  TRIGGER THEATER ARCHIVE
                </span>
                <span className="text-xs font-mono text-white/40">
                  2013 — 2026
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                {lang === 'zh' ? '放映会档案与特设海报' : 'SCREENING ARCHIVE'}
              </h1>
              <p className="text-xs sm:text-sm text-white/60 font-normal max-w-2xl mt-1.5 leading-relaxed">
                {lang === 'zh'
                  ? '记录 TRIGGER 历年影院特设放映现场、演示海报、全景声/IMAX场次与登台主创纪事。'
                  : 'Official cinema roadshow archive, featuring presentation posters, sound specs, and creator talks.'}
              </p>
            </div>

            {/* Quick Summary Chips */}
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 shrink-0 text-xs">
              <div>
                <span className="text-[10px] text-white/40 uppercase block">{lang === 'zh' ? '收录场次' : 'SESSIONS'}</span>
                <span className="font-mono font-bold text-white text-base">{rows ? rows.length : '7'}</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div>
                <span className="text-[10px] text-white/40 uppercase block">{lang === 'zh' ? '跨越年度' : 'YEARS'}</span>
                <span className="font-mono font-bold text-[#ff3650] text-base">{availableYears.length || '6'}</span>
              </div>
            </div>
          </div>

          {/* Clean Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
            
            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-white/5 rounded-xl border border-white/10 self-start">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'timeline'
                    ? 'bg-[#ff3650] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '时间线' : 'Timeline'}</span>
              </button>

              <button
                onClick={() => setViewMode('posters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'posters'
                    ? 'bg-[#ff3650] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '海报画廊' : 'Posters'}</span>
              </button>

              <button
                onClick={() => setViewMode('tickets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'tickets'
                    ? 'bg-[#ff3650] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '纪念票根' : 'Tickets'}</span>
              </button>
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
                  placeholder={lang === 'zh' ? '搜索放映 / 影院 / 嘉宾...' : 'Search...'}
                  className="w-full bg-white/5 border border-white/10 focus:border-[#ff3650] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none transition-colors"
                />
              </div>

              {/* Year Selector */}
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    selectedYear === 'all'
                      ? 'bg-white text-black font-bold'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {lang === 'zh' ? '全部' : 'ALL'}
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                      selectedYear === year
                        ? 'bg-[#ff3650] text-white font-bold'
                        : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          {rows === null ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader variant="dots" size={36} label="加载放映会档案" className="text-[#ff3650]" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-12 text-center max-w-md mx-auto my-8">
              <Clapperboard className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                {lang === 'zh' ? '未找到符合条件的放映记录' : 'No screenings match your filter'}
              </h3>
              <p className="text-xs text-white/50 mb-4">
                {lang === 'zh' ? '请尝试重置筛选或清除搜索词。' : 'Try clearing your search query or choosing another year.'}
              </p>
              <button
                onClick={() => {
                  setSelectedYear('all');
                  setSearchQuery('');
                }}
                className="bg-white/10 hover:bg-[#ff3650] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                {lang === 'zh' ? '重置筛选条件' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div>
              {/* View 1: Timeline Mode */}
              {viewMode === 'timeline' && (
                <div className="relative pl-1 sm:pl-2">
                  {/* Clean vertical ruler axis line */}
                  <div className="absolute left-[19px] sm:left-[23px] top-4 bottom-4 w-px bg-white/15 pointer-events-none" />

                  <div className="space-y-6 sm:space-y-8">
                    {filteredRows.map((screening, idx) => (
                      <ScreeningTimelineCard
                        key={screening.id}
                        screening={screening}
                        lang={lang}
                        index={idx}
                        films={films}
                        onOpenPoster={(s) => setActivePosterModal(s)}
                        onSelectFilm={handleSelectFilm}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* View 2: Poster Grid Gallery Mode */}
              {viewMode === 'posters' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredRows.map((screening, idx) => (
                    <ScreeningPosterCard
                      key={screening.id}
                      screening={screening}
                      lang={lang}
                      index={idx}
                      films={films}
                      onOpenPoster={(s) => setActivePosterModal(s)}
                    />
                  ))}
                </div>
              )}

              {/* View 3: Commemorative Ticket Stubs Mode */}
              {viewMode === 'tickets' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {filteredRows.map((screening) => (
                    <ScreeningTicketStub
                      key={screening.id}
                      screening={screening}
                      lang={lang}
                      films={films}
                      onSelectFilm={handleSelectFilm}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Poster / Details Modal */}
      <AnimatePresence>
        {activePosterModal && (
          <ScreeningPosterModal
            screening={activePosterModal}
            lang={lang}
            films={films}
            onClose={() => setActivePosterModal(null)}
            onSelectFilm={handleSelectFilm}
          />
        )}
      </AnimatePresence>

      <Footer lang={lang} />
    </>
  );
};
