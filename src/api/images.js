// Product images + catalog-wide image search — base path /api/v1.
import { http } from './client';
import { buildQuery } from './_util';

/**
 * GET /products/{productId}/images.
 * @param {number} productId
 * @returns {Promise<import('./types').ProductImage[]>}
 */
export function list(productId) {
  return http.get(`/products/${productId}/images`);
}

/**
 * POST /products/{productId}/images/upload — multipart upload to Cloudinary.
 * `tags` may be an array or a comma-separated string.
 *
 * @param {number} productId
 * @param {File} file
 * @param {{ sortOrder?: number, tags?: string[]|string }} [opts]
 * @returns {Promise<import('./types').ProductImage>}
 */
export function upload(productId, file, { sortOrder, tags } = {}) {
  const form = new FormData();
  form.append('file', file);
  if (sortOrder != null) form.append('sortOrder', String(sortOrder));
  // The backend binds `tags` as List<String>. Multipart form-data does NOT split
  // a single comma-joined value, so each tag must be sent as its own field
  // (tags=a, tags=b, ...) — mirroring the working Postman request.
  appendTags(form, tags);
  return http.upload(`/products/${productId}/images/upload`, form);
}

/** Appends each tag as a repeated `tags` field (array or comma-separated string). */
function appendTags(form, tags) {
  if (tags == null) return;
  const list = Array.isArray(tags) ? tags : String(tags).split(',');
  list
    .map((t) => t.trim())
    .filter(Boolean)
    .forEach((t) => form.append('tags', t));
}

/**
 * POST /products/{productId}/images — add an image by URL (JSON).
 * @param {number} productId
 * @param {{ imageUrl: string, sortOrder?: number, tags?: string[] }} data
 * @returns {Promise<import('./types').ProductImage>}
 */
export function addByUrl(productId, data) {
  return http.post(`/products/${productId}/images`, data);
}

/**
 * PUT /products/{productId}/images/{imageId} — update sortOrder/tags.
 * @param {number} productId
 * @param {number} imageId
 * @param {{ sortOrder?: number, tags?: string[] }} data
 * @returns {Promise<import('./types').ProductImage>}
 */
export function update(productId, imageId, data) {
  return http.put(`/products/${productId}/images/${imageId}`, data);
}

/**
 * DELETE /products/{productId}/images/{imageId}.
 * @param {number} productId
 * @param {number} imageId
 * @returns {Promise<null>}
 */
export function remove(productId, imageId) {
  return http.del(`/products/${productId}/images/${imageId}`);
}

/**
 * GET /images/search?tag=&page=&size= — catalog-wide, paginated image search.
 * @param {Object} [params]
 * @param {string} [params.tag]
 * @param {number} [params.page=0]
 * @param {number} [params.size=20]
 * @returns {Promise<import('./types').PageResponse<import('./types').ProductImage>>}
 */
export function search({ tag, page, size } = {}) {
  return http.get(`/images/search${buildQuery({ tag, page, size })}`);
}

/**
 * GET /images/tags?prefix=&limit= — tag autocomplete.
 * @param {Object} [params]
 * @param {string} [params.prefix]
 * @param {number} [params.limit]
 * @returns {Promise<string[]>}
 */
export function tags({ prefix, limit } = {}) {
  return http.get(`/images/tags${buildQuery({ prefix, limit })}`);
}

export const imagesApi = { list, upload, addByUrl, update, remove, search, tags };
