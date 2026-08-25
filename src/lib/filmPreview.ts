import { WorkItem } from '../types';

let cb: ((work: WorkItem) => void) | null = null;

/** Register the app-level handler that opens the film detail modal. */
export function registerFilmPreview(fn: (work: WorkItem) => void) {
  cb = fn;
}

/** Open the film detail modal from anywhere (e.g. the ⌘K search palette). */
export function openFilmPreview(work: WorkItem) {
  cb?.(work);
}
