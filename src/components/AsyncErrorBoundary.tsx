import React, { useState, useEffect, ReactNode } from 'react';
import { reportError, debugError } from '../utils/debug';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error) => void;
}

interface AsyncError {
  error: Error;
  timestamp: number;
  id: string;
}

// Hook for handling async errors in components
export const useAsyncError = () => {
  const [asyncError, setAsyncError] = useState<AsyncError | null>(null);

  const throwAsyncError = (error: Error) => {
    const asyncErrorObj: AsyncError = {
      error,
      timestamp: Date.now(),
      id: `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Report the error
    reportError(error, 'AsyncOperation', {
      asyncError: true,
      errorId: asyncErrorObj.id,
      timestamp: new Date(asyncErrorObj.timestamp).toISOString()
    });
    
    setAsyncError(asyncErrorObj);
  };

  const clearAsyncError = () => {
    setAsyncError(null);
  };

  return { asyncError, throwAsyncError, clearAsyncError };
};

// Wrapper for async operations with error handling
export const withAsyncErrorHandling = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  onError?: (error: Error) => void
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      debugError('Async operation failed:', {
        function: asyncFn.name,
        args: args.length,
        error: err.message,
        stack: err.stack
      });

      if (onError) {
        onError(err);
      } else {
        // Re-throw if no error handler provided
        throw err;
      }
      
      return null;
    }
  };
};

// Component for handling async errors
const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  fallback,
  onError
}) => {
  const { asyncError, clearAsyncError } = useAsyncError();

  useEffect(() => {
    if (asyncError && onError) {
      onError(asyncError.error);
    }
  }, [asyncError, onError]);

  // Default fallback UI
  const defaultFallback = (error: Error, retry: () => void) => (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-red-500 text-lg">⚠️</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Operation Failed
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error.message || 'An unexpected error occurred during the operation.'}
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={retry}
              className="text-sm bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 px-3 py-1 rounded transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={clearAsyncError}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (asyncError) {
    const fallbackComponent = fallback 
      ? fallback(asyncError.error, clearAsyncError)
      : defaultFallback(asyncError.error, clearAsyncError);
    
    return <>{fallbackComponent}</>;
  }

  return <>{children}</>;
};

// Higher-order component for wrapping components with async error handling
export const withAsyncErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, retry: () => void) => ReactNode
) => {
  return (props: P) => (
    <AsyncErrorBoundary fallback={fallback}>
      <Component {...props} />
    </AsyncErrorBoundary>
  );
};

// Utility function for safe async operations
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  onError?: (error: Error) => void
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    debugError('Safe async operation failed:', {
      error: err.message,
      stack: err.stack,
      hasFallback: fallbackValue !== undefined
    });

    if (onError) {
      onError(err);
    }

    return fallbackValue;
  }
};

export default AsyncErrorBoundary;
