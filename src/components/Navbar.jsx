import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness, themeFor } from '../context/BusinessContext';

// Tailwind's JIT compiler can't detect dynamically interpolated class names
// (e.g. `bg-${accent}`), so every accent class used anywhere in the app must
// appear as a full literal string somewhere. This lookup is that anchor.
const BADGE_CLASSES = {
  yogart: 'bg-yogart',
  mk: 'bg-mk'
};

export default function Navbar() {
  const { businesses, selected, setSelectedId } = useBusiness();
  const navigate = useNavigate();
  const theme = themeFor(selected?.name);

  return (
    <header className="border-b border-line bg-paper">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="font-semibold text-lg tracking-tight">
          Inventory
        </Link>

        {businesses.length > 0 && (
          <select
            className="border border-line rounded-md px-3 py-1.5 bg-white text-sm"
            value={selected?.id || ''}
            onChange={(e) => {
              setSelectedId(e.target.value);
              navigate('/products');
            }}
          >
            <option value="" disabled>
              Choose a business
            </option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        {selected && (
          <span
            className={`hidden sm:inline-block text-xs font-medium px-2.5 py-1 rounded-full text-white ${BADGE_CLASSES[theme.accent]}`}
          >
            {theme.label}
          </span>
        )}
      </div>
    </header>
  );
}
