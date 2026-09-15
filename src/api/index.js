// -----------------------------------------------------------------------------
// Typed API barrel. This is the canonical entry point for screens:
//   import { api } from '../api';                 // grouped facade
//   import { productsApi } from '../api';         // one resource
//   import { ApiError, onAuthEvent } from '../api'; // client primitives
//
// Each resource lives in its own module (auth, users, businesses, categories,
// products, stockLog, images, dashboard) and matches the /api/v1 contract
// exactly (pagination params, productCode, image upload/URL/tags, tag search).
//
// NOTE: the legacy `api` facade in ./client is a migration shim kept only so
// not-yet-migrated screens keep working; new code should import from here.
// -----------------------------------------------------------------------------
import { authApi } from './auth';
import { usersApi } from './users';
import { businessesApi } from './businesses';
import { categoriesApi } from './categories';
import { productsApi } from './products';
import { stockLogApi } from './stockLog';
import { imagesApi } from './images';
import { dashboardApi } from './dashboard';

// Re-export client primitives so callers have a single import surface.
export { ApiError, onAuthEvent, getToken, http, apiFetch } from './client';

// Named per-resource modules.
export { authApi } from './auth';
export { usersApi } from './users';
export { businessesApi } from './businesses';
export { categoriesApi } from './categories';
export { productsApi } from './products';
export { stockLogApi } from './stockLog';
export { imagesApi } from './images';
export { dashboardApi } from './dashboard';

/**
 * Grouped facade over every resource module. Uses the same resource keys as the
 * legacy shim (products/categories/...) but with the corrected, fully-typed
 * signatures (e.g. products.list takes a params object and returns a
 * PageResponse).
 */
export const api = {
  auth: authApi,
  users: usersApi,
  businesses: businessesApi,
  categories: categoriesApi,
  products: productsApi,
  stockLog: stockLogApi,
  images: imagesApi,
  dashboard: dashboardApi,
};
