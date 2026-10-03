import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const BusinessContext = createContext(null);

// Maps a business name to its accent theme. Falls back to the mk palette
// for any business not explicitly listed, so a new business added later
// doesn't break styling.
export function themeFor(businessName) {
  if (businessName === 'Yogart Gallery') {
    return { accent: 'yogart', label: 'Yogart Gallery' };
  }
  return { accent: 'mk', label: businessName || 'MK Creations' };
}

export function BusinessProvider({ children }) {
  const { token, isSuperAdmin } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedId, setSelectedId] = useState(() => {
    // SUPER_ADMIN selection is session-only: never restore it from a previous
    // page load, so an admin always starts at the picker / admin area instead of
    // being dropped back into a business on refresh. OWNER/VIEWER restore their
    // last selection (they auto-select their single business anyway).
    if (isSuperAdmin) return null;
    return localStorage.getItem('selectedBusinessId') || null;
  });
  const [loading, setLoading] = useState(true);

  // Fetches the roster the current account can see and reconciles the selection.
  // Exposed as `refresh()` so screens that mutate businesses (create/rename/
  // delete) can update the switcher live without a full page reload.
  const refresh = useCallback(() => {
    if (!token) return Promise.resolve([]);
    setLoading(true);
    return api.businesses
      .list()
      .then((list) => {
        setBusinesses(list);
        setSelectedId((current) => {
          // Auto-select the only business for single-business roles (OWNER/
          // VIEWER) so they never see an unnecessary picker. SUPER_ADMIN is a
          // multi-business role by nature and must choose explicitly — never
          // auto-drop them into a business, even when only one exists, or their
          // admin landing (Businesses/Users) would be hijacked by that business.
          if (!isSuperAdmin && list.length === 1) return list[0].id;
          // Drop a stale/foreign persisted id (e.g. left over from another
          // account) or one that was just deleted and is no longer in the roster.
          if (current && !list.some((b) => String(b.id) === String(current))) {
            return null;
          }
          return current;
        });
        return list;
      })
      .finally(() => setLoading(false));
  }, [token, isSuperAdmin]);

  useEffect(() => {
    if (!token) {
      // Logged out (or session expired): forget the roster AND the selected
      // business. Clearing the selection prevents one account's choice from
      // bleeding into the next person who signs in on the same browser — e.g. a
      // SUPER_ADMIN returning after an OWNER session would otherwise inherit a
      // leftover selection and land in business context instead of the admin
      // area (where only Businesses/Users should show). OWNER/VIEWER simply
      // auto-select their single business again on their next login.
      setBusinesses([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [token, refresh]);

  // Keep localStorage in lockstep with the selection — persist when set, and
  // remove the key entirely when cleared so nothing stale lingers.
  useEffect(() => {
    // SUPER_ADMIN selection is intentionally session-only (in-memory): never
    // persist it, and proactively clear any legacy key so a stale choice can't
    // survive a reload and hijack the admin landing. OWNER/VIEWER persist as
    // normal (harmless — they auto-select their single business regardless).
    if (isSuperAdmin) {
      localStorage.removeItem('selectedBusinessId');
      return;
    }
    if (selectedId) localStorage.setItem('selectedBusinessId', selectedId);
    else localStorage.removeItem('selectedBusinessId');
  }, [selectedId, isSuperAdmin]);

  const selected = businesses.find((b) => String(b.id) === String(selectedId)) || null;

  // Drive the CSS accent tokens (--iv-accent*) off the selected business by
  // setting data-accent on <html>. index.css swaps the maroon/gold (yogart)
  // palette for the marigold/red (mk) one based on this attribute.
  useEffect(() => {
    const accent = themeFor(selected?.name).accent;
    document.documentElement.setAttribute('data-accent', accent);
  }, [selected]);

  const clearSelection = () => setSelectedId(null);

  return (
    <BusinessContext.Provider
      value={{ businesses, loading, selected, selectedId, setSelectedId, clearSelection, refresh }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider');
  return ctx;
}
