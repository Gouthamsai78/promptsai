import React, { useState, useEffect } from 'react';
import PostCard from '../components/PostCard';
import ReelCard from '../components/ReelCard';
import ToolCard from '../components/ToolCard';
import { Post, Reel, Tool, Profile } from '../types';
import { DatabaseService } from '../services/database';
import { testConnection } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from '../components/PageLayout';
import { testFileUpload } from '../utils/uploadTest';
import { AIService } from '../services/ai';
import { RealtimeService } from '../services/realtime';
import DebugEnv from '../components/DebugEnv';
import { TransformationEngineTest } from '../utils/testTransformationEngine';
import ImageAnalysisDebugger from '../components/ImageAnalysisDebugger';
import SimpleImageTest from '../components/SimpleImageTest';
import Test4StyleEnhancement from '../components/Test4StyleEnhancement';
import TestChatEnhancement from '../components/TestChatEnhancement';
import TestEnhancedUI from '../components/TestEnhancedUI';

const TestPage: React.FC = () => {
  const { user, isOfflineMode } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [toolsTest, setToolsTest] = useState<{ status: string; count: number; error?: string }>({
    status: 'Not tested',
    count: 0
  });
  const [postsTest, setPostsTest] = useState<{ status: string; count: number; error?: string }>({
    status: 'Not tested',
    count: 0
  });
  const [reelsTest, setReelsTest] = useState<{ status: string; count: number; error?: string }>({
    status: 'Not tested',
    count: 0
  });
  const [uploadTest, setUploadTest] = useState<{ status: string; message: string }>({
    status: 'Not tested',
    message: ''
  });
  const [postCreationTest, setPostCreationTest] = useState<{ status: string; message: string }>({
    status: 'Not tested',
    message: ''
  });
  const [aiTest, setAiTest] = useState<{ status: string; message: string }>({
    status: 'Not tested',
    message: ''
  });
  const [realtimeTest, setRealtimeTest] = useState<{ status: string; message: string }>({
    status: 'Not tested',
    message: ''
  });
  const [transformationTest, setTransformationTest] = useState<{
    status: string;
    message: string;
    passRate?: number;
    averageQuality?: number;
  }>({
    status: 'Not tested',
    message: ''
  });

  // Test Supabase connection on component mount
  useEffect(() => {
    const runTests = async () => {
      // Test connection
      try {
        const isConnected = await testConnection(5000);
        setConnectionStatus(isConnected ? 'Connected' : 'Failed');
      } catch (error) {
        setConnectionStatus('Error');
      }

      // Test tools fetching
      try {
        setToolsTest({ status: 'Testing...', count: 0 });
        const tools = await DatabaseService.getTools(10, 0);
        setToolsTest({ status: 'Success', count: tools.length });
      } catch (error: any) {
        setToolsTest({ status: 'Failed', count: 0, error: error.message });
      }

      // Test posts fetching
      try {
        setPostsTest({ status: 'Testing...', count: 0 });
        const posts = await DatabaseService.getPosts(10, 0);
        setPostsTest({ status: 'Success', count: posts.length });
      } catch (error: any) {
        setPostsTest({ status: 'Failed', count: 0, error: error.message });
      }

      // Test reels fetching
      try {
        setReelsTest({ status: 'Testing...', count: 0 });
        const reels = await DatabaseService.getReels(10, 0);
        setReelsTest({ status: 'Success', count: reels.length });
      } catch (error: any) {
        setReelsTest({ status: 'Failed', count: 0, error: error.message });
      }
    };

    runTests();
  }, []);

  // Test Save/Like Functionality
  const testSaveAndLikeFunctionality = async () => {
    if (!user) {
      alert('Please log in to test save/like functionality');
      return;
    }

    try {
      console.log('🧪 Testing save and like functionality...');

      // Test with a mock post ID (you can replace with a real post ID)
      const testPostId = 'test-post-id';

      // Test save functionality
      console.log('Testing save functionality...');
      const isSaved = await DatabaseService.isPostSaved(user.id, testPostId);
      console.log('✅ isPostSaved check completed:', isSaved);

      // Test like functionality
      console.log('Testing like functionality...');
      const isLiked = await DatabaseService.isPostLiked(user.id, testPostId);
      console.log('✅ isPostLiked check completed:', isLiked);

      alert('Save/Like functionality test completed successfully! Check console for details.');
    } catch (error: any) {
      console.error('❌ Save/Like test failed:', error);
      alert(`Save/Like test failed: ${error.message}`);
    }
  };

  // Test Raw OpenRouter API Response
  const testRawAPIResponse = async () => {
    console.log('🧪 Testing raw OpenRouter API response with free model...');
    console.log('🔍 Current model: microsoft/phi-3-mini-128k-instruct:free');

    try {
      // Test AI availability first
      const isAvailable = AIService.isAIAvailable();
      console.log('🔍 AI Service Available:', isAvailable);

      if (!isAvailable) {
        alert('AI service is not available. Check API key configuration.');
        return;
      }

      // Make a direct API call to see the raw response structure
      console.log('🚀 Making API call with test prompt...');
      const result = await AIService.enhancePrompt('a beautiful sunset', false);
      console.log('✅ Raw API test completed successfully:', result);

      // Verify we got real data, not mock data
      if (result.original === 'a beautiful sunset' && result.enhanced.photographic) {
        console.log('✅ Received real AI enhancement (not mock data)');
        alert('✅ AI Service working! Real API responses received. Check console for details.');
      } else {
        console.log('⚠️ Received unexpected response format:', result);
        alert('⚠️ Unexpected response format. Check console for details.');
      }
    } catch (error: any) {
      console.error('❌ Raw API test failed:', error);
      alert(`❌ Raw API test failed: ${error.message}`);
    }
  };

  // Test Multiple Models to Find Working One
  const testMultipleModels = async () => {
    console.log('🧪 Testing multiple models to find working one...');

    const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

    if (!API_KEY) {
      alert('❌ No API key found');
      return;
    }

    const modelsToTest = [
      'microsoft/phi-3-mini-128k-instruct:free',
      'google/gemma-2-9b-it:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'huggingfaceh4/zephyr-7b-beta:free',
      'google/gemma-2-2b-it:free'
    ];

    console.log('🔍 Testing models:', modelsToTest);

    for (const model of modelsToTest) {
      try {
        console.log(`\n🚀 Testing model: ${model}`);

        const requestBody = {
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Say hello'
            }
          ],
          max_tokens: 10,
          temperature: 0.7
        };

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'PromptShare Model Test',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          console.log(`✅ ${model} - SUCCESS: "${content}"`);
          alert(`✅ Found working model: ${model}\nResponse: "${content}"\n\nThis model should be used in the configuration.`);
          return; // Stop at first working model
        } else {
          const errorText = await response.text();
          console.log(`❌ ${model} - FAILED: ${response.status} - ${errorText}`);
        }
      } catch (error: any) {
        console.log(`❌ ${model} - ERROR: ${error.message}`);
      }
    }

    alert('❌ No working models found. Check console for details.');
  };

  // Test Create Page AI Enhancement
  const testCreatePageAI = () => {
    console.log('🧪 Testing Create page AI enhancement...');
    alert('Navigate to the Create page (/create) and try the AI prompt enhancement feature. Check the browser console for detailed logs.');
    window.open('/create', '_blank');
  };

  // Check Available Free Models
  const checkAvailableFreeModels = async () => {
    console.log('🔍 Checking available free models on OpenRouter...');

    const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    const MODELS_URL = 'https://openrouter.ai/api/v1/models';

    if (!API_KEY) {
      alert('❌ No API key found');
      return;
    }

    try {
      console.log('🚀 Fetching models list from OpenRouter...');

      const response = await fetch(MODELS_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Models API failed: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 Models response received:', data);

      // Filter for free models
      const freeModels = data.data.filter((model: any) =>
        model.pricing.prompt === "0" || model.id.includes(':free')
      );

      console.log('🆓 Available free models:');
      freeModels.forEach((model: any) => {
        console.log(`  - ${model.id} (${model.name})`);
      });

      // Check for specific models we're interested in
      const targetModels = [
        'microsoft/phi-3-mini-128k-instruct:free',
        'google/gemma-2-9b-it:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'huggingfaceh4/zephyr-7b-beta:free',
        'meta-llama/llama-3.1-8b-instruct:free',
        'google/gemma-2-2b-it:free'
      ];

      console.log('🎯 Checking target models availability:');
      const availableTargets = [];
      targetModels.forEach(modelId => {
        const found = freeModels.find((m: any) => m.id === modelId);
        if (found) {
          console.log(`  ✅ ${modelId} - AVAILABLE`);
          availableTargets.push(modelId);
        } else {
          console.log(`  ❌ ${modelId} - NOT FOUND`);
        }
      });

      if (availableTargets.length > 0) {
        alert(`✅ Found ${availableTargets.length} available free models! Check console for details. Recommended: ${availableTargets[0]}`);
      } else {
        alert('❌ No target free models found. Check console for available alternatives.');
      }

    } catch (error: any) {
      console.error('❌ Models check failed:', error);
      alert(`❌ Models check failed: ${error.message}`);
    }
  };

  // Test OpenRouter API Connectivity
  const testOpenRouterConnectivity = async () => {
    console.log('🔍 Testing OpenRouter API connectivity...');

    const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
    const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

    console.log('API Key check:', {
      hasKey: !!API_KEY,
      keyLength: API_KEY?.length || 0,
      keyPrefix: API_KEY?.substring(0, 15) || 'undefined'
    });

    if (!API_KEY) {
      alert('❌ No API key found');
      return;
    }

    try {
      console.log('🚀 Making direct API call to OpenRouter...');

      const requestBody = {
        model: 'microsoft/phi-3-mini-128k-instruct:free',
        messages: [
          {
            role: 'user',
            content: 'Say hello in one word'
          }
        ],
        max_tokens: 10,
        temperature: 0.7
      };

      console.log('Request details:', {
        url: API_URL,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY.substring(0, 15)}...`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'PromptShare AI Test'
        },
        body: requestBody
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'PromptShare AI Test',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('✅ API call successful!');
        console.log('Response data:', data);
        alert(`✅ OpenRouter API working! Response: ${data.choices?.[0]?.message?.content || 'No content'}`);
      } else {
        console.error('❌ API call failed');
        alert(`❌ API call failed: ${response.status} - ${responseText}`);
      }
    } catch (error: any) {
      console.error('❌ API test error:', error);
      alert(`❌ API test error: ${error.message}`);
    }
  };

  // Test AI Enhancement
  const testAIEnhancement = async () => {
    setAiTest({ status: 'Testing...', message: 'Testing AI prompt enhancement and image analysis...' });

    try {
      if (!AIService.isAIAvailable()) {
        setAiTest({
          status: 'Unavailable',
          message: 'AI service not available - OpenRouter API key not configured'
        });
        return;
      }

      console.log('🤖 Testing AI enhancement...');

      // Test 1: Basic prompt enhancement
      const testPrompt = 'a cat';
      console.log('Testing prompt enhancement with:', testPrompt);
      const result = await AIService.enhancePrompt(testPrompt);

      // Test 2: Cache functionality
      console.log('Testing cache functionality...');
      const cachedResult = await AIService.enhancePrompt(testPrompt);
      const cacheWorking = result.processingTime !== cachedResult.processingTime;

      // Test 3: Different prompt to ensure uniqueness
      const testPrompt2 = 'a dog';
      console.log('Testing prompt uniqueness with:', testPrompt2);
      const result2 = await AIService.enhancePrompt(testPrompt2);
      const uniqueResults = result.enhanced[0].prompt !== result2.enhanced[0].prompt;

      // Test 4: Cache statistics
      const cacheStats = AIService.getCacheStats();
      console.log('Cache statistics:', cacheStats);

      setAiTest({
        status: 'Success',
        message: `✅ Enhanced "${testPrompt}" (${result.processingTime}ms) ✅ Cache working: ${cacheWorking} ✅ Unique results: ${uniqueResults} ✅ Cache entries: ${cacheStats.promptCache.size} prompts, ${cacheStats.imageCache.size} images`
      });

      console.log('✅ AI enhancement test successful:', {
        result,
        cacheWorking,
        uniqueResults,
        cacheStats
      });
    } catch (error: any) {
      setAiTest({
        status: 'Error',
        message: `AI enhancement failed: ${error.message}`
      });
      console.error('❌ AI enhancement test failed:', error);
    }
  };

  // Test Real-time Features
  const testRealtimeFeatures = async () => {
    setRealtimeTest({ status: 'Testing...', message: 'Testing real-time connection...' });

    try {
      if (!user?.id) {
        setRealtimeTest({
          status: 'Error',
          message: 'User not authenticated - cannot test real-time features'
        });
        return;
      }

      console.log('⚡ Testing real-time features for user:', user.id);

      // Initialize real-time service
      await RealtimeService.initialize(user.id);

      // Check connection state
      const connectionState = RealtimeService.getConnectionState();

      if (connectionState.connected) {
        setRealtimeTest({
          status: 'Success',
          message: `Real-time service connected successfully. Reconnect attempts: ${connectionState.reconnectAttempts}`
        });
        console.log('✅ Real-time test successful:', connectionState);
      } else {
        setRealtimeTest({
          status: 'Warning',
          message: `Real-time service not connected. Error: ${connectionState.error || 'Unknown'}`
        });
        console.log('⚠️ Real-time test warning:', connectionState);
      }
    } catch (error: any) {
      setRealtimeTest({
        status: 'Error',
        message: `Real-time test failed: ${error.message}`
      });
      console.error('❌ Real-time test failed:', error);
    }
  };

  // Test Prompt Transformation Engine
  const testTransformationEngine = async () => {
    setTransformationTest({
      status: 'Testing...',
      message: 'Running comprehensive prompt transformation tests...'
    });

    try {
      console.log('🧪 Starting prompt transformation engine test...');

      // Run comprehensive test
      const testResults = await TransformationEngineTest.runComprehensiveTest();

      if (testResults.overallSuccess) {
        setTransformationTest({
          status: 'Success',
          message: `All tests passed! Pass rate: ${testResults.passRate.toFixed(1)}%`,
          passRate: testResults.passRate,
          averageQuality: testResults.summary.averageQualityScore
        });
        console.log('✅ Transformation engine test successful:', testResults);
      } else {
        setTransformationTest({
          status: 'Warning',
          message: `Some tests failed. Pass rate: ${testResults.passRate.toFixed(1)}%`,
          passRate: testResults.passRate,
          averageQuality: testResults.summary.averageQualityScore
        });
        console.log('⚠️ Transformation engine test partial success:', testResults);
      }

      // Log detailed results
      console.log('📊 Detailed test results:', testResults.results);
      console.log('📈 Summary statistics:', testResults.summary);

    } catch (error: any) {
      setTransformationTest({
        status: 'Error',
        message: `Transformation test failed: ${error.message}`
      });
      console.error('❌ Transformation engine test failed:', error);
    }
  };

  // Test data for media display
  const testProfile: Profile = {
    id: 'test-user',
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    bio: 'Test user for media display',
    website: null,
    verified: false,
    followers_count: 100,
    following_count: 50,
    posts_count: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // High-quality test images (different aspect ratios)
  const testImages = {
    landscape: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
    portrait: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1920',
    square: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=1080&h=1080'
  };

  // Test videos (different aspect ratios)
  const testVideos = {
    horizontal: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    vertical: 'https://sample-videos.com/zip/10/mp4/480/SampleVideo_480x854_1mb_mp4.mp4' // This is a vertical video
  };

  const testImagePost: Post = {
    id: 'test-image-post',
    user_id: 'test-user',
    title: 'Test Image Post',
    description: 'Testing image display functionality',
    prompt: 'A beautiful landscape with mountains and lakes',
    tags: ['test', 'image'],
    media_urls: [testImages.portrait],
    media_type: 'image',
    allow_copy_prompt: true,
    status: 'published',
    likes_count: 10,
    comments_count: 5,
    saves_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: testProfile
  };

  const testVideoPost: Post = {
    id: 'test-video-post',
    user_id: 'test-user',
    title: 'Test Video Post',
    description: 'Testing video display functionality',
    prompt: 'A short video demonstration',
    tags: ['test', 'video'],
    media_urls: [testVideos.horizontal],
    media_type: 'video',
    allow_copy_prompt: true,
    status: 'published',
    likes_count: 15,
    comments_count: 8,
    saves_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: testProfile
  };

  const testCarouselPost: Post = {
    id: 'test-carousel-post',
    user_id: 'test-user',
    title: 'Test Carousel Post',
    description: 'Testing carousel display functionality',
    prompt: 'Multiple images in a carousel',
    tags: ['test', 'carousel'],
    media_urls: [testImages.landscape, testImages.portrait, testImages.square],
    media_type: 'carousel',
    allow_copy_prompt: true,
    status: 'published',
    likes_count: 20,
    comments_count: 12,
    saves_count: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: testProfile
  };

  const testReelHorizontal: Reel = {
    id: 'test-reel-horizontal',
    user_id: 'test-user',
    title: 'Horizontal Video Test',
    video_url: testVideos.horizontal,
    thumbnail_url: null,
    prompt: 'A horizontal test video reel',
    tags: ['test', 'reel', 'horizontal'],
    allow_copy_prompt: true,
    likes_count: 25,
    comments_count: 15,
    saves_count: 10,
    views_count: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: testProfile
  };

  const testReelVertical: Reel = {
    id: 'test-reel-vertical',
    user_id: 'test-user',
    title: 'Vertical Video Test',
    video_url: testVideos.vertical,
    thumbnail_url: null,
    prompt: 'A vertical test video reel (portrait mode)',
    tags: ['test', 'reel', 'vertical'],
    allow_copy_prompt: true,
    likes_count: 35,
    comments_count: 20,
    saves_count: 15,
    views_count: 150,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: testProfile
  };

  const testTool: Tool = {
    id: 'test-tool',
    user_id: 'test-user',
    name: 'Test AI Tool',
    description: 'A test AI tool for demonstration',
    website_url: 'https://example.com',
    logo_url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=100',
    category: 'Test Category',
    tags: ['test', 'ai'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: testProfile
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            PromptShare Test Page
          </h1>

          {/* Environment Debug */}
          <div className="mb-6">
            <DebugEnv />
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                ✅ Application is Working!
              </h2>
              <p className="text-green-700 dark:text-green-300">
                If you can see this page, the React application is running correctly.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-2">
                🔧 Debug Information
              </h2>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Environment: {import.meta.env.MODE}</li>
                <li>• Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Configured' : 'Missing'}</li>
                <li>• Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configured' : 'Missing'}</li>
                <li>• OpenRouter API: {import.meta.env.VITE_OPENROUTER_API_KEY ? 'Configured' : 'Missing'}</li>
                <li>• User: {user ? `${user.email} (${isOfflineMode ? 'Offline' : 'Online'})` : 'Not logged in'}</li>
                <li>• Connection: {connectionStatus}</li>
                <li>• Tools Test: {toolsTest.status} ({toolsTest.count} tools) {toolsTest.error && `- ${toolsTest.error}`}</li>
                <li>• Posts Test: {postsTest.status} ({postsTest.count} posts) {postsTest.error && `- ${postsTest.error}`}</li>
                <li>• Reels Test: {reelsTest.status} ({reelsTest.count} reels) {reelsTest.error && `- ${reelsTest.error}`}</li>
                <li>• Upload Test: {uploadTest.status} {uploadTest.message && `- ${uploadTest.message}`}</li>
                <li>• Post Creation Test: {postCreationTest.status} {postCreationTest.message && `- ${postCreationTest.message}`}</li>
                <li>• AI Enhancement Test: {aiTest.status} {aiTest.message && `- ${aiTest.message}`}</li>
                <li>• Real-time Test: {realtimeTest.status} {realtimeTest.message && `- ${realtimeTest.message}`}</li>
                <li>• Transformation Engine Test: {transformationTest.status} {transformationTest.message && `- ${transformationTest.message}`} {transformationTest.passRate && `(Pass Rate: ${transformationTest.passRate.toFixed(1)}%, Avg Quality: ${transformationTest.averageQuality})`}</li>
                <li>• <strong>Reels Workflow:</strong> Upload vertical video → Create page → Should appear in /reels</li>
                <li>• Timestamp: {new Date().toISOString()}</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                🚀 Quick Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = '/create'}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  🎬 Test Upload (Go to Create Page)
                </button>
                <button
                  onClick={async () => {
                    if (!user) {
                      setUploadTest({ status: 'Failed', message: 'Please log in first' });
                      return;
                    }
                    setUploadTest({ status: 'Testing...', message: 'Running upload test...' });
                    const result = await testFileUpload(user.id);
                    setUploadTest({
                      status: result.success ? 'Success' : 'Failed',
                      message: result.message
                    });
                  }}
                  className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  🧪 Test File Upload (Storage RLS)
                </button>
                <button
                  onClick={async () => {
                    if (!user) {
                      setPostCreationTest({ status: 'Failed', message: 'Please log in first' });
                      return;
                    }
                    setPostCreationTest({ status: 'Testing...', message: 'Testing post creation...' });

                    try {
                      const testPostData = {
                        user_id: user.id,
                        title: 'Test Post - RLS Policy Check',
                        description: 'This is a test post to verify RLS policies are working correctly.',
                        prompt: 'Test prompt for RLS verification',
                        tags: ['test', 'rls', 'debug'],
                        media_urls: [],
                        media_type: null,
                        allow_copy_prompt: true,
                        status: 'published' as const
                      };

                      console.log('🧪 Testing post creation with data:', testPostData);
                      const result = await DatabaseService.createPost(testPostData);
                      console.log('✅ Test post created successfully:', result);

                      setPostCreationTest({
                        status: 'Success',
                        message: `Post created successfully! ID: ${result.id}`
                      });
                    } catch (error: any) {
                      console.error('❌ Test post creation failed:', error);
                      setPostCreationTest({
                        status: 'Failed',
                        message: error.message || 'Unknown error occurred'
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  📝 Test Post Creation (RLS Policies)
                </button>
                <button
                  onClick={() => window.location.href = '/reels'}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  📱 View Reels Page
                </button>
                <button
                  onClick={() => window.location.href = '/auth/login'}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Go to Login Page
                </button>
                <button
                  onClick={testAIEnhancement}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  🤖 Test AI Prompt Enhancement
                </button>
                <button
                  onClick={testSaveAndLikeFunctionality}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  💾 Test Save/Like Functions
                </button>
                <button
                  onClick={testRawAPIResponse}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  🔍 Test AI Enhancement
                </button>
                <button
                  onClick={testCreatePageAI}
                  className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  🎨 Test Create Page AI
                </button>
                <button
                  onClick={checkAvailableFreeModels}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  📋 Check Available Models
                </button>
                <button
                  onClick={testMultipleModels}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  🔄 Test Multiple Models
                </button>
                <button
                  onClick={testOpenRouterConnectivity}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  🌐 Test OpenRouter API
                </button>
                <button
                  onClick={testTransformationEngine}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-colors"
                >
                  ✨ Test Prompt Transformation Engine
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        console.log('🖼️ Testing image analysis with:', file.name);
                        try {
                          const analysis = await AIService.analyzeImage(file);
                          console.log('✅ Image analysis successful:', analysis);
                          alert(`Image analyzed successfully!\n\nDescription: ${analysis.description}\n\nStyle: ${analysis.detectedStyle}\n\nText: ${analysis.textElements || 'None detected'}\n\nPrompts generated: ${analysis.enhancedPrompts.length}`);
                        } catch (error: any) {
                          console.error('❌ Image analysis failed:', error);
                          alert(`Image analysis failed: ${error.message}`);
                        }
                      }
                    };
                    input.click();
                  }}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  🖼️ Test Image Analysis
                </button>
                <button
                  onClick={testRealtimeFeatures}
                  className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  ⚡ Test Real-time Features
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Clear Storage & Refresh
                </button>
              </div>
            </div>

            {/* Debugging Section */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h2 className="text-lg font-semibold text-orange-800 dark:text-orange-400 mb-2">
                🔍 Upload & Reel Debugging
              </h2>
              <div className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                <p><strong>Expected Workflow:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Upload vertical video (height &gt; width) on Create page</li>
                  <li>SmartFileUpload should detect orientation and show "Reel (Vertical Video)"</li>
                  <li>Create page should call DatabaseService.createReel() instead of createPost()</li>
                  <li>Reel should be stored in 'reels' table, not 'posts' table</li>
                  <li>Reels page should fetch from 'reels' table and display the video</li>
                </ol>
                <p className="mt-3"><strong>Current Status:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Reels in database: {reelsTest.count}</li>
                  <li>Video posts in database: Found videos in posts table (should be in reels table)</li>
                  <li>Storage policies: ✅ Fixed (RLS policies added)</li>
                  <li>Video detection: Enhanced with better debugging</li>
                </ul>
                <p className="mt-3 p-2 bg-orange-100 dark:bg-orange-800/30 rounded text-xs">
                  <strong>Debug Tip:</strong> Check browser console when uploading videos to see orientation detection logs.
                </p>
              </div>
            </div>

            {/* Media Display Tests */}
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-400 mb-4">
                🎨 Media Display Tests
              </h2>
              <p className="text-purple-700 dark:text-purple-300 mb-4">
                Testing image, video, and carousel display functionality with original quality preservation:
              </p>

              <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Media Quality Tests:</h4>
                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                  <li>• <strong>Portrait Image:</strong> {testImages.portrait.includes('1920') ? 'High-res (1080x1920)' : 'Standard'}</li>
                  <li>• <strong>Landscape Image:</strong> {testImages.landscape.includes('1920') ? 'High-res (1920x1080)' : 'Standard'}</li>
                  <li>• <strong>Square Image:</strong> {testImages.square.includes('1080') ? 'High-res (1080x1080)' : 'Standard'}</li>
                  <li>• <strong>Videos:</strong> Original aspect ratios preserved</li>
                  <li>• <strong>Expected:</strong> Images should display at original quality without cropping</li>
                  <li>• <strong>Expected:</strong> Vertical videos should fill height, horizontal videos should fill width</li>
                </ul>
              </div>

              <div className="space-y-6">
                {/* Image Post Test */}
                <div>
                  <h3 className="text-md font-medium text-purple-800 dark:text-purple-400 mb-2">
                    Image Post Test
                  </h3>
                  <PostCard post={testImagePost} />
                </div>

                {/* Video Post Test */}
                <div>
                  <h3 className="text-md font-medium text-purple-800 dark:text-purple-400 mb-2">
                    Video Post Test
                  </h3>
                  <PostCard post={testVideoPost} />
                </div>

                {/* Carousel Post Test */}
                <div>
                  <h3 className="text-md font-medium text-purple-800 dark:text-purple-400 mb-2">
                    Carousel Post Test
                  </h3>
                  <PostCard post={testCarouselPost} />
                </div>

                {/* Tool Card Test */}
                <div>
                  <h3 className="text-md font-medium text-purple-800 dark:text-purple-400 mb-2">
                    Tool Card Test
                  </h3>
                  <ToolCard tool={testTool} />
                </div>

                {/* Horizontal Reel Test */}
                <div>
                  <h3 className="text-md font-medium text-purple-800 dark:text-purple-400 mb-2">
                    Horizontal Reel Test (Preview)
                  </h3>
                  <div className="bg-black rounded-lg overflow-hidden" style={{ height: '300px' }}>
                    <ReelCard reel={testReelHorizontal} isVisible={true} />
                  </div>
                </div>

                {/* Vertical Reel Test */}
                <div>
                  <h3 className="text-md font-medium text-purple-800 dark:text-purple-400 mb-2">
                    Vertical Reel Test (Preview) - Should show full video
                  </h3>
                  <div className="bg-black rounded-lg overflow-hidden" style={{ height: '400px' }}>
                    <ReelCard reel={testReelVertical} isVisible={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Image Test */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            🧪 Simple Image Analysis Test
          </h2>
          <SimpleImageTest />
        </div>

        {/* Image Analysis Debugger */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            🖼️ Advanced Image Analysis Debugger
          </h2>
          <ImageAnalysisDebugger />
        </div>

        {/* 4-Style Enhancement Test */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ 4-Style Enhancement Test
          </h2>
          <Test4StyleEnhancement />
        </div>

        {/* Chat Enhancement Test */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            💬 Chat.tsx Enhancement Test
          </h2>
          <TestChatEnhancement />
        </div>
      </div>
    </PageLayout>
  );
};

export default TestPage;
