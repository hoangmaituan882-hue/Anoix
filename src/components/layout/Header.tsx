import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriggerLogo } from '../ui/TriggerLogo';
import { Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { Menu, X, Lock, User } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { getSession, SessionUser } from '../../lib/session';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  onNavigate: (sectionId: string) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, onNavigate, onOpenModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const navigate = useNavigate();
  const t = I18N[lang];

  useEffect(() => {
    let alive = true;
    getSession().then((u) => { if (alive) setUser(u); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId: string, modalName?: 'about' | 'works' | 'news' | 'recruit' | 'contact') => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (modalName) {
      onOpenModal(modalName);
    }
  };

  const pillItem =
    'px-3.5 py-1.5 rounded-full text-white/80 hover:text-[#ff3650] hover:bg-white/10 transition-colors duration-150 cursor-pointer whitespace-nowrap';

  return (
    <>
      <header
        id="header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'py-2 px-3 md:px-6' : 'py-3 px-3 md:px-6'
        }`}
      >
        <div className="max-w-[1720px] mx-auto bg-[#1c1c1c]/95 backdrop-blur-md text-[#f5ffe5] rounded-b-2xl md:rounded-b-3xl px-4 md:px-6 py-3 border-b border-white/10 shadow-2xl grid grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Logo */}
          <h1 id="header_logo" className="flex items-center">
            <TriggerLogo
              className="w-24 md:w-32 text-white hover:text-[#ff3650] transition-colors"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </h1>

          {/* Desktop Navigation — pill bar, centered */}
          <nav
            id="global_menu"
            className="hidden lg:flex items-center justify-center gap-0.5 bg-black/40 rounded-full p-1 font-extrabold tracking-wider text-[13px] xl:text-sm"
          >
            <button id="nav-about" onClick={() => onOpenModal('about')} className={pillItem}>
              {t.about}
            </button>
            <button id="nav-works" onClick={() => handleNavClick('index_header_works', 'works')} className={pillItem}>
              {t.works}
            </button>
            <button id="nav-news" onClick={() => handleNavClick('cb_content_90', 'news')} className={pillItem}>
              {t.news}
            </button>
            <button
              id="nav-screenings"
              onClick={() => { setMobileMenuOpen(false); navigate('/screenings'); }}
              className={pillItem}
            >
              {lang === 'zh' ? '放映档案' : 'SCREENINGS'}
            </button>
            <button
              id="nav-nominations"
              onClick={() => { setMobileMenuOpen(false); navigate('/nominations'); }}
              className={pillItem}
            >
              {lang === 'zh' ? '提名投票' : 'VOTE'}
            </button>
            <button
              id="nav-admin"
              onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
              className="ml-1 inline-flex items-center gap-1.5 text-[#ff3650] hover:text-white bg-[#ff3650]/10 hover:bg-[#ff3650] rounded-full px-3.5 py-1.5 transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3 h-3" />
              {lang === 'zh' ? '后台' : 'ADMIN'}
            </button>
          </nav>

          {/* Right Area: Theme + Account + Language + Hamburger */}
          <div className="flex items-center gap-2.5 justify-self-end">
            <ThemeToggle />
            <button
              id="account_button"
              onClick={() => navigate(user ? '/auth' : '/auth')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                user
                  ? 'text-[#f5ffe5] bg-white/10 hover:bg-white/20'
                  : 'text-[#ff3650] bg-[#ff3650]/10 hover:bg-[#ff3650] hover:text-white'
              }`}
              title={user ? user.name : lang === 'zh' ? '登录 / 注册' : 'Sign in'}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline max-w-[90px] truncate">
                {user ? user.name : lang === 'zh' ? '登录' : 'SIGN IN'}
              </span>
            </button>
            <div className="flex items-center bg-white/10 rounded-full p-0.5 text-xs font-bold text-white/80">
              <button
                id="lang-ja"
                onClick={() => setLang('ja')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === 'ja' ? 'bg-[#ff3650] text-white shadow-sm' : 'hover:text-white'
                }`}
                title="日本語 (Original)"
              >
                JP
              </button>
              <button
                id="lang-zh"
                onClick={() => setLang('zh')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === 'zh' ? 'bg-[#ff3650] text-white shadow-sm' : 'hover:text-white'
                }`}
                title="中文"
              >
                中文
              </button>
              <button
                id="lang-en"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === 'en' ? 'bg-[#ff3650] text-white shadow-sm' : 'hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            <button
              id="drawer_menu_button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          id="drawer_menu"
          className="fixed inset-0 z-40 bg-black/90 backdrop-blur-xl flex flex-col justify-center px-8 py-20 lg:hidden animate-fade-in"
        >
          <nav className="flex flex-col gap-5 text-xl font-black tracking-wider text-center">
            <button onClick={() => handleNavClick('about', 'about')} className="hover:text-[#ff3650] transition-colors py-2">
              {t.about}
            </button>
            <button onClick={() => handleNavClick('index_header_works', 'works')} className="hover:text-[#ff3650] transition-colors py-2">
              {t.works}
            </button>
            <button onClick={() => handleNavClick('cb_content_90', 'news')} className="hover:text-[#ff3650] transition-colors py-2">
              {t.news}
            </button>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/screenings'); }} className="hover:text-[#ff3650] transition-colors py-2">
              {lang === 'zh' ? '放映档案' : 'SCREENINGS'}
            </button>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/nominations'); }} className="hover:text-[#ff3650] transition-colors py-2">
              {lang === 'zh' ? '提名投票' : 'VOTE'}
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
              className="text-[#ff3650] hover:text-white transition-colors py-2 inline-flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              {lang === 'zh' ? '管理后台' : 'ADMIN'}
            </button>
          </nav>
        </div>
      )}
    </>
  );
};
