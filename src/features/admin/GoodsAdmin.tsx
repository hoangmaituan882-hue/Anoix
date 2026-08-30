import React, { useCallback, useEffect, useState } from 'react';
import { adminGoods, GoodsRow } from '../../lib/pgAdmin';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ShoppingBag, Plus, Pencil, Trash2, X, ExternalLink } from 'lucide-react';

const LABEL = 'text-xs font-black text-black/60 uppercase tracking-wider block mb-1';
const FIELD = 'space-y-1.5';

const emptyDraft: Partial<GoodsRow> = {
  id: '', series: '', title: '', title_zh: '', title_en: '', price: '', image: '', taobao_url: '', is_preorder: false, description: '', sort_order: 0,
};

/** 周边商品管理：CRUD + 淘宝链接 + 价格/图（管理员补齐）。 */
export const GoodsAdmin: React.FC = () => {
  const [goods, setGoods] = useState<GoodsRow[] | null>(null);
  const [error, setError] = useState('');
  const { success, error: toastError } = useToast();

  const [editing, setEditing] = useState<Partial<GoodsRow> | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; desc?: string; action: () => void } | null>(null);

  const reload = useCallback(async () => {
    setError('');
    try { setGoods(await adminGoods.list()); }
    catch (e) { setError(e instanceof Error ? e.message : '加载商品失败'); setGoods([]); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const save = async () => {
    if (!editing || !editing.title?.trim()) { toastError('标题必填'); return; }
    setBusy(true);
    try {
      const row: Partial<GoodsRow> = {
        series: editing.series || null,
        title: editing.title!.trim(),
        title_zh: editing.title_zh?.trim() || null,
        title_en: editing.title_en?.trim() || null,
        price: editing.price?.trim() || null,
        image: editing.image?.trim() || null,
        taobao_url: editing.taobao_url?.trim() || null,
        is_preorder: Boolean(editing.is_preorder),
        description: editing.description?.trim() || null,
        sort_order: editing.sort_order ?? 0,
      };
      if (editing.id) {
        await adminGoods.update(editing.id, row);
        success('商品已更新');
      } else {
        await adminGoods.create({ ...row, id: `goods-${Date.now()}` });
        success('商品已新增');
      }
      setEditing(null);
      void reload();
    } catch (e) { toastError(e instanceof Error ? e.message : '保存失败'); }
    finally { setBusy(false); }
  };

  const remove = (g: GoodsRow) => {
    setConfirm({
      title: `删除「${g.title}」？`,
      action: async () => {
        try { await adminGoods.remove(g.id); success('已删除'); void reload(); }
        catch (e) { toastError(e instanceof Error ? e.message : '删除失败'); }
        setConfirm(null);
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#ff3650]" /> 周边商品
        </h2>
        <Button onClick={() => setEditing({ ...emptyDraft })}><Plus className="w-4 h-4" /> 新增商品</Button>
      </div>

      {error && <p className="text-sm text-[#ffb3bd] bg-[#2a1518] border border-[#ff3650]/40 rounded-xl px-4 py-3">{error}</p>}

      {goods === null ? (
        <p className="text-black/40 text-sm py-6">加载中…</p>
      ) : goods.length === 0 ? (
        <p className="text-black/40 text-sm py-6">暂无商品。</p>
      ) : (
        <div className="space-y-2.5">
          {goods.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5">
              {g.image ? <img src={g.image} alt="" className="w-12 h-16 rounded-md object-cover shrink-0 bg-black/40" /> : <div className="w-12 h-16 rounded-md bg-white/5 shrink-0 flex items-center justify-center text-black/20 text-[10px]">无图</div>}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{g.title}</p>
                <p className="text-[11px] text-black/40 truncate">{g.series || '—'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black text-[#ff3650]">{g.price || '未标价'}</span>
                  {g.is_preorder && <Badge variant="outline">预售</Badge>}
                  {g.taobao_url ? (
                    <a href={g.taobao_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ff5000] hover:text-white transition-colors"><ExternalLink className="w-3 h-3" /> 淘宝</a>
                  ) : <span className="text-[10px] font-bold text-black/30">无淘宝链接</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setEditing({ ...g })} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-black/60 hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer" title="编辑"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(g)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#ff3650] text-black/60 hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer" title="删除"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={() => setEditing(null)}>
          <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto bg-white border border-black/15 rounded-3xl p-6 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black">{editing.id ? '编辑商品' : '新增商品'}</h3>
              <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] flex items-center justify-center transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3.5">
              <div className={FIELD}>
                <Label className={LABEL}>标题（必填）</Label>
                <Input value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="商品标题" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className={FIELD}>
                  <Label className={LABEL}>系列</Label>
                  <Input value={editing.series ?? ''} onChange={(e) => setEditing({ ...editing, series: e.target.value })} placeholder="系列 / 主题" />
                </div>
                <div className={FIELD}>
                  <Label className={LABEL}>价格</Label>
                  <Input value={editing.price ?? ''} onChange={(e) => setEditing({ ...editing, price: e.target.value })} placeholder="如 ¥2,750" />
                </div>
                <div className={FIELD}>
                  <Label className={LABEL}>中文标题</Label>
                  <Input value={editing.title_zh ?? ''} onChange={(e) => setEditing({ ...editing, title_zh: e.target.value })} placeholder="中文标题" />
                </div>
                <div className={FIELD}>
                  <Label className={LABEL}>英文标题</Label>
                  <Input value={editing.title_en ?? ''} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} placeholder="English title" />
                </div>
              </div>
              <div className={FIELD}>
                <Label className={LABEL}>商品图 URL</Label>
                <Input value={editing.image ?? ''} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://...图片地址" />
              </div>
              <div className={FIELD}>
                <Label className={LABEL}>淘宝链接</Label>
                <Input value={editing.taobao_url ?? ''} onChange={(e) => setEditing({ ...editing, taobao_url: e.target.value })} placeholder="https://item.taobao.com/item.htm?id=..." />
                <p className="text-[11px] text-black/30">购买按钮将跳转到此链接（新标签打开）</p>
              </div>
              <div className={FIELD}>
                <Label className={LABEL}>描述</Label>
                <textarea value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className="w-full bg-black/50 border border-black/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none resize-none" placeholder="商品描述" />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={Boolean(editing.is_preorder)} onChange={(e) => setEditing({ ...editing, is_preorder: e.target.checked })} className="w-4 h-4 accent-[#ff3650]" />
                <span className="text-sm font-bold text-black/70">预售商品</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
              <Button onClick={save} disabled={busy}>{busy ? '保存中...' : '保存'}</Button>
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
