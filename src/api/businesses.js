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

/**
 * POST /businesses/{id}/logo — multipart logo upload to Cloudinary.
 * Allowed for SUPER_ADMIN (any business) or the OWNER of this business.
 * @param {number} id
 * @param {File} file
 * @returns {Promise<import('./types').Business>} the updated business (with logoUrl)
 */
export function uploadLogo(id, file) {
  const form = new FormData();
  form.append('file', file);
  return http.upload(`/businesses/${id}/logo`, form);
}

/**
 * DELETE /businesses/{id}/logo — remove the logo. Same authorization as upload.
 * @param {number} id
 * @returns {Promise<import('./types').Business>} the updated business (logoUrl cleared)
 */
export function removeLogo(id) {
  return http.del(`/businesses/${id}/logo`);
}

export const businessesApi = { list, create, update, remove, uploadLogo, removeLogo };
