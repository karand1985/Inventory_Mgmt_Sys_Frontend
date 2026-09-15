import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'inventory_auth';

async function loginRequest(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Incorrect email or password');
  return res.json();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  async function login(email, password) {
    const data = await loginRequest(email, password);
    setUser(data);
    return data;
  }

  function logout() {
    if (user?.token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      }).catch(() => {});
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token: user?.token,
        role: user?.role,
        businessId: user?.businessId,
        businessName: user?.businessName,
        isViewer: user?.role === 'VIEWER',
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        login,
        logout
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
