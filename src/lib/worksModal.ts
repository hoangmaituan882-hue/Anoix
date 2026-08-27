let openWorksCb: (() => void) | null = null;

/** Register the app-level handler that opens the All Works Library modal. */
export function registerWorksModal(fn: () => void) {
  openWorksCb = fn;
}

/** Open the All Works Library modal from anywhere (e.g. Context Menu or Shortcuts). */
export function openAllWorksModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-all-works-modal'));
  }
  openWorksCb?.();
}
