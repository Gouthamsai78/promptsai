import React, { useState, useEffect } from 'react';
import {
  Brain,
  Mic,
  Type,
  Zap,
  ArrowRight,
  Sparkles,
  MessageSquare,
  FileText,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  SmartPromptCreationState,
  VoiceToRequirementsResult,
  RequirementsAnalysisInput,
  VoiceTranscriptionResult,
  VoiceSession
} from '../types/ai';
import RequirementsAnalyzer from './RequirementsAnalyzer';
import VoiceRecorder from './VoiceRecorder';
import AIPromptEnhancer from './AIPromptEnhancer';
import { RequirementsAnalysisService } from '../services/requirementsAnalysis';
import { VoiceRecognitionService } from '../services/voiceRecognition';
import { debugLog } from '../utils/debug';

interface SmartPromptCreatorProps {
  onPromptGenerated?: (prompt: string) => void;
  onPromptChange?: (prompt: string) => void;
  initialPrompt?: string;
  className?: string;
  showModeToggle?: boolean;
}

const SmartPromptCreator: React.FC<SmartPromptCreatorProps> = ({
  onPromptGenerated,
  onPromptChange,
  initialPrompt = '',
  className = '',
  showModeToggle = true
}) => {
  const [state, setState] = useState<SmartPromptCreationState>({
    mode: 'text',
    voiceState: {
      isRecording: false,
      isProcessing: false,
      isPaused: false,
      duration: 0,
      volume: 0
    },
    transcriptionState: {
      isTranscribing: false,
      currentText: '',
      finalText: '',
    },
    requirementsState: {
      isAnalyzing: false,
      hasAnalysis: false,
    },
    generationState: {
      isGenerating: false,
      hasPrompts: false,
      prompts: [],
    }
  });

  const [currentPrompt, setCurrentPrompt] = useState(initialPrompt);
  const [voiceCapabilities, setVoiceCapabilities] = useState(VoiceRecognitionService.getCapabilities());

  useEffect(() => {
    if (onPromptChange) {
      onPromptChange(currentPrompt);
    }
  }, [currentPrompt, onPromptChange]);

  const handleModeChange = (newMode: 'text' | 'voice' | 'hybrid') => {
    setState(prev => ({
      ...prev,
      mode: newMode
    }));
    debugLog('🔄 Mode changed to:', newMode);
  };

  const handleVoiceTranscription = async (result: VoiceTranscriptionResult) => {
    setState(prev => ({
      ...prev,
      transcriptionState: {
        ...prev.transcriptionState,
        currentText: result.text,
        finalText: result.isFinal ? prev.transcriptionState.finalText + result.text + ' ' : prev.transcriptionState.finalText
      }
    }));

    // If this is a final result and we have enough text, trigger requirements analysis
    if (result.isFinal && result.text.trim().length > 10) {
      await analyzeVoiceRequirements(result.text);
    }
  };

  const handleVoiceSessionComplete = async (session: VoiceSession) => {
    const finalText = VoiceRecognitionService.formatTranscriptionForPrompt(session.finalText);
    
    setState(prev => ({
      ...prev,
      transcriptionState: {
        ...prev.transcriptionState,
        finalText: finalText
      }
    }));

    // Analyze the complete transcription
    if (finalText.trim().length > 10) {
      await analyzeVoiceRequirements(finalText);
    }
  };

  const analyzeVoiceRequirements = async (text: string) => {
    setState(prev => ({
      ...prev,
      requirementsState: {
        ...prev.requirementsState,
        isAnalyzing: true,
        error: undefined
      }
    }));

    try {
      const input: RequirementsAnalysisInput = {
        naturalLanguageDescription: text,
        complexityLevel: 'intermediate'
      };

      const analysis = await RequirementsAnalysisService.analyzeRequirements(input);
      
      setState(prev => ({
        ...prev,
        requirementsState: {
          ...prev.requirementsState,
          isAnalyzing: false,
          hasAnalysis: true,
          analysis
        }
      }));

      debugLog('✅ Voice requirements analysis completed:', analysis);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        requirementsState: {
          ...prev.requirementsState,
          isAnalyzing: false,
          error: error.message || 'Failed to analyze voice requirements'
        }
      }));
      debugLog('❌ Voice requirements analysis failed:', error);
    }
  };

  const handleRequirementsAnalysisComplete = (analysis: any) => {
    setState(prev => ({
      ...prev,
      requirementsState: {
        ...prev.requirementsState,
        hasAnalysis: true,
        analysis
      }
    }));
  };

  const handlePromptGenerated = (prompt: string) => {
    setCurrentPrompt(prompt);
    if (onPromptGenerated) {
      onPromptGenerated(prompt);
    }
  };

  const handleEnhancementSelect = (enhancedPrompt: any) => {
    setCurrentPrompt(enhancedPrompt.prompt);
    if (onPromptGenerated) {
      onPromptGenerated(enhancedPrompt.prompt);
    }
  };

  const renderModeToggle = () => {
    if (!showModeToggle) return null;

    return (
      <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-6 px-2">
        <button
          onClick={() => handleModeChange('text')}
          className={`flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
            state.mode === 'text'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Type className="w-4 h-4" />
          <span className="hidden sm:inline md:inline">Text Input</span>
          <span className="sm:hidden">Text</span>
        </button>

        <button
          onClick={() => handleModeChange('voice')}
          disabled={!voiceCapabilities.isSupported}
          className={`flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
            state.mode === 'voice'
              ? 'bg-green-500 text-white'
              : voiceCapabilities.isSupported
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          title={!voiceCapabilities.isSupported ? 'Voice recording not supported in this browser' : 'Switch to voice input mode'}
        >
          <Mic className="w-4 h-4" />
          <span className="hidden sm:inline md:inline">Voice Input</span>
          <span className="sm:hidden">Voice</span>
        </button>

        <button
          onClick={() => handleModeChange('hybrid')}
          disabled={!voiceCapabilities.isSupported}
          className={`flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
            state.mode === 'hybrid'
              ? 'bg-purple-500 text-white'
              : voiceCapabilities.isSupported
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          title={!voiceCapabilities.isSupported ? 'Voice recording not supported in this browser' : 'Switch to smart mode (voice + text analysis)'}
        >
          <Brain className="w-4 h-4" />
          <span className="hidden sm:inline md:inline">Smart Mode</span>
          <span className="sm:hidden">Smart</span>
        </button>
      </div>
    );
  };

  const renderTextMode = () => (
    <div className="space-y-6">
      {/* Quick Voice Recording Option */}
      {voiceCapabilities.isSupported && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mic className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">Quick Voice Input</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Prefer speaking? Switch to Voice Mode for full voice-to-prompt workflow
                </p>
              </div>
            </div>
            <button
              onClick={() => handleModeChange('voice')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Mic className="w-4 h-4" />
              <span>Use Voice</span>
            </button>
          </div>
        </div>
      )}

      <RequirementsAnalyzer
        onPromptGenerated={handlePromptGenerated}
        onAnalysisComplete={handleRequirementsAnalysisComplete}
        className="w-full"
      />
      
      {currentPrompt && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <AIPromptEnhancer
            prompt={currentPrompt}
            onPromptChange={setCurrentPrompt}
            onEnhancementSelect={handleEnhancementSelect}
            disabled={false}
          />
        </div>
      )}
    </div>
  );

  const renderVoiceMode = () => (
    <div className="space-y-6">
      <VoiceRecorder
        onTranscriptionUpdate={handleVoiceTranscription}
        onSessionComplete={handleVoiceSessionComplete}
        onTextGenerated={handlePromptGenerated}
        onApplyToEnhancer={(text) => {
          // Apply transcribed text directly to prompt enhancer
          setCurrentPrompt(text);
          handlePromptGenerated(text);
        }}
        className="w-full"
        showApplyButton={true}
      />

      {state.requirementsState.hasAnalysis && state.requirementsState.analysis && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-700 dark:text-green-300">
                Voice Analysis Complete
              </span>
            </div>
            <p className="text-green-600 dark:text-green-400 text-sm">
              Generated {state.requirementsState.analysis.generatedPrompts.length} prompts from your voice input
            </p>
          </div>

          <RequirementsAnalyzer
            initialDescription={state.transcriptionState.finalText}
            onPromptGenerated={handlePromptGenerated}
            onAnalysisComplete={handleRequirementsAnalysisComplete}
            className="w-full"
          />
        </div>
      )}

      {currentPrompt && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <AIPromptEnhancer
            prompt={currentPrompt}
            onPromptChange={setCurrentPrompt}
            onEnhancementSelect={handleEnhancementSelect}
            disabled={false}
          />
        </div>
      )}
    </div>
  );

  const renderHybridMode = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Mic className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span>Voice Input</span>
          </h4>
          <VoiceRecorder
            onTranscriptionUpdate={handleVoiceTranscription}
            onSessionComplete={handleVoiceSessionComplete}
            onTextGenerated={(text) => {
              // In hybrid mode, voice text goes to requirements analyzer
              setState(prev => ({
                ...prev,
                transcriptionState: {
                  ...prev.transcriptionState,
                  finalText: text
                }
              }));
            }}
            onApplyToEnhancer={(text) => {
              // Apply transcribed text directly to prompt enhancer
              setCurrentPrompt(text);
              handlePromptGenerated(text);
            }}
            className="w-full"
            showSettings={false}
            showApplyButton={true}
          />
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Requirements Analysis</span>
          </h4>
          <RequirementsAnalyzer
            initialDescription={state.transcriptionState.finalText}
            onPromptGenerated={handlePromptGenerated}
            onAnalysisComplete={handleRequirementsAnalysisComplete}
            className="w-full"
          />
        </div>
      </div>

      {currentPrompt && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>AI Enhancement</span>
          </h4>
          <AIPromptEnhancer
            prompt={currentPrompt}
            onPromptChange={setCurrentPrompt}
            onEnhancementSelect={handleEnhancementSelect}
            disabled={false}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Smart Prompt Creator
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Create powerful prompts using voice input, intelligent requirements analysis, and AI enhancement
        </p>
      </div>

      {/* Mode Toggle */}
      {renderModeToggle()}

      {/* Content based on mode */}
      {state.mode === 'text' && renderTextMode()}
      {state.mode === 'voice' && renderVoiceMode()}
      {state.mode === 'hybrid' && renderHybridMode()}
    </div>
  );
};

export default SmartPromptCreator;
