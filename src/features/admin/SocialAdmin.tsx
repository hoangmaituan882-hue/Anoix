import React, { useCallback, useEffect, useState } from 'react';
import { adminSocial, SocialLinkDraft, SocialLinkRow } from '../../lib/social';
import { repository } from '../../lib/repository';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Loader } from '../../components/motion/loader';
import { SocialLinkCard, snsGridClass } from '../../components/layout/SocialLinkCard';
import { SocialLink } from '../../types';
import {
  ExternalLink, GripVertical, Pencil, Plus, Save, Share2, Trash2, X,
} from 'lucide-react';

const FIELD = 'w-full bg-black/50 border border-black/15 rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none transition-all placeholder:text-black/30';
const LABEL = 'text-xs font-black text-black/60 uppercase tracking-wider block mb-1';
const DRAG_MIME = 'application/x-anoix-social';

const PRESETS: Array<SocialLinkDraft & { hint: string }> = [
  {
    name: 'X',
    url: 'https://x.com/',
    descZh: '工作室最新动态与周边商品预告发布于此',
    descEn: 'Official news, production updates, and merchandise announcements',
    descJa: 'スタジオの最新情報やグッズの告知はこちら',
    hint: '动态与周边预告',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/',
    descZh: '工作室最新日常照片与原画插图分享',
    descEn: 'Artworks, behind-the-scenes sketches, and studio photography',
    descJa: 'スタジオの最新情報やグッズ告知はこちら',
    hint: '日常照片与原画',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/',
    descZh: '幕后制作特辑、主创座谈会、活动现场实录持续更新中',
    descEn: 'Making-of documentaries, creator discussions, and live events',
    descJa: 'メイキング、座談会、イベント密着レポなど更新中',
    hint: '幕后与活动实录',
  },
  {
    name: 'Twitch',
    url: 'https://www.twitch.tv/',
    descZh: '不定期进行作画与制作人在线直播互动',
    descEn: 'Occasional live drawing and creator stream broadcasts',
    descJa: '不定期で生配信中',
    hint: '作画直播',
  },
  {
    name: 'Discord',
    url: 'https://discord.gg/',
    descZh: '供全球粉丝互动交流与社区活动的官方服务器',
    descEn: 'Official global community server connecting fans worldwide',
    descJa: 'ファン同士で繋がれる場を運営中',
    hint: '粉丝社区',
  },
  {
    name: 'Patreon',
    url: 'https://www.patreon.com/',
    descZh: '会员专享特权、专属原画流出与独家内容发布',
    descEn: 'Exclusive member rewards, insider sketches, and monthly podcasts',
    descJa: '会員限定特典など配信中',
    hint: '会员专属',
  },
];

const emptyDraft = (): SocialLinkDraft => ({
  name: '',
  url: 'https://',
  descZh: '',
  descEn: '',
  descJa: '',
});

function toDraft(row: SocialLinkRow): SocialLinkDraft {
  return {
    name: row.name ?? '',
    url: row.url ?? '',
    descZh: row.desc_zh ?? '',
    descEn: row.desc_en ?? '',
    descJa: row.desc_ja ?? '',
  };
}

function toCard(row: SocialLinkRow): SocialLink {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    descZh: row.desc_zh ?? '',
    descEn: row.desc_en ?? '',
    descJa: row.desc_ja ?? '',
    icon: '',
  };
}

