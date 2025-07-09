import React, { useState } from 'react';
import { Upload, Play, CheckCircle, XCircle, AlertCircle, Eye, TestTube, Zap } from 'lucide-react';
import { AIService } from '../services/ai';
import { debugLog } from '../utils/debug';
import { testImageAnalysisWithMockFile, testMockImageAnalysis } from '../utils/testImageAnalysis';

interface DebugResult {
  success: boolean;
  result?: any;
  error?: string;
  details: any;
}

const ImageAnalysisDebugger: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [showFullResult, setShowFullResult] = useState(false);
  const [quickTestResult, setQuickTestResult] = useState<any>(null);
  const [isRunningQuickTest, setIsRunningQuickTest] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setDebugResult(null);
    }
  };

  const runDebugAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setDebugResult(null);

    try {
      debugLog('🧪 Starting debug image analysis...');
      const result = await AIService.debugImageAnalysis(selectedFile);
      setDebugResult(result);
      debugLog('🧪 Debug analysis completed:', result);
    } catch (error: any) {
      debugLog('❌ Debug analysis failed:', error.message);
      setDebugResult({
        success: false,
        error: error.message,
        details: { error: error.message }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runQuickTest = async () => {
    setIsRunningQuickTest(true);
    setQuickTestResult(null);

    try {
      debugLog('🧪 Running quick image analysis test...');

      // Test 1: Mock analysis
      const mockResult = testMockImageAnalysis();

      // Test 2: AI availability
      const aiAvailable = AIService.isAIAvailable();

      // Test 3: Full analysis with mock file
      const fullTestResult = await testImageAnalysisWithMockFile();

      setQuickTestResult({
        mockTest: {
          success: !!mockResult,
          promptCount: mockResult?.enhancedPrompts?.length || 0
        },
        aiAvailable,
        fullTest: {
          success: !!fullTestResult,
          promptCount: fullTestResult?.enhancedPrompts?.length || 0
        }
      });

      debugLog('🧪 Quick test completed');
    } catch (error: any) {
      debugLog('❌ Quick test failed:', error.message);
      setQuickTestResult({
        error: error.message,
        mockTest: { success: false, promptCount: 0 },
        aiAvailable: false,
        fullTest: { success: false, promptCount: 0 }
      });
    } finally {
      setIsRunningQuickTest(false);
    }
  };

  const getStepIcon = (step: any) => {
    if (step.result === 'success' || step.step === 'VALIDATION_SUCCESS') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (step.step.includes('FAILED') || step.step === 'ERROR') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Image Analysis Debugger
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Upload an image to debug the AI analysis pipeline and identify any issues with prompt generation.
        </p>

        {/* Quick Test Section */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">Quick System Test</h3>
            <button
              onClick={runQuickTest}
              disabled={isRunningQuickTest}
              className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
            >
              {isRunningQuickTest ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Run Quick Test
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Test the image analysis system without uploading a file to verify basic functionality.
          </p>

          {quickTestResult && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className={`p-2 rounded ${quickTestResult.mockTest.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-medium">Mock Test</div>
                  <div>{quickTestResult.mockTest.success ? '✅' : '❌'} {quickTestResult.mockTest.promptCount} prompts</div>
                </div>
                <div className={`p-2 rounded ${quickTestResult.aiAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  <div className="font-medium">AI Available</div>
                  <div>{quickTestResult.aiAvailable ? '✅ Online' : '⚠️ Offline'}</div>
                </div>
                <div className={`p-2 rounded ${quickTestResult.fullTest.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <div className="font-medium">Full Test</div>
                  <div>{quickTestResult.fullTest.success ? '✅' : '❌'} {quickTestResult.fullTest.promptCount} prompts</div>
                </div>
              </div>
              {quickTestResult.error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  Error: {quickTestResult.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Image File
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <button
                onClick={runDebugAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Debug Analysis
                  </>
                )}
              </button>
            )}
          </div>
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Debug Results */}
        {debugResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Debug Results
              </h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                debugResult.success 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {debugResult.success ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                {debugResult.success ? 'Success' : 'Failed'}
              </div>
            </div>

            {/* Error Message */}
            {debugResult.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Error</h4>
                <p className="text-sm text-red-700 dark:text-red-300">{debugResult.error}</p>
              </div>
            )}

            {/* Processing Steps */}
            {debugResult.details.steps && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Processing Steps</h4>
                <div className="space-y-2">
                  {debugResult.details.steps.map((step: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      {getStepIcon(step)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {step.step.replace(/_/g, ' ')}
                        </p>
                        {step.result && step.result !== 'success' && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Result: {JSON.stringify(step.result)}
                          </p>
                        )}
                        {step.error && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Error: {step.error}
                          </p>
                        )}
                        {step.responsePreview && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                            Response: {step.responsePreview}...
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Prompts */}
            {debugResult.result?.enhancedPrompts && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                  Generated Prompts ({debugResult.result.enhancedPrompts.length})
                </h4>
                <div className="grid gap-3">
                  {debugResult.result.enhancedPrompts.map((prompt: any, index: number) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {prompt.style}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {prompt.prompt?.length || 0} chars
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                        {prompt.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Result Toggle */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <button
                onClick={() => setShowFullResult(!showFullResult)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                <Eye className="h-4 w-4 mr-1" />
                {showFullResult ? 'Hide' : 'Show'} Full Debug Data
              </button>
              
              {showFullResult && (
                <div className="mt-3 bg-gray-900 rounded-lg p-4 overflow-auto">
                  <pre className="text-xs text-green-400 whitespace-pre-wrap">
                    {JSON.stringify(debugResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysisDebugger;
