import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  Users, 
  FileText, 
  Zap, 
  RefreshCw, 
  Copy, 
  Check,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  RequirementsAnalysisInput, 
  RequirementsAnalysisResult, 
  GeneratedPrompt,
  RequirementRefinement 
} from '../types/ai';
import { RequirementsAnalysisService } from '../services/requirementsAnalysis';
import { debugLog } from '../utils/debug';

interface RequirementsAnalyzerProps {
  onPromptGenerated?: (prompt: string) => void;
  onAnalysisComplete?: (analysis: RequirementsAnalysisResult) => void;
  className?: string;
  initialDescription?: string;
  voiceInputText?: string; // New prop for voice transcription
  onVoiceInputReceived?: (text: string) => void; // Callback when voice input is applied
}

const RequirementsAnalyzer: React.FC<RequirementsAnalyzerProps> = ({
  onPromptGenerated,
  onAnalysisComplete,
  className = '',
  initialDescription = '',
  voiceInputText = '',
  onVoiceInputReceived
}) => {
  const [description, setDescription] = useState(initialDescription);
  const [additionalContext, setAdditionalContext] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('');
  const [targetLength, setTargetLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [complexityLevel, setComplexityLevel] = useState<'basic' | 'intermediate' | 'advanced'>('intermediate');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RequirementsAnalysisResult | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<GeneratedPrompt | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceInputApplied, setVoiceInputApplied] = useState(false);

  // Ref to track previous voice input text
  const prevVoiceInputTextRef = useRef<string | undefined>(undefined);

  // Update description when voice input text changes
  useEffect(() => {
    const prevVoiceInputText = prevVoiceInputTextRef.current;

    console.log('🔍 REQUIREMENTS ANALYZER: voiceInputText prop changed:', {
      voiceInputText,
      prevVoiceInputText,
      hasText: !!voiceInputText,
      trimmedLength: voiceInputText?.trim().length || 0,
      currentDescription: description.substring(0, 50) + '...',
      isNewVoiceInput: voiceInputText !== prevVoiceInputText
    });

    debugLog('🔍 RequirementsAnalyzer voiceInputText changed:', {
      voiceInputText,
      prevVoiceInputText,
      hasText: !!voiceInputText,
      trimmedLength: voiceInputText?.trim().length || 0,
      currentDescription: description.substring(0, 50) + '...',
      isNewVoiceInput: voiceInputText !== prevVoiceInputText
    });

    // Only process if this is a new voice input
    if (voiceInputText && voiceInputText.trim() && voiceInputText !== prevVoiceInputText) {
      const trimmedVoiceText = voiceInputText.trim();

      console.log('📝 REQUIREMENTS ANALYZER: Applying NEW voice input to textarea:', trimmedVoiceText);
      debugLog('📝 Applying NEW voice input to requirements field:', {
        voiceText: trimmedVoiceText.substring(0, 100) + '...',
        currentDescription: description.substring(0, 50) + '...'
      });

      // Force update the description
      setDescription(trimmedVoiceText);

      // Show visual feedback
      setVoiceInputApplied(true);
      setTimeout(() => setVoiceInputApplied(false), 3000);

      // Call the callback to notify parent component
      if (onVoiceInputReceived) {
        onVoiceInputReceived(trimmedVoiceText);
      }

      // Update the ref to track this voice input
      prevVoiceInputTextRef.current = voiceInputText;

      console.log('✅ REQUIREMENTS ANALYZER: Voice input applied successfully');
    } else if (voiceInputText && voiceInputText.trim() && voiceInputText === prevVoiceInputText) {
      console.log('⚠️ REQUIREMENTS ANALYZER: Voice input unchanged, skipping update');
    } else if (!voiceInputText || !voiceInputText.trim()) {
      console.log('⚠️ REQUIREMENTS ANALYZER: Empty voice input, skipping update');
    }
  }, [voiceInputText]); // Only depend on voiceInputText

  // Validation
  const isValidInput = description.trim().length >= 10;
  const characterCount = description.length;
  const maxCharacters = 2000;

  const handleAnalyze = async () => {
    if (!isValidInput) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const input: RequirementsAnalysisInput = {
        naturalLanguageDescription: description.trim(),
        additionalContext: additionalContext.trim() || undefined,
        preferredStyle: preferredStyle.trim() || undefined,
        targetLength,
        complexityLevel
      };

      debugLog('🔍 Starting requirements analysis:', input);
      const result = await RequirementsAnalysisService.analyzeRequirements(input);
      
      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      debugLog('✅ Requirements analysis completed:', result);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze requirements';
      setError(errorMessage);
      debugLog('❌ Requirements analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePromptSelect = (prompt: GeneratedPrompt) => {
    setSelectedPrompt(prompt);
    if (onPromptGenerated) {
      onPromptGenerated(prompt.prompt);
    }
  };

  const handleCopyPrompt = async (prompt: GeneratedPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopiedPromptId(prompt.id);
      setTimeout(() => setCopiedPromptId(null), 2000);
    } catch (err) {
      debugLog('❌ Failed to copy prompt:', err);
    }
  };

  const togglePromptExpansion = (promptId: string) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(promptId)) {
      newExpanded.delete(promptId);
    } else {
      newExpanded.add(promptId);
    }
    setExpandedPrompts(newExpanded);
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
          <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Intelligent Requirements Analysis
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Describe what you want your prompt to accomplish, and I'll generate comprehensive prompts for you
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4">
        {/* Main Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Describe your prompt requirements
            </label>
            <div className="flex items-center space-x-2">
              {voiceInputApplied && (
                <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Voice input applied!</span>
                </div>
              )}

              {/* Debug Test Button - Remove in production */}
              {import.meta.env.DEV && (
                <button
                  onClick={() => {
                    const testText = "This is a test voice input to verify the data flow is working correctly.";
                    console.log('🧪 TEST: Simulating voice input:', testText);
                    setDescription(testText);
                    setVoiceInputApplied(true);
                    setTimeout(() => setVoiceInputApplied(false), 3000);
                    if (onVoiceInputReceived) {
                      onVoiceInputReceived(testText);
                    }
                  }}
                  className="text-xs px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                  title="Test voice input functionality"
                >
                  Test Voice Input
                </button>
              )}
            </div>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., I need a prompt that will help me write professional emails with a friendly tone for customer support..."
            className={`w-full h-32 px-4 py-3 border rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent
                     resize-none transition-all duration-300 ${
                       voiceInputApplied
                         ? 'border-green-400 dark:border-green-500 ring-2 ring-green-200 dark:ring-green-800'
                         : 'border-gray-300 dark:border-gray-600'
                     }`}
            maxLength={maxCharacters}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${characterCount > maxCharacters * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
              {characterCount}/{maxCharacters} characters
            </span>
            {!isValidInput && description.length > 0 && (
              <span className="text-xs text-red-500">
                Minimum 10 characters required
              </span>
            )}
          </div>
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Context
            </label>
            <input
              type="text"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Optional context..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Style
            </label>
            <input
              type="text"
              value={preferredStyle}
              onChange={(e) => setPreferredStyle(e.target.value)}
              placeholder="e.g., formal, casual..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Length
            </label>
            <select
              value={targetLength}
              onChange={(e) => setTargetLength(e.target.value as 'short' | 'medium' | 'long')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Complexity Level
            </label>
            <select
              value={complexityLevel}
              onChange={(e) => setComplexityLevel(e.target.value as 'basic' | 'intermediate' | 'advanced')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!isValidInput || isAnalyzing}
          className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400
                   text-white font-medium rounded-lg transition-colors
                   flex items-center justify-center space-x-2"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analyzing Requirements...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Analyze & Generate Prompts</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Analysis Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Analysis Summary</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Use Case</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.identifiedUseCase}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Audience</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.targetAudience}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Format</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.desiredOutputFormat}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.confidence}%</p>
              </div>
            </div>
          </div>

          {/* Generated Prompts */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Generated Prompts ({analysis.generatedPrompts.length})</span>
            </h4>

            {analysis.generatedPrompts.map((prompt, index) => (
              <div
                key={prompt.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200 ${
                  selectedPrompt?.id === prompt.id
                    ? 'border-purple-500 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="p-6">
                  {/* Prompt Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {prompt.title}
                        </h5>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getQualityColor(prompt.qualityScore)} bg-opacity-10`}>
                            {getQualityBadge(prompt.qualityScore)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {prompt.qualityScore}/100
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {prompt.explanation}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {prompt.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleCopyPrompt(prompt)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Copy prompt"
                      >
                        {copiedPromptId === prompt.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => togglePromptExpansion(prompt.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {expandedPrompts.has(prompt.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Prompt Preview */}
                  <div className="mb-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {expandedPrompts.has(prompt.id)
                          ? prompt.prompt
                          : `${prompt.prompt.substring(0, 200)}${prompt.prompt.length > 200 ? '...' : ''}`
                        }
                      </pre>
                    </div>
                  </div>

                  {/* Addressed Requirements */}
                  {expandedPrompts.has(prompt.id) && (
                    <div className="space-y-3">
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Addressed Requirements:
                        </h6>
                        <div className="flex flex-wrap gap-2">
                          {prompt.addressedRequirements.map((reqId, reqIndex) => {
                            const requirement = analysis.parsedRequirements.find(r => r.id === reqId);
                            return requirement ? (
                              <span
                                key={reqIndex}
                                className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full"
                              >
                                {requirement.description}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>

                      {prompt.suggestedImprovements && prompt.suggestedImprovements.length > 0 && (
                        <div>
                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Suggested Improvements:
                          </h6>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {prompt.suggestedImprovements.map((improvement, impIndex) => (
                              <li key={impIndex} className="flex items-start space-x-2">
                                <span className="text-yellow-500 mt-1">•</span>
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Effectiveness: {prompt.estimatedEffectiveness}%</span>
                      <span>•</span>
                      <span>Quality: {prompt.qualityScore}/100</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePromptSelect(prompt)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedPrompt?.id === prompt.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40'
                        }`}
                      >
                        {selectedPrompt?.id === prompt.id ? 'Selected' : 'Use This Prompt'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Requirements Details */}
          {analysis.parsedRequirements.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Parsed Requirements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.parsedRequirements.map((requirement, index) => (
                  <div
                    key={requirement.id}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {requirement.description}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        requirement.priority === 'high'
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : requirement.priority === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      }`}>
                        {requirement.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {requirement.value}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                      {requirement.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequirementsAnalyzer;
