import React from 'react';
import { NewsItem, Language } from '../types';
import { I18N } from '../data/triggerData';
import { X, Calendar, Tag, Share2 } from 'lucide-react';

interface NewsDetailModalProps {
  news: NewsItem | null;
  lang: Language;
  onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  news,
  lang,
  onClose,
}) => {
  if (!news) return null;
  const t = I18N[lang];

  const title = lang === 'zh' && news.titleZh ? news.titleZh : lang === 'en' && news.titleEn ? news.titleEn : news.title;
  const content = lang === 'zh' && news.contentZh ? news.contentZh : lang === 'en' && news.contentEn ? news.contentEn : news.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#1c1c1c] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-[#f5ffe5] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Date & Category */}
        <div className="flex items-center gap-3 mb-4 text-xs sm:text-sm font-bold text-white/70">
          <span className="flex items-center gap-1.5 font-mono text-white">
            <Calendar className="w-4 h-4 text-[#ff3650]" />
            {news.date}
          </span>
          {news.category && (
            <span className="bg-[#4246ff] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {news.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-6 pb-4 border-b border-white/10">
          {title}
        </h2>

        {/* Content */}
        <div className="text-sm sm:text-base text-white/85 leading-relaxed space-y-4 mb-8">
          <p className="whitespace-pre-line">{content}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/50">
          <span>ANIMATION STUDIO TRIGGER Inc. News Release</span>
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert(lang === 'zh' ? '链接已复制到剪贴板！' : lang === 'en' ? 'Link copied to clipboard!' : 'URLをクリップボードにコピーしました！');
              }
            }}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
