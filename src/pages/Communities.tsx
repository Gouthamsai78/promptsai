import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Lock, Globe, Sparkles } from 'lucide-react';
import { CommunityService } from '../services/community';
import { CommunityWithCreator, CommunitySearchParams, COMMUNITY_CATEGORIES } from '../types/community';
import { useAuth } from '../contexts/AuthContext';
import { debugLog, debugError } from '../utils/debug';
import PageLayout from '../components/PageLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import CommunityCard from '../components/CommunityCard';
import CreateCommunityModal from '../components/CreateCommunityModal';

const Communities: React.FC = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-communities'>('discover');

  // Fetch communities based on active tab
  const fetchCommunities = async () => {
    try {
      setLoading(true);
      debugLog('🏘️ Fetching communities for tab:', activeTab);

      let response;

      if (activeTab === 'my-communities' && user) {
        // Fetch user's communities (created + joined)
        response = await CommunityService.getAllUserCommunities(user.id, 20, 0);
      } else {
        // Fetch all communities with search/filter
        const searchParams: CommunitySearchParams = {
          query: searchQuery || undefined,
          category: selectedCategory || undefined,
          sort_by: 'member_count',
          sort_order: 'desc',
          limit: 20
        };
        response = await CommunityService.searchCommunities(searchParams);
      }

      if (response.success && response.data) {
        setCommunities(response.data);
        debugLog('✅ Communities fetched successfully:', response.data.length);
      } else {
        debugError('❌ Failed to fetch communities:', response.error);
        setCommunities([]);
      }
    } catch (error: any) {
      debugError('❌ Error fetching communities:', error.message);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and search/filter changes
  useEffect(() => {
    fetchCommunities();
  }, [searchQuery, selectedCategory, refreshTrigger, activeTab, user]);

  // Handle community creation success
  const handleCommunityCreated = () => {
    setShowCreateModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle category filter
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              Communities
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Discover and join communities around your interests
            </p>
          </div>
          
          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Community</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        {user && (
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Discover Communities
            </button>
            <button
              onClick={() => setActiveTab('my-communities')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-communities'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              My Communities
            </button>
          </div>
        )}

        {/* Search and Filters - Only show for discover tab */}
        {activeTab === 'discover' && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none min-w-[200px]"
              >
                <option value="">All Categories</option>
                {Object.entries(COMMUNITY_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Communities Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : communities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onJoin={() => setRefreshTrigger(prev => prev + 1)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {activeTab === 'my-communities' ? 'No communities yet' : 'No communities found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {activeTab === 'my-communities'
                ? 'You haven\'t created or joined any communities yet.'
                : searchQuery || selectedCategory
                ? 'Try adjusting your search or filters'
                : 'Be the first to create a community!'}
            </p>
            {user && (activeTab === 'discover' || activeTab === 'my-communities') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>{activeTab === 'my-communities' ? 'Create Your First Community' : 'Create First Community'}</span>
              </button>
            )}
          </div>
        )}

        {/* Create Community Modal */}
        {showCreateModal && (
          <CreateCommunityModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCommunityCreated}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default Communities;
