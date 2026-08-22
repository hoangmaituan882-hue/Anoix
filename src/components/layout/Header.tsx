import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriggerLogo } from '../ui/TriggerLogo';
import { Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { Menu, X, Lock } from 'lucide-react';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  onNavigate: (sectionId: string) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, onNavigate, onOpenModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const t = I18N[lang];

  const handleNavClick = (sectionId: string, modalName?: 'about' | 'works' | 'news' | 'recruit' | 'contact') => {
    setMobileMenuOpen(false);
    if (sectionId === 'shop') {
      window.open('https://trigger.ecq.sc/', '_blank');
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (modalName) {
      onOpenModal(modalName);
    }
  };

  return (
    <>
      <header
        id="header"
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      >
        <div className="w-full bg-[#1c1c1c]/95 backdrop-blur-md text-[#f5ffe5] px-4 md:px-8 py-3.5 flex items-center justify-between border-b border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <h1 id="header_logo" className="flex items-center">
              <TriggerLogo 
                className="w-28 md:w-36 text-white hover:text-[#ff3650] transition-colors" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav id="global_menu" className="hidden lg:flex items-center gap-7 xl:gap-9 font-extrabold tracking-wider text-[14px] xl:text-[15px]">
            <button
              id="nav-about"
              onClick={() => onOpenModal('about')}
              className="transition-colors duration-150 hover:text-[#ff3650] cursor-pointer"
            >
              {t.about}
            </button>
            <button
              id="nav-works"
              onClick={() => handleNavClick('index_header_works', 'works')}
              className="transition-colors duration-150 hover:text-[#ff3650] cursor-pointer"
            >
              {t.works}
            </button>
            <a
              id="nav-shop"
              href="https://trigger.ecq.sc/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-150 hover:text-[#ff3650] inline-flex items-center gap-1"
            >
              {t.shop}
            </a>
            <button
              id="nav-news"
              onClick={() => handleNavClick('cb_content_90', 'news')}
              className="transition-colors duration-150 hover:text-[#ff3650] cursor-pointer"
            >
              {t.news}
            </button>
            <button
              id="nav-screenings"
              onClick={() => { setMobileMenuOpen(false); navigate('/screenings'); }}
              className="transition-colors duration-150 hover:text-[#ff3650] cursor-pointer"
            >
              {lang === 'zh' ? '放映档案' : 'SCREENINGS'}
            </button>
            <button
              id="nav-nominations"
              onClick={() => { setMobileMenuOpen(false); navigate('/nominations'); }}
              className="transition-colors duration-150 hover:text-[#ff3650] cursor-pointer"
            >
              {lang === 'zh' ? '提名投票' : 'VOTE'}
            </button>
            <button
              id="nav-contact"
              onClick={() => onOpenModal('contact')}
              className="transition-colors duration-150 hover:text-[#ff3650] cursor-pointer"
            >
              {t.contact}
            </button>
            <span className="w-px h-4 bg-white/20" aria-hidden="true" />
            <button
              id="nav-admin"
              onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
              className="inline-flex items-center gap-1.5 text-[#ff3650] hover:text-white border border-[#ff3650]/50 hover:border-[#ff3650] rounded-full px-3 py-1 transition-colors duration-150 cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              {lang === 'zh' ? '后台' : 'ADMIN'}
            </button>
          </nav>

          {/* Right Area: SNS + Language Switcher + Hamburger */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Language Selector */}
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
                title="中文 (如截图界面)"
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

            {/* Header SNS */}
            <div id="header_sns" className="hidden sm:flex items-center gap-1.5 md:gap-2">
              <a
                href="https://x.com/trigger_inc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-xs font-bold text-white/90 hover:border-[#ff3650] hover:text-[#ff3650] hover:scale-110 transition-all"
                title="X (Twitter)"
              >
                𝕏
              </a>
              <a
                href="https://www.instagram.com/trigger_inc/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-[10px] text-white/90 hover:border-[#ff3650] hover:text-[#ff3650] hover:scale-110 transition-all"
                title="Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://www.youtube.com/user/studiotrigger"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-[10px] text-white/90 hover:border-[#ff3650] hover:text-[#ff3650] hover:scale-110 transition-all"
                title="YouTube"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
              <a
                href="https://www.twitch.tv/studio_trigger"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-[10px] text-white/90 hover:border-[#ff3650] hover:text-[#ff3650] hover:scale-110 transition-all"
                title="Twitch"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </a>
              <a
                href="https://discord.gg/trigger"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-[10px] text-white/90 hover:border-[#ff3650] hover:text-[#ff3650] hover:scale-110 transition-all"
                title="Discord"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a
                href="https://www.patreon.com/TRIGGER"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-[10px] text-white/90 hover:border-[#ff3650] hover:text-[#ff3650] hover:scale-110 transition-all font-serif italic"
                title="Patreon"
              >
                P
              </a>
            </div>

            {/* Mobile Hamburger */}
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
          <nav className="flex flex-col gap-6 text-2xl font-black tracking-wider text-center">
            <button
              onClick={() => handleNavClick('about', 'about')}
              className="hover:text-[#ff3650] transition-colors py-2"
            >
              {t.about}
            </button>
            <button
              onClick={() => handleNavClick('index_header_works', 'works')}
              className="hover:text-[#ff3650] transition-colors py-2"
            >
              {t.works}
            </button>
            <a
              href="https://trigger.ecq.sc/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#ff3650] transition-colors py-2"
            >
              {t.shop}
            </a>
            <button
              onClick={() => handleNavClick('cb_content_90', 'news')}
              className="hover:text-[#ff3650] transition-colors py-2"
            >
              {t.news}
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/screenings'); }}
              className="hover:text-[#ff3650] transition-colors py-2"
            >
              {lang === 'zh' ? '放映档案' : 'SCREENINGS'}
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/nominations'); }}
              className="hover:text-[#ff3650] transition-colors py-2"
            >
              {lang === 'zh' ? '提名投票' : 'VOTE'}
            </button>
            <button
              onClick={() => handleNavClick('contact', 'contact')}
              className="hover:text-[#ff3650] transition-colors py-2"
            >
              {t.contact}
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
              className="text-[#ff3650] hover:text-white transition-colors py-2 inline-flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              {lang === 'zh' ? '管理后台' : 'ADMIN'}
            </button>
          </nav>

          <div className="mt-12 flex justify-center gap-4">
            <a href="https://x.com/trigger_inc" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center font-bold">𝕏</a>
            <a href="https://www.youtube.com/user/studiotrigger" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center font-bold">YT</a>
            <a href="https://discord.gg/trigger" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center font-bold">DC</a>
          </div>
        </div>
      )}
    </>
  );
};
