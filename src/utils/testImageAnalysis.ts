import { AIService } from '../services/ai';
import { debugLog } from './debug';

// Simple test function to verify image analysis is working
export async function testImageAnalysisWithMockFile(): Promise<void> {
  debugLog('🧪 Testing image analysis with mock file...');

  try {
    // Create a mock file for testing
    const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const response = await fetch(mockImageData);
    const blob = await response.blob();
    const mockFile = new File([blob], 'test-image.png', { type: 'image/png' });

    debugLog('🔍 Mock file created:', {
      name: mockFile.name,
      size: mockFile.size,
      type: mockFile.type
    });

    // Test AI availability
    const aiAvailable = AIService.isAIAvailable();
    debugLog('🔍 AI Service availability:', aiAvailable);

    // Test image analysis
    debugLog('🚀 Starting image analysis test...');
    const result = await AIService.analyzeImage(mockFile);

    debugLog('✅ Image analysis test completed:', {
      hasDescription: !!result.description,
      hasDetectedStyle: !!result.detectedStyle,
      hasSuggestedTags: !!result.suggestedTags,
      hasEnhancedPrompts: !!result.enhancedPrompts,
      promptCount: result.enhancedPrompts?.length || 0,
      promptStyles: result.enhancedPrompts?.map(p => p.style) || []
    });

    if (result.enhancedPrompts && result.enhancedPrompts.length === 4) {
      debugLog('✅ SUCCESS: 4 prompts generated successfully');
      result.enhancedPrompts.forEach((prompt, index) => {
        debugLog(`📝 Prompt ${index + 1} (${prompt.style}):`, {
          id: prompt.id,
          style: prompt.style,
          promptLength: prompt.prompt.length,
          description: prompt.description,
          promptPreview: prompt.prompt.substring(0, 100) + '...'
        });
      });
    } else {
      debugLog('❌ FAILURE: Expected 4 prompts, got:', result.enhancedPrompts?.length || 0);
    }

    return result;

  } catch (error: any) {
    debugLog('❌ Image analysis test failed:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Test function specifically for debugging the chat interface issue
export async function debugChatImageAnalysis(imageFile: File): Promise<any> {
  debugLog('🧪 DEBUG: Testing chat image analysis pipeline...');

  try {
    // Step 1: Verify file
    debugLog('📁 File verification:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
      isImage: imageFile.type.startsWith('image/')
    });

    // Step 2: Check AI availability
    const aiAvailable = AIService.isAIAvailable();
    debugLog('🤖 AI availability check:', aiAvailable);

    // Step 3: Run analysis
    debugLog('🔍 Running image analysis...');
    const analysis = await AIService.analyzeImage(imageFile);

    // Step 4: Verify result structure
    debugLog('📊 Analysis result structure:', {
      hasDescription: !!analysis.description,
      hasDetectedStyle: !!analysis.detectedStyle,
      hasSuggestedTags: Array.isArray(analysis.suggestedTags),
      hasEnhancedPrompts: Array.isArray(analysis.enhancedPrompts),
      promptCount: analysis.enhancedPrompts?.length || 0,
      textElements: analysis.textElements,
      colorPalette: analysis.colorPalette,
      lightingAnalysis: analysis.lightingAnalysis
    });

    // Step 5: Verify prompts
    if (analysis.enhancedPrompts && analysis.enhancedPrompts.length > 0) {
      debugLog('📝 Enhanced prompts verification:');
      analysis.enhancedPrompts.forEach((prompt, index) => {
        debugLog(`  Prompt ${index + 1}:`, {
          id: prompt.id,
          style: prompt.style,
          hasPrompt: !!prompt.prompt,
          promptLength: prompt.prompt?.length || 0,
          hasDescription: !!prompt.description,
          valid: !!(prompt.id && prompt.style && prompt.prompt && prompt.description)
        });
      });

      const validPrompts = analysis.enhancedPrompts.filter(p => 
        p.id && p.style && p.prompt && p.description
      );

      debugLog('✅ Valid prompts count:', validPrompts.length);

      if (validPrompts.length === 4) {
        debugLog('🎉 SUCCESS: All 4 prompts are valid and ready for display');
      } else {
        debugLog('⚠️ WARNING: Not all prompts are valid');
      }
    } else {
      debugLog('❌ ERROR: No enhanced prompts found in analysis result');
    }

    return {
      success: true,
      analysis,
      promptCount: analysis.enhancedPrompts?.length || 0,
      validPrompts: analysis.enhancedPrompts?.filter(p => 
        p.id && p.style && p.prompt && p.description
      ).length || 0
    };

  } catch (error: any) {
    debugLog('❌ Chat image analysis debug failed:', {
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message,
      analysis: null,
      promptCount: 0,
      validPrompts: 0
    };
  }
}

// Quick test to verify the mock response is working
export function testMockImageAnalysis(): any {
  debugLog('🧪 Testing mock image analysis...');

  try {
    // Access the private method through a workaround
    const mockResult = (AIService as any).getEnhancedMockImageAnalysis('test-image.jpg', 'image/jpeg');

    debugLog('📊 Mock result structure:', {
      hasDescription: !!mockResult.description,
      hasDetectedStyle: !!mockResult.detectedStyle,
      hasSuggestedTags: Array.isArray(mockResult.suggestedTags),
      hasEnhancedPrompts: Array.isArray(mockResult.enhancedPrompts),
      promptCount: mockResult.enhancedPrompts?.length || 0
    });

    if (mockResult.enhancedPrompts && mockResult.enhancedPrompts.length === 4) {
      debugLog('✅ Mock analysis generates 4 prompts correctly');
      mockResult.enhancedPrompts.forEach((prompt: any, index: number) => {
        debugLog(`  Mock Prompt ${index + 1}:`, {
          id: prompt.id,
          style: prompt.style,
          promptLength: prompt.prompt?.length || 0,
          hasDescription: !!prompt.description
        });
      });
    } else {
      debugLog('❌ Mock analysis failed to generate 4 prompts');
    }

    return mockResult;

  } catch (error: any) {
    debugLog('❌ Mock image analysis test failed:', error.message);
    return null;
  }
}
