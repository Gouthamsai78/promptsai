import { AIService } from '../services/ai';
import { PromptQualityValidator } from '../services/promptQualityValidator';
import { PromptTemplateService } from '../services/promptTemplates';
import { debugLog } from './debug';

// Test cases for the transformation engine
const TEST_PROMPTS = [
  {
    input: "write a blog post about cats",
    expectedDomain: "creative",
    expectedIntent: "content_creation",
    minQualityScore: 70
  },
  {
    input: "help me plan a vacation to Japan",
    expectedDomain: "personal",
    expectedIntent: "planning",
    minQualityScore: 70
  },
  {
    input: "create a marketing strategy for my startup",
    expectedDomain: "business",
    expectedIntent: "planning",
    minQualityScore: 75
  },
  {
    input: "analyze my LinkedIn profile",
    expectedDomain: "business",
    expectedIntent: "analysis",
    minQualityScore: 70
  },
  {
    input: "teach me data science",
    expectedDomain: "education",
    expectedIntent: "education",
    minQualityScore: 70
  },
  {
    input: "improve my writing style",
    expectedDomain: "personal",
    expectedIntent: "optimization",
    minQualityScore: 70
  }
];

export interface TransformationTestResult {
  input: string;
  success: boolean;
  qualityScore: number;
  detectedDomain: string;
  detectedIntent: string;
  transformedLength: number;
  hasRequiredSections: boolean;
  hasExpertRole: boolean;
  processingTime: number;
  issues: string[];
  suggestions: string[];
}

export class TransformationEngineTest {
  static async runComprehensiveTest(): Promise<{
    overallSuccess: boolean;
    passRate: number;
    results: TransformationTestResult[];
    summary: {
      averageQualityScore: number;
      averageProcessingTime: number;
      commonIssues: string[];
      topSuggestions: string[];
    };
  }> {
    debugLog('🧪 Starting comprehensive transformation engine test...');
    
    const results: TransformationTestResult[] = [];
    let successCount = 0;

    for (const testCase of TEST_PROMPTS) {
      try {
        debugLog(`🔄 Testing prompt: "${testCase.input}"`);
        
        // Step 1: Analyze the prompt
        const analysis = PromptTemplateService.analyzePrompt(testCase.input);
        
        // Step 2: Transform the prompt
        const transformation = AIService.transformPrompt(testCase.input);
        
        // Step 3: Validate the transformation
        const validation = PromptQualityValidator.validatePrompt(transformation);
        
        // Step 4: Check results
        const hasRequiredSections = this.checkRequiredSections(transformation.transformedPrompt);
        const hasExpertRole = transformation.transformedPrompt.includes('You are') && 
                             transformation.transformedPrompt.toLowerCase().includes('expert');
        
        const success = 
          transformation.qualityScore >= testCase.minQualityScore &&
          validation.isValid &&
          hasRequiredSections &&
          hasExpertRole &&
          analysis.domain === testCase.expectedDomain &&
          analysis.intent === testCase.expectedIntent;
        
        if (success) successCount++;
        
        const result: TransformationTestResult = {
          input: testCase.input,
          success,
          qualityScore: transformation.qualityScore,
          detectedDomain: analysis.domain,
          detectedIntent: analysis.intent,
          transformedLength: transformation.transformedPrompt.length,
          hasRequiredSections,
          hasExpertRole,
          processingTime: transformation.processingTime,
          issues: validation.issues.map(issue => issue.description),
          suggestions: validation.suggestions.map(suggestion => suggestion.suggestion)
        };
        
        results.push(result);
        
        debugLog(`✅ Test completed for "${testCase.input}":`, {
          success,
          qualityScore: transformation.qualityScore,
          domain: analysis.domain,
          intent: analysis.intent
        });
        
      } catch (error: any) {
        debugLog(`❌ Test failed for "${testCase.input}":`, error.message);
        
        results.push({
          input: testCase.input,
          success: false,
          qualityScore: 0,
          detectedDomain: 'unknown',
          detectedIntent: 'unknown',
          transformedLength: 0,
          hasRequiredSections: false,
          hasExpertRole: false,
          processingTime: 0,
          issues: [error.message],
          suggestions: []
        });
      }
    }

    const passRate = (successCount / TEST_PROMPTS.length) * 100;
    const overallSuccess = passRate >= 80; // 80% pass rate required

    // Calculate summary statistics
    const validResults = results.filter(r => r.success);
    const averageQualityScore = validResults.length > 0 
      ? validResults.reduce((sum, r) => sum + r.qualityScore, 0) / validResults.length 
      : 0;
    
    const averageProcessingTime = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.processingTime, 0) / validResults.length
      : 0;

    // Analyze common issues and suggestions
    const allIssues = results.flatMap(r => r.issues);
    const allSuggestions = results.flatMap(r => r.suggestions);
    
    const issueFrequency: Record<string, number> = {};
    allIssues.forEach(issue => {
      issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    });
    
