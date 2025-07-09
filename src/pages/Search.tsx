import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, X, Sliders, Loader, User, Users } from 'lucide-react';
import PostCard from '../components/PostCard';
import ToolCard from '../components/ToolCard';
import { DatabaseService } from '../services/database';
import { Post, Tool, Profile } from '../types';
import PageLayout from '../components/PageLayout';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'prompts' | 'tools' | 'users'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'most_copied'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [postsData, toolsData] = await Promise.all([
        DatabaseService.getPosts(50, 0),
        DatabaseService.getTools(50, 0)
      ]);
      setPosts(postsData);
      setTools(toolsData);
    } catch (error: any) {
      console.error('Error loading search data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search function for users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      const usersData = await DatabaseService.searchUsers(query, 20);
      setUsers(usersData);
    } catch (error: any) {
      console.error('Error searching users:', error);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() && (searchType === 'all' || searchType === 'users')) {
        searchUsers(searchTerm);
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchType]);

  // Get all unique tags
  const allTags = Array.from(new Set([
    ...posts.flatMap(post => post.tags || []),
    ...tools.flatMap(tool => tool.category ? [tool.category] : [])
  ]));

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSortBy('newest');
  };

  // Filter and search logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === '' ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesTags = selectedTags.length === 0 ||
      (post.tags && selectedTags.some(tag => post.tags?.includes(tag)));

    return matchesSearch && matchesTags;
  });

  const filteredTools = tools.filter(tool => {
    const matchesSearch = searchTerm === '' ||
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTags = selectedTags.length === 0 ||
      (tool.category && selectedTags.includes(tool.category));

    return matchesSearch && matchesTags;
  });

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find prompts, tools, and inspiration
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for prompts, tools, or tags..."
            className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-lg"
            disabled={loading}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-4 top-3.5 p-1 rounded transition-colors ${
              showFilters || selectedTags.length > 0
                ? 'text-blue-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            disabled={loading}
          >
            <Sliders size={20} />
          </button>
        </div>

        {/* Search Type Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'prompts', label: 'Prompts' },
            { key: 'tools', label: 'Tools' },
            { key: 'users', label: 'Users' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSearchType(key as typeof searchType)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchType === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Sort By */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Sort By
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'newest', label: 'Newest' },
                  { key: 'popular', label: 'Most Popular' },
                  { key: 'most_copied', label: 'Most Copied' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key as typeof sortBy)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      sortBy === key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => toggleTag(tag)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Loading search data...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <div className="space-y-8">
          {/* Prompts Section */}
          {(searchType === 'all' || searchType === 'prompts') && filteredPosts.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Prompts ({filteredPosts.length})
              </h2>
              <div className="space-y-6">
                {filteredPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* Tools Section */}
          {(searchType === 'all' || searchType === 'tools') && filteredTools.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Tools ({filteredTools.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTools.map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* Users Section */}
          {(searchType === 'all' || searchType === 'users') && users.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Users ({users.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(user => (
                  <div
                    key={user.id}
                    onClick={() => navigate(`/user/${user.username}`)}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {user.full_name || user.username}
                          </h3>
                          {user.verified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                        {user.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {user.bio}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{user.posts_count || 0} posts</span>
                          <span>{user.followers_count} followers</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredPosts.length === 0 && filteredTools.length === 0 && users.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try different keywords or adjust your filters
              </p>
            </div>
          )}

          {/* Initial State */}
          {!searchTerm && selectedTags.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Start searching
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter keywords to find prompts, tools, and users
              </p>
            </div>
          )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Search;