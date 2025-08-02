import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Lock, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CommunityService } from '../services/community';
import { CommunityWithCreator } from '../types/community';
import { debugLog, debugError } from '../utils/debug';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import CommunityDiscussion from '../components/CommunityDiscussion';

const CommunityDiscussionPage: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [community, setCommunity] = useState<CommunityWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'moderator' | 'member'>('member');

  // Load community data
  useEffect(() => {
    if (!communityId || !user) return;

    const loadCommunityData = async () => {
      try {
        setLoading(true);
        debugLog('🏘️ Loading community for discussion:', communityId);

        // Load community details
        const communityResponse = await CommunityService.getCommunityById(communityId);
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data);
        } else {
          debugError('Failed to load community:', communityResponse.error);
          navigate('/communities');
          return;
        }

        // Check user's membership and role
        const membershipResponse = await CommunityService.getUserMembership(communityId, user.id);
        if (membershipResponse.success && membershipResponse.data) {
          setUserRole(membershipResponse.data.role as any);
        } else {
          // User is not a member, redirect to communities
          debugError('User is not a member of this community');
          navigate('/communities');
          return;
        }

      } catch (error: any) {
        debugError('Error loading community data:', error.message);
        navigate('/communities');
      } finally {
        setLoading(false);
      }
    };

    loadCommunityData();
  }, [communityId, user, navigate]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  if (!community) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Community not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This community may have been deleted or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/communities')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Communities
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/communities')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>{community.member_count} members</span>
              {community.privacy === 'private' ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {community.name}
            </h1>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
              {userRole}
            </span>
          </div>

          {community.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {community.description}
            </p>
          )}
        </div>

        {/* Discussion Component */}
        <div className="h-[600px]">
          <CommunityDiscussion
            communityId={communityId!}
            communityName={community.name}
            userRole={userRole}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default CommunityDiscussionPage;