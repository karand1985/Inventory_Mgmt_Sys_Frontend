import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useBusiness, themeFor } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ACCENT_BG = { yogart: 'bg-yogart', mk: 'bg-mk' };

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

  const theme = themeFor(selected?.name);

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
  // Name search is applied client-side to the current page only. Server-side
  // name filtering isn't part of the API contract, so this narrows what's on
  // screen without claiming to search the whole catalog.
  const filtered = query
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : products;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-semibold">{selected.name} — Stock</h1>
        {canWrite && (
          <Link
            to="/products/new"
            className={`text-white text-sm font-medium px-4 py-2 rounded-md ${ACCENT_BG[theme.accent]}`}
          >
            Add product
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search this page…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-line rounded-md px-3 py-2 text-sm flex-1 min-w-[180px] bg-white"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border border-line rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-ink/60">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-ink/60">
          {query
            ? 'No products on this page match your search.'
            : 'No products yet. Add the first one to get started.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const cover = p.images?.[0]?.imageUrl;
            const lowStock = (p.currentQuantity ?? 0) <= LOW_STOCK_AT;
            return (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="block bg-white border border-line rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-line/40 flex items-center justify-center">
                  {cover ? (
                    <img src={cover} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-ink/30 text-xs">No photo</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-ink/40 truncate">{p.productCode}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-ink/70">₹{p.sellPrice ?? '—'}</span>
                    <span
                      className={`text-xs font-medium ${lowStock ? 'text-red-600' : 'text-ink/60'}`}
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
            className="text-sm font-medium border border-line rounded-md px-4 py-2 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-ink/60">
            Page {pageData.page + 1} of {pageData.totalPages}
            <span className="text-ink/40"> · {pageData.totalElements} total</span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={pageData.last}
            className="text-sm font-medium border border-line rounded-md px-4 py-2 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}