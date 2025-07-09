import React, { useState } from 'react';
import { TestTube, Sparkles, ExternalLink, MessageCircle, Copy, Palette, Heart, X } from 'lucide-react';
import AIChatInterface from './AIChatInterface';
import { Message } from '../types/ai';

const TestEnhancedUI: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  // Sample enhanced prompts for demonstration
  const sampleEnhancedPrompts = [
    {
      id: 'photo_demo',
      style: 'photographic',
      prompt: 'A beautiful cat sitting gracefully in a sunlit garden, professional photography style: shot with high-end DSLR camera, perfect natural lighting, award-winning composition, 8K resolution, photorealistic detail, magazine quality, shallow depth of field, bokeh background',
      description: 'Professional photography with technical specifications'
    },
    {
      id: 'art_demo',
      style: 'artistic',
      prompt: 'A beautiful cat sitting gracefully in a sunlit garden, fine art style: museum-quality artwork, masterpiece composition, artistic lighting, rich textures, gallery-worthy presentation, classical art techniques, oil painting style, renaissance influence',
      description: 'Fine art style with artistic techniques'
    },
    {
      id: 'cinema_demo',
      style: 'cinematic',
      prompt: 'A beautiful cat sitting gracefully in a sunlit garden, cinematic style: movie-quality composition, dramatic lighting, film grain, epic atmosphere, blockbuster aesthetic, IMAX-worthy detail, golden hour lighting, cinematic color grading',
      description: 'Cinematic film style with dramatic elements'
    },
    {
      id: 'digital_demo',
      style: 'digital_art',
      prompt: 'A beautiful cat sitting gracefully in a sunlit garden, digital art style: 8K ultra-high resolution, trending on ArtStation, concept art quality, modern digital techniques, vibrant colors, hyperrealistic rendering, digital painting masterpiece',
      description: 'Digital art with modern rendering techniques'
    }
  ];

  // Sample messages with enhanced prompts
  const sampleMessages: Message[] = [
    {
      id: 'user_1',
      type: 'user',
      content: 'a beautiful cat in a garden',
      timestamp: new Date()
    },
    {
      id: 'ai_1',
      type: 'ai',
      content: 'Perfect! I\'ve enhanced your image generation prompt. Here are 4 professional versions optimized for different styles:',
      timestamp: new Date(),
      enhancedPrompts: sampleEnhancedPrompts,
      metadata: {
        promptCategory: 'image_generation',
        processingTime: 1250,
        modelUsed: 'gemini-2.5-pro'
      }
    }
  ];

  const openChatPage = () => {
    window.open('/chat', '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Enhanced UI Features Demo
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This demo showcases the enhanced AIChatInterface with improved copy functionality, 
            better UI design, and advanced UX features for the enhanced prompts display.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">✨ New Features</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Enhanced copy buttons with visual feedback</li>
                <li>• Style-specific icons and color coding</li>
                <li>• Expand/collapse for long prompts</li>
                <li>• Favorite system with heart icons</li>
                <li>• Copy all prompts functionality</li>
                <li>• Keyboard shortcuts (Ctrl+C)</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">🎨 UI Improvements</h3>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Modern card design with hover effects</li>
                <li>• Responsive mobile-first layout</li>
                <li>• Better typography and spacing</li>
                <li>• Professional header with icons</li>
                <li>• Loading states and error handling</li>
                <li>• Accessibility improvements</li>
              </ul>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="inline-flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              {showDemo ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Hide Demo
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Show Enhanced UI Demo
                </>
              )}
            </button>

            <button
              onClick={openChatPage}
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Try Live Chat
            </button>
          </div>
        </div>

        {/* Demo Interface */}
        {showDemo && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enhanced AIChatInterface Demo
              </h3>
            </div>
            <div className="h-[600px]">
              <AIChatInterface 
                messages={sampleMessages}
                onSendMessage={() => {}}
                isLoading={false}
                fullHeight={false}
                className="border-0"
              />
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Copy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enhanced Copy</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visual feedback, error handling, and copy all functionality
            </p>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Style Indicators</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Color-coded badges with unique icons for each prompt style
            </p>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Favorites</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Save and highlight your preferred prompt variations
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">How to Test the Enhanced Features</h4>
          <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
            <p>1. <strong>Copy Functionality:</strong> Click any copy button to see the visual feedback (checkmark appears)</p>
            <p>2. <strong>Copy All:</strong> Use the "Copy All" button in the header to copy all 4 style variants at once</p>
            <p>3. <strong>Favorites:</strong> Click the heart icons to favorite/unfavorite prompts (border changes color)</p>
            <p>4. <strong>Expand/Collapse:</strong> Long prompts show "Show more" links and chevron buttons</p>
            <p>5. <strong>Keyboard Shortcuts:</strong> Focus on a prompt card and press Ctrl+C to copy</p>
            <p>6. <strong>Mobile Testing:</strong> Resize your browser to see responsive design in action</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEnhancedUI;
