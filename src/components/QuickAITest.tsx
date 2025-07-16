import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader } from 'lucide-react';
import { RequirementsAnalysisService } from '../services/requirementsAnalysis';
import { debugLog } from '../utils/debug';

const QuickAITest: React.FC = () => {
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const [isTestingRequirements, setIsTestingRequirements] = useState(false);
  const [requirementsTestResult, setRequirementsTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testAPIConnection = async () => {
    setIsTestingAPI(true);
    setApiTestResult(null);

    try {
      debugLog('🧪 Testing API connection...');
      
      // Check if service is available
      const isAvailable = RequirementsAnalysisService.isAvailable();
      if (!isAvailable) {
        setApiTestResult({
          success: false,
          message: 'API key not available',
          details: 'VITE_OPENROUTER_API_KEY environment variable is not set'
        });
        return;
      }

      // Test with a simple requirements analysis
      const testInput = {
        naturalLanguageDescription: 'Create a simple test prompt'
      };

      const result = await RequirementsAnalysisService.analyzeRequirements(testInput);
      
      // Check if we got a real result or mock data
      const isRealResult = result.confidence > 70 && result.generatedPrompts.length > 0;
      
      setApiTestResult({
        success: isRealResult,
        message: isRealResult ? 'API connection successful!' : 'Using mock data - API may not be working',
        details: {
          confidence: result.confidence,
          promptCount: result.generatedPrompts.length,
          processingTime: result.processingTime,
          useCase: result.identifiedUseCase
        }
      });

    } catch (error: any) {
      debugLog('❌ API test failed:', error);
      setApiTestResult({
        success: false,
        message: 'API test failed',
        details: error.message
      });
    } finally {
      setIsTestingAPI(false);
    }
  };

  const testRequirementsAnalysis = async () => {
    setIsTestingRequirements(true);
    setRequirementsTestResult(null);

    try {
      debugLog('🧪 Testing requirements analysis...');
      
      const testInput = {
        naturalLanguageDescription: 'I need a prompt that helps me write professional emails with a friendly tone for customer support',
        targetLength: 'medium' as const,
        complexityLevel: 'intermediate' as const
      };

      const result = await RequirementsAnalysisService.analyzeRequirements(testInput);
      
      // Validate the result structure
      const hasValidStructure = (
        result.generatedPrompts &&
        result.generatedPrompts.length > 0 &&
        result.generatedPrompts[0].prompt &&
        result.generatedPrompts[0].title
      );

      setRequirementsTestResult({
        success: hasValidStructure,
        message: hasValidStructure ? 'Requirements analysis working!' : 'Invalid response structure',
        details: {
          promptCount: result.generatedPrompts?.length || 0,
          confidence: result.confidence,
          useCase: result.identifiedUseCase,
          audience: result.targetAudience,
          firstPromptTitle: result.generatedPrompts?.[0]?.title || 'N/A',
          firstPromptLength: result.generatedPrompts?.[0]?.prompt?.length || 0
        }
      });

    } catch (error: any) {
      debugLog('❌ Requirements analysis test failed:', error);
      setRequirementsTestResult({
        success: false,
        message: 'Requirements analysis test failed',
        details: error.message
      });
    } finally {
      setIsTestingRequirements(false);
    }
  };

  const getStatusIcon = (result: { success: boolean } | null, isLoading: boolean) => {
    if (isLoading) return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    if (!result) return null;
    return result.success ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🧪 Quick AI Service Tests
      </h3>
      
      <div className="space-y-4">
        {/* API Connection Test */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(apiTestResult, isTestingAPI)}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">API Connection Test</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test basic API connectivity and authentication
              </p>
            </div>
          </div>
          <button
            onClick={testAPIConnection}
            disabled={isTestingAPI}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>{isTestingAPI ? 'Testing...' : 'Test API'}</span>
          </button>
        </div>

        {apiTestResult && (
          <div className={`p-3 rounded-lg border ${
            apiTestResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <p className={`font-medium ${
              apiTestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {apiTestResult.message}
            </p>
            {apiTestResult.details && (
              <pre className="text-xs mt-2 text-gray-600 dark:text-gray-400 overflow-x-auto">
                {typeof apiTestResult.details === 'string' 
                  ? apiTestResult.details 
                  : JSON.stringify(apiTestResult.details, null, 2)
                }
              </pre>
            )}
          </div>
        )}

        {/* Requirements Analysis Test */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(requirementsTestResult, isTestingRequirements)}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Requirements Analysis Test</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Test full requirements analysis workflow
              </p>
            </div>
          </div>
          <button
            onClick={testRequirementsAnalysis}
            disabled={isTestingRequirements}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>{isTestingRequirements ? 'Testing...' : 'Test Analysis'}</span>
          </button>
        </div>

        {requirementsTestResult && (
          <div className={`p-3 rounded-lg border ${
            requirementsTestResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <p className={`font-medium ${
              requirementsTestResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {requirementsTestResult.message}
            </p>
            {requirementsTestResult.details && (
              <pre className="text-xs mt-2 text-gray-600 dark:text-gray-400 overflow-x-auto">
                {typeof requirementsTestResult.details === 'string' 
                  ? requirementsTestResult.details 
                  : JSON.stringify(requirementsTestResult.details, null, 2)
                }
              </pre>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> If tests fail, check the browser console for detailed error messages. 
          Make sure your VITE_OPENROUTER_API_KEY is set correctly in your environment variables.
        </p>
      </div>
    </div>
  );
};

export default QuickAITest;
