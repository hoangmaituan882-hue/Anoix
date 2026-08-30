import React, { useCallback, useEffect, useState } from 'react';
import { adminChannel, ChannelVideoRow } from '../../lib/pgAdmin';
import { resolveChannelUrl } from '../../lib/channel';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Loader } from '../../components/motion/loader';
import {
  Clapperboard, ExternalLink, GripVertical, Link2, Pencil, Plus, Save, Trash2, X, Play,
} from 'lucide-react';

const FIELD = 'w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none transition-all placeholder:text-white/30';
const LABEL = 'text-xs font-black text-white/60 uppercase tracking-wider block mb-1';
const DRAG_MIME = 'application/x-anoix-channel';

const PLATFORM: Record<string, { label: string; cls: string }> = {
  bilibili: { label: 'B站', cls: 'bg-[#00A1D6]/20 text-[#7fd7f0] border-[#00A1D6]/40' },
  youtube: { label: 'YT', cls: 'bg-[#ff3650]/20 text-[#ff3650] border-[#ff3650]/40' },
  other: { label: '外链', cls: 'bg-white/10 text-white/60 border-white/15' },
};

export const ChannelAdmin: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [hubUrl, setHubUrl] = useState('');
  const [rows, setRows] = useState<ChannelVideoRow[] | null>(null);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ChannelVideoRow | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; action: () => void } | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setError('');
    try {
      const [settings, list] = await Promise.all([adminChannel.settings(), adminChannel.list()]);
      setHubUrl(settings?.[0]?.hub_url ?? '');
      setRows(list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      setRows([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const saveHub = async () => {
    setBusy(true);
    try {
      await adminChannel.saveHub(hubUrl.trim());
      success('查看全部链接已保存');
    } catch (e) {
      toastError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  const addFromPaste = async () => {
    const url = paste.trim();
    if (!url) return;
    setBusy(true);
    try {
      const meta = await resolveChannelUrl(url);
      const nextOrder = (rows ?? []).reduce((m, r) => Math.max(m, r.sort_order), -1) + 1;
      await adminChannel.create({
        id: `ch-${Date.now()}`,
        url: meta.canonicalUrl,
        platform: meta.platform,
        video_key: meta.videoKey,
        title: meta.title || meta.canonicalUrl,
        title_zh: meta.title || null,
        thumbnail: meta.thumbnail || null,
        duration: meta.duration || null,
        sort_order: nextOrder,
      });
      setPaste('');
      success('已加入频道卡片');
      await reload();
    } catch (e) {
      toastError(e instanceof Error ? e.message : '解析失败，可改手动填写');
    } finally {
      setBusy(false);
    }
  };

  const persistOrder = async (next: ChannelVideoRow[]) => {
    setRows(next);
    try {
      await Promise.all(next.map((r, i) => adminChannel.update(r.id, { sort_order: i })));
    } catch (e) {
      toastError(e instanceof Error ? e.message : '排序保存失败');
      void reload();
    }
  };

  const onDropCard = (toIndex: number, fromId: string) => {
    if (!rows) return;
    const from = rows.findIndex((r) => r.id === fromId);
    if (from < 0 || from === toIndex) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(toIndex, 0, moved);
    void persistOrder(next.map((r, i) => ({ ...r, sort_order: i })));
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const { id, ...patch } = editing;
      await adminChannel.update(id, patch);
      setEditing(null);
      success('卡片已更新');
      await reload();
    } catch (e) {
      toastError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  if (rows === null) {
    return (
      <div className="py-20 flex justify-center">
        <Loader variant="comet" size={32} label="加载官方频道..." className="text-[#ff3650]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-[#ff3650]" />
          <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest">Official Channel</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">官方频道</h2>
        <p className="text-xs text-white/50">
          粘贴 Bilibili / YouTube 链接自动抓封面。首页点卡片会跳到对应站点，不站内播放。
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className={LABEL}>「查看全部」链接</label>
            <input
              value={hubUrl}
              onChange={(e) => setHubUrl(e.target.value)}
              placeholder="https://space.bilibili.com/… 或合集链接"
              className={FIELD}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void saveHub()}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-40 text-white font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              <Save className="w-4 h-4" /> 保存入口
            </button>
            {hubUrl.trim() && (
              <a
                href={hubUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/15 text-white/70 hover:text-white text-xs font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" /> 预览
              </a>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm font-bold text-[#ff3650] bg-[#ff3650]/10 border border-[#ff3650]/30 rounded-2xl px-4 py-3">{error}</p>
      )}

      <div className="bg-[#181818] border border-white/10 rounded-3xl p-4 sm:p-5 space-y-3">
        <label className={LABEL}>粘贴视频链接加入卡片</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void addFromPaste(); }}
              placeholder="https://www.bilibili.com/video/BV… 或 YouTube 链接"
              className={`${FIELD} pl-10`}
            />
          </div>
          <button
            onClick={() => void addFromPaste()}
            disabled={busy || !paste.trim()}
            className="inline-flex items-center justify-center gap-2 bg-white text-[#121212] hover:bg-[#e0fe3d] disabled:opacity-40 font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 解析并添加
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">首页预览 · 拖动排序</h3>
          <span className="text-[10px] font-mono text-white/40">{rows.length} 张卡片</span>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 p-12 text-center text-sm text-white/40">
            还没有卡片。在上方粘贴 Bilibili 链接即可。
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {rows.map((r, index) => {
              const badge = PLATFORM[r.platform] ?? PLATFORM.other;
              return (
                <div
                  key={r.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_MIME, r.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromId = e.dataTransfer.getData(DRAG_MIME);
                    if (fromId) onDropCard(index, fromId);
                  }}
                  className="flex-shrink-0 w-[260px] bg-[#1a1a1a] border border-white/10 hover:border-[#ff3650]/50 rounded-2xl overflow-hidden"
                >
                  <div className="relative aspect-video bg-black/60">
                    {r.thumbnail ? (
                      <img src={r.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Play className="w-8 h-8" />
                      </div>
                    )}
                    <span className={`absolute top-2 left-2 text-[10px] font-black px-1.5 py-0.5 rounded border ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {r.duration && (
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/80 px-1.5 py-0.5 rounded">
                        {r.duration}
                      </span>
                    )}
                    <span className="absolute top-2 right-2 text-white/50 cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-bold text-white line-clamp-2 min-h-[2.5rem]">
                      {r.title_zh || r.title}
                    </p>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(r)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 cursor-pointer"
                        title="编辑"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirm({
                          title: `删除「${r.title_zh || r.title}」？`,
                          action: async () => {
                            try {
                              await adminChannel.remove(r.id);
                              success('已删除');
                              void reload();
                            } catch (e) {
                              toastError(e instanceof Error ? e.message : '删除失败');
                            }
                          },
                        })}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#ff3650] text-white/40 hover:text-white cursor-pointer"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg bg-[#181818] border border-white/20 rounded-3xl p-6 space-y-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">编辑卡片</h3>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>标题</label>
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>中文标题</label>
                <input value={editing.title_zh ?? ''} onChange={(e) => setEditing({ ...editing, title_zh: e.target.value })} className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>视频链接</label>
                <input value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>封面图 URL（解析失败时手贴）</label>
                <input value={editing.thumbnail ?? ''} onChange={(e) => setEditing({ ...editing, thumbnail: e.target.value })} className={FIELD} />
              </div>
              <div>
                <label className={LABEL}>时长</label>
                <input value={editing.duration ?? ''} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} className={FIELD} placeholder="8:42" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-white/15 text-xs font-bold text-white/60 cursor-pointer">取消</button>
              <button onClick={() => void saveEdit()} disabled={busy} className="inline-flex items-center gap-2 bg-[#ff3650] text-white font-black text-xs px-5 py-2 rounded-xl cursor-pointer disabled:opacity-40">
                <Save className="w-4 h-4" /> 保存
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        onConfirm={() => confirm?.action()}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
};
