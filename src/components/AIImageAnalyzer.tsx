import React, { useState, useEffect } from 'react';
import { Eye, Sparkles, Copy, Loader, Tag, Camera, Palette, Film, Monitor } from 'lucide-react';
import { AIService } from '../services/ai';
import { ImageAnalysisResult, EnhancedPrompt } from '../types/ai';
import { debugLog } from '../utils/debug';

interface AIImageAnalyzerProps {
  files: File[];
  onPromptsGenerated?: (prompts: EnhancedPrompt[]) => void;
  onTagsGenerated?: (tags: string[]) => void;
  onTitleGenerated?: (title: string) => void;
  onDescriptionGenerated?: (description: string) => void;
  className?: string;
}

const AIImageAnalyzer: React.FC<AIImageAnalyzerProps> = ({
  files,
  onPromptsGenerated,
  onTagsGenerated,
  onTitleGenerated,
  onDescriptionGenerated,
  className = ''
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedPrompt, setSelectedPrompt] = useState<EnhancedPrompt | null>(null);

  // Style icons mapping
  const styleIcons = {
    photographic: Camera,
    artistic: Palette,
    cinematic: Film,
    digital_art: Monitor
  };

  // Analyze images when files change
  useEffect(() => {
    if (files.length > 0 && AIService.isAIAvailable()) {
      analyzeImage(files[0]); // Analyze first image
    } else {
      setAnalysis(null);
      setError('');
    }
  }, [files]);

  const analyzeImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysis(null);

    try {
      debugLog('🖼️ Analyzing image:', file.name);
      const result = await AIService.analyzeImage(file);
      setAnalysis(result);
      
      // Auto-apply generated content
      if (onTagsGenerated && result.suggestedTags) {
        onTagsGenerated(result.suggestedTags);
      }
      
      if (onPromptsGenerated && result.enhancedPrompts) {
        onPromptsGenerated(result.enhancedPrompts);
      }

      debugLog('✅ Image analysis complete');
    } catch (error: any) {
      debugLog('❌ Image analysis failed:', error.message);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply prompt
  const applyPrompt = (prompt: EnhancedPrompt) => {
    setSelectedPrompt(prompt);
    onPromptsGenerated?.([prompt]);
    debugLog('✨ Applied AI-generated prompt:', prompt.style);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      debugLog('📋 Copied to clipboard');
    } catch (error) {
      debugLog('❌ Failed to copy to clipboard:', error);
    }
  };

  // Generate title and description from selected prompt
  const generateMetadata = async (prompt: string) => {
    try {
      const metadata = await AIService.generateContentMetadata(prompt);
      onTitleGenerated?.(metadata.title);
      onDescriptionGenerated?.(metadata.description);
      debugLog('✅ Generated metadata from prompt');
    } catch (error: any) {
      debugLog('❌ Failed to generate metadata:', error.message);
    }
  };

  if (!AIService.isAIAvailable()) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-300">
          <Eye className="h-4 w-4" />
          <span className="text-sm">AI image analysis unavailable - add OpenRouter API key to enable</span>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload an image to get AI-generated prompts and tags
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Analysis Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse text-blue-500' : 'text-gray-400'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isAnalyzing ? 'Analyzing image...' : 'AI Image Analysis'}
          </span>
        </div>
        
        {files.length > 0 && !isAnalyzing && (
          <button
            onClick={() => analyzeImage(files[0])}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            <span>Re-analyze</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Loader className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          <span className="text-blue-700 dark:text-blue-300">Analyzing image and generating prompts...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isAnalyzing && (
        <div className="space-y-4">
          {/* Image Analysis */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Comprehensive Image Analysis
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Description:</span>
                <p className="text-gray-700 dark:text-gray-300 mt-1">{analysis.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Style:</span>
                  <span className="ml-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    {analysis.detectedStyle}
                  </span>
                </div>

                {analysis.textElements && analysis.textElements !== 'none detected' && (
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Text Found:</span>
                    <span className="ml-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                      {analysis.textElements}
                    </span>
                  </div>
                )}

                {analysis.colorPalette && (
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Colors:</span>
                    <span className="ml-1 text-gray-700 dark:text-gray-300">{analysis.colorPalette}</span>
                  </div>
                )}

                {analysis.lightingAnalysis && (
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Lighting:</span>
                    <span className="ml-1 text-gray-700 dark:text-gray-300">{analysis.lightingAnalysis}</span>
                  </div>
                )}

                {analysis.compositionNotes && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-900 dark:text-white">Composition:</span>
                    <span className="ml-1 text-gray-700 dark:text-gray-300">{analysis.compositionNotes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suggested Tags */}
          {analysis.suggestedTags && analysis.suggestedTags.length > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Suggested Tags
                </h4>
                <button
                  onClick={() => copyToClipboard(analysis.suggestedTags.join(', '))}
                  className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                  title="Copy tags"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {analysis.suggestedTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Prompts */}
          {analysis.enhancedPrompts && analysis.enhancedPrompts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                AI-Generated Prompts
              </h4>
              
              <div className="grid gap-3">
                {analysis.enhancedPrompts.map((prompt) => {
                  const IconComponent = styleIcons[prompt.style];
                  const isSelected = selectedPrompt?.id === prompt.id;
                  
                  return (
                    <div
                      key={prompt.id}
                      className={`p-3 border rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                      onClick={() => applyPrompt(prompt)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {prompt.description}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateMetadata(prompt.prompt);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            title="Generate title & description"
                          >
                            <Sparkles className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(prompt.prompt);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {prompt.prompt}
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
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Click prompt to apply • Sparkle icon to generate metadata
            </div>
            <button
              onClick={() => {
                setAnalysis(null);
                setSelectedPrompt(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIImageAnalyzer;
