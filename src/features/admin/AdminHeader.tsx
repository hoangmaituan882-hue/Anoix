import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { TriggerLogo } from '../../components/ui/TriggerLogo';
import {
  Film,
  Newspaper,
  Calendar,
  Flame,
  Activity,
  ShoppingBag,
  UserCheck,
  Clapperboard,
  Share2,
  ExternalLink,
  LogOut,
  Command as CmdIcon,
  ShieldCheck,
  Terminal,
  Database,
} from 'lucide-react';

export type AdminTab =
  | 'films'
  | 'news'
  | 'goods'
  | 'channel'
  | 'social'
  | 'screenings'
  | 'pool'
  | 'stats'
  | 'users';

export interface TabDefinition {
  key: AdminTab;
  label: string;
  en: string;
  icon: React.ComponentType<{ className?: string }>;
  hotkey: string;
  count?: number;
}

export interface TabGroup {
  id: string;
  name: string;
  en: string;
  tabs: TabDefinition[];
}

interface AdminHeaderProps {
  tab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  filmsCount?: number;
  newsCount?: number;
  adminName?: string;
  onOpenCmd: () => void;
  onSignOut: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  tab,
  onTabChange,
  filmsCount,
  newsCount,
  adminName = 'ADMINISTRATOR',
  onOpenCmd,
  onSignOut,
}) => {
  const groups: TabGroup[] = [
    {
      id: 'content',
      name: '内容资产',
      en: 'CONTENT',
      tabs: [
        { key: 'films', label: '作品资料库', en: 'WORKS', icon: Film, hotkey: '1', count: filmsCount },
        { key: 'news', label: '动态公告', en: 'NEWS', icon: Newspaper, hotkey: '2', count: newsCount },
        { key: 'goods', label: '周边商品', en: 'GOODS', icon: ShoppingBag, hotkey: '3' },
        { key: 'channel', label: '官方频道', en: 'CHANNEL', icon: Clapperboard, hotkey: '4' },
        { key: 'social', label: '页脚社交', en: 'SOCIAL', icon: Share2, hotkey: '9' },
      ],
    },
    {
      id: 'events',
      name: '放映选片',
      en: 'EVENTS',
      tabs: [
        { key: 'screenings', label: '放映档案', en: 'SCREENINGS', icon: Calendar, hotkey: '5' },
        { key: 'pool', label: '提名池', en: 'POOL', icon: Flame, hotkey: '6' },
      ],
    },
    {
      id: 'system',
      name: '系统运维',
      en: 'SYSTEM',
      tabs: [
        { key: 'stats', label: '统计大屏', en: 'STATS', icon: Activity, hotkey: '7' },
        { key: 'users', label: '用户管理', en: 'USERS', icon: UserCheck, hotkey: '8' },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      {/* Tier 1: Studio Cockpit Status Bar */}
      <div className="border-b border-white/5 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Studio Brand & System Node Status */}
          <div className="flex items-center gap-3.5">
            <Link to="/" className="flex items-center gap-2.5 group">
              <TriggerLogo className="w-24 sm:w-28 text-white group-hover:text-[#ff3650] transition-colors" />
              <div className="h-4 w-px bg-white/20 hidden sm:block" />
              <div className="hidden sm:flex flex-col">
                <span className="font-mono text-[9px] font-black text-[#ff3650] uppercase tracking-widest leading-none">
                  MISSION CONTROL v2.0
                </span>
                <span className="font-mono text-[10px] font-bold text-white/40 leading-tight">
                  TRIGGER PG // SHANGHAI
                </span>
              </div>
            </Link>

            {/* Database & RLS status indicator */}
            <div className="hidden md:flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>PG: LIVE</span>
              </span>
              <span className="text-white/20">|</span>
              <span className="flex items-center gap-1 text-[#e0fe3d]">
                <ShieldCheck className="w-3 h-3" />
                <span>RLS ACTIVE</span>
              </span>
            </div>
          </div>

          {/* Center: Command Palette Trigger */}
          <button
            onClick={onOpenCmd}
            className="flex items-center gap-2 bg-black/60 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 transition-all font-mono text-xs cursor-pointer group"
          >
            <CmdIcon className="w-3.5 h-3.5 text-[#ff3650] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">快速跳转与操作</span>
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/80 font-black border border-white/15">
              ⌘K / Ctrl+K
            </kbd>
          </button>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-2">
            {/* Admin identity chip */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
              <Terminal className="w-3 h-3 text-[#ff3650]" />
              <span className="text-white/80 font-bold max-w-[120px] truncate">{adminName}</span>
            </div>

            {/* Visit Site */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-mono font-bold text-white transition-all border border-white/10"
              title="访问前台官网"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#e0fe3d]" />
              <span className="hidden sm:inline">前台网站</span>
            </Link>

            {/* Sign Out */}
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff3650]/15 hover:bg-[#ff3650] text-[#ff3650] hover:text-white text-xs font-mono font-black transition-all border border-[#ff3650]/30 cursor-pointer"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Categorized Segmented Rail */}
      <div className="px-4 sm:px-8 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 min-w-max">
          <nav className="flex items-center gap-4 sm:gap-6">
            {groups.map((group, groupIndex) => (
              <React.Fragment key={group.id}>
                {groupIndex > 0 && (
                  <div className="flex items-center gap-1 font-mono text-[10px] font-black text-white/20 select-none">
                    <span>//</span>
                  </div>
                )}

                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  {/* Group Tag on Desktop */}
                  <span className="hidden xl:inline-block px-2 text-[9px] font-mono font-black text-white/40 tracking-wider uppercase select-none">
                    {group.en}
                  </span>

                  {/* Tabs in group */}
                  {group.tabs.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => onTabChange(t.key)}
                        className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none group ${
                          active
                            ? 'text-white font-black'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {/* Active layout indicator */}
                        {active && (
                          <motion.div
                            layoutId="admin-active-tab"
                            className="absolute inset-0 bg-[#ff3650] rounded-lg shadow-[0_2px_12px_rgba(255,54,80,0.45)]"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}

                        <span className="relative z-10 flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-[#ff3650]'}`} />
                          <span>{t.label}</span>
                        </span>

                        {/* Count Badge */}
                        {t.count !== undefined && t.count > 0 && (
                          <span
                            className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded font-mono font-black ${
                              active ? 'bg-black/30 text-white' : 'bg-white/10 text-white/70'
                            }`}
                          >
                            {t.count}
                          </span>
                        )}

                        {/* Hotkey hint pill */}
                        <kbd
                          className={`relative z-10 hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded transition-opacity ${
                            active
                              ? 'bg-black/30 text-white/90 border border-white/20'
                              : 'opacity-40 group-hover:opacity-100 bg-white/5 text-white/50 border border-white/10'
                          }`}
                        >
                          {t.hotkey}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
