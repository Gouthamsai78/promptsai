// Debug utilities for authentication flow
export const DEBUG_AUTH = true; // Set to false in production

export const debugLog = (message: string, data?: any) => {
  if (DEBUG_AUTH) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] 🔍 ${message}`, data || '');
  }
};

export const debugError = (message: string, error?: any) => {
  if (DEBUG_AUTH) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.error(`[${timestamp}] ❌ ${message}`, error || '');
  }
};

export const debugSuccess = (message: string, data?: any) => {
  if (DEBUG_AUTH) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[${timestamp}] ✅ ${message}`, data || '');
  }
};

export const debugWarn = (message: string, data?: any) => {
  if (DEBUG_AUTH) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.warn(`[${timestamp}] ⚠️ ${message}`, data || '');
  }
};

// Track authentication state changes
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
    error: state.error
  });
};
