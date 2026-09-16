import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import BusinessSwitcher from '../components/BusinessSwitcher';

export default function BusinessSelect() {
  const { businesses, loading } = useBusiness();
  const navigate = useNavigate();

  if (loading) return <p className="text-center mt-16 text-ink/60">Loading…</p>;

  if (businesses.length === 0) {
    return (
      <p className="text-center mt-16 text-ink/60">
        No businesses are available for your account yet.
      </p>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-semibold mb-1">Which business?</h1>
      <p className="text-ink/60 mb-8">Pick a business to view or update its stock.</p>

      {/* Same dropdown used to switch business from the navbar. Always land on
          the overview/dashboard after picking so the newly-selected business's
          data loads fresh. */}
      <BusinessSwitcher
        fullWidth
        placeholder="Select a business"
        onSelected={() => navigate('/dashboard', { replace: true })}
      />
    </div>
  );
}
