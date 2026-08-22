import React, { useCallback, useEffect, useState } from 'react';
import { adminFilms, adminScreenings, ScreeningRow, FilmRow } from '../../lib/pgAdmin';
import { Plus, Save, Trash2, X } from 'lucide-react';

const FIELD = 'w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:border-[#ff3650] focus:outline-none';
const LABEL = 'text-xs font-bold text-white/50 uppercase tracking-wider';

const EMPTY: ScreeningRow = { id: '', title: '', screen_date: '', venue: null, theme: null, film_ids: [], recap: null };

export const ScreeningsAdmin: React.FC = () => {
  const [rows, setRows] = useState<ScreeningRow[] | null>(null);
  const [films, setFilms] = useState<FilmRow[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ScreeningRow | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setError('');
    try {
      const [s, f] = await Promise.all([adminScreenings.list(), adminFilms.list()]);
      setRows(s ?? []);
      setFilms(f ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      setRows([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`确认删除放映会「${title}」?`)) return;
    try {
      await adminScreenings.remove(id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  if (rows === null) return <p className="text-white/50 font-bold">加载中...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">放映会档案 <span className="text-white/40 text-sm">({rows.length})</span></h2>
        <button onClick={() => setEditing({ ...EMPTY })} className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#e02640] text-white font-black text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> 新增放映会
        </button>
      </div>

      {error && <p className="text-sm font-bold text-[#ff3650] bg-[#ff3650]/10 border border-[#ff3650]/30 rounded-xl p-3">{error}</p>}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl divide-y divide-white/5">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-white/40 font-bold">暂无放映会记录</p>
        ) : rows.map((r) => (
          <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-bold truncate">{r.title}</p>
              <p className="text-xs text-white/40 font-mono">{r.screen_date} · {r.venue ?? '—'} · {r.film_ids?.length ?? 0} 部</p>
            </div>
            <div className="space-x-2 shrink-0">
              <button onClick={() => setEditing(r)} className="text-xs font-bold text-white/70 hover:text-[#ff3650] transition-colors cursor-pointer">编辑</button>
              <button onClick={() => remove(r.id, r.title)} className="text-xs font-bold text-white/40 hover:text-[#ff3650] transition-colors cursor-pointer">删除</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ScreeningForm
          initial={editing} isNew={!editing.id} films={films}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void reload(); }}
        />
      )}
      {busy && null}
    </div>
  );
};

const ScreeningForm: React.FC<{
  initial: ScreeningRow;
  isNew: boolean;
  films: FilmRow[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, isNew, films, onClose, onSaved }) => {
  const [form, setForm] = useState<ScreeningRow>(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleFilm = (fid: string) => {
    setForm((f) => {
      const cur = f.film_ids ?? [];
      return { ...f, film_ids: cur.includes(fid) ? cur.filter((x) => x !== fid) : [...cur, fid] };
    });
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (!form.id.trim() || !form.title.trim() || !form.screen_date) throw new Error('ID、标题、日期为必填');
      const row = { ...form, id: form.id.trim() };
      if (isNew) await adminScreenings.create(row);
      else {
        const { id: _drop, ...patch } = row;
        await adminScreenings.update(form.id, patch);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-[#1a1a1a] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black">{isNew ? '新增放映会' : `编辑:${form.title}`}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/60 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={LABEL}>ID(slug) *</label>
            <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!isNew} className={`${FIELD} disabled:opacity-40 font-mono`} />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>标题 *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={FIELD} placeholder="第 1 回放映会" />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>日期 *</label>
            <input type="date" value={form.screen_date?.slice(0, 10) ?? ''} onChange={(e) => setForm({ ...form, screen_date: e.target.value })} className={FIELD} />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>场地</label>
            <input value={form.venue ?? ''} onChange={(e) => setForm({ ...form, venue: e.target.value })} className={FIELD} placeholder="活动室 A101" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className={LABEL}>主题</label>
            <input value={form.theme ?? ''} onChange={(e) => setForm({ ...form, theme: e.target.value })} className={FIELD} placeholder="今石洋之专场" />
          </div>
          <div className="col-span-2 space-y-1">
            <label className={LABEL}>片单(点选作品)</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto bg-black/30 rounded-xl p-3">
              {films.map((f) => {
                const on = (form.film_ids ?? []).includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFilm(f.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${on ? 'bg-[#ff3650] text-white' : 'bg-white/10 text-white/60 hover:text-white'}`}
                  >
                    {f.title_zh ?? f.title}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="col-span-2 space-y-1">
            <label className={LABEL}>回顾</label>
            <textarea value={form.recap ?? ''} onChange={(e) => setForm({ ...form, recap: e.target.value })} rows={3} className={FIELD} placeholder="现场回顾文字..." />
          </div>
        </div>

        {error && <p className="text-sm font-bold text-[#ff3650]">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white/60 hover:text-white border border-white/15 cursor-pointer">取消</button>
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#e02640] disabled:opacity-50 text-white font-black text-sm px-6 py-2.5 rounded-xl cursor-pointer">
            <Save className="w-4 h-4" /> {busy ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
