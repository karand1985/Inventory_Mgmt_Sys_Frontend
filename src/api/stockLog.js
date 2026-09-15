// Stock-log endpoints — base path /api/v1/products/{productId}/stock-log.
import { http } from './client';

/**
 * GET /products/{productId}/stock-log — movement history for a product.
 * @param {number} productId
 * @returns {Promise<import('./types').StockLogEntry[]>}
 */
export function history(productId) {
  return http.get(`/products/${productId}/stock-log`);
}

/**
 * POST /products/{productId}/stock-log (OWNER/SUPER_ADMIN).
 * @param {number} productId
 * @param {Object} data
 * @param {'IN'|'OUT'|'SOLD'} data.changeType
 * @param {number} data.quantity
 * @param {number} [data.unitPrice]
 * @param {string} [data.note]
 * @param {string} data.eventDate  ISO date (yyyy-MM-dd).
 * @returns {Promise<import('./types').StockLogEntry>}
 */
export function log(productId, data) {
  return http.post(`/products/${productId}/stock-log`, data);
}

export const stockLogApi = { history, log };
