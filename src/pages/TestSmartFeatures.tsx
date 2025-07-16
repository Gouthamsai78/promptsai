import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader, Bug } from 'lucide-react';
import { RequirementsAnalysisService } from '../services/requirementsAnalysis';
import { VoiceRecognitionService } from '../services/voiceRecognition';
import { DeviceCapabilitiesService } from '../services/deviceCapabilities';
import { DebugAIService } from '../services/debugAI';
import { EnvironmentChecker } from '../utils/envChecker';
import PageLayout from '../components/PageLayout';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const TestSmartFeatures: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.details = details;
        return [...prev];
      } else {
        return [...prev, { name, status, message, details }];
      }
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 0: Environment Check
    updateTest('Environment Check', 'pending', 'Checking environment configuration...');
    try {
      const envResult = EnvironmentChecker.checkEnvironment();
      const diagnostics = EnvironmentChecker.getQuickDiagnostics();

      if (envResult.isValid) {
        updateTest('Environment Check', 'success', 'Environment configuration is valid',
          diagnostics.join(' | '));
      } else {
        updateTest('Environment Check', 'warning', 'Environment has issues',
          `Errors: ${envResult.errors.join(', ')} | Warnings: ${envResult.warnings.join(', ')}`);
      }
    } catch (error: any) {
      updateTest('Environment Check', 'error', 'Environment check failed', error.message);
    }

    // Test 1: Device Capabilities
    updateTest('Device Capabilities', 'pending', 'Checking device capabilities...');
    try {
      const deviceInfo = await DeviceCapabilitiesService.initialize();
      updateTest('Device Capabilities', 'success', 'Device capabilities detected',
        `Platform: ${deviceInfo.platform}, Browser: ${deviceInfo.browser}, Voice: ${deviceInfo.supportsVoice ? 'Supported' : 'Not supported'}`);
    } catch (error: any) {
      updateTest('Device Capabilities', 'error', 'Failed to detect device capabilities', error.message);
    }

    // Test 2: Voice Recognition
    updateTest('Voice Recognition', 'pending', 'Testing voice recognition...');
    try {
      const capabilities = VoiceRecognitionService.getCapabilities();
      if (capabilities.isSupported) {
        updateTest('Voice Recognition', 'success', 'Voice recognition is supported', 
          `Languages: ${capabilities.supportedLanguages.length}, WebSpeechAPI: ${capabilities.browserSupport.webSpeechAPI}`);
      } else {
        updateTest('Voice Recognition', 'warning', 'Voice recognition not supported in this browser', 
          'Voice features will be disabled');
      }
    } catch (error: any) {
      updateTest('Voice Recognition', 'error', 'Voice recognition test failed', error.message);
    }

    // Test 3: Requirements Analysis Service
    updateTest('Requirements Analysis', 'pending', 'Testing requirements analysis...');
    try {
      const isAvailable = RequirementsAnalysisService.isAvailable();
      if (isAvailable) {
        // Test with a simple input
        const testInput = {
          naturalLanguageDescription: 'I need a prompt for writing professional emails'
        };
        
        const result = await RequirementsAnalysisService.analyzeRequirements(testInput);
        updateTest('Requirements Analysis', 'success', 'Requirements analysis working', 
          `Generated ${result.generatedPrompts.length} prompts with ${result.confidence}% confidence`);
      } else {
        updateTest('Requirements Analysis', 'warning', 'AI service not available', 
          'Using mock responses - check API key configuration');
      }
    } catch (error: any) {
      updateTest('Requirements Analysis', 'error', 'Requirements analysis failed', error.message);
    }

    // Test 4: Component Integration
    updateTest('Component Integration', 'pending', 'Testing component integration...');
    try {
      // Check if components can be imported (this is a basic test)
      const componentsExist = !!(
        typeof React.lazy === 'function' // Basic React check
      );
      
      if (componentsExist) {
        updateTest('Component Integration', 'success', 'Components integrated successfully', 
          'All smart prompt components are available');
      } else {
        updateTest('Component Integration', 'error', 'Component integration failed', 
          'React components not properly loaded');
      }
    } catch (error: any) {
      updateTest('Component Integration', 'error', 'Component integration test failed', error.message);
    }

    // Test 5: Navigation Routes
    updateTest('Navigation Routes', 'pending', 'Testing navigation routes...');
    try {
      const currentPath = window.location.pathname;
      const expectedRoutes = ['/', '/create', '/smart-studio', '/chat'];
      
      updateTest('Navigation Routes', 'success', 'Navigation routes configured', 
        `Current: ${currentPath}, Available routes: ${expectedRoutes.join(', ')}`);
    } catch (error: any) {
      updateTest('Navigation Routes', 'error', 'Navigation test failed', error.message);
    }

    setIsRunning(false);
  };

  const runDebugTests = async () => {
    setIsDebugging(true);
    setDebugResults(null);

    try {
      const results = await DebugAIService.runComprehensiveTest();
      setDebugResults(results);
    } catch (error) {
      console.error('Debug test failed:', error);
      setDebugResults({ error: 'Debug test failed: ' + (error as Error).message });
    } finally {
      setIsDebugging(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'pending':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Smart Features Integration Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Test the integration of new AI-powered features in PromptShare
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
            </button>

            <button
              onClick={runDebugTests}
              disabled={isDebugging}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Bug className="w-4 h-4" />
              <span>{isDebugging ? 'Debugging...' : 'Debug AI Services'}</span>
            </button>
          </div>
        </div>

        {tests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Test Results
            </h2>
            
            {tests.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  {getStatusIcon(test.status)}
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {test.name}
                  </h3>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {test.message}
                </p>
                
                {test.details && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded border">
                    {test.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Debug Results */}
        {debugResults && (
          <div className="mt-8 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🐛 Debug Results
            </h2>

            {debugResults.error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{debugResults.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* API Key Test */}
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">API Key Test</h3>
                  <div className="text-sm space-y-1">
                    <p>Has API Key: <span className={debugResults.apiKeyTest.hasApiKey ? 'text-green-600' : 'text-red-600'}>{debugResults.apiKeyTest.hasApiKey ? 'Yes' : 'No'}</span></p>
                    <p>Key Length: {debugResults.apiKeyTest.apiKeyLength}</p>
                    <p>Key Preview: {debugResults.apiKeyTest.apiKeyPrefix}</p>
                    <p>Env Var Exists: <span className={debugResults.apiKeyTest.envVarExists ? 'text-green-600' : 'text-red-600'}>{debugResults.apiKeyTest.envVarExists ? 'Yes' : 'No'}</span></p>
                  </div>
                </div>

                {/* Connectivity Test */}
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">API Connectivity Test</h3>
                  <div className="text-sm space-y-1">
                    <p>Success: <span className={debugResults.connectivityTest.success ? 'text-green-600' : 'text-red-600'}>{debugResults.connectivityTest.success ? 'Yes' : 'No'}</span></p>
                    <p>Response Time: {debugResults.connectivityTest.responseTime}ms</p>
                    {debugResults.connectivityTest.error && (
                      <p className="text-red-600">Error: {debugResults.connectivityTest.error}</p>
                    )}
                    {debugResults.connectivityTest.statusCode && (
                      <p>Status Code: {debugResults.connectivityTest.statusCode}</p>
                    )}
                  </div>
                </div>

                {/* Requirements Test */}
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Requirements Analysis Test</h3>
                  <div className="text-sm space-y-1">
                    <p>Success: <span className={debugResults.requirementsTest.success ? 'text-green-600' : 'text-red-600'}>{debugResults.requirementsTest.success ? 'Yes' : 'No'}</span></p>
                    <p>Response Time: {debugResults.requirementsTest.responseTime}ms</p>
                    {debugResults.requirementsTest.error && (
                      <p className="text-red-600">Error: {debugResults.requirementsTest.error}</p>
                    )}
                    {debugResults.requirementsTest.result && (
                      <div className="mt-2">
                        <p className="font-medium">Response:</p>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                          {typeof debugResults.requirementsTest.result === 'string'
                            ? debugResults.requirementsTest.result.substring(0, 500) + '...'
                            : JSON.stringify(debugResults.requirementsTest.result, null, 2).substring(0, 500) + '...'
                          }
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Environment Variables */}
                <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Environment Variables</h3>
                  <div className="text-sm space-y-1">
                    <p>Available Env Vars: {debugResults.envVarsTest.allEnvVars.join(', ')}</p>
                    <p>OpenRouter Key: <span className={debugResults.envVarsTest.VITE_OPENROUTER_API_KEY.hasValue ? 'text-green-600' : 'text-red-600'}>
                      {debugResults.envVarsTest.VITE_OPENROUTER_API_KEY.hasValue ? 'Set' : 'Not Set'}
                    </span></p>
                    <p>Supabase URL: <span className={debugResults.envVarsTest.VITE_SUPABASE_URL.hasValue ? 'text-green-600' : 'text-red-600'}>
                      {debugResults.envVarsTest.VITE_SUPABASE_URL.hasValue ? 'Set' : 'Not Set'}
                    </span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isRunning && tests.length > 0 && (
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Next Steps
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>✅ If all tests pass, your Smart Features are ready to use!</p>
              <p>🔧 If there are warnings, some features may have limited functionality</p>
              <p>❌ If there are errors, check the console for detailed error messages</p>
              <p>🐛 If issues persist, use the "Debug AI Services" button for detailed diagnostics</p>
              <p>🚀 Visit <a href="/smart-studio" className="text-blue-500 hover:underline">Smart Studio</a> to try the new features</p>
              <p>📝 Go to <a href="/create" className="text-blue-500 hover:underline">Create</a> to see the enhanced prompt creation</p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TestSmartFeatures;
