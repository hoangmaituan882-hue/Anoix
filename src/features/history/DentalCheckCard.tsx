import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, FlaskConical, Stethoscope, ChevronUp, ChevronDown } from 'lucide-react';

export interface DiagnosticItem {
  id: string;
  pillTitle: string;
  pillIcon: 'ai' | 'tooth' | 'flask' | 'stethoscope';
  badgeLabel: string;
  badgeValue: string;
  doctor?: {
    name: string;
    role: string;
    avatar: string;
  };
  cardTitle: string;
  scanImage: string;
  markers: {
    id: string;
    name: string;
    x: number; // percentage
    y: number; // percentage
    status: string;
    confidence: string;
  }[];
  bottomPills: string[];
  extraBadge: string;
}

const MEDICAL_DATA: DiagnosticItem[] = [
  {
    id: 'ai-report',
    pillTitle: 'AI Report',
    pillIcon: 'ai',
    badgeLabel: 'Identified issues:',
    badgeValue: '8',
    doctor: {
      name: 'Dr. Elena Vance',
      role: 'Chief AI Diagnostician',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    },
    cardTitle: 'AI Report',
    scanImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1000&auto=format&fit=crop&q=80',
    markers: [
      {
        id: 'ai1',
        name: 'Frontal Sinus Density',
        x: 48,
        y: 35,
        status: 'Clear airflow passage verified',
        confidence: '99.6%',
      },
      {
        id: 'ai2',
        name: 'Mandibular Canal',
        x: 32,
        y: 62,
        status: 'Nerve bundle safety margin 3.2mm',
        confidence: '98.9%',
      },
      {
        id: 'ai3',
        name: 'Condylar Process',
        x: 68,
        y: 38,
        status: 'Symmetrical bone alignment',
        confidence: '97.2%',
      },
    ],
    bottomPills: ['Frontal Sinus Density', 'Mandibular Canal', 'Condylar Process'],
    extraBadge: '+5',
  },
  {
    id: 'dental-check',
    pillTitle: 'Dental Check',
    pillIcon: 'tooth',
    badgeLabel: 'Dr. Alex Prime',
    badgeValue: 'Dentist',
    doctor: {
      name: 'Dr. Alex Prime',
      role: 'Dentist',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
    },
    cardTitle: 'Dental Check',
    scanImage: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1000&auto=format&fit=crop&q=80',
    markers: [
      {
        id: 'm1',
        name: 'Upper third molar',
        x: 64,
        y: 48,
        status: 'Enamel demineralization detected',
        confidence: '98.4%',
      },
      {
        id: 'm2',
        name: 'Lower third molar',
        x: 37,
        y: 54,
        status: 'Titanium fixture integration stable',
        confidence: '99.1%',
      },
      {
        id: 'm3',
        name: 'Upper second premolar',
        x: 47,
        y: 50,
        status: 'Zirconia crown margin intact',
        confidence: '96.8%',
      },
      {
        id: 'm4',
        name: 'Lower right premolar',
        x: 56,
        y: 57,
        status: 'Root apex slight bone density shift',
        confidence: '94.2%',
      },
    ],
    bottomPills: ['Upper third molar', 'Lower third molar', 'Upper second premolar'],
    extraBadge: '+3',
  },
  {
    id: 'labs-check',
    pillTitle: 'Labs',
    pillIcon: 'flask',
    badgeLabel: 'Dr. John Smith',
    badgeValue: 'Phlebotomists',
    doctor: {
      name: 'Dr. John Smith',
      role: 'Phlebotomists',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120&auto=format&fit=crop&q=80',
    },
    cardTitle: 'Labs Diagnostic Scan',
    scanImage: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1000&auto=format&fit=crop&q=80',
    markers: [
      {
        id: 'lb1',
        name: 'Serum Calcium Profile',
        x: 42,
        y: 45,
        status: 'Optimal mineralization level',
        confidence: '99.3%',
      },
      {
        id: 'lb2',
        name: 'Immune C-Reactive Protein',
        x: 58,
        y: 52,
        status: 'Normal baseline (<0.5 mg/L)',
        confidence: '98.1%',
      },
    ],
    bottomPills: ['Serum Calcium Profile', 'Immune CRP', 'Platelet Viability'],
    extraBadge: '+4',
  },
  {
    id: 'ortho-check',
    pillTitle: 'Orthopedic Scan',
    pillIcon: 'stethoscope',
    badgeLabel: 'Dr. Marcus Webb',
    badgeValue: 'Orthopedist',
    doctor: {
      name: 'Dr. Marcus Webb',
      role: 'Orthopedist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    },
    cardTitle: 'Orthopedic AI Scan',
    scanImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1000&auto=format&fit=crop&q=80',
    markers: [
      {
        id: 'ort1',
        name: 'Cervical Lordosis',
        x: 52,
        y: 40,
        status: 'C4-C6 curvature alignment normal',
        confidence: '99.0%',
      },
      {
        id: 'ort2',
        name: 'Vertebral Disc Space',
        x: 46,
        y: 60,
        status: 'Adequate disc height preserved',
        confidence: '98.5%',
      },
    ],
    bottomPills: ['Cervical Lordosis', 'Vertebral Disc Space', 'Spinal Margin'],
    extraBadge: '+2',
  },
];

// Ultra-smooth spring curve for organic motion physics
const SMOOTH_SPRING = {
  type: 'spring',
  stiffness: 280,
  damping: 30,
  mass: 0.8,
};

export const DarkDiagnosticCarousel: React.FC = () => {
  // Center active index in MEDICAL_DATA
  const [centerIndex, setCenterIndex] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1); // 1 = scroll up, -1 = scroll down
  const [activeMarkerId, setActiveMarkerId] = useState<string>('m1');
  const [selectedSubPill, setSelectedSubPill] = useState<string>('Upper third molar');
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const total = MEDICAL_DATA.length;
  
  // Slot calculations for 3-slot vertical deck
  const topIndex = (centerIndex - 1 + total) % total;
  const bottomIndex = (centerIndex + 1) % total;

  const topItem = MEDICAL_DATA[topIndex];
  const centerItem = MEDICAL_DATA[centerIndex];
  const bottomItem = MEDICAL_DATA[bottomIndex];

  // Auto-advance loop every 4.2 seconds
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCenterIndex((prev) => (prev + 1) % total);
    }, 4200);
    return () => clearInterval(timer);
  }, [isHovered, total]);

  // Update marker selection when center item changes
  useEffect(() => {
    if (centerItem.markers.length > 0) {
      setActiveMarkerId(centerItem.markers[0].id);
      setSelectedSubPill(centerItem.markers[0].name);
    }
  }, [centerIndex]);

  const activeMarker = centerItem.markers.find((m) => m.id === activeMarkerId) || centerItem.markers[0];

  const handleNext = () => {
    setDirection(1);
    setCenterIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCenterIndex((prev) => (prev - 1 + total) % total);
  };

  return (
    <div
      className="w-full flex flex-col items-center select-none font-sans"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Vertical 3-Stack Structure */}
      <div className="w-full flex flex-col gap-2.5 relative">
        
        {/* ================= SLOT 1: TOP PILL ================= */}
        <div className="w-full h-[46px] relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.button
              key={`top-${topItem.id}`}
              custom={direction}
              initial={{ opacity: 0, y: direction > 0 ? 30 : -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: direction > 0 ? -30 : 30, scale: 0.95 }}
              transition={SMOOTH_SPRING}
              onClick={handlePrev}
              className="w-full h-full bg-[#1e1e22] hover:bg-[#25252b] active:scale-[0.99] rounded-full px-4 py-2 sm:px-5 border border-white/10 hover:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.35)] flex items-center justify-between transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white transition-colors">
                  {topItem.pillIcon === 'tooth' ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5 text-white/90"
                    >
                      <path d="M12 2C7.5 2 4 4.5 4 8c0 3 1.5 5 2 8 0.6 3.5 2 6 4 6 1.5 0 2-2 2-4 0 2 0.5 4 2 4 2 0 3.4-2.5 4-6 0.5-3 2-5 2-8 0-3.5-3.5-6-8-6z" />
                    </svg>
                  ) : topItem.pillIcon === 'ai' ? (
                    <Sparkles className="w-3.5 h-3.5 text-[#ff3650] fill-[#ff3650]/20" />
                  ) : topItem.pillIcon === 'flask' ? (
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-[#ff3650] transition-colors">
                  {topItem.pillTitle}
                </span>
              </div>

              {topItem.doctor && topItem.id !== 'ai-report' ? (
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 shadow-sm shrink-0">
                    <img
                      src={topItem.doctor.avatar}
                      alt={topItem.doctor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[11px] sm:text-xs font-bold text-white">
                      {topItem.badgeLabel}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-medium text-white/50">
                      {topItem.badgeValue}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-white/50 font-medium">
                  <span>{topItem.badgeLabel}</span>
                  <span className="text-white font-bold ml-0.5">{topItem.badgeValue}</span>
                </div>
              )}
            </motion.button>
          </AnimatePresence>
        </div>

        {/* ================= SLOT 2: CENTER EXPANDED CARD ================= */}
        <div className="w-full relative min-h-[300px] flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={`center-${centerItem.id}`}
              custom={direction}
              initial={{
                opacity: 0,
                y: direction > 0 ? 40 : -40,
                scale: 0.94,
                filter: 'blur(4px)',
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
              }}
              exit={{
                opacity: 0,
                y: direction > 0 ? -40 : 40,
                scale: 0.94,
                filter: 'blur(4px)',
              }}
              transition={SMOOTH_SPRING}
              className="w-full bg-[#18181c] rounded-[24px] p-4 sm:p-5 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col gap-3.5 relative overflow-hidden"
            >
              {/* Glowing Top Accent Edge */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#ff3650]/60 to-transparent pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/90 shadow-sm">
                    {centerItem.pillIcon === 'tooth' ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3.5 h-3.5 text-white/90"
                      >
                        <path d="M12 2C7.5 2 4 4.5 4 8c0 3 1.5 5 2 8 0.6 3.5 2 6 4 6 1.5 0 2-2 2-4 0 2 0.5 4 2 4 2 0 3.4-2.5 4-6 0.5-3 2-5 2-8 0-3.5-3.5-6-8-6z" />
                      </svg>
                    ) : centerItem.pillIcon === 'ai' ? (
                      <Sparkles className="w-3.5 h-3.5 text-[#ff3650] fill-[#ff3650]/20" />
                    ) : centerItem.pillIcon === 'flask' ? (
                      <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    {centerItem.cardTitle}
                  </h2>
                </div>

                {centerItem.doctor && (
                  <div className="flex items-center gap-2">
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20 shadow-sm shrink-0">
                      <img
                        src={centerItem.doctor.avatar}
                        alt={centerItem.doctor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-xs font-bold text-white">
                        {centerItem.doctor.name}
                      </span>
                      <span className="text-[10px] font-medium text-white/50">
                        {centerItem.doctor.role}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan / Radiograph Panoramic Display */}
              <div className="relative w-full aspect-[16/7.8] rounded-xl overflow-hidden bg-[#07111e] border border-white/10 shadow-inner flex items-center justify-center group">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-85 transition-transform duration-700 ease-out group-hover:scale-102"
                  style={{
                    backgroundImage: `url('${centerItem.scanImage}')`,
                    filter: 'contrast(1.4) brightness(0.85) hue-rotate(190deg) saturate(1.8)',
                  }}
                />

                {/* Blue Tint Overlay for luminous medical radiograph aesthetic */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#00b4d8]/20 via-[#03045e]/40 to-[#023e8a]/60 mix-blend-color" />
                <div className="absolute inset-0 bg-radial from-transparent via-[#000814]/30 to-[#000814]/80" />

                {/* Glowing Interactive AI Diagnostic Pins */}
                {centerItem.markers.map((marker, mIdx) => {
                  const isSelected = activeMarker?.id === marker.id;
                  return (
                    <motion.div
                      key={marker.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.08 + mIdx * 0.05, ...SMOOTH_SPRING }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMarkerId(marker.id);
                        setSelectedSubPill(marker.name);
                      }}
                      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group/marker"
                    >
                      <div
                        className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isSelected
                            ? 'scale-115 shadow-[0_0_18px_rgba(0,255,200,0.95)]'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{
                          background: isSelected
                            ? 'radial-gradient(circle, rgba(0,255,200,0.95) 0%, rgba(0,180,255,0.75) 45%, rgba(67,97,238,0.35) 70%, transparent 100%)'
                            : 'radial-gradient(circle, rgba(56,189,248,0.75) 0%, rgba(59,130,246,0.4) 50%, transparent 100%)',
                        }}
                      >
                        <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-1.5 sm:border-2 border-white flex items-center justify-center bg-black/50 backdrop-blur-xs">
                          <div
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                              isSelected ? 'bg-[#e0fe3d]' : 'bg-cyan-300'
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Bottom Floating Sub-Pills Bar */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar z-20">
                  {centerItem.bottomPills.map((pName) => {
                    const isActive = selectedSubPill === pName;
                    return (
                      <button
                        key={pName}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubPill(pName);
                          const target = centerItem.markers.find((m) => m.name === pName);
                          if (target) setActiveMarkerId(target.id);
                        }}
                        className={`px-2.5 py-1 sm:px-3 sm:py-1.2 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap backdrop-blur-md transition-all duration-200 cursor-pointer shadow-sm border ${
                          isActive
                            ? 'bg-white text-black border-white shadow-md scale-102 font-bold'
                            : 'bg-black/50 hover:bg-black/70 text-white/90 border-white/20'
                        }`}
                      >
                        {pName}
                      </button>
                    );
                  })}

                  <div className="px-2 py-1 sm:px-2.5 sm:py-1.2 rounded-full text-[10px] sm:text-[11px] font-semibold bg-black/50 text-white/80 backdrop-blur-md border border-white/20 shrink-0">
                    {centerItem.extraBadge}
                  </div>
                </div>
              </div>

              {/* Active Marker Status Strip */}
              {activeMarker && (
                <motion.div
                  key={activeMarker.id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                    <span className="font-bold text-white truncate">{activeMarker.name}</span>
                    <span className="text-white/50 text-[10px] hidden sm:inline">({activeMarker.status})</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-[10px] shrink-0 ml-2">
                    {activeMarker.confidence}
                  </span>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ================= SLOT 3: BOTTOM PILL ================= */}
        <div className="w-full h-[46px] relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.button
              key={`bottom-${bottomItem.id}`}
              custom={direction}
              initial={{ opacity: 0, y: direction > 0 ? 30 : -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: direction > 0 ? -30 : 30, scale: 0.95 }}
              transition={SMOOTH_SPRING}
              onClick={handleNext}
              className="w-full h-full bg-[#1e1e22] hover:bg-[#25252b] active:scale-[0.99] rounded-full px-4 py-2 sm:px-5 border border-white/10 hover:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.35)] flex items-center justify-between transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-white transition-colors">
                  {bottomItem.pillIcon === 'tooth' ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-3.5 h-3.5 text-white/90"
                    >
                      <path d="M12 2C7.5 2 4 4.5 4 8c0 3 1.5 5 2 8 0.6 3.5 2 6 4 6 1.5 0 2-2 2-4 0 2 0.5 4 2 4 2 0 3.4-2.5 4-6 0.5-3 2-5 2-8 0-3.5-3.5-6-8-6z" />
                    </svg>
                  ) : bottomItem.pillIcon === 'ai' ? (
                    <Sparkles className="w-3.5 h-3.5 text-[#ff3650] fill-[#ff3650]/20" />
                  ) : bottomItem.pillIcon === 'flask' ? (
                    <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-[#ff3650] transition-colors">
                  {bottomItem.pillTitle}
                </span>
              </div>

              {bottomItem.doctor && bottomItem.id !== 'ai-report' ? (
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 shadow-sm shrink-0">
                    <img
                      src={bottomItem.doctor.avatar}
                      alt={bottomItem.doctor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[11px] sm:text-xs font-bold text-white">
                      {bottomItem.badgeLabel}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-medium text-white/50">
                      {bottomItem.badgeValue}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-white/50 font-medium">
                  <span>{bottomItem.badgeLabel}</span>
                  <span className="text-white font-bold ml-0.5">{bottomItem.badgeValue}</span>
                </div>
              )}
            </motion.button>
          </AnimatePresence>
        </div>

      </div>

      {/* Modern Compact Carousel Indicator & Manual Controls */}
      <div className="flex items-center justify-center gap-2 mt-2.5">
        <button
          onClick={handlePrev}
          className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title="Scroll Up"
        >
          <ChevronUp className="w-3 h-3" />
        </button>

        <div className="flex items-center gap-1.5">
          {MEDICAL_DATA.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                setDirection(idx > centerIndex ? 1 : -1);
                setCenterIndex(idx);
              }}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                centerIndex === idx ? 'w-5 bg-[#ff3650]' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
              title={item.pillTitle}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title="Scroll Down"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
