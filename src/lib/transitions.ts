import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * transitions.dev Helper Utilities & React Hooks
 * Provides production-ready orchestrations for dropdowns, modals, 3D card tilts, success checks, etc.
 */

/**
 * Hook for 3D Card Hover Tilt with cursor-tracked lighting glare.
 * Corresponds to transitions.dev 19-card-tilt.
 */
export function useCardTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const px = (x / rect.width - 0.5) * 2; // -1 to 1
      const py = (y / rect.height - 0.5) * 2; // -1 to 1

      const rotX = -py * 10;
      const rotY = px * 10;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
      });
    };

    const handlePointerLeave = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    };

    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return ref;
}

/**
 * Hook for triggering Error State Shake.
 * Corresponds to transitions.dev 12-error-state-shake.
 */
export function useErrorShake<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const triggerShake = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    el.classList.remove('is-shaking');
    void el.offsetWidth; // Force reflow
    el.classList.add('is-shaking');

    setTimeout(() => {
      el.classList.remove('is-shaking');
    }, 400);
  }, []);

  return { ref, triggerShake };
}

/**
 * Hook for Text States Swap with blurred up/down movement.
 * Corresponds to transitions.dev 04-text-states-swap.
 */
export function useTextSwap(initialText: string) {
  const [text, setText] = useState(initialText);
  const [swapping, setSwapping] = useState(false);

  const swapTo = useCallback((newText: string) => {
    if (newText === text) return;
    setSwapping(true);
    setTimeout(() => {
      setText(newText);
      setSwapping(false);
    }, 150);
  }, [text]);

  return { text, swapping, swapTo };
}
