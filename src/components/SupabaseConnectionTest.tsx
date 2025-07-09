import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ConnectionTestProps {
  onConnectionResult: (isConnected: boolean, error?: string) => void;
}

const SupabaseConnectionTest: React.FC<ConnectionTestProps> = ({ onConnectionResult }) => {
  const [testing, setTesting] = useState(true);
  const [result, setResult] = useState<{
    connected: boolean;
    error?: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    console.log('🔍 Testing Supabase connection...');

    try {
      // Test 1: Basic connection
      console.log('Test 1: Basic connection test');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Connection test failed:', error);
        setResult({
          connected: false,
          error: error.message,
          details: error
        });
        onConnectionResult(false, error.message);
        return;
      }

      console.log('✅ Basic connection successful');

      // Test 2: Database connectivity
      console.log('Test 2: Database connectivity test');
      try {
        const { error: dbError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        if (dbError) {
          console.error('❌ Database connection failed:', dbError);
          setResult({
            connected: false,
            error: `Database error: ${dbError.message}`,
            details: dbError
          });
          onConnectionResult(false, `Database error: ${dbError.message}`);
          return;
        }

        console.log('✅ Database connection successful');
        setResult({
          connected: true,
          details: { session: data }
        });
        onConnectionResult(true);

      } catch (dbErr: any) {
        console.error('❌ Database connection error:', dbErr);
        setResult({
          connected: false,
          error: `Database connection failed: ${dbErr.message}`,
          details: dbErr
        });
        onConnectionResult(false, `Database connection failed: ${dbErr.message}`);
      }

    } catch (err: any) {
      console.error('❌ Connection test error:', err);
      setResult({
        connected: false,
        error: err.message || 'Unknown connection error',
        details: err
      });
      onConnectionResult(false, err.message || 'Unknown connection error');
    } finally {
      setTesting(false);
    }
  };

  if (testing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Testing Supabase connection...</p>
        </div>
      </div>
    );
  }

  if (!result?.connected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Unable to connect to Supabase
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800 dark:text-red-400 mb-2">Error Details:</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{result?.error}</p>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <h3 className="font-medium mb-2">Troubleshooting Steps:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your internet connection</li>
                <li>Verify Supabase project URL and API key</li>
                <li>Ensure your Supabase project is active</li>
                <li>Check if your .env.local file is properly configured</li>
              </ol>
            </div>

            <button
              onClick={testConnection}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // Connection successful, let the app continue
};

export default SupabaseConnectionTest;
