import { NewsItem } from '../types';

let cb: ((news: NewsItem) => void) | null = null;

/** Register the app-level handler that opens the news detail modal. */
export function registerNewsPreview(fn: (news: NewsItem) => void) {
  cb = fn;
}

/** Open the news detail modal from anywhere (e.g. the ⌘K search palette). */
export function openNewsPreview(news: NewsItem) {
  cb?.(news);
}
