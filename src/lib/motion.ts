// Signature TRIGGER entrance curve: fast attack, long smooth settle.
export const TRIGGER_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Shared transition factory for right-to-left reveal animations.
export const triggerEnter = (delay = 0, duration = 0.9) => ({
  duration,
  delay,
  ease: TRIGGER_EASE,
});
