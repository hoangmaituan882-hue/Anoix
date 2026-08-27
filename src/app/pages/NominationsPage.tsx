import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Masonry } from 'masonic';
import { Language } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { NominationRound } from '../../types/screening';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Loader } from '../../components/motion/loader';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { useToast } from '../../components/ui/Toast';
import { getSession, getAccessToken, SessionUser } from '../../lib/session';
import { nominations, Quota, PlazaItem } from '../../lib/nominations';
import { NominateDialog } from '../../features/nominations/NominateDialog';
import { CoverFlowCarousel, CoverFlowItem } from '../../features/nominations/CoverFlowCarousel';
import { FilmContextMenu } from '../../features/nominations/FilmContextMenu';
import { PageHero } from '../../components/layout/PageHero';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  ArrowLeft, Crown, Hourglass, PencilLine, Vote, Plus,
  Flame, Trophy, LayoutGrid, ListOrdered, Radio, Check, Undo2, Sparkles,
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const RANK_STYLES = [
  { ring: 'border-[#ff3650]/60 bg-[#ff3650]/10', chip: 'bg-[#ff3650] text-white shadow-[0_0_16px_rgba(255,54,80,0.5)]', bar: 'bg-[#ff3650]' },
  { ring: 'border-[#e0fe3d]/50 bg-[#e0fe3d]/5', chip: 'bg-[#e0fe3d] text-[#121212]', bar: 'bg-[#e0fe3d]' },
  { ring: 'border-[#ff9900]/50 bg-[#ff9900]/5', chip: 'bg-[#ff9900] text-white', bar: 'bg-[#ff9900]' },
];

