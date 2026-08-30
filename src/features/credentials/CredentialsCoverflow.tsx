import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface RiffleRecipeSlide {
  id: string;
  filmId?: string;
  title: string;
  author: string;
  image: string;
  videoUrl?: string;
  audioSrc?: string;
  isWatched?: boolean;
}

export const DEFAULT_RECIPES: RiffleRecipeSlide[] = [
  {
    id: 'recipe-1',
    title: 'Cyberpunk: Edgerunners 2',
    author: 'directed by Kai Igarashi',
    image: 'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/CPER2-2.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=JtqIas3bYhg',
  },
  {
    id: 'recipe-2',
    title: 'Delicious in Dungeon Season 2',
    author: 'directed by Yoshihiro Miyajima',
    image: 'https://www.st-trigger.co.jp/wp-content/uploads/2026/07/DM2-2.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=RwtB3aZg3_g',
  },
  {
    id: 'recipe-3',
    title: 'PROMARE',
    author: 'directed by Hiroyuki Imaishi',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=RwtB3aZg3_g',
  },
  {
    id: 'recipe-4',
    title: 'GRIDMAN UNIVERSE',
    author: 'directed by Akira Amemiya',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=JtqIas3bYhg',
  },
  {
    id: 'recipe-5',
    title: 'KILL la KILL',
    author: 'directed by Hiroyuki Imaishi',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=JtqIas3bYhg',
  },
];

interface CredentialsCoverflowProps {
  items?: RiffleRecipeSlide[];
  loading?: boolean;
  onSelect?: (item: RiffleRecipeSlide) => void;
  onPlay?: (item: RiffleRecipeSlide) => void;
}

