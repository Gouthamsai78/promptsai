import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

const DatabaseDiagnostic: React.FC = () => {
  const { user, session, loading: authLoading } = useAuth();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateResult = (test: string, status: DiagnosticResult['status'], message: string, details?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.test === test);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.details = details;
        return [...prev];
      } else {
        return [...prev, { test, status, message, details }];
      }
    });
  };

  const runDiagnostics = async () => {
    setRunning(true);
    setResults([]);

    // Test 1: Authentication Status
    updateResult('auth', 'pending', 'Checking authentication...');
    try {
      if (user && session) {
        updateResult('auth', 'success', `Authenticated as ${user.email}`, { userId: user.id });
      } else {
        updateResult('auth', 'error', 'Not authenticated');
      }
    } catch (error: any) {
      updateResult('auth', 'error', `Auth error: ${error.message}`);
    }

    // Test 2: Database Connection
    updateResult('connection', 'pending', 'Testing database connection...');
    try {
      const posts = await DatabaseService.getPosts(1, 0);
      updateResult('connection', 'success', 'Database connection successful', { postsCount: posts.length });
    } catch (error: any) {
      updateResult('connection', 'error', `Database error: ${error.message}`, error);
    }

    // Test 3: Posts Query
    updateResult('posts', 'pending', 'Testing posts query...');
    try {
      const posts = await DatabaseService.getPosts(5, 0);
      updateResult('posts', 'success', `Retrieved ${posts.length} posts`, { posts: posts.slice(0, 2) });
    } catch (error: any) {
      updateResult('posts', 'error', `Posts query failed: ${error.message}`, error);
    }

    // Test 4: Reels Query
    updateResult('reels', 'pending', 'Testing reels query...');
    try {
      const reels = await DatabaseService.getReels(5, 0);
      updateResult('reels', 'success', `Retrieved ${reels.length} reels`, { reels: reels.slice(0, 2) });
    } catch (error: any) {
      updateResult('reels', 'error', `Reels query failed: ${error.message}`, error);
    }

    setRunning(false);
  };

  useEffect(() => {
    if (!authLoading) {
      runDiagnostics();
    }
  }, [authLoading]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pending':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Database Diagnostic
          </h2>
          <button
            onClick={runDiagnostics}
            disabled={running}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
          >
            {running ? 'Running...' : 'Run Tests'}
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.test}
              className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                    {result.test} Test
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        Show Details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && !running && (
          <div className="text-center py-8 text-gray-500">
            Click "Run Tests" to start diagnostics
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseDiagnostic;
