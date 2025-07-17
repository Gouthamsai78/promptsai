import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Mic, 
  Brain, 
  Sparkles, 
  MessageCircle,
  CheckCircle,
  Play
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isVisible,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AI Studio! 🎉',
      description: 'Transform your ideas into powerful AI prompts with our intelligent tools. Let\'s take a quick tour!',
      position: 'center',
      icon: <Sparkles className="w-6 h-6 text-purple-500" />
    },
    {
      id: 'voice-input',
      title: 'Voice Input Magic',
      description: 'Simply speak your ideas and watch them transform into professional prompts. Perfect for brainstorming on the go!',
      target: '[data-tour="voice-mode"]',
      position: 'bottom',
      icon: <Mic className="w-6 h-6 text-green-500" />,
      action: {
        label: 'Try Voice Input',
        onClick: () => {
          // Trigger voice mode selection
          const voiceButton = document.querySelector('[data-tour="voice-mode"]') as HTMLElement;
          voiceButton?.click();
        }
      }
    },
    {
      id: 'requirements-analysis',
      title: 'Smart Requirements Analysis',
      description: 'Our AI analyzes your description and generates multiple optimized prompt variations tailored to your needs.',
      target: '[data-tour="requirements-analyzer"]',
      position: 'top',
      icon: <Brain className="w-6 h-6 text-purple-500" />
    },
    {
      id: 'enhancement',
      title: 'AI Enhancement',
      description: 'Take your prompts to the next level with AI-powered enhancements, style variations, and professional formatting.',
      target: '[data-tour="ai-enhancer"]',
      position: 'top',
      icon: <Sparkles className="w-6 h-6 text-blue-500" />
    },
    {
      id: 'complete',
      title: 'You\'re All Set! ✨',
      description: 'Start creating amazing AI prompts! Remember, you can always access help and tips from the interface.',
      position: 'center',
      icon: <CheckCircle className="w-6 h-6 text-green-500" />
    }
  ];

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (isVisible && currentStepData.target) {
      highlightElement(currentStepData.target);
    }
    return () => {
      removeHighlight();
    };
  }, [currentStep, isVisible, currentStepData.target]);

  const highlightElement = (selector: string) => {
    removeHighlight();
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('onboarding-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const removeHighlight = () => {
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleComplete = () => {
    removeHighlight();
    onComplete();
  };

  const handleSkip = () => {
    removeHighlight();
    onSkip();
  };

  if (!isVisible) return null;

  const getTooltipPosition = () => {
    if (currentStepData.position === 'center') {
      return 'fixed inset-0 flex items-center justify-center z-50';
    }
    
    // For targeted tooltips, we'll position them dynamically
    return 'fixed z-50';
  };

  const getTooltipClasses = () => {
    const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm mx-4';
    
    if (currentStepData.position === 'center') {
      return `${baseClasses} w-full max-w-md`;
    }
    
    return baseClasses;
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip} />
      
      {/* Tooltip */}
      <div className={getTooltipPosition()}>
        <div className={`${getTooltipClasses()} ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} transition-all duration-150`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h3>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Action Button */}
          {currentStepData.action && (
            <div className="mb-4">
              <button
                onClick={currentStepData.action.onClick}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
              >
                <Play className="w-4 h-4" />
                <span>{currentStepData.action.label}</span>
              </button>
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-500'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
              
              <button
                onClick={nextStep}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Skip Option */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Skip tour
            </button>
          </div>
        </div>
      </div>

      {/* CSS for highlighting */}
      <style jsx>{`
        .onboarding-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
};

export default OnboardingTour;
