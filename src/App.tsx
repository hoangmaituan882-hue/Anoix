import React, { useState } from 'react';
import { Language, WorkItem, NewsItem, GoodsItem, YoutubeItem } from './types';
import { Header } from './components/Header';
import { HeroWorksSection } from './components/HeroWorksSection';
import { NewsSection } from './components/NewsSection';
import { RecruitSection } from './components/RecruitSection';
import { GoodsSection } from './components/GoodsSection';
import { YoutubeSection } from './components/YoutubeSection';
import { Footer } from './components/Footer';
import { WorkDetailModal } from './components/WorkDetailModal';
import { AllWorksModal } from './components/AllWorksModal';
import { NewsDetailModal } from './components/NewsDetailModal';
import { VideoModal } from './components/VideoModal';
import { GoodsDetailModal } from './components/GoodsDetailModal';
import { AboutModal } from './components/AboutModal';
import { RecruitModal } from './components/RecruitModal';
import { ContactModal } from './components/ContactModal';
import { LoadingScreen } from './components/LoadingScreen';
import { ArrowUp } from 'lucide-react';

export default function App() {
  // Default to Japanese (official site) but easily toggleable to Chinese or English
  const [lang, setLang] = useState<Language>('zh');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [allWorksOpen, setAllWorksOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [allNewsOpen, setAllNewsOpen] = useState(false);
  const [selectedGoods, setSelectedGoods] = useState<GoodsItem | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [recruitModalOpen, setRecruitModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const handleOpenModal = (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => {
    switch (modalName) {
      case 'about':
        setAboutModalOpen(true);
        break;
      case 'works':
        setAllWorksOpen(true);
        break;
      case 'news':
        setAllNewsOpen(true);
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
    <div className="relative min-h-screen bg-[#121212] text-[#f5ffe5] font-sans selection:bg-[#ff3650] selection:text-white">
      {/* Signature Trigger Loading Screen */}
      {isLoading && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}

      {/* Fixed Sticky Header */}
      <Header
        lang={lang}
        setLang={setLang}
        onNavigate={(sectionId) => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenModal={handleOpenModal}
      />

      {/* Main Content Sections */}
      <main id="container" className="w-full">
        {/* 1. Hero Works Section (Left Character + Right Works Carousel) */}
        <HeroWorksSection
          lang={lang}
          onSelectWork={(work) => setSelectedWork(work)}
          onOpenAllWorks={() => setAllWorksOpen(true)}
        />

        {/* 2. NEWS Section (Electric Cobalt Blue with Watermark) */}
        <NewsSection
          lang={lang}
          onSelectNews={(news) => setSelectedNews(news)}
          onOpenAllNews={() => {
            const el = document.getElementById('cb_content_90');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 3. RECRUIT Section (Neon Lime Green Accent + Studio Atmosphere) */}
        <RecruitSection
          lang={lang}
          onOpenRecruitModal={() => setRecruitModalOpen(true)}
          onOpenAboutModal={() => setAboutModalOpen(true)}
        />

        {/* 4. GOODS Section (Merchandise Carousel & Online Shop) */}
        <GoodsSection
          lang={lang}
          onSelectGoods={(goods) => setSelectedGoods(goods)}
        />

        {/* 5. YOUTUBE Section (Video Feed & Popup Player) */}
        <YoutubeSection
          lang={lang}
          onSelectVideo={(video) => setActiveVideo({ url: video.url, title: lang === 'zh' && video.titleZh ? video.titleZh : video.title })}
        />
      </main>

      {/* Footer */}
      <Footer lang={lang} />

      {/* Floating Scroll-to-Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#ff3650] text-white flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-[#e02640] transition-all duration-300 cursor-pointer border-2 border-white/20"
        title="Scroll to Top"
        aria-label="Scroll to Top"
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* --- MODALS --- */}
      {/* 1. Work Detail Modal */}
      {selectedWork && (
        <WorkDetailModal
          work={selectedWork}
          lang={lang}
          onClose={() => setSelectedWork(null)}
          onPlayTrailer={handlePlayTrailer}
        />
      )}

      {/* 2. All Works Library Modal */}
      {allWorksOpen && (
        <AllWorksModal
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
    </div>
  );
}
