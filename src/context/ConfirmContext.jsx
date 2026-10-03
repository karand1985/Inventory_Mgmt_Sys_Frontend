import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

/**
 * Themed replacement for window.confirm(). Exposes useConfirm() -> confirm(options)
 * which returns a Promise<boolean>. The dialog matches the app theme instead of the
 * browser-native alert box.
 *
 * Options:
 *   title, message, confirmLabel, cancelLabel, danger (bool)
 *   challenge        optional string the user must type EXACTLY to enable the
 *                    confirm button (GitHub-style "type the name to confirm").
 *                    Guards destructive, irreversible actions against accidental
 *                    or automated clicks.
 *   challengeLabel   optional label shown above the challenge input.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, message, confirmLabel, danger }))) return;
 *   // with a typed challenge:
 *   if (!(await confirm({ title, challenge: business.name }))) return;
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { title, message, confirmLabel, cancelLabel, danger, challenge, challengeLabel }
  const [challengeValue, setChallengeValue] = useState('');
  const resolverRef = useRef(null);
  const inputRef = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setChallengeValue('');
      setState({
        title: opts.title || 'Are you sure?',
        message: opts.message || '',
        confirmLabel: opts.confirmLabel || 'Confirm',
        cancelLabel: opts.cancelLabel || 'Cancel',
        danger: opts.danger !== false, // default to danger styling (delete-oriented)
        challenge: opts.challenge || '',
        challengeLabel: opts.challengeLabel || '',
      });
    });
  }, []);

  const close = useCallback(
    (result) => {
      setState(null);
      setChallengeValue('');
      if (resolverRef.current) {
        resolverRef.current(result);
        resolverRef.current = null;
      }
    },
    []
  );

  // Whether the confirm action is currently allowed: always true unless a
  // challenge is required, in which case the typed text must match exactly.
  const canConfirm = !state?.challenge || challengeValue.trim() === state.challenge;

  // Focus the challenge input when a challenged dialog opens.
  useEffect(() => {
    if (state?.challenge && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state]);

  // Keyboard: Esc cancels; Enter confirms only when the action is allowed.
  useEffect(() => {
    if (!state) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'Enter' && canConfirm) close(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close, canConfirm]);

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

            {state.challenge && (
              <div className="mt-4">
                <label className="block text-sm text-ink/70">
                  {state.challengeLabel || (
                    <>
                      Type <span className="font-semibold text-ink">{state.challenge}</span> to confirm
                    </>
                  )}
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={challengeValue}
                  onChange={(e) => setChallengeValue(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="iv-input mt-1.5 w-full"
                  placeholder={state.challenge}
                />
              </div>
            )}

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
                autoFocus={!state.challenge}
                disabled={!canConfirm}
                onClick={() => canConfirm && close(true)}
                className={`iv-btn ${state.danger ? 'iv-btn-danger' : 'iv-btn-primary'} disabled:opacity-40 disabled:cursor-not-allowed`}
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
