import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Grid,
  Bookmark,
  Calendar,
  Link as LinkIcon,
  Edit,
  Camera,
  Moon,
  Sun,
  LogOut,
  Bell,
  Shield,
  Globe,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import FileUpload from '../components/FileUpload';
import PageLayout from '../components/PageLayout';

const Profile: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'settings'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Reset loading state when component unmounts
  useEffect(() => {
    return () => {
      setLoading(true);
    };
  }, []);

  // Check current theme
  useEffect(() => {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(currentTheme);
  }, []);

  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    website: '',
  });

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [posts, saved] = await Promise.all([
          DatabaseService.getUserPosts(user.id),
          DatabaseService.getUserSavedPosts(user.id),
        ]);

        if (isMounted) {
          setUserPosts(posts);
          setSavedPosts(saved);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const handleAvatarUpload = async (urls: string[]) => {
    if (urls.length > 0 && user) {
      try {
        await updateProfile({ avatar_url: urls[0] });
      } catch (error) {
        console.error('Error updating avatar:', error);
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return userPosts;
      case 'saved':
        return savedPosts;
      case 'settings':
        return [];
      default:
        return userPosts;
    }
  };

  const SettingItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
  }> = ({ icon, title, description, action, onClick, danger = false }) => (
    <div
      className={`flex items-center justify-between p-5 glass-panel bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-white dark:hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] shadow-sm' : ''
        }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl shadow-sm ${danger ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
          {icon}
        </div>
        <div>
          <h3 className={`font-bold text-sm ${danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {title}
          </h3>
          {description && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center">
          {action}
        </div>
      )}
    </div>
  );

  const renderSettingsContent = () => (
    <div className="space-y-6">
      {/* Appearance */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
        <SettingItem
          icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          title="Theme"
          description={`Currently using ${theme} mode`}
          action={
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          }
        />
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
        <SettingItem
          icon={<Bell className="w-5 h-5" />}
          title="Push Notifications"
          description="Receive notifications for likes, comments, and follows"
          action={
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          }
        />
      </div>

      {/* Privacy & Security */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Security</h2>
        <SettingItem
          icon={<Shield className="w-5 h-5" />}
          title="Privacy Settings"
          description="Manage your account privacy and data"
          action={<ChevronRight className="w-5 h-5 text-gray-400" />}
          onClick={() => {/* TODO: Navigate to privacy settings */ }}
        />
      </div>

      {/* About */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
        <SettingItem
          icon={<Globe className="w-5 h-5" />}
          title="About PromptShare"
          description="Version 1.0.0"
          action={<ChevronRight className="w-5 h-5 text-gray-400" />}
        />
        <SettingItem
          icon={<Smartphone className="w-5 h-5" />}
          title="Mobile App"
          description="Download our mobile app for the best experience"
          action={<ChevronRight className="w-5 h-5 text-gray-400" />}
        />
      </div>

      {/* Logout */}
      <div className="space-y-3">
        <SettingItem
          icon={isLoggingOut ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          title={isLoggingOut ? "Signing out..." : "Sign Out"}
          description="Sign out of your account"
          onClick={handleLogout}
          danger={true}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageLayout className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout className="flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Profile not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please try refreshing the page
          </p>
        </div>
      </PageLayout>
    );
  }

  // Person Schema for AI SEO Expert Attribution
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profile.full_name || profile.username,
    "url": window.location.href,
    "image": profile.avatar_url,
    "description": profile.bio,
    "sameAs": profile.website ? [profile.website] : []
  };

  return (
    <PageLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="glass-card bg-white/40 dark:bg-gray-800/40 rounded-3xl shadow-2xl p-8 mb-10 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative group mx-auto md:mx-0">
              <div className="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-white/50 dark:ring-gray-700/50 shadow-xl transition-transform duration-300 group-hover:scale-105">
                <img
                  src={profile.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200`}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              </div>
              {profile.verified && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="absolute -top-2 -right-2 p-2 bg-white dark:bg-gray-700 text-gray-600 dark:text-white rounded-xl shadow-lg hover:scale-110 active:scale-90 transition-all duration-300"
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                    {profile.full_name || profile.username}
                  </h1>
                  <p className="text-lg font-bold text-blue-500 dark:text-blue-400 mt-1">
                    @{profile.username}
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-3 mt-6 md:mt-0">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <Edit size={18} />
                    <span>Edit Profile</span>
                  </button>
                  <button className="p-2.5 glass-panel bg-white/50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all duration-300 hover:scale-110">
                    <Settings size={22} />
                  </button>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6 font-medium italic">
                  "{profile.bio}"
                </p>
              )}

              {/* Additional Info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm font-bold text-gray-500 dark:text-gray-400 mb-8">
                <div className="flex items-center space-x-2">
                  <Calendar size={18} className="text-blue-500" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                {profile.website && (
                  <div className="flex items-center space-x-2">
                    <LinkIcon size={18} className="text-purple-500" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start space-x-12">
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                    {profile.posts_count}
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 transition-colors">
                    Posts
                  </div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">
                    {profile.followers_count}
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 transition-colors">
                    Followers
                  </div>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                    {profile.following_count}
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-500 transition-colors">
                    Following
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Edit Profile
              </h2>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Picture
                  </label>
                  <FileUpload
                    onFilesUploaded={handleAvatarUpload}
                    onError={(error) => console.error('Upload error:', error)}
                    acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    maxFiles={1}
                    maxSizeInMB={5}
                    bucket="avatars"
                    className="mb-4"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Your full name"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 mb-10 glass-panel bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-1.5 border border-gray-200/50 dark:border-gray-700/50">
          {[
            { key: 'posts', label: 'Posts', icon: Grid },
            { key: 'saved', label: 'Saved', icon: Bookmark },
            { key: 'settings', label: 'Settings', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg'
                : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
              {key !== 'settings' && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition-colors ${activeTab === key ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                  {getTabContent().length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'settings' ? (
          <div className="space-y-6">
            {/* Settings Content */}
            {renderSettingsContent()}
          </div>
        ) : (
          <div className="space-y-6">
            {getTabContent().map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {getTabContent().length === 0 && activeTab !== 'settings' && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'posts' && <Grid size={32} className="text-gray-400" />}
              {activeTab === 'saved' && <Bookmark size={32} className="text-gray-400" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {activeTab} yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'posts' && "You haven't created any posts yet"}
              {activeTab === 'saved' && "You haven't saved any posts yet"}
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Profile;