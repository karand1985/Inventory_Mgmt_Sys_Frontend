import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import BusinessSwitcher from '../components/BusinessSwitcher';

export default function BusinessSelect() {
  const { businesses, loading } = useBusiness();
  const navigate = useNavigate();

  if (loading)
    return (
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="iv-skeleton h-8 w-56 mb-3" />
        <div className="iv-skeleton h-4 w-72 mb-8" />
        <div className="iv-skeleton h-11 w-full rounded-xl" />
      </div>
    );

  if (businesses.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="iv-card p-8 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-ink/30">store</span>
          <p className="text-ink/60">No businesses are available for your account yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4 iv-page-in">
      <h1 className="iv-display text-2xl font-extrabold mb-1">Which business?</h1>
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
