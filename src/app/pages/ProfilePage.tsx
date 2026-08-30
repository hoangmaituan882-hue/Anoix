import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language, OpenSiteModal } from '../../types';
import { AdminUser } from '../../types/user';
import { me, EMPTY_ME_STATS, MeStats } from '../../lib/me';
import { UserClubStats } from '../../features/credentials/UserClubStats';
import { nominations, VoteActivity, NominationActivity } from '../../lib/nominations';
import { community, FavoriteFilm, WatchItem } from '../../lib/community';
import { Rating } from '../../components/ui/rating';
import { YearReview } from '../../features/profile/YearReview';
import { getSession, signOut } from '../../lib/session';
import { TRIGGER_EASE } from '../../lib/motion';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Loader } from '../../components/motion/loader';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { PageHero } from '../../components/layout/PageHero';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ScreeningStandingCard } from '../../features/ranking/ScreeningStandingCard';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  KeyRound,
  UserRound,
  Save,
  Vote,
  Heart,
  X,
  Eye,
  User,
  Award,
  Sparkles,
  Film,
  Clock,
  Star,
  CheckCircle2,
  LogOut,
} from 'lucide-react';

export const ProfilePage: React.FC<{
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: OpenSiteModal) => void;
}> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<{ votes: VoteActivity[]; nominations: NominationActivity[] } | null>(null);
  const [favorites, setFavorites] = useState<FavoriteFilm[] | null>(null);
  const [watchLog, setWatchLog] = useState<WatchItem[] | null>(null);
  const [yearReviewOpen, setYearReviewOpen] = useState(false);
  const [clubStats, setClubStats] = useState<MeStats>(EMPTY_ME_STATS);

  const [form, setForm] = useState({ nickname: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [changing, setChanging] = useState(false);

  const loadActivity = useCallback(async () => {
    try {
      const data = await nominations.activity();
      setActivity({ votes: data.votes ?? [], nominations: data.nominations ?? [] });
    } catch {
      setActivity({ votes: [], nominations: [] });
    }
  }, []);

  useEffect(() => { void loadActivity(); }, [loadActivity]);

  const loadFavorites = useCallback(async () => {
    try { setFavorites(await community.favorites()); }
    catch { setFavorites([]); }
  }, []);

  useEffect(() => { void loadFavorites(); }, [loadFavorites]);

  const removeFavorite = async (filmId: string) => {
    try { await community.removeFavorite(filmId); void loadFavorites(); }
    catch (e) { toastError(e instanceof Error ? e.message : '移除失败'); }
  };

  const loadWatch = useCallback(async () => {
    try { setWatchLog(await community.watchList()); }
    catch { setWatchLog([]); }
  }, []);

  useEffect(() => { void loadWatch(); }, [loadWatch]);

  const load = useCallback(async () => {
    try {
      const user = await getSession();
      if (!user) {
        navigate('/auth?redirect=/profile', { replace: true });
        return;
      }
      const p = await me.get();
      setProfile(p);
      setForm({ nickname: p.nickname || '', avatarUrl: p.avatarUrl || '' });
      try {
        setClubStats(await me.stats());
      } catch {
        setClubStats(EMPTY_ME_STATS);
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : '加载资料失败');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [navigate, toastError]);

  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await me.update({ nickname: form.nickname.trim(), avatarUrl: form.avatarUrl.trim() });
      success('资料已保存');
      await load();
    } catch (e) {
      toastError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (pwd.next.length < 6) { toastError('新密码至少 6 位'); return; }
    if (pwd.next !== pwd.confirm) { toastError('两次输入的新密码不一致'); return; }
    setChanging(true);
    try {
      await me.changePassword(pwd.current, pwd.next);
      setPwd({ current: '', next: '', confirm: '' });
      success('密码已更新');
    } catch (e) {
      toastError(e instanceof Error ? e.message : '修改失败');
    } finally {
      setChanging(false);
    }
  };

  const doLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const field = 'space-y-1.5';
  const name = profile?.nickname || profile?.username || profile?.email || profile?.uid || '用户';

  return (
    <>
      <Header lang={lang} setLang={setLang} onNavigate={() => navigate('/')} onOpenModal={onOpenModal} />

      <motion.main
        className="relative w-full min-h-screen bg-[#f5ffe5] px-4 sm:px-8 lg:px-12 pt-14 sm:pt-16 pb-12 text-[#1e1f21]"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: TRIGGER_EASE }}
      >
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Unified Page Hero: 24px Main Title + 14px Subtitle */}
          <PageHero
            title="个人中心与活动档案"
            subtitle="查看与维护个人资料、放映会观影履历、选片投票及追番收藏。"
          />

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader variant="comet" size={36} label="加载资料" className="text-[#ff3650]" />
            </div>
          ) : !profile ? (
            <Card className="border-black/10 bg-white">
              <CardContent className="p-12 text-center space-y-4">
                <p className="text-black/60 font-bold">未找到账号信息</p>
                <Button onClick={() => navigate('/auth?redirect=/profile')}>去登录</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
              {/* Left: identity card + screening standing card */}
              <div className="space-y-4">
                <Card className="border-black/10 bg-white">
                  <CardHeader className="items-center text-center">
                    <Avatar className="h-24 w-24 ring-2 ring-[#ff3650]/40">
                      <AvatarImage src={form.avatarUrl || undefined} alt={name} />
                      <AvatarFallback className="bg-[#ff3650]/20 text-[#ff3650] text-2xl font-black">
                        {name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-xl font-black mt-2">{name}</CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1.5 flex-wrap">
                      {profile.role === 'admin' && <Badge>ADMIN</Badge>}
                      {profile.disabled ? (
                        <Badge variant="destructive">已封禁</Badge>
                      ) : (
                        <Badge variant="secondary">正常</Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <Separator />
                    <div className="flex items-center gap-2.5 text-black/70">
                      <UserRound className="w-4 h-4 text-black/40" />
                      <span className="text-black/40">用户名</span>
                      <span className="ml-auto font-mono">{profile.username || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-black/70">
                      <Mail className="w-4 h-4 text-black/40" />
                      <span className="text-black/40">邮箱</span>
                      <span className="ml-auto font-mono truncate max-w-[160px]">{profile.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-black/70">
                      <Calendar className="w-4 h-4 text-black/40" />
                      <span className="text-black/40">注册时间</span>
                      <span className="ml-auto font-mono text-xs">{profile.createTime || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-black/70">
                      <Shield className="w-4 h-4 text-black/40" />
                      <span className="text-black/40">UID</span>
                      <span className="ml-auto font-mono text-xs text-black/40 truncate max-w-[140px]">{profile.uid}</span>
                    </div>
                    <Separator />
                    <UserClubStats stats={clubStats} tone="dark" signedIn />
                    <Separator />
                    <button
                      onClick={doLogout}
                      className="w-full py-2.5 rounded-full border border-black/20 hover:border-[#ff3650] hover:bg-[#ff3650]/10 text-black/70 hover:text-[#ff3650] font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>退出登录</span>
                    </button>
                  </CardContent>
                </Card>

                <ScreeningStandingCard />
              </div>

              {/* Right: tabs */}
              <Card className="border-black/10 bg-white">
                <CardContent className="p-6">
                  {/* Credentials & Year Review Banners */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <button
                      onClick={() => navigate('/credentials', { viewTransition: true })}
                      className="flex items-center gap-3 rounded-2xl border border-[#ff3650]/40 bg-gradient-to-r from-[#ff3650]/20 via-[#ff3650]/10 to-transparent p-3.5 text-left hover:border-[#ff3650] transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#ff3650] text-white flex items-center justify-center font-black shrink-0 shadow-lg">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-black text-white truncate">我的放映资历档案</span>
                        <span className="block text-xs text-black/50 truncate">3D 高光展台与打卡票根</span>
                      </span>
                      <span className="text-[#ff3650] font-black group-hover:translate-x-1 transition-transform">→</span>
                    </button>

                    <button
                      onClick={() => setYearReviewOpen(true)}
                      className="flex items-center gap-3 rounded-2xl border border-[#e0fe3d]/30 bg-gradient-to-r from-[#e0fe3d]/15 to-transparent p-3.5 text-left hover:border-[#e0fe3d]/60 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#e0fe3d] text-[#121212] flex items-center justify-center font-black shrink-0 shadow-lg">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-black text-white truncate">2026 年度回顾</span>
                        <span className="block text-xs text-black/50 truncate">年度选片与观影总览</span>
                      </span>
                      <span className="text-[#e0fe3d] font-black group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                  <Tabs defaultValue={params.get('tab') === 'votes' ? 'votes' : 'profile'} variant="segment">
                    <TabsList className="w-full sm:w-auto">
                      <TabsTrigger value="profile" className="flex-1 sm:flex-none">资料</TabsTrigger>
                      <TabsTrigger value="votes" className="flex-1 sm:flex-none">我的投票</TabsTrigger>
                      <TabsTrigger value="favorites" className="flex-1 sm:flex-none">收藏</TabsTrigger>
                      <TabsTrigger value="watch" className="flex-1 sm:flex-none">观影记录</TabsTrigger>
                      <TabsTrigger value="security" className="flex-1 sm:flex-none">安全</TabsTrigger>
                    </TabsList>

                    {/* Profile tab */}
                    <TabsContent value="profile" className="space-y-5">
                      <div className={field}>
                        <Label className="text-black/60 uppercase text-xs font-black">昵称</Label>
                        <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="输入昵称" />
                      </div>

                      <div className={field}>
                        <Label className="text-black/60 uppercase text-xs font-black">头像 URL</Label>
                        <Input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://…" />
                        <p className="text-[11px] text-black/30">填写图片直链，留空则使用首字母头像</p>
                      </div>

                      <div className="flex justify-end pt-3">
                        <button
                          onClick={save}
                          disabled={saving}
                          className="group/btn inline-flex items-center gap-2.5 bg-[#ff3650] hover:bg-[#ff203c] text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-[0_4px_16px_rgba(255,54,80,0.35)]"
                        >
                          <span className="tracking-wider">{saving ? '保存中...' : '保存资料'}</span>
                          <span className="w-5 h-5 rounded-full bg-white text-[#ff3650] flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5">
                            <Save className="w-3 h-3 stroke-[2.5]" />
                          </span>
                        </button>
                      </div>
                    </TabsContent>

                    {/* Votes & nominations tab */}
                    <TabsContent value="votes" className="space-y-5">
                      {activity === null ? (
                        <div className="py-8 flex justify-center">
                          <Loader variant="dots" size={24} label="加载投票记录" className="text-[#ff3650]" />
                        </div>
                      ) : (
                        <>
                          <div>
                            <h4 className="text-xs font-black text-black/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Vote className="w-3.5 h-3.5 text-[#ff3650]" /> 我的投票
                            </h4>
                            {activity.votes.length === 0 ? (
                              <p className="text-xs text-black/30 py-3">还没有投票记录</p>
                            ) : (
                              <div className="space-y-2">
                                {activity.votes.map((v) => (
                                  <div key={v.filmId} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${v.planned ? 'border-emerald-500/40 ring-1 ring-emerald-400/30 bg-emerald-500/5' : 'border-black/10 bg-black/30'}`}>
                                    {v.image ? <img src={v.image} alt="" className="w-9 h-12 rounded-md object-cover shrink-0" /> : <Vote className="w-4 h-4 text-[#ff3650] shrink-0" />}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-bold text-white truncate flex items-center gap-2">
                                        {v.filmTitle}
                                        {v.planned && <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40">已通过</Badge>}
                                      </p>
                                      <p className="text-xs text-black/40 truncate">叠票 {v.count} · {v.weeks} 周</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      {v.gate === 'screened' ? <Badge variant="secondary">已放映</Badge> : v.gate === 'frozen' ? <Badge>已排期</Badge> : <Badge variant="outline">可投</Badge>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-black/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <KeyRound className="w-3.5 h-3.5 text-[#e0fe3d]" /> 我的提名
                            </h4>
                            {activity.nominations.length === 0 ? (
                              <p className="text-xs text-black/30 py-3">还没有提名记录</p>
                            ) : (
                              <div className="space-y-2">
                                {activity.nominations.map((n) => (
                                  <div key={n.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${n.planned ? 'border-emerald-500/40 ring-1 ring-emerald-400/30 bg-emerald-500/5' : 'border-black/10 bg-black/30'}`}>
                                    {n.image ? <img src={n.image} alt="" className="w-9 h-12 rounded-md object-cover shrink-0" /> : <Vote className="w-4 h-4 text-[#e0fe3d] shrink-0" />}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-bold text-white truncate flex items-center gap-2">
                                        {n.filmTitle}
                                        {n.planned && <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40">已通过</Badge>}
                                      </p>
                                      <p className="text-xs text-black/40 truncate">{n.note || (n.status === 'promoted' ? '已入库' : '提名中')}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </TabsContent>

                    {/* Favorites tab */}
                    <TabsContent value="favorites" className="space-y-3">
                      {favorites === null ? (
                        <div className="py-8 flex justify-center">
                          <Loader variant="dots" size={24} label="加载收藏" className="text-[#ff3650]" />
                        </div>
                      ) : favorites.length === 0 ? (
                        <div className="py-12 text-center text-black/40">
                          <Heart className="w-8 h-8 mx-auto mb-2 text-black/20" />
                          <p className="text-sm font-bold">还没有收藏</p>
                          <p className="text-xs text-black/30 mt-1">在作品上右键「收藏」即可添加</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {favorites.map((f) => (
                            <div key={f.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/30 px-3 py-2.5">
                              {f.image ? <img src={f.image} alt="" className="w-10 h-14 rounded-md object-cover shrink-0" /> : <div className="w-10 h-14 rounded-md bg-white/5 shrink-0" />}
                              <button onClick={() => navigate(`/films/${f.id}`)} className="min-w-0 flex-1 text-left group">
                                <p className="text-sm font-bold text-white truncate group-hover:text-[#ff3650] transition-colors">{f.title_zh || f.title_en || f.title}</p>
                                <p className="text-xs text-black/40">{f.year}{f.category ? ` · ${f.category}` : ''}</p>
                              </button>
                              <button onClick={() => removeFavorite(f.id)} className="shrink-0 w-8 h-8 rounded-lg bg-white/5 hover:bg-[#ff3650] text-black/50 hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer" title="取消收藏">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Watch log tab */}
                    <TabsContent value="watch" className="space-y-3">
                      {watchLog === null ? (
                        <div className="py-8 flex justify-center">
                          <Loader variant="dots" size={24} label="加载观影记录" className="text-[#ff3650]" />
                        </div>
                      ) : watchLog.length === 0 ? (
                        <div className="py-12 text-center text-black/40">
                          <Eye className="w-8 h-8 mx-auto mb-2 text-black/20" />
                          <p className="text-sm font-bold">还没有观影记录</p>
                          <p className="text-xs text-black/30 mt-1">在作品详情页标记「已看过」并评分</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {watchLog.map((w) => (
                            <div key={w.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/30 px-3 py-2.5">
                              {w.image ? <img src={w.image} alt="" className="w-10 h-14 rounded-md object-cover shrink-0" /> : <div className="w-10 h-14 rounded-md bg-white/5 shrink-0" />}
                              <div className="min-w-0 flex-1">
                                <button onClick={() => navigate(`/films/${w.film_id}`)} className="text-left group">
                                  <p className="text-sm font-bold text-white truncate group-hover:text-[#ff3650] transition-colors">{w.film_title}</p>
                                </button>
                                <Rating value={w.rating} readOnly size={14} className="mt-0.5" />
                                {w.review && <p className="text-xs text-black/40 mt-1 line-clamp-1">「{w.review}」</p>}
                              </div>
                              <span className="shrink-0 text-[10px] text-black/30 font-mono">{w.watched_at ? w.watched_at.slice(0, 10) : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Security tab */}
                    <TabsContent value="security" className="space-y-5">
                      <div className="space-y-1.5">
                        <h3 className="font-black flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#ff3650]" /> 修改密码</h3>
                        <p className="text-xs text-black/40">修改后需重新登录。</p>
                      </div>
                      <div className={field}>
                        <Label className="text-black/60 uppercase text-xs font-black">当前密码</Label>
                        <Input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="当前密码" />
                      </div>
                      <div className={field}>
                        <Label className="text-black/60 uppercase text-xs font-black">新密码（至少 6 位）</Label>
                        <Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder="新密码" />
                      </div>
                      <div className={field}>
                        <Label className="text-black/60 uppercase text-xs font-black">确认新密码</Label>
                        <Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder="再次输入新密码" />
                      </div>
                      <div className="flex justify-end pt-3">
                        <button
                          onClick={changePassword}
                          disabled={changing}
                          className="group/btn inline-flex items-center gap-2.5 bg-[#ff3650] hover:bg-[#ff203c] text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-[0_4px_16px_rgba(255,54,80,0.35)]"
                        >
                          <span className="tracking-wider">{changing ? '提交中...' : '确认修改'}</span>
                          <span className="w-5 h-5 rounded-full bg-white text-[#ff3650] flex items-center justify-center transition-transform group-hover/btn:translate-x-0.5">
                            <KeyRound className="w-3 h-3 stroke-[2.5]" />
                          </span>
                        </button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </motion.main>

      <Footer lang={lang} />

      <YearReview open={yearReviewOpen} onClose={() => setYearReviewOpen(false)} userName={profile?.nickname || profile?.username || '影迷'} />
    </>
  );
};
