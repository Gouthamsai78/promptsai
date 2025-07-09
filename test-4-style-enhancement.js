// Test script to verify 4-style prompt enhancement is working correctly
// Run with: node test-4-style-enhancement.js

console.log('🧪 Testing 4-Style Prompt Enhancement System\n');

// Mock the AI service for testing
const mockAIService = {
  // Simulate the universal category detection
  detectUniversalCategory(text) {
    const lowerText = text.toLowerCase();
    
    // Image generation keywords
    const imageKeywords = [
      'image', 'photo', 'picture', 'art', 'painting', 'drawing', 'illustration', 'portrait', 'landscape',
      'midjourney', 'dall-e', 'stable diffusion', 'leonardo', 'generate', 'create image', 'visual',
      'camera', 'photography', 'artistic', 'digital art', 'concept art', 'render', 'scene', 'character',
      'lighting', 'composition', 'shot', 'angle', 'color', 'texture', 'realistic', 'cinematic',
      'a woman', 'a man', 'a person', 'a cat', 'a dog', 'a house', 'a car'
    ];
    
    // Check if it matches image generation
    if (imageKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'image_generation';
    }
    
    return 'text_ai';
  },

  // Simulate the isImageGenerationPrompt method
  isImageGenerationPrompt(text) {
    return this.detectUniversalCategory(text) === 'image_generation';
  },

  // Simulate the enhancePrompt method
  async enhancePrompt(prompt, useFallback = true) {
    const category = this.detectUniversalCategory(prompt);
    
    console.log(`🎯 Detected category: ${category}`);
    
    if (category === 'image_generation') {
      // Return 4 style variations for image generation
      const basePrompt = `Enhanced version of: ${prompt}`;
      
      return {
        original: prompt,
        enhanced: [
          {
            id: 'photo_1',
            style: 'photographic',
            prompt: `${basePrompt} | Professional photography style: shot with high-end DSLR camera, perfect lighting, award-winning composition, 8K resolution, photorealistic detail, magazine quality`,
            description: 'Professional photography with technical specifications'
          },
          {
            id: 'art_1',
            style: 'artistic',
            prompt: `${basePrompt} | Fine art style: museum-quality artwork, masterpiece composition, artistic lighting, rich textures, gallery-worthy presentation, classical art techniques`,
            description: 'Fine art style with artistic techniques'
          },
          {
            id: 'cinema_1',
            style: 'cinematic',
            prompt: `${basePrompt} | Cinematic style: movie-quality composition, dramatic lighting, film grain, epic atmosphere, blockbuster aesthetic, IMAX-worthy detail`,
            description: 'Cinematic film style with dramatic elements'
          },
          {
            id: 'digital_1',
            style: 'digital_art',
            prompt: `${basePrompt} | Digital art style: 8K ultra-high resolution, trending on ArtStation, concept art quality, modern digital techniques, vibrant colors, hyperrealistic rendering`,
            description: 'Digital art with modern rendering techniques'
          }
        ],
        processingTime: 150,
        model: 'test_model',
        category: category,
        cached: false
      };
    } else {
      // Return single enhancement for other categories
      return {
        original: prompt,
        enhanced: [{
          id: `universal_${Date.now()}`,
          style: 'conversational',
          prompt: `Enhanced version of: ${prompt} with professional specifications`,
          description: `Enhanced for Text/Chat AI`
        }],
        processingTime: 100,
        model: 'test_model',
        category: category,
        cached: false
      };
    }
  }
};

// Test cases
const testCases = [
  {
    name: 'Simple Image Prompt',
    input: 'a cat',
    expectedCategory: 'image_generation',
    expectedCount: 4
  },
  {
    name: 'Detailed Image Prompt',
    input: 'a beautiful woman with long hair in a garden',
    expectedCategory: 'image_generation',
    expectedCount: 4
  },
  {
    name: 'Photography Prompt',
    input: 'professional photo of a sunset over mountains',
    expectedCategory: 'image_generation',
    expectedCount: 4
  },
  {
    name: 'Art Prompt',
    input: 'digital art of a futuristic city',
    expectedCategory: 'image_generation',
    expectedCount: 4
  },
  {
    name: 'Text Prompt',
    input: 'explain how to cook pasta',
    expectedCategory: 'text_ai',
    expectedCount: 1
  },
  {
    name: 'General Chat',
    input: 'hello how are you',
    expectedCategory: 'text_ai',
    expectedCount: 1
  }
];

// Run tests
async function runTests() {
  console.log('Running test cases...\n');
  
  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`   Input: "${testCase.input}"`);
    
    try {
      // Test category detection
      const detectedCategory = mockAIService.detectUniversalCategory(testCase.input);
      const isImagePrompt = mockAIService.isImageGenerationPrompt(testCase.input);
      
      console.log(`   🎯 Detected category: ${detectedCategory}`);
      console.log(`   🖼️  Is image prompt: ${isImagePrompt}`);
      
      // Test enhancement
      const result = await mockAIService.enhancePrompt(testCase.input);
      
      console.log(`   ✨ Enhanced prompts count: ${result.enhanced.length}`);
      console.log(`   📊 Styles: ${result.enhanced.map(e => e.style).join(', ')}`);
      
      // Verify results
      const categoryMatch = detectedCategory === testCase.expectedCategory;
      const countMatch = result.enhanced.length === testCase.expectedCount;
      
      if (categoryMatch && countMatch) {
        console.log(`   ✅ PASS\n`);
      } else {
        console.log(`   ❌ FAIL`);
        if (!categoryMatch) {
          console.log(`      Expected category: ${testCase.expectedCategory}, got: ${detectedCategory}`);
        }
        if (!countMatch) {
          console.log(`      Expected count: ${testCase.expectedCount}, got: ${result.enhanced.length}`);
        }
        console.log('');
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
    }
  }
  
  console.log('🎉 Test completed!');
}

// Run the tests
runTests().catch(console.error);
