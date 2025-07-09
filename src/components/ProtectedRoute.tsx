import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true
}) => {
  const { user, loading, authError, clearAuthError } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute:', {
    user: !!user,
    loading,
    requireAuth,
    path: location.pathname,
    authError: !!authError
  });

  // Show error state with retry option (only for critical errors)
  if (authError && authError.includes('timeout')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {authError}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                clearAuthError();
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => {
                clearAuthError();
                window.location.href = '/auth/login';
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (requireAuth && !user) {
    console.log('🔄 Redirecting to login - no user');
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    console.log('🔄 Redirecting to home - user already authenticated');
    return <Navigate to="/" replace />;
  }

  console.log('✅ ProtectedRoute - rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
