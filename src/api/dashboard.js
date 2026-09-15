// Dashboard endpoints — base path /api/v1/dashboard.
import { http } from './client';
import { buildQuery } from './_util';

/**
 * GET /dashboard?businessId= — snapshot for one business, or an all-business
 * rollup when businessId is omitted.
 * @param {number} [businessId]
 * @returns {Promise<import('./types').DashboardResponse>}
 */
export function get(businessId) {
  return http.get(`/dashboard${buildQuery({ businessId })}`);
}

/**
 * GET /dashboard/businesses — one snapshot per business (SUPER_ADMIN overview).
 * @returns {Promise<import('./types').DashboardResponse[]>}
 */
export function byBusiness() {
  return http.get('/dashboard/businesses');
}

export const dashboardApi = { get, byBusiness };
