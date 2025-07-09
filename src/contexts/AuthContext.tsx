import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService } from '../services/auth';
import { MockAuthService } from '../services/mockAuth';

import { Profile } from '../types';
import { debugLog, debugError, debugSuccess, trackAuthState } from '../utils/debug';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  isOfflineMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isUsernameAvailable: (username: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export useAuth as a named function to fix React Hot Reload issues
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { useAuth };

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized) {
      debugLog('Auth already initialized, skipping...');
      return;
    }

    let isMounted = true;
    let authTimeout: NodeJS.Timeout;

    // Force loading to false after maximum timeout
    const forceStopLoading = () => {
      if (isMounted) {
        console.warn('⏰ Authentication timeout reached - forcing loading to false');
        setLoading(false);
        setAuthError('Authentication timeout. Please refresh the page.');
        setInitialized(true);
      }
    };

    // Set maximum timeout for authentication
    authTimeout = setTimeout(forceStopLoading, 10000); // 10 seconds max

    // Test connection and get initial session
    const initializeAuth = async () => {
      try {
        debugLog('Starting authentication initialization...');
        setAuthError(null);
        setInitialized(true);
        trackAuthState({ user: false, loading: true, error: null, step: 'INIT_START' });

        // Get initial session directly (skip connection test to avoid timeout)
        debugLog('Getting initial session...');
        const session = await AuthService.getCurrentSession();

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          debugLog('Session status:', session ? 'Authenticated' : 'Not authenticated');
          trackAuthState({ user: !!session?.user, loading: true, error: null, step: 'SESSION_LOADED' });

          if (session?.user) {
            try {
              debugLog('Fetching user profile for:', session.user.id);
              const profile = await AuthService.getUserProfile(session.user.id);
              if (isMounted) {
                setProfile(profile);
                debugSuccess('Profile loaded:', profile?.username || 'No username');
                trackAuthState({ user: true, loading: false, error: null, step: 'PROFILE_LOADED' });
              }
            } catch (error: any) {
              debugError('Error fetching user profile:', error);
              if (isMounted) {
                // Check if this is a network error
                if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
                  debugLog('🔄 Network error detected, switching to offline mode');
                  setIsOfflineMode(true);
                  // Try to get mock session
                  const mockSession = await MockAuthService.getCurrentSession();
                  if (mockSession) {
                    setUser(mockSession.user as any);
                    setSession(mockSession as any);
                    const mockProfile = await MockAuthService.getUserProfile(mockSession.user.id);
                    setProfile(mockProfile);
                    debugSuccess('✅ Offline mode activated with mock data');
                  }
                } else {
                  setProfile(null);
                }
                trackAuthState({ user: true, loading: false, error: null, step: 'PROFILE_FAILED' });
              }
            }
          } else {
            setProfile(null);
            debugLog('No user session found');
            trackAuthState({ user: false, loading: false, error: null, step: 'NO_SESSION' });
          }
        }
      } catch (error: any) {
        debugError('Error initializing auth:', error);
        if (isMounted) {
          // Check if this is a network error
          if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
            debugLog('🔄 Network error during initialization, switching to offline mode');
            setIsOfflineMode(true);
            // Try to get mock session
            try {
              const mockSession = await MockAuthService.getCurrentSession();
              if (mockSession) {
                setUser(mockSession.user as any);
                setSession(mockSession as any);
                const mockProfile = await MockAuthService.getUserProfile(mockSession.user.id);
                setProfile(mockProfile);
                debugSuccess('✅ Offline mode activated with mock data');
              } else {
                setSession(null);
                setUser(null);
                setProfile(null);
              }
            } catch (mockError) {
              debugError('Failed to initialize mock auth:', mockError);
              setSession(null);
              setUser(null);
              setProfile(null);
            }
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
            // Only set auth error for critical failures, not for missing sessions
            if (error.message && !error.message.includes('session not found')) {
              setAuthError(`Authentication failed: ${error.message}`);
            }
          }
          trackAuthState({ user: false, loading: false, error: error.message, step: 'INIT_ERROR' });
        }
      } finally {
        if (isMounted) {
          debugSuccess('Auth initialization complete');
          setLoading(false);
          clearTimeout(authTimeout);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes (only after initial load)
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        if (!isMounted || !initialized) return;

        debugLog('Auth state change:', { event, userId: session?.user?.id });

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const profile = await AuthService.getUserProfile(session.user.id);
            if (isMounted) {
              setProfile(profile);
              debugSuccess('Profile updated from auth change');
            }
          } catch (error) {
            debugError('Error fetching user profile on auth change:', error);
            if (isMounted) {
              setProfile(null);
            }
          }
        } else {
          if (isMounted) {
            setProfile(null);
            debugLog('User signed out');
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      debugLog('Starting Google sign in...');

      if (isOfflineMode) {
        debugLog('🔄 Using offline mode for Google sign in');
        await MockAuthService.signInWithGoogle();
      } else {
        try {
          await AuthService.signInWithGoogle();
        } catch (error: any) {
          if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
            debugLog('🔄 Network error, switching to offline mode');
            setIsOfflineMode(true);
            await MockAuthService.signInWithGoogle();
          } else {
            throw error;
          }
        }
      }

      debugSuccess('Google sign in successful');
    } catch (error: any) {
      debugError('Google sign in error:', error);
      setAuthError(error.message || 'Failed to sign in with Google');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      debugLog('Starting email sign in...');

      if (isOfflineMode) {
        debugLog('🔄 Using offline mode for email sign in');
        await MockAuthService.signInWithEmail(email, password);
      } else {
        try {
          await AuthService.signInWithEmail(email, password);
        } catch (error: any) {
          if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
            debugLog('🔄 Network error, switching to offline mode');
            setIsOfflineMode(true);
            await MockAuthService.signInWithEmail(email, password);
          } else {
            throw error;
          }
        }
      }

      debugSuccess('Email sign in successful');
    } catch (error: any) {
      debugError('Email sign in error:', error);
      setAuthError(error.message || 'Failed to sign in with email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, username: string, fullName?: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      debugLog('Starting email sign up...');

      if (isOfflineMode) {
        debugLog('🔄 Using offline mode for email sign up');
        await MockAuthService.signUpWithEmail(email, password, username, fullName);
      } else {
        try {
          await AuthService.signUpWithEmail(email, password, username, fullName);
        } catch (error: any) {
          if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED'))) {
            debugLog('🔄 Network error, switching to offline mode');
            setIsOfflineMode(true);
            await MockAuthService.signUpWithEmail(email, password, username, fullName);
          } else {
            throw error;
          }
        }
      }

      debugSuccess('Email sign up successful');
    } catch (error: any) {
      debugError('Email sign up error:', error);
      setAuthError(error.message || 'Failed to sign up with email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Starting logout process...');

      // Sign out from Supabase
      await AuthService.signOut();

      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setSession(null);
      setAuthError(null);

      // Clear any cached data in localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-dvipkkjmzcinqfvjntna-auth-token');

      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);

      // Even if there's an error, clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      setAuthError(null);

      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const updatedProfile = await AuthService.updateUserProfile(user.id, updates);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const isUsernameAvailable = async (username: string) => {
    try {
      return await AuthService.isUsernameAvailable(username);
    } catch (error) {
      console.error('Error checking username availability:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      await AuthService.updatePassword(newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    authError,
    isOfflineMode,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateProfile,
    isUsernameAvailable,
    resetPassword,
    updatePassword,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
