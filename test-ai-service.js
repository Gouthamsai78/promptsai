// Test script to verify AI service functionality
// Run with: node test-ai-service.js

import fs from 'fs';
import fetch from 'node-fetch';

console.log('🧪 Testing AI Service Functionality...\n');

// Load environment variables
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

// Test 1: Check API key
console.log('1. API Key Check:');
console.log('   Present:', !!API_KEY);
console.log('   Length:', API_KEY?.length || 0);
console.log('   Format:', API_KEY?.startsWith('sk-or-v1-') ? 'Valid' : 'Invalid');

if (!API_KEY || !API_KEY.startsWith('sk-or-v1-')) {
  console.error('❌ Invalid or missing API key');
  process.exit(1);
}

// Test 2: Simple text completion
async function testTextCompletion() {
  console.log('\n2. Testing Text Completion...');
  
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
            content: 'Respond with exactly: "AI service is working correctly"'
          }
        ],
        max_tokens: 20,
        temperature: 0.1
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      console.log('   ✅ Text API Working');
      console.log('   Response:', content);
      return true;
    } else {
      const errorText = await response.text();
      console.log('   ❌ Text API Failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Text API Error:', error.message);
    return false;
  }
}

// Test 3: Vision API with test image
async function testVisionAPI() {
  console.log('\n3. Testing Vision API...');
  
  // Simple 1x1 pixel PNG in base64
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
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
                text: 'Describe this image in one sentence.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: testImage
                }
              }
            ]
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      console.log('   ✅ Vision API Working');
      console.log('   Response:', content);
      return true;
    } else {
      const errorText = await response.text();
      console.log('   ❌ Vision API Failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Vision API Error:', error.message);
    return false;
  }
}

// Test 4: Structured JSON response
async function testStructuredResponse() {
  console.log('\n4. Testing Structured JSON Response...');
  
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'PromptShare AI JSON Test',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an image analyst. Return ONLY valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and return ONLY valid JSON: {"description": "brief description", "detectedStyle": "style", "suggestedTags": ["tag1", "tag2"], "enhancedPrompts": [{"id": "test_1", "style": "photographic", "prompt": "test prompt", "description": "test description"}]}'
              },
              {
                type: 'image_url',
                image_url: {
                  url: testImage
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      console.log('   Raw Response:', content);
      
      try {
        // Try to extract and parse JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('   ✅ Structured Response Working');
          console.log('   Parsed JSON:', JSON.stringify(parsed, null, 2));
          return true;
        } else {
          console.log('   ⚠️  No JSON found in response');
          return false;
        }
      } catch (parseError) {
        console.log('   ❌ JSON Parse Error:', parseError.message);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ Structured Response Failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Structured Response Error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const textWorking = await testTextCompletion();
  const visionWorking = await testVisionAPI();
  const structuredWorking = await testStructuredResponse();
  
  console.log('\n📊 Test Results:');
  console.log('   Text API:', textWorking ? '✅ Working' : '❌ Failed');
  console.log('   Vision API:', visionWorking ? '✅ Working' : '❌ Failed');
  console.log('   Structured JSON:', structuredWorking ? '✅ Working' : '❌ Failed');
  
  if (textWorking && visionWorking && structuredWorking) {
    console.log('\n🎉 All tests passed! AI service is ready for real image analysis.');
  } else {
    console.log('\n⚠️  Some tests failed. Check your API configuration and network connection.');
  }
}

runAllTests().catch(console.error);
