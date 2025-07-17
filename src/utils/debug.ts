// Production-safe debug utilities
// Environment-based logging configuration
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;
const debugEnabled = import.meta.env.VITE_DEBUG_LOGGING === 'true' || isDevelopment;
const appEnv = import.meta.env.VITE_APP_ENV || (isProduction ? 'production' : 'development');

// Log levels for different environments
const LOG_LEVELS = {
  development: ['debug', 'info', 'warn', 'error'],
  production: ['warn', 'error'],
  test: ['error']
} as const;

const currentLogLevels = LOG_LEVELS[appEnv as keyof typeof LOG_LEVELS] || LOG_LEVELS.production;

// Safe logging functions that respect environment settings
const shouldLog = (level: string): boolean => {
  return debugEnabled && currentLogLevels.includes(level as any);
};

const formatTimestamp = (): string => {
  return new Date().toISOString().split('T')[1].split('.')[0];
};

const safeStringify = (data: any): string => {
  try {
    if (data === null || data === undefined) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      // Remove sensitive data in production
      if (isProduction) {
        const sanitized = { ...data };
        // Remove potential sensitive keys
        const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
        sensitiveKeys.forEach(key => {
          Object.keys(sanitized).forEach(objKey => {
            if (objKey.toLowerCase().includes(key)) {
              sanitized[objKey] = '[REDACTED]';
            }
          });
        });
        return JSON.stringify(sanitized, null, 2);
      }
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  } catch (error) {
    return '[Unable to stringify data]';
  }
};

export const debugLog = (message: string, data?: any) => {
  if (shouldLog('debug')) {
    const timestamp = formatTimestamp();
    console.log(`[${timestamp}] 🔍 ${message}`, data ? safeStringify(data) : '');
  }
};

export const debugError = (message: string, error?: any) => {
  if (shouldLog('error')) {
    const timestamp = formatTimestamp();
    console.error(`[${timestamp}] ❌ ${message}`, error ? safeStringify(error) : '');
  }
};

export const debugSuccess = (message: string, data?: any) => {
  if (shouldLog('info')) {
    const timestamp = formatTimestamp();
    console.log(`[${timestamp}] ✅ ${message}`, data ? safeStringify(data) : '');
  }
};

export const debugWarn = (message: string, data?: any) => {
  if (shouldLog('warn')) {
    const timestamp = formatTimestamp();
    console.warn(`[${timestamp}] ⚠️ ${message}`, data ? safeStringify(data) : '');
  }
};

// Production-safe info logging
export const debugInfo = (message: string, data?: any) => {
  if (shouldLog('info')) {
    const timestamp = formatTimestamp();
    console.info(`[${timestamp}] ℹ️ ${message}`, data ? safeStringify(data) : '');
  }
};

// Track authentication state changes (production-safe)
export const trackAuthState = (state: {
  user: boolean;
  loading: boolean;
  error: string | null;
  step: string;
}) => {
  debugLog(`Auth State: ${state.step}`, {
    hasUser: state.user,
    loading: state.loading,
    hasError: !!state.error,
    error: isProduction ? '[REDACTED]' : state.error
  });
};

// Environment information logging (safe for production)
export const logEnvironmentInfo = () => {
  if (shouldLog('info')) {
    debugInfo('Environment Configuration', {
      environment: appEnv,
      isProduction,
      isDevelopment,
      debugEnabled,
      logLevels: currentLogLevels,
      buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown',
      version: import.meta.env.VITE_APP_VERSION || 'unknown'
    });
  }
};

// Performance tracking (production-safe)
export const trackPerformance = (operation: string, startTime: number, metadata?: any) => {
  if (shouldLog('debug')) {
    const duration = Date.now() - startTime;
    debugLog(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      metadata: metadata ? safeStringify(metadata) : undefined
    });
  }
};

// Error reporting (production-safe)
export const reportError = (error: Error, context?: string, metadata?: any) => {
  const errorInfo = {
    message: error.message,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
    userAgent: isProduction ? '[REDACTED]' : navigator.userAgent,
    url: isProduction ? '[REDACTED]' : window.location.href,
    metadata: metadata ? safeStringify(metadata) : undefined
  };

  debugError(`Error Report: ${context || 'Unknown'}`, errorInfo);

  // In production, you might want to send this to an error tracking service
  if (isProduction) {
    // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
    console.error('Production Error:', errorInfo);
  }
};

// API call tracking (production-safe)
export const trackAPICall = (endpoint: string, method: string, duration: number, success: boolean, metadata?: any) => {
  if (shouldLog('debug')) {
    debugLog(`API Call: ${method} ${endpoint}`, {
      duration: `${duration}ms`,
      success,
      metadata: metadata ? safeStringify(metadata) : undefined
    });
  }
};
