import React from 'react';
import { Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { TriggerLogo } from '../../components/ui/TriggerLogo';
import { X } from 'lucide-react';

interface AboutModalProps {
  lang: Language;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ lang, onClose }) => {
  const t = I18N[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-white border border-black/20 rounded-3xl overflow-hidden shadow-2xl text-[#1e1f21] my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 border-b border-black/10 flex items-center justify-between bg-[#151515]">
          <div>
            <span className="text-xs font-black text-[#ff3650] uppercase tracking-widest">
              {lang === 'zh' ? '社群档案 · CLUB' : 'CLUB'}
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
          <div className="bg-black/40 p-6 rounded-2xl border border-black/10 flex flex-col sm:flex-row items-center gap-6">
            <TriggerLogo className="w-40 text-[#ff3650]" />
            <div>
              <h3 className="text-lg font-black text-white mb-1">{t.companyName}</h3>
              <p className="text-xs text-black/60 font-bold mb-3">{t.companySub}</p>
              <p className="text-xs sm:text-sm text-black/80 italic">
                {lang === 'zh'
                  ? '「一场放映，一张周票，把想看的片子叠上来。」'
                  : lang === 'en'
                  ? '"One night, one weekly stack — put the film you want on the pile."'
                  : '「一夜、一週の票。見たい作品を積み上げる。」'}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black text-[#ff3650] uppercase tracking-wider mb-2">
              {lang === 'zh' ? '我们做什么' : 'WHAT WE DO'}
            </h4>
            <p className="text-white/90">{t.companyIntro}</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 border border-black/10 space-y-4 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-black/10 gap-1 sm:gap-6">
              <span className="w-32 font-black text-black/50 uppercase">
                {lang === 'zh' ? '站点' : 'Site'}
              </span>
              <span className="font-bold text-white">Anoix</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-black/10 gap-1 sm:gap-6">
              <span className="w-32 font-black text-black/50 uppercase">
                {lang === 'zh' ? '选片' : 'Picks'}
              </span>
              <span className="font-bold text-white">
                {lang === 'zh'
                  ? '提名池 + 周叠票；排期以日历为准'
                  : 'Nomination pool + weekly stack votes; the calendar is the schedule'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center py-2 gap-1 sm:gap-6">
              <span className="w-32 font-black text-black/50 uppercase">
                {lang === 'zh' ? '档案' : 'Archive'}
              </span>
              <span className="font-bold text-white">
                {lang === 'zh'
                  ? '只记社内放过的夜，不混工作室首映假数据'
                  : 'Club nights only — no studio premiere filler'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
