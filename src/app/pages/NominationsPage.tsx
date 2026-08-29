import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Masonry } from 'masonic';
import { Language, OpenSiteModal } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Loader } from '../../components/motion/loader';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { useToast } from '../../components/ui/Toast';
import { getSession, SessionUser } from '../../lib/session';
import { nominations, Quota, PlazaItem } from '../../lib/nominations';
import { api } from '../../lib/api/client';
import { NominateDialog } from '../../features/nominations/NominateDialog';
import { CoverFlowCarousel, CoverFlowItem } from '../../features/nominations/CoverFlowCarousel';
import { FilmContextMenu } from '../../features/nominations/FilmContextMenu';
import { PageHero } from '../../components/layout/PageHero';
import {
  Crown, Plus, Flame, Trophy, LayoutGrid, ListOrdered,
  Vote, Sparkles, Minus,
} from 'lucide-react';

const RANK_STYLES = [
  { ring: 'border-[#ff3650]/60 bg-[#ff3650]/10', chip: 'bg-[#ff3650] text-white shadow-[0_0_16px_rgba(255,54,80,0.5)]', bar: 'bg-[#ff3650]' },
  { ring: 'border-[#e0fe3d]/50 bg-[#e0fe3d]/5', chip: 'bg-[#e0fe3d] text-[#121212]', bar: 'bg-[#e0fe3d]' },
  { ring: 'border-[#ff9900]/50 bg-[#ff9900]/5', chip: 'bg-[#ff9900] text-white', bar: 'bg-[#ff9900]' },
];

const voteErrorMessage = (raw: string, lang: Language): string => {
  if (raw === 'already_screened') return lang === 'zh' ? '这部已经放过，不能再投' : 'Already screened';
  if (raw === 'frozen') return lang === 'zh' ? '已排入未来场次，暂不可投' : 'Frozen for an upcoming night';
  if (raw === 'quota_exceeded') return lang === 'zh' ? '本周投票配额已用完' : 'Weekly vote quota reached';
  if (raw === 'identity_required') return lang === 'zh' ? '需要先取得投票身份' : 'Voter identity required';
  return lang === 'zh' ? '投票失败,请稍后再试' : 'Vote failed, try again later';
};

