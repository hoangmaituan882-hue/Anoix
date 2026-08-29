import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSession, signIn, signUpEmail, signOut, SessionUser } from '../../lib/session';
import { KeyRound, LogIn, Mail, UserPlus } from 'lucide-react';
import { BeianLink } from '../../components/layout/Footer';

/**
 * Account page — login + email self-registration.
 * Admin-issued accounts (username/password) also log in here via the Login tab.
 */
export const AuthPage: React.FC<{ onAuthed?: (u: SessionUser) => void }> = ({ onAuthed }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [account, setAccount] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyState, setVerifyState] = useState<null | { verifyOtp: (o: { token: string }) => Promise<unknown> }>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const finish = async () => {
    const user = await getSession();
    if (user) {
      onAuthed?.(user);
      navigate(redirect ?? '/', { replace: true });
    }
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      await signIn(account.trim(), password);
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await signUpEmail(email.trim(), password);
      if (data.verifyOtp) {
        setVerifyState({ verifyOtp: data.verifyOtp });
        setNotice('验证码已发送到你的邮箱,请查收并输入。');
      } else {
        await finish();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setBusy(false);
    }
  };

  const doVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyState?.verifyOtp) return;
    setBusy(true); setError('');
    try {
      await verifyState.verifyOtp({ token: otp.trim() });
      setNotice('验证成功,正在登录...');
      await finish();
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败');
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const field = 'w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-white font-bold focus:border-[#ff3650] focus:outline-none';
  const label = 'text-xs font-bold text-white/50 uppercase tracking-wider';

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center px-4 selection:bg-[#ff3650] selection:text-white">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="text-center">
          <p className="text-xs font-black text-[#ff3650] uppercase tracking-widest mb-1">Anoix Account</p>
          <h1 className="text-2xl font-black text-[#f5ffe5]">账号</h1>
        </div>

        {!verifyState ? (
          <>
            <div className="flex gap-1 bg-black/40 rounded-full p-1">
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); setNotice(''); }}
                  className={`flex-1 py-2 rounded-full text-sm font-black transition-colors cursor-pointer ${
                    tab === t ? 'bg-[#ff3650] text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t === 'login' ? '登录' : '注册'}
                </button>
              ))}
            </div>

            {tab === 'login' ? (
              <form onSubmit={doLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className={label}>用户名或邮箱</label>
                  <input value={account} onChange={(e) => setAccount(e.target.value)} className={field} autoComplete="username" required />
                </div>
                <div className="space-y-1">
                  <label className={label}>密码</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} autoComplete="current-password" required />
                </div>
                <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-[#ff3650] hover:bg-[#e02640] disabled:opacity-50 text-white font-black uppercase tracking-wider py-3 rounded-xl transition-colors cursor-pointer">
                  <LogIn className="w-4 h-4" /> {busy ? '登录中...' : '登录'}
                </button>
              </form>
            ) : (
              <form onSubmit={doRegister} className="space-y-4">
                <div className="space-y-1">
                  <label className={label}>邮箱</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="email" required />
                </div>
                <div className="space-y-1">
                  <label className={label}>密码(至少 8 位)</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} autoComplete="new-password" minLength={8} required />
                </div>
                <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-[#ff3650] hover:bg-[#e02640] disabled:opacity-50 text-white font-black uppercase tracking-wider py-3 rounded-xl transition-colors cursor-pointer">
                  <UserPlus className="w-4 h-4" /> {busy ? '发送验证码...' : '注册'}
                </button>
              </form>
            )}
          </>
        ) : (
          <form onSubmit={doVerify} className="space-y-4">
            <div className="space-y-1">
              <label className={label}>邮箱验证码</label>
              <input value={otp} onChange={(e) => setOtp(e.target.value)} className={field} placeholder="输入收到的 6 位验证码" required />
            </div>
            <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-[#ff3650] hover:bg-[#e02640] disabled:opacity-50 text-white font-black uppercase tracking-wider py-3 rounded-xl transition-colors cursor-pointer">
              <KeyRound className="w-4 h-4" /> {busy ? '验证中...' : '验证并完成注册'}
            </button>
          </form>
        )}

        {notice && <p className="text-sm font-bold text-[#e0fe3d]">{notice}</p>}
        {error && <p className="text-sm font-bold text-[#ff3650]">{error}</p>}

        <button onClick={doLogout} className="w-full text-center text-xs font-bold text-white/40 hover:text-[#ff3650] transition-colors cursor-pointer">
          退出当前账号
        </button>
      </div>
      <BeianLink className="mt-8 text-xs text-white/40 hover:text-white/70 transition-colors" />
    </div>
  );
};
