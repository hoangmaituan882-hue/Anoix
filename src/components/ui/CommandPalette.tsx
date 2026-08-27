import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsList, TabsTrigger } from './tabs';
import {
  Search,
  CornerDownLeft,
  Command as CmdIcon,
  Film,
  Calendar,
  Newspaper,
  Sparkles,
  ArrowRight,
  MapPin,
  X,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  category: 'films' | 'screenings' | 'news' | 'actions';
  label: string;
  labelEn?: string;
  hint?: string;
  icon: React.ReactNode;
  action: () => void;
  // Live Preview Data for Split Pane
  preview?: {
    type: 'film' | 'screening' | 'news' | 'action';
    image?: string;
    title: string;
    subtitle?: string;
    description?: string;
    tags?: string[];
    date?: string;
    venue?: string;
    metaBadge?: string;
  };
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
  lang?: 'zh' | 'ja' | 'en';
}

type FilterTab = 'all' | 'films' | 'screenings' | 'news';

/**
 * Modern Raycast/Linear Spotlight Split-View Command Palette adhering to pure Chinese design system.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Filter commands by search query and category tab
  const filtered = useMemo(() => {
    let result = commands;
    if (activeTab !== 'all') {
      result = result.filter((c) => c.category === activeTab);
    }
    const q = query.trim().toLowerCase();
    if (!q) return result;
    return result.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.labelEn && c.labelEn.toLowerCase().includes(q)) ||
        (c.hint && c.hint.toLowerCase().includes(q)) ||
        (c.preview?.description && c.preview.description.toLowerCase().includes(q))
    );
  }, [commands, query, activeTab]);

  const activeItem = filtered[activeIndex] || filtered[0];

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveTab('all');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, activeTab]);

  // Keyboard navigation
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
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const tabs: FilterTab[] = ['all', 'films', 'screenings', 'news'];
        const currentIdx = tabs.indexOf(activeTab);
        const nextTab = tabs[(currentIdx + 1) % tabs.length];
        setActiveTab(nextTab);
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
  }, [open, filtered, activeIndex, activeTab, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listContainerRef.current) {
      const activeEl = listContainerRef.current.querySelector(
        `[data-index="${activeIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[12vh] px-4 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Main Modal Shell */}
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onMouseMove={handleMouseMove}
            onClick={(e) => e.stopPropagation()}
            className="command-modal-card relative w-full max-w-3xl bg-[#141416] text-[#f5ffe5] border border-white/15 rounded-[26px] shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[78vh]"
          >
            {/* Dynamic Spotlight Glow Background Effect */}
            <div
              className="pointer-events-none absolute -inset-px rounded-[26px] opacity-25 transition-opacity duration-300"
              style={{
                background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 54, 80, 0.35), transparent 80%)`,
              }}
            />

            {/* Top Search Bar & Category Filter Tabs */}
            <div className="relative border-b border-white/10 p-3 sm:p-4 space-y-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#ff3650]/15 flex items-center justify-center text-[#ff3650] shrink-0 border border-[#ff3650]/20">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索动画作品、放映档案、官方动态或直接输入指令..."
                  className="flex-1 bg-transparent text-[16px] font-bold text-white placeholder:text-white/35 focus:outline-none tracking-normal"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-[#ff3650] text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
                    title="清空搜索"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-white/40 border border-white/15 rounded-lg px-2 py-1 bg-white/5">
                  <CmdIcon className="w-3 h-3" />K
                </kbd>
              </div>

              {/* Category Segment Tabs via Motion Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as FilterTab)}
                variant="pill"
                className="w-auto"
              >
                <TabsList className="bg-transparent border-0 p-0 gap-1.5 overflow-x-auto">
                  {[
                    { id: 'all', label: '全部', icon: Sparkles },
                    { id: 'films', label: '动画作品', icon: Film },
                    { id: 'screenings', label: '放映档案', icon: Calendar },
                    { id: 'news', label: '官方动态', icon: Newspaper },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border border-white/10"
                      >
                        <Icon className="w-3 h-3" />
                        <span>{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>

            {/* Split-View Body: Left List + Right Live Preview Pane */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-0 flex-1 overflow-hidden">
              {/* Left Column: Result List */}
              <div
                ref={listContainerRef}
                className="md:col-span-7 overflow-y-auto p-2 divide-y divide-white/5 max-h-[50vh] md:max-h-none border-b md:border-b-0 md:border-r border-white/10"
              >
                {filtered.length === 0 ? (
                  <div className="py-14 text-center">
                    <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-[16px] font-bold text-white/60">
                      未找到相关结果
                    </p>
                    <p className="text-[14px] text-white/40 mt-1 leading-[1.55]">
                      尝试搜索“边缘行者”、“普罗米亚”或“天元突破”
                    </p>
                  </div>
                ) : (
                  filtered.map((item, i) => {
                    const isSelected = i === activeIndex;
                    return (
                      <div
                        key={item.id}
                        data-index={i}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`group flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff3650]/15 text-white border border-[#ff3650]/40 shadow-xs'
                            : 'hover:bg-white/5 text-white/75 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#ff3650] text-white'
                              : 'bg-white/5 text-white/60 group-hover:text-white'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-bold truncate text-white leading-snug">
                            {item.label}
                          </p>
                          {item.hint && (
                            <p className="text-[12px] text-white/45 truncate mt-0.5 font-normal">
                              {item.hint}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <CornerDownLeft className="w-4 h-4 text-[#ff3650] shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Split-View Live Preview Pane */}
              <div className="hidden md:flex md:col-span-5 p-4 flex-col justify-between bg-black/25 overflow-y-auto">
                {activeItem?.preview ? (
                  <div className="space-y-3">
                    {/* Preview Image / Backdrop */}
                    {activeItem.preview.image && (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-sm">
                        <img
                          src={activeItem.preview.image}
                          alt={activeItem.preview.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        {activeItem.preview.metaBadge && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold bg-[#ff3650] text-white rounded-md">
                            {activeItem.preview.metaBadge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Preview Title: 16px Bold */}
                    <div>
                      <h4 className="text-[16px] font-bold text-white leading-snug">
                        {activeItem.preview.title}
                      </h4>
                      {activeItem.preview.subtitle && (
                        <p className="text-[12px] text-[#ff3650] font-bold mt-0.5">
                          {activeItem.preview.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Meta details: 12px */}
                    <div className="space-y-1 text-[12px] text-white/60">
                      {activeItem.preview.date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#ff3650]" />
                          <span>{activeItem.preview.date}</span>
                        </div>
                      )}
                      {activeItem.preview.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#ff3650]" />
                          <span className="truncate">{activeItem.preview.venue}</span>
                        </div>
                      )}
                    </div>

                    {/* Description: 14px Regular with 1.55 Line-height */}
                    {activeItem.preview.description && (
                      <p className="text-[14px] font-normal text-white/70 line-clamp-3 leading-[1.55] border-t border-white/10 pt-2">
                        {activeItem.preview.description}
                      </p>
                    )}

                    {/* Tags */}
                    {activeItem.preview.tags && activeItem.preview.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {activeItem.preview.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70 font-normal"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-white/30 text-[12px]">
                    <Sparkles className="w-8 h-8 mb-2 opacity-40 text-[#ff3650]" />
                    <span>即时档案看板</span>
                  </div>
                )}

                {/* Primary Action Button: 16px Bold */}
                {activeItem && (
                  <button
                    onClick={() => {
                      activeItem.action();
                      onClose();
                    }}
                    className="w-full mt-4 py-2.5 rounded-xl bg-[#ff3650] hover:bg-[#ff1f3d] text-white text-[16px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <span>查看详情</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Keyboard Shortcuts Footer */}
            <div className="border-t border-white/10 px-4 py-2.5 bg-black/40 flex flex-wrap items-center justify-between text-[12px] text-white/50 shrink-0 select-none">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">↓</kbd>
                  <span>移动选择</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">Tab</kbd>
                  <span>切换分类</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">↵</kbd>
                  <span>打开详情</span>
                </span>
              </div>
              <span className="hidden sm:inline text-white/30">
                档案聚光灯搜索
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