export const NominationsPage: React.FC<{
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();

  const [rounds, setRounds] = useState<NominationRound[] | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, number[]>>({});
  const [votingOption, setVotingOption] = useState<number | null>(null);
  const [revokingOption, setRevokingOption] = useState<number | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [now, setNow] = useState(Date.now());
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [nominateOpen, setNominateOpen] = useState(false);
  const [preSelectedFilmId, setPreSelectedFilmId] = useState<string | null>(null);

  const [scope, setScope] = useState<'week' | 'all'>('week');
  const [view, setView] = useState<'masonry' | 'ranking'>('masonry');
  const [plazaItems, setPlazaItems] = useState<PlazaItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    getSession().then((u) => { if (alive) setUser(u); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/vote/ticket`, { credentials: 'include' }).catch(() => {});
  }, []);

  const reload = useCallback(async () => {
    try {
      const roundsRes = (await fetch(`${API_BASE}/api/nominations`).then((r) => r.json())) as NominationRound[];
      setRounds(roundsRes);
      const votes: Record<string, number[]> = {};
      await Promise.all(
        roundsRes
          .filter((r) => r.status === 'voting')
          .map(async (r) => {
            try {
              const res = await fetch(`${API_BASE}/api/vote?roundId=${encodeURIComponent(r.id)}`, {
                credentials: 'include',
                headers: await authHeaders(),
              });
              const data = await res.json();
              votes[r.id] = data.optionIds ?? [];
            } catch { votes[r.id] = []; }
          }),
      );
      setMyVotes(votes);
    } catch {
      setRounds([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { void window.scrollTo(0, 0); }, []);

  const refreshQuota = useCallback(() => { nominations.quota().then(setQuota).catch(() => {}); }, []);
  useEffect(() => { refreshQuota(); }, [refreshQuota]);

  // Live countdown tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Plaza polling (real-time ranking)
  useEffect(() => {
    let alive = true;
    const load = () => {
      nominations.plaza(scope)
        .then((d) => { if (alive) setPlazaItems(d.items ?? []); })
        .catch(() => { if (alive && plazaItems === null) setPlazaItems([]); });
    };
    load();
    const timer = setInterval(load, 8000);
    return () => { alive = false; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const [quotaShake, setQuotaShake] = useState(false);

  const triggerQuotaShake = () => {
    setQuotaShake(false);
    requestAnimationFrame(() => {
      setQuotaShake(true);
      setTimeout(() => setQuotaShake(false), 450);
    });
  };

  const castVote = async (roundId: string, optionId: number) => {
    if (quota && quota.remainingVotes <= 0) {
      triggerQuotaShake();
      toastError(lang === 'zh' ? '本周投票配额已用完' : 'Weekly vote quota reached');
      return;
    }
    setVotingOption(optionId);
    try {
      const res = await fetch(`${API_BASE}/api/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ roundId, optionId }),
      });
      if (res.status === 409) {
        toastError(lang === 'zh' ? '你已经投过这部了' : 'You already voted for this film');
      } else if (res.status === 429) {
        triggerQuotaShake();
        toastError(lang === 'zh' ? '本周投票配额已用完' : 'Weekly vote quota reached');
      } else if (!res.ok) {
        toastError(lang === 'zh' ? '投票失败,请稍后再试' : 'Vote failed, try again later');
      } else {
        toastSuccess(lang === 'zh' ? '投票成功,感谢参与!' : 'Vote cast — thank you!');
      }
      await reload();
      refreshQuota();
    } catch {
      toastError(lang === 'zh' ? '网络错误,请稍后再试' : 'Network error, try again later');
    } finally {
      setVotingOption(null);
    }
  };

  const revokeVote = async (roundId: string, optionId: number) => {
    setRevokingOption(optionId);
    try {
      const res = await fetch(`${API_BASE}/api/vote`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ roundId, optionId }),
      });
      if (res.ok) toastInfo(lang === 'zh' ? '已撤回投票' : 'Vote withdrawn');
      else toastError(lang === 'zh' ? '撤回失败,请稍后再试' : 'Withdraw failed, try again later');
      await reload();
      refreshQuota();
    } catch {
      toastError(lang === 'zh' ? '网络错误,请稍后再试' : 'Network error');
    } finally {
      setRevokingOption(null);
    }
  };

  const deadlineText = (deadline: string | null): string => {
    if (!deadline) return '';
    const ms = new Date(deadline).getTime() - now;
    if (ms <= 0) return lang === 'zh' ? '已截止' : 'Closed';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return lang === 'zh' ? `剩 ${days} 天 ${hours} 时 ${mins} 分` : `${days}d ${hours}h ${mins}m left`;
  };

  const active = rounds?.filter((r) => r.status !== 'revealed') ?? [];
  const revealed = rounds?.filter((r) => r.status === 'revealed') ?? [];

  const openNominate = (filmId?: string) => {
    setPreSelectedFilmId(filmId ?? null);
    setNominateOpen(true);
  };

  const ranking = (plazaItems ?? []).slice().sort((a, b) => b.votes - a.votes || b.nominations - a.nominations);
  const maxVotes = ranking.length ? ranking[0].votes : 0;

  return (
    <>
      <Header lang={lang} setLang={setLang} onNavigate={() => navigate('/')} onOpenModal={onOpenModal} />

      <main
        className="relative w-full min-h-screen bg-[#121212] px-4 sm:px-8 lg:px-12 pt-14 sm:pt-16 pb-12 text-[#f5ffe5] overflow-hidden"
      >
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Unified Page Hero: 24px Main Title + 14px Subtitle */}
          <PageHero
            title="选片提名与社区公投"
            subtitle="浏览广场提案、提报心仪神作、投出属于影迷社区的下一场特设放映现场。"
          />

          {/* Participatory Quota & Nomination Action Panel */}
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: User Identity & Quota Info */}
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {user ? (
                  <span className="text-[#e0fe3d] bg-[#e0fe3d]/10 px-3 py-1 rounded-full border border-[#e0fe3d]/20 flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    已认证成员：{user.name}
                  </span>
                ) : (
                  <span className="text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10 text-[12px]">
                    当前为匿名参与 ·{' '}
                    <button
                      onClick={() => navigate('/auth?redirect=/nominations')}
                      className="text-[#ff3650] hover:text-white underline underline-offset-2 cursor-pointer font-bold ml-1"
                    >
                      登录提升周配额（3 提名 / 6 票）
                    </button>
                  </span>
                )}
              </div>
              <p className="text-[12px] text-white/50">
                每位社区影迷每周拥有专属提名与投票配额，每周一凌晨自动重置。
              </p>
            </div>

            {/* Middle/Right: Quota Progress Indicators & Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto shrink-0">
              {quota && (
                <div className={`flex items-center gap-4 bg-black/40 px-4 py-2.5 rounded-xl border transition-all t-shake ${quotaShake ? 'is-shaking border-[#ff3650] shadow-[0_0_20px_rgba(255,54,80,0.4)]' : 'border-white/10'}`}>
                  {/* Nominate Quota */}
                  <div className="w-28 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60 flex items-center gap-1">
                        <Plus className="w-3 h-3 text-[#ff3650]" /> 周提名
                      </span>
                      <span className="text-[#ff3650] font-bold font-mono">
                        {quota.nominationsUsed}/{quota.nominationsLimit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[#ff3650]"
                        initial={false}
                        animate={{
                          width: `${Math.min(100, (quota.nominationsUsed / quota.nominationsLimit) * 100)}%`,
                        }}
                        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                      />
                    </div>
                  </div>

                  <div className="w-px h-6 bg-white/15" />

                  {/* Vote Quota */}
                  <div className="w-28 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60 flex items-center gap-1">
                        <Vote className="w-3 h-3 text-[#e0fe3d]" /> 周投票
                      </span>
                      <span className="text-[#e0fe3d] font-bold font-mono">
                        {quota.votesUsed}/{quota.votesLimit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[#e0fe3d]"
                        initial={false}
                        animate={{
                          width: `${Math.min(100, (quota.votesUsed / quota.votesLimit) * 100)}%`,
                        }}
                        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Initiate Nomination Button */}
              <button
                onClick={() => {
                  if (quota !== null && quota.remainingNominations <= 0) {
                    triggerQuotaShake();
                    toastError(lang === 'zh' ? '本周提名配额已用完' : 'Weekly nomination quota reached');
                  } else {
                    openNominate();
                  }
                }}
                className={`inline-flex items-center justify-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] active:scale-[0.98] text-white font-bold text-[16px] px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(255,54,80,0.35)] shrink-0 ${
                  quota !== null && quota.remainingNominations <= 0 ? 'opacity-50' : ''
                }`}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>发起新提名</span>
              </button>
            </div>
          </div>

          {/* Cover-flow carousel of the leading nominated films */}
          {ranking.length > 0 && (
            <CoverFlowCarousel
              items={ranking.slice(0, 10).map((p): CoverFlowItem => ({ id: p.filmId, title: p.title, image: p.image }))}
              onSelect={(filmId) => navigate(`/films/${filmId}`, { viewTransition: true })}
            />
          )}

          {/* Plaza */}
          <section className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#ff3650]" /> {lang === 'zh' ? '提名广场' : 'PLAZA'}
              </h2>
              <div className="flex items-center gap-2">
                <Tabs value={scope} onValueChange={(v) => setScope(v as 'week' | 'all')}>
                  <TabsList>
                    <TabsTrigger value="week">本周</TabsTrigger>
                    <TabsTrigger value="all">总榜</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-0.5">
                  <button onClick={() => setView('masonry')} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${view === 'masonry' ? 'bg-[#ff3650] text-white' : 'text-white/50 hover:text-white'}`} title="瀑布流"><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setView('ranking')} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${view === 'ranking' ? 'bg-[#ff3650] text-white' : 'text-white/50 hover:text-white'}`} title="排行"><ListOrdered className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {plazaItems === null ? (
              <div className="py-16 flex justify-center"><Loader variant="comet" size={32} label="加载提名广场" className="text-[#ff3650]" /></div>
            ) : plazaItems.length === 0 ? (
              <div className="py-14 text-center text-white/40">
                <Flame className="w-10 h-10 mx-auto mb-3 text-white/20" />
                <p className="font-bold">{lang === 'zh' ? '还没有提名影片，成为第一个提名的人吧' : 'No nominations yet — be the first'}</p>
              </div>
            ) : view === 'masonry' ? (
              <Masonry
                items={plazaItems}
                columnGutter={16}
                columnWidth={230}
                overscanBy={4}
                render={({ data }) => (
                  <FilmContextMenu filmId={data.filmId} title={data.title} onNominate={() => openNominate(data.filmId)}>
                  <div className="mb-4 bg-[#1a1a1a] border border-white/10 hover:border-[#ff3650]/50 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(255,54,80,0.15)] rounded-2xl overflow-hidden transition-all duration-300 group">
                    <div className="relative aspect-[2/3] overflow-hidden bg-black/40">
                      {data.image ? (
                        <img src={data.image} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 font-black text-3xl">{data.title.slice(0, 1)}</div>
                      )}
                      {data.planned && <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">已通过</span>}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                        <span className="bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">提名 {data.nominations}</span>
                        <span className="bg-[#ff3650]/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Flame className="w-2.5 h-2.5" /> {data.votes}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-white truncate">{data.title}</p>
                      <p className="text-xs text-white/40 font-mono mb-2">{data.year}{data.category ? ` · ${data.category}` : ''}</p>
                      <button
                        onClick={() => openNominate(data.filmId)}
                        disabled={quota !== null && quota.remainingNominations <= 0}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-black py-1.5 rounded-lg bg-white/5 hover:bg-[#ff3650] hover:text-white text-white/70 transition-colors cursor-pointer disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" /> {lang === 'zh' ? '提名这部' : 'Nominate'}
                      </button>
                    </div>
                  </div>
                  </FilmContextMenu>
                )}
              />
            ) : (
              <div className="space-y-3 max-w-3xl">
                {ranking.map((item, i) => {
                  const style = RANK_STYLES[i] ?? { ring: 'border-white/10 bg-[#1a1a1a]', chip: 'bg-white/10 text-white/60', bar: 'bg-white/40' };
                  const share = maxVotes > 0 ? item.votes / maxVotes : 0;
                  return (
                    <FilmContextMenu key={item.filmId} filmId={item.filmId} title={item.title} onNominate={() => openNominate(item.filmId)}>
                    <motion.div layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.05, ease: TRIGGER_EASE }} className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 ${style.ring}`}>
                      <motion.span layout className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${style.chip}`}>
                        {i === 0 ? <Crown className="w-4 h-4" /> : i <= 2 ? <Trophy className="w-4 h-4" /> : i + 1}
                      </motion.span>
                      {item.image ? <img src={item.image} alt="" className="w-10 h-14 rounded-lg object-cover shrink-0 border border-white/10" /> : <div className="w-10 h-14 rounded-lg bg-white/5 shrink-0 flex items-center justify-center text-white/20 font-black">{item.title.slice(0, 1)}</div>}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white truncate">{item.title}</p>
                          {item.planned && <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shrink-0">已通过</Badge>}
                        </div>
                        <p className="text-xs text-white/40 mb-1.5">提名 {item.nominations} 次</p>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div className={`h-full rounded-full ${style.bar}`} initial={false} animate={{ width: `${share * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 22 }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0 min-w-[64px]">
                        <div className="flex items-baseline justify-end gap-1">
                          <AnimatedNumber value={item.votes} className="text-xl font-black text-white tabular-nums" />
                          <span className="text-[11px] font-bold text-white/40">{lang === 'zh' ? '票' : 'votes'}</span>
                        </div>
                        <p className="text-[10px] font-mono text-white/30">{Math.round(share * 100)}%</p>
                      </div>
                    </motion.div>
                    </FilmContextMenu>
                  );
                })}
              </div>
            )}
          </section>

          {/* Rounds */}
          <section className="mb-12">
            <h2 className="text-xl font-black uppercase tracking-tight mb-5 flex items-center gap-2">
              <Vote className="w-5 h-5 text-[#ff3650]" /> {lang === 'zh' ? '进行中轮次' : 'ACTIVE ROUNDS'}
            </h2>

            {rounds === null ? (
              <div className="flex justify-center py-10"><Loader variant="morph" size={36} label="加载轮次" className="text-[#ff3650]" /></div>
            ) : active.length === 0 && revealed.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-12 text-center">
                <Hourglass className="w-10 h-10 text-[#ff3650] mx-auto mb-3" />
                <p className="text-white/60 font-bold">{lang === 'zh' ? '暂无进行中的提名,敬请期待。' : 'No active nominations right now.'}</p>
              </div>
            ) : (
              active.map((round) => {
                const myOptionIds = myVotes[round.id] ?? [];
                return (
                  <div key={round.id} className="mb-10">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      {round.status === 'voting' ? (
                        <span className="bg-[#ff3650] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">{lang === 'zh' ? '投票中' : 'Voting'}</span>
                      ) : (
                        <span className="bg-white/10 text-white/70 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1"><PencilLine className="w-3 h-3" />{lang === 'zh' ? '提名收集中' : 'Collecting'}</span>
                      )}
                      {round.status === 'voting' && round.deadline && <span className="text-[#ff3650] text-xs font-black">⏳ {deadlineText(round.deadline)}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <h3 className="text-2xl font-black text-[#f5ffe5]">{round.title}</h3>
                      {round.status === 'collecting' && (
                        <button onClick={() => openNominate()} disabled={quota !== null && quota.remainingNominations <= 0} className="inline-flex items-center gap-1.5 text-xs font-black text-[#ff3650] hover:text-white border border-[#ff3650]/40 hover:bg-[#ff3650] rounded-xl px-3.5 py-2 transition-colors cursor-pointer disabled:opacity-40">
                          <Plus className="w-4 h-4" /> {lang === 'zh' ? '我要提名' : 'Nominate'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {round.options.map((opt, i) => {
                        const isMine = myOptionIds.includes(opt.id);
                        return (
                          <FilmContextMenu key={opt.id} filmId={opt.film_id ?? ''} title={opt.film?.title_zh ?? opt.film?.title ?? opt.note ?? opt.film_id ?? ''}>
                          <motion.div initial={{ x: 60, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.07, ease: TRIGGER_EASE }} className={`group rounded-2xl overflow-hidden border-2 transition-all bg-[#1a1a1a] t-tilt-card ${isMine ? 'border-[#ff3650] shadow-[0_8px_30px_rgba(255,54,80,0.3)]' : 'border-white/10 hover:border-white/30'}`}>
                            {opt.film?.image ? (
                              <div className="relative aspect-[27/40] overflow-hidden">
                                <img src={opt.film.image} alt={opt.film.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-4">
                                  <p className="font-black text-white text-sm leading-tight">{opt.film.title_zh ?? opt.film.title}</p>
                                  <p className="text-white/50 text-xs font-bold mt-0.5">{opt.film.year}</p>
                                </div>
                                {opt.nominator && <span className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white/80 text-[10px] font-black px-2 py-1 rounded-full">{opt.nominator} {lang === 'zh' ? '提名' : 'nominated'}</span>}
                              </div>
                            ) : (
                              <div className="p-6"><p className="font-black text-white">{opt.note ?? opt.film_id ?? '?'}</p></div>
                            )}
                            <div className="p-3">
                              {round.status === 'voting' ? (
                                isMine ? (
                                  <div className="flex items-center gap-1.5">
                                    <motion.span
                                      initial={{ scale: 0.85, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                                      className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-black py-2.5 rounded-xl bg-[#ff3650] text-white"
                                    >
                                      <span className="t-success-check" data-state="in">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </span>
                                      <span>{lang === 'zh' ? '已投票' : 'VOTED'}</span>
                                    </motion.span>
                                    <button
                                      onClick={() => revokeVote(round.id, opt.id)}
                                      disabled={revokingOption !== null}
                                      title={lang === 'zh' ? '撤回投票' : 'Withdraw vote'}
                                      className="shrink-0 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                                    >
                                      {revokingOption === opt.id ? <Loader variant="dots" size={16} className="text-white/60" /> : <Undo2 className="w-4 h-4" />}
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => castVote(round.id, opt.id)} disabled={votingOption !== null || (quota !== null && quota.remainingVotes <= 0)} className="w-full inline-flex items-center justify-center gap-2 bg-[#f5ffe5] hover:bg-[#ff3650] text-[#121212] hover:text-white font-black text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
                                    <Vote className="w-4 h-4" /> {votingOption === opt.id ? (lang === 'zh' ? '提交中...' : 'VOTING...') : (lang === 'zh' ? '投它一票' : 'VOTE')}
                                  </button>
                                )
                              ) : (
                                <p className="text-center text-xs font-bold text-white/40 py-2">{lang === 'zh' ? '等待提名截止...' : 'awaiting voting phase...'}</p>
                              )}
                            </div>
                          </motion.div>
                          </FilmContextMenu>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* Revealed */}
          {revealed.length > 0 && (
            <section>
              <h2 className="text-xl font-black text-white/70 uppercase tracking-wider mb-4 border-t border-white/10 pt-8">{lang === 'zh' ? '历届结果' : 'PAST RESULTS'}</h2>
              {revealed.map((round) => {
                const sorted = [...round.options].sort((a, b) => b.votes_count - a.votes_count);
                return (
                  <div key={round.id} className="mb-8 bg-[#1a1a1a] border border-white/10 rounded-3xl p-6">
                    <h3 className="font-black text-[#f5ffe5] mb-4">{round.title}</h3>
                    <div className="space-y-2">
                      {sorted.map((opt, i) => (
                        <div key={opt.id} className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-[#ff3650] text-white' : 'bg-white/10 text-white/60'}`}>{i === 0 ? <Crown className="w-3.5 h-3.5" /> : i + 1}</span>
                          <span className="font-bold text-sm text-[#f5ffe5] truncate">{opt.film?.title_zh ?? opt.film?.title ?? opt.note ?? opt.film_id}</span>
                          <span className="ml-auto text-xs font-black text-white/50 shrink-0">{opt.votes_count} {lang === 'zh' ? '票' : 'votes'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <Footer lang={lang} />

      {nominateOpen && (
        <NominateDialog
          open
          initialFilmId={preSelectedFilmId}
          onClose={() => { setNominateOpen(false); setPreSelectedFilmId(null); }}
          onSubmitted={() => { refreshQuota(); void reload(); }}
        />
      )}
    </>
  );
};
