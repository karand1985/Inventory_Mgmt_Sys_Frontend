// Users endpoints — base path /api/v1/users.
import { http } from './client';

/**
 * GET /users (SUPER_ADMIN only) — all users.
 * @returns {Promise<import('./types').User[]>}
 */
export function list() {
  return http.get('/users');
}

/**
 * GET /users/me — the current authenticated user.
 * @returns {Promise<import('./types').User>}
 */
export function me() {
  return http.get('/users/me');
}

/**
 * PUT /users/me/password — change own password. Resolves to null (204).
 * @param {{ currentPassword: string, newPassword: string }} data
 * @returns {Promise<null>}
 */
export function changePassword(data) {
  return http.put('/users/me/password', data);
}

/**
 * PATCH /users/{id}/status (SUPER_ADMIN) — enable/disable a user.
 * @param {number} id
 * @param {boolean} enabled
 * @returns {Promise<import('./types').User>}
 */
export function setStatus(id, enabled) {
  return http.patch(`/users/${id}/status`, { enabled });
}

/**
 * PUT /users/{id} (SUPER_ADMIN) — edit a user. Email is immutable and must not
 * be sent. Leave `password` blank/omitted to keep the current password.
 * @param {number} id
 * @param {{ name: string, role: string, businessId?: number|null, password?: string|null }} data
 * @returns {Promise<import('./types').User>}
 */
export function update(id, data) {
  return http.put(`/users/${id}`, data);
}

export const usersApi = { list, me, changePassword, setStatus, update };
