import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/cloudbase';
import { repository } from '../../lib/repository';
import { adminFilms, adminNews, filmToRow, rowToFilm, FilmRow, NewsRow } from '../../lib/pgAdmin';
import { WorkItem } from '../../types';
import { Loader } from '../../components/motion/loader';
import { ScreeningsAdmin } from '../../features/admin/ScreeningsAdmin';
import { RoundsAdmin } from '../../features/admin/RoundsAdmin';
import { ArrowLeft, LogOut, Plus, Save, Trash2, X } from 'lucide-react';

type AuthState = 'checking' | 'signed-out' | 'signed-in';

export const AdminPage: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>('checking');

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await auth.getSession();
      const session = data?.session;
      if (alive) setAuthState(session && !session.user?.is_anonymous ? 'signed-in' : 'signed-out');
    })();
    return () => { alive = false; };
  }, []);

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader variant="comet" size={40} label="检查登录状态" className="text-[#ff3650]" />
      </div>
    );
  }

  return authState === 'signed-in' ? (
    <AdminPanel onSignOut={() => setAuthState('signed-out')} />
  ) : (
    <AdminLogin onSignedIn={() => setAuthState('signed-in')} />
  );
};

// ---------------- Login ----------------
const AdminLogin: React.FC<{ onSignedIn: () => void }> = ({ onSignedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data, error } = await auth.signInWithPassword({ username, password });
      if (error || !data?.session) throw new Error(error?.message ?? '登录失败');
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4 selection:bg-[#ff3650] selection:text-white">
      <form onSubmit={submit} className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 space-y-5 shadow-2xl">
        <div>
          <p className="text-xs font-black text-[#ff3650] uppercase tracking-widest mb-1">Anoix Console</p>
          <h1 className="text-2xl font-black text-white">管理后台登录</h1>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-white/60 uppercase tracking-wider">用户名</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-white font-bold focus:border-[#ff3650] focus:outline-none"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-white/60 uppercase tracking-wider">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-white font-bold focus:border-[#ff3650] focus:outline-none"
            required
          />
        </div>
        {error && <p className="text-sm font-bold text-[#ff3650]">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-[#ff3650] hover:bg-[#e02640] disabled:opacity-50 text-white font-black uppercase tracking-wider py-3 rounded-xl transition-colors cursor-pointer"
        >
          {busy ? '登录中...' : '登录'}
        </button>
        <Link to="/" className="block text-center text-xs font-bold text-white/40 hover:text-[#ff3650] transition-colors">
          ← 返回网站
        </Link>
      </form>
    </div>
  );
};

// ---------------- Admin Panel ----------------
const AdminPanel: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => {
  const [tab, setTab] = useState<'films' | 'news' | 'screenings' | 'rounds'>('films');

  const signOut = async () => {
    await auth.signOut();
    onSignOut();
  };

  const TABS = [
    { key: 'films', label: '作品库' },
    { key: 'news', label: '公告' },
    { key: 'screenings', label: '放映会' },
    { key: 'rounds', label: '提名轮次' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#121212] text-[#f5ffe5] selection:bg-[#ff3650] selection:text-white">
      <header className="border-b border-white/10 bg-[#1a1a1a] px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest">Anoix Console</span>
          <nav className="flex gap-1 bg-black/40 rounded-full p-1 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                  tab === t.key ? 'bg-[#ff3650] text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs font-bold text-white/50 hover:text-[#ff3650] transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> 网站
          </Link>
          <button onClick={signOut} className="text-xs font-bold text-white/50 hover:text-[#ff3650] transition-colors flex items-center gap-1 cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> 退出
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {tab === 'films' && <FilmsAdmin />}
        {tab === 'news' && <NewsAdmin />}
        {tab === 'screenings' && <ScreeningsAdmin />}
        {tab === 'rounds' && <RoundsAdmin />}
      </main>
    </div>
  );
};

// ---------------- Films CRUD ----------------
const EMPTY_FILM: WorkItem = {
  id: '', title: '', year: '', category: '', image: '', description: '', isNew: false,
};

const FilmsAdmin: React.FC = () => {
  const [rows, setRows] = useState<FilmRow[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<WorkItem | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setError('');
    try {
      setRows(await adminFilms.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      setRows([]);
    }
  }, []);

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

  if (rows === null) return <p className="text-white/50 font-bold">加载中...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">作品库 <span className="text-white/40 text-sm">({rows.length})</span></h2>
        <button
          onClick={() => setEditing({ ...EMPTY_FILM })}
          className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#e02640] text-white font-black text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> 新增作品
        </button>
      </div>

      {error && <p className="text-sm font-bold text-[#ff3650] bg-[#ff3650]/10 border border-[#ff3650]/30 rounded-xl p-3">{error}</p>}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-white/40 font-bold">暂无作品,点击右上角新增</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/10">
                <th className="px-4 py-3 font-bold">ID</th>
                <th className="px-4 py-3 font-bold">标题</th>
                <th className="px-4 py-3 font-bold">年份</th>
                <th className="px-4 py-3 font-bold">分类</th>
                <th className="px-4 py-3 font-bold text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-white/50">{r.id}</td>
                  <td className="px-4 py-3 font-bold">{r.title_zh ?? r.title}</td>
                  <td className="px-4 py-3 text-white/70">{r.year}</td>
                  <td className="px-4 py-3 text-white/70">{r.category}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => setEditing(rowToFilm(r))}
                      className="text-xs font-bold text-white/70 hover:text-[#ff3650] transition-colors cursor-pointer"
                    >编辑</button>
                    <button
                      disabled={busy}
                      onClick={() => remove(r.id, r.title_zh ?? r.title)}
                      className="text-xs font-bold text-white/40 hover:text-[#ff3650] transition-colors cursor-pointer inline-flex items-center gap-1"
                    ><Trash2 className="w-3 h-3" />删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <FilmForm
          initial={editing}
          isNew={!editing.id}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void reload(); }}
        />
      )}
    </div>
  );
};

