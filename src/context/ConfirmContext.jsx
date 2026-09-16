import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

/**
 * Themed replacement for window.confirm(). Exposes useConfirm() -> confirm(options)
 * which returns a Promise<boolean>. The dialog matches the app theme instead of the
 * browser-native alert box.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, message, confirmLabel, danger }))) return;
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, message, confirmLabel, cancelLabel, danger }
  const resolverRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        title: opts.title || 'Are you sure?',
        message: opts.message || '',
        confirmLabel: opts.confirmLabel || 'Confirm',
        cancelLabel: opts.cancelLabel || 'Cancel',
        danger: opts.danger !== false, // default to danger styling (delete-oriented)
      });
    });
  }, []);

  const close = useCallback(
    (result) => {
      setState(null);
      if (resolverRef.current) {
        resolverRef.current(result);
        resolverRef.current = null;
      }
    },
    []
  );

  // Keyboard: Esc cancels, Enter confirms while the dialog is open.
  useEffect(() => {
    if (!state) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'Enter') close(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-lg bg-paper border border-line shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink">{state.title}</h2>
            {state.message && (
              <p className="mt-2 text-sm text-ink/70 break-words">{state.message}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2 rounded-md text-sm font-medium border border-line text-ink hover:bg-line/40 transition-colors"
              >
                {state.cancelLabel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                  state.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-ink hover:bg-ink/90'
                }`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
