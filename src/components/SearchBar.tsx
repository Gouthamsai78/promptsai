import React, { useState, useEffect } from 'react';
import { Search, X, Filter, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  showTrending?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'prominent';
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search prompts, tools, and content...",
  value = '',
  onChange,
  onSearch,
  showTrending = false,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Trending searches (mock data - could be fetched from API)
  const trendingSearches = [
    'AI art prompts',
    'Character design',
    'Logo creation',
    'Photography styles',
    'Digital painting',
    'Concept art'
  ];

  // Update internal state when external value changes
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange?.(newValue);
  };

  // Handle search submission
  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      onSearch?.(searchTerm.trim());
      // Navigate to search page with query
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowSuggestions(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsFocused(false);
    }
  };

  // Handle clear search
  const handleClear = () => {
    setSearchQuery('');
    onChange?.('');
    setShowSuggestions(false);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    if (showTrending && searchQuery.length === 0) {
      setShowSuggestions(true);
    }
  };

  // Handle blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  // Handle trending search click
  const handleTrendingClick = (trend: string) => {
    setSearchQuery(trend);
    onChange?.(trend);
    handleSearch(trend);
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-5 py-4 text-lg';
      default:
        return 'px-4 py-3';
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'border-0 bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700';
      case 'prominent':
        return 'border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 shadow-lg';
      default:
        return 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-10 rounded-lg transition-all duration-200
            text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${getSizeClasses()}
            ${getVariantClasses()}
            ${isFocused ? 'ring-2 ring-blue-500' : ''}
          `}
        />
        
        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && showTrending && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Trending Searches
              </span>
            </div>
            <div className="space-y-2">
              {trendingSearches.map((trend, index) => (
                <button
                  key={index}
                  onClick={() => handleTrendingClick(trend)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  {trend}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
