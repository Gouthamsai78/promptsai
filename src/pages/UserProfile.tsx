import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Link as LinkIcon, Grid, UserPlus, UserMinus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Post, Profile as ProfileType } from '../types';
import PostCard from '../components/PostCard';
import PageLayout from '../components/PageLayout';

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!username) return;

      try {
        setLoading(true);
        setError(null);

        // Search for user by username
        const users = await DatabaseService.searchUsers(username, 1);
        const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (!foundUser) {
          setError('User not found');
          setLoading(false);
          return;
        }

        setProfile(foundUser);

        // Load user's posts
        const posts = await DatabaseService.getUserPosts(foundUser.id);
        setUserPosts(posts);

        // Check if current user is following this user
        if (user && user.id !== foundUser.id) {
          const following = await DatabaseService.isFollowing(user.id, foundUser.id);
          setIsFollowing(following);
        }

      } catch (error: any) {
        console.error('Error loading user profile:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [username, user]);

  const handleFollowToggle = async () => {
    if (!user || !profile || user.id === profile.id) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await DatabaseService.unfollowUser(user.id, profile.id);
        setIsFollowing(false);
        // Update follower count locally
        setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count - 1 } : null);
      } else {
        await DatabaseService.followUser(user.id, profile.id);
        setIsFollowing(true);
        // Update follower count locally
        setProfile(prev => prev ? { ...prev, followers_count: prev.followers_count + 1 } : null);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </PageLayout>
    );
  }

  if (error || !profile) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'User not found'}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
        </div>
      </PageLayout>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 mb-6 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200`}
                alt={profile.username}
                className="w-24 h-24 rounded-full object-cover"
              />
              {profile.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.full_name || profile.username}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    @{profile.username}
                  </p>
                </div>

                {/* Follow/Edit Button */}
                <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                  {isOwnProfile ? (
                    <button
                      onClick={() => navigate('/profile')}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      disabled={isFollowLoading}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        isFollowing
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isFollowLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : isFollowing ? (
                        <UserMinus size={16} />
                      ) : (
                        <UserPlus size={16} />
                      )}
                      <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {profile.posts_count || userPosts.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {profile.followers_count}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {profile.following_count}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                {profile.website && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon size={16} />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Grid size={20} className="text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Posts ({userPosts.length})
              </h2>
            </div>
          </div>

          <div className="p-6">
            {userPosts.length > 0 ? (
              <div className="space-y-6">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Grid size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {isOwnProfile ? "You haven't" : `${profile.username} hasn't`} shared any posts yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default UserProfile;
