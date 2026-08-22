import React, { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language } from '../../types';
import { repository, useRepo } from '../../lib/repository';
import { TRIGGER_EASE } from '../../lib/motion';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { FilmDetailBody } from '../../features/films/FilmDetailBody';
import { ArrowLeft } from 'lucide-react';

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
  const films = useRepo(repository.films);
  const work = films.find((w) => w.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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
        <div className="max-w-4xl mx-auto">
          {/* Back to library */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-[#ff3650] font-black text-sm uppercase tracking-wider transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'zh' ? '返回首页' : 'BACK TO HOME'}</span>
          </Link>

          {work ? (
            <div className="bg-[#1a1a1a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-[#f5ffe5]">
              <FilmDetailBody
                work={work}
                lang={lang}
                onPlayTrailer={onPlayTrailer}
              />
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
