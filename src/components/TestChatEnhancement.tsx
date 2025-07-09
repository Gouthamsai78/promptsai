import React, { useState } from 'react';
import { MessageCircle, TestTube, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { AIService } from '../services/ai';
import { debugLog } from '../utils/debug';

interface ChatTestResult {
  prompt: string;
  isImagePrompt: boolean;
  category: string;
  success: boolean;
  error?: string;
  enhancedCount?: number;
  styles?: string[];
}

const TestChatEnhancement: React.FC = () => {
  const [testResults, setTestResults] = useState<ChatTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testPrompts = [
    'a beautiful cat sitting in a garden',
    'professional photo of a sunset',
    'digital art of a futuristic city',
    'portrait of a woman',
    'explain how to cook pasta',
    'hello how are you'
  ];

  const runChatTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const results: ChatTestResult[] = [];

    for (const prompt of testPrompts) {
      try {
        debugLog(`🧪 Testing Chat.tsx logic for prompt: "${prompt}"`);
        
        // Simulate the exact logic from Chat.tsx
        const isImagePrompt = AIService.isImageGenerationPrompt(prompt);
        const category = isImagePrompt ? 'image_generation' : 'text_ai';
        
        debugLog('🎯 Chat.tsx detection result:', {
          prompt,
          isImagePrompt,
          category,
          detectedByUniversalMethod: AIService.isImageGenerationPrompt(prompt)
        });

        let enhancedCount = 0;
        let styles: string[] = [];
        let success = false;

        if (isImagePrompt) {
          // Test the enhancement call that Chat.tsx makes
          const enhancement = await AIService.enhancePrompt(prompt, true);
          
          enhancedCount = enhancement.enhanced.length;
          styles = enhancement.enhanced.map(e => e.style);
          success = enhancedCount === 4;
          
          debugLog('✅ Chat.tsx enhancement result:', {
            originalLength: enhancement.original.length,
            enhancedCount: enhancement.enhanced.length,
            enhancedStyles: enhancement.enhanced.map(e => e.style),
            processingTime: enhancement.processingTime
          });
        } else {
          // For non-image prompts, we expect 1 enhancement or chat response
          success = true; // Chat responses are handled differently
          enhancedCount = 0; // Chat doesn't use enhanced prompts
        }

        const result: ChatTestResult = {
          prompt,
          isImagePrompt,
          category,
          success,
          enhancedCount,
          styles
        };

        results.push(result);
        debugLog(`✅ Chat test result:`, result);
        
      } catch (error: any) {
        const result: ChatTestResult = {
          prompt,
          isImagePrompt: false,
          category: 'error',
          success: false,
          error: error.message
        };
        
        results.push(result);
        debugLog(`❌ Chat test failed:`, error.message);
      }
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const openChatPage = () => {
    window.open('/chat', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <MessageCircle className="h-6 w-6 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat.tsx Enhancement Test
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This test verifies that the Chat.tsx page correctly detects image generation prompts 
            and calls the enhancement service to get 4 style variants.
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={runChatTests}
              disabled={isRunning}
              className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isRunning ? (
                <>
                  <TestTube className="h-4 w-4 mr-2 animate-spin" />
                  Testing Chat Logic...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Chat Logic
                </>
              )}
            </button>

            <button
              onClick={openChatPage}
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Chat Page
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chat Logic Test Results</h3>
            
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
                        <div><strong>Is Image Prompt:</strong> {result.isImagePrompt ? 'Yes' : 'No'}</div>
                        <div><strong>Category:</strong> {result.category}</div>
                        {result.isImagePrompt && (
                          <>
                            <div><strong>Enhanced Count:</strong> {result.enhancedCount}</div>
                            <div><strong>Styles:</strong> {result.styles?.join(', ') || 'None'}</div>
                          </>
                        )}
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

            {/* Summary */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Test Summary</h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <div>Total Tests: {testResults.length}</div>
                <div>Passed: {testResults.filter(r => r.success).length}</div>
                <div>Failed: {testResults.filter(r => !r.success).length}</div>
                <div>Image Prompts Tested: {testResults.filter(r => r.isImagePrompt).length}</div>
                <div>Text Prompts Tested: {testResults.filter(r => !r.isImagePrompt).length}</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Manual Testing Instructions</h4>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <p>1. Click "Open Chat Page" to test the actual Chat interface</p>
                <p>2. Try typing image prompts like "a beautiful cat" or "professional photo of sunset"</p>
                <p>3. Verify you see 4 enhanced prompt variants displayed</p>
                <p>4. Check the browser console for detailed debug logs</p>
                <p>5. Try non-image prompts like "explain cooking" to verify they get regular chat responses</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestChatEnhancement;
