// -----------------------------------------------------------------------------
// JSDoc "types" for the backend contract. This file has no runtime output — it
// exists so editors give autocomplete/hover docs across the API modules and
// screens without pulling in TypeScript. Import a type in JSDoc like:
//   /** @param {import('./types').Product} product */
// -----------------------------------------------------------------------------

/**
 * Generic Spring pagination envelope returned by list endpoints.
 * @template T
 * @typedef {Object} PageResponse
 * @property {T[]} content
 * @property {number} page
 * @property {number} size
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {boolean} first
 * @property {boolean} last
 */

/**
 * Successful login response from POST /auth/login.
 * @typedef {Object} LoginResponse
 * @property {string} token
 * @property {'Bearer'} tokenType
 * @property {string} email
 * @property {'SUPER_ADMIN'|'OWNER'|'VIEWER'} role
 * @property {number} expiresInMs
 */

/**
 * Audit metadata stamped on every entity by Spring Data JPA auditing.
 * @typedef {Object} AuditFields
 * @property {string} [createdAt]  ISO date-time of insert.
 * @property {string} [updatedAt]  ISO date-time of last update.
 * @property {string} [createdBy]  Email of the creating user (or "system").
 * @property {string} [updatedBy]  Email of the last-updating user (or "system").
 */

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} email
 * @property {'SUPER_ADMIN'|'OWNER'|'VIEWER'} role
 * @property {boolean} enabled
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 * @property {string} [createdBy]
 * @property {string} [updatedBy]
 */

/**
 * @typedef {Object} Business
 * @property {number} id
 * @property {string} name
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 * @property {string} [createdBy]
 * @property {string} [updatedBy]
 */

/**
 * @typedef {Object} Category
 * @property {number} id
 * @property {number} businessId
 * @property {string} name
 * @property {number} [parentId]     Null/absent for top-level categories.
 * @property {string} [parentName]   Name of the parent category, when nested.
 * @property {boolean} [hasChildren] True when this node has sub-categories (so it
 *                                   cannot directly hold products — products
 *                                   attach to leaf categories only).
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 * @property {string} [createdBy]
 * @property {string} [updatedBy]
 */

/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {number} businessId
 * @property {number} categoryId
 * @property {string} name
 * @property {string} productCode  Required, unique admin SKU (e.g. "MK-01-J").
 * @property {number} [costPrice]
 * @property {number} [sellPrice]
 * @property {string} [seasonTag]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 * @property {string} [createdBy]
 * @property {string} [updatedBy]
 */

/**
 * @typedef {Object} ProductImage
 * @property {number} id
 * @property {number} productId
 * @property {string} imageUrl
 * @property {number} [sortOrder]
 * @property {string[]} [tags]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 * @property {string} [createdBy]
 * @property {string} [updatedBy]
 */

/**
 * @typedef {Object} StockLogEntry
 * @property {number} id
 * @property {number} productId
 * @property {'IN'|'OUT'|'SOLD'} changeType
 * @property {number} quantity
 * @property {number} [unitPrice]
 * @property {string} [note]
 * @property {string} eventDate  ISO date (yyyy-MM-dd).
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 * @property {string} [createdBy]
 * @property {string} [updatedBy]
 */

/**
 * Per-business snapshot from GET /dashboard.
 * @typedef {Object} DashboardResponse
 * @property {number} [businessId]
 * @property {string} [businessName]
 * @property {number} productCount
 * @property {number} categoryCount
 * @property {number} totalStockUnits
 * @property {number} outOfStockCount
 * @property {number} lowStockCount
 * @property {number} lowStockThreshold
 * @property {number} inventoryCostValue
 * @property {number} inventoryRetailValue
 * @property {number} unitsSold
 * @property {number} salesRevenue
 * @property {number} unitsSoldLast30Days
 * @property {number} salesRevenueLast30Days
 * @property {DashboardLowStockItem[]} lowStockItems
 */

/**
 * @typedef {Object} DashboardLowStockItem
 * @property {number} productId
 * @property {string} name
 * @property {string} productCode
 * @property {number} currentQuantity
 */

export {};
