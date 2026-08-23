import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { NominationRound } from '../../types/screening';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Loader } from '../../components/motion/loader';
import { getSession, getAccessToken, SessionUser } from '../../lib/session';
import { nominations, Quota } from '../../lib/nominations';
import { NominateDialog } from '../../features/nominations/NominateDialog';
import { ArrowLeft, Crown, Hourglass, PencilLine, Vote, Plus } from 'lucide-react';

interface NominationsPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

/** Bearer header for a logged-in user, empty for anonymous cookie voting. */
const authHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const NominationsPage: React.FC<NominationsPageProps> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<NominationRound[] | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, number[]>>({});
  const [votingOption, setVotingOption] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [nominateRound, setNominateRound] = useState<NominationRound | null>(null);

  // Display-only: show whose name appears on the vote. The actual ballot
  // identity is resolved server-side (verified token or signed cookie) and
  // is never sent from the client.
  useEffect(() => {
    let alive = true;
    getSession().then((u) => { if (alive) setUser(u); });
    return () => { alive = false; };
  }, []);

  // Ensure the anonymous voter cookie exists before any vote/status call.
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
          })
      );
      setMyVotes(votes);
    } catch {
      setRounds([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { void window.scrollTo(0, 0); }, []);

  useEffect(() => {
    let alive = true;
    nominations.quota().then((q) => { if (alive) setQuota(q); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const refreshQuota = () => { nominations.quota().then(setQuota).catch(() => {}); };

  const castVote = async (roundId: string, optionId: number) => {
    setVotingOption(optionId);
    setToast('');
    try {
      const res = await fetch(`${API_BASE}/api/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ roundId, optionId }),
      });
      if (res.status === 409) {
        setToast(lang === 'zh' ? '你已经投过这部了' : 'You already voted for this film');
      } else if (res.status === 429) {
        setToast(lang === 'zh' ? '本周投票配额已用完' : 'Weekly vote quota reached');
      } else if (!res.ok) {
        setToast(lang === 'zh' ? '投票失败,请稍后再试' : 'Vote failed, try again later');
      } else {
        setToast(lang === 'zh' ? '投票成功,感谢参与!' : 'Vote cast — thank you!');
      }
      await reload();
      refreshQuota();
    } catch {
      setToast(lang === 'zh' ? '网络错误,请稍后再试' : 'Network error, try again later');
    } finally {
      setVotingOption(null);
    }
  };

  const deadlineText = (deadline: string | null): string => {
    if (!deadline) return '';
    const ms = new Date(deadline).getTime() - Date.now();
    if (ms <= 0) return lang === 'zh' ? '已截止' : 'Closed';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    return lang === 'zh' ? `剩 ${days} 天 ${hours} 小时` : `${days}d ${hours}h left`;
  };

  const active = rounds?.filter((r) => r.status !== 'revealed') ?? [];
  const revealed = rounds?.filter((r) => r.status === 'revealed') ?? [];

  return (
    <>
      <Header lang={lang} setLang={setLang} onNavigate={() => navigate('/')} onOpenModal={onOpenModal} />

      <motion.main
        id="container"
        className="w-full min-h-screen bg-[#151515] px-4 sm:px-8 lg:px-16 py-24 lg:py-28"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: TRIGGER_EASE }}
      >
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-white/60 hover:text-[#ff3650] font-black text-sm uppercase tracking-wider transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'zh' ? '返回首页' : 'BACK TO HOME'}</span>
          </button>

          <p className="text-xs font-black text-[#ff3650] uppercase tracking-widest mb-1">Nominate & Vote</p>
          <h1 className="text-4xl sm:text-6xl font-black text-[#f5ffe5] uppercase tracking-tight mb-2">
            {lang === 'zh' ? '提名与投票' : 'NOMINATIONS'}
          </h1>
          <p className="text-white/50 font-bold mb-2">
            {lang === 'zh' ? '下一场放什么,由你决定。每人每轮一票。' : 'What screens next is up to you. One vote per round.'}
          </p>
          <p className="text-xs font-bold mb-8">
            {user ? (
              <span className="text-[#e0fe3d]">
                {lang === 'zh' ? `已以 ${user.name} 的身份实名投票` : `Voting as ${user.name}`}
              </span>
            ) : (
              <span className="text-white/40">
                {lang === 'zh' ? '当前为匿名投票 · ' : 'Anonymous vote · '}
                <button onClick={() => navigate('/auth?redirect=/nominations')} className="text-[#ff3650] hover:text-white underline underline-offset-2 cursor-pointer">
                  {lang === 'zh' ? '登录实名投票' : 'Sign in to vote'}
                </button>
              </span>
            )}
          </p>

          {quota && (
            <div className="mb-8 flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-full px-3 py-1.5 text-white/70">
                <Plus className="w-3.5 h-3.5 text-[#ff3650]" />
                {lang === 'zh' ? '提名' : 'Nominate'} {quota.nominationsUsed}/{quota.nominationsLimit}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-full px-3 py-1.5 text-white/70">
                <Vote className="w-3.5 h-3.5 text-[#e0fe3d]" />
                {lang === 'zh' ? '投票' : 'Votes'} {quota.votesUsed}/{quota.votesLimit}
              </span>
              {quota.kind === 'anon' && (
                <button onClick={() => navigate('/auth?redirect=/nominations')} className="text-[#ff3650] hover:text-white underline underline-offset-2 cursor-pointer">
                  {lang === 'zh' ? '登录可提名 3 部 / 投票 6 部' : 'Sign in for 3 nominations / 6 votes'}
                </button>
              )}
            </div>
          )}

          {toast && (
            <p className="mb-6 text-sm font-black text-[#f5ffe5] bg-[#ff3650]/15 border border-[#ff3650]/40 rounded-xl px-4 py-3">
              {toast}
            </p>
          )}

          {rounds === null ? (
            <div className="flex justify-center py-12">
              <Loader variant="morph" size={40} label="加载提名数据" className="text-[#ff3650]" />
            </div>
          ) : (
            <>
              {/* Active rounds */}
              {active.length === 0 && revealed.length === 0 && (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-12 text-center">
                  <Hourglass className="w-10 h-10 text-[#ff3650] mx-auto mb-3" />
                  <p className="text-white/60 font-bold">
                    {lang === 'zh' ? '暂无进行中的提名,敬请期待。' : 'No active nominations right now.'}
                  </p>
                </div>
              )}

              {active.map((round) => {
                const myOptionIds = myVotes[round.id] ?? [];
                return (
                  <section key={round.id} className="mb-12">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      {round.status === 'voting' ? (
                        <span className="bg-[#ff3650] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                          {lang === 'zh' ? '投票中' : 'Voting'}
                        </span>
                      ) : (
                        <span className="bg-white/10 text-white/70 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                          <PencilLine className="w-3 h-3" />
                          {lang === 'zh' ? '提名收集中' : 'Collecting'}
                        </span>
                      )}
                      {round.status === 'voting' && round.deadline && (
                        <span className="text-[#ff3650] text-xs font-black">
                          ⏳ {deadlineText(round.deadline)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#f5ffe5] mb-4">{round.title}</h2>

                    {round.status === 'collecting' && (
                      <button
                        onClick={() => setNominateRound(round)}
                        disabled={quota !== null && quota.remainingNominations <= 0}
                        className="mb-5 inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-40 text-white font-black text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#ff3650]/20"
                      >
                        <Plus className="w-4 h-4" /> {lang === 'zh' ? '我要提名' : 'Nominate a film'}
                      </button>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {round.options.map((opt, i) => {
                        const isMine = myOptionIds.includes(opt.id);
                        return (
                          <motion.div
                            key={opt.id}
                            initial={{ x: 60, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55, delay: i * 0.07, ease: TRIGGER_EASE }}
                            className={`group rounded-2xl overflow-hidden border-2 transition-all bg-[#1a1a1a] ${
                              isMine ? 'border-[#ff3650] shadow-[0_8px_30px_rgba(255,54,80,0.3)]' : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            {opt.film?.image ? (
                              <div className="relative aspect-[27/40] overflow-hidden">
                                <img src={opt.film.image} alt={opt.film.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                <div className="absolute bottom-0 inset-x-0 p-4">
                                  <p className="font-black text-white text-sm leading-tight">
                                    {opt.film.title_zh ?? opt.film.title}
                                  </p>
                                  <p className="text-white/50 text-xs font-bold mt-0.5">{opt.film.year}</p>
                                </div>
                                {opt.nominator && (
                                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white/80 text-[10px] font-black px-2 py-1 rounded-full">
                                    {opt.nominator} {lang === 'zh' ? '提名' : 'nominated'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="p-6">
                                <p className="font-black text-white">{opt.note ?? opt.film_id ?? '?'}</p>
                              </div>
                            )}
                            <div className="p-3">
                              {round.status === 'voting' ? (
                                isMine ? (
                                  <p className="text-center text-sm font-black py-2 rounded-xl bg-[#ff3650] text-white">
                                    ✓ {lang === 'zh' ? '已投' : 'VOTED'}
                                  </p>
                                ) : (
                                  <button
                                    onClick={() => castVote(round.id, opt.id)}
                                    disabled={votingOption !== null || (quota !== null && quota.remainingVotes <= 0)}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-[#f5ffe5] hover:bg-[#ff3650] text-[#121212] hover:text-white font-black text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                                  >
                                    <Vote className="w-4 h-4" />
                                    {votingOption === opt.id ? (lang === 'zh' ? '提交中...' : 'VOTING...') : (lang === 'zh' ? '投它一票' : 'VOTE')}
                                  </button>
                                )
                              ) : (
                                <p className="text-center text-xs font-bold text-white/40 py-2">
                                  {lang === 'zh' ? '等待提名截止...' : 'awaiting voting phase...'}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {/* Revealed results */}
              {revealed.length > 0 && (
                <>
                  <h2 className="text-xl font-black text-white/70 uppercase tracking-wider mb-4 border-t border-white/10 pt-8">
                    {lang === 'zh' ? '历届结果' : 'PAST RESULTS'}
                  </h2>
                  {revealed.map((round) => {
                    const sorted = [...round.options].sort((a, b) => b.votes_count - a.votes_count);
                    return (
                      <section key={round.id} className="mb-8 bg-[#1a1a1a] border border-white/10 rounded-3xl p-6">
                        <h3 className="font-black text-[#f5ffe5] mb-4">{round.title}</h3>
                        <div className="space-y-2">
                          {sorted.map((opt, i) => (
                            <div key={opt.id} className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-[#ff3650] text-white' : 'bg-white/10 text-white/60'}`}>
                                {i === 0 ? <Crown className="w-3.5 h-3.5" /> : i + 1}
                              </span>
                              <span className="font-bold text-sm text-[#f5ffe5] truncate">
                                {opt.film?.title_zh ?? opt.film?.title ?? opt.note ?? opt.film_id}
                              </span>
                              <span className="ml-auto text-xs font-black text-white/50 shrink-0">
                                {opt.votes_count} {lang === 'zh' ? '票' : 'votes'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </motion.main>

      <Footer lang={lang} />

      {nominateRound && (
        <NominateDialog
          roundId={nominateRound.id}
          roundTitle={nominateRound.title}
          open
          onClose={() => setNominateRound(null)}
          onSubmitted={() => { refreshQuota(); void reload(); }}
        />
      )}
    </>
  );
};
