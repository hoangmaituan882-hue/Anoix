import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'anoix-theme';

export function getStoredTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('light', theme === 'light');
}

/** Dark/light switch — persists to localStorage, defaults to dark. */
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* private mode */ }
  }, [theme]);

  const isLight = theme === 'light';
  return (
    <button
      id="theme_toggle"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ff3650] text-current flex items-center justify-center transition-colors cursor-pointer"
      title={isLight ? '切换深色模式' : '切换浅色模式'}
      aria-label="Toggle theme"
    >
      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
};
