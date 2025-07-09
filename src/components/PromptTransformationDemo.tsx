import React, { useState } from 'react';
import { Wand2, CheckCircle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { AIService } from '../services/ai';
import { PromptQualityValidator } from '../services/promptQualityValidator';
import { PromptTransformationResult } from '../types/ai';
import { debugLog } from '../utils/debug';

interface TransformationDemoProps {
  className?: string;
}

const PromptTransformationDemo: React.FC<TransformationDemoProps> = ({ className = '' }) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [transformation, setTransformation] = useState<PromptTransformationResult | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState('');

  // Example prompts for demonstration
  const examplePrompts = [
    "write a blog post about cats",
    "help me plan a vacation to Japan",
    "create a marketing strategy for my startup",
    "analyze my LinkedIn profile",
    "teach me data science",
    "improve my writing style"
  ];

  const handleTransform = async () => {
    if (!inputPrompt.trim()) {
      setError('Please enter a prompt to transform');
      return;
    }

    setIsTransforming(true);
    setError('');
    setTransformation(null);
    setValidation(null);

    try {
      debugLog('🚀 Starting prompt transformation demo:', inputPrompt);
      
      // Transform the prompt
      const result = AIService.transformPrompt(inputPrompt.trim());
      setTransformation(result);
      
      // Validate the transformation
      const validationResult = PromptQualityValidator.validatePrompt(result);
      setValidation(validationResult);
      
      debugLog('✅ Transformation demo completed:', {
        qualityScore: result.qualityScore,
        isValid: validationResult.isValid,
        overallScore: validationResult.overallScore
      });
      
    } catch (err: any) {
      debugLog('❌ Transformation demo failed:', err.message);
      setError(`Transformation failed: ${err.message}`);
    } finally {
      setIsTransforming(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInputPrompt(example);
    setTransformation(null);
    setValidation(null);
    setError('');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Prompt Transformation Engine
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Transform basic prompts into professional-grade, highly optimized meta-prompts
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Input Your Basic Prompt
        </h2>
        
        {/* Example Prompts */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea */}
        <textarea
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Enter your basic prompt here... (e.g., 'write a blog post about cats')"
          className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />

        {/* Transform Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleTransform}
            disabled={isTransforming || !inputPrompt.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Wand2 className={`h-5 w-5 ${isTransforming ? 'animate-spin' : ''}`} />
            <span>{isTransforming ? 'Transforming...' : 'Transform Prompt'}</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {transformation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transformed Prompt */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Transformed Meta-Prompt</span>
            </h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                {transformation.transformedPrompt}
              </pre>
            </div>

            {/* Transformation Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {transformation.qualityScore}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Quality Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {transformation.processingTime}ms
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Processing Time</div>
              </div>
            </div>

            {/* Applied Techniques */}
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Applied Techniques:</h3>
              <div className="flex flex-wrap gap-2">
                {transformation.appliedTechniques.map((technique, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded"
                  >
                    {technique}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quality Validation */}
          {validation && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>Quality Analysis</span>
              </h2>

              {/* Overall Status */}
              <div className={`p-4 rounded-lg mb-4 ${validation.isValid ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
                <div className="flex items-center space-x-2">
                  {validation.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className={`font-medium ${validation.isValid ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                    {validation.isValid ? 'Meets Professional Standards' : 'Needs Improvement'}
                  </span>
                  <span className="text-lg font-bold">
                    {validation.overallScore}/100
                  </span>
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="space-y-3 mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Quality Metrics:</h3>
                {Object.entries(validation.metrics).map(([metric, score]) => (
                  metric !== 'overallScore' && (
                    <div key={metric} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{score}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Issues */}
              {validation.issues.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Issues Found:</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {validation.issues.map((issue: any, index: number) => (
                      <div key={index} className={`p-2 rounded text-xs ${getSeverityColor(issue.severity)}`}>
                        <div className="font-medium">{issue.category}</div>
                        <div>{issue.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {validation.suggestions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Improvement Suggestions:</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {validation.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className={`p-2 rounded text-xs ${getPriorityColor(suggestion.priority)}`}>
                        <div className="font-medium">{suggestion.category}</div>
                        <div>{suggestion.suggestion}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How the Transformation Engine Works
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <strong>1. Analysis:</strong> The system analyzes your basic prompt to understand intent, domain, and complexity level.
              </p>
              <p>
                <strong>2. Transformation:</strong> It applies advanced prompt engineering techniques including role-based expertise, structured frameworks, and professional specifications.
              </p>
              <p>
                <strong>3. Validation:</strong> The transformed prompt is validated against professional standards for clarity, specificity, completeness, and actionability.
              </p>
              <p>
                <strong>4. Optimization:</strong> The system provides suggestions for further improvement based on quality metrics and best practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptTransformationDemo;
