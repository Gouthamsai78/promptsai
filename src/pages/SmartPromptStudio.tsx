import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Sparkles, Share2, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import ResponsiveSmartPromptCreator from '../components/ResponsiveSmartPromptCreator';
import OnboardingTour from '../components/OnboardingTour';
import QuickAITest from '../components/QuickAITest';
import PageLayout from '../components/PageLayout';

const SmartPromptStudio: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { shouldShowTour, markTourCompleted, markAIStudioVisited, showTour } = useOnboarding();
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding should be shown on mount
  useEffect(() => {
    markAIStudioVisited();
    if (shouldShowTour()) {
      setShowOnboarding(true);
    }
  }, [shouldShowTour, markAIStudioVisited]);

  const handlePromptGenerated = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  const handlePromptChange = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  const handleCopyPrompt = async () => {
    if (currentPrompt.trim()) {
      try {
        await navigator.clipboard.writeText(currentPrompt);
        // You could add a toast notification here if desired
        console.log('✅ Prompt copied to clipboard');
      } catch (error) {
        console.error('❌ Failed to copy prompt:', error);
        // Fallback: select the text for manual copying
        const textArea = document.createElement('textarea');
        textArea.value = currentPrompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    markTourCompleted();
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    markTourCompleted();
  };

  const handleShowHelp = () => {
    setShowOnboarding(true);
  };



  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {/* Clean Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Help Button */}
              <button
                onClick={handleShowHelp}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                title="Show guided tour"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Help</span>
              </button>

              {/* Copy Prompt Button */}
              {currentPrompt.trim() && (
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Copy prompt to clipboard"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Copy Prompt</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                AI Studio
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Transform your ideas into powerful AI prompts with voice, analysis, and enhancement
            </p>
          </div>
        </div>

        {/* Quick Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Voice Input</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Speak naturally</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Smart Analysis</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">AI understands context</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Enhancement</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">Professional results</p>
              </div>
            </div>
          </div>
        </div>



        {/* Main Smart Prompt Creator */}
        <div data-tour="requirements-analyzer">
          <ResponsiveSmartPromptCreator
            onPromptGenerated={handlePromptGenerated}
            onPromptChange={handlePromptChange}
            className="w-full"
          />
        </div>

        {/* Current Prompt Display */}
        {currentPrompt.trim() && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Generated Prompt
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentPrompt.length} characters
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  title="Copy prompt to clipboard"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {currentPrompt}
              </pre>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your enhanced prompt is ready! Copy it above to use in your AI applications.
              </p>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Start Guide
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">1. Describe Your Idea</h4>
              <p>Tell us what you want your prompt to accomplish - be as detailed or brief as you like.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">2. Let AI Analyze</h4>
              <p>Our AI understands your requirements and generates multiple optimized variations.</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
              💡 <strong>Pro tip:</strong> Use voice input for faster idea capture, or try image analysis in the Chat section
            </p>
          </div>
        </div>

        {/* Onboarding Tour */}
        <OnboardingTour
          isVisible={showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </div>
    </PageLayout>
  );
};

export default SmartPromptStudio;
