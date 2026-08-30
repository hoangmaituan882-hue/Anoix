import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminUsers } from '../../lib/adminUsers';
import { AdminUser } from '../../types/user';
import { Loader } from '../../components/motion/loader';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { AnimatedNumber } from '../../components/motion/AnimatedNumber';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Search, UserPlus, Shield, ShieldOff, Ban, CheckCircle2,
  KeyRound, Trash2, Mail, X, AlertCircle, User, Lock,
} from 'lucide-react';

const LABEL = 'text-xs font-black text-white/60 uppercase tracking-wider block mb-1';

type RoleFilter = 'all' | 'user' | 'admin';
type StatusFilter = 'all' | 'active' | 'disabled';

const avatarCls = (u: AdminUser) =>
  u.role === 'admin'
    ? 'bg-[#ff3650]/20 text-[#ff3650] border-[#ff3650]/40'
    : 'bg-white/10 text-white/60 border-white/15';

/** Club admin — CloudBase accounts and roles. */
export const UsersAdmin: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState({ username: '', password: '' });
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [confirm, setConfirm] = useState<{ title: string; desc?: string; action: () => void } | null>(null);

  const { success, error: toastError } = useToast();

  const reload = useCallback(async () => {
    setError('');
    try {
      const data = await adminUsers.list();
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载用户列表失败');
      setUsers([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? !u.disabled : u.disabled);
      if (!matchRole || !matchStatus) return false;
      if (!q) return true;
      return [u.nickname, u.username, u.email, u.uid].some(
        (v) => v && v.toLowerCase().includes(q),
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const adminCount = (users ?? []).filter((u) => u.role === 'admin').length;

  const setRole = async (u: AdminUser, role: 'user' | 'admin') => {
    setBusy(true);
    try {
      await adminUsers.update(u.uid, { role });
      await reload();
      success(role === 'admin' ? `已授予 ${u.nickname || u.username} 管理员` : `已撤销 ${u.nickname || u.username} 的管理员`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : '角色变更失败');
    } finally {
      setBusy(false);
    }
  };

  const setDisabled = async (u: AdminUser, disabled: boolean) => {
    setBusy(true);
    try {
      await adminUsers.update(u.uid, { disabled });
      await reload();
      success(disabled ? `已封禁 ${u.nickname || u.username}（禁止登录）` : `已解封 ${u.nickname || u.username}`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : '状态变更失败');
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    setBusy(true);
    try {
      if (!createDraft.username.trim() || createDraft.password.length < 6) {
        throw new Error('用户名必填，密码至少 6 位');
      }
      await adminUsers.create(createDraft.username.trim(), createDraft.password);
      setCreateDraft({ username: '', password: '' });
      setCreateOpen(false);
      await reload();
      success(`已创建账号 ${createDraft.username.trim()}`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!resetTarget) return;
    setBusy(true);
    try {
      if (resetPwd.length < 6) throw new Error('密码至少 6 位');
      await adminUsers.update(resetTarget.uid, { password: resetPwd });
      setResetPwd('');
      setResetTarget(null);
      success(`已重置 ${resetTarget.nickname || resetTarget.username} 的密码`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : '重置失败');
    } finally {
      setBusy(false);
    }
  };

  const remove = (u: AdminUser) => {
    setConfirm({
      title: `确认删除用户「${u.nickname || u.username}」?`,
      desc: '该账号将被永久删除，历史登录态失效，此操作不可恢复。',
      action: async () => {
        setBusy(true);
        try {
          await adminUsers.remove(u.uid);
          await reload();
          success(`已删除 ${u.nickname || u.username}`);
        } catch (e) {
          toastError(e instanceof Error ? e.message : '删除失败');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  if (users === null) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader variant="comet" size={32} label="加载用户数据..." className="text-[#ff3650]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              ACCOUNT DIRECTORY
            </span>
            <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
              <AnimatedNumber value={users.length} /> 个账号
            </span>
            <span className="bg-[#ff3650]/15 text-[#ff3650] px-2 py-0.5 rounded-full text-xs font-mono font-bold border border-[#ff3650]/30">
              {adminCount} 管理员
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">用户管理</h2>
          <p className="text-xs text-white/50">管理登录账号、管理员角色与登录封禁（封禁即禁止登录）</p>
        </div>

        <Button
          size="lg"
          onClick={() => { setCreateDraft({ username: '', password: '' }); setCreateOpen(true); }}
          className="active:scale-95 shadow-[0_8px_20px_rgba(255,54,80,0.3)]"
        >
          <UserPlus className="w-4 h-4" />
          新建账号
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/40 flex items-center gap-3 text-sm font-bold text-[#ff3650]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181818] p-4 rounded-2xl border border-white/10">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名 / 昵称 / 邮箱 / UID..."
            className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/40 focus:border-[#ff3650] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-0.5">
            {(['all', 'user', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                  roleFilter === r ? 'bg-[#ff3650] text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {r === 'all' ? '全部角色' : r === 'admin' ? '管理员' : '普通用户'}
              </button>
            ))}
          </div>
          <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-0.5">
            {(['all', 'active', 'disabled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                  statusFilter === s ? 'bg-[#e0fe3d] text-[#121212]' : 'text-white/60 hover:text-white'
                }`}
              >
                {s === 'all' ? '全部状态' : s === 'active' ? '正常' : '已封禁'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User list */}
      {filtered.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-16 text-center space-y-3">
          <User className="w-12 h-12 text-white/20 mx-auto" />
          <p className="text-base font-bold text-white/70">未找到匹配的用户</p>
          <p className="text-xs text-white/40">可尝试重置筛选条件或新建账号</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl divide-y divide-white/5">
          {filtered.map((u) => (
            <div key={u.uid} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-white/[0.03] transition-colors">
              {/* Avatar + identity */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-black text-base shrink-0 ${avatarCls(u)}`}>
                  {(u.nickname || u.username || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {u.userNo && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#ff3650]/15 text-[#ff3650] border border-[#ff3650]/40 font-mono">NO.{u.userNo}</span>}
                    <span className="font-black text-white truncate">{u.nickname || u.username || u.uid}</span>
                    {u.role === 'admin' && <Badge>ADMIN</Badge>}
                    {u.disabled ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">已封禁</span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">正常</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40 font-mono mt-1 flex-wrap">
                    {u.username && <span>@{u.username}</span>}
                    {u.email && (
                      <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</span>
                    )}
                    <span className="text-white/25">{u.uid}</span>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="hidden xl:flex items-center gap-6 text-xs text-white/40 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-white/30 uppercase block">注册时间</span>
                  <span className="font-mono">{u.registeredAt ? u.registeredAt.slice(0, 10) : (u.createTime || '—')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/30 uppercase block">密码</span>
                  <span className={`font-mono ${u.hasPassword ? 'text-emerald-400' : 'text-white/30'}`}>{u.hasPassword ? '已设置' : '未设置'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  onClick={() => setRole(u, u.role === 'admin' ? 'user' : 'admin')}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer disabled:opacity-40 border border-white/10 bg-white/5 hover:bg-white/15 text-white"
                  title={u.role === 'admin' ? '撤销管理员' : '设为管理员'}
                >
                  {u.role === 'admin' ? <ShieldOff className="w-3.5 h-3.5 text-[#ff3650]" /> : <Shield className="w-3.5 h-3.5 text-[#e0fe3d]" />}
                  {u.role === 'admin' ? '撤销管理员' : '设为管理员'}
                </button>
                <button
                  onClick={() => setDisabled(u, !u.disabled)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer disabled:opacity-40 border border-white/10 bg-white/5 hover:bg-white/15 text-white"
                  title={u.disabled ? '解封' : '封禁登录'}
                >
                  {u.disabled ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Ban className="w-3.5 h-3.5 text-[#ff3650]" />}
                  {u.disabled ? '解封' : '封禁'}
                </button>
                <button
                  onClick={() => { setResetTarget(u); setResetPwd(''); }}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer disabled:opacity-40 border border-white/10 bg-white/5 hover:bg-white/15 text-white"
                  title="重置密码"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#e0fe3d]" />
                  重置密码
                </button>
                <button
                  onClick={() => remove(u)}
                  disabled={busy}
                  className="p-1.5 rounded-lg text-white/30 hover:text-[#ff3650] hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
                  title="删除账号"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={() => setCreateOpen(false)}>
          <div className="w-full max-w-md bg-[#181818] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-5 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/30 flex items-center justify-center text-[#ff3650]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg">新建账号</h3>
              </div>
              <button onClick={() => setCreateOpen(false)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className={LABEL}>用户名 *</label>
                <Input value={createDraft.username} onChange={(e) => setCreateDraft({ ...createDraft, username: e.target.value })} placeholder="用于登录的用户名" autoFocus />
              </div>
              <div className="space-y-1">
                <label className={LABEL}>密码 *（至少 6 位）</label>
                <div className="relative">
                  <Input type="text" value={createDraft.password} onChange={(e) => setCreateDraft({ ...createDraft, password: e.target.value })} placeholder="初始密码" className="pr-10" />
                  <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
              <Button onClick={create} disabled={busy}>
                <UserPlus className="w-4 h-4" /> {busy ? '创建中...' : '创建账号'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={() => setResetTarget(null)}>
          <div className="w-full max-w-md bg-[#181818] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-5 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#e0fe3d]/15 border border-[#e0fe3d]/30 flex items-center justify-center text-[#e0fe3d]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">重置密码</h3>
                  <p className="text-xs text-white/40">{resetTarget.nickname || resetTarget.username}</p>
                </div>
              </div>
              <button onClick={() => setResetTarget(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className={LABEL}>新密码 *（至少 6 位）</label>
              <Input type="text" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} placeholder="输入新密码" autoFocus />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>取消</Button>
              <Button onClick={resetPassword} disabled={busy} className="bg-[#e0fe3d] text-[#121212] hover:bg-white">
                <KeyRound className="w-4 h-4" /> {busy ? '重置中...' : '确认重置'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        description={confirm?.desc}
        onConfirm={() => confirm?.action()}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
};
