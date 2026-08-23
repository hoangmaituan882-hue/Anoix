import React, { useCallback, useEffect, useState } from 'react';
import {
  adminFilms, adminRounds, adminScreenings,
  RoundRow, OptionRow, FilmRow,
} from '../../lib/pgAdmin';
import { ArchiveRestore, Plus, Trash2, Vote, Sparkles, CheckCircle2, Clock, PlayCircle, AlertCircle, Film, User, Layers, Search } from 'lucide-react';
import { Loader } from '../../components/motion/loader';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/motion/select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

const FIELD = 'w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none transition-all placeholder:text-white/30';
const LABEL = 'text-xs font-black text-white/60 uppercase tracking-wider block mb-1';

const STATUS_CONFIG: Record<RoundRow['status'], { label: string; bg: string; color: string; border: string; icon: React.FC<{ className?: string }> }> = {
  collecting: {
    label: '提名收集中 (COLLECTING)',
    bg: 'bg-amber-500/20',
    color: 'text-amber-300',
    border: 'border-amber-500/40',
    icon: Clock,
  },
  voting: {
    label: '正在投票中 (LIVE VOTING)',
    bg: 'bg-[#ff3650]/20',
    color: 'text-[#ff3650]',
    border: 'border-[#ff3650]/40',
    icon: PlayCircle,
  },
  revealed: {
    label: '结果已公布 (REVEALED)',
    bg: 'bg-emerald-500/20',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    icon: CheckCircle2,
  },
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
  const [filmSearch, setFilmSearch] = useState('');
  const [confirm, setConfirm] = useState<{ title: string; desc?: string; action: () => void } | null>(null);
  const { success: toastSuccess } = useToast();

  const reload = useCallback(async () => {
    setError('');
    try {
      const [r, o, f] = await Promise.all([adminRounds.list(), adminRounds.listOptions(), adminFilms.list()]);
      setRounds(r ?? []);
      setOptions(o ?? []);
      setFilms(f ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载选片轮次失败');
      setRounds([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const createRound = async () => {
    setBusy(true);
    setError('');
    try {
      if (!newRound.id.trim() || !newRound.title.trim()) throw new Error('ID 和标题为必填项');
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

  const advanceStatus = (round: RoundRow) => {
    const next = NEXT_STATUS[round.status];
    if (!next) return;
    const label = next === 'voting' ? '开启全网投票(访客将可进行投票)' : '正式公布结果(锁定投票并揭晓头名)';
    setConfirm({
      title: `确认${label}?`,
      action: async () => {
        setBusy(true);
        try {
          await adminRounds.update(round.id, { status: next });
          await reload();
          toastSuccess(next === 'voting' ? '投票已开启' : '结果已公布');
        } catch (e) {
          setError(e instanceof Error ? e.message : '状态流转失败');
        } finally {
          setBusy(false);
        }
      },
    });
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
      setError(e instanceof Error ? e.message : '添加候选作品失败');
    } finally {
      setBusy(false);
    }
  };

  /** Archive a revealed round: winner becomes the screening's film list. */
  const archiveRound = async (round: RoundRow) => {
    const roundOptions = options.filter((o) => o.round_id === round.id);
    if (roundOptions.length === 0) { setError('该轮次没有候选作品'); return; }
    
    const base = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';
    let filmIds: string[] = [];

    try {
      const res = await fetch(`${base}/api/nominations`);
      type LiveRound = RoundRow & { options?: Array<{ id: number; film_id: string | null; votes_count: number }> };
      const all = res.ok ? (await res.json()) as LiveRound[] : [];
      const live = all.find((r) => r.id === round.id);
      const opts = live?.options ?? [];
      if (opts.length > 0) {
        const sorted = [...opts].sort((a, b) => b.votes_count - a.votes_count);
        filmIds = sorted.map((o) => o.film_id).filter((x): x is string => Boolean(x));
      }
    } catch {
      // fallback to round options order
      filmIds = roundOptions.map((o) => o.film_id).filter((x): x is string => Boolean(x));
    }

    if (filmIds.length === 0) {
      filmIds = roundOptions.map((o) => o.film_id).filter((x): x is string => Boolean(x));
    }

    setConfirm({
      title: `确认将「${round.title}」沉淀为放映会档案?`,
      desc: `片单:${filmIds.join(', ')}`,
      action: async () => {
        setBusy(true);
        try {
          await adminScreenings.create({
            id: `screening-${Date.now()}`,
            title: round.title,
            screen_date: new Date().toISOString().slice(0, 10),
            venue: '待定场地',
            theme: '选片优胜展映',
            film_ids: filmIds,
            recap: '根据社区选片轮次投票优胜结果特别展映。',
          });
          setError('');
          await reload();
          toastSuccess('已成功沉淀为放映会档案！可在「放映会档案」面板查看。');
        } catch (e) {
          setError(e instanceof Error ? e.message : '沉淀失败');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  if (rounds === null) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader variant="comet" size={32} label="加载提名选片数据..." className="text-[#ff3650]" />
      </div>
    );
  }

  const getFilm = (fid: string | null) => films.find((x) => x.id === fid);

  const filmQ = filmSearch.trim().toLowerCase();
  const filteredFilms = filmQ
    ? films.filter((f) =>
        [f.title, f.title_zh, f.title_en, f.year, f.id].some((v) => v && String(v).toLowerCase().includes(filmQ))
      )
    : films;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest flex items-center gap-1">
              <Vote className="w-3.5 h-3.5" />
              NOMINATION & VOTING
            </span>
            <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
              {rounds.length} 个轮次
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">TRIGGER 社区选片与投票轮次</h2>
          <p className="text-xs text-white/50">发起粉丝选片投票、审核候选作品、流转投票状态与一键归档</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/40 flex items-center gap-3 text-sm font-bold text-[#ff3650]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create New Round Form Card */}
      <div className="bg-[#181818] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#ff3650]" />
          发起新一轮选片活动 (CREATE ROUND)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className={LABEL}>轮次唯一 ID *</label>
            <input
              value={newRound.id}
              onChange={(e) => setNewRound({ ...newRound, id: e.target.value })}
              className={`${FIELD} font-mono`}
              placeholder="如 round-2026-autumn"
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>轮次标题 *</label>
            <input
              value={newRound.title}
              onChange={(e) => setNewRound({ ...newRound, title: e.target.value })}
              className={FIELD}
              placeholder="如 2026 秋季周年庆展映选片"
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>截止日期时间 (Deadline)</label>
            <input
              type="datetime-local"
              value={newRound.deadline}
              onChange={(e) => setNewRound({ ...newRound, deadline: e.target.value })}
              className={FIELD}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={createRound}
            disabled={busy || !newRound.id.trim() || !newRound.title.trim()}
            className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-40 text-white font-black text-xs uppercase px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#ff3650]/20"
          >
            <Plus className="w-4 h-4" />
            <span>确认发起轮次</span>
          </button>
        </div>
      </div>

      {/* Rounds List */}
      <div className="space-y-4">
        {rounds.map((r) => {
          const rOptions = options.filter((o) => o.round_id === r.id);
          const statusMeta = STATUS_CONFIG[r.status] || STATUS_CONFIG.collecting;
          const StatusIcon = statusMeta.icon;

          return (
            <div
              key={r.id}
              className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 rounded-3xl p-6 space-y-5 transition-all shadow-xl"
            >
              {/* Round Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusMeta.label}</span>
                    </span>
                    <span className="text-xs font-mono text-white/40">
                      ID: {r.id}
                    </span>
                    {r.deadline && (
                      <span className="text-xs font-mono text-white/50 bg-black/40 px-2.5 py-0.5 rounded-md border border-white/5">
                        截止: {r.deadline.slice(0, 16).replace('T', ' ')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-white pt-1">{r.title}</h3>
                </div>

                {/* Workflow Stepper Action Buttons */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  {NEXT_STATUS[r.status] && (
                    <button
                      onClick={() => advanceStatus(r)}
                      disabled={busy}
                      className="text-xs font-black bg-[#e0fe3d] text-[#121212] hover:bg-white px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#121212]" />
                      <span>{r.status === 'collecting' ? '开启全网投票 →' : '公布最终结果 🏁'}</span>
                    </button>
                  )}
                  {r.status === 'revealed' && (
                    <button
                      onClick={() => archiveRound(r)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 text-xs font-black bg-[#ff3650] hover:bg-[#ff203c] text-white px-4 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#ff3650]/20"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>沉淀为放映会档案</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Nominees Grid */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white/50 uppercase tracking-wider">
                    候选作品清单 ({rOptions.length} 部候选)
                  </span>
                  {r.status !== 'revealed' && (
                    <button
                      onClick={() => { setFilmSearch(''); setOptionDraft({ roundId: r.id, filmId: '', nominator: '' }); }}
                      className="text-xs font-black text-[#ff3650] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>添加官方候选作品</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {rOptions.length === 0 ? (
                    <div className="col-span-full py-6 text-center text-xs text-white/40 italic bg-black/20 rounded-2xl border border-white/5">
                      本轮次暂无候选作品，点击上方添加
                    </div>
                  ) : (
                    rOptions.map((o) => {
                      const film = getFilm(o.film_id);
                      return (
                        <div
                          key={o.id}
                          className="bg-black/40 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {film?.image ? (
                              <img
                                src={film.image}
                                alt=""
                                className="w-10 h-12 rounded-lg object-cover border border-white/10 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                <Film className="w-4 h-4 text-white/40" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {film?.title_zh ?? film?.title ?? o.film_id}
                              </p>
                              {o.nominator && (
                                <p className="text-[10px] text-white/40 flex items-center gap-1 truncate mt-0.5">
                                  <User className="w-2.5 h-2.5 text-[#e0fe3d]" />
                                  <span>提名者: {o.nominator}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => adminRounds.removeOption(o.id).then(reload)}
                            className="p-1.5 rounded-lg text-white/30 hover:text-[#ff3650] hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
                            title="移除此候选"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Option Modal */}
      {optionDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in"
          onClick={() => setOptionDraft(null)}
        >
          <div
            className="w-full max-w-md bg-[#181818] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ff3650]" />
                添加候选作品
              </h3>
              <span className="text-xs font-mono text-white/40">{optionDraft.roundId}</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className={LABEL}>选择动画作品 *</label>
                <Select value={optionDraft.filmId} onValueChange={(v) => setOptionDraft({ ...optionDraft, filmId: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择一部作品..." />
                  </SelectTrigger>
                  <SelectContent maxHeight={288}>
                    <div className="sticky top-0 z-10 px-1.5 pb-1.5 pt-0.5 bg-background" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={filmSearch}
                          onChange={(e) => setFilmSearch(e.target.value)}
                          placeholder="搜索作品..."
                          className="w-full bg-muted border border-border rounded-lg pl-8 pr-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#ff3650] focus:outline-none"
                        />
                      </div>
                    </div>
                    {filteredFilms.length === 0 ? (
                      <p className="px-2.5 py-4 text-center text-xs font-bold text-muted-foreground">没有匹配的作品</p>
                    ) : (
                      filteredFilms.map((f) => (
                        <SelectItem key={f.id} value={f.id} label={f.title_zh ?? f.title}>
                          <span className="flex items-center gap-2.5 min-w-0">
                            {f.image ? (
                              <img
                                src={f.image}
                                alt={f.title_zh ?? f.title}
                                className="w-9 h-[54px] rounded-md object-cover shrink-0 bg-black/40 border border-white/10"
                                loading="lazy"
                              />
                            ) : (
                              <span className="w-9 h-[54px] rounded-md bg-white/10 border border-white/10 shrink-0 flex items-center justify-center">
                                <Film className="w-4 h-4 text-white/30" />
                              </span>
                            )}
                            <span className="min-w-0 flex flex-col">
                              <span className="font-bold text-sm text-foreground truncate">{f.title_zh ?? f.title}</span>
                              <span className="text-xs text-muted-foreground">{f.year}</span>
                            </span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className={LABEL}>提名人 / 推荐理由 (Nominator)</label>
                <input
                  value={optionDraft.nominator}
                  onChange={(e) => setOptionDraft({ ...optionDraft, nominator: e.target.value })}
                  className={FIELD}
                  placeholder="如 官方推荐 / @今石狂粉"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setOptionDraft(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white/60 hover:text-white border border-white/15 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={addOption}
                disabled={busy || !optionDraft.filmId}
                className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-40 text-white font-black text-xs uppercase px-5 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-[#ff3650]/20"
              >
                <Plus className="w-4 h-4" />
                <span>确认添加</span>
              </button>
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
