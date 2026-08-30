import React, { useRef, useState } from 'react';
import { GoodsItem, Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { repository } from '../../lib/repository';
import { ChevronLeft, ChevronRight, ShoppingBag, ExternalLink } from 'lucide-react';

interface GoodsSectionProps {
  lang: Language;
  onSelectGoods: (item: GoodsItem) => void;
}

export const GoodsSection: React.FC<GoodsSectionProps> = ({
  lang,
  onSelectGoods,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const t = I18N[lang];

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
    }
  };

  const scrollBy = (offset: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="cb_content_250"
      className="relative w-full py-20 md:py-32 px-4 sm:px-8 lg:px-16 overflow-hidden bg-white"
    >
      {/* Giant Typography Background */}
      <div className="absolute top-4 left-0 right-0 overflow-hidden pointer-events-none opacity-10 flex justify-center">
        <h2
          className="text-[120px] sm:text-[200px] lg:text-[280px] font-black tracking-tighter text-white leading-none uppercase whitespace-nowrap"
          style={{ fontFamily: "'Fjordic-Heavy', 'Arial Black', sans-serif" }}
        >
          GOODS
        </h2>
      </div>

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Section Header & Subtitle */}
        <div className="mb-10 md:mb-14">
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-[#ff3650] uppercase mb-2">
            <ShoppingBag className="w-4 h-4" />
            <span>CLUB MERCHANDISE</span>
          </div>
          <h2
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase"
            style={{ fontFamily: "'Fjordic-Heavy', 'Arial Black', sans-serif" }}
          >
            {t.goodsHeadline}
          </h2>
          <p className="text-base sm:text-lg text-black/70 font-medium mt-4 whitespace-pre-line max-w-2xl">
            {t.goodsDesc}
          </p>
        </div>

        {/* Carousel Slider */}
        <div className="relative group/goods">
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {repository.goods().map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectGoods(item)}
                className="flex-shrink-0 w-[240px] sm:w-[280px] md:w-[310px] bg-white rounded-2xl overflow-hidden group/item cursor-pointer border border-black/10 hover:border-[#ff3650] transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(255,54,80,0.25)] flex flex-col"
              >
                {/* Square Product Image */}
                <div className="relative aspect-square overflow-hidden bg-black/40">
                  <img
                    src={item.image}
                    alt={lang === 'zh' && item.titleZh ? item.titleZh : lang === 'en' && item.titleEn ? item.titleEn : item.title}
                    className="w-full h-full object-cover group-hover/item:scale-108 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white border border-black/20">
                    {item.price}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#ff3650] uppercase tracking-wider mb-1 line-clamp-1">
                      {item.series}
                    </p>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover/item:text-[#1e1f21] line-clamp-2 leading-snug">
                      {lang === 'zh' && item.titleZh ? item.titleZh : lang === 'en' && item.titleEn ? item.titleEn : item.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between text-xs font-bold text-black/70 group-hover/item:text-white">
                    <span>{t.viewOnStore}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#ff3650]" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => scrollBy(-320)}
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/80 border border-black/20 text-white items-center justify-center opacity-0 group-hover/goods:opacity-100 transition-opacity hover:bg-[#ff3650] hover:border-[#ff3650] shadow-xl z-10 cursor-pointer"
            aria-label="Previous Goods"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scrollBy(320)}
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/80 border border-black/20 text-white items-center justify-center opacity-0 group-hover/goods:opacity-100 transition-opacity hover:bg-[#ff3650] hover:border-[#ff3650] shadow-xl z-10 cursor-pointer"
            aria-label="Next Goods"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
};
