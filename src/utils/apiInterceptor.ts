import { supabase } from '../lib/supabase';
import { debugLog, debugError } from './debug';

/**
 * Enhanced API interceptor that automatically handles JWT token expiration
 * and retries failed requests after refreshing the session
 */
export class APIInterceptor {
  private static isRefreshing = false;
  private static refreshPromise: Promise<any> | null = null;
  private static failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  /**
   * Execute a Supabase query with automatic JWT refresh retry
   */
  static async executeWithRetry<T>(
    queryFn: () => Promise<{ data: T; error: any }>,
    operation: string = 'query',
    maxRetries: number = 1
  ): Promise<{ data: T; error: any }> {
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        debugLog(`🔍 Executing ${operation} (attempt ${attempts + 1}/${maxRetries + 1})`);
        const result = await queryFn();

        // Check for JWT expiration error
        if (result.error && this.isJWTExpiredError(result.error)) {
          debugLog(`🔄 JWT expired during ${operation}, attempting refresh...`);

          // If this is our last attempt, don't retry
          if (attempts >= maxRetries) {
            debugError(`❌ Max retries reached for ${operation}`);
            return result;
          }

          // Attempt to refresh the session
          const refreshSuccess = await this.handleTokenRefresh();

          if (refreshSuccess) {
            debugLog(`✅ Session refreshed, retrying ${operation}...`);
            attempts++;
            continue; // Retry the operation
          } else {
            debugError(`❌ Failed to refresh session for ${operation}`);
            return result;
          }
        }

        if (result.error) {
          debugError(`❌ ${operation} failed:`, result.error);
        } else {
          debugLog(`✅ ${operation} succeeded`);
        }

        return result;

      } catch (error: any) {
        debugError(`❌ Exception during ${operation}:`, error);

        // If it's a network error or JWT error, try to refresh and retry
        if (attempts < maxRetries && (this.isJWTExpiredError(error) || this.isNetworkError(error))) {
          const refreshSuccess = await this.handleTokenRefresh();
          if (refreshSuccess) {
            attempts++;
            continue;
          }
        }

        return { data: null as T, error };
      }
    }

    // This should never be reached, but just in case
    return { data: null as T, error: new Error('Max retries exceeded') };
  }

  /**
   * Handle token refresh with queue management to prevent multiple simultaneous refreshes
   */
  private static async handleTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for the current refresh to complete
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const success = await this.refreshPromise;

      // Process the failed queue
      this.failedQueue.forEach(({ resolve }) => resolve(success));
      this.failedQueue = [];

      return success;
    } catch (error) {
      // Reject all queued requests
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];

      return false;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private static async performTokenRefresh(): Promise<boolean> {
    try {
      debugLog('🔄 Refreshing JWT token...');

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        debugError('❌ Token refresh failed:', error);

        // If refresh fails, redirect to login
        if (error.message?.includes('refresh_token_not_found') ||
            error.message?.includes('invalid_grant')) {
          debugLog('🔄 Refresh token invalid, redirecting to login...');
          await supabase.auth.signOut();
          window.location.href = '/auth/login';
        }

        return false;
      }

      if (data.session) {
        debugLog('✅ JWT token refreshed successfully');
        return true;
      }

      debugError('❌ No session returned from refresh');
      return false;

    } catch (error: any) {
      debugError('❌ Error during token refresh:', error);
      return false;
    }
  }

  /**
   * Check if an error is a JWT expiration error
   */
  private static isJWTExpiredError(error: any): boolean {
    return error && (
      error.message?.includes('JWT expired') ||
      error.message?.includes('jwt expired') ||
      error.code === 'PGRST301' ||
      error.status === 401
    );
  }

  /**
   * Check if an error is a network error
   */
  private static isNetworkError(error: any): boolean {
    return error && (
      error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      error.message?.includes('Failed to fetch') ||
      error.code === 'NETWORK_ERROR'
    );
  }

  /**
   * Create a deep proxy that handles unlimited method chaining
   */
  static createDeepProxy(target: any, path: string = ''): any {
    return new Proxy(target, {
      get(obj, prop) {
        const value = obj[prop];
        const currentPath = path ? `${path}.${prop as string}` : prop as string;

        if (typeof value === 'function') {
          return function(...args: any[]) {
            const result = value.apply(obj, args);

            // If the result has a 'then' method (is promise-like), wrap it with retry logic
            if (result && typeof result.then === 'function') {
              return APIInterceptor.executeWithRetry(
                () => result,
                `${currentPath}()`
              );
            }

            // For non-promise results (query builders), create another deep proxy
            if (result && typeof result === 'object') {
              return APIInterceptor.createDeepProxy(result, currentPath);
            }

            return result;
          };
        }

        // For non-function properties, return as-is
        return value;
      }
    });
  }

  /**
   * Create a wrapped Supabase client that automatically retries on JWT expiration
   */
  static createWrappedClient() {
    return {
      from: (table: string) => {
        const originalTable = supabase.from(table);
        return APIInterceptor.createDeepProxy(originalTable, table);
      },

      auth: {
        ...supabase.auth,
        getUser: () => APIInterceptor.executeWithRetry(
          () => supabase.auth.getUser(),
          'auth.getUser()'
        ),
        getSession: () => APIInterceptor.executeWithRetry(
          () => supabase.auth.getSession(),
          'auth.getSession()'
        ),
        onAuthStateChange: (callback: any) => supabase.auth.onAuthStateChange(callback),
        signInWithOAuth: (options: any) => APIInterceptor.executeWithRetry(
          () => supabase.auth.signInWithOAuth(options),
          'auth.signInWithOAuth()'
        ),
        signInWithPassword: (credentials: any) => APIInterceptor.executeWithRetry(
          () => supabase.auth.signInWithPassword(credentials),
          'auth.signInWithPassword()'
        ),
        signUp: (credentials: any) => APIInterceptor.executeWithRetry(
          () => supabase.auth.signUp(credentials),
          'auth.signUp()'
        ),
        signOut: () => APIInterceptor.executeWithRetry(
          () => supabase.auth.signOut(),
          'auth.signOut()'
        ),
        resetPasswordForEmail: (email: string, options?: any) => APIInterceptor.executeWithRetry(
          () => supabase.auth.resetPasswordForEmail(email, options),
          'auth.resetPasswordForEmail()'
        ),
        updateUser: (attributes: any) => APIInterceptor.executeWithRetry(
          () => supabase.auth.updateUser(attributes),
          'auth.updateUser()'
        ),
      },

      rpc: (functionName: string, params?: any) => APIInterceptor.executeWithRetry(
        () => supabase.rpc(functionName, params),
        `rpc(${functionName})`
      ),

      // Pass through other properties
      realtime: supabase.realtime,
      storage: supabase.storage,
    };
  }
}

// Export a wrapped client instance
export const supabaseWithAutoRetry = APIInterceptor.createWrappedClient();