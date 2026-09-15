// Central app configuration derived from Vite env vars.
//
// API base URL is configurable so the same build can target different
// backends without code changes:
//   - dev (default): '/api/v1' — Vite proxies /api -> http://localhost:8080
//     (see vite.config.js), so calls stay same-origin and CORS never triggers.
//   - other envs: set VITE_API_BASE_URL (e.g. https://api.example.com/api/v1).
//
// Note: the backend contract lives under /api/v1, so the default already
// includes the version segment.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

// localStorage key holding the persisted auth session ({ token, email, role, ... }).
export const AUTH_STORAGE_KEY = 'inventory_auth';
