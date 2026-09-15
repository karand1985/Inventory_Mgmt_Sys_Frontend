// Shared helpers for the typed API modules.

/**
 * Builds a query string from a params object, skipping null/undefined/'' values
 * so callers can pass optional filters without guarding each one.
 * Returns '' when there are no params, or '?a=1&b=2' otherwise.
 *
 * @param {Record<string, string|number|boolean|null|undefined>} [params]
 * @returns {string}
 */
export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
