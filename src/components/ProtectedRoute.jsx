import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guards a route behind authentication and, optionally, role.
 *
 *  - requireWrite:      only OWNER or SUPER_ADMIN (write-capable roles) may
 *                       enter; VIEWER is redirected to the dashboard.
 *  - requireSuperAdmin: only SUPER_ADMIN may enter (user administration etc.);
 *                       everyone else is redirected to the dashboard.
 *
 * Unauthenticated users are always sent to /login.
 */
export default function ProtectedRoute({
  children,
  requireWrite = false,
  requireSuperAdmin = false
}) {
  const { user, canWrite, isSuperAdmin } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />;
  if (requireWrite && !canWrite) return <Navigate to="/dashboard" replace />;

  return children;
}