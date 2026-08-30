import React from 'react';
import { GoodsItem, Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { X, ExternalLink, ShoppingBag, CheckCircle } from 'lucide-react';

interface GoodsDetailModalProps {
  goods: GoodsItem | null;
  lang: Language;
  onClose: () => void;
}

export const GoodsDetailModal: React.FC<GoodsDetailModalProps> = ({
  goods,
  lang,
  onClose,
}) => {
  if (!goods) return null;
  const t = I18N[lang];

  const title = lang === 'zh' && goods.titleZh ? goods.titleZh : lang === 'en' && goods.titleEn ? goods.titleEn : goods.title;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#1c1c1c] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-[#f5ffe5]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-[#ff3650] text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Image */}
          <div className="aspect-square bg-black/50 p-6 flex items-center justify-center">
            <img
              src={goods.image}
              alt={title}
              className="w-full h-full object-contain rounded-xl shadow-lg"
            />
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-[#ff3650] uppercase tracking-wider block mb-1">
                {goods.series}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug mb-3">
                {title}
              </h2>
              <div className="text-2xl font-black text-[#f5ffe5] mb-4">
                {goods.price} <span className="text-xs text-white/50 font-normal">({lang === 'zh' ? '含税' : lang === 'en' ? 'tax incl.' : '税込'})</span>
              </div>

              {goods.description && (
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-6">
                  {goods.description}
                </p>
              )}

              <div className="space-y-2 text-xs text-white/60 mb-6">
                <div className="flex items-center gap-1.5 text-white/80 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'zh' ? '放映会周边' : 'Club merch'}</span>
                </div>
              </div>
            </div>

            <a
              href={goods.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#ff3650] hover:bg-[#e02640] text-white py-3.5 rounded-full font-black text-sm uppercase tracking-wider transition-colors shadow-lg"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.viewOnStore}</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
