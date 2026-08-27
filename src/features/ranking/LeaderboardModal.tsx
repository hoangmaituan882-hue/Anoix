import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Medal, Flame, TrendingUp, Clock, Film, Share2 } from 'lucide-react';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { useToast } from '../../components/ui/Toast';

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar?: string;
  badge: string;
  hours: number;
  filmsCount: number;
  streakDays: number;
  isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardUser[] = [
  {
    rank: 1,
    name: '今石洋之狂热放映组',
    badge: '殿堂主理人',
    hours: 342.5,
    filmsCount: 48,
    streakDays: 45,
  },
  {
    rank: 2,
    name: '迷宫饭全季主理人',
    badge: '资深制片人',
    hours: 298.0,
    filmsCount: 39,
    streakDays: 38,
  },
  {
    rank: 3,
    name: '普罗米亚爆音应援会',
    badge: '特设放映官',
    hours: 246.5,
    filmsCount: 31,
    streakDays: 29,
  },
  {
    rank: 4,
    name: '古立特宇宙观测站',
    badge: '核心领航者',
    hours: 218.0,
    filmsCount: 26,
    streakDays: 21,
  },
  {
    rank: 5,
    name: '夜之城边缘旅人',
    badge: '先锋放映员',
    hours: 204.5,
    filmsCount: 24,
    streakDays: 18,
  },
  {
    rank: 6,
    name: '小魔女学园魔法研',
    badge: '先锋放映员',
    hours: 196.0,
    filmsCount: 22,
    streakDays: 16,
  },
  {
    rank: 7,
    name: '斩服少女战斗部',
    badge: '先锋放映员',
    hours: 191.5,
    filmsCount: 20,
    streakDays: 14,
  },
];

const CURRENT_USER: LeaderboardUser = {
  rank: 42,
  name: 'Nachiketa Tiwari',
  badge: '资深放映官',
  hours: 186.5,
  filmsCount: 28,
  streakDays: 12,
  isCurrentUser: true,
};

let openLeaderboardListener: (() => void) | null = null;

export function openLeaderboardModal() {
  openLeaderboardListener?.();
}

export const LeaderboardModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'monthly' | 'marathon'>('all');
  const { success } = useToast();

  React.useEffect(() => {
    openLeaderboardListener = () => setOpen(true);
    return () => {
      openLeaderboardListener = null;
    };
  }, []);

  if (!open) return null;

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    success('排行榜荣誉位次链接已复制到剪贴板！');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#121212] border border-[#e5e7eb] dark:border-[#242424] rounded-2xl overflow-hidden shadow-2xl z-10 text-neutral-900 dark:text-white transition-colors"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#e5e7eb] dark:border-[#202020] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
                  全站放映荣誉排行榜
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-[#888888] font-mono">
                  GLOBAL SCREENING HALL OF FAME
                </p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1c1c1c] dark:hover:bg-[#262626] text-neutral-500 hover:text-black dark:text-[#888888] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="px-5 pt-3 pb-2 bg-[#fafafa] dark:bg-[#0e0e0e] border-b border-[#e5e7eb] dark:border-[#202020] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white'
                }`}
              >
                年度总榜
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'monthly'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white'
                }`}
              >
                本月活跃
              </button>
              <button
                onClick={() => setActiveTab('marathon')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'marathon'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-neutral-500 hover:text-black dark:text-[#737373] dark:hover:text-white'
                }`}
              >
                马拉松连映
              </button>
            </div>

            <span className="text-[11px] font-mono text-neutral-400 dark:text-[#666666]">
              每周一 00:00 结算
            </span>
          </div>

          {/* Leaderboard List */}
          <div className="max-h-[320px] overflow-y-auto p-4 space-y-2 divide-y divide-[#f3f4f6] dark:divide-[#1a1a1a]">
            {MOCK_LEADERBOARD.map((item) => (
              <div
                key={item.rank}
                className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Number / Badge */}
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

                  {/* Name & Badge */}
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-[#737373]">
                      {item.badge} · 连续 <AnimatedNumber value={item.streakDays} /> 天放映
                    </p>
                  </div>
                </div>

                {/* Right: Hours & Works with Animated Numbers */}
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-neutral-900 dark:text-white text-xs tabular-nums">
                    <AnimatedNumber value={item.hours} decimals={1} suffix="h" duration={0.9} />
                  </span>
                  <span className="block text-[10px] text-neutral-400 dark:text-[#666666]">
                    <AnimatedNumber value={item.filmsCount} /> 部作品
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Current User Pinned Row */}
          <div className="p-3.5 bg-[#f5f5f7] dark:bg-[#181818] border-t border-[#e5e7eb] dark:border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-md bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs flex items-center justify-center shrink-0">
                #{CURRENT_USER.rank}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-neutral-900 dark:text-white">
                    {CURRENT_USER.name} (你)
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-[#d4d4d4]">
                    TOP 3.8%
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-[#888888]">
                  已超越全站 96.2% 的放映迷
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white tabular-nums">
                <AnimatedNumber value={CURRENT_USER.hours} decimals={1} suffix="h" duration={0.9} />
              </span>
              <span className="block text-[10px] text-neutral-400 dark:text-[#666666]">
                <AnimatedNumber value={CURRENT_USER.filmsCount} /> 部收录
              </span>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-3.5 bg-white dark:bg-[#121212] border-t border-[#e5e7eb] dark:border-[#202020] flex items-center justify-between gap-2.5">
            <button
              onClick={handleCopyShare}
              className="flex-1 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5] text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>分享我的全站榜位</span>
            </button>
            <button
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
