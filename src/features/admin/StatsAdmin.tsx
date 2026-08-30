import React, { useCallback, useEffect, useState } from 'react';
import { statsAdmin, StatsFilm, StatsResponse } from '../../lib/poolAdmin';
import { Badge } from '../../components/ui/badge';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { Users, Ghost, UserCheck } from 'lucide-react';

/** 后台统计大屏：每部提名片的匿名 / 登录提名与周票。数字不出现在前台。 */
export const StatsAdmin: React.FC = () => {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try { setData(await statsAdmin.get()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : '加载失败'); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const t = data?.totals;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-[#ff3650]" /> 统计
        </h2>
        <button onClick={() => void reload()} className="text-xs font-bold text-black/50 hover:text-[#ff3650] transition-colors cursor-pointer">刷新</button>
      </div>

      {error && <p className="text-sm text-[#ffb3bd] bg-[#2a1518] border border-[#ff3650]/40 rounded-xl px-4 py-3">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="提名片目" value={t?.films ?? 0} />
        <StatCard label="匿名提名" value={t?.anonymousNominations ?? 0} />
        <StatCard label="登录提名" value={t?.memberNominations ?? 0} />
        <StatCard label="匿名票" value={t?.anonymousVotes ?? 0} />
        <StatCard label="登录票" value={t?.memberVotes ?? 0} />
      </div>

      {data === null ? (
        <p className="text-black/40 text-sm py-6">加载中…</p>
      ) : data.films.length === 0 ? (
        <p className="text-black/40 text-sm py-4">暂无提名记录。</p>
      ) : (
        <ul className="space-y-3">
          {data.films.map((film) => (
            <li key={film.filmId}>
              <FilmStatCard film={film} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-black/10 rounded-2xl p-4">
      <p className="text-xs text-black/40 font-bold">{label}</p>
      <p className="text-2xl font-black text-white"><AnimatedNumber value={value} /></p>
    </div>
  );
}

function FilmStatCard({ film }: { film: StatsFilm }) {
  return (
    <div className="bg-white border border-black/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        {film.image ? (
          <img src={film.image} alt="" className="w-12 h-[72px] object-cover rounded-lg shrink-0 bg-black" />
        ) : (
          <div className="w-12 h-[72px] rounded-lg shrink-0 bg-white/5" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white truncate">{film.title}</p>
          {film.year && <p className="text-xs text-black/40 font-mono mt-0.5">{film.year}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="secondary" className="gap-1">
              <Ghost className="w-3 h-3" /> 匿名提名 {film.anonymousNominations}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Ghost className="w-3 h-3" /> 匿名票 {film.anonymousVotes}
            </Badge>
          </div>
        </div>
      </div>

      {film.members.length === 0 ? (
        <p className="text-xs text-black/30">尚无登录用户提名或投票。</p>
      ) : (
        <ul className="space-y-1.5">
          {film.members.map((m) => (
            <li
              key={m.uid}
              className="flex items-center gap-2 bg-black/30 border border-black/5 rounded-xl px-3 py-2"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#e0fe3d] shrink-0" />
              <span className="text-sm font-bold text-white truncate min-w-0 flex-1">{m.name}</span>
              <span className="text-xs text-black/50 shrink-0">提名 {m.nominations}</span>
              <span className="text-xs text-black/50 shrink-0">票 {m.votes}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
