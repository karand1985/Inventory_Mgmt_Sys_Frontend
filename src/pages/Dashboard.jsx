import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useBusiness, themeFor } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import BusinessLogo from '../components/BusinessLogo';

const ACCENT_TEXT = { yogart: 'text-yogart', mk: 'text-mk' };

// Money formatter for inventory valuation and sales figures.
const money = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// Shimmer placeholder shown while the dashboard payload is in flight.
function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="iv-skeleton h-7 w-64 mb-2" />
      <div className="iv-skeleton h-4 w-80 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="iv-skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="iv-skeleton h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

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

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  // All-business rollup has no businessName; fall back to the selected label.
  const displayName = data.businessName || selected?.name || 'All businesses';
  const theme = themeFor(displayName);
  const accentText = ACCENT_TEXT[theme.accent];

  // A single KPI tile — icon chip, label, value. `i` drives the stagger delay.
  const stat = (label, value, icon, i, { danger = false, accent = false } = {}) => (
    <div
      className="iv-card iv-glow-border iv-stagger p-4 flex flex-col gap-2"
      style={{ '--i': i }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink/50">{label}</span>
        <span
          className={`material-symbols-outlined text-[20px] ${
            danger ? 'text-red-500' : accent ? accentText : 'text-ink/40'
          }`}
        >
          {icon}
        </span>
      </div>
      <div
        className={`iv-display text-2xl font-extrabold ${
          danger ? 'text-red-600' : accent ? accentText : ''
        }`}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 iv-page-in">
      <div className="flex items-center gap-4 mb-6">
        <BusinessLogo
          name={displayName}
          logoUrl={selected?.logoUrl}
          className="h-14 w-14 rounded-2xl text-xl shrink-0"
        />
        <div>
          <h1 className="iv-display text-2xl font-extrabold mb-0.5">{displayName} — Overview</h1>
          <p className="text-sm text-ink/60">Inventory, valuation and sales at a glance.</p>
        </div>
      </div>

      {/* Inventory counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stat('Products', data.productCount, 'inventory_2', 0, { accent: true })}
        {stat('Units in stock', data.totalStockUnits, 'package_2', 1, { accent: true })}
        {stat(
          `Low stock (≤${data.lowStockThreshold})`,
          data.lowStockCount,
          'warning',
          2,
          { danger: data.lowStockCount > 0 }
        )}
        {stat('Out of stock', data.outOfStockCount, 'production_quantity_limits', 3, {
          danger: data.outOfStockCount > 0
        })}
      </div>

      {/* Valuation + sales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stat('Inventory cost', money(data.inventoryCostValue), 'payments', 4)}
        {stat('Inventory retail', money(data.inventoryRetailValue), 'sell', 5)}
        {stat('Units sold (30d)', data.unitsSoldLast30Days, 'local_shipping', 6)}
        {stat('Revenue (30d)', money(data.salesRevenueLast30Days), 'trending_up', 7)}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <h2 className="iv-display text-sm font-bold mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-ink/40">summarize</span>
            All-time sales
          </h2>
          <div className="iv-card px-4 py-3 text-sm flex items-center justify-between">
            <span className="text-ink/60">Units sold</span>
            <span className="font-semibold">{data.unitsSold}</span>
          </div>
          <div className="iv-card px-4 py-3 text-sm flex items-center justify-between mt-2">
            <span className="text-ink/60">Revenue</span>
            <span className="font-semibold">{money(data.salesRevenue)}</span>
          </div>
          <div className="iv-card px-4 py-3 text-sm flex items-center justify-between mt-2">
            <span className="text-ink/60">Categories</span>
            <span className="font-semibold">{data.categoryCount}</span>
          </div>
        </div>

        <div>
          <h2 className="iv-display text-sm font-bold mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-red-400">priority_high</span>
            Running low
          </h2>
          {(!data.lowStockItems || data.lowStockItems.length === 0) ? (
            <div className="iv-card p-6 text-center text-sm text-ink/50 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[28px] text-green-500">check_circle</span>
              Nothing is running low right now.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.lowStockItems.map((item, i) => (
                <li
                  key={item.productId}
                  className="iv-card iv-card-hover iv-stagger px-3 py-2.5 flex items-center justify-between text-sm"
                  style={{ '--i': i }}
                >
                  <Link to={`/products/${item.productId}`} className="hover:underline font-medium">
                    {item.name}
                    <span className="text-ink/40 font-normal"> · {item.productCode}</span>
                  </Link>
                  <span className="iv-badge bg-red-50 text-red-700 border border-red-200">
                    {item.currentQuantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link to="/products" className="iv-btn iv-btn-ghost inline-flex">
          <span className="material-symbols-outlined text-[18px]">grid_view</span>
          Browse all products
        </Link>
      </div>
    </div>
  );
}