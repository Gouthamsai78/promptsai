// Debug script to test AI service using fetch API
// Let's test the API directly with a simple fetch call

// Load environment variables manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Set environment variables
Object.assign(process.env, envVars);

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'google/gemini-2.5-pro-exp-03-25';

async function testAIService() {
  console.log('🔍 Environment Variables Check:');
  console.log('VITE_OPENROUTER_API_KEY:', process.env.VITE_OPENROUTER_API_KEY ? 'Present' : 'Missing');
  console.log('API Key length:', process.env.VITE_OPENROUTER_API_KEY?.length || 0);
  console.log('API Key prefix:', process.env.VITE_OPENROUTER_API_KEY?.substring(0, 15) || 'undefined');

  if (!process.env.VITE_OPENROUTER_API_KEY) {
    console.error('❌ No API key found');
    return;
  }

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Respond with a simple JSON object containing a "message" field.'
    },
    {
      role: 'user',
      content: 'Say hello in JSON format'
    }
  ];

  try {
    console.log('🤖 Testing OpenRouter API...');
    
    const https = require('https');
    const url = require('url');

    const requestData = JSON.stringify({
      model: MODEL_NAME,
      messages,
      temperature: 0.7,
      max_tokens: 100,
    });

    const parsedUrl = url.parse(OPENROUTER_API_URL);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'PromptShare AI Test',
      },
    };

    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, statusText: res.statusMessage, data }));
      });
      req.on('error', reject);
      req.write(requestData);
      req.end();
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (response.status !== 200) {
      console.error('❌ API Error:', response.data);
      return;
    }

    const data = JSON.parse(response.data);
    console.log('✅ API Response:', JSON.stringify(data, null, 2));

    
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log('✅ Content received:', content);
    } else {
      console.error('❌ No content in response');
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testAIService();
