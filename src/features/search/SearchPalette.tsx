import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Newspaper, CalendarDays, Sparkles, Navigation } from 'lucide-react';
import { repository, useRepo } from '../../lib/repository';
import { catalog } from '../../lib/catalog';
import { openFilmPreview } from '../../lib/filmPreview';
import { openNewsPreview } from '../../lib/newsPreview';
import { presentLiveScreenings } from '../../lib/screeningsArchive.js';
import { CommandPalette, CommandItem } from '../../components/ui/CommandPalette';
import { Screening } from '../../types/screening';
import { WorkItem } from '../../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

let openListener: (() => void) | null = null;

/** Open the global search palette from anywhere (e.g. the Header search button). */
export function openSearch() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-search-palette'));
  }
  openListener?.();
}

/** Global ⌘K search: works + news + screenings + quick actions with pure Chinese live preview. */
export const SearchPalette: React.FC = () => {
  const navigate = useNavigate();
  const news = useRepo(repository.news);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [open, setOpen] = useState(false);
  const [filmHits, setFilmHits] = useState<WorkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const onQueryChange = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    openListener = handleOpen;
    window.addEventListener('open-search-palette', handleOpen);
    return () => {
      openListener = null;
      window.removeEventListener('open-search-palette', handleOpen);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetch(`${API_BASE}/api/screenings`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => setScreenings(presentLiveScreenings(d) as Screening[]))
      .catch(() => setScreenings([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const timer = setTimeout(() => {
      catalog
        .list({ q: searchQuery, limit: 8, offset: 0 })
        .then((page) => {
          if (alive) setFilmHits(page.items);
        })
        .catch(() => {
          if (alive) setFilmHits([]);
        });
    }, searchQuery.trim() ? 300 : 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, searchQuery]);

  const commands: CommandItem[] = useMemo(() => {
    const cmds: CommandItem[] = [];

    // 1. Films (动画作品) — server-ranked, max 8
    for (const f of filmHits) {
      const title = f.titleZh ?? f.title;
      cmds.push({
        id: `film-${f.id}`,
        category: 'films',
        label: title,
        labelEn: f.title,
        hint: `动画作品 · ${f.year || ''} · 导演: ${f.director || ''}`,
        icon: <Film className="w-4 h-4 text-[#ff3650]" />,
        action: () => {
          void catalog.get(f.id).then((full) => openFilmPreview(full ?? f)).catch(() => openFilmPreview(f));
        },
        preview: {
          type: 'film',
          image: f.landscapeImage || f.image,
          title: title,
          subtitle: `${f.year || ''}年 · 导演: ${f.director || '未记录'}`,
          description: f.descriptionZh || f.description || '社内片库作品。',
          tags: [f.category || '动画'],
          metaBadge: '片库',
        },
      });
    }

    // 2. Screenings (放映档案)
    for (const s of screenings) {
      const title = s.title_zh || s.title;
      const poster = s.demo_poster_url || s.poster_url || s.gallery?.[0] || '';

      cmds.push({
        id: `screen-${s.id}`,
        category: 'screenings',
        label: title,
        labelEn: s.title_en || s.title,
        hint: `放映现场 · ${s.screen_date} · ${s.venue || '场地待定'}`,
        icon: <CalendarDays className="w-4 h-4 text-[#ff3650]" />,
        action: () => navigate(`/screenings/${s.id}`, { viewTransition: true }),
        preview: {
          type: 'screening',
          image: poster,
          title: title,
          subtitle: s.screen_date,
          venue: s.venue || '场地待定',
          date: s.screen_date,
          description: s.recap_zh || s.recap || s.ticket_perks || '社内放映场次。',
          tags: s.format_tags || [],
          metaBadge: '放映',
        },
      });
    }

    // 3. News (官方动态)
    for (const n of news) {
      const title = n.titleZh ?? n.title;
      cmds.push({
        id: `news-${n.id}`,
        category: 'news',
        label: title,
        hint: `官方动态 · ${n.date || '最新'}`,
        icon: <Newspaper className="w-4 h-4 text-[#e0fe3d]" />,
        action: () => openNewsPreview(n),
        preview: {
          type: 'news',
          image: n.image || '',
          title: title,
          subtitle: n.date || '最新快讯',
          description: n.contentZh || n.content || '社内动态。',
          tags: n.category ? [n.category] : ['动态'],
          metaBadge: '动态',
        },
      });
    }

    // 4. Quick Navigation (快捷直达)
    const routes = [
      { path: '/screenings', label: '放映档案库', hint: '浏览特设海报与纪念票根', icon: CalendarDays },
      { path: '/nominations', label: '选片与投票中心', hint: '参与社区公投决定下一场放映', icon: Sparkles },
      { path: '/calendar', label: '活动与放映日历', hint: '排期日历与 RSVP', icon: CalendarDays },
      { path: '/credentials', label: '我的放映资历', hint: '查看观影履历与通行证徽章', icon: Navigation },
    ];

    for (const r of routes) {
      const Icon = r.icon;
      cmds.push({
        id: `route-${r.path}`,
        category: 'actions',
        label: r.label,
        hint: r.hint,
        icon: <Icon className="w-4 h-4 text-black/70" />,
        action: () => navigate(r.path, { viewTransition: true }),
        preview: {
          type: 'action',
          title: r.label,
          subtitle: '快捷直达页面',
          description: r.hint,
          tags: ['快捷导航'],
          metaBadge: '系统功能',
        },
      });
    }

    return cmds;
  }, [filmHits, news, screenings, navigate]);

  return <CommandPalette open={open} onClose={() => setOpen(false)} commands={commands} onQueryChange={onQueryChange} />;
};
