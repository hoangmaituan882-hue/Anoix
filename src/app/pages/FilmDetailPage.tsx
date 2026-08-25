import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation, useViewTransitionState } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language, WorkItem } from '../../types';
import { repository, useRepo } from '../../lib/repository';
import { TRIGGER_EASE } from '../../lib/motion';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { FilmDetailBody } from '../../features/films/FilmDetailBody';
import { WatchPanel } from '../../features/films/WatchPanel';
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, Check, Sparkles } from 'lucide-react';

interface FilmDetailPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
  onPlayTrailer: (url: string) => void;
}

/** Routed film detail page — shareable URL, same body as the preview modal. */
export const FilmDetailPage: React.FC<FilmDetailPageProps> = ({
  lang,
  setLang,
  onOpenModal,
  onPlayTrailer,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isTransitioning = useViewTransitionState(location);
  const films = useRepo(repository.films);
  const [copied, setCopied] = useState(false);

  const currentIndex = films.findIndex((w) => w.id === id);
  const work = currentIndex !== -1 ? films[currentIndex] : undefined;

  const prevWork = currentIndex > 0 ? films[currentIndex - 1] : undefined;
  const nextWork = currentIndex !== -1 && currentIndex < films.length - 1 ? films[currentIndex + 1] : undefined;

  const otherWorks = films.filter((w) => w.id !== id).slice(0, 4);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const title = work ? (lang === 'zh' && work.titleZh ? work.titleZh : lang === 'en' && work.titleEn ? work.titleEn : work.title) : '';

  return (
    <>
      <Header
        lang={lang}
        setLang={setLang}
        onNavigate={() => navigate('/')}
        onOpenModal={onOpenModal}
      />

      <motion.main
        id="container"
        className="w-full min-h-screen bg-[#151515] px-4 sm:px-8 lg:px-16 py-24 lg:py-28"
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: TRIGGER_EASE }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Top Bar: Breadcrumbs & Share */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-xs font-bold text-white/60">
              <Link to="/" className="hover:text-[#ff3650] transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '首页' : 'HOME'}</span>
              </Link>
              <span>/</span>
              <button
                onClick={() => onOpenModal('works')}
                className="hover:text-[#ff3650] transition-colors cursor-pointer"
              >
                {lang === 'zh' ? '作品一览' : 'WORKS'}
              </button>
              {work && (
                <>
                  <span>/</span>
                  <span className="text-white line-clamp-1 max-w-[200px] sm:max-w-none">{title}</span>
                </>
              )}
            </div>

            {work && (
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-[#ff3650] text-xs font-bold text-white transition-all cursor-pointer border border-white/10"
                title="Share link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#e0fe3d]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? (lang === 'zh' ? '已复制链接' : 'Copied!') : (lang === 'zh' ? '分享' : 'Share')}</span>
              </button>
            )}
          </div>

          {work ? (
            <div className="space-y-10">
              {/* Main Film Card */}
              <div className="bg-[#1a1a1a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-[#f5ffe5]">
                <FilmDetailBody
                  work={work}
                  lang={lang}
                  onPlayTrailer={onPlayTrailer}
                  posterViewTransitionName={isTransitioning && work ? `film-poster-${work.id}` : undefined}
                />
              </div>

              {/* Watch log + rating */}
              <WatchPanel filmId={work.id} filmTitle={work.titleZh ?? work.title} />

              {/* Prev / Next Pagination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevWork ? (
                  <Link
                    to={`/films/${prevWork.id}`}
                    className="p-4 rounded-2xl bg-[#1a1a1a] border border-white/10 hover:border-[#ff3650] flex items-center gap-3 group transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#ff3650] group-hover:-translate-x-1 transition-transform" />
                    <div>
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest block">
                        {lang === 'zh' ? '上一部作品' : 'PREVIOUS WORK'}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-[#ff3650] transition-colors">
                        {lang === 'zh' && prevWork.titleZh ? prevWork.titleZh : lang === 'en' && prevWork.titleEn ? prevWork.titleEn : prevWork.title}
                      </p>
                    </div>
                  </Link>
                ) : <div />}

                {nextWork && (
                  <Link
                    to={`/films/${nextWork.id}`}
                    className="p-4 rounded-2xl bg-[#1a1a1a] border border-white/10 hover:border-[#ff3650] flex items-center justify-end text-right gap-3 group transition-all sm:col-start-2"
                  >
                    <div>
                      <span className="text-[10px] font-black text-white/50 uppercase tracking-widest block">
                        {lang === 'zh' ? '下一部作品' : 'NEXT WORK'}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-[#ff3650] transition-colors">
                        {lang === 'zh' && nextWork.titleZh ? nextWork.titleZh : lang === 'en' && nextWork.titleEn ? nextWork.titleEn : nextWork.title}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#ff3650] group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>

              {/* Related Works Recommendations */}
              <div className="pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#ff3650]" />
                    <span>{lang === 'zh' ? '更多 TRIGGER 精彩作品' : 'MORE WORKS BY TRIGGER'}</span>
                  </h3>
                  <button
                    onClick={() => onOpenModal('works')}
                    className="text-xs font-bold text-[#ff3650] hover:text-white uppercase tracking-wider"
                  >
                    {lang === 'zh' ? '查看全部' : 'VIEW ALL'} →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {otherWorks.map((item) => (
                    <Link
                      key={item.id}
                      to={`/films/${item.id}`}
                      viewTransition
                      className="group flex flex-col bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff3650] transition-all transform hover:-translate-y-1 shadow-lg"
                    >
                      <div className="relative aspect-[27/40] overflow-hidden bg-black/40">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                          style={{ viewTransitionName: `film-poster-${item.id}` }}
                        />
                        <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] font-bold text-white">
                          {item.year}
                        </div>
                      </div>
                      <div className="p-3">
                        <span className="text-[9px] font-bold text-[#ff3650] uppercase block mb-0.5">{item.category}</span>
                        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff3650] transition-colors">
                          {lang === 'zh' && item.titleZh ? item.titleZh : lang === 'en' && item.titleEn ? item.titleEn : item.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-white/20 rounded-3xl p-12 text-center text-[#f5ffe5]">
              <p className="text-4xl font-black text-[#ff3650] uppercase mb-3">404</p>
              <p className="text-white/70 font-bold mb-6">
                {lang === 'zh' ? '找不到该作品条目' : 'Film entry not found'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 bg-[#ff3650] hover:bg-[#e02640] text-white px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'zh' ? '返回首页' : 'BACK TO HOME'}</span>
              </button>
            </div>
          )}
        </div>
      </motion.main>

      <Footer lang={lang} />
    </>
  );
};
