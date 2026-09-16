import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const PromptContext = createContext(null);

/**
 * Themed replacement for window.prompt(). Exposes usePrompt() -> prompt(options)
 * which returns a Promise<string|null> (null when cancelled). The dialog matches
 * the app theme instead of the browser-native input box.
 *
 * Usage:
 *   const prompt = usePrompt();
 *   const name = await prompt({ title, message, label, defaultValue, confirmLabel });
 *   if (name == null) return; // cancelled
 */
export function PromptProvider({ children }) {
  const [state, setState] = useState(null); // { title, message, label, confirmLabel, cancelLabel, placeholder }
  const [value, setValue] = useState('');
  const resolverRef = useRef(null);
  const inputRef = useRef(null);

  const prompt = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setValue(opts.defaultValue ?? '');
      setState({
        title: opts.title || 'Enter a value',
        message: opts.message || '',
        label: opts.label || '',
        confirmLabel: opts.confirmLabel || 'Save',
        cancelLabel: opts.cancelLabel || 'Cancel',
        placeholder: opts.placeholder || '',
      });
    });
  }, []);

  const close = useCallback((result) => {
    setState(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    close(trimmed === '' ? null : trimmed);
  }, [value, close]);

  // Focus + select the input when the dialog opens.
  useEffect(() => {
    if (state && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [state]);

  // Keyboard: Esc cancels while the dialog is open (Enter handled by the input/form).
  useEffect(() => {
    if (!state) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') close(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);

  const contextValue = useMemo(() => prompt, [prompt]);

  return (
    <PromptContext.Provider value={contextValue}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          onClick={() => close(null)}
        >
          <form
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-lg bg-paper border border-line shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <h2 className="text-lg font-semibold text-ink">{state.title}</h2>
            {state.message && (
              <p className="mt-2 text-sm text-ink/70 break-words">{state.message}</p>
            )}
            {state.label && (
              <label className="mt-4 block text-sm font-medium text-ink">{state.label}</label>
            )}
            <input
              ref={inputRef}
              type="text"
              value={value}
              placeholder={state.placeholder}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(null)}
                className="px-4 py-2 rounded-md text-sm font-medium border border-line text-ink hover:bg-line/40 transition-colors"
              >
                {state.cancelLabel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-ink hover:bg-ink/90 transition-colors"
              >
                {state.confirmLabel}
              </button>
            </div>
          </form>
        </div>
      )}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error('usePrompt must be used within PromptProvider');
  return ctx;
}
