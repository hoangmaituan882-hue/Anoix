import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/cloudbase';
import { repository } from '../../lib/repository';
import { adminFilms, adminNews, filmToRow, rowToFilm, FilmRow, NewsRow } from '../../lib/pgAdmin';
import { WorkItem } from '../../types';
import { Loader } from '../../components/motion/loader';
import { ScreeningsAdmin } from '../../features/admin/ScreeningsAdmin';
import { RoundsAdmin } from '../../features/admin/RoundsAdmin';
import { TriggerLogo } from '../../components/ui/TriggerLogo';
import {
  ArrowLeft,
  LogOut,
  Plus,
  Save,
  Trash2,
  X,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Film,
  Newspaper,
  Calendar,
  Vote,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  ExternalLink,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  User,
  SlidersHorizontal,
  Layers,
  Flame,
  Activity,
  Tv,
} from 'lucide-react';

type AuthState = 'checking' | 'signed-out' | 'signed-in';

const TEMP_ADMIN_KEY = 'anoix_temp_admin_session';

export const AdminPage: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [isTempAdmin, setIsTempAdmin] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1. Check local temporary admin session first
      const hasTempAdmin = sessionStorage.getItem(TEMP_ADMIN_KEY) === 'true';
      if (hasTempAdmin) {
        if (alive) {
          setIsTempAdmin(true);
          setAuthState('signed-in');
        }
        return;
      }

      // 2. Check CloudBase session if available
      if (auth) {
        try {
          const { data } = await auth.getSession();
          const session = data?.session;
          if (alive) {
            setAuthState(session && !session.user?.is_anonymous ? 'signed-in' : 'signed-out');
          }
          return;
        } catch {
          // fallback to signed-out
        }
      }

      if (alive) setAuthState('signed-out');
    })();
    return () => { alive = false; };
  }, []);

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4 text-white">
        <TriggerLogo className="w-40 text-[#ff3650] animate-pulse" />
        <Loader variant="comet" size={40} label="TRIGGER CONSOLE · INITIALIZING" className="text-[#ff3650]" />
      </div>
    );
  }

  return authState === 'signed-in' ? (
    <AdminPanel
      isTempAdmin={isTempAdmin}
      onSignOut={() => {
        sessionStorage.removeItem(TEMP_ADMIN_KEY);
        setIsTempAdmin(false);
        setAuthState('signed-out');
      }}
    />
  ) : (
    <AdminLogin
      onSignedIn={(temp = false) => {
        if (temp) {
          sessionStorage.setItem(TEMP_ADMIN_KEY, 'true');
          setIsTempAdmin(true);
        }
        setAuthState('signed-in');
      }}
    />
  );
};

