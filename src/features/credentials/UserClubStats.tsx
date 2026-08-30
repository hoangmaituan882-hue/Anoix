import React from 'react';
import { Clock, Eye, EyeOff, Film, Vote, Flame } from 'lucide-react';
import { MeStats, hoursFromMinutes } from '../../lib/me';

function hoursLabel(h: number) {
  return `${Number.isInteger(h) ? h : h.toFixed(1)}h`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return `${y}年${Number(m)}月`;
}

const CELLS: Array<{
  key: keyof Pick<MeStats, 'watchedHours' | 'unwatchedHours' | 'totalScreenedHours' | 'watchedCount' | 'nominations' | 'votes'>;
  label: string;
  format: (s: MeStats) => string;
  icon: React.ReactNode;
}> = [
  { key: 'watchedHours', label: '已看时长', format: (s) => hoursLabel(s.watchedHours), icon: <Eye className="w-3.5 h-3.5" /> },
  { key: 'unwatchedHours', label: '未看时长', format: (s) => hoursLabel(s.unwatchedHours), icon: <EyeOff className="w-3.5 h-3.5" /> },
  { key: 'totalScreenedHours', label: '总放映时长', format: (s) => hoursLabel(s.totalScreenedHours), icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'watchedCount', label: '已看片数', format: (s) => `${s.watchedCount} / ${s.totalScreenedCount}`, icon: <Film className="w-3.5 h-3.5" /> },
  { key: 'nominations', label: '提名', format: (s) => String(s.nominations), icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'votes', label: '周票', format: (s) => String(s.votes), icon: <Vote className="w-3.5 h-3.5" /> },
];

interface UserClubStatsProps {
  stats: MeStats;
  /** dark: profile card; light: credentials boards */
  tone?: 'dark' | 'light';
  signedIn?: boolean;
}

export const UserClubStats: React.FC<UserClubStatsProps> = ({
  stats,
  tone = 'dark',
  signedIn = true,
}) => {
  const dark = tone === 'dark';
  const cell = dark
    ? 'bg-black/30 border-black/10 text-[#1e1f21]'
    : 'bg-white dark:bg-white border-neutral-200 dark:border-[#222222] text-neutral-900 dark:text-white';
  const muted = dark ? 'text-white/45' : 'text-neutral-500 dark:text-[#737373]';

  return (
    <div data-user-club-stats className="space-y-3">
      {!signedIn && (
        <p className={`text-xs ${muted}`}>登录后统计你在放映会片单上的已看 / 未看时长。</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CELLS.map((c) => (
          <div key={c.key} className={`rounded-xl border p-3 ${cell}`}>
            <span className={`text-[10px] font-medium flex items-center gap-1 ${muted}`}>
              {c.icon}
              {c.label}
            </span>
            <p className="mt-1 text-base font-bold font-mono tabular-nums">{c.format(stats)}</p>
          </div>
        ))}
      </div>
      {stats.monthly.length > 0 && (
        <div>
          <p className={`text-[10px] font-medium uppercase tracking-wider mb-2 ${muted}`}>每月已放映时长</p>
          <ul className="space-y-1">
            {stats.monthly.map((row) => (
              <li
                key={row.yearMonth}
                className={`flex items-center justify-between text-xs font-mono ${dark ? 'text-black/70' : 'text-neutral-600 dark:text-[#aaaaaa]'}`}
              >
                <span>{monthLabel(row.yearMonth)}</span>
                <span>
                  {hoursLabel(hoursFromMinutes(row.minutes))} · {row.filmCount} 部
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
