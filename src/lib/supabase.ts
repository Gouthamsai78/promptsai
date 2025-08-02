import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Get environment variables with detailed logging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Configuration Check:');
console.log('Raw URL:', JSON.stringify(supabaseUrl));
console.log('URL type:', typeof supabaseUrl);
console.log('URL length:', supabaseUrl?.length);
console.log('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
console.log('Anon Key type:', typeof supabaseAnonKey);
console.log('All env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', JSON.stringify(supabaseUrl));
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  console.error('Please check your .env.local file and ensure it contains valid Supabase credentials');
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
let validatedUrl: string;
try {
  // Clean the URL of any extra whitespace or quotes
  const cleanUrl = supabaseUrl.trim().replace(/^["']|["']$/g, '');

  // Test if it's a valid URL
  new URL(cleanUrl);
  validatedUrl = cleanUrl;

  console.log('✅ URL validation successful:', validatedUrl);
} catch (urlError) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  console.error('URL Error:', urlError);
  console.error('Expected format: https://your-project-id.supabase.co');
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
}

// Validate anon key format (should be a JWT)
const cleanAnonKey = supabaseAnonKey.trim().replace(/^["']|["']$/g, '');
if (!cleanAnonKey.startsWith('eyJ')) {
  console.error('❌ Invalid Supabase anon key format - should be a JWT starting with "eyJ"');
  throw new Error('Invalid Supabase anon key format');
}

console.log('✅ Creating Supabase client...');

let supabase: any;

try {
  supabase = createClient<Database>(validatedUrl, cleanAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development',
    },
    realtime: {
      // Enhanced real-time configuration
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
    },
    global: {
      headers: {
        'X-Client-Info': 'promptshare-ai@1.0.0',
      },
    },
  });

  // Set up automatic session refresh monitoring
  let refreshTimer: NodeJS.Timeout | null = null;

  // Monitor auth state changes for proactive token refresh
  supabase.auth.onAuthStateChange(async (event: string, session: any) => {
    console.log('🔐 Auth state changed:', event, session?.expires_at ? new Date(session.expires_at * 1000) : 'No session');

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.expires_at) {
        // Clear existing timer
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }

        // Set up proactive refresh 5 minutes before expiration
        const expiresAt = session.expires_at * 1000;
        const refreshAt = expiresAt - (5 * 60 * 1000); // 5 minutes before
        const timeUntilRefresh = refreshAt - Date.now();

        if (timeUntilRefresh > 0) {
          refreshTimer = setTimeout(async () => {
            console.log('🔄 Proactively refreshing token...');
            try {
              const { error } = await supabase.auth.refreshSession();
              if (error) {
                console.error('❌ Proactive token refresh failed:', error);
              } else {
                console.log('✅ Token refreshed proactively');
              }
            } catch (refreshError) {
              console.error('❌ Error during proactive refresh:', refreshError);
            }
          }, timeUntilRefresh);
        }
      }
    } else if (event === 'SIGNED_OUT') {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    }
  });

  console.log('✅ Supabase client created successfully with enhanced auth');
} catch (clientError) {
  console.error('❌ Failed to create Supabase client:', clientError);
  console.error('This will cause the app to use offline mode');

  // Create a mock client that will trigger offline mode
  supabase = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Offline mode') }),
      getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Offline mode') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ error: new Error('Offline mode') }),
      insert: () => ({ error: new Error('Offline mode') }),
      update: () => ({ error: new Error('Offline mode') }),
      delete: () => ({ error: new Error('Offline mode') }),
    }),
  };
}

// JWT Refresh Management
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

// Function to handle JWT expiration and refresh
export const handleJWTExpiration = async (error: any) => {
  if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
    console.log('🔄 JWT expired, attempting to refresh...');

    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing) {
      if (refreshPromise) {
        return await refreshPromise;
      }
      return null;
    }

    isRefreshing = true;
    refreshPromise = supabase.auth.refreshSession();

    try {
      const { data, error: refreshError } = await refreshPromise;

      if (refreshError) {
        console.error('❌ Failed to refresh session:', refreshError);
        // Force logout if refresh fails
        await supabase.auth.signOut();
        window.location.href = '/auth/login';
        return null;
      }

      console.log('✅ Session refreshed successfully');
      return data.session;
    } catch (refreshError) {
      console.error('❌ Error during session refresh:', refreshError);
      await supabase.auth.signOut();
      window.location.href = '/auth/login';
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  return null;
};

// Enhanced helper function to get the current user with retry
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      const refreshedSession = await handleJWTExpiration(error);
      if (refreshedSession) {
        // Retry after refresh
        const { data: { user: retryUser }, error: retryError } = await supabase.auth.getUser();
        if (retryError) throw retryError;
        return retryUser;
      }
      throw error;
    }
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

// Enhanced helper function to get the current session with retry
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      const refreshedSession = await handleJWTExpiration(error);
      if (refreshedSession) {
        return refreshedSession;
      }
      throw error;
    }
    return session;
  } catch (error) {
    console.error('Error getting current session:', error);
    throw error;
  }
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export { supabase };

// Test Supabase connection with timeout
export const testConnection = async (timeoutMs: number = 8000) => {
  try {
    console.log('🔗 Testing Supabase connection...');

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection test timeout')), timeoutMs)
    );

    const connectionPromise = supabase.auth.getSession();

    const { data, error } = await Promise.race([
      connectionPromise,
      timeoutPromise
    ]) as any;

    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Supabase connection test error:', error.message);
    return false;
  }
};
