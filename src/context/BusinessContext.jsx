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
  const { token } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedId, setSelectedId] = useState(
    () => localStorage.getItem('selectedBusinessId') || null
  );
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
          // Auto-select when there's exactly one business (OWNER/VIEWER) so they
          // never see an unnecessary picker.
          if (list.length === 1) return list[0].id;
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
  }, [token]);

  useEffect(() => {
    if (!token) {
      // Logged out: forget the roster. We deliberately keep the persisted
      // selectedBusinessId so a returning user of the *same* account lands back
      // on their last business; it's re-validated against the fresh list below.
      setBusinesses([]);
      setLoading(false);
      return;
    }
    refresh();
  }, [token, refresh]);

  // Keep localStorage in lockstep with the selection — persist when set, and
  // remove the key entirely when cleared so nothing stale lingers.
  useEffect(() => {
    if (selectedId) localStorage.setItem('selectedBusinessId', selectedId);
    else localStorage.removeItem('selectedBusinessId');
  }, [selectedId]);

  const selected = businesses.find((b) => String(b.id) === String(selectedId)) || null;

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
