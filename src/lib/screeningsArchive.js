/** Club archive/search: live API rows only. Invalid payloads → empty, never seed. */
export function presentLiveScreenings(payload) {
  return Array.isArray(payload) ? payload : [];
}
