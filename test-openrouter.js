// Test script to verify OpenRouter API connectivity and model availability
import fs from 'fs';
import https from 'https';
import { URL } from 'url';

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
const MODELS_URL = 'https://openrouter.ai/api/v1/models';
const TEST_MODEL = 'qwen/qwen2.5-vl-32b-instruct:free';
const VISION_MODEL = 'qwen/qwen2.5-vl-32b-instruct:free';

// Test prompt enhancement like the AI service does
const TEST_PROMPT = 'a cat';

async function testOpenRouterAPI() {
  console.log('🔍 Testing OpenRouter API Integration...\n');
  
  // 1. Check API key
  console.log('1. API Key Check:');
  console.log('   Has API key:', !!API_KEY);
  console.log('   Key length:', API_KEY?.length || 0);
  console.log('   Key prefix:', API_KEY?.substring(0, 15) || 'undefined');
  
  if (!API_KEY) {
    console.error('❌ No API key found in .env.local');
    return;
  }
  
  // 2. Test models endpoint
  console.log('\n2. Testing Models Endpoint:');
  try {
    const modelsResponse = await makeRequest(MODELS_URL, 'GET');
    console.log('   ✅ Models endpoint accessible');
    
    const models = JSON.parse(modelsResponse.data);
    const targetModel = models.data.find(m => m.id === TEST_MODEL);
    
    if (targetModel) {
      console.log('   ✅ Target model found:', TEST_MODEL);
      console.log('   Model details:', {
        name: targetModel.name,
        context_length: targetModel.context_length,
        pricing: targetModel.pricing
      });
    } else {
      console.log('   ❌ Target model NOT found:', TEST_MODEL);
      console.log('   Available free models:');
      const freeModels = models.data.filter(m => 
        m.pricing.prompt === "0" && m.id.includes('free')
      ).slice(0, 5);
      freeModels.forEach(m => console.log('     -', m.id));
    }
  } catch (error) {
    console.error('   ❌ Models endpoint error:', error.message);
  }
  
  // 3. Test chat completions endpoint
  console.log('\n3. Testing Chat Completions Endpoint:');
  try {
    const testPayload = {
      model: TEST_MODEL,
      messages: [
        {
          role: "user",
          content: "Say hello in one word"
        }
      ],
      max_tokens: 10,
      temperature: 0.7
    };

    const response = await makeRequest(API_URL, 'POST', testPayload);
    console.log('   Response status:', response.status);

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log('   ✅ Chat completion successful');
      console.log('   Response:', data.choices?.[0]?.message?.content || 'No content');
    } else {
      console.log('   ❌ Chat completion failed');
      console.log('   Error:', response.data);
    }
  } catch (error) {
    console.error('   ❌ Chat completion error:', error.message);
  }

  // 4. Test prompt enhancement like the AI service
  console.log('\n4. Testing Prompt Enhancement (like AI service):');
  try {
    const enhancementPayload = {
      model: TEST_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert AI prompt engineer. Your job is to automatically enhance basic prompts into professional, detailed prompts that will generate high-quality AI content.

CRITICAL RULES:
1. NEVER ask questions or request clarification
2. Automatically infer the best enhancements based on the input
3. Always provide exactly 4 different style variants
4. Each enhanced prompt should be 2-4x longer than the original
5. Add professional technical details, lighting, composition, and quality modifiers
6. Return ONLY valid JSON, no other text

For the input prompt, create 4 enhanced versions in these exact styles:
- photographic: Professional photography with camera settings, lighting, composition
- artistic: Fine art style with artistic techniques, mediums, famous artist influences
- cinematic: Movie/film style with dramatic lighting, camera angles, mood
- digital_art: Modern digital art with rendering techniques, effects, digital mediums

Return JSON in this exact format:
{
  "enhanced": [
    {
      "id": "photo_1",
      "style": "photographic",
      "prompt": "enhanced prompt here",
      "description": "Professional photography style"
    },
    {
      "id": "art_1",
      "style": "artistic",
      "prompt": "enhanced prompt here",
      "description": "Fine art style"
    },
    {
      "id": "cinema_1",
      "style": "cinematic",
      "prompt": "enhanced prompt here",
      "description": "Cinematic style"
    },
    {
      "id": "digital_1",
      "style": "digital_art",
      "prompt": "enhanced prompt here",
      "description": "Digital art style"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Enhance this basic prompt: "${TEST_PROMPT}"

Automatically add professional details like:
- Technical specifications (camera settings, resolution, etc.)
- Lighting and composition details
- Style and mood descriptors
- Quality enhancers (8K, ultra-detailed, masterpiece, etc.)
- Artistic techniques and influences

Make each version significantly more detailed and professional while maintaining the core subject.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.8
    };
    
    const enhancementResponse = await makeRequest(API_URL, 'POST', enhancementPayload);
    console.log('   Enhancement response status:', enhancementResponse.status);

    if (enhancementResponse.status === 200) {
      const enhancementData = JSON.parse(enhancementResponse.data);
      console.log('   ✅ Prompt enhancement successful');

      const content = enhancementData.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsedEnhancement = JSON.parse(content);
          console.log('   ✅ Enhancement JSON parsed successfully');
          console.log('   Enhanced prompts count:', parsedEnhancement.enhanced?.length || 0);

          if (parsedEnhancement.enhanced && parsedEnhancement.enhanced.length > 0) {
            console.log('   Sample enhanced prompt (photographic):');
            console.log('   ', parsedEnhancement.enhanced[0]?.prompt?.substring(0, 100) + '...');
          }
        } catch (parseError) {
          console.log('   ❌ Failed to parse enhancement JSON');
          console.log('   Raw content:', content.substring(0, 200) + '...');
        }
      } else {
        console.log('   ❌ No content in enhancement response');
      }
    } else {
      console.log('   ❌ Prompt enhancement failed');
      console.log('   Error:', enhancementResponse.data);
    }
  } catch (error) {
    console.error('   ❌ Prompt enhancement error:', error.message);
  }

  // 5. Test vision model for image analysis
  console.log('\n5. Testing Vision Model for Image Analysis:');
  try {
    const visionPayload = {
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this image in detail. What do you see?'
            },
            {
              type: 'image_url',
              image_url: {
                url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    };

    const visionResponse = await makeRequest(API_URL, 'POST', visionPayload);
    console.log('   Vision response status:', visionResponse.status);

    if (visionResponse.status === 200) {
      const visionData = JSON.parse(visionResponse.data);
      console.log('   ✅ Vision model working');
      console.log('   Response:', visionData.choices?.[0]?.message?.content?.substring(0, 200) + '...');
    } else {
      console.log('   ❌ Vision model failed');
      console.log('   Error:', visionResponse.data);
    }
  } catch (error) {
    console.error('   ❌ Vision model error:', error.message);
  }

  // 6. Test JSON extraction from markdown
  console.log('\n6. Testing JSON Extraction from Markdown:');

  const testResponses = [
    '```json\n{"test": "value"}\n```',
    '```\n{"test": "value"}\n```',
    'Some text before\n```json\n{"test": "value"}\n```\nSome text after',
    '{"test": "value"}',
    'Text before {"test": "value"} text after'
  ];

  testResponses.forEach((response, index) => {
    console.log(`   Test ${index + 1}: ${response.replace(/\n/g, '\\n')}`);

    // Simulate the extraction logic
    let cleaned = response.trim();
    const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
    const match = cleaned.match(jsonBlockRegex);

    if (match) {
      cleaned = match[1].trim();
      console.log(`   ✅ Extracted from markdown: ${cleaned}`);
    } else {
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        console.log(`   ✅ Extracted JSON boundaries: ${cleaned}`);
      } else {
        console.log(`   ❌ No JSON found: ${cleaned}`);
      }
    }

    try {
      JSON.parse(cleaned);
      console.log(`   ✅ Valid JSON after extraction`);
    } catch (e) {
      console.log(`   ❌ Invalid JSON after extraction: ${e.message}`);
    }
    console.log('');
  });

  // 7. Test prompt type detection
  console.log('\n7. Testing Prompt Type Detection:');

  const testPrompts = [
    'Write a blog post about AI in education',
    'a beautiful woman in a garden',
    'How to learn programming',
    'portrait of a cat, professional photography',
    'Explain quantum computing',
    'stunning landscape with mountains and lake',
    'Create a business plan for a startup',
    'digital art of a futuristic city'
  ];

  testPrompts.forEach((prompt, index) => {
    // Simulate the detection logic from AIService
    const imageKeywords = [
      'photo', 'picture', 'image', 'portrait', 'landscape', 'artwork', 'painting', 'drawing',
      'render', 'illustration', 'design', 'visual', 'scene', 'character', 'style',
      'lighting', 'composition', 'camera', 'shot', 'angle', 'color', 'texture',
      'realistic', 'artistic', 'cinematic', 'digital art', 'concept art',
      'a woman', 'a man', 'a person', 'a cat', 'a dog', 'a house', 'a car',
      'beautiful', 'stunning', 'detailed', 'masterpiece', 'high quality'
    ];

    const lowerText = prompt.toLowerCase();

    const nonImageKeywords = [
      'write', 'blog post', 'article', 'essay', 'story', 'script', 'code',
      'explain', 'how to', 'tutorial', 'guide', 'help me', 'what is',
      'create a plan', 'analyze', 'summarize', 'translate', 'calculate'
    ];

    let isImagePrompt = false;

    if (nonImageKeywords.some(keyword => lowerText.includes(keyword))) {
      isImagePrompt = false;
    } else if (imageKeywords.some(keyword => lowerText.includes(keyword))) {
      isImagePrompt = true;
    } else {
      isImagePrompt = prompt.trim().split(' ').length <= 10;
    }

    console.log(`   ${index + 1}. "${prompt}"`);
    console.log(`      → ${isImagePrompt ? '🎨 Image Generation Prompt' : '💬 General Chat'}`);
    console.log('');
  });

  console.log('\n🏁 OpenRouter API test completed');
}

function makeRequest(url, method = 'GET', payload = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestData = payload ? JSON.stringify(payload) : null;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'PromptShare AI Test',
      },
    };
    
    if (requestData) {
      options.headers['Content-Length'] = Buffer.byteLength(requestData);
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        statusText: res.statusMessage, 
        data 
      }));
    });
    
    req.on('error', reject);
    
    if (requestData) {
      req.write(requestData);
    }
    
    req.end();
  });
}

testOpenRouterAPI().catch(console.error);
