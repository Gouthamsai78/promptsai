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
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 glass-panel border border-gray-200/50 dark:border-gray-700/50 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Help Button */}
              <button
                onClick={handleShowHelp}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 glass-panel border border-gray-200/50 dark:border-gray-700/50 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                title="Show guided tour"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Help</span>
              </button>

              {/* Copy Prompt Button */}
              {currentPrompt.trim() && (
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                  title="Copy prompt to clipboard"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Copy Prompt</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-center relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-64 h-64 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-3xl -z-10" />
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/20 animate-pulse-slow">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold font-outfit tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                AI Studio
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Transform your ideas into powerful AI prompts with <span className="text-blue-600 dark:text-blue-400 font-semibold">voice</span>, <span className="text-purple-600 dark:text-purple-400 font-semibold">analysis</span>, and <span className="text-indigo-600 dark:text-indigo-400 font-semibold">enhancement</span>.
            </p>
          </div>
        </div>

        {/* Quick Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card bg-teal-50/30 dark:bg-teal-900/10 rounded-2xl p-6 border border-teal-200/50 dark:border-teal-800/30 group hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-all duration-300">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit text-gray-900 dark:text-white">Voice Input</h3>
                <p className="text-sm text-teal-700/80 dark:text-teal-300/80 font-medium">Speak naturally</p>
              </div>
            </div>
          </div>

          <div className="glass-card bg-purple-50/30 dark:bg-purple-900/10 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-800/30 group hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-all duration-300">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit text-gray-900 dark:text-white">Smart Analysis</h3>
                <p className="text-sm text-purple-700/80 dark:text-purple-300/80 font-medium">AI understands context</p>
              </div>
            </div>
          </div>

          <div className="glass-card bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/30 group hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-300">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit text-gray-900 dark:text-white">Enhancement</h3>
                <p className="text-sm text-blue-700/80 dark:text-blue-300/80 font-medium">Professional results</p>
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
          <div className="mt-12 glass-card rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-2xl font-bold font-outfit text-gray-900 dark:text-white">
                Generated Prompt
              </h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-3 py-1 rounded-full">
                  {currentPrompt.length} characters
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Copy Final Prompt</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 group-hover:bg-white/80 dark:group-hover:bg-gray-900/80 transition-colors duration-500">
              <pre className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                {currentPrompt}
              </pre>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">
                ✨ Your enhanced prompt is ready! Use the button above to copy and start creating.
              </p>
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-12 glass bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-3xl p-8 border border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center space-x-3 mb-6">
            <div className="text-3xl p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">💡</div>
            <h3 className="text-2xl font-bold font-outfit text-gray-900 dark:text-white">
              Quick Start Guide
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-600 dark:text-gray-400">
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Describe Your Idea
              </h4>
              <p className="leading-relaxed">Tell us what you want your prompt to accomplish - be as detailed or brief as you like. We'll handle the nuances.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Let AI Analyze
              </h4>
              <p className="leading-relaxed">Our AI understands your core requirements and generates multiple optimized variations with professional framing.</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-blue-200/50 dark:border-blue-800/50">
            <p className="text-sm font-medium text-blue-700/80 dark:text-blue-300 text-center">
              💡 <strong className="text-blue-800 dark:text-blue-200">Pro tip:</strong> Use voice input for faster idea capture, or try image analysis in the AI Chat section.
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
