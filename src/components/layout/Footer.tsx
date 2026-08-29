import React from 'react';
import { TriggerLogo } from '../ui/TriggerLogo';
import { Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { repository, useRepo } from '../../lib/repository';
import { SocialLinkCard, snsGridClass } from './SocialLinkCard';

export const ICP_BEIAN_NO = '赣ICP备2026006064号';
export const ICP_BEIAN_URL = 'https://beian.miit.gov.cn/';

export const BeianLink: React.FC<{ className?: string }> = ({ className }) => (
  <a
    data-icp-beian
    href={ICP_BEIAN_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={className}
  >
    {ICP_BEIAN_NO}
  </a>
);

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = I18N[lang];
  const items = useRepo(() => repository.socialLinks());

  return (
    <footer id="footer" className="w-full bg-[#121212] text-[#f5ffe5] pt-20 pb-16 px-4 sm:px-8 lg:px-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        {items.length > 0 && (
          <div id="footer_sns" className={`${snsGridClass(items.length)} mb-20`}>
            {items.map((item) => (
              <SocialLinkCard key={item.id} item={item} lang={lang} />
            ))}
          </div>
        )}

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
          <BeianLink
            className="mt-3 text-xs text-white/40 hover:text-white/70 transition-colors"
          />
        </div>
      </div>
    </footer>
  );
};
