import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Route protection wrapper gatekeeping unauthorized actions
 * @param {Array} allowedRoles - Role array (e.g. ['ADMIN', 'WORKER'])
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuthStore();
  const location = useLocation();

  // If auth status is resolving, display a sleek loading animation
  if (loading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Verifying secure credentials...</span>
        </div>
      </div>
    );
  }

  // Gate 1: Check unauthenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Gate 2: Check RBAC Role compatibility
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If worker logs into admin or customer attempts worker routes, bounce them back safely
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'WORKER') {
      return <Navigate to="/worker/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
