import React, { useEffect, useRef } from 'react';

export interface CoverFlowItem {
  id: string;
  title: string;
  image: string;
}

const C = {
  persp: 1000, // CSS perspective distance (px)
  cw: 150, // cover width (px)
  ch: 220, // cover height (px, portrait)
  gap: 74, // → right per step
  push: 70, // extra shove away from the centre cover
  rot: 48, // side-cover angle about Y (deg)
  depth: 120, // how far the centre cover pops forward (px)
  fall: 46, // how far each further step recedes (px)
};

/**
 * Classic cover-flow carousel: centre cover faces the viewer, side covers
 * angle inward with depth and a floor reflection. Drag to scrub with snap,
 * click a side cover to bring it front, or let it auto-advance. Clicking the
 * already-front cover invokes `onSelect` (e.g. navigate to film detail).
 */
export const CoverFlowCarousel: React.FC<{
  items: CoverFlowItem[];
  onSelect?: (id: string) => void;
}> = ({ items, onSelect }) => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pos = useRef(0);
  const target = useRef(0);
  const moved = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    let dragging = false;
    let lastX = 0;
    let idle = 0;

    const list = () => itemsRef.current;
    const N = () => list().length;

    const wrap = (p: number) => {
      const n = N();
      if (n === 0) return 0;
      p = ((p % n) + n) % n;
      return p > n / 2 ? p - n : p;
    };

    const layout = () => {
      for (let i = 0; i < N(); i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const p = wrap(i - pos.current);
        const side = Math.max(-1, Math.min(1, p));
        const x = p * C.gap + side * C.push;
        const z = (1 - Math.min(1, Math.abs(p))) * C.depth - Math.abs(p) * C.fall;
        el.style.transform = `translate3d(${x}px, 0px, ${z}px) rotateY(${-side * C.rot}deg)`;
        el.style.zIndex = String(200 - Math.round(Math.abs(p) * 10));
        el.style.opacity = String(Math.abs(p) > 3.6 ? 0 : 1);
      }
    };

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dragging && ++idle > 210) {
        // ~3.5s of stillness → advance one cover
        target.current = Math.round(target.current) + 1;
        idle = 0;
      }
      pos.current += (target.current - pos.current) * 0.09;
      layout();
    };
    tick();

    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved.current = 0;
      lastX = e.clientX;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved.current += Math.abs(dx);
      target.current -= dx * 0.006;
      idle = 0;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      target.current = Math.round(target.current); // snap to a cover
      idle = 0;
    };

    const scene = cardRefs.current[0]?.closest('[data-coverflow]');
    scene?.addEventListener('pointerdown', onDown as EventListener);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      cancelAnimationFrame(raf);
      scene?.removeEventListener('pointerdown', onDown as EventListener);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const bringToFront = (i: number) => {
    if (moved.current > 6) return; // it was a drag, not a click
    const n = itemsRef.current.length;
    if (n === 0) return;
    let p = ((i - pos.current) % n) + (i - pos.current < 0 ? n : 0);
    if (p > n / 2) p -= n;
    if (Math.abs(p) < 0.5) {
      // already at the front → select / navigate
      onSelect?.(itemsRef.current[i].id);
      return;
    }
    target.current = Math.round(pos.current + p);
  };

  if (items.length === 0) return null;

  return (
    <div
      data-coverflow
      className="relative flex h-[460px] w-full cursor-grab select-none items-center justify-center overflow-hidden active:cursor-grabbing"
      style={{ perspective: `${C.persp}px` }}
    >
      <div className="relative -mt-4" style={{ transformStyle: 'preserve-3d' }}>
        {items.map((cover, i) => (
          <div
            key={cover.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            onClick={() => bringToFront(i)}
            className="absolute"
            style={{
              width: C.cw,
              height: C.ch * 1.5,
              marginLeft: -C.cw / 2,
              marginTop: -C.ch / 2,
              willChange: 'transform, opacity',
            }}
          >
            <div className="overflow-hidden rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/20">
              {cover.image ? (
                <img
                  src={cover.image}
                  alt={cover.title}
                  draggable={false}
                  style={{ width: C.cw, height: C.ch }}
                  className="object-cover"
                />
              ) : (
                <div
                  style={{ width: C.cw, height: C.ch }}
                  className="flex items-center justify-center bg-gradient-to-b from-[#2a2a2c] to-[#121212] text-white/30 font-black text-4xl"
                >
                  {cover.title.slice(0, 1)}
                </div>
              )}
            </div>
            {/* floor reflection — a flipped copy fading out under the cover */}
            <div
              className="mt-1 overflow-hidden rounded-xl opacity-40"
              style={{
                transform: 'scaleY(-1)',
                maskImage: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)',
              }}
            >
              {cover.image ? (
                <img
                  src={cover.image}
                  alt=""
                  aria-hidden
                  draggable={false}
                  style={{ width: C.cw, height: C.ch }}
                  className="object-cover"
                />
              ) : (
                <div style={{ width: C.cw, height: C.ch }} className="bg-gradient-to-b from-[#2a2a2c] to-[#121212]" />
              )}
            </div>
            <p className="pointer-events-none absolute -bottom-3 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-widest text-white/50 drop-shadow">
              {cover.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
