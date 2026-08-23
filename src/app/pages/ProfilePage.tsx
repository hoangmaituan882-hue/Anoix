import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language } from '../../types';
import { AdminUser } from '../../types/user';
import { me } from '../../lib/me';
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
import { ArrowLeft, Mail, Calendar, Shield, KeyRound, UserRound, Save } from 'lucide-react';

const GENDERS = ['未设置', '男', '女', '其他'];

export const ProfilePage: React.FC<{
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (m: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}> = ({ lang, setLang, onOpenModal }) => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ nickname: '', gender: '', avatarUrl: '', country: '', province: '', city: '' });
  const [saving, setSaving] = useState(false);

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    try {
      const user = await getSession();
      if (!user) {
        navigate('/auth?redirect=/profile', { replace: true });
        return;
      }
      const p = await me.get();
      setProfile(p);
      setForm({
        nickname: p.nickname || '',
        gender: p.gender || '',
        avatarUrl: p.avatarUrl || '',
        country: p.country || '',
        province: p.province || '',
        city: p.city || '',
      });
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
      await me.update({
        nickname: form.nickname.trim(),
        gender: form.gender === '未设置' ? '' : form.gender,
        avatarUrl: form.avatarUrl.trim(),
        country: form.country.trim(),
        province: form.province.trim(),
        city: form.city.trim(),
      });
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
        className="w-full min-h-screen bg-[#151515] px-4 sm:px-8 lg:px-12 py-24 lg:py-28 text-[#f5ffe5]"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: TRIGGER_EASE }}
      >
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-[#ff3650] font-bold text-xs uppercase tracking-wider transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '返回首页' : 'BACK TO HOME'}</span>
          </button>

          <div className="mb-8">
            <p className="text-xs font-black text-[#ff3650] uppercase tracking-widest mb-1">Anoix Account</p>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">个人资料</h1>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader variant="comet" size={36} label="加载资料" className="text-[#ff3650]" />
            </div>
          ) : !profile ? (
            <Card className="border-white/10 bg-[#1a1a1a]">
              <CardContent className="p-12 text-center space-y-4">
                <p className="text-white/60 font-bold">未找到账号信息</p>
                <Button onClick={() => navigate('/auth?redirect=/profile')}>去登录</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
              {/* Left: identity card */}
              <Card className="border-white/10 bg-[#1a1a1a]">
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
                  <div className="flex items-center gap-2.5 text-white/70">
                    <UserRound className="w-4 h-4 text-white/40" />
                    <span className="text-white/40">用户名</span>
                    <span className="ml-auto font-mono">{profile.username || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white/70">
                    <Mail className="w-4 h-4 text-white/40" />
                    <span className="text-white/40">邮箱</span>
                    <span className="ml-auto font-mono truncate max-w-[160px]">{profile.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white/70">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <span className="text-white/40">注册时间</span>
                    <span className="ml-auto font-mono text-xs">{profile.createTime || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white/70">
                    <Shield className="w-4 h-4 text-white/40" />
                    <span className="text-white/40">UID</span>
                    <span className="ml-auto font-mono text-xs text-white/40 truncate max-w-[140px]">{profile.uid}</span>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full" onClick={doLogout}>退出登录</Button>
                </CardContent>
              </Card>

              {/* Right: tabs */}
              <Card className="border-white/10 bg-[#1a1a1a]">
                <CardContent className="p-6">
                  <Tabs defaultValue="profile">
                    <TabsList className="w-full sm:w-auto">
                      <TabsTrigger value="profile" className="flex-1 sm:flex-none">资料</TabsTrigger>
                      <TabsTrigger value="security" className="flex-1 sm:flex-none">安全</TabsTrigger>
                    </TabsList>

                    {/* Profile tab */}
                    <TabsContent value="profile" className="space-y-5">
                      <div className={field}>
                        <Label className="text-white/60 uppercase text-xs font-black">昵称</Label>
                        <Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="输入昵称" />
                      </div>

                      <div className={field}>
                        <Label className="text-white/60 uppercase text-xs font-black">性别</Label>
                        <div className="flex flex-wrap gap-2">
                          {GENDERS.map((g) => {
                            const active = (form.gender || '未设置') === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setForm({ ...form, gender: g })}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer border ${
                                  active
                                    ? 'bg-[#ff3650] text-white border-[#ff3650]'
                                    : 'bg-black/40 text-white/60 border-white/15 hover:text-white'
                                }`}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className={field}>
                        <Label className="text-white/60 uppercase text-xs font-black">头像 URL</Label>
                        <Input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://…" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className={field}>
                          <Label className="text-white/60 uppercase text-xs font-black">国家</Label>
                          <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="国家" />
                        </div>
                        <div className={field}>
                          <Label className="text-white/60 uppercase text-xs font-black">省份</Label>
                          <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="省份" />
                        </div>
                        <div className={field}>
                          <Label className="text-white/60 uppercase text-xs font-black">城市</Label>
                          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="城市" />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button onClick={save} disabled={saving}>
                          <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存资料'}
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Security tab */}
                    <TabsContent value="security" className="space-y-5">
                      <div className="space-y-1.5">
                        <h3 className="font-black flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#ff3650]" /> 修改密码</h3>
                        <p className="text-xs text-white/40">修改后需重新登录。</p>
                      </div>
                      <div className={field}>
                        <Label className="text-white/60 uppercase text-xs font-black">当前密码</Label>
                        <Input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="当前密码" />
                      </div>
                      <div className={field}>
                        <Label className="text-white/60 uppercase text-xs font-black">新密码（至少 6 位）</Label>
                        <Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder="新密码" />
                      </div>
                      <div className={field}>
                        <Label className="text-white/60 uppercase text-xs font-black">确认新密码</Label>
                        <Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} placeholder="再次输入新密码" />
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button onClick={changePassword} disabled={changing}>
                          <KeyRound className="w-4 h-4" /> {changing ? '提交中...' : '确认修改'}
                        </Button>
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
    </>
  );
};
