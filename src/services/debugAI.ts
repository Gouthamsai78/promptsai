import { debugLog } from '../utils/debug';

export class DebugAIService {
  private static readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  
  // Test API key access
  static testApiKeyAccess(): {
    hasApiKey: boolean;
    apiKeyLength: number;
    apiKeyPrefix: string;
    envVarExists: boolean;
  } {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    return {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A',
      envVarExists: 'VITE_OPENROUTER_API_KEY' in import.meta.env
    };
  }

  // Test basic API connectivity
  static async testAPIConnectivity(): Promise<{
    success: boolean;
    error?: string;
    statusCode?: number;
    responseTime: number;
  }> {
    const startTime = Date.now();
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: 'No API key available',
        responseTime: Date.now() - startTime
      };
    }

    try {
      const response = await fetch(this.OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'PromptShare Debug Test',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-small-3.2-24b-instruct:free',
          messages: [
            {
              role: 'user',
              content: 'Say "Hello" if you can hear me.'
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          statusCode: response.status,
          responseTime
        };
      }

      const data = await response.json();
      debugLog('✅ API Test Response:', data);

      return {
        success: true,
        responseTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  }

  // Test requirements analysis with minimal input
  static async testRequirementsAnalysis(): Promise<{
    success: boolean;
    error?: string;
    result?: any;
    responseTime: number;
  }> {
    const startTime = Date.now();
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: 'No API key available',
        responseTime: Date.now() - startTime
      };
    }

    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert prompt engineer. Analyze this requirement and respond with a simple JSON object containing:
{
  "identifiedUseCase": "string",
  "targetAudience": "string", 
  "generatedPrompts": [{"id": "1", "title": "Test Prompt", "prompt": "A simple test prompt", "explanation": "This is a test"}]
}`
        },
        {
          role: 'user',
          content: 'I need a prompt for writing professional emails'
        }
      ];

      const response = await fetch(this.OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'PromptShare Requirements Test',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-small-3.2-24b-instruct:free',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          responseTime
        };
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      debugLog('✅ Requirements Analysis Test Response:', content);

      return {
        success: true,
        result: content,
        responseTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  }

  // Test environment variables
  static testEnvironmentVariables(): Record<string, any> {
    return {
      VITE_OPENROUTER_API_KEY: {
        exists: 'VITE_OPENROUTER_API_KEY' in import.meta.env,
        hasValue: !!import.meta.env.VITE_OPENROUTER_API_KEY,
        length: import.meta.env.VITE_OPENROUTER_API_KEY?.length || 0
      },
      VITE_SUPABASE_URL: {
        exists: 'VITE_SUPABASE_URL' in import.meta.env,
        hasValue: !!import.meta.env.VITE_SUPABASE_URL,
        value: import.meta.env.VITE_SUPABASE_URL
      },
      VITE_SUPABASE_ANON_KEY: {
        exists: 'VITE_SUPABASE_ANON_KEY' in import.meta.env,
        hasValue: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        length: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
      },
      allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
    };
  }

  // Test browser capabilities
  static testBrowserCapabilities(): {
    fetch: boolean;
    speechRecognition: boolean;
    mediaDevices: boolean;
    localStorage: boolean;
    webAudio: boolean;
  } {
    return {
      fetch: typeof fetch !== 'undefined',
      speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      mediaDevices: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      localStorage: typeof localStorage !== 'undefined',
      webAudio: 'AudioContext' in window || 'webkitAudioContext' in window
    };
  }

  // Run comprehensive debug test
  static async runComprehensiveTest(): Promise<{
    apiKeyTest: ReturnType<typeof DebugAIService.testApiKeyAccess>;
    envVarsTest: ReturnType<typeof DebugAIService.testEnvironmentVariables>;
    browserTest: ReturnType<typeof DebugAIService.testBrowserCapabilities>;
    connectivityTest: Awaited<ReturnType<typeof DebugAIService.testAPIConnectivity>>;
    requirementsTest: Awaited<ReturnType<typeof DebugAIService.testRequirementsAnalysis>>;
  }> {
    debugLog('🔍 Starting comprehensive AI debug test...');

    const apiKeyTest = this.testApiKeyAccess();
    const envVarsTest = this.testEnvironmentVariables();
    const browserTest = this.testBrowserCapabilities();
    
    debugLog('📊 API Key Test:', apiKeyTest);
    debugLog('🌍 Environment Variables Test:', envVarsTest);
    debugLog('🌐 Browser Capabilities Test:', browserTest);

    const connectivityTest = await this.testAPIConnectivity();
    debugLog('🔗 Connectivity Test:', connectivityTest);

    const requirementsTest = await this.testRequirementsAnalysis();
    debugLog('📝 Requirements Analysis Test:', requirementsTest);

    return {
      apiKeyTest,
      envVarsTest,
      browserTest,
      connectivityTest,
      requirementsTest
    };
  }
}