export const CredentialsCoverflow: React.FC<CredentialsCoverflowProps> = ({
  items = DEFAULT_RECIPES,
  loading = false,
  onSelect,
  onPlay,
}) => {
  const [activeIndex, setActiveIndex] = useState(2); // Center is 2
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isIndicatorDragging, setIsIndicatorDragging] = useState(false);
  const trackRef = React.useRef<HTMLDivElement>(null);

  // Drag and click handling for capsule indicator
  const updateIndexFromPointer = (clientX: number) => {
    if (!trackRef.current || items.length <= 1) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left - 5; // center thumb on pointer
    const ratio = Math.max(0, Math.min(1, relativeX / (rect.width - 10)));
    const targetIndex = Math.round(ratio * (items.length - 1));
    setActiveIndex(targetIndex);
  };

  const handleIndicatorPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsIndicatorDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateIndexFromPointer(e.clientX);
  };

  const handleIndicatorPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isIndicatorDragging || e.buttons === 1) {
      updateIndexFromPointer(e.clientX);
    }
  };

  const handleIndicatorPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsIndicatorDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (loading) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => Math.min(items.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, loading]);

  const handlePrev = () => setActiveIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setActiveIndex((prev) => Math.min(items.length - 1, prev + 1));

  // Indicator progress
  const progressX = (activeIndex / Math.max(1, items.length - 1)) * 32;

  return (
    <div className="relative w-full pt-1 pb-2 select-none">
      {/* Screen Reader controls */}
      <button
        type="button"
        onClick={handlePrev}
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:z-10 focus-visible:rounded-full focus-visible:bg-white focus-visible:p-2 focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-black/40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16px"
          height="16px"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-left size-4"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span className="sr-only">Previous recipe</span>
      </button>

      {/* 3D Carousel Stage with Permanent Persistent Outer Dimensions */}
      <div className="relative -my-20 overflow-hidden py-20 [mask-image:linear-gradient(to_right,transparent,black_56px,black_calc(100%-56px),transparent)]">
        {/* Four-layer Edge Blur Shadows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-[210] w-24 backdrop-blur-[2px] [mask-image:linear-gradient(to_right,black,transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-[210] w-24 backdrop-blur-[8px] [mask-image:linear-gradient(to_right,black,transparent_45%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-[210] w-24 backdrop-blur-[2px] [mask-image:linear-gradient(to_left,black,transparent)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-[210] w-24 backdrop-blur-[8px] [mask-image:linear-gradient(to_left,black,transparent_45%)]"
        />

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Template recipes"
          className="relative isolate mt-2 w-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/30 dark:focus-visible:ring-white/40"
          style={{ height: '256px' }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              /* Phase 1: 1:1 Clean Skeleton Center Card */
              <motion.div
                key="skeleton-stage"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="relative w-[386px] h-[256px] rounded-2xl bg-[#d5d5d5] dark:bg-[#232326] shadow-[0_4px_20px_rgba(15,23,42,0.06)] overflow-hidden"
              >
                {/* Soft Ambient Shimmer Stream */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </motion.div>
            ) : (
              /* Phase 2: Live 3D Coverflow with Outward-Expanding Unfold Motion */
              <motion.div
                key="live-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex h-full cursor-grab touch-pan-y select-none active:cursor-grabbing items-center justify-center"
                onTouchStart={(e) => {
                  setStartX(e.touches[0].clientX);
                  setIsDragging(true);
                }}
                onTouchEnd={(e) => {
                  if (!isDragging) return;
                  setIsDragging(false);
                  const diff = e.changedTouches[0].clientX - startX;
                  if (diff > 35) handlePrev();
                  else if (diff < -35) handleNext();
                }}
                onMouseDown={(e) => {
                  setStartX(e.clientX);
                  setIsDragging(true);
                }}
                onMouseUp={(e) => {
                  if (!isDragging) return;
                  setIsDragging(false);
                  const diff = e.clientX - startX;
                  if (diff > 35) handlePrev();
                  else if (diff < -35) handleNext();
                }}
              >
                {items.map((item, index) => {
                  const offset = index - activeIndex;
                  const isCenter = offset === 0;

                  // Target transform calculations matching 1:1 Riffle Studio rules
                  let targetTransform = 'perspective(1000px) translate3d(0px, 0px, 0px) rotateY(0deg)';
                  let targetFilter = 'brightness(1)';
                  let targetBoxShadow = 'rgba(15, 23, 42, 0.36) 0px 24px 48px -12px';
                  let zIndex = 100 - Math.abs(offset) * 10;

                  // Initial animation state: Left & Right wings emerge from behind center card
                  let initialTransform = 'perspective(1000px) translate3d(0px, 0px, -40px) rotateY(0deg)';
                  let initialOpacity = 0;

                  if (offset < 0) {
                    const tx = -80 - (Math.abs(offset) - 1) * 20;
                    targetTransform = `perspective(1000px) translate3d(${tx}px, 0px, -160px) rotateY(45deg)`;
                    targetFilter = 'brightness(0.65)';
                    targetBoxShadow = 'rgba(15, 23, 42, 0.22) 0px 10px 20px -8px';
                    initialTransform = 'perspective(1000px) translate3d(0px, 0px, -40px) rotateY(0deg)';
                    initialOpacity = 0;
                  } else if (offset > 0) {
                    const tx = 80 + (offset - 1) * 20;
                    targetTransform = `perspective(1000px) translate3d(${tx}px, 0px, -160px) rotateY(-45deg)`;
                    targetFilter = 'brightness(0.65)';
                    targetBoxShadow = 'rgba(15, 23, 42, 0.22) 0px 10px 20px -8px';
                    initialTransform = 'perspective(1000px) translate3d(0px, 0px, -40px) rotateY(0deg)';
                    initialOpacity = 0;
                  } else {
                    // Center Card: Emerges in place with subtle scale punch
                    initialTransform = 'perspective(1000px) translate3d(0px, 0px, 0px) scale(0.96)';
                    initialOpacity = 0;
                  }

                  return (
                    <div
                      key={item.id}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${item.title}, ${index + 1} of ${items.length}`}
                      className="relative flex h-full flex-none items-center justify-center"
                      style={{
                        width: '140px',
                        zIndex,
                      }}
                      onClick={() => {
                        if (!isCenter) {
                          setActiveIndex(index);
                        } else if (onSelect) {
                          onSelect(item);
                        }
                      }}
                    >
                      <motion.div
                        initial={{
                          transform: initialTransform,
                          opacity: initialOpacity,
                        }}
                        animate={{
                          transform: targetTransform,
                          opacity: 1,
                          filter: targetFilter,
                          boxShadow: targetBoxShadow,
                        }}
                        transition={{
                          duration: isCenter ? 0.45 : 0.7,
                          delay: isCenter ? 0.05 : 0.12,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="relative flex-none rounded-xl cursor-pointer group/card"
                        style={{
                          width: '386px',
                          height: '256px',
                        }}
                      >
                        <div className="group/cover relative h-full w-full overflow-hidden rounded-xl bg-surface-secondary shadow-[0_1px_2px_rgba(15,23,42,0.06),_0_6px_16px_-4px_rgba(15,23,42,0.10)] transition-shadow duration-300 ease-out hover:shadow-[0_4px_10px_rgba(15,23,42,0.10),_0_18px_40px_-10px_rgba(15,23,42,0.24)]">
                          <img
                            className="select-none object-cover w-full h-full transition-transform duration-700 ease-out group-hover/card:scale-105"
                            src={item.image}
                            alt={item.title}
                            draggable={false}
                          />

                          {/* Center Card Title & Info Overlay */}
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: isCenter ? 0.2 : 0 }}
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 rounded-b-xl bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-14"
                          >
                            <div className="px-5 pb-4 pr-16 text-left text-white">
                              <p className="text-xl font-bold leading-snug">
                                <span className="line-clamp-2">{item.title}</span>
                              </p>
                              <p className="mt-0.5 text-xs font-medium text-black/70 flex items-center gap-1.5">
                                {item.isWatched && (
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                                <span>{item.author}</span>
                              </p>
                            </div>
                          </motion.div>

                          {/* Play Button directly on the center card with smooth bouncy pop */}
                          {isCenter && (
                            <motion.button
                              key={`play-${item.id}`}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{
                                type: 'spring',
                                stiffness: 450,
                                damping: 28,
                                delay: 0.32,
                              }}
                              type="button"
                              aria-label={`Play ${item.title}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (onPlay) {
                                  onPlay(item);
                                } else if (onSelect) {
                                  onSelect(item);
                                }
                              }}
                              className="pointer-events-auto absolute bottom-3 right-3 z-30 flex size-10 items-center justify-center rounded-full bg-white text-black shadow-lg transition-all duration-200 ease-out hover:scale-110 active:scale-90 hover:bg-[#e5e5e5] focus-visible:outline-none cursor-pointer group/play"
                              title="播放名场面预告"
                            >
                              <svg
                                width="14px"
                                height="14px"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="ml-0.5 size-3.5 transition-transform group-hover/play:scale-110 fill-current"
                              >
                                <path
                                  d="M3.07129 1.94043C3.83797 1.47436 4.67733 1.57686 5.52539 1.86816C6.36395 2.15623 7.4025 2.69749 8.68652 3.36328L9.49707 3.7832C10.9755 4.54979 12.1616 5.16289 12.9678 5.74414C13.7724 6.32427 14.4053 7.01796 14.4053 8C14.4053 8.98205 13.7724 9.67572 12.9678 10.2559C12.1616 10.8371 10.9755 11.4502 9.49707 12.2168L8.68652 12.6367C7.4025 13.3025 6.36395 13.8438 5.52539 14.1318C4.67732 14.4232 3.83799 14.5257 3.07129 14.0596C2.30479 13.5934 2.00967 12.801 1.87793 11.9141C1.74772 11.0371 1.75 9.86608 1.75 8.41992L1.75 7.58008C1.75 6.13392 1.74772 4.96293 1.87793 4.08594C2.00967 3.19903 2.30479 2.40656 3.07129 1.94043Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </motion.button>
                          )}
                        </div>

                        {/* Bottom Mirrored Reflection */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 top-full mt-1 hidden h-20 overflow-hidden rounded-xl opacity-[0.13] blur-lg dark:block [mask-image:linear-gradient(rgba(0,0,0,0.6),transparent_80%)]"
                        >
                          <img
                            className="-scale-y-100 object-cover w-full h-full"
                            src={item.image}
                            alt=""
                            draggable={false}
                          />
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Screen Reader Next */}
        <button
          type="button"
          onClick={handleNext}
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:z-10 focus-visible:rounded-full focus-visible:bg-white focus-visible:p-2 focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-black/40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16px"
            height="16px"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-chevron-right size-4"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="sr-only">Next recipe</span>
        </button>

        {/* Bottom Slide Indicator Pill with Smooth Interactive Drag Control */}
        <div className="mt-10 flex w-full justify-center">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="indicator-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-8 h-1.5 rounded-full bg-[#d5d5d5] dark:bg-[#2a2a2e]"
              />
            ) : (
              <motion.div
                key="indicator-live"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                onPointerDown={handleIndicatorPointerDown}
                onPointerMove={handleIndicatorPointerMove}
                onPointerUp={handleIndicatorPointerUp}
                onPointerCancel={handleIndicatorPointerUp}
                className="-m-3 cursor-pointer touch-none p-3 select-none flex items-center justify-center group/indicator"
                title="拖动或点击指示条切换作品"
              >
                <div
                  ref={trackRef}
                  className="relative overflow-hidden rounded-full bg-black/15 dark:bg-white/20 transition-all group-hover/indicator:scale-y-110 group-hover/indicator:bg-black/20 dark:group-hover/indicator:bg-white/25"
                  style={{ width: '42px', height: '7px' }}
                >
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full bg-black/60 dark:bg-white/80 group-hover/indicator:bg-black dark:group-hover/indicator:white transition-colors"
                    style={{
                      width: '10px',
                    }}
                    animate={{
                      x: progressX,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: isIndicatorDragging ? 900 : 450,
                      damping: isIndicatorDragging ? 40 : 32,
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
