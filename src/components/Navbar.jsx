import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness, themeFor } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';

// Tailwind's JIT compiler can't detect dynamically interpolated class names
// (e.g. `bg-${accent}`), so every accent class used anywhere in the app must
// appear as a full literal string somewhere. This lookup is that anchor.
const BADGE_CLASSES = {
  yogart: 'bg-yogart',
  mk: 'bg-mk'
};

export default function Navbar() {
  const { businesses, selected, setSelectedId } = useBusiness();
  const { user, isViewer, logout } = useAuth();
  const navigate = useNavigate();
  const theme = themeFor(selected?.name);

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-line bg-paper">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold text-lg tracking-tight">
            Inventory
          </Link>
          <nav className="hidden sm:flex gap-3 text-sm">
            <Link to="/dashboard" className="text-ink/70 hover:text-ink">
              Overview
            </Link>
            <Link to="/products" className="text-ink/70 hover:text-ink">
              Products
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Only shown when the account has more than one business to switch
              between — SUPER_ADMIN today. OWNER/VIEWER never see this. */}
          {businesses.length > 1 && (
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

          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink/70 hidden sm:inline">
              {user.email}
              {isViewer && <span className="text-ink/40"> · view only</span>}
            </span>
            <button onClick={handleLogout} className="text-ink/50 hover:text-ink underline">
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
