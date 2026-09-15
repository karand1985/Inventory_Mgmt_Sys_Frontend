import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

// Visual treatment per toast kind. Full literal Tailwind classes so the JIT
// compiler keeps them (no dynamic interpolation).
const VARIANTS = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-ink text-white',
};

const DEFAULT_DURATION = 5000;

/**
 * Lightweight toast provider. Exposes useToast() -> { toast, success, error, info, dismiss }.
 * Toasts auto-dismiss after `duration` ms (0 = sticky). Rendered in a fixed
 * top-right stack above the app.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, { variant = 'info', duration = DEFAULT_DURATION } = {}) => {
      if (!message) return undefined;
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast,
      success: (msg, opts) => toast(msg, { ...opts, variant: 'success' }),
      error: (msg, opts) => toast(msg, { ...opts, variant: 'error' }),
      info: (msg, opts) => toast(msg, { ...opts, variant: 'info' }),
      dismiss,
    }),
    [toast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start gap-3 rounded-md shadow-lg px-4 py-3 text-sm ${VARIANTS[t.variant] || VARIANTS.info}`}
          >
            <span className="flex-1 break-words">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="opacity-70 hover:opacity-100 leading-none text-lg"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
