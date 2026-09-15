import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useBusiness, themeFor } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';

const ACCENT_TEXT = { yogart: 'text-yogart', mk: 'text-mk' };

// Money formatter for inventory valuation and sales figures.
const money = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { selected } = useBusiness();
  const { error: toastError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.dashboard
      .get(selected?.id)
      .then(setData)
      .catch((err) => toastError(err.message))
      .finally(() => setLoading(false));
  }, [selected]);

  if (loading) return <p className="text-center mt-16 text-ink/60">Loading…</p>;
  if (!data) return null;

  // All-business rollup has no businessName; fall back to the selected label.
  const displayName = data.businessName || selected?.name || 'All businesses';
  const theme = themeFor(displayName);
  const accentText = ACCENT_TEXT[theme.accent];

  const stat = (label, value, cls = '') => (
    <div className="bg-white border border-line rounded-lg p-4">
      <div className="text-xs text-ink/50">{label}</div>
      <div className={`text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">{displayName} — Overview</h1>
      <p className="text-sm text-ink/60 mb-6">Inventory, valuation and sales at a glance.</p>

      {/* Inventory counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stat('Products', data.productCount, accentText)}
        {stat('Units in stock', data.totalStockUnits, accentText)}
        {stat(
          `Low stock (≤${data.lowStockThreshold})`,
          data.lowStockCount,
          data.lowStockCount > 0 ? 'text-red-600' : ''
        )}
        {stat(
          'Out of stock',
          data.outOfStockCount,
          data.outOfStockCount > 0 ? 'text-red-600' : ''
        )}
      </div>

      {/* Valuation + sales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stat('Inventory cost', money(data.inventoryCostValue))}
        {stat('Inventory retail', money(data.inventoryRetailValue))}
        {stat('Units sold (30d)', data.unitsSoldLast30Days)}
        {stat('Revenue (30d)', money(data.salesRevenueLast30Days))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-2">All-time sales</h2>
          <div className="bg-white border border-line rounded-lg px-4 py-3 text-sm flex items-center justify-between">
            <span className="text-ink/60">Units sold</span>
            <span className="font-medium">{data.unitsSold}</span>
          </div>
          <div className="bg-white border border-line rounded-lg px-4 py-3 text-sm flex items-center justify-between mt-2">
            <span className="text-ink/60">Revenue</span>
            <span className="font-medium">{money(data.salesRevenue)}</span>
          </div>
          <div className="bg-white border border-line rounded-lg px-4 py-3 text-sm flex items-center justify-between mt-2">
            <span className="text-ink/60">Categories</span>
            <span className="font-medium">{data.categoryCount}</span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium mb-2">Running low</h2>
          {(!data.lowStockItems || data.lowStockItems.length === 0) ? (
            <p className="text-sm text-ink/50">Nothing is running low right now.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.lowStockItems.map((item) => (
                <li
                  key={item.productId}
                  className="bg-white border border-line rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                >
                  <Link to={`/products/${item.productId}`} className="hover:underline">
                    {item.name}
                    <span className="text-ink/40"> · {item.productCode}</span>
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