// ---------------- Redesigned Studio TRIGGER Admin Login ----------------
const AdminLogin: React.FC<{ onSignedIn: (isTemp?: boolean) => void }> = ({ onSignedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    // Quick match for built-in temporary administrator credentials:
    // admin / trigger2026 or root / trigger
    if (
      (username.trim().toLowerCase() === 'admin' && password === 'trigger2026') ||
      (username.trim().toLowerCase() === 'trigger' && password === 'trigger') ||
      (username.trim().toLowerCase() === 'root' && password === 'admin123')
    ) {
      setTimeout(() => {
        onSignedIn(true);
      }, 300);
      return;
    }

    try {
      if (!auth) {
        throw new Error('CloudBase 数据库未初始化，建议使用下方【临时管理员】快捷进入');
      }
      const { data, error } = await auth.signInWithPassword({ username, password });
      if (error || !data?.session) throw new Error(error?.message ?? '账号或密码不正确');
      onSignedIn(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录验证失败');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickTempAdmin = () => {
    onSignedIn(true);
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#ff3650] selection:text-white">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#ff3650]/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ff3650]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#4246ff]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Futuristic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <TriggerLogo className="w-44 mx-auto text-white group-hover:text-[#ff3650] transition-colors" />
          </Link>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[11px] font-black tracking-[0.25em] text-[#ff3650] uppercase">
              CONSOLE OS 2.0
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e0fe3d] animate-ping" />
            <span className="text-[10px] font-mono text-white/40 uppercase">
              STUDIO TRIGGER ADMIN
            </span>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-[#181818]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">管理后台登录</h1>
              <p className="text-xs text-white/50 mt-0.5">控制台系统维护与内容发布</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/30 flex items-center justify-center text-[#ff3650]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#ff3650]" />
                管理员账号
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入管理员用户名 (如 admin)"
                autoComplete="username"
                className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none placeholder:text-white/30 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#ff3650]" />
                安全密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  autoComplete="current-password"
                  className="w-full bg-black/50 border border-white/15 rounded-2xl px-4 py-3 pr-11 text-white text-sm font-bold focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none placeholder:text-white/30 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/40 flex items-start gap-2.5 text-xs font-bold text-[#ff3650] animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#ff3650] hover:bg-[#ff203c] active:scale-[0.98] disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-2xl transition-all cursor-pointer shadow-[0_8px_20px_rgba(255,54,80,0.35)] flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <Loader variant="comet" size={16} className="text-white" />
                  <span>正在验证身份...</span>
                </>
              ) : (
                <span>验证并登录控制台</span>
              )}
            </button>
          </form>

          {/* Quick 1-Click Temp Admin Entry */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <button
              type="button"
              onClick={handleQuickTempAdmin}
              className="w-full bg-white/5 hover:bg-[#e0fe3d] hover:text-[#121212] text-white border border-white/15 hover:border-[#e0fe3d] text-xs font-black py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-sm active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4 text-[#e0fe3d] group-hover:text-[#121212] transition-colors" />
              <span>一键以临时管理员进入后台 (Direct Access)</span>
            </button>

            <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-[11px] text-white/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white/70">内置测试凭证：</span>
                <span className="text-[#e0fe3d] font-mono font-black">免配直通</span>
              </div>
              <p className="font-mono text-white/40">
                账号: <span className="text-white">admin</span> | 密码: <span className="text-white">trigger2026</span>
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-[#ff3650] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回 TRIGGER 官方网站首页</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- Redesigned Studio TRIGGER Admin Panel ----------------
const AdminPanel: React.FC<{ onSignOut: () => void; isTempAdmin?: boolean }> = ({ onSignOut, isTempAdmin = false }) => {
  const [tab, setTab] = useState<'films' | 'news' | 'screenings' | 'rounds'>('films');
  const [filmsCount, setFilmsCount] = useState<number>(0);
  const [newsCount, setNewsCount] = useState<number>(0);

  useEffect(() => {
    // Initial fetch counts for badges
    void adminFilms.list().then((res) => res && setFilmsCount(res.length)).catch(() => {});
    void adminNews.list().then((res) => res && setNewsCount(res.length)).catch(() => {});
  }, []);

  const signOut = async () => {
    if (auth) {
      try {
        await auth.signOut();
      } catch {
        // ignore
      }
    }
    onSignOut();
  };

  interface TabItem {
    key: 'films' | 'news' | 'screenings' | 'rounds';
    label: string;
    en: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }

  const TABS: TabItem[] = [
    { key: 'films', label: '作品资料库', en: 'WORKS', icon: Film, count: filmsCount },
    { key: 'news', label: '动态与公告', en: 'NEWS', icon: Newspaper, count: newsCount },
    { key: 'screenings', label: '放映会档案', en: 'SCREENINGS', icon: Calendar },
    { key: 'rounds', label: '选片与投票', en: 'VOTING', icon: Vote },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-[#f5ffe5] selection:bg-[#ff3650] selection:text-white flex flex-col">
      {/* Top Console Navigation Bar */}
      <header className="border-b border-white/10 bg-[#161616]/95 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Brand Status */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <TriggerLogo className="w-28 sm:w-32 text-white group-hover:text-[#ff3650] transition-colors" />
              <div className="h-6 w-px bg-white/20 hidden sm:block" />
              <div className="hidden sm:block">
                <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-widest block leading-none">
                  ADMIN CONSOLE
                </span>
                <span className="text-[11px] font-bold text-white/50 leading-none">
                  v2.0 STUDIO TRIGGER
                </span>
              </div>
            </Link>

            {isTempAdmin ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-[#e0fe3d]/15 text-[#e0fe3d] border border-[#e0fe3d]/30 shadow-sm">
                <UserCheck className="w-3.5 h-3.5" />
                <span>临时管理员 (LOCAL MOCK)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>CLOUDBASE CONNECTED</span>
              </span>
            )}
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10 overflow-x-auto scrollbar-none">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#ff3650] text-white shadow-[0_4px_12px_rgba(255,54,80,0.35)]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-[#ff3650]'}`} />
                  <span>{t.label}</span>
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      active ? 'bg-black/30 text-white' : 'bg-white/10 text-white/60'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & Logout */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-bold text-white transition-all border border-white/10"
              title="查看前台网站"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#e0fe3d]" />
              <span className="hidden sm:inline">访问前台</span>
            </Link>

            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ff3650]/15 hover:bg-[#ff3650] text-[#ff3650] hover:text-white text-xs font-black transition-all border border-[#ff3650]/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Canvas */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex-1">
        {tab === 'films' && <FilmsAdmin onCountChange={setFilmsCount} />}
        {tab === 'news' && <NewsAdmin onCountChange={setNewsCount} />}
        {tab === 'screenings' && <ScreeningsAdmin />}
        {tab === 'rounds' && <RoundsAdmin />}
      </main>

      {/* Footer System Status */}
      <footer className="border-t border-white/10 bg-[#141414] py-4 px-4 sm:px-8 text-center text-xs text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
          <p>© 2026 TRIGGER INC. ALL RIGHTS RESERVED. / ANOIX CONSOLE</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#e0fe3d]" />
              <span>NODE: EAST-ASIA-1</span>
            </span>
            <span>API: HEALTHY</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ---------------- Refactored Films CRUD Component ----------------
const EMPTY_FILM: WorkItem = {
  id: '', title: '', year: '2026', category: 'TV Series', image: '', description: '', isNew: true,
};

const FIELD = 'w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-sm font-medium focus:border-[#ff3650] focus:ring-1 focus:ring-[#ff3650] focus:outline-none transition-all placeholder:text-white/30';
const LABEL = 'text-xs font-black text-white/60 uppercase tracking-wider block mb-1';

const FilmsAdmin: React.FC<{ onCountChange?: (count: number) => void }> = ({ onCountChange }) => {
  const [rows, setRows] = useState<FilmRow[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<WorkItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'TV Series' | 'Movie' | 'Original Animation'>('all');

  const reload = useCallback(async () => {
    setError('');
    try {
      const data = await adminFilms.list();
      setRows(data ?? []);
      if (data && onCountChange) onCountChange(data.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载作品列表失败');
      setRows([]);
    }
  }, [onCountChange]);

  useEffect(() => { void reload(); }, [reload]);

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`确认删除《${title}》?此操作不可恢复。`)) return;
    setBusy(true);
    try {
      await adminFilms.remove(id);
      await reload();
      void repository.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setBusy(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      const matchesCategory =
        categoryFilter === 'all' ||
        r.category.toLowerCase().includes(categoryFilter.toLowerCase());
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.title_zh && r.title_zh.toLowerCase().includes(q)) ||
        (r.title_en && r.title_en.toLowerCase().includes(q)) ||
        (r.director && r.director.toLowerCase().includes(q)) ||
        r.year.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery, categoryFilter]);

  if (rows === null) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader variant="comet" size={32} label="加载作品数据库..." className="text-[#ff3650]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest flex items-center gap-1">
              <Film className="w-3.5 h-3.5" />
              WORKS REPOSITORY
            </span>
            <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
              {rows.length} 部作品
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">TRIGGER 动画作品管理</h2>
          <p className="text-xs text-white/50">管理官网全量影视库、海报、制作主创与预告片链接</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditing({ ...EMPTY_FILM, id: `trigger-work-${Date.now().toString().slice(-4)}` })}
            className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] active:scale-95 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all cursor-pointer shadow-[0_8px_20px_rgba(255,54,80,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>新增作品 (NEW WORK)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/40 flex items-center gap-3 text-sm font-bold text-[#ff3650]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181818] p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {(['all', 'TV Series', 'Movie', 'Original Animation'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#ff3650] text-white shadow-md'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat === 'all' ? `全部 (${rows.length})` : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索作品名、监督或年份..."
              className="w-full bg-black/40 border border-white/15 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-[#ff3650] focus:outline-none"
            />
          </div>

          <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#ff3650] text-white' : 'text-white/40 hover:text-white'
              }`}
              title="卡片矩阵视图"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#ff3650] text-white' : 'text-white/40 hover:text-white'
              }`}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Grid vs Table */}
      {filteredRows.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-16 text-center space-y-3">
          <Film className="w-12 h-12 text-white/20 mx-auto" />
          <p className="text-base font-bold text-white/70">未找到匹配的作品</p>
          <p className="text-xs text-white/40">可尝试重置搜索词或添加一部全新作品</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRows.map((r) => (
            <div
              key={r.id}
              className="bg-[#1a1a1a] border border-white/10 hover:border-[#ff3650] rounded-2xl overflow-hidden transition-all duration-300 flex flex-col group hover:shadow-[0_10px_25px_rgba(255,54,80,0.2)]"
            >
              {/* Poster Thumbnail */}
              <div className="relative aspect-[16/10] bg-black overflow-hidden">
                <img
                  src={r.image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600'}
                  alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black text-white border border-white/15">
                  {r.year}
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {r.is_new && (
                    <span className="bg-[#ff3650] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                      NEW
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="bg-black/80 backdrop-blur-md text-[10px] font-black text-[#ff3650] uppercase px-2 py-0.5 rounded border border-[#ff3650]/40">
                    {r.category}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-black text-white line-clamp-1 group-hover:text-[#ff3650] transition-colors">
                    {r.title_zh ?? r.title}
                  </h3>
                  <p className="text-[11px] text-white/40 font-mono line-clamp-1 mt-0.5">
                    {r.title}
                  </p>
                  {r.director && (
                    <p className="text-xs text-white/60 mt-2 flex items-center gap-1.5">
                      <span className="text-[#ff3650] font-bold">监督:</span> {r.director}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-white/30 truncate max-w-[100px]">{r.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(rowToFilm(r))}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#e0fe3d]" />
                      <span>编辑</span>
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => remove(r.id, r.title_zh ?? r.title)}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-[#ff3650] text-white/40 hover:text-white transition-colors cursor-pointer"
                      title="删除作品"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/10 bg-black/30">
                <th className="px-4 py-3.5 font-black text-xs uppercase">封面</th>
                <th className="px-4 py-3.5 font-black text-xs uppercase">作品标题</th>
                <th className="px-4 py-3.5 font-black text-xs uppercase">年份</th>
                <th className="px-4 py-3.5 font-black text-xs uppercase">类型</th>
                <th className="px-4 py-3.5 font-black text-xs uppercase">监督</th>
                <th className="px-4 py-3.5 font-black text-xs uppercase text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRows.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <img
                      src={r.image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600'}
                      alt=""
                      className="w-12 h-16 rounded-lg object-cover border border-white/10"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-black text-white">{r.title_zh ?? r.title}</div>
                    <div className="text-xs text-white/40 font-mono">{r.title}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-white/70">{r.year}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#ff3650]">
                      {r.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70 text-xs">{r.director || '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditing(rowToFilm(r))}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-[#ff3650] text-xs font-bold text-white transition-colors cursor-pointer"
                      >
                        编辑
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => remove(r.id, r.title_zh ?? r.title)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-[#ff3650] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modern Redesigned Film Modal */}
      {editing && (
        <FilmFormModal
          initial={editing}
          isNew={!editing.id || editing.id.startsWith('trigger-work-')}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void reload(); }}
        />
      )}
    </div>
  );
};

// ---------------- Redesigned Film Form Modal ----------------
const FilmFormModal: React.FC<{
  initial: WorkItem;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, isNew, onClose, onSaved }) => {
  const [form, setForm] = useState<WorkItem>(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof WorkItem>(key: K, value: WorkItem[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (!form.id.trim() || !form.title.trim()) throw new Error('ID 和原文标题为必填项');
      const id = form.id.trim();
      const row = filmToRow({ ...form, id });
      delete (row as Partial<FilmRow>).sort_order;
      if (isNew) {
        await adminFilms.create(row);
      } else {
        const { id: _drop, ...patch } = row;
        await adminFilms.update(id, patch);
      }
      void repository.refresh();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#181818] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/30 flex items-center justify-center text-[#ff3650]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#ff3650] uppercase tracking-widest block">
                TRIGGER WORKS REPO
              </span>
              <h3 className="text-xl font-black text-white">
                {isNew ? '新增动画作品' : `编辑作品: ${form.titleZh || form.title}`}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={LABEL}>作品唯一 ID (Slug) *</label>
            <input
              value={form.id}
              onChange={(e) => set('id', e.target.value)}
              disabled={!isNew}
              placeholder="如 dungeon-meshi"
              className={`${FIELD} disabled:opacity-40 font-mono`}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>原文名 (日文/原名) *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="如 ダンジョン飯"
              className={FIELD}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>中文标题</label>
            <input
              value={form.titleZh ?? ''}
              onChange={(e) => set('titleZh', e.target.value)}
              placeholder="如 迷宫饭"
              className={FIELD}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>英文标题</label>
            <input
              value={form.titleEn ?? ''}
              onChange={(e) => set('titleEn', e.target.value)}
              placeholder="如 Delicious in Dungeon"
              className={FIELD}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>年份 (Release Year)</label>
            <input
              value={form.year}
              onChange={(e) => set('year', e.target.value)}
              placeholder="2026"
              className={FIELD}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>作品分类 (Category)</label>
            <div className="flex gap-2">
              <input
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                placeholder="TV Series / Theatrical Movie"
                className={FIELD}
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className={LABEL}>竖版海报图片 URL (Poster URL)</label>
            <div className="flex gap-3 items-center">
              <input
                value={form.image}
                onChange={(e) => set('image', e.target.value)}
                placeholder="https://..."
                className={FIELD}
              />
              {form.image && (
                <img
                  src={form.image}
                  alt="preview"
                  className="w-10 h-14 rounded-lg object-cover border border-white/20 flex-shrink-0"
                />
              )}
            </div>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className={LABEL}>横版海报图片 URL (Landscape / Hero URL - 可选)</label>
            <input
              value={form.landscapeImage ?? ''}
              onChange={(e) => set('landscapeImage', e.target.value)}
              placeholder="https://..."
              className={FIELD}
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className={LABEL}>作品标语 / 宣传语 (Tagline)</label>
            <input
              value={form.tagline ?? ''}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="如 吃，还是被吃。这就是迷宫。"
              className={FIELD}
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className={LABEL}>中文剧情梗概 (Story Intro)</label>
            <textarea
              value={form.descriptionZh ?? ''}
              onChange={(e) => set('descriptionZh', e.target.value)}
              rows={3}
              placeholder="输入作品背景故事介绍..."
              className={FIELD}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>监督 (Director)</label>
            <input
              value={form.director ?? ''}
              onChange={(e) => set('director', e.target.value)}
              placeholder="如 今石洋之 / 雨宫哲"
              className={FIELD}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>角色设计 (Character Design)</label>
            <input
              value={form.characterDesign ?? ''}
              onChange={(e) => set('characterDesign', e.target.value)}
              placeholder="如 吉成曜 / 坂本胜"
              className={FIELD}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>系列构成 (Series Composition)</label>
            <input
              value={form.seriesComposition ?? ''}
              onChange={(e) => set('seriesComposition', e.target.value)}
              placeholder="如 中岛一基"
              className={FIELD}
            />
          </div>

          <div className="space-y-1">
            <label className={LABEL}>预告片 URL (Trailer Embed / YouTube)</label>
            <input
              value={form.trailerUrl ?? ''}
              onChange={(e) => set('trailerUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={FIELD}
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <input
                type="checkbox"
                checked={form.isNew ?? false}
                onChange={(e) => set('isNew', e.target.checked)}
                className="accent-[#ff3650] w-5 h-5 rounded"
              />
              <div>
                <span className="text-sm font-bold text-white block">标记为 NEW 作品</span>
                <span className="text-xs text-white/50">将在首页与作品库打上明亮的 NEW 标志</span>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#ff3650]/15 border border-[#ff3650]/40 text-xs font-bold text-[#ff3650]">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white/60 hover:text-white border border-white/15 transition-colors cursor-pointer"
          >
            取消关闭
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-50 text-white font-black text-xs uppercase px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#ff3650]/20"
          >
            <Save className="w-4 h-4" />
            <span>{busy ? '正在保存中...' : '保存作品信息'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- Refactored News Admin Component ----------------
const NewsAdmin: React.FC<{ onCountChange?: (count: number) => void }> = ({ onCountChange }) => {
  const [rows, setRows] = useState<NewsRow[] | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', titleZh: '', date: '', category: 'Info', contentZh: '' });
  const [busy, setBusy] = useState(false);
  const [filterCat, setFilterCat] = useState<'all' | 'Info' | 'Event' | 'Goods' | 'Media'>('all');

  const reload = useCallback(async () => {
    setError('');
    try {
      const data = await adminNews.list();
      setRows(data ?? []);
      if (data && onCountChange) onCountChange(data.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载公告列表失败');
      setRows([]);
    }
  }, [onCountChange]);

  useEffect(() => { void reload(); }, [reload]);

  const add = async () => {
    setBusy(true);
    setError('');
    try {
      if (!draft.title.trim()) throw new Error('公告标题必填');
      await adminNews.create({
        id: `news-${Date.now()}`,
        title: draft.title,
        title_zh: draft.titleZh || null,
        date: draft.date || new Date().toISOString().slice(0, 10).replaceAll('-', '.'),
        category: draft.category,
        content: draft.contentZh || null,
        content_zh: draft.contentZh || null,
        sort_order: 0,
      });
      setDraft({ title: '', titleZh: '', date: '', category: 'Info', contentZh: '' });
      setAdding(false);
      await reload();
      void repository.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('确认删除这条官方公告?')) return;
    try {
      await adminNews.remove(id);
      await reload();
      void repository.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  const filteredNews = useMemo(() => {
    if (!rows) return [];
    if (filterCat === 'all') return rows;
    return rows.filter((r) => r.category.toLowerCase() === filterCat.toLowerCase());
  }, [rows, filterCat]);

  if (rows === null) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Loader variant="comet" size={32} label="加载动态公告..." className="text-[#ff3650]" />
      </div>
    );
  }

  const CATEGORY_COLORS: Record<string, string> = {
    Info: 'bg-[#ff3650]/20 text-[#ff3650] border-[#ff3650]/40',
    Event: 'bg-[#e0fe3d]/20 text-[#e0fe3d] border-[#e0fe3d]/40',
    Goods: 'bg-[#4246ff]/20 text-[#8b8eff] border-[#4246ff]/40',
    Media: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest flex items-center gap-1">
              <Newspaper className="w-3.5 h-3.5" />
              OFFICIAL NEWS
            </span>
            <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
              {rows.length} 篇公告
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">TRIGGER 动态与新闻发布</h2>
          <p className="text-xs text-white/50">发布展会动态、商品发售、媒体采访与重大制作情报</p>
        </div>

        <button
          onClick={() => setAdding(!adding)}
          className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] active:scale-95 text-white font-black text-sm px-5 py-3 rounded-2xl transition-all cursor-pointer shadow-[0_8px_20px_rgba(255,54,80,0.3)]"
        >
          <Plus className="w-4 h-4" />
          <span>{adding ? '收起发布器' : '发布新公告 (NEW POST)'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#ff3650]/15 border border-[#ff3650]/40 text-sm font-bold text-[#ff3650]">
          {error}
        </div>
      )}

      {/* Adding Editor Card */}
      {adding && (
        <div className="bg-[#181818] border-2 border-[#ff3650]/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff3650]" />
              新建官方动态
            </h3>
            <span className="text-xs text-white/40 font-mono">ID: AUTO_GENERATED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={LABEL}>原文标题 (日文/原版) *</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className={FIELD}
                placeholder="如 『ダンジョン飯』POP UP STORE 開催決定！"
              />
            </div>
            <div className="space-y-1">
              <label className={LABEL}>中文标题 (本地化)</label>
              <input
                value={draft.titleZh}
                onChange={(e) => setDraft({ ...draft, titleZh: e.target.value })}
                className={FIELD}
                placeholder="如 《迷宫饭》快闪店举办决定！"
              />
            </div>
            <div className="space-y-1">
              <label className={LABEL}>发布日期 (Date)</label>
              <input
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className={FIELD}
                placeholder="2026.08.22 (留空自动使用今日)"
              />
            </div>
            <div className="space-y-1">
              <label className={LABEL}>公告分类 (Category)</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className={`${FIELD} cursor-pointer`}
              >
                {['Info', 'Event', 'Goods', 'Media'].map((c) => (
                  <option key={c} value={c} className="bg-[#181818]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className={LABEL}>正文内容 (Content)</label>
            <textarea
              value={draft.contentZh}
              onChange={(e) => setDraft({ ...draft, contentZh: e.target.value })}
              rows={4}
              className={FIELD}
              placeholder="输入公告正文详情..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setAdding(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white/60 hover:text-white border border-white/15"
            >
              取消
            </button>
            <button
              onClick={add}
              disabled={busy}
              className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#ff203c] disabled:opacity-50 text-white font-black text-xs uppercase px-6 py-2.5 rounded-xl transition-all shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{busy ? '正在发布...' : '确认发布'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none bg-[#181818] p-3 rounded-2xl border border-white/10">
        {(['all', 'Info', 'Event', 'Goods', 'Media'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterCat === c
                ? 'bg-[#ff3650] text-white shadow-md'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {c === 'all' ? `全部 (${rows.length})` : c}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden shadow-xl">
        {filteredNews.length === 0 ? (
          <div className="p-12 text-center text-white/40 font-bold">暂无此分类下的动态</div>
        ) : (
          filteredNews.map((r) => (
            <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[r.category] || 'bg-white/10 text-white'}`}>
                    {r.category}
                  </span>
                  <span className="text-xs font-mono text-white/50">{r.date}</span>
                </div>
                <h4 className="font-black text-white text-base truncate">{r.title_zh ?? r.title}</h4>
                {r.title_zh && <p className="text-xs text-white/40 font-mono truncate">{r.title}</p>}
                {r.content_zh && <p className="text-xs text-white/60 line-clamp-2 pt-1">{r.content_zh}</p>}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => remove(r.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#ff3650] text-xs font-bold text-white/50 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-white/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
