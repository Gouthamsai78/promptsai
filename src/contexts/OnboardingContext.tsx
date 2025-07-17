import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { debugLog } from '../utils/debug';

interface OnboardingState {
  hasCompletedTour: boolean;
  hasSeenAIStudio: boolean;
  hasUsedVoiceInput: boolean;
  hasGeneratedPrompt: boolean;
  lastTourVersion: string;
}

interface OnboardingContextType {
  state: OnboardingState;
  shouldShowTour: () => boolean;
  markTourCompleted: () => void;
  markAIStudioVisited: () => void;
  markVoiceInputUsed: () => void;
  markPromptGenerated: () => void;
  resetOnboarding: () => void;
  showTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'promptshare_onboarding';
const CURRENT_TOUR_VERSION = '1.0.0';

const defaultState: OnboardingState = {
  hasCompletedTour: false,
  hasSeenAIStudio: false,
  hasUsedVoiceInput: false,
  hasGeneratedPrompt: false,
  lastTourVersion: ''
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [forceShowTour, setForceShowTour] = useState(false);

  // Load onboarding state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        setState(parsedState);
        debugLog('📚 Onboarding state loaded:', parsedState);
      } else {
        debugLog('📚 No previous onboarding state found, using defaults');
      }
    } catch (error) {
      debugLog('❌ Failed to load onboarding state:', error);
      setState(defaultState);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      debugLog('💾 Onboarding state saved:', state);
    } catch (error) {
      debugLog('❌ Failed to save onboarding state:', error);
    }
  }, [state]);

  const shouldShowTour = (): boolean => {
    // Force show if explicitly requested
    if (forceShowTour) {
      return true;
    }

    // Show if user hasn't completed tour
    if (!state.hasCompletedTour) {
      return true;
    }

    // Show if tour version has been updated
    if (state.lastTourVersion !== CURRENT_TOUR_VERSION) {
      return true;
    }

    // Show if user is new to AI Studio
    if (!state.hasSeenAIStudio) {
      return true;
    }

    return false;
  };

  const markTourCompleted = () => {
    setState(prev => ({
      ...prev,
      hasCompletedTour: true,
      hasSeenAIStudio: true,
      lastTourVersion: CURRENT_TOUR_VERSION
    }));
    setForceShowTour(false);
    debugLog('✅ Onboarding tour marked as completed');
  };

  const markAIStudioVisited = () => {
    setState(prev => ({
      ...prev,
      hasSeenAIStudio: true
    }));
    debugLog('👁️ AI Studio visit recorded');
  };

  const markVoiceInputUsed = () => {
    setState(prev => ({
      ...prev,
      hasUsedVoiceInput: true
    }));
    debugLog('🎤 Voice input usage recorded');
  };

  const markPromptGenerated = () => {
    setState(prev => ({
      ...prev,
      hasGeneratedPrompt: true
    }));
    debugLog('✨ Prompt generation recorded');
  };

  const resetOnboarding = () => {
    setState(defaultState);
    setForceShowTour(false);
    debugLog('🔄 Onboarding state reset');
  };

  const showTour = () => {
    setForceShowTour(true);
    debugLog('🎯 Tour manually triggered');
  };

  const contextValue: OnboardingContextType = {
    state,
    shouldShowTour,
    markTourCompleted,
    markAIStudioVisited,
    markVoiceInputUsed,
    markPromptGenerated,
    resetOnboarding,
    showTour
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

// Hook for checking if user is new
export const useIsNewUser = (): boolean => {
  const { state } = useOnboarding();
  return !state.hasCompletedTour && !state.hasSeenAIStudio;
};

// Hook for getting onboarding progress
export const useOnboardingProgress = (): {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
} => {
  const { state } = useOnboarding();
  
  const steps = [
    state.hasSeenAIStudio,
    state.hasUsedVoiceInput,
    state.hasGeneratedPrompt,
    state.hasCompletedTour
  ];
  
  const completedSteps = steps.filter(Boolean).length;
  const totalSteps = steps.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  
  return {
    completedSteps,
    totalSteps,
    percentage
  };
};

export default OnboardingContext;
