import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { DatabaseService } from '../services/database';
import { Tool } from '../types';
import { Filter, Loader } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import SearchBar from '../components/SearchBar';

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
        <div className="mb-8 pt-4 md:pt-6">
          <h1 className="text-3xl md:text-4xl font-extrabold font-outfit text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 tracking-tight mb-3">
            Explore AI Tools
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Discover amazing AI tools shared by the community.
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
          <SearchBar
            placeholder="Search AI tools and resources..."
            value={searchTerm}
            onChange={setSearchTerm}
            showTrending={true}
            variant="default"
            className="w-full"
          />

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                disabled={loading}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                    : 'glass-panel text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50'
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
        <div className="mt-12 mb-8 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-900/20 rounded-full blur-2xl group-hover:bg-purple-900/30 transition-colors duration-500" />

            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold font-outfit mb-3">
                Know an amazing AI tool?
              </h3>
              <p className="mb-6 opacity-90 text-lg max-w-lg mx-auto">
                Share it with the community and help others discover great resources.
              </p>
              <button
                onClick={() => navigate('/create')}
                className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Add New Tool
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Explore;