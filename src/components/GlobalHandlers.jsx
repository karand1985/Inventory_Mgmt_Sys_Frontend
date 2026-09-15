import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onAuthEvent } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Bridges the HTTP client's auth events (emitted from plain JS) into React land:
 *   - 401 (unauthorized): clear React auth state and redirect to /login,
 *     preserving where the user was so they can return after re-auth.
 *   - 403 (forbidden): show a "not allowed" toast (uses the ApiError message
 *     when the backend provides one).
 *
 * Renders nothing; must live inside Router + Auth + Toast providers.
 */
export default function GlobalHandlers() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearSession } = useAuth();
  const { error } = useToast();

  useEffect(() => {
    const offUnauthorized = onAuthEvent('unauthorized', () => {
      clearSession();
      // Avoid redirect loops if we're already on the login screen.
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true, state: { from: location.pathname } });
      }
    });

    const offForbidden = onAuthEvent('forbidden', (apiError) => {
      error(apiError?.message || "You're not allowed to do that.");
    });

    return () => {
      offUnauthorized();
      offForbidden();
    };
  }, [navigate, location.pathname, clearSession, error]);

  return null;
}
