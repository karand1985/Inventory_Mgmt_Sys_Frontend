import React, { useEffect, useRef, useState } from 'react';
import { useBusiness, themeFor } from '../context/BusinessContext';

// Tailwind JIT can't see interpolated class names, so every accent literal used
// here must appear as a full string. This map is that anchor.
const DOT_CLASSES = {
  yogart: 'bg-yogart',
  mk: 'bg-mk'
};

/**
 * A single, reusable business-selection dropdown used both for first-time
 * selection (on the /select-business page) and for switching business from the
 * navbar. Keeps the two experiences identical.
 *
 * Props:
 *  - onSelected(id): called after a business is chosen (e.g. to navigate).
 *  - placeholder:    label shown when nothing is selected yet.
 *  - align:          'left' | 'right' — which edge the menu aligns to.
 *  - fullWidth:      stretch the trigger to its container's width (page use).
 */
export default function BusinessSwitcher({
  onSelected,
  placeholder = 'Choose a business',
  align = 'left',
  fullWidth = false
}) {
  const { businesses, selected, setSelectedId } = useBusiness();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(id) {
    setSelectedId(id);
    setOpen(false);
    onSelected?.(id);
  }

  const selectedTheme = selected ? themeFor(selected.name) : null;

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 border border-line rounded-md px-3 py-1.5 bg-white text-sm hover:border-ink/40 transition-colors ${
          fullWidth ? 'w-full' : ''
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedTheme && (
            <span
              className={`inline-block w-2 h-2 rounded-full ${DOT_CLASSES[selectedTheme.accent]}`}
            />
          )}
          <span className={`truncate ${selected ? '' : 'text-ink/50'}`}>
            {selected ? selected.name : placeholder}
          </span>
        </span>
        <svg
          className={`w-4 h-4 text-ink/50 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute z-20 mt-1 min-w-full w-max max-w-xs bg-white border border-line rounded-md shadow-lg py-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {businesses.map((b) => {
            const theme = themeFor(b.name);
            const isCurrent = String(b.id) === String(selected?.id);
            return (
              <li key={b.id} role="option" aria-selected={isCurrent}>
                <button
                  type="button"
                  onClick={() => choose(b.id)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-line/40 ${
                    isCurrent ? 'font-medium' : ''
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${DOT_CLASSES[theme.accent]}`}
                  />
                  <span className="truncate">{b.name}</span>
                  {isCurrent && <span className="ml-auto text-ink/40 text-xs">current</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
