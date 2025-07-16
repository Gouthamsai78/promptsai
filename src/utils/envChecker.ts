import { debugLog } from './debug';

export interface EnvCheckResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: Record<string, any>;
}

export class EnvironmentChecker {
  static checkEnvironment(): EnvCheckResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: Record<string, any> = {};

    // Check if we're in development or production
    const isDev = import.meta.env.DEV;
    const isProd = import.meta.env.PROD;
    const mode = import.meta.env.MODE;

    info.environment = { isDev, isProd, mode };

    // Check OpenRouter API Key
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!openRouterKey) {
      errors.push('VITE_OPENROUTER_API_KEY is not set');
    } else if (openRouterKey.length < 10) {
      warnings.push('VITE_OPENROUTER_API_KEY seems too short');
    } else {
      info.openRouterKey = {
        length: openRouterKey.length,
        prefix: openRouterKey.substring(0, 8) + '...',
        isSet: true
      };
    }

    // Check Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      errors.push('VITE_SUPABASE_URL is not set');
    } else {
      info.supabaseUrl = supabaseUrl;
    }

    if (!supabaseKey) {
      errors.push('VITE_SUPABASE_ANON_KEY is not set');
    } else {
      info.supabaseKey = {
        length: supabaseKey.length,
        prefix: supabaseKey.substring(0, 8) + '...',
        isSet: true
      };
    }

    // Check browser capabilities
    const browserCapabilities = {
      fetch: typeof fetch !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      mediaDevices: 'mediaDevices' in navigator,
      audioContext: 'AudioContext' in window || 'webkitAudioContext' in window
    };

    info.browserCapabilities = browserCapabilities;

    if (!browserCapabilities.fetch) {
      errors.push('Fetch API not available');
    }

    if (!browserCapabilities.speechRecognition) {
      warnings.push('Speech Recognition API not available - voice features will be disabled');
    }

    if (!browserCapabilities.mediaDevices) {
      warnings.push('Media Devices API not available - microphone access may not work');
    }

    // Check network connectivity
    const isOnline = navigator.onLine;
    info.networkStatus = { isOnline };

    if (!isOnline) {
      warnings.push('Device appears to be offline - AI features may use cached/mock data');
    }

    // List all available environment variables
    const allEnvVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'));
    info.availableEnvVars = allEnvVars;

    const result: EnvCheckResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };

    debugLog('🔍 Environment check result:', result);
    return result;
  }

  static logEnvironmentInfo(): void {
    const result = this.checkEnvironment();
    
    console.group('🌍 Environment Check');
    
    if (result.errors.length > 0) {
      console.error('❌ Errors:', result.errors);
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Warnings:', result.warnings);
    }
    
    console.info('ℹ️ Environment Info:', result.info);
    console.groupEnd();
  }

  static async testAPIConnectivity(): Promise<{
    openRouter: { success: boolean; error?: string; responseTime?: number };
    supabase: { success: boolean; error?: string; responseTime?: number };
  }> {
    const results = {
      openRouter: { success: false, error: 'Not tested' },
      supabase: { success: false, error: 'Not tested' }
    };

    // Test OpenRouter
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (openRouterKey) {
      const startTime = Date.now();
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
          },
        });
        
        results.openRouter = {
          success: response.ok,
          responseTime: Date.now() - startTime,
          error: response.ok ? undefined : `HTTP ${response.status}`
        };
      } catch (error: any) {
        results.openRouter = {
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        };
      }
    } else {
      results.openRouter.error = 'No API key available';
    }

    // Test Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const startTime = Date.now();
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          },
        });
        
        results.supabase = {
          success: response.status < 500, // 401/403 is ok, 500+ is not
          responseTime: Date.now() - startTime,
          error: response.status >= 500 ? `HTTP ${response.status}` : undefined
        };
      } catch (error: any) {
        results.supabase = {
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        };
      }
    } else {
      results.supabase.error = 'No Supabase URL available';
    }

    debugLog('🔗 API Connectivity Test Results:', results);
    return results;
  }

  static getQuickDiagnostics(): string[] {
    const result = this.checkEnvironment();
    const diagnostics: string[] = [];

    if (result.errors.length > 0) {
      diagnostics.push(`❌ ${result.errors.length} critical error(s)`);
    }

    if (result.warnings.length > 0) {
      diagnostics.push(`⚠️ ${result.warnings.length} warning(s)`);
    }

    if (result.isValid) {
      diagnostics.push('✅ Environment configuration looks good');
    }

    const openRouterConfigured = !!import.meta.env.VITE_OPENROUTER_API_KEY;
    diagnostics.push(`🤖 AI Services: ${openRouterConfigured ? 'Configured' : 'Not configured'}`);

    const voiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    diagnostics.push(`🎤 Voice Features: ${voiceSupported ? 'Supported' : 'Not supported'}`);

    const isOnline = navigator.onLine;
    diagnostics.push(`🌐 Network: ${isOnline ? 'Online' : 'Offline'}`);

    return diagnostics;
  }
}
