import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Film, Vote, Share2, Check, Star, Clock } from 'lucide-react';
import { TriggerLogo } from '../../components/ui/TriggerLogo';
import { useToast } from '../../components/ui/Toast';

interface CredentialsShareModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  avatarUrl?: string;
  stats: {
    totalScreenings: number;
    totalNominations: number;
    totalWatches: number;
    avgRating: number;
    joinDays: number;
    level: string;
    totalHours?: number;
    unwatchedHours?: number;
    votes?: number;
  };
}

export const CredentialsShareModal: React.FC<CredentialsShareModalProps> = ({
  open,
  onClose,
  userName,
  avatarUrl,
  stats,
}) => {
  const { success } = useToast();
  const [copied, setCopied] = React.useState(false);

  if (!open) return null;

  const totalHours = stats.totalHours ?? 0;
  const unwatchedHours = stats.unwatchedHours ?? 0;
  const votes = stats.votes ?? 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    success('资历主页与官方认证位次链接已复制到剪贴板！');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#f5ffe5] border border-[#e5e7eb] dark:border-[#242424] rounded-2xl overflow-hidden shadow-2xl z-10 text-neutral-900 dark:text-white transition-colors"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-500 hover:text-black dark:text-[#888888] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Printable Card Area */}
          <div className="p-6 bg-[#fafafa] dark:bg-[#0e0e0e] border-b border-[#e5e7eb] dark:border-[#202020] transition-colors">
            {/* Header / Brand */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#e5e7eb] dark:border-[#202020]">
              <TriggerLogo className="w-20 text-black dark:text-white" />
              <div className="text-right">
                <span className="font-mono text-[9px] font-bold text-neutral-500 dark:text-[#888888] uppercase tracking-widest block">
                  OFFICIAL PASSPORT
                </span>
                <span className="font-mono text-[10px] text-neutral-400 dark:text-[#666666]">
                  ANOIX // 2026
                </span>
              </div>
            </div>

            {/* User Identity & Official Rank Stamp */}
            <div className="flex items-center justify-between gap-3.5 mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#e5e7eb] dark:bg-[#d4d4d4] flex items-center justify-center text-black font-bold text-lg overflow-hidden shadow-sm shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    userName.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{userName}</h3>
                    <span className="bg-neutral-100 dark:bg-[#242424] border border-neutral-200 dark:border-[#333333] text-neutral-700 dark:text-[#d4d4d4] text-[9px] font-semibold px-1.5 py-0.5 rounded">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-[#888888] font-medium mt-0.5">
                    {stats.level}
                  </p>
                  {stats.joinDays > 0 && (
                    <p className="text-[10px] text-neutral-400 dark:text-[#666666] font-mono">
                      已加入社区 {stats.joinDays} 天
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center justify-center p-2 rounded-xl bg-neutral-100 dark:bg-white border border-neutral-200 dark:border-[#2a2a2a] text-center min-w-[4.5rem]">
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-neutral-900 dark:text-white">
                  <Vote className="w-3 h-3" />
                  <span>{votes}</span>
                </div>
                <span className="text-[8px] font-mono font-bold text-neutral-500 dark:text-[#888888] uppercase tracking-tighter mt-0.5">
                  周票
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-white dark:bg-white p-3 rounded-lg border border-[#e5e7eb] dark:border-[#222222] shadow-xs">
                <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
                  已看时长
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                    {totalHours}h
                  </span>
                  <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-[#737373]" />
                </div>
              </div>

              <div className="bg-white dark:bg-white p-3 rounded-lg border border-[#e5e7eb] dark:border-[#222222] shadow-xs">
                <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
                  未看时长
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                    {unwatchedHours}h
                  </span>
                  <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-[#737373]" />
                </div>
              </div>

              <div className="bg-white dark:bg-white p-3 rounded-lg border border-[#e5e7eb] dark:border-[#222222] shadow-xs">
                <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
                  已看片数
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-base font-bold text-neutral-900 dark:text-white">
                    {stats.totalWatches} / {stats.totalScreenings} 部
                  </span>
                  <Film className="w-3.5 h-3.5 text-neutral-400 dark:text-[#737373]" />
                </div>
              </div>

              <div className="bg-white dark:bg-white p-3 rounded-lg border border-[#e5e7eb] dark:border-[#222222] shadow-xs">
                <span className="text-[10px] font-medium text-neutral-500 dark:text-[#737373] block">
                  提名
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-base font-bold text-neutral-900 dark:text-white">
                    {stats.totalNominations} 部
                  </span>
                  <Star className="w-3.5 h-3.5 text-neutral-400 dark:text-[#737373]" />
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-white border border-neutral-200 dark:border-[#222222] text-center font-mono text-[10px] text-neutral-600 dark:text-[#888888] flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>ANOIX CINEMA CLUB // {stats.totalNominations} NOM · {votes} VOTES</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 bg-white dark:bg-[#f5ffe5] flex items-center justify-between gap-2.5">
            <button
              onClick={handleCopy}
              className="flex-1 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-[#e5e5e5] font-semibold text-xs py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制认证榜位链接' : '复制官方认证资历卡'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-white dark:hover:bg-white dark:text-[#888888] dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              关闭
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