export const SocialAdmin: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [rows, setRows] = useState<SocialLinkRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; draft: SocialLinkDraft } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; action: () => void } | null>(null);

  const reload = useCallback(async () => {
    setError('');
    try {
      setRows(await adminSocial.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      setRows([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const persistOrder = async (next: SocialLinkRow[]) => {
    setRows(next);
    try {
      await adminSocial.reorder(next.map((r) => r.id));
      void repository.refresh();
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

  const saveDraft = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      if (editing.id) await adminSocial.update(editing.id, editing.draft);
      else await adminSocial.create(editing.draft);
      setEditing(null);
      success(editing.id ? '格子已更新' : '已加入页脚');
      await reload();
      void repository.refresh();
    } catch (e) {
      toastError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  if (rows === null) {
    return (
      <div className="py-20 flex justify-center">
        <Loader variant="comet" size={32} label="加载页脚社交..." className="text-[#ff3650]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-black/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#ff3650]" />
          <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest">Footer Social</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">页脚社交格子</h2>
        <p className="text-xs text-black/50">
          增删后页脚格子数跟着变。可拖动排序。链接必须是 https。
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setEditing({
                id: null,
                draft: { name: p.name, url: p.url, descZh: p.descZh, descEn: p.descEn, descJa: p.descJa },
              })}
              className="px-3 py-1.5 rounded-full border border-black/15 bg-white/5 hover:border-[#ff3650] hover:text-[#ff3650] text-xs font-bold text-black/80 cursor-pointer"
              title={p.hint}
            >
              + {p.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditing({ id: null, draft: emptyDraft() })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff3650] text-white text-xs font-black cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> 自定义
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm font-bold text-[#ff3650] bg-[#ff3650]/10 border border-[#ff3650]/30 rounded-2xl px-4 py-3">{error}</p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">页脚预览 · 拖动排序</h3>
          <span className="text-[10px] font-mono text-black/40">{rows.length} 格</span>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-black/15 bg-black/30 p-12 text-center text-sm text-black/40">
            还没有格子。用上方快捷按钮加入 X / Instagram 等，或自定义一条。
          </div>
        ) : (
          <div className={snsGridClass(rows.length)}>
            {rows.map((r, index) => (
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
                className="relative"
              >
                <SocialLinkCard item={toCard(r)} lang="zh" href={false}>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/10">
                    <span className="text-black/30 cursor-grab" title="拖动排序">
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <div className="flex gap-1">
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-black/70"
                          title="打开链接"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditing({ id: r.id, draft: toDraft(r) })}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-black/70 cursor-pointer"
                        title="编辑"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirm({
                          title: `删除「${r.name}」？页脚会少一格。`,
                          action: async () => {
                            try {
                              await adminSocial.remove(r.id);
                              success('已删除');
                              void reload();
                              void repository.refresh();
                            } catch (e) {
                              toastError(e instanceof Error ? e.message : '删除失败');
                            }
                          },
                        })}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#ff3650] text-black/40 hover:text-white cursor-pointer"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </SocialLinkCard>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg bg-white border border-black/20 rounded-3xl p-6 space-y-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{editing.id ? '编辑格子' : '新增格子'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>名称</label>
                <input value={editing.draft.name} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, name: e.target.value } })} className={FIELD} placeholder="X / Instagram / 自定义" />
              </div>
              <div>
                <label className={LABEL}>链接（https）</label>
                <input value={editing.draft.url} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, url: e.target.value } })} className={FIELD} placeholder="https://" />
              </div>
              <div>
                <label className={LABEL}>中文简介</label>
                <textarea value={editing.draft.descZh} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, descZh: e.target.value } })} className={`${FIELD} min-h-[72px] resize-y`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>English</label>
                  <textarea value={editing.draft.descEn} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, descEn: e.target.value } })} className={`${FIELD} min-h-[64px] resize-y`} />
                </div>
                <div>
                  <label className={LABEL}>日本語</label>
                  <textarea value={editing.draft.descJa} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, descJa: e.target.value } })} className={`${FIELD} min-h-[64px] resize-y`} />
                </div>
              </div>
            </div>
            {editing.draft.name && (
              <SocialLinkCard
                item={{
                  id: 'preview',
                  name: editing.draft.name,
                  url: editing.draft.url,
                  descZh: editing.draft.descZh,
                  descEn: editing.draft.descEn,
                  descJa: editing.draft.descJa,
                  icon: '',
                }}
                lang="zh"
                href={false}
              />
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-black/15 text-xs font-bold text-black/60 cursor-pointer">取消</button>
              <button type="button" onClick={() => void saveDraft()} disabled={busy} className="inline-flex items-center gap-2 bg-[#ff3650] text-white font-black text-xs px-5 py-2 rounded-xl cursor-pointer disabled:opacity-40">
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
