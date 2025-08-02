import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Lock, Globe, UserPlus, Check, Clock, Crown, MessageCircle } from 'lucide-react';
import { CommunityWithCreator, COMMUNITY_CATEGORIES } from '../types/community';
import { CommunityService } from '../services/community';
import { useAuth } from '../contexts/AuthContext';
import { debugLog, debugError } from '../utils/debug';

interface CommunityCardProps {
  community: CommunityWithCreator;
  onJoin?: () => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community, onJoin }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<'none' | 'joined' | 'pending'>('none');
  const [loading, setLoading] = useState(true);

  // Check user's membership status when component loads
  useEffect(() => {
    const checkMembershipStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is the creator
        if (user.id === community.created_by) {
          setJoinStatus('joined');
          setLoading(false);
          return;
        }

        // Check if user is a member
        const isMember = await CommunityService.isUserMember(community.id, user.id);
        if (isMember) {
          setJoinStatus('joined');
        } else {
          // Check if user has a pending membership
          const membershipResponse = await CommunityService.getUserMembership(community.id, user.id);
          if (membershipResponse.success && membershipResponse.data?.status === 'pending') {
            setJoinStatus('pending');
          } else {
            setJoinStatus('none');
          }
        }
      } catch (error: any) {
        debugError('Error checking membership status:', error.message);
        setJoinStatus('none');
      } finally {
        setLoading(false);
      }
    };

    checkMembershipStatus();
  }, [user, community.id, community.created_by]);

  // Get category label
  const getCategoryLabel = (category: string) => {
    return COMMUNITY_CATEGORIES[category as keyof typeof COMMUNITY_CATEGORIES] || category;
  };

  // Handle join community
  const handleJoin = async () => {
    if (!user || isJoining) return;

    try {
      setIsJoining(true);
      debugLog('🚪 Joining community:', community.id);

      const response = await CommunityService.joinCommunity(community.id);
      
      if (response.success) {
        const status = community.privacy === 'private' || community.require_approval ? 'pending' : 'joined';
        setJoinStatus(status);
        debugLog('✅ Successfully joined community:', status);
        onJoin?.();
      } else {
        debugError('❌ Failed to join community:', response.error);
        // Show error message to user
        alert(response.error || 'Failed to join community');
      }
    } catch (error: any) {
      debugError('❌ Error joining community:', error.message);
      alert('An error occurred while joining the community');
    } finally {
      setIsJoining(false);
    }
  };

  // Get join button content
  const getJoinButtonContent = () => {
    if (isJoining) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          <span>Joining...</span>
        </>
      );
    }

    switch (joinStatus) {
      case 'joined':
        return (
          <>
            <Check className="h-4 w-4" />
            <span>Joined</span>
          </>
        );
      case 'pending':
        return (
          <>
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </>
        );
      default:
        return (
          <>
            <UserPlus className="h-4 w-4" />
            <span>Join</span>
          </>
        );
    }
  };

  // Get join button styles
  const getJoinButtonStyles = () => {
    const baseStyles = "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors";
    
    switch (joinStatus) {
      case 'joined':
        return `${baseStyles} bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400`;
      case 'pending':
        return `${baseStyles} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400`;
      default:
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white ${isJoining ? 'opacity-75 cursor-not-allowed' : ''}`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover Image */}
      {community.cover_image_url ? (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <img
            src={community.cover_image_url}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <Users className="h-12 w-12 text-white opacity-80" />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {community.name}
              </h3>
              {community.privacy === 'private' ? (
                <Lock className="h-4 w-4 text-gray-500" />
              ) : (
                <Globe className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            {/* Category */}
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
              {getCategoryLabel(community.category)}
            </span>
          </div>
        </div>

        {/* Description */}
        {community.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {community.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{community.member_count} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>{community.post_count + community.reel_count} posts</span>
            </div>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              {community.creator.avatar_url ? (
                <img
                  src={community.creator.avatar_url}
                  alt={community.creator.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <Crown className="h-3 w-3 text-gray-500" />
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span>by </span>
              <span className="font-medium">@{community.creator.username}</span>
              {community.creator.verified && (
                <span className="text-blue-500 ml-1">✓</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* View Discussion Button (for joined members) */}
            {user && joinStatus === 'joined' && (
              <button
                onClick={() => navigate(`/community/${community.id}/discussion`)}
                className="flex items-center space-x-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 rounded-lg font-medium transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Discussion</span>
              </button>
            )}

            {/* Join Button */}
            {user && user.id !== community.created_by && joinStatus === 'none' && (
              <button
                onClick={handleJoin}
                disabled={isJoining}
                className={getJoinButtonStyles()}
              >
                {getJoinButtonContent()}
              </button>
            )}

            {/* Status Indicators */}
            {joinStatus !== 'none' && joinStatus !== 'joined' && (
              <div className={getJoinButtonStyles()}>
                {getJoinButtonContent()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityCard;
