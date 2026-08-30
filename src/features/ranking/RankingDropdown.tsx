import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Share2, LogIn } from 'lucide-react';
import { openLeaderboardModal } from './LeaderboardModal';
import { HoursSpectrum } from './HoursSpectrum';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { useToast } from '../../components/ui/Toast';
import { getSession } from '../../lib/session';
import {
  EMPTY_RANKING,
  RankingPayload,
  authRedirectPath,
  fetchRanking,
} from '../../lib/ranking';

interface RankingDropdownProps {
  lang?: 'zh' | 'ja' | 'en';
}

export const RankingDropdown: React.FC<RankingDropdownProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<RankingPayload>(EMPTY_RANKING);
  const { success } = useToast();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      await getSession();
      try {
        const payload = await fetchRanking();
        if (alive) setData(payload);
      } catch {
        if (alive) setData(EMPTY_RANKING);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const guest = data.me === null;
  const ranked = data.me?.rank != null;
  const userRank = data.me?.rank ?? null;
  const userHours = data.me?.hours ?? 0;
  const userFilmsCount = data.me?.filmsCount ?? 0;
  const userPercentile = data.me?.percentile;
  const beatRatio = data.me?.beatRatio ?? 0;
  const highlightIndex = ranked ? data.me?.bucketIndex ?? null : null;
  const leader = data.top[0];
  const top3 = data.top.slice(0, 3);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleOpenLeaderboard = () => {
    setIsOpen(false);
    openLeaderboardModal();
  };

  const handleExportRankCard = () => {
    setIsOpen(false);
    if (guest) {
      navigate(authRedirectPath());
      return;
    }
    if (!ranked || userRank == null) {
      success('看过至少一部社内已放映作品即可上榜。');
      return;
    }
    const line = `Anoix 放映位次 #${userRank} · ${userHours}h · ${userPercentile ?? ''}`.trim();
    navigator.clipboard.writeText(line);
    success(`已复制荣誉榜位 (#${userRank} · ${userHours}h)！`);
  };

  const capsuleTitle = guest
    ? leader
      ? `全站 Top 时长 ${leader.hours}h · 登录查看我的位次`
      : '全站放映位次 · 登录查看我的位次'
    : ranked
      ? `全站放映位次 #${userRank} · ${userHours}小时`
      : '全站放映位次 · 未上榜';

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block select-none"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#1e1f21] dark:text-white text-xs font-bold transition-all cursor-pointer outline-none border border-black/10 shadow-xs"
        aria-label="放映排行榜位"
        title={capsuleTitle}
      >
        <div className="relative flex items-center justify-center w-3.5 h-3.5">
          <Trophy className="w-3.5 h-3.5 text-white/90" />
        </div>

        <span className="font-bold tracking-tight text-[11px] font-mono tabular-nums">
          {guest ? (
            leader ? (
              <>
                Top · <AnimatedNumber value={leader.hours} decimals={1} suffix="h" duration={0.9} />
              </>
            ) : (
              '榜'
            )
          ) : ranked && userRank != null ? (
            <>
              <AnimatedNumber value={userRank} prefix="#" duration={0.8} /> ·{' '}
              <AnimatedNumber value={userHours} decimals={1} suffix="h" duration={0.9} />
            </>
          ) : (
            '#—'
          )}
        </span>

        {isOpen && (
          <motion.div
            layoutId="rank_active_line"
            className="absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-white dark:bg-white"
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[310px] sm:w-[330px] p-4.5 rounded-2xl bg-white dark:bg-white text-neutral-900 dark:text-white border border-[#e5e7eb] dark:border-[#242424] shadow-2xl transition-colors"
          >
            <div className="grid grid-cols-3 gap-2 pb-3.5 border-b border-[#e5e7eb] dark:border-[#202020]">
              <div>
                <p className="text-[10px] font-medium text-neutral-400 dark:text-[#737373] mb-0.5 leading-none">
                  {guest ? '榜首时长' : '全站位次'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {guest ? (
                    <p className="text-[15px] font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
                      {leader ? (
                        <AnimatedNumber value={leader.hours} decimals={1} suffix="h" duration={0.9} />
                      ) : (
                        '—'
                      )}
                    </p>
                  ) : ranked && userRank != null ? (
                    <>
                      <p className="text-[15px] font-bold font-mono tracking-tight text-neutral-900 dark:text-white tabular-nums">
                        <AnimatedNumber value={userRank} prefix="#" duration={0.8} />
                      </p>
                      {userPercentile && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-neutral-100 dark:bg-[#202020] text-neutral-600 dark:text-[#a3a3a3]">
                          {userPercentile}
                        </span>
                      )}
                    </>
                  ) : (
                    <p className="text-[15px] font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
                      未上榜
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-medium text-neutral-400 dark:text-[#737373] mb-0.5 leading-none">
                  {guest ? '领跑者' : '累计已看'}
                </p>
                {guest ? (
                  <p className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white mt-0.5 truncate">
                    {leader?.name ?? '—'}
                  </p>
                ) : (
                  <>
                    <p className="text-[15px] font-bold font-mono tracking-tight text-neutral-900 dark:text-white mt-0.5 tabular-nums">
                      <AnimatedNumber value={userHours} decimals={1} suffix="h" duration={0.9} />
                    </p>
                    <p className="text-[9px] text-neutral-400 dark:text-[#666666] leading-none mt-0.5">
                      收录 <AnimatedNumber value={userFilmsCount} duration={0.8} /> 部
                    </p>
                  </>
                )}
              </div>

              <div>
                <p className="text-[10px] font-medium text-neutral-400 dark:text-[#737373] mb-0.5 leading-none">
                  {ranked ? '已超越' : '上榜人数'}
                </p>
                {ranked ? (
                  <p className="text-[15px] font-bold font-mono tracking-tight text-neutral-900 dark:text-white mt-0.5 tabular-nums">
                    <AnimatedNumber value={beatRatio} decimals={1} suffix="%" duration={0.9} />
                  </p>
                ) : (
                  <p className="text-[15px] font-bold font-mono tracking-tight text-neutral-900 dark:text-white mt-0.5 tabular-nums">
                    <AnimatedNumber value={data.total} duration={0.8} />
                  </p>
                )}
              </div>
            </div>

            {top3.length > 0 && (
              <div className="pt-3 space-y-1.5">
                <p className="text-[10px] font-medium text-neutral-400 dark:text-[#737373] px-0.5">
                  全站 Top 3 时长
                </p>
                {top3.map((row) => (
                  <div key={row.uid} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate font-semibold">
                      <span className="font-mono text-neutral-400 dark:text-[#737373] mr-1.5">#{row.rank}</span>
                      {row.name}
                    </span>
                    <span className="font-mono tabular-nums shrink-0 text-neutral-600 dark:text-[#a3a3a3]">
                      {row.hours.toFixed(1)}h
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3.5 pb-2">
              <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-[#737373] mb-1.5 px-0.5">
                <span>全站已看时长分布</span>
                <span className="font-mono text-[9px]">LIFETIME HOURS</span>
              </div>

              <HoursSpectrum counts={data.histogram} highlightIndex={highlightIndex} />

              <div className="flex items-center justify-between text-[10px] font-medium text-neutral-400 dark:text-[#737373] mt-2 px-0.5">
                <span>0h</span>
                <span className="text-neutral-900 dark:text-white font-mono font-bold tabular-nums">
                  {guest
                    ? '登录查看我的位次'
                    : ranked
                      ? <>你在此处 · {userHours.toFixed(1)}h</>
                      : '未上榜'}
                </span>
                <span>{data.histogramMaxHours > 0 ? `${data.histogramMaxHours}h` : '—'} </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#e5e7eb] dark:border-[#202020]">
              <button
                type="button"
                onClick={handleOpenLeaderboard}
                className="w-full py-2 rounded-lg text-center text-xs font-semibold text-neutral-700 hover:text-black dark:text-[#d4d4d4] dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-[#202020] dark:hover:bg-[#282828] transition-colors cursor-pointer"
              >
                查看总排行榜
              </button>
              <button
                type="button"
                onClick={handleExportRankCard}
                className="w-full py-2 rounded-lg text-center text-xs font-semibold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {guest ? <LogIn className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                <span>{guest ? '登录查看位次' : '导出荣誉榜位'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
