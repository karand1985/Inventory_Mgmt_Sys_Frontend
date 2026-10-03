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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="iv-card iv-glow-border iv-page-in w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined text-[24px] mt-0.5 ${
                  state.danger ? 'text-red-500' : 'text-ink/50'
                }`}
              >
                {state.danger ? 'warning' : 'help'}
              </span>
              <div className="min-w-0">
                <h2 className="iv-display text-lg font-extrabold text-ink">{state.title}</h2>
                {state.message && (
                  <p className="mt-1 text-sm text-ink/70 break-words">{state.message}</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="iv-btn iv-btn-ghost"
              >
                {state.cancelLabel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`iv-btn ${state.danger ? 'iv-btn-danger' : 'iv-btn-primary'}`}
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
