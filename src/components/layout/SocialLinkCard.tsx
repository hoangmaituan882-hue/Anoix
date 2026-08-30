import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Language, SocialLink } from '../../types';

export function snsGridClass(count: number): string {
  if (count <= 1) return 'grid grid-cols-1 gap-4 sm:gap-6';
  if (count === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6';
  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6';
}

export function socialBlurb(item: SocialLink, lang: Language): string {
  if (lang === 'en') return item.descEn;
  if (lang === 'ja') return item.descJa;
  return item.descZh;
}

interface SocialLinkCardProps {
  item: SocialLink;
  lang?: Language;
  href?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** Footer SNS tile. Admin preview reuses the same chrome. */
export const SocialLinkCard: React.FC<SocialLinkCardProps> = ({
  item,
  lang,
  href = true,
  className = '',
  children,
}) => {
  const locale: Language = lang ?? 'zh';
  const inner = (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl font-black text-white group-hover:text-[#ff3650] uppercase tracking-wider transition-colors">
          {item.name || '未命名'}
        </span>
        <span className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#ff3650] text-white flex items-center justify-center transition-all group-hover:rotate-45">
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>
      <p className="text-xs sm:text-sm text-black/60 group-hover:text-white/90 leading-relaxed transition-colors min-h-[2.5rem]">
        {socialBlurb(item, locale) || '填写简介后会出现在页脚格子里'}
      </p>
      {children}
    </>
  );

  const chrome = `group p-5 rounded-2xl bg-white hover:bg-white border border-black/10 hover:border-[#ff3650] transition-all duration-300 flex flex-col justify-between ${className}`;

  if (!href) {
    return <div className={chrome}>{inner}</div>;
  }

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={chrome}>
      {inner}
    </a>
  );
};
