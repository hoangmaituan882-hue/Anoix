import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Language, WorkItem, NewsItem, GoodsItem } from '../../types';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { FilmsSection } from '../../features/films/FilmsSection';
import { NewsSection } from '../../features/news/NewsSection';
import { UpcomingSection } from '../../features/screenings/UpcomingSection';
import { GoodsSection } from '../../features/goods/GoodsSection';
import { MediaSection } from '../../features/media/MediaSection';

interface HomePageProps {
  lang: Language;
  setLang: (l: Language) => void;
  introStarted: boolean;
  onSelectWork: (work: WorkItem) => void;
  onOpenAllWorks: () => void;
  onSelectNews: (news: NewsItem) => void;
  onSelectGoods: (goods: GoodsItem) => void;
  onOpenModal: (modalName: 'about' | 'works' | 'news' | 'recruit' | 'contact') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  lang,
  setLang,
  introStarted,
  onSelectWork,
  onOpenAllWorks,
  onSelectNews,
  onSelectGoods,
  onOpenModal,
}) => {
  const location = useLocation();

  // When navigated here from another route with a scroll target
  // (e.g. header nav on the detail page), scroll after mount.
  useEffect(() => {
    const target = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (target) {
      const timer = setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Header
        lang={lang}
        setLang={setLang}
        onNavigate={(sectionId) => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenModal={onOpenModal}
      />

      {/* Main Content Sections */}
      <main id="container" className="w-full">
        {/* 1. Films Section (Left Character + Right Works Carousel) */}
        <FilmsSection
          lang={lang}
          introStarted={introStarted}
          onSelectWork={onSelectWork}
          onOpenAllWorks={onOpenAllWorks}
        />

        {/* 2. NEWS Section (Electric Cobalt Blue with Watermark) */}
        <NewsSection
          lang={lang}
          onSelectNews={onSelectNews}
          onOpenAllNews={() => {
            const el = document.getElementById('cb_content_90');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 3. NEXT Section (Neon Lime + upcoming nights timeline) */}
        <UpcomingSection lang={lang} />

        {/* 4. GOODS Section (Merchandise Carousel & Online Shop) */}
        <GoodsSection
          lang={lang}
          onSelectGoods={onSelectGoods}
        />

        {/* 5. MEDIA Section (official channel cards → external links) */}
        <MediaSection lang={lang} />
      </main>

      <Footer lang={lang} />
    </>
  );
};
