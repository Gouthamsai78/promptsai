// Debug script to test AI availability and OpenRouter API connectivity
// Run with: node debug-ai-availability.js

import fs from 'fs';

console.log('🔍 Testing AI Service Availability...\n');

// Load environment variables manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const API_KEY = envVars.VITE_OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = 'qwen/qwen2.5-vl-32b-instruct:free';

console.log('1. Environment Check:');
console.log('   API Key Present:', !!API_KEY);
console.log('   API Key Length:', API_KEY?.length || 0);
console.log('   API Key Prefix:', API_KEY?.substring(0, 20) || 'undefined');
console.log('   API URL:', API_URL);
console.log('   Vision Model:', VISION_MODEL);

if (!API_KEY) {
  console.error('❌ No API key found in .env.local');
  process.exit(1);
}

// Test 1: Simple text completion
async function testTextCompletion() {
  console.log('\n2. Testing Text Completion API...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'PromptShare AI Test',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from OpenRouter!" if you can read this.'
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Text API Working!');
      console.log('   Response:', data.choices?.[0]?.message?.content || 'No content');
      return true;
    } else {
      const errorText = await response.text();
      console.log('   ❌ Text API Failed:', errorText);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Text API Error:', error.message);
    return false;
  }
}

// Test 2: Vision API with base64 image
async function testVisionAPI() {
  console.log('\n3. Testing Vision API...');
  
  // Create a simple test image (1x1 pixel PNG in base64)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'PromptShare AI Vision Test',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this image briefly.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: testImageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Vision API Working!');
      console.log('   Response:', data.choices?.[0]?.message?.content || 'No content');
      return true;
    } else {
      const errorText = await response.text();
      console.log('   ❌ Vision API Failed:', errorText);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Vision API Error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const textWorking = await testTextCompletion();
  const visionWorking = await testVisionAPI();
  
  console.log('\n4. Summary:');
  console.log('   Text API:', textWorking ? '✅ Working' : '❌ Failed');
  console.log('   Vision API:', visionWorking ? '✅ Working' : '❌ Failed');
  
  if (textWorking && visionWorking) {
    console.log('\n🎉 All APIs are working! The issue is likely in the frontend code.');
  } else {
    console.log('\n⚠️  API connectivity issues detected. Check your API key and network.');
  }
}

runTests().catch(console.error);
