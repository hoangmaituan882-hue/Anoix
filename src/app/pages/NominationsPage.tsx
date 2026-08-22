import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language } from '../../types';
import { TRIGGER_EASE } from '../../lib/motion';
import { NominationRound } from '../../types/screening';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { ArrowLeft, Crown, Hourglass, PencilLine, Vote } from 'lucide-react';

interface NominationsPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}

/** Anonymous voter identity — one stable id per browser, one vote per round. */
function getVoterId(): string {
  const KEY = 'anoix_voter_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export const NominationsPage: React.FC<NominationsPageProps> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<NominationRound[] | null>(null);
  const [myVotes, setMyVotes] = useState<Record<string, number | null>>({});
  const [votingOption, setVotingOption] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const voterId = getVoterId();

  const reload = useCallback(async () => {
    try {
      const [roundsRes, ...voteRes] = await Promise.all([
        fetch(`${API_BASE}/api/nominations`).then((r) => r.json()) as Promise<NominationRound[]>,
      ]);
      setRounds(roundsRes);
      const votes: Record<string, number | null> = {};
      await Promise.all(
        roundsRes
          .filter((r) => r.status === 'voting')
          .map(async (r) => {
            try {
              const res = await fetch(`${API_BASE}/api/vote?roundId=${encodeURIComponent(r.id)}&voterId=${encodeURIComponent(voterId)}`);
              const data = await res.json();
              votes[r.id] = data.voted ? data.optionId : null;
            } catch { votes[r.id] = null; }
          })
      );
      setMyVotes(votes);
      void voteRes;
    } catch {
      setRounds([]);
    }
  }, [voterId]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const castVote = async (roundId: string, optionId: number) => {
    setVotingOption(optionId);
    setToast('');
    try {
      const res = await fetch(`${API_BASE}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, optionId, voterId }),
      });
      if (res.status === 409) {
        setToast(lang === 'zh' ? '你已经投过这一轮了' : 'You already voted in this round');
      } else if (!res.ok) {
        setToast(lang === 'zh' ? '投票失败,请稍后再试' : 'Vote failed, try again later');
      } else {
        setToast(lang === 'zh' ? '投票成功,感谢参与!' : 'Vote cast — thank you!');
      }
      await reload();
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
          <p className="text-white/50 font-bold mb-8">
            {lang === 'zh' ? '下一场放什么,由你决定。每人每轮一票。' : 'What screens next is up to you. One vote per round.'}
          </p>

          {toast && (
            <p className="mb-6 text-sm font-black text-[#f5ffe5] bg-[#ff3650]/15 border border-[#ff3650]/40 rounded-xl px-4 py-3">
              {toast}
            </p>
          )}

          {rounds === null ? (
            <p className="text-white/50 font-bold">{lang === 'zh' ? '加载中...' : 'LOADING...'}</p>
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
                const myOption = myVotes[round.id];
                const voted = Boolean(myOption);
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
                    <h2 className="text-2xl sm:text-3xl font-black text-[#f5ffe5] mb-6">{round.title}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {round.options.map((opt, i) => {
                        const isMine = myOption === opt.id;
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
                                voted ? (
                                  <p className={`text-center text-sm font-black py-2 rounded-xl ${isMine ? 'bg-[#ff3650] text-white' : 'text-white/40'}`}>
                                    {isMine ? `✓ ${lang === 'zh' ? '我的选择' : 'MY VOTE'}` : (lang === 'zh' ? '已投其他' : 'voted other')}
                                  </p>
                                ) : (
                                  <button
                                    onClick={() => castVote(round.id, opt.id)}
                                    disabled={votingOption !== null}
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
    </>
  );
};
