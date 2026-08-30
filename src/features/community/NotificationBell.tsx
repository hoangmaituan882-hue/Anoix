import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { community, NotificationItem } from '../../lib/community';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';

const rel = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} 秒前`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${Math.floor(h / 24)} 天前`;
};

/** Header notification bell with unread badge + dropdown list. */
export const NotificationBell: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const load = () => community.notifications().then(setItems).catch(() => setItems([]));
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (open) void load(); }, [open]);

  const unread = items.filter((n) => !n.read).length;
  const markAll = async () => {
    try { await community.markRead(); void load(); } catch { /* ignore */ }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-[#ff3650] text-current flex items-center justify-center transition-colors cursor-pointer"
          title="通知"
          aria-label="通知"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#ff3650] text-white text-[9px] font-black flex items-center justify-center border border-[#151515] t-badge-pop select-none shadow-xs">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-[#1d1d1f] border-black/10 text-white">
        <DropdownMenuLabel className="flex items-center justify-between text-white">
          <span>通知</span>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs font-bold text-[#ff3650] hover:text-white transition-colors cursor-pointer">
              全部已读
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-black/40 text-sm">暂无通知</p>
          ) : (
            items.map((n) => (
              <div key={n.id} className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors">
                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#ff3650] mt-1.5 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{n.title}</p>
                  {n.body && <p className="text-xs text-black/50 leading-snug">{n.body}</p>}
                  <p className="text-[10px] text-black/30 mt-0.5">{rel(n.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
