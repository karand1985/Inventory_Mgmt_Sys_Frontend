import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guards a route behind login. Pass requireWrite to also block VIEWER role
 * accounts (e.g. add/edit product screens) — they're redirected to the
 * dashboard rather than shown a form they can't submit.
 */
export default function ProtectedRoute({ children, requireWrite = false }) {
  const { user, isViewer } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requireWrite && isViewer) return <Navigate to="/dashboard" replace />;

  return children;
}
