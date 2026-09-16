import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';

/**
 * Guards a route behind authentication and, optionally, role or a selected
 * business.
 *
 *  - requireWrite:      only OWNER or SUPER_ADMIN (write-capable roles) may
 *                       enter; VIEWER is redirected to the dashboard.
 *  - requireSuperAdmin: only SUPER_ADMIN may enter (user administration etc.);
 *                       everyone else is redirected to the dashboard.
 *  - requireBusiness:   a concrete business must be selected. OWNER/VIEWER are
 *                       auto-selected (single business); SUPER_ADMIN is sent to
 *                       the picker at /select-business, then bounced back here.
 *
 * Unauthenticated users are always sent to /login.
 */
export default function ProtectedRoute({
  children,
  requireWrite = false,
  requireSuperAdmin = false,
  requireBusiness = false
}) {
  const { user, canWrite, isSuperAdmin } = useAuth();
  const { selected, loading: businessLoading } = useBusiness();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />;
  if (requireWrite && !canWrite) return <Navigate to="/dashboard" replace />;

  if (requireBusiness) {
    // Don't decide until the roster has loaded, otherwise a fresh login would
    // flash the picker before an OWNER/VIEWER's single business auto-selects.
    if (businessLoading) {
      return <p className="text-center mt-16 text-ink/60">Loading…</p>;
    }
    if (!selected) {
      return <Navigate to="/select-business" replace state={{ from: location }} />;
    }
  }

  return children;
}