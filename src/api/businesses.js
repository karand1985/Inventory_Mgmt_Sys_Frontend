// Businesses endpoints — base path /api/v1/businesses.
import { http } from './client';

/**
 * GET /businesses — visible businesses for the current user.
 * @returns {Promise<import('./types').Business[]>}
 */
export function list() {
  return http.get('/businesses');
}

/**
 * POST /businesses (OWNER/SUPER_ADMIN).
 * @param {{ name: string }} data
 * @returns {Promise<import('./types').Business>}
 */
export function create(data) {
  return http.post('/businesses', data);
}

/**
 * PUT /businesses/{id} (OWNER/SUPER_ADMIN).
 * @param {number} id
 * @param {{ name: string }} data
 * @returns {Promise<import('./types').Business>}
 */
export function update(id, data) {
  return http.put(`/businesses/${id}`, data);
}

/**
 * DELETE /businesses/{id} (OWNER/SUPER_ADMIN).
 * @param {number} id
 * @returns {Promise<null>}
 */
export function remove(id) {
  return http.del(`/businesses/${id}`);
}

export const businessesApi = { list, create, update, remove };
