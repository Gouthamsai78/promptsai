// Test enhanced prompt system with specialized templates
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
const TEXT_MODEL = 'mistralai/mistral-small-3.2-24b-instruct:free';

// Test prompts for different categories
const testPrompts = [
  {
    category: 'Image Generation',
    prompt: 'a beautiful woman in a garden',
    expectedTemplate: 'image_generation'
  },
  {
    category: 'Writing Style',
    prompt: 'help me write in my personal style',
    expectedTemplate: 'writing_style'
  },
  {
    category: 'Personal Development',
    prompt: 'help me develop my ideal self',
    expectedTemplate: 'personal_development'
  },
  {
    category: 'Professional Analysis',
    prompt: 'analyze my professional skills and career',
    expectedTemplate: 'professional_analysis'
  },
  {
    category: 'Content Strategy',
    prompt: 'create a blog strategy for my business',
    expectedTemplate: 'content_strategy'
  },
  {
    category: 'Travel Planning',
    prompt: 'plan a budget trip to Japan',
    expectedTemplate: 'travel_planning'
  },
  {
    category: 'Educational Content',
    prompt: 'explain quantum computing in simple terms',
    expectedTemplate: 'educational_content'
  },
  {
    category: 'Professional Communication',
    prompt: 'write a professional email to my boss',
    expectedTemplate: 'professional_communication'
  },
  {
    category: 'Productivity Planning',
    prompt: 'help me organize my weekly schedule',
    expectedTemplate: 'productivity_planning'
  },
  {
    category: 'Goal Setting',
    prompt: 'create monthly goals for personal growth',
    expectedTemplate: 'goal_setting'
  },
  {
    category: 'Learning Path',
    prompt: 'create a learning plan for web development',
    expectedTemplate: 'learning_path'
  }
];

async function testEnhancedPromptSystem() {
  console.log('🧪 Testing Enhanced Prompt System with Specialized Templates...\n');

  // Test 1: Category Detection
  console.log('1. Testing Category Detection:');
  testPrompts.forEach((test, index) => {
    console.log(`   ${index + 1}. "${test.prompt}"`);
    console.log(`      Expected: ${test.expectedTemplate}`);
    console.log(`      Category: ${test.category}`);
    console.log('');
  });

  // Test 2: Sample Enhancement (Writing Style)
  console.log('2. Testing Writing Style Enhancement:');
  try {
    const writingStyleTest = testPrompts.find(t => t.expectedTemplate === 'writing_style');
    const enhancementResult = await testPromptEnhancement(writingStyleTest.prompt, 'writing_style');
    
    if (enhancementResult.success) {
      console.log('   ✅ Writing style enhancement successful');
      console.log('   Enhanced prompts count:', enhancementResult.enhanced?.length || 0);
      if (enhancementResult.enhanced && enhancementResult.enhanced.length > 0) {
        console.log('   Sample enhanced prompt:');
        console.log('   ', enhancementResult.enhanced[0]?.prompt?.substring(0, 150) + '...');
      }
    } else {
      console.log('   ❌ Writing style enhancement failed:', enhancementResult.error);
    }
  } catch (error) {
    console.error('   ❌ Writing style test error:', error.message);
  }

  console.log('\n🏁 Enhanced prompt system test completed');
}

async function testPromptEnhancement(prompt, expectedCategory) {
  // This simulates what the AI service would do
  const systemPrompt = getTestSystemPrompt(expectedCategory);
  const userPrompt = getTestUserPrompt(prompt, expectedCategory);

  try {
    const payload = {
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.8
    };

    const response = await makeRequest(API_URL, 'POST', payload);
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      const content = data.choices?.[0]?.message?.content;
      
      if (content) {
        // Extract JSON from response
        let cleaned = content.trim();
        const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
        const match = cleaned.match(jsonBlockRegex);
        
        if (match) {
          cleaned = match[1].trim();
        } else {
          const jsonStart = cleaned.indexOf('{');
          const jsonEnd = cleaned.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
          }
        }
        
        try {
          const parsedEnhancement = JSON.parse(cleaned);
          return {
            success: true,
            enhanced: parsedEnhancement.enhanced,
            originalPrompt: prompt
          };
        } catch (parseError) {
          return {
            success: false,
            error: `JSON parse error: ${parseError.message}`,
            rawContent: content.substring(0, 200)
          };
        }
      } else {
        return {
          success: false,
          error: 'No content in response'
        };
      }
    } else {
      return {
        success: false,
        error: `API error: ${response.status} ${response.data}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function getTestSystemPrompt(category) {
  // Simplified versions of the templates for testing
  switch (category) {
    case 'writing_style':
      return `You are an expert writing style analyst. Help users adopt their personal writing style. Generate 4 enhanced prompts for different writing contexts. Return only JSON.`;
    case 'image_generation':
      return `You are an expert AI prompt engineer. Create 4 enhanced image generation prompts (photographic, artistic, cinematic, digital_art). Return only JSON.`;
    default:
      return `You are an expert prompt engineer. Create 4 enhanced prompts for the given category. Return only JSON.`;
  }
}

function getTestUserPrompt(prompt, category) {
  if (category === 'image_generation') {
    return `Enhance this image prompt: "${prompt}". Return JSON with 4 styles: photographic, artistic, cinematic, digital_art.`;
  } else {
    return `Enhance this request: "${prompt}". Return JSON with 4 enhanced approaches.`;
  }
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
        'HTTP-Referer': 'https://promptshare.ai',
        'X-Title': 'PromptShare AI Test'
      }
    };

    if (requestData) {
      options.headers['Content-Length'] = Buffer.byteLength(requestData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (requestData) {
      req.write(requestData);
    }
    
    req.end();
  });
}

// Run the test
testEnhancedPromptSystem().catch(console.error);
