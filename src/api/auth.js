// Auth endpoints — base path /api/v1/auth.
import { http } from './client';

/**
 * POST /auth/login (public).
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('./types').LoginResponse>}
 */
export function login(email, password) {
  return http.post('/auth/login', { email, password });
}

/**
 * POST /auth/register (SUPER_ADMIN only) — creates a new user.
 * @param {{ email: string, password: string, role: 'SUPER_ADMIN'|'OWNER'|'VIEWER', businessId?: number }} data
 * @returns {Promise<import('./types').User>}
 */
export function register(data) {
  return http.post('/auth/register', data);
}

export const authApi = { login, register };
