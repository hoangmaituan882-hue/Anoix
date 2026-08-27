import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'anoix-theme';

let themeToggleListener: ((coords?: { x: number; y: number }) => void) | null = null;

export function getStoredTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/** Global helper to toggle theme from anywhere (e.g. Context Menu or Keyboard Shortcut) */
export function toggleGlobalTheme(coords?: { x: number; y: number }) {
  if (themeToggleListener) {
    themeToggleListener(coords);
  } else {
    const current = getStoredTheme();
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }
}

/** Dark/light switch — persists to localStorage, defaults to dark. */
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode */
    }
  }, [theme]);

  const isLight = theme === 'light';

  const triggerToggle = (coords?: { x: number; y: number }) => {
    const next: 'light' | 'dark' = isLight ? 'dark' : 'light';
    const apply = () => {
      applyTheme(next);
      setTheme(next);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      const x = coords?.x ?? window.innerWidth / 2;
      const y = coords?.y ?? 40;
      document.documentElement.style.setProperty('--vt-x', `${x}px`);
      document.documentElement.style.setProperty('--vt-y', `${y}px`);
      document.documentElement.classList.add('vt-theme');
      const vt = (
        document as Document & {
          startViewTransition: (cb: () => void) => { finished: Promise<void> };
        }
      ).startViewTransition(apply);
      vt.finished.finally(() => document.documentElement.classList.remove('vt-theme'));
    } else {
      apply();
    }
  };

  useEffect(() => {
    themeToggleListener = triggerToggle;
    return () => {
      themeToggleListener = null;
    };
  }, [isLight]);

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerToggle({ x: e.clientX, y: e.clientY });
  };

  return (
    <button
      id="theme_toggle"
      onClick={toggle}
      className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ff3650] text-current flex items-center justify-center transition-colors cursor-pointer relative overflow-hidden"
      title={isLight ? '切换深色模式' : '切换浅色模式'}
      aria-label="Toggle theme"
    >
      <span className="t-icon-swap-slot w-4 h-4">
        <Sun className={`w-4 h-4 text-amber-300 ${isLight ? 'is-active' : ''}`} />
        <Moon className={`w-4 h-4 text-white ${!isLight ? 'is-active' : ''}`} />
      </span>
    </button>
  );
};
