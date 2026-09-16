import React, { createContext, useContext, useState } from 'react';
import { AUTH_STORAGE_KEY as STORAGE_KEY } from '../config';
import { http } from '../api/client';

const AuthContext = createContext(null);

/**
 * Calls the real backend contract:
 *   POST /api/v1/auth/login -> { token, tokenType:"Bearer", email, role, expiresInMs }
 * Routed through the shared http client so it inherits ApiError parsing. We
 * derive an absolute `expiresAt` timestamp from the relative `expiresInMs` so
 * the stored session can be reasoned about locally (the 401 handler remains the
 * source of truth for server-side expiry).
 */
async function loginRequest(email, password) {
  const data = await http.post('/auth/login', { email, password });
  const expiresAt =
    typeof data.expiresInMs === 'number' ? Date.now() + data.expiresInMs : null;
  return { ...data, expiresAt };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  // Persist synchronously so the HTTP client (which reads the token from
  // localStorage) sees it immediately. Relying on a useEffect would defer the
  // write until after commit, and React runs child effects before parent
  // effects — so a protected page's fetch effect can fire BEFORE this provider
  // persists, sending the very first request with no Authorization header (401).
  function persistSession(next) {
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(next);
  }

  async function login(email, password) {
    const data = await loginRequest(email, password);
    persistSession(data);
    return data;
  }

  // The backend is stateless (JWT); there's no server logout endpoint. Logging
  // out simply forgets the token locally.
  function logout() {
    persistSession(null);
  }

  // Clears React auth state without any network call. Used by the global 401
  // handler (the HTTP client already wipes localStorage before emitting).
  function clearSession() {
    persistSession(null);
  }

  const role = user?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isOwner = role === 'OWNER';
  const isViewer = role === 'VIEWER';
  // Writes (POST/PUT/PATCH/DELETE) require OWNER or SUPER_ADMIN per the API.
  const canWrite = isSuperAdmin || isOwner;

  return (
    <AuthContext.Provider
      value={{
        user,
        token: user?.token,
        email: user?.email,
        role,
        isViewer,
        isOwner,
        isSuperAdmin,
        canWrite,
        login,
        logout,
        clearSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}