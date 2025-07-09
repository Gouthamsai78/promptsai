import React, { useState } from 'react';
import { Sparkles, TestTube, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { AIService } from '../services/ai';
import { EnhancedPrompt } from '../types/ai';
import { debugLog } from '../utils/debug';

interface TestResult {
  prompt: string;
  category: string;
  isImagePrompt: boolean;
  enhancedCount: number;
  styles: string[];
  success: boolean;
  error?: string;
  processingTime: number;
}

const Test4StyleEnhancement: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<EnhancedPrompt[]>([]);

  const testPrompts = [
    'a beautiful cat sitting in a garden',
    'professional photo of a sunset over mountains',
    'digital art of a futuristic city',
    'portrait of a woman with long hair',
    'cinematic shot of a car driving through rain',
    'explain how to cook pasta', // This should NOT get 4 styles
    'hello how are you today' // This should NOT get 4 styles
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setSelectedPrompts([]);

    const results: TestResult[] = [];

    for (const prompt of testPrompts) {
      try {
        debugLog(`🧪 Testing prompt: "${prompt}"`);
        
        const startTime = Date.now();
        
        // Test category detection
        const isImagePrompt = AIService.isImageGenerationPrompt(prompt);
        const category = isImagePrompt ? 'image_generation' : 'text_ai';
        
        // Test enhancement
        const enhancement = await AIService.enhancePrompt(prompt, true);
        
        const processingTime = Date.now() - startTime;
        
        const result: TestResult = {
          prompt,
          category,
          isImagePrompt,
          enhancedCount: enhancement.enhanced.length,
          styles: enhancement.enhanced.map(e => e.style),
          success: isImagePrompt ? enhancement.enhanced.length === 4 : enhancement.enhanced.length === 1,
          processingTime
        };
        
        results.push(result);
        
        // If this is an image prompt with 4 styles, save the enhanced prompts
        if (isImagePrompt && enhancement.enhanced.length === 4) {
          setSelectedPrompts(prev => [...prev, ...enhancement.enhanced]);
        }
        
        debugLog(`✅ Test result:`, result);
        
      } catch (error: any) {
        const result: TestResult = {
          prompt,
          category: 'error',
          isImagePrompt: false,
          enhancedCount: 0,
          styles: [],
          success: false,
          error: error.message,
          processingTime: 0
        };
        
        results.push(result);
        debugLog(`❌ Test failed:`, error.message);
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      debugLog('📋 Copied to clipboard');
    } catch (error) {
      debugLog('❌ Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <TestTube className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            4-Style Enhancement Test
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This test verifies that image generation prompts receive 4 style variants 
            (photographic, artistic, cinematic, digital_art) while other prompts receive 1 enhancement.
          </p>
          
          <button
            onClick={runTests}
            disabled={isRunning}
            className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isRunning ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Run Tests
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Test Results</h3>
            
            <div className="grid gap-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.success
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {result.success ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div><strong>Prompt:</strong> "{result.prompt}"</div>
                        <div><strong>Category:</strong> {result.category}</div>
                        <div><strong>Is Image Prompt:</strong> {result.isImagePrompt ? 'Yes' : 'No'}</div>
                        <div><strong>Enhanced Count:</strong> {result.enhancedCount}</div>
                        <div><strong>Styles:</strong> {result.styles.join(', ')}</div>
                        <div><strong>Processing Time:</strong> {result.processingTime}ms</div>
                        {result.error && (
                          <div className="text-red-600 dark:text-red-400">
                            <strong>Error:</strong> {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Prompts Display */}
        {selectedPrompts.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sample Enhanced Prompts ({selectedPrompts.length})
            </h3>
            
            <div className="grid gap-4">
              {selectedPrompts.slice(0, 8).map((prompt, index) => (
                <div
                  key={prompt.id}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {prompt.style}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {prompt.description}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(prompt.prompt)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md p-3 font-mono leading-relaxed">
                    {prompt.prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Test4StyleEnhancement;
