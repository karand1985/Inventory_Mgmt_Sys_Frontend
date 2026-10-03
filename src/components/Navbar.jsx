import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useBusiness, themeFor } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import BusinessSwitcher from './BusinessSwitcher';
import BusinessLogo from './BusinessLogo';

// Tailwind's JIT compiler can't detect dynamically interpolated class names
// (e.g. `bg-${accent}`), so every accent class used anywhere in the app must
// appear as a full literal string somewhere. This lookup is that anchor.
const BADGE_CLASSES = {
  yogart: 'bg-yogart',
  mk: 'bg-mk'
};

// Shared styling for the top-nav links, with a glowing underline when active.
function navClass({ isActive }) {
  return [
    'relative flex items-center gap-1.5 text-sm font-medium transition-colors',
    isActive ? 'iv-nav-active' : 'text-ink/65 hover:text-ink'
  ].join(' ');
}

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
    <header className="iv-glass sticky top-0 z-40 border-b border-line/70">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2">
            <span
              className="h-8 w-8 rounded-lg grid place-items-center text-white shadow-soft"
              style={{ backgroundImage: 'linear-gradient(135deg, rgb(var(--iv-accent)), rgb(var(--iv-accent-dark)))' }}
            >
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            </span>
            <span className="iv-display font-extrabold text-lg tracking-tight">Inventory</span>
          </Link>
          <nav className="hidden sm:flex gap-5 text-sm">
            {/* Business-scoped links — only when a business is selected. */}
            {hasBusiness && (
              <>
                <NavLink to="/dashboard" className={navClass}>
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  Overview
                </NavLink>
                <NavLink to="/products" className={navClass}>
                  <span className="material-symbols-outlined text-[18px]">inventory</span>
                  Products
                </NavLink>
                <NavLink to="/images" className={navClass}>
                  <span className="material-symbols-outlined text-[18px]">image</span>
                  Images
                </NavLink>
                {/* Category admin — scoped to the selected business; write roles only. */}
                {canWrite && (
                  <NavLink to="/catalog" className={navClass}>
                    <span className="material-symbols-outlined text-[18px]">category</span>
                    Categories
                  </NavLink>
                )}
              </>
            )}
            {/* Business admin — SUPER_ADMIN only. */}
            {isSuperAdmin && (
              <NavLink to="/businesses" className={navClass}>
                <span className="material-symbols-outlined text-[18px]">store</span>
                Businesses
              </NavLink>
            )}
            {/* User administration — SUPER_ADMIN only. */}
            {isSuperAdmin && (
              <NavLink to="/users" className={navClass}>
                <span className="material-symbols-outlined text-[18px]">group</span>
                Users
              </NavLink>
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
              className={`iv-badge hidden sm:inline-flex text-white shadow-soft ${BADGE_CLASSES[theme.accent]}`}
            >
              <BusinessLogo
                name={selected.name}
                logoUrl={selected.logoUrl}
                className="h-4 w-4 rounded-full text-[9px] !shadow-none"
              />
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
              className="text-ink/50 hover:text-ink transition-colors hidden sm:inline-flex items-center"
              title="Change password"
            >
              <span className="material-symbols-outlined text-[20px]">key</span>
            </Link>
            <button
              onClick={handleLogout}
              className="iv-btn iv-btn-ghost !px-2.5 !py-1.5 text-xs"
              title="Log out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
