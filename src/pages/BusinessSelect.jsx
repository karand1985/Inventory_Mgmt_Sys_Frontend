import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness, themeFor } from '../context/BusinessContext';

const CARD_CLASSES = {
  yogart: 'border-yogart hover:bg-yogart hover:text-white',
  mk: 'border-mk hover:bg-mk hover:text-white'
};

export default function BusinessSelect() {
  const { businesses, loading, setSelectedId } = useBusiness();
  const navigate = useNavigate();

  if (loading) return <p className="text-center mt-16 text-ink/60">Loading…</p>;

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-semibold mb-1">Which business?</h1>
      <p className="text-ink/60 mb-8">Pick a business to view or update its stock.</p>

      <div className="flex flex-col gap-3">
        {businesses.map((b) => {
          const theme = themeFor(b.name);
          return (
            <button
              key={b.id}
              onClick={() => {
                setSelectedId(b.id);
                navigate('/products');
              }}
              className={`text-left border-2 rounded-xl px-5 py-4 transition-colors ${CARD_CLASSES[theme.accent]}`}
            >
              <div className="font-medium text-lg">{b.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
