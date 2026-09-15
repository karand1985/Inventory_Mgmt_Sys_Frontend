// Products endpoints — base path /api/v1/products.
import { http } from './client';
import { buildQuery } from './_util';

/**
 * GET /products — paginated, server-side filtered list.
 * Returns a PageResponse<Product>, not a bare array.
 *
 * @param {Object} [params]
 * @param {number} [params.businessId]
 * @param {number} [params.categoryId]
 * @param {number} [params.page=0]
 * @param {number} [params.size=20]
 * @param {string} [params.sort='id,desc']  Spring sort, e.g. "name,asc".
 * @returns {Promise<import('./types').PageResponse<import('./types').Product>>}
 */
export function list({ businessId, categoryId, page, size, sort } = {}) {
  return http.get(`/products${buildQuery({ businessId, categoryId, page, size, sort })}`);
}

/**
 * GET /products/{id}.
 * @param {number} id
 * @returns {Promise<import('./types').Product>}
 */
export function get(id) {
  return http.get(`/products/${id}`);
}

/**
 * POST /products (OWNER/SUPER_ADMIN). `productCode` is required and unique.
 * @param {Object} data
 * @param {number} data.businessId
 * @param {number} data.categoryId
 * @param {string} data.name
 * @param {string} data.productCode
 * @param {number} [data.costPrice]
 * @param {number} [data.sellPrice]
 * @param {string} [data.seasonTag]
 * @returns {Promise<import('./types').Product>}
 */
export function create(data) {
  return http.post('/products', data);
}

/**
 * PUT /products/{id} (OWNER/SUPER_ADMIN).
 * @param {number} id
 * @param {Object} data  Same shape as create().
 * @returns {Promise<import('./types').Product>}
 */
export function update(id, data) {
  return http.put(`/products/${id}`, data);
}

/**
 * DELETE /products/{id} (OWNER/SUPER_ADMIN).
 * @param {number} id
 * @returns {Promise<null>}
 */
export function remove(id) {
  return http.del(`/products/${id}`);
}

export const productsApi = { list, get, create, update, remove };
