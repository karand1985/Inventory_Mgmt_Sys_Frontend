import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBusiness, themeFor } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import BusinessSwitcher from './BusinessSwitcher';

// Tailwind's JIT compiler can't detect dynamically interpolated class names
// (e.g. `bg-${accent}`), so every accent class used anywhere in the app must
// appear as a full literal string somewhere. This lookup is that anchor.
const BADGE_CLASSES = {
  yogart: 'bg-yogart',
  mk: 'bg-mk'
};

export default function Navbar() {
  const { businesses, selected } = useBusiness();
  const { user, isViewer, canWrite, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const theme = themeFor(selected?.name);

  if (!user) return null;

  // Business-scoped screens (Overview/Products/Images/Categories) can't render
  // without a selected business, so we hide those links until one is chosen.
  // Global SUPER_ADMIN links (Businesses/Users) stay visible so an admin with
  // no selection yet can still create or pick a business.
  const hasBusiness = Boolean(selected);

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
            {/* Business-scoped links — only when a business is selected. */}
            {hasBusiness && (
              <>
                <Link to="/dashboard" className="text-ink/70 hover:text-ink">
                  Overview
                </Link>
                <Link to="/products" className="text-ink/70 hover:text-ink">
                  Products
                </Link>
                <Link to="/images" className="text-ink/70 hover:text-ink">
                  Images
                </Link>
                {/* Category admin — scoped to the selected business; write roles only. */}
                {canWrite && (
                  <Link to="/catalog" className="text-ink/70 hover:text-ink">
                    Categories
                  </Link>
                )}
              </>
            )}
            {/* Business admin — SUPER_ADMIN only. */}
            {isSuperAdmin && (
              <Link to="/businesses" className="text-ink/70 hover:text-ink">
                Businesses
              </Link>
            )}
            {/* User administration — SUPER_ADMIN only. */}
            {isSuperAdmin && (
              <Link to="/users" className="text-ink/70 hover:text-ink">
                Users
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Only shown when the account has more than one business to switch
              between — SUPER_ADMIN today. OWNER/VIEWER never see this. Switching
              here changes business without logging out; we route to the
              dashboard so the newly-selected business's data loads fresh. The
              same dropdown is reused on the /select-business page. */}
          {businesses.length > 1 && (
            <BusinessSwitcher align="right" onSelected={() => navigate('/dashboard')} />
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
            <Link
              to="/change-password"
              className="text-ink/50 hover:text-ink underline hidden sm:inline"
            >
              Password
            </Link>
            <button onClick={handleLogout} className="text-ink/50 hover:text-ink underline">
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
