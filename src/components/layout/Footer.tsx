import React from 'react';
import { TriggerLogo } from '../ui/TriggerLogo';
import { Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { repository } from '../../lib/repository';
import { ArrowUpRight } from 'lucide-react';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = I18N[lang];

  return (
    <footer id="footer" className="w-full bg-[#121212] text-[#f5ffe5] pt-20 pb-16 px-4 sm:px-8 lg:px-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        {/* Social Media Directory */}
        <div id="footer_sns" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-20">
          {repository.socialLinks().map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-2xl bg-[#1a1a1a] hover:bg-[#222222] border border-white/10 hover:border-[#ff3650] transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-black text-white group-hover:text-[#ff3650] uppercase tracking-wider transition-colors">
                  {item.name}
                </span>
                <span className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#ff3650] text-white flex items-center justify-center transition-all group-hover:rotate-45">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/60 group-hover:text-white/90 leading-relaxed transition-colors">
                {lang === 'zh' ? item.descZh : lang === 'en' ? item.descEn : item.descJa}
              </p>
            </a>
          ))}
        </div>

        {/* Big Centered TRIGGER Logo */}
        <div className="flex flex-col items-center justify-center border-t border-white/10 pt-16">
          <div id="footer_logo" className="mb-6">
            <TriggerLogo 
              className="w-48 sm:w-64 md:w-80 text-white hover:text-[#ff3650] transition-colors"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </div>

          <p id="copyright" className="text-xs sm:text-sm text-white/50 font-bold tracking-widest uppercase">
            {t.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};
