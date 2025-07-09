import { AIService } from '../services/ai';
import { PromptQualityValidator } from '../services/promptQualityValidator';
import { PromptTemplateService } from '../services/promptTemplates';

// Demo script for browser console
export const runTransformationDemo = () => {
  console.clear();
  console.log('🎯 PromptShare Transformation Engine Demo');
  console.log('=' .repeat(50));
  
  // Example: "write a blog post about cats"
  const basicPrompt = "write a blog post about cats";
  
  console.log(`\n📝 Original Basic Prompt: "${basicPrompt}"`);
  
  try {
    // Step 1: Analyze the prompt
    console.log('\n🔍 Step 1: Analyzing prompt...');
    const analysis = PromptTemplateService.analyzePrompt(basicPrompt);
    console.log('Analysis Results:', {
      domain: analysis.domain,
      intent: analysis.intent,
      complexity: analysis.complexityLevel,
      expertise: analysis.requiredExpertise,
      framework: analysis.suggestedFramework,
      missing: analysis.missingElements
    });
    
    // Step 2: Transform to meta-prompt
    console.log('\n✨ Step 2: Transforming to professional meta-prompt...');
    const transformation = AIService.transformPrompt(basicPrompt);
    console.log('Transformation Results:', {
      qualityScore: transformation.qualityScore,
      processingTime: transformation.processingTime,
      expertRole: transformation.expertRole,
      techniques: transformation.appliedTechniques
    });
    
    // Step 3: Validate quality
    console.log('\n🔍 Step 3: Validating quality...');
    const validation = PromptQualityValidator.validatePrompt(transformation);
    console.log('Validation Results:', {
      isValid: validation.isValid,
      overallScore: validation.overallScore,
      metrics: validation.metrics,
      issuesCount: validation.issues.length,
      suggestionsCount: validation.suggestions.length
    });
    
    // Step 4: Show the transformed prompt
    console.log('\n🎯 Step 4: Final Transformed Meta-Prompt:');
    console.log('─'.repeat(80));
    console.log(transformation.transformedPrompt);
    console.log('─'.repeat(80));
    
    // Step 5: Show quality breakdown
    console.log('\n📊 Quality Metrics Breakdown:');
    Object.entries(validation.metrics).forEach(([metric, score]) => {
      const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
      console.log(`${emoji} ${metric}: ${score}/100`);
    });
    
    // Step 6: Show improvements made
    console.log('\n🚀 Improvements Made:');
    transformation.improvements.forEach((improvement, index) => {
      console.log(`${index + 1}. ${improvement}`);
    });
    
    // Step 7: Show applied techniques
    console.log('\n🛠️ Applied Techniques:');
    transformation.appliedTechniques.forEach((technique, index) => {
      console.log(`${index + 1}. ${technique}`);
    });
    
    console.log('\n✅ Demo completed successfully!');
    console.log('\n💡 Try running: runTransformationDemo() with different prompts');
    
    return {
      analysis,
      transformation,
      validation,
      success: true
    };
    
  } catch (error: any) {
    console.error('❌ Demo failed:', error.message);
    return {
      error: error.message,
      success: false
    };
  }
};

// Test multiple examples
export const runMultipleExamples = () => {
  console.clear();
  console.log('🎯 Multiple Transformation Examples');
  console.log('=' .repeat(50));
  
  const examples = [
    "write a blog post about cats",
    "help me plan a vacation to Japan", 
    "create a marketing strategy for my startup",
    "analyze my LinkedIn profile",
    "teach me data science",
    "improve my writing style"
  ];
  
  examples.forEach((prompt, index) => {
    console.log(`\n📝 Example ${index + 1}: "${prompt}"`);
    
    try {
      const analysis = PromptTemplateService.analyzePrompt(prompt);
      const transformation = AIService.transformPrompt(prompt);
      const validation = PromptQualityValidator.validatePrompt(transformation);
      
      console.log(`   🎯 Domain: ${analysis.domain} | Intent: ${analysis.intent}`);
      console.log(`   ⭐ Quality Score: ${transformation.qualityScore}/100`);
      console.log(`   ✅ Valid: ${validation.isValid} | Overall: ${validation.overallScore}/100`);
      console.log(`   ⚡ Processing: ${transformation.processingTime}ms`);
      
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  });
  
  console.log('\n✅ All examples completed!');
};

// Compare before and after
export const showBeforeAfter = (basicPrompt: string = "write a blog post about cats") => {
  console.clear();
  console.log('🔄 Before vs After Comparison');
  console.log('=' .repeat(50));
  
  try {
    const transformation = AIService.transformPrompt(basicPrompt);
    const validation = PromptQualityValidator.validatePrompt(transformation);
    
    console.log('\n📝 BEFORE (Basic Prompt):');
    console.log('─'.repeat(40));
    console.log(`"${basicPrompt}"`);
    console.log(`Length: ${basicPrompt.length} characters`);
    console.log('Quality: Basic, lacks specificity and structure');
    
    console.log('\n✨ AFTER (Professional Meta-Prompt):');
    console.log('─'.repeat(40));
    console.log(transformation.transformedPrompt);
    console.log(`Length: ${transformation.transformedPrompt.length} characters`);
    console.log(`Quality Score: ${transformation.qualityScore}/100`);
    console.log(`Validation Score: ${validation.overallScore}/100`);
    
    console.log('\n📊 Improvement Summary:');
    console.log(`🔢 Length increase: ${((transformation.transformedPrompt.length / basicPrompt.length) * 100).toFixed(1)}%`);
    console.log(`⭐ Quality improvement: +${transformation.qualityScore - 30} points`);
    console.log(`🎯 Structure: Added ${transformation.appliedTechniques.length} professional techniques`);
    console.log(`🧠 Expertise: ${transformation.expertRole.split('.')[0]}`);
    
    return transformation;
    
  } catch (error: any) {
    console.error('❌ Comparison failed:', error.message);
    return null;
  }
};

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).runTransformationDemo = runTransformationDemo;
  (window as any).runMultipleExamples = runMultipleExamples;
  (window as any).showBeforeAfter = showBeforeAfter;
  
  // Auto-run demo on load
  console.log('🎯 PromptShare Transformation Engine loaded!');
  console.log('Available functions:');
  console.log('• runTransformationDemo() - Full demo with example');
  console.log('• runMultipleExamples() - Test multiple prompts');
  console.log('• showBeforeAfter("your prompt") - Compare transformation');
  console.log('\nTry: runTransformationDemo()');
}