    const suggestionFrequency: Record<string, number> = {};
    allSuggestions.forEach(suggestion => {
      suggestionFrequency[suggestion] = (suggestionFrequency[suggestion] || 0) + 1;
    });

    const commonIssues = Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([issue]) => issue);

    const topSuggestions = Object.entries(suggestionFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([suggestion]) => suggestion);

    const summary = {
      averageQualityScore: Math.round(averageQualityScore),
      averageProcessingTime: Math.round(averageProcessingTime),
      commonIssues,
      topSuggestions
    };

    debugLog('🏁 Comprehensive test completed:', {
      overallSuccess,
      passRate,
      successCount,
      totalTests: TEST_PROMPTS.length,
      summary
    });

    return {
      overallSuccess,
      passRate,
      results,
      summary
    };
  }

  private static checkRequiredSections(transformedPrompt: string): boolean {
    const requiredSections = ['#CONTEXT', '#GOAL', '#INFORMATION', '#RESPONSE GUIDELINES', '#OUTPUT'];
    return requiredSections.filter(section => transformedPrompt.includes(section)).length >= 4;
  }

  // Test individual transformation
  static async testSingleTransformation(input: string): Promise<TransformationTestResult> {
    try {
      debugLog(`🔄 Testing single transformation: "${input}"`);
      
      const analysis = PromptTemplateService.analyzePrompt(input);
      const transformation = AIService.transformPrompt(input);
      const validation = PromptQualityValidator.validatePrompt(transformation);
      
      const hasRequiredSections = this.checkRequiredSections(transformation.transformedPrompt);
      const hasExpertRole = transformation.transformedPrompt.includes('You are') && 
                           transformation.transformedPrompt.toLowerCase().includes('expert');
      
      const success = 
        transformation.qualityScore >= 60 &&
        validation.isValid &&
        hasRequiredSections &&
        hasExpertRole;
      
      return {
        input,
        success,
        qualityScore: transformation.qualityScore,
        detectedDomain: analysis.domain,
        detectedIntent: analysis.intent,
        transformedLength: transformation.transformedPrompt.length,
        hasRequiredSections,
        hasExpertRole,
        processingTime: transformation.processingTime,
        issues: validation.issues.map(issue => issue.description),
        suggestions: validation.suggestions.map(suggestion => suggestion.suggestion)
      };
      
    } catch (error: any) {
      debugLog(`❌ Single transformation test failed:`, error.message);
      
      return {
        input,
        success: false,
        qualityScore: 0,
        detectedDomain: 'unknown',
        detectedIntent: 'unknown',
        transformedLength: 0,
        hasRequiredSections: false,
        hasExpertRole: false,
        processingTime: 0,
        issues: [error.message],
        suggestions: []
      };
    }
  }

  // Demonstrate the transformation with example
  static demonstrateTransformation(input: string = "write a blog post about cats"): void {
    try {
      debugLog('🎯 Demonstrating prompt transformation...');
      
      console.log('\n=== PROMPT TRANSFORMATION DEMONSTRATION ===');
      console.log(`\n📝 Original Prompt: "${input}"`);
      
      // Step 1: Analysis
      const analysis = PromptTemplateService.analyzePrompt(input);
      console.log('\n📊 Analysis Results:');
      console.log(`   Domain: ${analysis.domain}`);
      console.log(`   Intent: ${analysis.intent}`);
      console.log(`   Complexity: ${analysis.complexityLevel}`);
      console.log(`   Required Expertise: ${analysis.requiredExpertise.join(', ')}`);
      console.log(`   Suggested Framework: ${analysis.suggestedFramework}`);
      
      // Step 2: Transformation
      const transformation = AIService.transformPrompt(input);
      console.log('\n✨ Transformation Results:');
      console.log(`   Quality Score: ${transformation.qualityScore}/100`);
      console.log(`   Processing Time: ${transformation.processingTime}ms`);
      console.log(`   Expert Role: ${transformation.expertRole}`);
      console.log(`   Applied Techniques: ${transformation.appliedTechniques.join(', ')}`);
      
      // Step 3: Validation
      const validation = PromptQualityValidator.validatePrompt(transformation);
      console.log('\n🔍 Quality Validation:');
      console.log(`   Is Valid: ${validation.isValid}`);
      console.log(`   Overall Score: ${validation.overallScore}/100`);
      console.log(`   Issues Found: ${validation.issues.length}`);
      console.log(`   Suggestions: ${validation.suggestions.length}`);
      
      // Step 4: Show transformed prompt
      console.log('\n🎯 Transformed Meta-Prompt:');
      console.log('─'.repeat(80));
      console.log(transformation.transformedPrompt);
      console.log('─'.repeat(80));
      
      console.log('\n✅ Demonstration completed successfully!');
      
    } catch (error: any) {
      console.error('❌ Demonstration failed:', error.message);
    }
  }
}

// Export for use in browser console
(window as any).TransformationEngineTest = TransformationEngineTest;
