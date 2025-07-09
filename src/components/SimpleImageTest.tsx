import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, Loader } from 'lucide-react';
import { AIService } from '../services/ai';
import { debugLog } from '../utils/debug';

const SimpleImageTest: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResult(null);
      setError('');
    } else {
      setError('Please select an image file');
    }
  };

  const runImageAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setResult(null);
    setError('');

    try {
      debugLog('🧪 SIMPLE TEST: Starting image analysis...');
      
      // Test AI availability first
      const aiAvailable = AIService.isAIAvailable();
      debugLog('🔍 AI Available:', aiAvailable);

      // Run the analysis
      const analysis = await AIService.analyzeImage(selectedFile);
      
      debugLog('✅ SIMPLE TEST: Analysis completed:', {
        hasDescription: !!analysis.description,
        hasDetectedStyle: !!analysis.detectedStyle,
        hasEnhancedPrompts: !!analysis.enhancedPrompts,
        promptCount: analysis.enhancedPrompts?.length || 0
      });

      setResult(analysis);

    } catch (error: any) {
      debugLog('❌ SIMPLE TEST: Analysis failed:', error.message);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Simple Image Analysis Test
      </h2>
      
      {/* File Upload */}
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {selectedFile && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Test Button */}
      {selectedFile && (
        <button
          onClick={runImageAnalysis}
          disabled={isAnalyzing}
          className="w-full mb-4 inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Test Image Analysis
            </>
          )}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results</h3>
          </div>

          {/* Basic Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Basic Analysis</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Description:</strong> {result.description}</div>
              <div><strong>Detected Style:</strong> {result.detectedStyle}</div>
              <div><strong>Tags:</strong> {result.suggestedTags?.join(', ') || 'None'}</div>
              {result.textElements && <div><strong>Text Elements:</strong> {result.textElements}</div>}
              {result.colorPalette && <div><strong>Color Palette:</strong> {result.colorPalette}</div>}
              {result.lightingAnalysis && <div><strong>Lighting:</strong> {result.lightingAnalysis}</div>}
            </div>
          </div>

          {/* Enhanced Prompts */}
          {result.enhancedPrompts && result.enhancedPrompts.length > 0 ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">
                ✅ Enhanced Prompts ({result.enhancedPrompts.length})
              </h4>
              <div className="space-y-3">
                {result.enhancedPrompts.map((prompt: any, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {prompt.style} ({prompt.id})
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {prompt.prompt?.length || 0} chars
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                      <strong>Description:</strong> {prompt.description}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                      <strong>Prompt:</strong> {prompt.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                ❌ No Enhanced Prompts Found
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                The analysis completed but did not generate the expected 4 enhanced prompts.
              </p>
            </div>
          )}

          {/* Raw Result for Debugging */}
          <details className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Raw Result (Debug)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default SimpleImageTest;
