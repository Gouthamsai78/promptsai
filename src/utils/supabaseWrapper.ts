import { supabase, handleJWTExpiration } from '../lib/supabase';
import { debugLog, debugError } from './debug';

/**
 * Enhanced Supabase wrapper that automatically handles JWT expiration
 * and retries failed requests after refreshing the session
 */
export class SupabaseWrapper {
  /**
   * Execute a Supabase query with automatic JWT refresh retry
   */
  static async executeQuery<T>(
    queryFn: () => Promise<{ data: T; error: any }>,
    operation: string = 'query'
  ): Promise<{ data: T; error: any }> {
    try {
      debugLog(`🔍 Executing ${operation}...`);
      const result = await queryFn();

      // Check for JWT expiration error
      if (result.error && (
        result.error.message?.includes('JWT expired') ||
        result.error.code === 'PGRST301'
      )) {
        debugLog(`🔄 JWT expired during ${operation}, attempting refresh...`);

        // Attempt to refresh the session
        const refreshedSession = await handleJWTExpiration(result.error);

        if (refreshedSession) {
          debugLog(`✅ Session refreshed, retrying ${operation}...`);
          // Retry the original query
          const retryResult = await queryFn();

          if (retryResult.error) {
            debugError(`❌ ${operation} failed after retry:`, retryResult.error);
          } else {
            debugLog(`✅ ${operation} succeeded after retry`);
          }

          return retryResult;
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
      return { data: null as T, error };
    }
  }

  /**
   * Enhanced from method that wraps table queries with retry logic
   */
  static from(table: string) {
    const originalTable = supabase.from(table);

    // Create a simple wrapper that preserves all Supabase functionality
    // while adding JWT retry logic only to the final promise execution
    const wrapQuery = (query: any) => {
      // Return a proxy that intercepts method calls
      return new Proxy(query, {
        get(target, prop) {
          const value = target[prop];

          // If it's a function, wrap it
          if (typeof value === 'function') {
            return function(...args: any[]) {
              const result = value.apply(target, args);

              // If the result has a 'then' method (is promise-like), wrap it with retry logic
              if (result && typeof result.then === 'function') {
                return {
                  ...result,
                  then: (resolve: any, reject: any) => {
                    return SupabaseWrapper.executeQuery(
                      () => result,
                      `${table}.${prop as string}()`
                    ).then(resolve, reject);
                  },
                  catch: (reject: any) => {
                    return SupabaseWrapper.executeQuery(
                      () => result,
                      `${table}.${prop as string}()`
                    ).catch(reject);
                  }
                };
              }

              // For non-promise results (query builders), wrap them too
              return wrapQuery(result);
            };
          }

          return value;
        }
      });
    };

    return wrapQuery(originalTable);
  }

  /**
   * Enhanced RPC method with retry logic
   */
  static async rpc(functionName: string, params?: any) {
    return SupabaseWrapper.executeQuery(
      () => supabase.rpc(functionName, params),
      `rpc(${functionName})`
    );
  }

  /**
   * Enhanced auth methods with retry logic
   */
  static auth = {
    async getUser() {
      return SupabaseWrapper.executeQuery(
        () => supabase.auth.getUser(),
        'auth.getUser()'
      );
    },

    async getSession() {
      return SupabaseWrapper.executeQuery(
        () => supabase.auth.getSession(),
        'auth.getSession()'
      );
    },

    async refreshSession() {
      return SupabaseWrapper.executeQuery(
        () => supabase.auth.refreshSession(),
        'auth.refreshSession()'
      );
    },

    // Pass through other auth methods
    signOut: () => supabase.auth.signOut(),
    signInWithOAuth: (options: any) => supabase.auth.signInWithOAuth(options),
    signInWithPassword: (credentials: any) => supabase.auth.signInWithPassword(credentials),
    signUp: (credentials: any) => supabase.auth.signUp(credentials),
    resetPasswordForEmail: (email: string, options?: any) => supabase.auth.resetPasswordForEmail(email, options),
    updateUser: (attributes: any) => supabase.auth.updateUser(attributes),
    onAuthStateChange: (callback: any) => supabase.auth.onAuthStateChange(callback),
  };
}

// Export a default instance that can be used as a drop-in replacement for supabase
export const supabaseWithRetry = SupabaseWrapper;
