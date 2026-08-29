export function presentLiveScreenings(payload: unknown): unknown[] {
  return Array.isArray(payload) ? payload : [];
}
