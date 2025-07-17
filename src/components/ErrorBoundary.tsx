import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '../utils/debug';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

// User-friendly error messages for common error types
const getErrorMessage = (error: Error): { title: string; message: string; action: string } => {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      title: 'Connection Problem',
      message: 'Unable to connect to our servers. Please check your internet connection and try again.',
      action: 'Check your connection and retry'
    };
  }

  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    return {
      title: 'Authentication Error',
      message: 'Your session has expired. Please sign in again to continue.',
      action: 'Sign in again'
    };
  }

  if (errorMessage.includes('api') || errorMessage.includes('openrouter')) {
    return {
      title: 'AI Service Unavailable',
      message: 'Our AI enhancement service is temporarily unavailable. You can still use the app in offline mode.',
      action: 'Continue in offline mode'
    };
  }

  if (errorMessage.includes('supabase') || errorMessage.includes('database')) {
    return {
      title: 'Database Connection Error',
      message: 'Unable to connect to the database. Your changes may not be saved.',
      action: 'Try refreshing the page'
    };
  }

  // Default error message
  return {
    title: 'Something went wrong',
    message: 'We encountered an unexpected error. Our team has been notified and is working on a fix.',
    action: 'Try refreshing the page'
  };
};

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error reporting
    reportError(error, 'ErrorBoundary', {
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorDetails = this.state.error ? getErrorMessage(this.state.error) : {
        title: 'Unknown Error',
        message: 'An unexpected error occurred.',
        action: 'Try refreshing the page'
      };

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {errorDetails.title}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {errorDetails.message}
            </p>

            {/* Error ID for support */}
            {this.state.errorId && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Error ID: <code className="font-mono">{this.state.errorId}</code>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Please include this ID when reporting the issue.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                Try Again
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Refresh Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>

            {/* Development error details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                  🔧 Error Details (Development)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Error Message:</h4>
                    <pre className="text-xs text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>

                  {this.state.error.stack && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Stack Trace:</h4>
                      <pre className="text-xs text-red-600 dark:text-red-400 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Component Stack:</h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
