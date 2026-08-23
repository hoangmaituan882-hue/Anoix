import React, { useCallback, useEffect, useState } from 'react';
import { statsAdmin, StatsResponse } from '../../lib/poolAdmin';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { Vote, PencilLine, Users } from 'lucide-react';

const fmt = (iso: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '');

/** 统计面板：谁提名 / 谁投票。 */
export const StatsAdmin: React.FC = () => {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try { setData(await statsAdmin.get()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : '加载失败'); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const nomCount = data?.nominations.length ?? 0;
  const voteCount = data?.votes.length ?? 0;
  const voterCount = data ? new Set(data.votes.map((v) => v.voter)).size : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-[#ff3650]" /> 统计
        </h2>
        <button onClick={() => void reload()} className="text-xs font-bold text-white/50 hover:text-[#ff3650] transition-colors cursor-pointer">刷新</button>
      </div>

      {error && <p className="text-sm text-[#ffb3bd] bg-[#2a1518] border border-[#ff3650]/40 rounded-xl px-4 py-3">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-white/40 font-bold">提名总数</p>
          <p className="text-2xl font-black text-white"><AnimatedNumber value={nomCount} /></p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-white/40 font-bold">投票总数</p>
          <p className="text-2xl font-black text-white"><AnimatedNumber value={voteCount} /></p>
        </div>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-white/40 font-bold">投票人数</p>
          <p className="text-2xl font-black text-white"><AnimatedNumber value={voterCount} /></p>
        </div>
      </div>

      {data === null ? (
        <p className="text-white/40 text-sm py-6">加载中…</p>
      ) : (
        <Tabs defaultValue="nominations">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="nominations" className="flex-1 sm:flex-none">
              <PencilLine className="w-3.5 h-3.5 mr-1" /> 谁提名 ({nomCount})
            </TabsTrigger>
            <TabsTrigger value="votes" className="flex-1 sm:flex-none">
              <Vote className="w-3.5 h-3.5 mr-1" /> 谁投票 ({voteCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nominations" className="mt-4 space-y-2">
            {data.nominations.length === 0 ? (
              <p className="text-white/40 text-sm py-4">暂无提名记录。</p>
            ) : (
              data.nominations.map((n) => (
                <div key={n.id} className="flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5">
                  <PencilLine className="w-4 h-4 text-[#ff3650] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{n.title}</p>
                    {n.note && <p className="text-xs text-white/40 truncate">「{n.note}」</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary">{n.nominee}</Badge>
                    <p className="text-[10px] text-white/30 font-mono mt-1">{fmt(n.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="votes" className="mt-4 space-y-2">
            {data.votes.length === 0 ? (
              <p className="text-white/40 text-sm py-4">暂无投票记录。</p>
            ) : (
              data.votes.map((v, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5">
                  <Vote className="w-4 h-4 text-[#e0fe3d] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{v.film_title}</p>
                    <p className="text-xs text-white/40 truncate">{v.round_title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary">{v.voter}</Badge>
                    <p className="text-[10px] text-white/30 font-mono mt-1">{fmt(v.voted_at)}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
