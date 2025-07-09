import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { DatabaseService } from '../services/database';
import { Tool } from '../types';
import { Filter, Loader } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = ['All', 'Image Generation', 'Text Generation', 'Video Generation', 'Audio', 'Code'];

  // Load tools from database
  useEffect(() => {
    loadTools();
  }, [selectedCategory]);

  const loadTools = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading tools from database...', { category: selectedCategory });

      const toolsData = await DatabaseService.getTools(50, 0, selectedCategory === 'All' ? undefined : selectedCategory);
      setTools(toolsData);

      console.log('✅ Tools loaded successfully:', toolsData.length, 'tools');
    } catch (error: any) {
      console.error('❌ Error loading tools:', error);
      setError('Failed to load tools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool => {
    if (searchTerm === '') return true;

    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesSearch;
  });

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Explore AI Tools
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover amazing AI tools shared by the community
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={loadTools}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tools..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              disabled={loading}
            />
            <Filter className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Loading tools...</span>
            </div>
          </div>
        )}

        {/* Tools Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTools.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No tools found' : 'No tools available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search or filter criteria'
                : 'Be the first to submit an AI tool to the community!'
              }
            </p>
          </div>
        )}

        {/* Add Tool CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-xl font-bold mb-2">
              Know an amazing AI tool?
            </h3>
            <p className="mb-4 opacity-90">
              Share it with the community and help others discover great tools
            </p>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Add New Tool
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Explore;