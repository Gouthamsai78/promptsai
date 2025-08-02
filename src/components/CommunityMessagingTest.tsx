import React, { useState, useEffect } from 'react';
import { CommunityDiscussionService } from '../services/communityDiscussions';
import { CommunityService } from '../services/community';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, Loader, MessageCircle, Users } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

const CommunityMessagingTest: React.FC = () => {
  const { user, session } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [communities, setCommunities] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState('Hello from the messaging test! 🚀');

  const updateResult = (test: string, status: TestResult['status'], message: string, details?: any) => {
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

  const loadCommunities = async () => {
    try {
      const response = await CommunityService.getUserCommunities();
      if (response.success && response.data) {
        setCommunities(response.data);
        if (response.data.length > 0) {
          setSelectedCommunity(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load communities:', error);
    }
  };

  const runMessagingTests = async () => {
    if (!user || !selectedCommunity) {
      alert('Please select a community and ensure you are logged in');
      return;
    }

    setRunning(true);
    setResults([]);

    // Test 1: Check Authentication
    updateResult('auth', 'pending', 'Checking authentication...');
    if (user && session) {
      updateResult('auth', 'success', `Authenticated as ${user.email}`, { userId: user.id });
    } else {
      updateResult('auth', 'error', 'Not authenticated');
      setRunning(false);
      return;
    }

    // Test 2: Check Community Membership
    updateResult('membership', 'pending', 'Checking community membership...');
    try {
      const membershipResponse = await CommunityService.checkMembership(selectedCommunity);
      if (membershipResponse.success && membershipResponse.data) {
        updateResult('membership', 'success', `Member status: ${membershipResponse.data.status}`, membershipResponse.data);
      } else {
        updateResult('membership', 'error', 'Not a member of this community');
      }
    } catch (error: any) {
      updateResult('membership', 'error', `Membership check failed: ${error.message}`);
    }

    // Test 3: Fetch Existing Messages
    updateResult('fetch', 'pending', 'Fetching existing messages...');
    try {
      const messagesResponse = await CommunityDiscussionService.getCommunityMessages(selectedCommunity, 10, 0);
      if (messagesResponse.success && messagesResponse.data) {
        updateResult('fetch', 'success', `Retrieved ${messagesResponse.data.length} messages`, { 
          messageCount: messagesResponse.data.length,
          messages: messagesResponse.data.slice(0, 3)
        });
      } else {
        updateResult('fetch', 'error', `Failed to fetch messages: ${messagesResponse.error}`);
      }
    } catch (error: any) {
      updateResult('fetch', 'error', `Message fetch failed: ${error.message}`);
    }

    // Test 4: Send Test Message
    updateResult('send', 'pending', 'Sending test message...');
    try {
      const sendResponse = await CommunityDiscussionService.sendCommunityMessage(
        selectedCommunity,
        user.id,
        testMessage,
        'text'
      );
      
      if (sendResponse.success && sendResponse.data) {
        updateResult('send', 'success', 'Message sent successfully!', {
          messageId: sendResponse.data.id,
          content: sendResponse.data.content,
          timestamp: sendResponse.data.created_at
        });
      } else {
        updateResult('send', 'error', `Failed to send message: ${sendResponse.error}`);
      }
    } catch (error: any) {
      updateResult('send', 'error', `Message send failed: ${error.message}`);
    }

    setRunning(false);
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
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
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Community Messaging Test
            </h2>
          </div>
        </div>

        {/* Community Selection */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Community:
          </label>
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a community...</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name} ({community.member_count} members)
              </option>
            ))}
          </select>
          
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Message:
            </label>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter test message..."
            />
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={runMessagingTests}
            disabled={running || !selectedCommunity}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
          >
            {running ? 'Running Tests...' : 'Run Messaging Tests'}
          </button>
          
          <button
            onClick={loadCommunities}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 inline mr-2" />
            Refresh Communities
          </button>
        </div>

        {/* Test Results */}
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
            Select a community and click "Run Messaging Tests" to start
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityMessagingTest;
