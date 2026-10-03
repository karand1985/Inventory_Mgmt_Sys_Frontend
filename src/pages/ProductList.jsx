import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// The backend has no per-product low-stock threshold; the dashboard treats <=5
// as "running low", so we mirror that here for the stock badge colour.
const LOW_STOCK_AT = 5;
const PAGE_SIZE = 20;

export default function ProductList() {
  const { selected } = useBusiness();
  const { canWrite } = useAuth();
  const { error: toastError } = useToast();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null); // PageResponse<Product>
  const [loading, setLoading] = useState(true);

  // Load categories whenever the selected business changes.
  useEffect(() => {
    if (!selected) return;
    api.categories
      .list(selected.id)
      .then(setCategories)
      .catch((err) => toastError(err.message));
  }, [selected]);

  // Reset to the first page when the business or category filter changes.
  useEffect(() => {
    setPage(0);
  }, [selected, categoryId]);

  // Server-side paginated + filtered product fetch.
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.products
      .list({
        businessId: selected.id,
        categoryId: categoryId || undefined,
        page,
        size: PAGE_SIZE,
        sort: 'id,desc',
      })
      .then(setPageData)
      .catch((err) => toastError(err.message))
      .finally(() => setLoading(false));
  }, [selected, categoryId, page]);

  if (!selected) {
    return (
      <p className="text-center mt-16 text-ink/60">
        Pick a business first — use the switcher above.
      </p>
    );
  }

  const products = pageData?.content ?? [];
  // Build a two-level view of the category list for the filter dropdown: each
  // root category, immediately followed by its sub-categories (indented). The
  // backend expands a selected parent to include all of its sub-categories, so
  // choosing a parent here returns products from every sub-category beneath it.
  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (id) => categories.filter((c) => c.parentId === id);
  // Name search is applied client-side to the current page only. Server-side
  // name filtering isn't part of the API contract, so this narrows what's on
  // screen without claiming to search the whole catalog.
  const filtered = query
    ? products.filter((p) => {
        const q = query.toLowerCase();
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.productCode || '').toLowerCase().includes(q)
        );
      })
    : products;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 iv-page-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="iv-display text-2xl font-extrabold">{selected.name} — Stock</h1>
        {canWrite && (
          <Link to="/products/new" className="iv-btn iv-btn-primary">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add product
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined text-[20px] text-ink/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search this page…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="iv-input !pl-10"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="iv-input !w-auto min-w-[180px]"
        >
          <option value="">All categories</option>
          {roots.map((root) => {
            const subs = childrenOf(root.id);
            return subs.length > 0 ? (
              <optgroup key={root.id} label={root.name}>
                <option value={root.id}>{root.name} — all</option>
                {subs.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {'\u00A0\u00A0'}↳ {sub.name}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={root.id} value={root.id}>
                {root.name}
              </option>
            );
          })}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="iv-card overflow-hidden">
              <div className="iv-skeleton aspect-square !rounded-none" />
              <div className="p-3 flex flex-col gap-2">
                <div className="iv-skeleton h-4 w-3/4" />
                <div className="iv-skeleton h-3 w-1/2" />
                <div className="iv-skeleton h-4 w-full mt-1" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="iv-card p-10 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-ink/30">inventory_2</span>
          <p className="text-ink/60">
            {query
              ? 'No products on this page match your search.'
              : 'No products yet. Add the first one to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((p, i) => {
            const cover = p.images?.[0]?.imageUrl;
            const lowStock = (p.currentQuantity ?? 0) <= LOW_STOCK_AT;
            return (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="iv-card iv-card-hover iv-stagger block overflow-hidden group"
                style={{ '--i': i }}
              >
                <div className="aspect-square bg-line/30 flex items-center justify-center overflow-hidden relative">
                  {cover ? (
                    <img
                      src={cover}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[32px] text-ink/25">image</span>
                  )}
                  {lowStock && (
                    <span className="iv-badge bg-red-600/90 text-white absolute top-2 right-2 shadow-soft">
                      Low
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm truncate">{p.name || p.productCode}</div>
                  <div className="text-xs text-ink/40 truncate">{p.productCode}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-semibold text-ink/80">₹{p.sellPrice ?? '—'}</span>
                    <span
                      className={`text-xs font-medium ${lowStock ? 'text-red-600' : 'text-ink/55'}`}
                    >
                      {p.currentQuantity ?? 0} in stock
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Server-side pagination controls. */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={pageData.first}
            className="iv-btn iv-btn-ghost"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            Prev
          </button>
          <span className="text-sm text-ink/60">
            Page {pageData.page + 1} of {pageData.totalPages}
            <span className="text-ink/40"> · {pageData.totalElements} total</span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={pageData.last}
            className="iv-btn iv-btn-ghost"
          >
            Next
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}