// ---------------- Film edit form ----------------
const FIELD = 'w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:border-[#ff3650] focus:outline-none';
const LABEL = 'text-xs font-bold text-white/50 uppercase tracking-wider';

const FilmForm: React.FC<{
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
      if (!form.id.trim() || !form.title.trim()) throw new Error('ID 和标题为必填项');
      const id = form.id.trim();
      const row = filmToRow({ ...form, id });
      delete (row as Partial<FilmRow>).sort_order; // keep existing order on edits
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-[#1a1a1a] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between sticky -top-6 -mt-6 pt-6 pb-2 bg-[#1a1a1a]">
          <h3 className="text-lg font-black">{isNew ? '新增作品' : `编辑:${form.title || form.id}`}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/60 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={LABEL}>ID(slug,唯一) *</label>
            <input value={form.id} onChange={(e) => set('id', e.target.value)} disabled={!isNew} className={`${FIELD} disabled:opacity-40 font-mono`} />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>原文名 *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} className={FIELD} />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>中文标题</label>
            <input value={form.titleZh ?? ''} onChange={(e) => set('titleZh', e.target.value)} className={FIELD} />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>英文标题</label>
            <input value={form.titleEn ?? ''} onChange={(e) => set('titleEn', e.target.value)} className={FIELD} />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>年份</label>
            <input value={form.year} onChange={(e) => set('year', e.target.value)} className={FIELD} placeholder="2026" />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>分类</label>
            <input value={form.category} onChange={(e) => set('category', e.target.value)} className={FIELD} placeholder="TV Series / Movie ..." />
          </div>
          <div className="col-span-2 space-y-1">
            <label className={LABEL}>海报图片 URL</label>
            <input value={form.image} onChange={(e) => set('image', e.target.value)} className={FIELD} placeholder="https://..." />
          </div>
          <div className="col-span-2 space-y-1">
            <label className={LABEL}>宣传语</label>
            <input value={form.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} className={FIELD} />
          </div>
          <div className="col-span-2 space-y-1">
            <label className={LABEL}>简介(中文)</label>
            <textarea value={form.descriptionZh ?? ''} onChange={(e) => set('descriptionZh', e.target.value)} rows={3} className={FIELD} />
          </div>
          <div className="col-span-2 space-y-1">
            <label className={LABEL}>简介(原文)</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={FIELD} />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>导演</label>
            <input value={form.director ?? ''} onChange={(e) => set('director', e.target.value)} className={FIELD} />
          </div>
          <div className="space-y-1">
            <label className={LABEL}>预告片 URL</label>
            <input value={form.trailerUrl ?? ''} onChange={(e) => set('trailerUrl', e.target.value)} className={FIELD} placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm font-bold text-white/70 cursor-pointer">
            <input type="checkbox" checked={form.isNew ?? false} onChange={(e) => set('isNew', e.target.checked)} className="accent-[#ff3650] w-4 h-4" />
            标记为 NEW(首页角标)
          </label>
        </div>

        {error && <p className="text-sm font-bold text-[#ff3650]">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white/60 hover:text-white border border-white/15 transition-colors cursor-pointer">取消</button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#e02640] disabled:opacity-50 text-white font-black text-sm px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" /> {busy ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------- News admin ----------------
const NewsAdmin: React.FC = () => {
  const [rows, setRows] = useState<NewsRow[] | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', titleZh: '', date: '', category: 'Info', contentZh: '' });
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setError('');
    try {
      setRows(await adminNews.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
      setRows([]);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const add = async () => {
    setBusy(true);
    setError('');
    try {
      if (!draft.title.trim()) throw new Error('标题必填');
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
    if (!window.confirm('确认删除这条公告?')) return;
    try {
      await adminNews.remove(id);
      await reload();
      void repository.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  if (rows === null) return <p className="text-white/50 font-bold">加载中...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">公告 <span className="text-white/40 text-sm">({rows.length})</span></h2>
        <button
          onClick={() => setAdding(!adding)}
          className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#e02640] text-white font-black text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {adding ? '收起' : '新增公告'}
        </button>
      </div>

      {error && <p className="text-sm font-bold text-[#ff3650] bg-[#ff3650]/10 border border-[#ff3650]/30 rounded-xl p-3">{error}</p>}

      {adding && (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={FIELD} placeholder="标题(原文) *" />
            <input value={draft.titleZh} onChange={(e) => setDraft({ ...draft, titleZh: e.target.value })} className={FIELD} placeholder="中文标题" />
            <input value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={FIELD} placeholder="日期 2026.08.22(留空自动今天)" />
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={FIELD}>
              {['Info', 'Event', 'Goods', 'Media'].map((c) => <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>)}
            </select>
          </div>
          <textarea value={draft.contentZh} onChange={(e) => setDraft({ ...draft, contentZh: e.target.value })} rows={3} className={FIELD} placeholder="正文(中文)" />
          <button onClick={add} disabled={busy} className="bg-[#ff3650] hover:bg-[#e02640] disabled:opacity-50 text-white font-black text-sm px-5 py-2 rounded-xl transition-colors cursor-pointer">
            {busy ? '保存中...' : '发布'}
          </button>
        </div>
      )}

      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl divide-y divide-white/5">
        {rows.map((r) => (
          <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-bold truncate">{r.title_zh ?? r.title}</p>
              <p className="text-xs text-white/40 font-mono">{r.date} · {r.category}</p>
            </div>
            <button onClick={() => remove(r.id)} className="text-xs font-bold text-white/40 hover:text-[#ff3650] transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0">
              <Trash2 className="w-3 h-3" />删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
