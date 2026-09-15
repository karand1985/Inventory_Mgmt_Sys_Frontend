import { API_BASE_URL, AUTH_STORAGE_KEY } from '../config';

// -----------------------------------------------------------------------------
// ApiError — mirrors the backend's ApiError JSON shape so callers get structured
// data instead of a stringified blob. Use `.message` for toasts and
// `.fieldErrors` (map of field -> message) to drive form validation.
// -----------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(status, payload = {}, path = '') {
    super(payload.message || `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.error = payload.error;
    this.path = payload.path || path;
    this.timestamp = payload.timestamp;
    // Always an object (possibly empty) so callers can do fieldErrors[name]
    // without null checks.
    this.fieldErrors = payload.fieldErrors || {};
  }
}

// -----------------------------------------------------------------------------
// Auth event bus — the client can't import React/router directly (it's plain
// JS used everywhere), so it emits events that a UI-level bridge subscribes to.
//   'unauthorized' (401): session cleared here; UI should route to /login.
//   'forbidden'    (403): UI should surface a "not allowed" toast.
// -----------------------------------------------------------------------------
const listeners = { unauthorized: new Set(), forbidden: new Set() };

export function onAuthEvent(type, handler) {
  const set = listeners[type];
  if (!set) throw new Error(`Unknown auth event: ${type}`);
  set.add(handler);
  return () => set.delete(handler); // unsubscribe
}

function emitAuthEvent(type, payload) {
  listeners[type]?.forEach((handler) => {
    try {
      handler(payload);
    } catch {
      /* a bad listener must not break the request pipeline */
    }
  });
}

// -----------------------------------------------------------------------------
// Token helpers
// -----------------------------------------------------------------------------
export function getToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function parseError(res, path) {
  // The backend returns ApiError as JSON, but non-API errors (proxy, gateway)
  // may return HTML/text — handle both without throwing here.
  const contentType = res.headers.get('content-type') || '';
  let payload = {};
  try {
    if (contentType.includes('application/json')) {
      payload = await res.json();
    } else {
      const text = await res.text();
      if (text) payload = { message: text };
    }
  } catch {
    /* leave payload empty; ApiError falls back to a generic message */
  }
  return new ApiError(res.status, payload, path);
}

// -----------------------------------------------------------------------------
// Core request pipeline — Bearer interceptor + 401/403 handling + ApiError.
//
// options:
//   method, body (object -> JSON), headers, signal, ...
//   form: pass a FormData instance to send multipart (Content-Type is left to
//         the browser so the boundary is set correctly).
// -----------------------------------------------------------------------------
export async function apiFetch(path, { method = 'GET', body, form, headers = {}, ...rest } = {}) {
  const token = getToken();
  const isMultipart = form instanceof FormData;

  const finalHeaders = {
    ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: isMultipart ? form : body != null ? JSON.stringify(body) : undefined,
      ...rest,
    });
  } catch {
    // fetch only rejects on network failures (offline, DNS, CORS block).
    throw new ApiError(0, { message: 'Network error — is the backend running?' }, path);
  }

  if (res.status === 401) {
    // Session expired or invalid: clear it and let the UI route to login.
    clearStoredSession();
    emitAuthEvent('unauthorized', { path });
    throw await parseError(res, path);
  }

  if (res.status === 403) {
    // Authenticated but not permitted (e.g. VIEWER attempting a write).
    const err = await parseError(res, path);
    emitAuthEvent('forbidden', err);
    throw err;
  }

  if (!res.ok) {
    throw await parseError(res, path);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
}

// Convenience verb helpers built on the pipeline.
export const http = {
  get: (path, opts) => apiFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => apiFetch(path, { ...opts, method: 'DELETE' }),
  upload: (path, form, opts) => apiFetch(path, { ...opts, method: 'POST', form }),
};

// -----------------------------------------------------------------------------
// Legacy `api` facade — kept working against the real /api/v1 contract so
// existing screens don't break during the migration. Phase C splits this into
// typed per-resource modules (auth/users/businesses/categories/products/...).
// -----------------------------------------------------------------------------
export const api = {
  businesses: {
    list: () => http.get('/businesses'),
  },
  categories: {
    list: (businessId) => http.get(`/categories?businessId=${businessId}`),
    create: (data) => http.post('/categories', data),
  },
  products: {
    // NOTE: backend returns a PageResponse; screens are updated in Phase D.
    list: (businessId, categoryId) => {
      const params = new URLSearchParams();
      if (businessId) params.set('businessId', businessId);
      if (categoryId) params.set('categoryId', categoryId);
      return http.get(`/products?${params.toString()}`);
    },
    get: (id) => http.get(`/products/${id}`),
    create: (data) => http.post('/products', data),
    update: (id, data) => http.put(`/products/${id}`, data),
    remove: (id) => http.del(`/products/${id}`),
  },
  dashboard: {
    get: (businessId) => http.get(`/dashboard${businessId ? `?businessId=${businessId}` : ''}`),
    byBusiness: () => http.get('/dashboard/businesses'),
  },
  stockLog: {
    history: (productId) => http.get(`/products/${productId}/stock-log`),
    log: (productId, data) => http.post(`/products/${productId}/stock-log`, data),
  },
  images: {
    list: (productId) => http.get(`/products/${productId}/images`),
    // Multipart upload to Cloudinary via the backend. Optional sortOrder and
    // comma-separated tags are supported by the endpoint.
    upload: (productId, file, { sortOrder, tags } = {}) => {
      const form = new FormData();
      form.append('file', file);
      if (sortOrder != null) form.append('sortOrder', String(sortOrder));
      if (tags) form.append('tags', Array.isArray(tags) ? tags.join(',') : tags);
      return http.upload(`/products/${productId}/images/upload`, form);
    },
    remove: (productId, imageId) => http.del(`/products/${productId}/images/${imageId}`),
  },
};
