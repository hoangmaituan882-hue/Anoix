import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { adminFilms, adminScreenings, ScreeningRow, FilmRow } from '../../lib/pgAdmin';
import {
  shanghaiDateString,
  screeningRoundStatus,
  screeningAutoTitle,
  displayScreeningTitle,
} from '../../lib/scheduleOps';
import { ScheduleBoard } from './ScheduleBoard';
import { Plus, Save, Trash2, X, Calendar, MapPin, Film, Search, Edit3, AlertCircle, Video } from 'lucide-react';
import { Loader } from '../../components/motion/loader';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const ROUND_BADGE: Record<string, { label: string; cls: string }> = {
  screened: { label: '已放映', cls: 'bg-white/10 text-white/70 border-white/15' },
  tonight: { label: '本场', cls: 'bg-[#ff3650]/20 text-[#ff3650] border-[#ff3650]/40' },
  upcoming: { label: '未放映', cls: 'bg-[#e0fe3d]/15 text-[#e0fe3d] border-[#e0fe3d]/40' },
  unscheduled: { label: '未排期', cls: 'bg-white/10 text-white/40 border-white/10' },
};

const FIELD = 'w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none transition-all placeholder:text-white/30';
const LABEL = 'text-xs font-black text-white/60 uppercase tracking-wider block mb-1';

const EMPTY: ScreeningRow = { id: '', title: '', screen_date: '', venue: null, theme: null, film_ids: [], recap: null };

