import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Copy, Loader, Wand2, Camera, Palette, Film, Monitor } from 'lucide-react';
import { AIService } from '../services/ai';
import { EnhancedPrompt, PromptEnhancementResult } from '../types/ai';
import { debugLog } from '../utils/debug';

interface AIPromptEnhancerProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onEnhancementSelect?: (enhancement: EnhancedPrompt) => void;
  className?: string;
  disabled?: boolean;
}

const AIPromptEnhancer: React.FC<AIPromptEnhancerProps> = ({
  prompt,
  onPromptChange,
  onEnhancementSelect,
  className = '',
  disabled = false
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancements, setEnhancements] = useState<PromptEnhancementResult | null>(null);
  const [showEnhancements, setShowEnhancements] = useState(false);
  const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancedPrompt | null>(null);
  const [error, setError] = useState<string>('');
  const [enhancementTimeout, setEnhancementTimeout] = useState<NodeJS.Timeout | null>(null);

  // Style icons mapping
  const styleIcons = {
    photographic: Camera,
    artistic: Palette,
    cinematic: Film,
    digital_art: Monitor
  };

  // Auto-enhance prompt with debouncing
  const enhancePrompt = useCallback(async (inputPrompt: string) => {
    if (!inputPrompt || inputPrompt.trim().length < 3 || disabled) return;

    // Check if this looks like an image generation prompt
    const isImagePrompt = AIService.isImageGenerationPrompt(inputPrompt.trim());

    if (!isImagePrompt) {
      setError('This appears to be general text rather than an image generation prompt. Try describing a visual scene, character, or artwork instead.');
      setEnhancements(null);
      setShowEnhancements(false);
      return;
    }

    setIsEnhancing(true);
    setError('');

    try {
      debugLog('🚀 Auto-enhancing image generation prompt:', inputPrompt);
      // Call without fallback to see actual errors
      const result = await AIService.enhancePrompt(inputPrompt.trim(), false);
      setEnhancements(result);
      setShowEnhancements(true);
      debugLog('✅ Prompt enhanced successfully');
    } catch (error: any) {
      debugLog('❌ Prompt enhancement failed:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(`AI Enhancement Error: ${error.message}`);
      setEnhancements(null);

      // Try with fallback as backup
      try {
        debugLog('🔄 Trying with fallback...');
        const fallbackResult = await AIService.enhancePrompt(inputPrompt.trim(), true);
        setEnhancements(fallbackResult);
        setShowEnhancements(true);
        setError('Using mock enhancement - API error occurred');
      } catch (fallbackError: any) {
        debugLog('❌ Even fallback failed:', fallbackError.message);
        setError(`Complete failure: ${fallbackError.message}`);
      }
    } finally {
      setIsEnhancing(false);
    }
  }, [disabled]);

  // Debounced auto-enhancement
  useEffect(() => {
    if (enhancementTimeout) {
      clearTimeout(enhancementTimeout);
    }

    if (prompt && prompt.trim().length >= 3) {
      const timeout = setTimeout(() => {
        enhancePrompt(prompt);
      }, 2000); // 2 second delay after user stops typing

      setEnhancementTimeout(timeout);
    } else {
      setEnhancements(null);
      setShowEnhancements(false);
    }

    return () => {
      if (enhancementTimeout) {
        clearTimeout(enhancementTimeout);
      }
    };
  }, [prompt, enhancePrompt]);

  // Apply enhancement to prompt
  const applyEnhancement = (enhancement: EnhancedPrompt) => {
    onPromptChange(enhancement.prompt);
    setSelectedEnhancement(enhancement);
    setShowEnhancements(false);
    onEnhancementSelect?.(enhancement);
    debugLog('✨ Applied enhancement:', enhancement.style);
  };

  // Copy enhancement to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      debugLog('📋 Copied to clipboard');
    } catch (error) {
      debugLog('❌ Failed to copy to clipboard:', error);
    }
  };

  // Manual enhance trigger
  const triggerEnhancement = () => {
    if (prompt && prompt.trim().length >= 3) {
      enhancePrompt(prompt);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;

      // Ctrl+E to enhance
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault();
        triggerEnhancement();
      }

      // Ctrl+C to copy selected enhancement
      if (event.ctrlKey && event.key === 'c' && selectedEnhancement) {
        event.preventDefault();
        copyToClipboard(selectedEnhancement.prompt);
      }

      // Ctrl+1-4 to select enhancement styles
      if (event.ctrlKey && enhancements && showEnhancements) {
        const num = parseInt(event.key);
        if (num >= 1 && num <= 4 && enhancements.enhanced[num - 1]) {
          event.preventDefault();
          applyEnhancement(enhancements.enhanced[num - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, selectedEnhancement, enhancements, showEnhancements, prompt]);

  if (!AIService.isAIAvailable()) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-300">
          <Wand2 className="h-4 w-4" />
          <span className="text-sm">AI enhancement unavailable - add OpenRouter API key to enable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Enhancement Status - Mobile Optimized */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isEnhancing ? 'animate-pulse text-blue-500' : 'text-gray-400'}`} />
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
            {isEnhancing ? 'Enhancing prompt...' : 'AI Enhancement Ready'}
          </span>
        </div>

        {!isEnhancing && prompt && prompt.trim().length >= 3 && (
          <button
            onClick={triggerEnhancement}
            disabled={disabled}
            className="flex items-center space-x-1 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-[36px] touch-manipulation"
          >
            <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Enhance</span>
            <span className="sm:hidden">✨</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {isEnhancing && (
        <div className="flex items-center justify-center py-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Loader className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          <span className="text-blue-700 dark:text-blue-300">Creating enhanced prompts...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Enhanced Prompts */}
      {enhancements && showEnhancements && !isEnhancing && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Enhanced Prompts ({enhancements.processingTime}ms)
            </h4>
            <button
              onClick={() => setShowEnhancements(false)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Hide
            </button>
          </div>

          {/* Mobile-optimized grid layout */}
          <div className="grid gap-2 sm:gap-3">
            {enhancements.enhanced.map((enhancement, index) => {
              const IconComponent = styleIcons[enhancement.style];
              const isSelected = selectedEnhancement?.id === enhancement.id;

              return (
                <div
                  key={enhancement.id}
                  className={`p-3 sm:p-4 border rounded-lg transition-all cursor-pointer touch-manipulation min-h-[44px] ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                  onClick={() => applyEnhancement(enhancement)}
                >
                  {/* Mobile-optimized header */}
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {enhancement.description}
                      </span>
                      {/* Hide keyboard shortcut on mobile */}
                      <span className="hidden sm:inline text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex-shrink-0">
                        Ctrl+{index + 1}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(enhancement.prompt);
                      }}
                      className="p-2 sm:p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors min-h-[44px] sm:min-h-auto touch-manipulation flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4 sm:h-3 sm:w-3" />
                    </button>
                  </div>

                  {/* Mobile-optimized content */}
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 sm:line-clamp-3">
                    {enhancement.prompt}
                  </p>

                  {isSelected && (
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      ✓ Applied
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Click to apply • Ctrl+E to enhance • Ctrl+C to copy
            </div>
            <button
              onClick={() => {
                setEnhancements(null);
                setShowEnhancements(false);
                setSelectedEnhancement(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Selected Enhancement Indicator */}
      {selectedEnhancement && !showEnhancements && (
        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Using {selectedEnhancement.description.toLowerCase()}
            </span>
          </div>
          <button
            onClick={() => setShowEnhancements(true)}
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          >
            Show Options
          </button>
        </div>
      )}
    </div>
  );
};

export default AIPromptEnhancer;
