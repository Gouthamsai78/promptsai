// Mock authentication service for development when Supabase is not available
import { Profile } from '../types';

interface MockUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface MockSession {
  user: MockUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Mock user data
const MOCK_USER: MockUser = {
  id: 'mock-user-123',
  email: 'demo@promptshare.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_PROFILE: Profile = {
  id: 'mock-user-123',
  username: 'demo_user',
  full_name: 'Demo User',
  bio: 'This is a demo account for testing PromptShare',
  avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
  website: 'https://promptshare.demo',
  verified: true,
  followers_count: 42,
  following_count: 15,
  posts_count: 8,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_SESSION: MockSession = {
  user: MOCK_USER,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000, // 1 hour from now
};

// Local storage keys
const STORAGE_KEYS = {
  SESSION: 'mock-auth-session',
  USER: 'mock-auth-user',
  PROFILE: 'mock-auth-profile',
};

export class MockAuthService {
  private static isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SESSION) !== null;
  }

  private static saveSession(session: MockSession): void {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(session.user));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(MOCK_PROFILE));
  }

  private static clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }

  static async signInWithGoogle() {
    console.log('🔄 Mock Google sign in');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.saveSession(MOCK_SESSION);
    return { user: MOCK_USER, session: MOCK_SESSION };
  }

  static async signInWithEmail(email: string, password: string) {
    console.log('🔄 Mock email sign in:', email);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    this.saveSession(MOCK_SESSION);
    return { user: MOCK_USER, session: MOCK_SESSION };
  }

  static async signUpWithEmail(email: string, password: string, username: string, fullName?: string) {
    console.log('🔄 Mock email sign up:', email, username);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple validation
    if (!email || !password || !username) {
      throw new Error('Email, password, and username are required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    // Create mock user with provided data
    const newUser = {
      ...MOCK_USER,
      email,
    };

    const newProfile = {
      ...MOCK_PROFILE,
      username,
      full_name: fullName || username,
    };

    const newSession = {
      ...MOCK_SESSION,
      user: newUser,
    };

    this.saveSession(newSession);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
    
    return { user: newUser, session: newSession };
  }

  static async signOut() {
    console.log('🔄 Mock sign out');
    this.clearSession();
  }

  static async getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  static async getCurrentSession() {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!sessionStr) return null;
    
    const session = JSON.parse(sessionStr);
    
    // Check if session is expired
    if (session.expires_at < Date.now()) {
      this.clearSession();
      return null;
    }
    
    return session;
  }

  static async getUserProfile(userId: string): Promise<Profile | null> {
    const profileStr = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return profileStr ? JSON.parse(profileStr) : MOCK_PROFILE;
  }

  static async updateUserProfile(userId: string, updates: Partial<Profile>) {
    const currentProfile = await this.getUserProfile(userId);
    const updatedProfile = { ...currentProfile, ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
    return updatedProfile;
  }

  static async isUsernameAvailable(username: string): Promise<boolean> {
    // Simulate some usernames being taken
    const takenUsernames = ['admin', 'test', 'user', 'demo'];
    return !takenUsernames.includes(username.toLowerCase());
  }

  static async resetPassword(email: string) {
    console.log('🔄 Mock password reset for:', email);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  static async updatePassword(newPassword: string) {
    console.log('🔄 Mock password update');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    // Return a mock subscription
    return {
      data: {
        subscription: {
          unsubscribe: () => console.log('🔄 Mock auth state change unsubscribed')
        }
      }
    };
  }
}
