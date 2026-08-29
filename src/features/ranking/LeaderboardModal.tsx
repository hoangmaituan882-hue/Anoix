import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Share2, LogIn } from 'lucide-react';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { useToast } from '../../components/ui/Toast';
import { getSession } from '../../lib/session';
import {
  EMPTY_RANKING,
  RankingPayload,
  authRedirectPath,
  fetchRanking,
} from '../../lib/ranking';

let openLeaderboardListener: (() => void) | null = null;

export function openLeaderboardModal() {
  openLeaderboardListener?.();
}

export const LeaderboardModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<RankingPayload>(EMPTY_RANKING);
  const { success } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    openLeaderboardListener = () => setOpen(true);
    return () => {
      openLeaderboardListener = null;
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
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
  }, [open]);

  if (!open) return null;

  const guest = data.me === null;
  const ranked = data.me?.rank != null;
  const meRank = data.me?.rank ?? null;
  const meName = data.top.find((row) => row.rank === meRank)?.name;

  const handleCopyShare = () => {
    if (guest) {
      navigate(authRedirectPath());
      setOpen(false);
      return;
    }
    if (!ranked || meRank == null) {
      success('看过至少一部社内已放映作品即可上榜。');
      return;
    }
    const line = `Anoix 放映位次 #${meRank} · ${data.me?.hours}h · ${data.me?.percentile ?? ''}`.trim();
    navigator.clipboard.writeText(line);
    success('排行榜荣誉位次已复制到剪贴板！');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#121212] border border-[#e5e7eb] dark:border-[#242424] rounded-2xl overflow-hidden shadow-2xl z-10 text-neutral-900 dark:text-white transition-colors"
        >
          <div className="p-5 border-b border-[#e5e7eb] dark:border-[#202020] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                  全站放映时长排行榜
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-[#888888] font-mono">
                  CLUB WATCHED HOURS · LIFETIME
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1c1c1c] dark:hover:bg-[#262626] text-neutral-500 hover:text-black dark:text-[#888888] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-5 pt-3 pb-2 bg-[#fafafa] dark:bg-[#0e0e0e] border-b border-[#e5e7eb] dark:border-[#202020] flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700 dark:text-[#d4d4d4]">
              累计已看社内片目
            </span>
            <span className="text-[11px] font-mono text-neutral-400 dark:text-[#666666]">
              {data.total} 人上榜 · Top {Math.min(20, data.total)}
            </span>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-4 space-y-2 divide-y divide-[#f3f4f6] dark:divide-[#1a1a1a]">
            {data.top.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-[#737373] py-6 text-center">
                暂无上榜影迷。看过至少一部社内已放映作品即可入榜。
              </p>
            ) : (
              data.top.map((item) => {
                const isYou = ranked && item.rank === meRank;
                return (
                  <div
                    key={item.uid}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                          item.rank === 1
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                            : item.rank === 2
                              ? 'bg-neutral-200 text-neutral-800 dark:bg-[#282828] dark:text-[#d4d4d4]'
                              : item.rank === 3
                                ? 'bg-neutral-100 text-neutral-600 dark:bg-[#1f1f1f] dark:text-[#a3a3a3]'
                                : 'text-neutral-400 dark:text-[#666666]'
                        }`}
                      >
                        {item.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">
                          {item.name}
                          {isYou ? ' (你)' : ''}
                        </p>
                        <p className="text-[10px] text-neutral-400 dark:text-[#737373]">
                          {item.filmsCount} 部社内片目
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-neutral-900 dark:text-white text-xs tabular-nums">
                        <AnimatedNumber value={item.hours} decimals={1} suffix="h" duration={0.9} />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3.5 bg-[#f5f5f7] dark:bg-[#181818] border-t border-[#e5e7eb] dark:border-[#262626] flex items-center justify-between">
            {guest ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(authRedirectPath());
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-white"
              >
                <LogIn className="w-3.5 h-3.5" />
                登录查看我的位次
              </button>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {ranked && meRank != null ? `#${meRank}` : '—'}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-neutral-900 dark:text-white">
                        {ranked ? `${meName ?? '你'} (你)` : '你尚未上榜'}
                      </span>
                      {data.me?.percentile && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-[#d4d4d4]">
                          {data.me.percentile}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-[#888888]">
                      {ranked
                        ? `已超越全站 ${data.me?.beatRatio ?? 0}% 的上榜影迷`
                        : '看过至少一部社内已放映作品即可上榜'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white tabular-nums">
                    <AnimatedNumber value={data.me?.hours ?? 0} decimals={1} suffix="h" duration={0.9} />
                  </span>
                  <span className="block text-[10px] text-neutral-400 dark:text-[#666666]">
                    <AnimatedNumber value={data.me?.filmsCount ?? 0} /> 部收录
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="p-3.5 bg-white dark:bg-[#121212] border-t border-[#e5e7eb] dark:border-[#202020] flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleCopyShare}
              className="flex-1 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5] text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {guest ? <LogIn className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{guest ? '登录查看我的位次' : '分享我的全站榜位'}</span>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1a1a1a] dark:hover:bg-[#222222] text-neutral-700 dark:text-[#888888] dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              关闭
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
