import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { motion } from 'motion/react';
import { Language, WorkItem, NewsItem, GoodsItem } from '../types';
import { TRIGGER_EASE } from '../lib/motion';
import { repository } from '../lib/repository';
import { HomePage } from './pages/HomePage';
import { FilmDetailPage } from './pages/FilmDetailPage';
import { AdminPage } from './pages/AdminPage';
import { FilmDetailModal } from '../features/films/FilmDetailModal';
import { FilmsLibraryModal } from '../features/films/FilmsLibraryModal';
import { NewsDetailModal } from '../features/news/NewsDetailModal';
import { VideoModal } from '../components/ui/VideoModal';
import { GoodsDetailModal } from '../features/goods/GoodsDetailModal';
import { AboutModal } from '../features/about/AboutModal';
import { RecruitModal } from '../features/about/RecruitModal';
import { ContactModal } from '../features/about/ContactModal';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ArrowUp } from 'lucide-react';

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#121212] text-[#f5ffe5] font-sans selection:bg-[#ff3650] selection:text-white">
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </div>
  );
}

/** Router-aware shell: owns global state, the entrance sweep, and all modals. */
const AppShell: React.FC = () => {
  // Default to Japanese (official site) but easily toggleable to Chinese or English
  const [lang, setLang] = useState<Language>('zh');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states (app-level so modals work from any route)
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [allWorksOpen, setAllWorksOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedGoods, setSelectedGoods] = useState<GoodsItem | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [recruitModalOpen, setRecruitModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Pull live content from CloudBase PG once; static seed stays as fallback.
  useEffect(() => {
    void repository.refresh();
  }, []);

  const handleOpenModal = (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => {
    switch (modalName) {
      case 'about':
        setAboutModalOpen(true);
        break;
      case 'works':
        setAllWorksOpen(true);
        break;
      case 'news':
        // News library page arrives with the archive stage; no-op for now.
        break;
      case 'recruit':
        setRecruitModalOpen(true);
        break;
      case 'contact':
        setContactModalOpen(true);
        break;
    }
  };

  const handlePlayTrailer = (url: string) => {
    setActiveVideo({ url, title: 'TRIGGER Official Trailer' });
  };

  return (
    <>
      {/* Signature Trigger Loading Screen */}
      {isLoading && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}

      {/* Site entrance container: sweeps in from the right after the loading screen fades out */}
      <motion.div
        id="site_container"
        className="will-change-transform"
        initial={{ x: '100vw', opacity: 0 }}
        animate={isLoading ? { x: '100vw', opacity: 0 } : { x: 0, opacity: 1 }}
        transition={{ duration: 1.05, ease: TRIGGER_EASE }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                lang={lang}
                setLang={setLang}
                introStarted={!isLoading}
                onSelectWork={(work) => setSelectedWork(work)}
                onOpenAllWorks={() => setAllWorksOpen(true)}
                onSelectNews={(news) => setSelectedNews(news)}
                onSelectGoods={(goods) => setSelectedGoods(goods)}
                onSelectVideo={(video) => setActiveVideo({ url: video.url, title: lang === 'zh' && video.titleZh ? video.titleZh : video.title })}
                onOpenRecruitModal={() => setRecruitModalOpen(true)}
                onOpenAboutModal={() => setAboutModalOpen(true)}
                onOpenModal={handleOpenModal}
              />
            }
          />
          <Route
            path="/films/:id"
            element={
              <FilmDetailPage
                lang={lang}
                setLang={setLang}
                onOpenModal={handleOpenModal}
                onPlayTrailer={handlePlayTrailer}
              />
            }
          />
          {/* Admin console — self-contained auth, no site chrome */}
          <Route path="/admin" element={<AdminPage />} />
        </Routes>

        {/* Floating Scroll-to-Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#ff3650] text-white flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-[#e02640] transition-all duration-300 cursor-pointer border-2 border-white/20"
          title="Scroll to Top"
          aria-label="Scroll to Top"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      </motion.div>

      {/* --- MODALS --- */}
      {/* 1. Film Detail Modal (quick preview) */}
      {selectedWork && (
        <FilmDetailModal
          work={selectedWork}
          lang={lang}
          onClose={() => setSelectedWork(null)}
          onPlayTrailer={handlePlayTrailer}
        />
      )}

      {/* 2. Films Library Modal */}
      {allWorksOpen && (
        <FilmsLibraryModal
          lang={lang}
          onClose={() => setAllWorksOpen(false)}
          onSelectWork={(work) => {
            setAllWorksOpen(false);
            setSelectedWork(work);
          }}
        />
      )}

      {/* 3. News Detail Modal */}
      {selectedNews && (
        <NewsDetailModal
          news={selectedNews}
          lang={lang}
          onClose={() => setSelectedNews(null)}
        />
      )}

      {/* 4. Goods Detail Modal */}
      {selectedGoods && (
        <GoodsDetailModal
          goods={selectedGoods}
          lang={lang}
          onClose={() => setSelectedGoods(null)}
        />
      )}

      {/* 5. Video Player Modal */}
      {activeVideo && (
        <VideoModal
          videoUrl={activeVideo.url}
          title={activeVideo.title}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* 6. About Modal */}
      {aboutModalOpen && (
        <AboutModal
          lang={lang}
          onClose={() => setAboutModalOpen(false)}
        />
      )}

      {/* 7. Recruit Modal */}
      {recruitModalOpen && (
        <RecruitModal
          lang={lang}
          onClose={() => setRecruitModalOpen(false)}
        />
      )}

      {/* 8. Contact Modal */}
      {contactModalOpen && (
        <ContactModal
          lang={lang}
          onClose={() => setContactModalOpen(false)}
        />
      )}
    </>
  );
};
