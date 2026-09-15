import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBusiness, themeFor } from '../context/BusinessContext';

const ACCENT_TEXT = { yogart: 'text-yogart', mk: 'text-mk' };

export default function Dashboard() {
  const { businessName } = useAuth();
  const { selected } = useBusiness();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const displayName = selected?.name || businessName;
  const theme = themeFor(displayName);

  useEffect(() => {
    setLoading(true);
    api.dashboard
      .get(selected?.id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [selected]);

  if (loading) return <p className="text-center mt-16 text-ink/60">Loading…</p>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">{displayName} — Overview</h1>
      <p className="text-sm text-ink/60 mb-6">Current stock at a glance.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-line rounded-lg p-4">
          <div className="text-xs text-ink/50">Products</div>
          <div className={`text-2xl font-semibold ${ACCENT_TEXT[theme.accent]}`}>
            {data.totalProducts}
          </div>
        </div>
        <div className="bg-white border border-line rounded-lg p-4">
          <div className="text-xs text-ink/50">Units in stock</div>
          <div className={`text-2xl font-semibold ${ACCENT_TEXT[theme.accent]}`}>
            {data.totalUnitsInStock}
          </div>
        </div>
        <div className="bg-white border border-line rounded-lg p-4">
          <div className="text-xs text-ink/50">Low stock items</div>
          <div className={`text-2xl font-semibold ${data.lowStockItems.length > 0 ? 'text-red-600' : ''}`}>
            {data.lowStockItems.length}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-2">By category</h2>
          {data.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-ink/50">No products yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.categoryBreakdown.map((c) => (
                <li
                  key={c.categoryName}
                  className="bg-white border border-line rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                >
                  <span>{c.categoryName}</span>
                  <span className="text-ink/60">
                    {c.productCount} products · {c.unitsInStock} units
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium mb-2">Running low</h2>
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-ink/50">Nothing is running low right now.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.lowStockItems.map((item) => (
                <li
                  key={item.productId}
                  className="bg-white border border-line rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                >
                  <Link to={`/products/${item.productId}`} className="hover:underline">
                    {item.productName}
                  </Link>
                  <span className="text-red-600 font-medium">
                    {item.currentQuantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link
          to="/products"
          className="text-sm font-medium border border-line rounded-md px-4 py-2 inline-block"
        >
          Browse all products
        </Link>
      </div>
    </div>
  );
}
