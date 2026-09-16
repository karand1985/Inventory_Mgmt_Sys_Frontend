// Categories endpoints — base path /api/v1/categories.
import { http } from './client';
import { buildQuery } from './_util';

/**
 * GET /categories?businessId= — categories for a business.
 * @param {number} businessId
 * @returns {Promise<import('./types').Category[]>}
 */
export function list(businessId) {
  return http.get(`/categories${buildQuery({ businessId })}`);
}

/**
 * POST /categories (OWNER/SUPER_ADMIN).
 * Pass `parentId` to create a sub-category under an existing top-level category.
 * @param {{ businessId: number, name: string, parentId?: number|null }} data
 * @returns {Promise<import('./types').Category>}
 */
export function create(data) {
  return http.post('/categories', data);
}

/**
 * PUT /categories/{id} (OWNER/SUPER_ADMIN).
 * @param {number} id
 * @param {{ businessId: number, name: string, parentId?: number|null }} data
 * @returns {Promise<import('./types').Category>}
 */
export function update(id, data) {
  return http.put(`/categories/${id}`, data);
}

/**
 * DELETE /categories/{id} (OWNER/SUPER_ADMIN).
 * @param {number} id
 * @returns {Promise<null>}
 */
export function remove(id) {
  return http.del(`/categories/${id}`);
}

export const categoriesApi = { list, create, update, remove };
