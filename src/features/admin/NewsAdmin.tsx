import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminNews, NewsRow } from '../../lib/pgAdmin';
import { applyHomepageReorder, homepageNews, presentNewsItem } from '../../lib/newsFeed';
import { repository } from '../../lib/repository';
import { NewsItem } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Loader } from '../../components/motion/loader';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/motion/select';
import { Switch } from '../../components/motion/Switch';
import { Marquee } from '../../components/motion/Marquee';
import {
  ArrowRight,
  Clock,
  ExternalLink,
  GripVertical,
  Newspaper,
  Pencil,
  Pin,
  Plus,
  Save,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

const FIELD = 'w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:border-[#4246ff] focus:ring-1 focus:ring-[#4246ff] focus:outline-none transition-all placeholder:text-white/30';
const LABEL = 'text-xs font-black text-white/60 uppercase tracking-wider block mb-1';
const DRAG_MIME = 'application/x-anoix-news';
const CATEGORIES = ['Info', 'Event', 'Goods', 'Media'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Info: 'bg-[#ff3650]/20 text-[#ff3650] border-[#ff3650]/40',
  Event: 'bg-[#e0fe3d]/20 text-[#e0fe3d] border-[#e0fe3d]/40',
  Goods: 'bg-[#4246ff]/20 text-[#8b8eff] border-[#4246ff]/40',
  Media: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-white/10 text-white/50 border-white/20' },
  scheduled: { label: '定时', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  published: { label: '已发布', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  archived: { label: '已归档', cls: 'bg-white/5 text-white/30 border-white/10' },
};

type NewsDraft = {
  id: string | null;
  title: string;
  title_zh: string;
  title_en: string;
  content: string;
  content_zh: string;
  content_en: string;
  image: string;
  link: string;
  date: string;
  category: string;
  scheduleAt: string;
  status: NewsRow['status'];
  pinned: boolean;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function todayDot() {
  const d = new Date();
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyDraft(): NewsDraft {
  return {
    id: null,
    title: '',
    title_zh: '',
    title_en: '',
    content: '',
    content_zh: '',
    content_en: '',
    image: '',
    link: '',
    date: todayDot(),
    category: 'Info',
    scheduleAt: '',
    status: 'draft',
    pinned: false,
  };
}

function fromRow(r: NewsRow): NewsDraft {
  return {
    id: r.id,
    title: r.title ?? '',
    title_zh: r.title_zh ?? '',
    title_en: r.title_en ?? '',
    content: r.content ?? '',
    content_zh: r.content_zh ?? '',
    content_en: r.content_en ?? '',
    image: r.image ?? '',
    link: r.link ?? '',
    date: r.date ?? todayDot(),
    category: r.category || 'Info',
    scheduleAt: toLocalInput(r.published_at),
    status: r.status,
    pinned: !!r.pinned,
  };
}

function blankToNull(s: string) {
  const t = s.trim();
  return t ? t : null;
}

function displayTitle(item: Pick<NewsItem, 'title' | 'titleZh'>) {
  return item.titleZh || item.title;
}

export const NewsAdmin: React.FC<{ onCountChange?: (count: number) => void }> = ({ onCountChange }) => {
  const { success, error: toastError } = useToast();
  const [rows, setRows] = useState<NewsRow[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filterCat, setFilterCat] = useState<'all' | (typeof CATEGORIES)[number]>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editing, setEditing] = useState<NewsDraft | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; desc?: string; action: () => void } | null>(null);

  const reload = useCallback(async () => {
    setError('');
    try {
      const data = await adminNews.list();
      setRows(data ?? []);
      if (data && onCountChange) onCountChange(data.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载公告列表失败');
      setRows([]);
    }
  }, [onCountChange]);

  useEffect(() => { void reload(); }, [reload]);

  const touch = async () => {
    await adminNews.flush().catch(() => {});
    await reload();
    void repository.refresh();
  };

  const visibleRows = useMemo(() => homepageNews(rows ?? []), [rows]);
  const previewItems = useMemo(
    () => visibleRows.map((r) => presentNewsItem(r) as NewsItem | null).filter((x): x is NewsItem => !!x),
    [visibleRows],
  );

  const filteredNews = useMemo(() => {
    if (!rows) return [];
    let list = filterCat === 'all' ? rows : rows.filter((r) => (r.category || '').toLowerCase() === filterCat.toLowerCase());
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.title, r.title_zh, r.title_en, r.content_zh, r.content, r.date].some((v) => v && String(v).toLowerCase().includes(q)),
      );
    }
    return list;
  }, [rows, filterCat, searchQuery]);

  const persistHomepage = async (ordered: NewsRow[]) => {
    if (!rows) return;
    const byId = new Map(ordered.map((r) => [r.id, r]));
    const next = rows.map((r) => {
      const u = byId.get(r.id);
      return u ? { ...r, sort_order: u.sort_order, pinned: u.pinned } : r;
    });
    setRows(next);
    try {
      await Promise.all(ordered.map((r) => adminNews.update(r.id, { sort_order: r.sort_order, pinned: r.pinned })));
      await adminNews.flush().catch(() => {});
      void repository.refresh();
    } catch (e) {
      toastError(e instanceof Error ? e.message : '排序保存失败');
      void reload();
    }
  };

  const onDropPreview = (toIndex: number, fromId: string) => {
    const nextVisible = applyHomepageReorder(visibleRows, fromId, toIndex);
    if (nextVisible === visibleRows) return;
    void persistHomepage(nextVisible as NewsRow[]);
  };

  const saveDraft = async (mode: 'save' | 'draft' | 'publish' | 'schedule') => {
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      let status: NewsRow['status'] = editing.status;
      let publishedAt: string | null = editing.scheduleAt ? new Date(editing.scheduleAt).toISOString() : null;
      if (mode === 'draft') {
        status = 'draft';
      } else if (mode === 'publish') {
        if (!editing.title.trim()) throw new Error('公告标题必填');
        status = 'published';
        publishedAt = publishedAt || new Date().toISOString();
      } else if (mode === 'schedule') {
        if (!editing.title.trim()) throw new Error('公告标题必填');
        if (!editing.scheduleAt) throw new Error('请选择定时发布时间');
        status = 'scheduled';
        publishedAt = new Date(editing.scheduleAt).toISOString();
      } else if (status === 'published' && !publishedAt) {
        publishedAt = new Date().toISOString();
      }
      if (mode === 'save' && !editing.title.trim()) throw new Error('公告标题必填');

      const payload: Partial<NewsRow> = {
        title: editing.title.trim() || '未命名草稿',
        title_zh: blankToNull(editing.title_zh),
        title_en: blankToNull(editing.title_en),
        content: blankToNull(editing.content) || blankToNull(editing.content_zh),
        content_zh: blankToNull(editing.content_zh) || blankToNull(editing.content),
        content_en: blankToNull(editing.content_en),
        image: blankToNull(editing.image),
        link: blankToNull(editing.link),
        date: editing.date.trim() || todayDot(),
        category: editing.category,
        status,
        published_at: publishedAt,
        pinned: editing.pinned,
      };

      if (editing.id) {
        await adminNews.update(editing.id, payload);
        success('动态已更新');
      } else {
        const nextOrder = (rows ?? []).reduce((m, r) => Math.max(m, r.sort_order || 0), -1) + 1;
        await adminNews.create({
          id: `news-${Date.now()}`,
          ...payload,
          sort_order: nextOrder,
        });
        success(status === 'published' ? '已发布到首页' : '已保存');
      }
      setEditing(null);
      await touch();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: NewsRow['status']) => {
    try {
      const patch: Partial<NewsRow> = { status };
      if (status === 'published') patch.published_at = new Date().toISOString();
      await adminNews.update(id, patch);
      await touch();
    } catch (e) {
      setError(e instanceof Error ? e.message : '状态更新失败');
    }
  };

  const togglePinned = async (r: NewsRow) => {
    try {
      await adminNews.update(r.id, { pinned: !r.pinned });
      await touch();
    } catch (e) {
      setError(e instanceof Error ? e.message : '置顶更新失败');
    }
  };

  const remove = (id: string) => {
    setConfirm({
      title: '确认删除这条官方公告?',
      desc: '此操作不可恢复。首页对应条目会立刻消失。',
      action: async () => {
        try {
          await adminNews.remove(id);
          if (editing?.id === id) setEditing(null);
          await touch();
        } catch (e) {
          setError(e instanceof Error ? e.message : '删除失败');
        }
      },
    });
  };

  if (rows === null) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader variant="comet" size={32} label="加载动态公告..." className="text-[#4246ff]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#4246ff] uppercase tracking-widest flex items-center gap-1">
              <Newspaper className="w-3.5 h-3.5" />
              HOMEPAGE NEWS
            </span>
            <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
              {previewItems.length} 条在首页
            </span>
            <span className="bg-white/5 text-white/50 px-2 py-0.5 rounded-full text-xs font-mono">
              {rows.length} 篇库存
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">最新动态</h2>
          <p className="text-xs text-white/50">
            下面这块就是访客看到的钴蓝 NEWS。拖动改顺序，点条目编辑。置顶会停在最前；拖进置顶区会自动置顶，拖出则取消。首页区块始终展示，没有额外开关。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(emptyDraft())}
          className="inline-flex items-center gap-2 bg-[#4246ff] hover:bg-[#3336e0] active:scale-95 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all cursor-pointer shadow-[0_8px_20px_rgba(66,70,255,0.35)]"
        >
          <Plus className="w-4 h-4" />
          <span>发布新动态</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/40 text-sm font-bold text-[#ff3650]">
          {error}
        </div>
      )}

      <div className="relative w-full py-10 md:py-14 px-4 sm:px-8 overflow-hidden select-none bg-[#4246ff] rounded-3xl border border-white/10">
        <div className="absolute top-2 left-0 right-0 overflow-hidden pointer-events-none opacity-25 flex justify-center">
          <h2
            className="text-[72px] sm:text-[110px] lg:text-[140px] font-black tracking-tighter text-white leading-none uppercase whitespace-nowrap"
            style={{ fontFamily: "'Fjordic-Heavy', 'Arial Black', sans-serif" }}
          >
            NEWS
          </h2>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="mb-8 flex items-end justify-between gap-3">
            <div>
              <h3
                className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase"
                style={{ fontFamily: "'Fjordic-Heavy', 'Arial Black', sans-serif" }}
              >
                最新动态
              </h3>
              <div className="w-16 h-1.5 bg-white mt-3 rounded-full" />
            </div>
            <span className="text-[10px] font-mono text-white/70 hidden sm:inline">拖动手柄排序 · 点击编辑</span>
          </div>

          {previewItems.length > 0 && (
            <div className="mb-8 border-y border-white/15 py-3 overflow-hidden">
              <Marquee duration={26} pauseOnHover>
                {previewItems.map((item) => (
                  <span key={item.id} className="inline-flex items-center gap-2 px-5 text-sm font-bold text-white/90 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span className="font-mono text-xs text-white/60">{item.date}</span>
                    <span>{displayTitle(item)}</span>
                  </span>
                ))}
              </Marquee>
            </div>
          )}

          <div className="news_list divide-y divide-white/20 border-t border-b border-white/20">
            {previewItems.length === 0 ? (
              <p className="py-12 text-center text-white/80 font-bold">暂无已发布动态。首页这一块仍会显示，访客会看到空列表。</p>
            ) : (
              previewItems.map((item, index) => {
                const row = visibleRows[index];
                return (
                  <article
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DRAG_MIME, item.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromId = e.dataTransfer.getData(DRAG_MIME);
                      if (fromId) onDropPreview(index, fromId);
                    }}
                    className="py-5 sm:py-6 flex items-center gap-3 sm:gap-5 group cursor-grab active:cursor-grabbing hover:bg-white/10 px-3 md:px-4 -mx-3 md:-mx-4 rounded-2xl transition-all duration-200"
                  >
                    <span className="text-white/50 shrink-0" title="拖动排序">
                      <GripVertical className="w-4 h-4" />
                    </span>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-white/10 bg-black/40"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => row && setEditing(fromRow(row))}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3 text-sm font-bold text-white/80 flex-wrap">
                        <time className="font-mono tracking-wider text-white">{item.date}</time>
                        {item.category && (
                          <span className="bg-white text-[#4246ff] text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {item.category}
                          </span>
                        )}
                        {row?.pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#e0fe3d] uppercase">
                            <Pin className="w-3 h-3" /> 置顶
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 text-lg sm:text-xl font-bold text-white group-hover:text-[#f5ffe5] line-clamp-2">
                        {displayTitle(item)}
                      </h4>
                    </button>
                    <button
                      type="button"
                      onClick={() => row && setEditing(fromRow(row))}
                      className="hidden md:inline-flex items-center text-white/80 hover:text-white cursor-pointer"
                      title="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </article>
                );
              })
            )}
          </div>

          <div className="mt-8 flex justify-start pointer-events-none">
            <span className="design_button inline-flex items-center gap-3 bg-[#f5ffe5] text-[#121212] px-7 py-3 rounded-full font-black text-sm tracking-wider uppercase shadow-xl">
              查看全部
              <span className="w-7 h-7 rounded-full bg-[#121212] text-[#f5ffe5] flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181818] p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {(['all', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                filterCat === c
                  ? 'bg-[#4246ff] text-white shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {c === 'all' ? `全部库存 (${rows.length})` : c}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索公告..."
            className="w-full bg-white/5 border border-white/15 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#4246ff] transition-colors"
          />
        </div>
      </div>

      {filteredNews.length === 0 ? (
        <div className="py-16 text-center text-white/40 font-bold">暂无匹配的动态</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map((r) => (
            <div
              key={r.id}
              className="group bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 hover:border-[#4246ff]/50 hover:bg-[#1e1e1e] transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[r.category || ''] || 'bg-white/10 text-white'}`}>
                  {r.category || 'Info'}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_META[r.status]?.cls || 'bg-white/10 text-white'}`}>
                  {STATUS_META[r.status]?.label ?? r.status}
                </span>
                {r.pinned && <Pin className="w-3 h-3 text-[#e0fe3d]" />}
                <span className="text-xs font-mono text-white/50 ml-auto">{r.date}</span>
              </div>
              <h4 className="font-black text-white text-base line-clamp-1 mb-1 group-hover:text-[#8b8eff] transition-colors">
                {r.title_zh || r.title}
              </h4>
              {r.title_zh && <p className="text-xs text-white/40 font-mono line-clamp-1 mb-1">{r.title}</p>}
              {(r.content_zh || r.content) && (
                <p className="text-xs text-white/60 line-clamp-2">{r.content_zh || r.content}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                {r.status === 'draft' && (
                  <button type="button" onClick={() => setStatus(r.id, 'published')} className="px-2.5 py-1 rounded-lg bg-[#4246ff] hover:bg-[#3336e0] text-xs font-bold text-white cursor-pointer">发布</button>
                )}
                {r.status === 'scheduled' && (
                  <button type="button" onClick={() => setStatus(r.id, 'published')} className="px-2.5 py-1 rounded-lg bg-[#4246ff] hover:bg-[#3336e0] text-xs font-bold text-white cursor-pointer">立即发布</button>
                )}
                {r.status === 'published' && (
                  <button type="button" onClick={() => setStatus(r.id, 'archived')} className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white/70 cursor-pointer">归档</button>
                )}
                {r.status === 'archived' && (
                  <button type="button" onClick={() => setStatus(r.id, 'published')} className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-bold text-emerald-400 cursor-pointer">重新发布</button>
                )}
                <span className="inline-flex items-center gap-1.5 px-1.5">
                  <Switch checked={!!r.pinned} onChange={() => togglePinned(r)} />
                  <span className="text-xs font-bold text-white/50 whitespace-nowrap">
                    {r.pinned ? '已置顶' : '置顶'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(fromRow(r))}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-bold text-white/70 cursor-pointer inline-flex items-center gap-1 border border-white/10"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#ff3650] text-xs font-bold text-white/50 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 border border-white/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl" onClick={() => setEditing(null)}>
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#181818] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{editing.id ? '编辑动态' : '发布新动态'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#4246ff] px-4 py-3">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">首页预览标题</p>
              <p className="text-base font-black text-white line-clamp-2">{editing.title_zh || editing.title || '（未填标题）'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>原文标题 *</label>
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={FIELD} placeholder="如 『ダンジョン飯』POP UP STORE" />
              </div>
              <div>
                <label className={LABEL}>中文标题</label>
                <input value={editing.title_zh} onChange={(e) => setEditing({ ...editing, title_zh: e.target.value })} className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>English title</label>
                <input value={editing.title_en} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>展示日期</label>
                <input value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className={FIELD} placeholder="2026.08.29" />
              </div>
              <div>
                <label className={LABEL}>分类</label>
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={LABEL}>定时发布时间</label>
                <input
                  type="datetime-local"
                  value={editing.scheduleAt}
                  onChange={(e) => setEditing({ ...editing, scheduleAt: e.target.value })}
                  className={FIELD}
                />
              </div>
            </div>

            <div>
              <label className={LABEL}>中文正文</label>
              <textarea value={editing.content_zh} onChange={(e) => setEditing({ ...editing, content_zh: e.target.value })} rows={4} className={FIELD} />
            </div>
            <div>
              <label className={LABEL}>原文正文</label>
              <textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={3} className={FIELD} />
            </div>
            <div>
              <label className={LABEL}>English body</label>
              <textarea value={editing.content_en} onChange={(e) => setEditing({ ...editing, content_en: e.target.value })} rows={3} className={FIELD} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>封面图 URL（可选）</label>
                <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className={FIELD} placeholder="https://…" />
              </div>
              <div>
                <label className={LABEL}>外链（可选）</label>
                <input value={editing.link} onChange={(e) => setEditing({ ...editing, link: e.target.value })} className={FIELD} placeholder="https://…" />
              </div>
            </div>

            {editing.link.trim() && (
              <a href={editing.link.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8b8eff] hover:text-white">
                <ExternalLink className="w-3.5 h-3.5" /> 打开外链
              </a>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <span className="inline-flex items-center gap-2">
                <Switch checked={editing.pinned} onChange={(on) => setEditing({ ...editing, pinned: on })} />
                <span className="text-xs font-bold text-white/60">{editing.pinned ? '已置顶（首页最前）' : '置顶到首页最前'}</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold text-white/60 cursor-pointer">取消</button>
              <button type="button" onClick={() => void saveDraft('draft')} disabled={busy} className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold text-white/70 cursor-pointer disabled:opacity-50">
                存为草稿
              </button>
              <button
                type="button"
                onClick={() => void saveDraft('schedule')}
                disabled={busy}
                className="inline-flex items-center gap-2 bg-[#151515] border border-[#4246ff]/50 hover:bg-[#4246ff]/20 disabled:opacity-50 text-white font-black text-xs uppercase px-4 py-2 rounded-xl cursor-pointer"
              >
                <Clock className="w-4 h-4" /> 定时发布
              </button>
              {editing.id && editing.status !== 'published' && (
                <button
                  type="button"
                  onClick={() => void saveDraft('publish')}
                  disabled={busy}
                  className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-50 text-white font-black text-xs uppercase px-5 py-2 rounded-xl cursor-pointer"
                >
                  <Save className="w-4 h-4" /> 立即发布
                </button>
              )}
              {editing.id ? (
                <button
                  type="button"
                  onClick={() => void saveDraft('save')}
                  disabled={busy}
                  className="inline-flex items-center gap-2 bg-[#4246ff] hover:bg-[#3336e0] disabled:opacity-50 text-white font-black text-xs uppercase px-5 py-2 rounded-xl cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {busy ? '保存中...' : '保存修改'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void saveDraft('publish')}
                  disabled={busy}
                  className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-50 text-white font-black text-xs uppercase px-5 py-2 rounded-xl cursor-pointer"
                >
                  <Save className="w-4 h-4" /> {busy ? '发布中...' : '立即发布'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        description={confirm?.desc}
        onConfirm={() => confirm?.action()}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
};
