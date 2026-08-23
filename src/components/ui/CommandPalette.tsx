import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, CornerDownLeft, Command as CmdIcon } from 'lucide-react';

export interface CommandItem {
  id: string;
  label: string;
  /** short description / hint */
  hint?: string;
  /** icon element */
  icon?: React.ReactNode;
  /** executed when selected */
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

/** Ctrl/Cmd+K command palette — fuzzy-filtered command list. */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.hint && c.hint.toLowerCase().includes(q))
    );
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filtered[activeIndex];
        if (item) {
          item.action();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIndex, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[14vh] bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl bg-[#181818] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
              <Search className="w-4.5 h-4.5 text-[#ff3650] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入命令或搜索..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <kbd className="flex items-center gap-1 text-[10px] font-bold text-white/40 border border-white/15 rounded-md px-1.5 py-0.5">
                <CmdIcon className="w-3 h-3" />K
              </kbd>
            </div>

            {/* Command list */}
            <div className="max-h-[46vh] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-white/40 font-bold">
                  没有匹配的命令
                </p>
              ) : (
                filtered.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      i === activeIndex ? 'bg-[#ff3650]/15 text-white' : 'text-white/70'
                    }`}
                  >
                    <span className="text-white/50 w-4 h-4 flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <span className="flex-1 font-bold">{item.label}</span>
                    {item.hint && (
                      <span className="text-[11px] text-white/35 font-medium">{item.hint}</span>
                    )}
                    {i === activeIndex && <CornerDownLeft className="w-3.5 h-3.5 text-white/30" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
