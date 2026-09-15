import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
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

  useEffect(() => {
    if (!token) {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.businesses
      .list()
      .then((list) => {
        setBusinesses(list);
        // OWNER/VIEWER only ever get one business back from the API — auto-select
        // it so they never see an unnecessary business picker.
        if (list.length === 1) setSelectedId(list[0].id);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (selectedId) localStorage.setItem('selectedBusinessId', selectedId);
  }, [selectedId]);

  const selected = businesses.find((b) => String(b.id) === String(selectedId)) || null;

  return (
    <BusinessContext.Provider
      value={{ businesses, loading, selected, selectedId, setSelectedId }}
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
