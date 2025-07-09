// Test script for Universal Enhancement System
// Run with: node test-universal-enhancement.js

import { AIService } from './src/services/ai.ts';

const testPrompts = {
  image_generation: [
    "a cat",
    "a sunset",
    "a portrait"
  ],
  text_ai: [
    "help me write an email",
    "explain quantum physics",
    "summarize this document"
  ],
  code_generation: [
    "create a React component",
    "write a Python function",
    "build an API endpoint"
  ],
  creative_writing: [
    "write a horror story",
    "create marketing copy",
    "write a poem about nature"
  ],
  analysis: [
    "analyze market trends",
    "review this document",
    "evaluate performance data"
  ],
  research: [
    "research climate change",
    "find information about AI",
    "investigate market opportunities"
  ]
};

async function testUniversalEnhancement() {
  console.log('🧪 Testing Universal Enhancement System...\n');

  for (const [category, prompts] of Object.entries(testPrompts)) {
    console.log(`\n📂 Testing ${category.toUpperCase()} category:`);
    console.log('=' .repeat(50));

    for (const prompt of prompts) {
      try {
        console.log(`\n🔍 Input: "${prompt}"`);
        
        // Test category detection
        const detectedCategory = AIService.detectUniversalCategory(prompt);
        console.log(`🎯 Detected category: ${detectedCategory}`);
        
        // Test enhancement (with fallback to avoid API costs)
        const result = await AIService.enhancePrompt(prompt, true);
        console.log(`✅ Enhanced (${result.enhanced[0].style}): ${result.enhanced[0].prompt.substring(0, 100)}...`);
        console.log(`⏱️  Processing time: ${result.processingTime}ms`);
        console.log(`🤖 Model: ${result.model}`);
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }

  console.log('\n🎉 Universal Enhancement System test completed!');
}

// Test image analysis JSON parsing
async function testImageAnalysis() {
  console.log('\n🖼️  Testing Image Analysis JSON Parsing...');
  
  // Create a mock image file for testing
  const mockImageFile = new File(['mock image data'], 'test.jpg', { type: 'image/jpeg' });
  
  try {
    // This will use mock data since we don't have a real API key
    const result = await AIService.analyzeImage(mockImageFile);
    console.log('✅ Image analysis completed successfully');
    console.log(`📝 Description: ${result.description.substring(0, 100)}...`);
    console.log(`🎨 Style: ${result.detectedStyle}`);
    console.log(`🏷️  Tags: ${result.suggestedTags.join(', ')}`);
    console.log(`📊 Enhanced prompts: ${result.enhancedPrompts.length}`);
  } catch (error) {
    console.log(`❌ Image analysis error: ${error.message}`);
  }
}

// Run tests
async function runAllTests() {
  try {
    await testUniversalEnhancement();
    await testImageAnalysis();
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { testUniversalEnhancement, testImageAnalysis };