export const NominationsPage: React.FC<{
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: OpenSiteModal) => void;
}> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();

  const [votingFilm, setVotingFilm] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [nominateOpen, setNominateOpen] = useState(false);
  const [preSelectedFilmId, setPreSelectedFilmId] = useState<string | null>(null);

  const [scope, setScope] = useState<'week' | 'all'>('week');
  const [view, setView] = useState<'masonry' | 'ranking'>('masonry');
  const [plazaItems, setPlazaItems] = useState<PlazaItem[] | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    getSession().then((u) => { if (alive) setUser(u); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    api('/api/vote/ticket').catch(() => {});
  }, []);

  useEffect(() => { void window.scrollTo(0, 0); }, []);

  const refreshQuota = useCallback(() => { nominations.quota().then(setQuota).catch(() => {}); }, []);
  useEffect(() => { refreshQuota(); }, [refreshQuota]);

  const refreshMine = useCallback(() => {
    nominations.myVotes()
      .then((d) => {
        const map: Record<string, number> = {};
        for (const row of d.items ?? []) map[row.filmId] = row.count;
        setMyVotes(map);
      })
      .catch(() => setMyVotes({}));
  }, []);

  useEffect(() => { refreshMine(); }, [refreshMine]);

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

  const bumpVote = async (filmId: string, dir: 1 | -1) => {
    if (dir === 1 && quota && quota.remainingVotes <= 0) {
      triggerQuotaShake();
      toastError(lang === 'zh' ? '本周投票配额已用完' : 'Weekly vote quota reached');
      return;
    }
    if (dir === -1 && (myVotes[filmId] ?? 0) < 1) return;
    setVotingFilm(filmId);
    try {
      if (dir === 1) await nominations.vote(filmId);
      else await nominations.unvote(filmId);
      if (dir === 1) toastSuccess(lang === 'zh' ? '已叠一票' : 'Vote stacked');
      else toastInfo(lang === 'zh' ? '已撤一票' : 'Vote withdrawn');
      refreshQuota();
      refreshMine();
      const d = await nominations.plaza(scope);
      setPlazaItems(d.items ?? []);
    } catch (e) {
      const raw = e instanceof Error ? e.message : '';
      if (raw === 'quota_exceeded') triggerQuotaShake();
      toastError(voteErrorMessage(raw, lang));
    } finally {
      setVotingFilm(null);
    }
  };

  const openNominate = (filmId?: string) => {
    setPreSelectedFilmId(filmId ?? null);
    setNominateOpen(true);
  };

  const ranking = (plazaItems ?? []).slice().sort((a, b) => b.votes - a.votes || b.nominations - a.nominations);
  const maxVotes = ranking.length ? ranking[0].votes : 0;

  const VoteStepper: React.FC<{ filmId: string }> = ({ filmId }) => {
    const mine = myVotes[filmId] ?? 0;
    const busy = votingFilm === filmId;
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void bumpVote(filmId, -1)}
          disabled={busy || mine < 1}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center cursor-pointer disabled:opacity-30"
          title={lang === 'zh' ? '撤一票' : 'Remove one vote'}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="min-w-[1.5rem] text-center text-xs font-black tabular-nums text-[#e0fe3d]">{mine}</span>
        <button
          type="button"
          onClick={() => void bumpVote(filmId, 1)}
          disabled={busy || (quota !== null && quota.remainingVotes <= 0)}
          className="w-8 h-8 rounded-full bg-[#ff3650] hover:bg-[#ff203c] text-white inline-flex items-center justify-center cursor-pointer disabled:opacity-30"
          title={lang === 'zh' ? '叠一票' : 'Add one vote'}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <>
      <Header lang={lang} setLang={setLang} onNavigate={() => navigate('/')} onOpenModal={onOpenModal} />

      <main
        className="relative w-full min-h-screen bg-[#121212] px-4 sm:px-8 lg:px-12 pt-14 sm:pt-16 pb-12 text-[#f5ffe5] overflow-hidden"
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <PageHero
            title="选片提名与社区公投"
            subtitle="把票叠给想看的片；排期以日历为准，不会自动把榜首写进周六。"
          />

          <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                每位社区影迷每周拥有专属提名与投票配额，每周一凌晨自动重置。同一部片本周可以把票全部叠上去。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto shrink-0">
              {quota && (
                <div className={`flex items-center gap-4 bg-black/40 px-4 py-2.5 rounded-xl border transition-all t-shake ${quotaShake ? 'is-shaking border-[#ff3650] shadow-[0_0_20px_rgba(255,54,80,0.4)]' : 'border-white/10'}`}>
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

              <button
                onClick={() => {
                  if (quota !== null && quota.remainingNominations <= 0) {
                    triggerQuotaShake();
                    toastError(lang === 'zh' ? '本周提名配额已用完' : 'Weekly nomination quota reached');
                  } else {
                    openNominate();
                  }
                }}
                className={`group/btn inline-flex items-center gap-2.5 bg-[#ff3650] hover:bg-[#ff203c] active:scale-[0.98] text-white font-extrabold text-sm px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(255,54,80,0.35)] shrink-0 ${
                  quota !== null && quota.remainingNominations <= 0 ? 'opacity-50' : ''
                }`}
              >
                <span className="tracking-wider">{lang === 'zh' ? '发起新提名' : 'NEW NOMINATION'}</span>
                <span className="w-6 h-6 rounded-full bg-white text-[#ff3650] flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </button>
            </div>
          </div>

          {ranking.length > 0 && (
            <CoverFlowCarousel
              items={ranking.slice(0, 10).map((p): CoverFlowItem => ({ id: p.filmId, title: p.title, image: p.image }))}
              onSelect={(filmId) => navigate(`/films/${filmId}`, { viewTransition: true })}
            />
          )}

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
                      <div className="flex items-center justify-between gap-2">
                        <VoteStepper filmId={data.filmId} />
                        <button
                          onClick={() => openNominate(data.filmId)}
                          disabled={quota !== null && quota.remainingNominations <= 0}
                          className="inline-flex items-center justify-center gap-1 text-xs font-black py-1.5 px-2 rounded-lg bg-white/5 hover:bg-[#ff3650] hover:text-white text-white/70 transition-colors cursor-pointer disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" /> {lang === 'zh' ? '提名' : 'Nom'}
                        </button>
                      </div>
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
                      <VoteStepper filmId={item.filmId} />
                    </motion.div>
                    </FilmContextMenu>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer lang={lang} />

      {nominateOpen && (
        <NominateDialog
          open
          initialFilmId={preSelectedFilmId}
          onClose={() => { setNominateOpen(false); setPreSelectedFilmId(null); }}
          onSubmitted={() => { refreshQuota(); refreshMine(); nominations.plaza(scope).then((d) => setPlazaItems(d.items ?? [])).catch(() => {}); }}
        />
      )}
    </>
  );
};
