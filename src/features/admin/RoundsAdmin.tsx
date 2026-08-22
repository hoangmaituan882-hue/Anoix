import React, { useCallback, useEffect, useState } from 'react';
import {
  adminFilms, adminRounds, adminScreenings,
  RoundRow, OptionRow, FilmRow,
} from '../../lib/pgAdmin';
import { ArchiveRestore, Plus, Trash2 } from 'lucide-react';

const FIELD = 'w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:border-[#ff3650] focus:outline-none';

const STATUS_LABEL: Record<RoundRow['status'], string> = {
  collecting: '收集中',
  voting: '投票中',
  revealed: '已公布',
};
const NEXT_STATUS: Partial<Record<RoundRow['status'], RoundRow['status']>> = {
  collecting: 'voting',
  voting: 'revealed',
};

export const RoundsAdmin: React.FC = () => {
  const [rounds, setRounds] = useState<RoundRow[] | null>(null);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [films, setFilms] = useState<FilmRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newRound, setNewRound] = useState({ id: '', title: '', deadline: '' });
  const [optionDraft, setOptionDraft] = useState<{ roundId: string; filmId: string; nominator: string } | null>(null);

  const reload = useCallback(async () => {
    setError('');
    try {
      const [r, o, f] = await Promise.all([adminRounds.list(), adminRounds.listOptions(), adminFilms.list()]);
      setRounds(r ?? []);
      setOptions(o ?? []);
      setFilms(f ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      setRounds([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const createRound = async () => {
    setBusy(true);
    setError('');
    try {
      if (!newRound.id.trim() || !newRound.title.trim()) throw new Error('ID 和标题必填');
      await adminRounds.create({
        id: newRound.id.trim(),
        title: newRound.title.trim(),
        status: 'collecting',
        deadline: newRound.deadline ? new Date(newRound.deadline).toISOString() : null,
      });
      setNewRound({ id: '', title: '', deadline: '' });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setBusy(false);
    }
  };

  const advanceStatus = async (round: RoundRow) => {
    const next = NEXT_STATUS[round.status];
    if (!next) return;
    const label = next === 'voting' ? '开启投票(访客可投票)' : '公布结果(结束投票)';
    if (!window.confirm(`确认${label}?`)) return;
    setBusy(true);
    try {
      await adminRounds.update(round.id, { status: next });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setBusy(false);
    }
  };

  const addOption = async () => {
    if (!optionDraft) return;
    setBusy(true);
    setError('');
    try {
      if (!optionDraft.filmId) throw new Error('请选择作品');
      await adminRounds.addOption({
        round_id: optionDraft.roundId,
        film_id: optionDraft.filmId,
        nominator: optionDraft.nominator || null,
      });
      setOptionDraft(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加失败');
    } finally {
      setBusy(false);
    }
  };

  /** Archive a revealed round: winner becomes the screening's film list. */
  const archiveRound = async (round: RoundRow) => {
    const roundOptions = options.filter((o) => o.round_id === round.id);
    if (roundOptions.length === 0) { setError('该轮次没有候选作品'); return; }
    // Live tally isn't visible here (admin list has no counts) — archive by order
    // is wrong; fetch public API for counts.
    const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
    const res = await fetch(`${base}/api/nominations`);
    type LiveRound = RoundRow & { options?: Array<{ id: number; film_id: string | null; votes_count: number }> };
    const all = res.ok ? (await res.json()) as LiveRound[] : [];
    const live = all.find((r) => r.id === round.id);
    const opts = live?.options ?? [];
    if (!opts.length) { setError('无法获取票数'); return; }
    const sorted = [...opts].sort((a, b) => b.votes_count - a.votes_count);
    const filmIds = sorted.map((o) => o.film_id).filter((x): x is string => Boolean(x));
    if (filmIds.length === 0) { setError('候选均未关联作品'); return; }
    if (!window.confirm(`将「${round.title}」沉淀为放映会档案?\n片单(按得票排序):${filmIds.join(', ')}`)) return;
    setBusy(true);
    try {
      await adminScreenings.create({
        id: `screening-${Date.now()}`,
        title: round.title,
        screen_date: new Date().toISOString().slice(0, 10),
        venue: null,
        theme: null,
        film_ids: filmIds,
        recap: null,
      });
      setError('');
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : '沉淀失败');
    } finally {
      setBusy(false);
    }
  };

  if (rounds === null) return <p className="text-white/50 font-bold">加载中...</p>;

  const filmTitle = (fid: string | null) => {
    const f = films.find((x) => x.id === fid);
    return f?.title_zh ?? f?.title ?? fid ?? '—';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-black">提名轮次 <span className="text-white/40 text-sm">({rounds.length})</span></h2>
      {error && <p className="text-sm font-bold text-[#ff3650] bg-[#ff3650]/10 border border-[#ff3650]/30 rounded-xl p-3">{error}</p>}

      {/* New round */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input value={newRound.id} onChange={(e) => setNewRound({ ...newRound, id: e.target.value })} className={`${FIELD} font-mono`} placeholder="轮次ID 如 round-2026-09 *" />
        <input value={newRound.title} onChange={(e) => setNewRound({ ...newRound, title: e.target.value })} className={FIELD} placeholder="标题 如 9月放映选片 *" />
        <input type="datetime-local" value={newRound.deadline} onChange={(e) => setNewRound({ ...newRound, deadline: e.target.value })} className={FIELD} />
        <button onClick={createRound} disabled={busy} className="inline-flex items-center justify-center gap-2 bg-[#ff3650] hover:bg-[#e02640] disabled:opacity-50 text-white font-black text-sm px-4 py-2 rounded-xl cursor-pointer">
          <Plus className="w-4 h-4" /> 创建轮次
        </button>
      </div>

      {rounds.map((r) => {
        const rOptions = options.filter((o) => o.round_id === r.id);
        return (
          <div key={r.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                r.status === 'voting' ? 'bg-[#ff3650] text-white' : r.status === 'revealed' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
              }`}>{STATUS_LABEL[r.status]}</span>
              <span className="font-black">{r.title}</span>
              <span className="text-xs text-white/40 font-mono">{r.id}{r.deadline ? ` · 截止 ${r.deadline.slice(0, 16).replace('T', ' ')}` : ''}</span>
              <span className="ml-auto flex gap-2">
                {NEXT_STATUS[r.status] && (
                  <button onClick={() => advanceStatus(r)} disabled={busy} className="text-xs font-black bg-[#f5ffe5] text-[#121212] hover:bg-[#ff3650] hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                    {r.status === 'collecting' ? '开启投票' : '公布结果'}
                  </button>
                )}
                {r.status === 'revealed' && (
                  <button onClick={() => archiveRound(r)} disabled={busy} className="inline-flex items-center gap-1 text-xs font-black bg-[#ff3650]/15 text-[#ff3650] hover:bg-[#ff3650] hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                    <ArchiveRestore className="w-3.5 h-3.5" /> 沉淀为放映会
                  </button>
                )}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {rOptions.map((o) => (
                <span key={o.id} className="inline-flex items-center gap-2 bg-white/10 rounded-full pl-3 pr-1.5 py-1 text-xs font-bold text-white/80">
                  {filmTitle(o.film_id)}
                  {o.nominator && <span className="text-white/40">({o.nominator})</span>}
                  <button onClick={() => adminRounds.removeOption(o.id).then(reload)} className="w-5 h-5 rounded-full hover:bg-[#ff3650] flex items-center justify-center transition-colors cursor-pointer" aria-label="remove option">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {r.status !== 'revealed' && (
                <button
                  onClick={() => setOptionDraft({ roundId: r.id, filmId: '', nominator: '' })}
                  className="text-xs font-bold text-[#ff3650] hover:text-white px-2 py-1 cursor-pointer"
                >+ 添加候选</button>
              )}
            </div>
          </div>
        );
      })}

      {optionDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={() => setOptionDraft(null)}>
          <div className="w-full max-w-md bg-[#1a1a1a] border border-white/15 rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-lg">添加候选作品</h3>
            <select value={optionDraft.filmId} onChange={(e) => setOptionDraft({ ...optionDraft, filmId: e.target.value })} className={FIELD}>
              <option value="" className="bg-[#1a1a1a]">选择作品...</option>
              {films.map((f) => <option key={f.id} value={f.id} className="bg-[#1a1a1a]">{f.title_zh ?? f.title}</option>)}
            </select>
            <input value={optionDraft.nominator} onChange={(e) => setOptionDraft({ ...optionDraft, nominator: e.target.value })} className={FIELD} placeholder="提名人(可留空)" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setOptionDraft(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white/60 hover:text-white border border-white/15 cursor-pointer">取消</button>
              <button onClick={addOption} disabled={busy} className="bg-[#ff3650] hover:bg-[#e02640] disabled:opacity-50 text-white font-black text-sm px-5 py-2.5 rounded-xl cursor-pointer">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
