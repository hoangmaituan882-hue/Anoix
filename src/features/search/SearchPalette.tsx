import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Newspaper, CalendarDays } from 'lucide-react';
import { repository, useRepo } from '../../lib/repository';
import { openFilmPreview } from '../../lib/filmPreview';
import { CommandPalette, CommandItem } from '../../components/ui/CommandPalette';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

interface ScreeningRow {
  id: string;
  title: string;
  screen_date: string;
}

let openListener: (() => void) | null = null;
/** Open the global search palette from anywhere (e.g. the Header search button). */
export function openSearch() {
  openListener?.();
}

/** Global ⌘K search: works + news + screenings, fuzzy-filtered. */
export const SearchPalette: React.FC = () => {
  const navigate = useNavigate();
  const films = useRepo(repository.films);
  const news = useRepo(repository.news);
  const [screenings, setScreenings] = useState<ScreeningRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    openListener = () => setOpen(true);
    return () => { openListener = null; };
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
      .then((r) => r.json())
      .then((d) => setScreenings(Array.isArray(d) ? d : []))
      .catch(() => setScreenings([]));
  }, [open]);

  const commands: CommandItem[] = useMemo(() => {
    const cmds: CommandItem[] = [];
    for (const f of films) {
      const title = f.titleZh ?? f.title;
      cmds.push({
        id: `film-${f.id}`,
        label: title,
        hint: `作品${f.year ? ` · ${f.year}` : ''}`,
        icon: <Film className="text-[#ff3650]" />,
        action: () => openFilmPreview(f),
      });
    }
    for (const n of news) {
      cmds.push({
        id: `news-${n.id}`,
        label: n.titleZh ?? n.title,
        hint: '动态',
        icon: <Newspaper className="text-[#e0fe3d]" />,
        action: () => navigate('/', { viewTransition: true }),
      });
    }
    for (const s of screenings) {
      cmds.push({
        id: `screen-${s.id}`,
        label: s.title,
        hint: `放映会 · ${s.screen_date}`,
        icon: <CalendarDays className="text-[#e0fe3d]" />,
        action: () => navigate(`/screenings/${s.id}`, { viewTransition: true }),
      });
    }
    return cmds;
  }, [films, news, screenings, navigate]);

  return <CommandPalette open={open} onClose={() => setOpen(false)} commands={commands} />;
};