export const ScreeningsAdmin: React.FC = () => {
  const [rows, setRows] = useState<ScreeningRow[] | null>(null);
  const [films, setFilms] = useState<FilmRow[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ScreeningRow | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);
  const [search, setSearch] = useState('');
  const today = shanghaiDateString();
  const [confirm, setConfirm] = useState<{ title: string; desc?: string; action: () => void } | null>(null);

  const reload = useCallback(async () => {
    setError('');
    try {
      const [s, f] = await Promise.all([adminScreenings.list(), adminFilms.list()]);
      setRows(s ?? []);
      setFilms(f ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载放映会数据失败');
      setRows([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const remove = (id: string, title: string) => {
    setConfirm({
      title: `确认删除「${title}」?`,
      desc: '此操作不可恢复。',
      action: async () => {
        try {
          await adminScreenings.remove(id);
          await reload();
        } catch (e) {
          setError(e instanceof Error ? e.message : '删除失败');
        }
      },
    });
  };

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const label = displayScreeningTitle(r).toLowerCase();
      return (
        label.includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.venue && r.venue.toLowerCase().includes(q)) ||
        (r.theme && r.theme.toLowerCase().includes(q)) ||
        r.screen_date.includes(q)
      );
    });
  }, [rows, search]);

  if (rows === null) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader variant="comet" size={32} label="加载放映会档案..." className="text-[#ff3650]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              SCREENING ARCHIVES
            </span>
            <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
              {rows.length} 场放映
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">放映档案</h2>
          <p className="text-xs text-white/50">每一场放映即一轮。状态按日期自动标记，不必另起轮次名称。</p>
        </div>

        <button
          onClick={() => {
            setEditingIsNew(true);
            setEditing({ ...EMPTY });
          }}
          className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] active:scale-95 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all cursor-pointer shadow-[0_8px_20px_rgba(255,54,80,0.3)]"
        >
          <Plus className="w-4 h-4" />
          <span>创建放映档案 (NEW EVENT)</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/40 flex items-center gap-3 text-sm font-bold text-[#ff3650]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ScheduleBoard films={films} screenings={rows} onSaved={() => void reload()} />

      {/* Search Filter */}
      <div className="flex items-center justify-between gap-3 bg-[#181818] p-3 rounded-2xl border border-white/10">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索放映标题、场地或主题..."
            className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-[#ff3650] focus:outline-none"
          />
        </div>
      </div>

      {/* Screenings Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRows.length === 0 ? (
          <div className="col-span-2 bg-[#1a1a1a] border border-white/10 rounded-3xl p-16 text-center space-y-2">
            <Video className="w-12 h-12 text-white/20 mx-auto" />
            <p className="text-sm font-bold text-white/60">暂无符合条件的放映会记录</p>
          </div>
        ) : (
          filteredRows.map((r) => {
            const selectedFilms = films.filter((f) => (r.film_ids ?? []).includes(f.id));
            const label = displayScreeningTitle(r);
            const round = ROUND_BADGE[screeningRoundStatus(r.screen_date, today)] ?? ROUND_BADGE.unscheduled;
            return (
              <div
                key={r.id}
                className="bg-[#1a1a1a] border border-white/10 hover:border-[#ff3650]/60 rounded-3xl p-6 space-y-4 transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border font-mono ${round.cls}`}>
                          {round.label}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#ff3650]/20 text-[#ff3650] border border-[#ff3650]/40 font-mono">
                          {r.screen_date || 'DATE TBD'}
                        </span>
                        {r.theme && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#e0fe3d]/20 text-[#e0fe3d] border border-[#e0fe3d]/40">
                            {r.theme}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-white">{label}</h3>
                    </div>

                    <span className="text-[10px] font-mono text-white/30 truncate max-w-[80px]">
                      {r.id}
                    </span>
                  </div>

                  {r.venue && (
                    <div className="flex items-center gap-1.5 text-xs text-white/60">
                      <MapPin className="w-3.5 h-3.5 text-[#ff3650]" />
                      <span>{r.venue}</span>
                    </div>
                  )}

                  {/* Films list */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-wider block">
                      放映片单 ({selectedFilms.length} 部):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedFilms.length === 0 ? (
                        <span className="text-xs text-white/30 italic">未添加放映片目</span>
                      ) : (
                        selectedFilms.map((f) => (
                          <span
                            key={f.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/80"
                          >
                            <Film className="w-3 h-3 text-[#ff3650]" />
                            {f.title_zh ?? f.title}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {r.recap && (
                    <p className="text-xs text-white/50 bg-black/30 p-3 rounded-xl border border-white/5 line-clamp-2">
                      {r.recap}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingIsNew(false);
                      const auto = screeningAutoTitle(r.screen_date);
                      const shown = displayScreeningTitle(r);
                      setEditing({ ...r, title: shown === auto ? '' : shown });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#ff3650] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#e0fe3d]" />
                    <span>编辑档案</span>
                  </button>
                  <button
                    onClick={() => remove(r.id, label)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-[#ff3650] text-white/40 hover:text-white transition-colors cursor-pointer"
                    title="删除此放映会"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editing Modal */}
      {editing && (
        <ScreeningForm
          initial={editing}
          isNew={editingIsNew}
          films={films}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void reload(); }}
        />
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
      const date = (form.screen_date || '').slice(0, 10);
      if (!date) throw new Error('放映日期为必填');
      const title = displayScreeningTitle({ title: form.title, screen_date: date }) || screeningAutoTitle(date);
      const id = (form.id.trim() || `screening-${date}`);
      const row = { ...form, id, title, screen_date: date };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#181818] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/30 flex items-center justify-center text-[#ff3650]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-widest block">
                SCREENING RECORD
              </span>
              <h3 className="text-xl font-black text-white">
                {isNew ? '创建放映' : `编辑: ${displayScreeningTitle(form)}`}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={LABEL}>放映日期 *</label>
            <input
              type="date"
              value={form.screen_date?.slice(0, 10) ?? ''}
              onChange={(e) => {
                const date = e.target.value;
                setForm((f) => ({
                  ...f,
                  screen_date: date,
                  ...(isNew ? { id: date ? `screening-${date}` : '' } : {}),
                }));
              }}
              className={FIELD}
            />
            {form.screen_date && (
              <p className="text-[10px] font-mono text-white/40 pt-1">
                自动标记：{ROUND_BADGE[screeningRoundStatus(form.screen_date, shanghaiDateString())]?.label}
                {' · '}
                {displayScreeningTitle({ title: form.title, screen_date: form.screen_date }) || screeningAutoTitle(form.screen_date)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className={LABEL}>备注名（可选）</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={FIELD}
              placeholder="空白则按日期自动标记，如 2026年8月23日放映"
            />
          </div>

          {!isNew && (
            <div className="space-y-1">
              <label className={LABEL}>档案 ID</label>
              <input
                value={form.id}
                disabled
                className={`${FIELD} disabled:opacity-40 font-mono`}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className={LABEL}>场地与地址 (Venue)</label>
            <input
              value={form.venue ?? ''}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className={FIELD}
              placeholder="如 上海梅赛德斯展映厅 / 线上Bilibili"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className={LABEL}>展映主题 (Theme / Special Focus)</label>
            <input
              value={form.theme ?? ''}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              className={FIELD}
              placeholder="如 《天元突破》与《普罗米亚》今石洋之狂热之夜"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className={LABEL}>选入放映片单 (点选以添加/移除)</label>
              <span className="text-xs font-mono text-[#ff3650] font-bold">已选 {form.film_ids?.length ?? 0} 部</span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto bg-black/40 border border-white/10 rounded-2xl p-3">
              {films.map((f) => {
                const on = (form.film_ids ?? []).includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFilm(f.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${
                      on
                        ? 'bg-[#ff3650] text-white border-[#ff3650] shadow-md'
                        : 'bg-white/5 text-white/60 hover:text-white border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Film className="w-3 h-3" />
                    <span>{f.title_zh ?? f.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className={LABEL}>活动现场回顾与备忘 (Recap)</label>
            <textarea
              value={form.recap ?? ''}
              onChange={(e) => setForm({ ...form, recap: e.target.value })}
              rows={3}
              className={FIELD}
              placeholder="输入现场观众反响、导演寄语或回顾纪要..."
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#ff3650]/15 border border-[#ff3650]/40 text-xs font-bold text-[#ff3650]">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white/60 hover:text-white border border-white/15 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-50 text-white font-black text-xs uppercase px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#ff3650]/20"
          >
            <Save className="w-4 h-4" />
            <span>{busy ? '保存中...' : '保存放映会记录'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
