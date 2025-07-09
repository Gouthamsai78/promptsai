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
    },
  });
  console.log('✅ Supabase client created successfully');
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

export { supabase };

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to get the current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

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
