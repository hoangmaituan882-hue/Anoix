import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { WorkItem, Language } from '../../types';
import { I18N } from '../../data/triggerData';
import { repository, useRepo } from '../../lib/repository';
import { TRIGGER_EASE } from '../../lib/motion';
import { ExpandArrow } from '../../components/motion/ExpandArrow';
import { TextAnimation } from '../../components/motion/TextAnimation';
import { Tooltip } from '../../components/motion/Tooltip';
import { ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface FilmsSectionProps {
  lang: Language;
  introStarted: boolean;
  onSelectWork: (work: WorkItem) => void;
  onOpenAllWorks: () => void;
}

export const FilmsSection: React.FC<FilmsSectionProps> = ({
  lang,
  introStarted,
  onSelectWork,
  onOpenAllWorks,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const films = useRepo(repository.films);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const t = I18N[lang];

  // Update scrollbar progress indicator
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

  // Mouse drag support for smooth carousel sliding
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section
      id="index_header_content"
      className="relative w-full min-h-screen bg-[#151515] grid grid-cols-1 lg:grid-cols-2 pt-20 lg:pt-0 overflow-hidden"
    >
      {/* LEFT COLUMN: Red Character Visual — slides in from the right, blending with the background */}
      <motion.div
        id="index_header_slider"
        initial={{ x: '35%', opacity: 0 }}
        animate={introStarted ? { x: 0, opacity: 1 } : { x: '35%', opacity: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: TRIGGER_EASE }}
        className="relative w-full h-[55vh] sm:h-[65vh] lg:h-full min-h-[480px] lg:min-h-screen bg-[#ff3650] flex items-center justify-center overflow-hidden border-b-4 lg:border-b-0 lg:border-r-4 border-black/40"
      >
        <picture className="w-full h-full flex items-center justify-center">
          <source media="(max-width: 450px)" srcSet={repository.heroImage()} />
          <img
            fetchPriority="high"
            src={repository.heroImage()}
            alt="TRIGGER Main Visual"
            className="w-full h-full object-cover object-center lg:object-right transform hover:scale-105 transition-transform duration-700 ease-out select-none"
            draggable={false}
          />
        </picture>

        {/* Dynamic Studio Trigger watermark badge on mobile */}
        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black tracking-widest text-[#f5ffe5] border border-white/20 uppercase">
          TRIGGER 2026
        </div>
      </motion.div>

      {/* RIGHT COLUMN: Interactive WORKS Slider Section */}
      <div
        id="index_header_works"
        className="relative w-full h-full flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-10 lg:py-16 bg-[#161616]"
      >
        <div id="index_header_works_inner" className="w-full max-w-2xl lg:max-w-none mx-auto">
          {/* Sub-headline & Giant Headline — staggered right-to-left entrance */}
          <div className="headline_area mb-6 select-none">
            <motion.p
              className="sub_headline text-2xl sm:text-3xl lg:text-4xl font-black tracking-wider leading-none uppercase mb-1"
              initial={{ x: 180, opacity: 0 }}
              animate={introStarted ? { x: 0, opacity: 1 } : { x: 180, opacity: 0 }}
              transition={{ duration: 0.85, delay: 0.5, ease: TRIGGER_EASE }}
              style={{ color: '#ff3650', fontFamily: 'Montserrat, sans-serif' }}
            >
              {t.newBadge}
            </motion.p>
            <motion.h2
              className="headline text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-none uppercase drop-shadow-md"
              initial={{ x: 300, opacity: 0 }}
              animate={introStarted ? { x: 0, opacity: 1 } : { x: 300, opacity: 0 }}
              transition={{ duration: 0.95, delay: 0.62, ease: TRIGGER_EASE }}
              style={{
                color: '#ff3650',
                fontFamily: "'Anton', 'Montserrat', sans-serif"
              }}
            >
              {introStarted ? <TextAnimation text="WORKS" stagger={0.05} /> : ''}
            </motion.h2>
          </div>

          {/* Works Poster Carousel List */}
          <div id="index_header_works_list" className="relative group/list">
            <div
              ref={sliderRef}
              onScroll={handleScroll}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none py-2 scroll-smooth cursor-grab active:cursor-grabbing select-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {films.map((work, index) => (
                // Outer motion wrapper owns the entrance transform only — no CSS
                // transition classes here, they would fight motion's per-frame
                // inline transform updates and make the slide-in feel sluggish.
                <motion.article
                  key={work.id}
                  data-film-id={work.id}
                  onClick={() => onSelectWork(work)}
                  initial={{ x: 90, opacity: 0 }}
                  animate={introStarted ? { x: 0, opacity: 1 } : { x: 90, opacity: 0 }}
                  transition={{ duration: 0.7, delay: 0.68 + index * 0.06, ease: TRIGGER_EASE }}
                  className="flex-shrink-0 w-[170px] sm:w-[210px] md:w-[240px] group/card rounded-2xl cursor-pointer"
                >
                  {/* Hover lift/shadow lives on this inner frame so CSS transitions
                      never overlap with the motion entrance above. */}
                  <div className="relative aspect-[27/40] rounded-2xl overflow-hidden bg-black/40 border-2 border-white/10 group-hover/card:border-[#ff3650] group-hover/card:-translate-y-2 group-hover/card:shadow-[0_12px_30px_rgba(255,54,80,0.35)] transition-all duration-300">
                    <img
                      src={work.image}
                      alt={lang === 'zh' && work.titleZh ? work.titleZh : lang === 'en' && work.titleEn ? work.titleEn : work.title}
                      className="w-full h-full object-cover group-hover/card:scale-108 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />

                    {/* Gradient Overlay & Hover Play Icon */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#ff3650] bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-full w-fit mb-1 border border-[#ff3650]/40">
                        <Play className="w-3 h-3 fill-current" />
                        <span>{t.playTrailer}</span>
                      </div>
                      <p className="text-white text-xs font-bold line-clamp-1">
                        {lang === 'zh' && work.titleZh ? work.titleZh : lang === 'en' && work.titleEn ? work.titleEn : work.title}
                      </p>
                    </div>

                    {work.isNew && (
                      <span className="absolute top-2.5 right-2.5 bg-[#ff3650] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                        NEW
                      </span>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Slider Navigation Arrow Floating Buttons */}
            <Tooltip label={lang === 'zh' ? '上一个' : 'Previous'} wrapperClassName="absolute -left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/list:opacity-100 transition-opacity">
              <button
                onClick={() => scrollBy(-260)}
                className="hidden md:flex w-10 h-10 rounded-full bg-black/80 border border-white/20 text-white items-center justify-center hover:bg-[#ff3650] hover:border-[#ff3650] shadow-xl cursor-pointer"
                aria-label="Previous Work"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip label={lang === 'zh' ? '下一个' : 'Next'} wrapperClassName="absolute -right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/list:opacity-100 transition-opacity">
              <button
                onClick={() => scrollBy(260)}
                className="hidden md:flex w-10 h-10 rounded-full bg-black/80 border border-white/20 text-white items-center justify-center hover:bg-[#ff3650] hover:border-[#ff3650] shadow-xl cursor-pointer"
                aria-label="Next Work"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>

          {/* Custom Horizontal Scrollbar Track */}
          <div className="mt-5 w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-white/60 hover:bg-[#ff3650] transition-all rounded-full"
              style={{
                width: '35%',
                transform: `translateX(${(scrollProgress * 1.85)}%)`,
              }}
            />
          </div>

          {/* Action Button: ALL WORKS */}
          <div className="mt-8 flex items-center justify-start">
            <button
              id="btn-all-works"
              onClick={onOpenAllWorks}
              className="design_button group/btn inline-flex items-center gap-3 bg-[#f5ffe5] text-[#121212] hover:bg-[#ff3650] hover:text-white px-7 py-3 rounded-full font-black text-sm md:text-base tracking-wider uppercase transition-all duration-300 shadow-xl hover:shadow-[0_8px_25px_rgba(255,54,80,0.4)] cursor-pointer"
            >
              <span className="label font-extrabold tracking-widest">
                {t.allWorks}
              </span>
              <span className="w-7 h-7 rounded-full bg-[#121212] text-[#f5ffe5] group-hover/btn:bg-white group-hover/btn:text-[#ff3650] flex items-center justify-center">
                <ExpandArrow className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
