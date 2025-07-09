import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export class AuthService {
  // Sign in with Google
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return data;
  }

  // Sign in with email and password
  static async signInWithEmail(email: string, password: string) {
    // Quick validation to avoid unnecessary API calls
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.');
        }
        if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      // Handle network errors
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  // Sign up with email and password
  static async signUpWithEmail(email: string, password: string, username: string, fullName?: string) {
    // Quick validation to avoid unnecessary API calls
    if (!email || !password || !username) {
      throw new Error('Email, password, and username are required');
    }

    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    try {
      // Check if username is available
      const isAvailable = await this.isUsernameAvailable(username);
      if (!isAvailable) {
        throw new Error('Username is already taken. Please choose a different one.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName || username,
          },
        },
      });

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        if (error.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long');
        }
        if (error.message.includes('Unable to validate email address')) {
          throw new Error('Please enter a valid email address');
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      // Handle network errors
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  // Sign out
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Get current user
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // Get current session (simplified)
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error);
        // Don't throw for session errors, just return null
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      // Don't throw for session retrieval errors
      return null;
    }
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Check if username is available
  static async isUsernameAvailable(username: string): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') return true; // No rows returned, username is available
    if (error) throw error;
    return false; // Username exists
  }

  // Reset password
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  }

  // Update password
  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
