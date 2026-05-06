import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Redirects to /login if not authenticated
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isInitialised, user } = useSelector(s => s.auth);

  // Show nothing while checking auth status on first load
  if (!isInitialised) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-earth-100">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌾</div>
          <p className="text-primary-700 font-medium">Loading Agri-Connect…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Role check (e.g. admin-only pages)
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
