import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useBusiness, themeFor } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';

const ACCENT_TEXT = { yogart: 'text-yogart', mk: 'text-mk' };
const ACCENT_BG = { yogart: 'bg-yogart', mk: 'bg-mk' };

export default function ProductList() {
  const { selected } = useBusiness();
  const { isViewer } = useAuth();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const theme = themeFor(selected?.name);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    Promise.all([
      api.categories.list(selected.id),
      api.products.list(selected.id, categoryId || undefined)
    ])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, [selected, categoryId]);

  if (!selected) {
    return (
      <p className="text-center mt-16 text-ink/60">
        Pick a business first — use the switcher above.
      </p>
    );
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-semibold">{selected.name} — Stock</h1>
        {!isViewer && (
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
          placeholder="Search products…"
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
          No products yet. Add the first one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const cover = p.images?.[0]?.imageUrl;
            const lowStock = p.currentQuantity <= (p.lowStockThreshold ?? 3);
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
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-ink/70">₹{p.sellPrice}</span>
                    <span
                      className={`text-xs font-medium ${lowStock ? 'text-red-600' : 'text-ink/60'}`}
                    >
                      {p.currentQuantity} in stock
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
