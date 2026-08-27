import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriggerLogo } from '../ui/TriggerLogo';
import { Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { Menu, X, Lock, User, LogOut, UserRound, Vote, Search, Award } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { getSession, signOut, SessionUser } from '../../lib/session';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { openActivityDrawer } from '../../features/profile/ActivityDrawer';
import { NotificationBell } from '../../features/community/NotificationBell';
import { RankingDropdown } from '../../features/ranking/RankingDropdown';
import { LeaderboardModal } from '../../features/ranking/LeaderboardModal';
import { openSearch } from '../../features/search/SearchPalette';

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
    if (modalName === 'works') {
      onOpenModal('works');
      return;
    }
    if (modalName === 'about') {
      onOpenModal('about');
      return;
    }
    if (modalName === 'recruit') {
      onOpenModal('recruit');
      return;
    }
    if (modalName === 'contact') {
      onOpenModal('contact');
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
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
              onClick={() => {
                navigate('/', { viewTransition: true });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </h1>

          {/* Desktop Navigation — pill bar, centered */}
          <nav
            id="global_menu"
            className="hidden lg:flex items-center justify-center gap-0.5 bg-black/40 rounded-full p-1 font-bold text-xs"
          >
            <button
              id="nav-about"
              onClick={() => onOpenModal('about')}
              className={pillItem}
            >
              关于社群
            </button>
            <button
              id="nav-works"
              onClick={() => onOpenModal('works')}
              className={pillItem}
            >
              放映库
            </button>
            <button
              id="nav-news"
              onClick={() => handleNavClick('cb_content_90')}
              className={pillItem}
            >
              最新动态
            </button>
            <button
              id="nav-screenings"
              onClick={() => { setMobileMenuOpen(false); navigate('/screenings', { viewTransition: true }); }}
              className={pillItem}
            >
              放映档案
            </button>
            <button
              id="nav-history"
              onClick={() => { setMobileMenuOpen(false); navigate('/history', { viewTransition: true }); }}
              className={pillItem}
            >
              历史编年
            </button>
            <button
              id="nav-nominations"
              onClick={() => { setMobileMenuOpen(false); navigate('/nominations', { viewTransition: true }); }}
              className={pillItem}
            >
              选片投票
            </button>
            <button
              id="nav-calendar"
              onClick={() => { setMobileMenuOpen(false); navigate('/calendar', { viewTransition: true }); }}
              className={pillItem}
            >
              活动日历
            </button>
            <button
              id="nav-credentials"
              onClick={() => { setMobileMenuOpen(false); navigate('/credentials', { viewTransition: true }); }}
              className={pillItem}
            >
              放映资历
            </button>
            <button
              id="nav-admin"
              onClick={() => { setMobileMenuOpen(false); navigate('/admin', { viewTransition: true }); }}
              className="ml-1 inline-flex items-center gap-1.5 text-[#ff3650] hover:text-white bg-[#ff3650]/10 hover:bg-[#ff3650] rounded-full px-3 py-1 text-xs font-bold transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3 h-3" />
              管理后台
            </button>
          </nav>

          {/* Right Area: Search + Credits + Theme + Account + Hamburger */}
          <div className="flex items-center gap-2 justify-self-end">
            <button
              type="button"
              id="header-search-btn"
              onClick={() => openSearch()}
              className="inline-flex items-center gap-2 h-7 px-2.5 sm:px-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
              title="搜索档案与作品 (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-[#ff3650]" />
              <span className="hidden min-[480px]:inline">搜索</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-bold text-white/40 border border-white/15 rounded px-1 py-0.5">⌘K</kbd>
            </button>
            <RankingDropdown lang={lang} />
            <ThemeToggle />
            <NotificationBell />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    id="account_button"
                    className="inline-flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-0.5 h-7 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap text-[#f5ffe5] bg-white/10 hover:bg-white/20 outline-none focus-visible:ring-2 focus-visible:ring-[#ff3650] max-w-[110px]"
                    title={user.name}
                  >
                    <Avatar className="h-5.5 w-5.5 shrink-0">
                      <AvatarFallback className="bg-[#ff3650]/25 text-[#ff3650] text-[10px] font-black">
                        {user.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline min-w-0 flex-1 truncate text-left text-[11px]">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <span className="block text-sm font-bold">{user.name}</span>
                    <span className="block text-xs text-muted-foreground font-normal truncate">
                      {user.email || user.username || user.uid}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile', { viewTransition: true })}>
                    <UserRound className="text-[#ff3650]" /> 个人中心
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/credentials', { viewTransition: true })}>
                    <Award className="text-[#ff3650]" /> 我的放映资历
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openActivityDrawer()}>
                    <Vote className="text-[#e0fe3d]" /> 我的投票记录
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin', { viewTransition: true })}>
                    <Lock className="text-[#e0fe3d]" /> 管理后台
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => { await signOut(); navigate('/', { replace: true }); }}
                    className="text-[#ff3650] focus:text-[#ff3650]"
                  >
                    <LogOut /> 退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                id="account_button"
                onClick={() => navigate('/auth')}
                className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 h-7 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap text-[#ff3650] bg-[#ff3650]/10 hover:bg-[#ff3650] hover:text-white border border-[#ff3650]/20"
                title="登录 / 注册"
              >
                <User className="w-3 h-3" />
                <span className="text-[11px]">登录</span>
              </button>
            )}

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
          <nav className="flex flex-col gap-4 text-base font-bold tracking-wide text-center">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openSearch();
              }}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 text-white font-bold hover:bg-[#ff3650] transition-colors mb-2"
            >
              <Search className="w-4 h-4 text-[#ff3650]" />
              <span>全站搜索 (⌘K)</span>
            </button>
            <button onClick={() => handleNavClick('about', 'about')} className="hover:text-[#ff3650] transition-colors py-2">
              关于社群
            </button>
            <button onClick={() => handleNavClick('index_header_works', 'works')} className="hover:text-[#ff3650] transition-colors py-2">
              放映库
            </button>
            <button onClick={() => handleNavClick('cb_content_90', 'news')} className="hover:text-[#ff3650] transition-colors py-2">
              最新动态
            </button>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/screenings', { viewTransition: true }); }} className="hover:text-[#ff3650] transition-colors py-2">
              放映档案
            </button>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/history', { viewTransition: true }); }} className="hover:text-[#ff3650] transition-colors py-2">
              历史编年
            </button>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/nominations', { viewTransition: true }); }} className="hover:text-[#ff3650] transition-colors py-2">
              选片投票
            </button>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/calendar', { viewTransition: true }); }} className="hover:text-[#ff3650] transition-colors py-2">
              活动日历
            </button>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/credentials', { viewTransition: true }); }} className="hover:text-[#ff3650] transition-colors py-2">
              放映资历
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/admin', { viewTransition: true }); }}
              className="text-[#ff3650] hover:text-white transition-colors py-2 inline-flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              管理后台
            </button>
          </nav>
        </div>
      )}
      <LeaderboardModal />
    </>
  );
};
