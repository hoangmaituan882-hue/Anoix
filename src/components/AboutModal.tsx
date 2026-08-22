import React from 'react';
import { Language } from '../types';
import { I18N } from '../data/triggerData';
import { TriggerLogo } from './TriggerLogo';
import { X, Building2, Calendar, Users, Award, Heart } from 'lucide-react';

interface AboutModalProps {
  lang: Language;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ lang, onClose }) => {
  const t = I18N[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-[#1a1a1a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-[#f5ffe5] my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-[#151515]">
          <div>
            <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest">
              COMPANY PROFILE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {t.aboutModalTitle}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-sm sm:text-base leading-relaxed">
          {/* Logo & Slogan */}
          <div className="bg-black/40 p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-6">
            <TriggerLogo className="w-40 text-[#ff3650]" />
            <div>
              <h3 className="text-lg font-black text-white mb-1">{t.companyName}</h3>
              <p className="text-xs text-white/60 font-bold mb-3">{t.companySub}</p>
              <p className="text-xs sm:text-sm text-white/80 italic">
                {lang === 'zh' 
                  ? '“如果作品是子弹，我们希望能成为发射子弹的扳机。”' 
                  : lang === 'en'
                  ? '"If creative works are bullets, we aspire to be the trigger that fires them."'
                  : '「作品が弾丸だとしたら、それを打ち出す引き金でありたい」'}
              </p>
            </div>
          </div>

          {/* Intro */}
          <div>
            <h4 className="text-sm font-black text-[#ff3650] uppercase tracking-wider mb-2">
              MISSION & PHILOSOPHY
            </h4>
            <p className="text-white/90">
              {t.companyIntro}
            </p>
          </div>

          {/* Company Data Table */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-white/10 gap-1 sm:gap-6">
              <span className="w-32 font-black text-white/50 uppercase">Company Name</span>
              <span className="font-bold text-white">株式会社トリガー (ANIMATION STUDIO TRIGGER Inc.)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-white/10 gap-1 sm:gap-6">
              <span className="w-32 font-black text-white/50 uppercase">Established</span>
              <span className="font-bold text-white">2011年8月22日 (August 22, 2011)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-white/10 gap-1 sm:gap-6">
              <span className="w-32 font-black text-white/50 uppercase">Board Members</span>
              <span className="font-bold text-white">代表取締役：大塚 雅彦 / 取締役：今石 洋之、舛本 和也</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-white/10 gap-1 sm:gap-6">
              <span className="w-32 font-black text-white/50 uppercase">Business Domain</span>
              <span className="font-bold text-white">劇場用アニメーション、TVシリーズ、短編アニメーションの企画・制作・プロデュース、版権管理</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center py-2 gap-1 sm:gap-6">
              <span className="w-32 font-black text-white/50 uppercase">Headquarters</span>
              <span className="font-bold text-white">東京都杉並区 (Suginami-ku, Tokyo, Japan)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
