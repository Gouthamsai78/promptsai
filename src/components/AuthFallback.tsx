import React from 'react';

interface AuthFallbackProps {
  error: string;
  onRetry: () => void;
  onContinueOffline?: () => void;
}

const AuthFallback: React.FC<AuthFallbackProps> = ({ 
  error, 
  onRetry, 
  onContinueOffline 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔄</span>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connection Issue
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
          
          {onContinueOffline && (
            <button
              onClick={onContinueOffline}
              className="w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Continue in Demo Mode
            </button>
          )}
        </div>
        
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            If this problem persists, please check your internet connection or try again later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthFallback;
