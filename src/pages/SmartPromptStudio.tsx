import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Save, Share2, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveSmartPromptCreator from '../components/ResponsiveSmartPromptCreator';
import QuickAITest from '../components/QuickAITest';
import PageLayout from '../components/PageLayout';

const SmartPromptStudio: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handlePromptGenerated = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  const handlePromptChange = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  const handleSaveToCreate = () => {
    if (currentPrompt.trim()) {
      // Navigate to create page with the generated prompt
      navigate('/create', { 
        state: { 
          generatedPrompt: currentPrompt,
          fromSmartStudio: true 
        } 
      });
    }
  };

  const handleSharePrompt = async () => {
    if (currentPrompt.trim()) {
      try {
        await navigator.clipboard.writeText(currentPrompt);
        // You could add a toast notification here
        console.log('Prompt copied to clipboard');
      } catch (error) {
        console.error('Failed to copy prompt:', error);
      }
    }
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            {/* Action Buttons */}
            {currentPrompt.trim() && (
              <div className="flex items-center space-x-2 md:space-x-3">
                <button
                  onClick={handleSharePrompt}
                  className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors text-sm md:text-base"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy</span>
                </button>

                <button
                  onClick={handleSaveToCreate}
                  disabled={isSaving}
                  className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Use in Post</span>
                </button>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 md:space-x-3 mb-3 md:mb-4">
              <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                Smart Prompt Studio
              </h1>
            </div>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto px-4">
              Create powerful AI prompts using voice input, intelligent requirements analysis, and advanced AI enhancement
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 px-4 md:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Voice-to-Text</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Speak your ideas naturally and watch them transform into professional prompts
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Image Analysis</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload images to generate recreation prompts with detailed style analysis
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Smart Analysis</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI analyzes your requirements and generates multiple optimized prompt variations
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Enhancement</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Transform basic ideas into professional-grade prompts with style variations
            </p>
          </div>
        </div>

        {/* Image Analysis Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Camera className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Image-to-Prompt Generator
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload an image to generate professional recreation prompts with detailed style analysis. Perfect for recreating artwork, photos, or designs.
          </p>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                // Navigate to Chat page for image analysis
                window.location.href = '/chat';
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Analyze Image</span>
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Supports JPG, PNG, WebP • Max 10MB
            </span>
          </div>
        </div>

        {/* Main Smart Prompt Creator */}
        <ResponsiveSmartPromptCreator
          onPromptGenerated={handlePromptGenerated}
          onPromptChange={handlePromptChange}
          className="w-full"
        />

        {/* Current Prompt Display */}
        {currentPrompt.trim() && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Generated Prompt
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentPrompt.length} characters
                </span>
                <button
                  onClick={handleSharePrompt}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {currentPrompt}
              </pre>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ready to use this prompt in a post?
              </p>
              <button
                onClick={handleSaveToCreate}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Create Post</span>
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💡 How to Use Smart Prompt Studio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Text Mode</h4>
              <ul className="space-y-1">
                <li>• Describe what you want your prompt to accomplish</li>
                <li>• AI analyzes your requirements automatically</li>
                <li>• Choose from multiple generated prompt variations</li>
                <li>• Enhance further with AI style improvements</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Voice Mode</h4>
              <ul className="space-y-1">
                <li>• Click record and speak your prompt ideas</li>
                <li>• Real-time transcription with high accuracy</li>
                <li>• Automatic requirements analysis from speech</li>
                <li>• Multi-language support available</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Keyboard shortcuts:</strong> Ctrl+R to start/stop recording • Ctrl+A to analyze requirements • Ctrl+E to enhance prompts
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SmartPromptStudio;
