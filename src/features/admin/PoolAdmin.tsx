import React, { useCallback, useEffect, useState } from 'react';
import { poolAdmin, PoolItem } from '../../lib/poolAdmin';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { ArrowRight, CalendarDays, Check, Undo2, Clock, Film } from 'lucide-react';

const nextSaturday = (): string => {
  const d = new Date();
  const day = d.getDay();
  const diff = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'bg-white/10 text-white/70' },
  promoted: { label: '已入库', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' },
  rejected: { label: '已剔除', cls: 'bg-[#ff3650]/15 text-[#ffb3bd]' },
};

/** 提名库管理：勾选入库(可逆) + 排期(待定/下周六/选日期)。 */
export const PoolAdmin: React.FC = () => {
  const [items, setItems] = useState<PoolItem[] | null>(null);
  const [error, setError] = useState('');
  const { success, error: toastError } = useToast();

  const reload = useCallback(async () => {
    try {
      setItems(await poolAdmin.list());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const promote = async (id: number) => {
    try { await poolAdmin.promote(id); success('已勾选入库'); void reload(); }
    catch (e) { toastError(e instanceof Error ? e.message : '入库失败'); }
  };
  const demote = async (id: number) => {
    try { await poolAdmin.demote(id); success('已退回提名库'); void reload(); }
    catch (e) { toastError(e instanceof Error ? e.message : '退回失败'); }
  };
  const schedule = async (filmId: string, status: string, date: string | null) => {
    try { await poolAdmin.schedule(filmId, status, date); success('排期已更新'); void reload(); }
    catch (e) { toastError(e instanceof Error ? e.message : '排期失败'); }
  };

  const pending = (items ?? []).filter((p) => p.status === 'pending');
  const promoted = (items ?? []).filter((p) => p.status === 'promoted');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <Film className="w-5 h-5 text-[#ff3650]" /> 提名库
        </h2>
        <button onClick={() => void reload()} className="text-xs font-bold text-white/50 hover:text-[#ff3650] transition-colors cursor-pointer">刷新</button>
      </div>

      {error && <p className="text-sm text-[#ffb3bd] bg-[#2a1518] border border-[#ff3650]/40 rounded-xl px-4 py-3">{error}</p>}

      {items === null ? (
        <p className="text-white/40 text-sm py-6">加载中…</p>
      ) : items.length === 0 ? (
        <p className="text-white/40 text-sm py-6">提名库暂无内容。</p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const st = STATUS[p.status] ?? STATUS.pending;
            return (
              <div key={p.id} className={`rounded-2xl border p-3 flex flex-col sm:flex-row gap-3 ${p.status === 'promoted' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-[#1a1a1a]'}`}>
                {p.image ? (
                  <img src={p.image} alt="" className="w-12 h-16 rounded-md object-cover shrink-0 bg-black/40" />
                ) : (
                  <div className="w-12 h-16 rounded-md bg-white/5 shrink-0 flex items-center justify-center text-white/20"><Film className="w-5 h-5" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-white truncate">{p.title}</p>
                    <Badge variant="secondary" className={st.cls}>{st.label}</Badge>
                    {p.source === 'tmdb' && <Badge variant="outline">TMDB</Badge>}
                  </div>
                  {p.note && <p className="text-xs text-white/40 mt-0.5 line-clamp-1">「{p.note}」</p>}
                  <p className="text-[11px] text-white/30 mt-0.5">{p.year || ''}{p.film_id ? ` · 已关联 ${p.film_id}` : p.tmdb_id ? ` · ${p.tmdb_id}` : ''}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {p.status === 'pending' ? (
                    <Button size="sm" onClick={() => promote(p.id)}>
                      <Check className="w-3.5 h-3.5" /> 勾选入库
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => demote(p.id)}>
                        <Undo2 className="w-3.5 h-3.5" /> 退回
                      </Button>
                      {p.film_id && (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => schedule(p.film_id!, 'unscheduled', null)} title="待定放映">
                            <Clock className="w-3.5 h-3.5" /> 待定
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => schedule(p.film_id!, 'scheduled', nextSaturday())} title="下周六放映">
                            下周六
                          </Button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="outline" title="选择日期">
                                <CalendarDays className="w-3.5 h-3.5" /> 选日期
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#1d1d1f] border-white/10">
                              <Calendar
                                mode="single"
                                onSelect={(d) => { if (d) schedule(p.film_id!, 'scheduled', d.toISOString().slice(0, 10)); }}
                                className="text-white"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pending.length > 0 && promoted.length > 0 && (
        <p className="text-xs text-white/30 flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5" /> 勾选入库后，影片进入影视库，可在此排期或从影视库管理。
        </p>
      )}
    </div>
  );
};
