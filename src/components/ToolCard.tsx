import React from 'react';
import { ExternalLink, User } from 'lucide-react';
import { Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt={`${tool.name} logo`}
                className="w-12 h-12 rounded-lg object-cover"
                onError={(e) => {
                  // Hide the image and show the fallback icon instead
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {tool.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {tool.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tool.category}
              </p>
            </div>
          </div>

          <a
            href={tool.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group-hover:scale-110 duration-200"
          >
            <ExternalLink size={20} />
          </a>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {tool.description}
        </p>

        {/* Tags */}
        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tool.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <User size={14} />
            <span>Added by {tool.author.username}</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(tool.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;