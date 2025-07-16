import { 
  RequirementsAnalysisInput, 
  RequirementsAnalysisResult, 
  PromptRequirement, 
  GeneratedPrompt,
  RequirementRefinement 
} from '../types/ai';
import { debugLog } from '../utils/debug';
import { UsageTrackingService } from './usageTracking';

// Cache for requirements analysis to avoid redundant API calls
const requirementsCache = new Map<string, { result: RequirementsAnalysisResult; timestamp: number }>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

export class RequirementsAnalysisService {
  private static readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private static readonly ANALYSIS_MODEL = 'mistralai/mistral-small-3.2-24b-instruct:free';
  
  // Get API key dynamically
  private static getApiKey(): string | undefined {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    debugLog('🔑 API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'
    });
    return apiKey;
  }

  // Check if AI service is available
  static isAvailable(): boolean {
    const available = !!this.getApiKey();
    debugLog('🔍 Service availability check:', available);
    return available;
  }

  // Main method to analyze requirements and generate prompts
  static async analyzeRequirements(input: RequirementsAnalysisInput): Promise<RequirementsAnalysisResult> {
    const startTime = Date.now();
    debugLog('🔍 Starting requirements analysis:', input);

    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      debugLog('🎯 Using cached requirements analysis');
      return cached;
    }

    if (!this.isAvailable()) {
      debugLog('❌ AI service not available, using mock analysis');
      const mockResult = this.getMockAnalysis(input, Date.now() - startTime);
      debugLog('🎭 Mock analysis result:', mockResult);
      return mockResult;
    }

    try {
      debugLog('🚀 Attempting real AI analysis...');
      const result = await this.performAnalysis(input);

      // Set processing time
      result.processingTime = Date.now() - startTime;

      // Cache the result
      this.cacheResult(cacheKey, result);

      // Track usage
      try {
        UsageTrackingService.trackRequest(
          'requirements_analysis',
          'prompt_generation',
          this.ANALYSIS_MODEL,
          result.processingTime,
          true,
          input.naturalLanguageDescription.length,
          JSON.stringify(result).length
        );
      } catch (trackingError) {
        debugLog('⚠️ Usage tracking failed:', trackingError);
      }

      debugLog('✅ Requirements analysis completed successfully:', result);
      return result;
    } catch (error: any) {
      debugLog('❌ Requirements analysis failed, falling back to mock:', error);

      // Track failed request
      try {
        UsageTrackingService.trackRequest(
          'requirements_analysis',
          'prompt_generation',
          this.ANALYSIS_MODEL,
          Date.now() - startTime,
          false,
          input.naturalLanguageDescription.length,
          0
        );
      } catch (trackingError) {
        debugLog('⚠️ Usage tracking failed:', trackingError);
      }

      // Fallback to mock analysis
      const mockResult = this.getMockAnalysis(input, Date.now() - startTime);
      debugLog('🎭 Using mock analysis as fallback:', mockResult);
      return mockResult;
    }
  }

  // Refine requirements and regenerate prompts
  static async refineRequirements(
    originalAnalysis: RequirementsAnalysisResult,
    refinements: RequirementRefinement[]
  ): Promise<RequirementsAnalysisResult> {
    debugLog('🔄 Refining requirements:', { originalAnalysis, refinements });

    // Create updated input based on refinements
    const updatedInput: RequirementsAnalysisInput = {
      naturalLanguageDescription: originalAnalysis.originalDescription,
      additionalContext: this.buildRefinementContext(refinements),
      preferredStyle: originalAnalysis.suggestedTone,
      complexityLevel: 'intermediate'
    };

    return this.analyzeRequirements(updatedInput);
  }

  // Generate additional prompts based on existing analysis
  static async generateMorePrompts(
    analysis: RequirementsAnalysisResult,
    count: number = 3
  ): Promise<GeneratedPrompt[]> {
    debugLog('📝 Generating additional prompts:', { analysis, count });

    if (!this.isAvailable()) {
      return this.getMockAdditionalPrompts(analysis, count);
    }

    try {
      const messages = this.buildAdditionalPromptsMessages(analysis, count);
      const response = await this.makeAPIRequest(messages);
      return this.parseAdditionalPromptsResponse(response);
    } catch (error) {
      debugLog('❌ Failed to generate additional prompts:', error);
      return this.getMockAdditionalPrompts(analysis, count);
    }
  }

  // Private helper methods

  private static async performAnalysis(input: RequirementsAnalysisInput): Promise<RequirementsAnalysisResult> {
    const messages = this.buildAnalysisMessages(input);
    const response = await this.makeAPIRequest(messages);
    return this.parseAnalysisResponse(response, input);
  }

  private static buildAnalysisMessages(input: RequirementsAnalysisInput): any[] {
    const systemPrompt = `You are an expert prompt engineer and requirements analyst. Your task is to analyze natural language descriptions of prompt requirements and generate comprehensive, structured prompts that fulfill those requirements.

When given a user's description, you should:
1. Parse and understand the requirements and constraints
2. Identify the use case, target audience, and desired output format
3. Generate multiple high-quality prompts that address the specific needs
4. Provide clear explanations of how each prompt addresses the requirements

Respond with a JSON object containing:
- parsedRequirements: Array of requirement objects with id, description, category, priority, value
- identifiedUseCase: String describing the main use case
- targetAudience: String describing the intended audience
- desiredOutputFormat: String describing the expected output format
- suggestedTone: String describing the recommended tone
- detectedConstraints: Array of constraint strings
- generatedPrompts: Array of prompt objects with id, title, prompt, explanation, addressedRequirements, qualityScore, estimatedEffectiveness, tags
- confidence: Number between 0-100 indicating analysis confidence

Categories for requirements: use_case, audience, format, tone, constraints, output
Priorities: high, medium, low`;

    const userPrompt = `Please analyze this prompt requirement description and generate comprehensive prompts:

Description: "${input.naturalLanguageDescription}"
${input.additionalContext ? `Additional Context: "${input.additionalContext}"` : ''}
${input.preferredStyle ? `Preferred Style: "${input.preferredStyle}"` : ''}
${input.targetLength ? `Target Length: "${input.targetLength}"` : ''}
${input.complexityLevel ? `Complexity Level: "${input.complexityLevel}"` : ''}

Generate 3-5 different prompts that fulfill these requirements, each with a different approach or emphasis.`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  private static async makeAPIRequest(messages: any[]): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key not available');
    }

    debugLog('📡 Making API request to OpenRouter...', {
      url: this.OPENROUTER_API_URL,
      model: this.ANALYSIS_MODEL,
      messageCount: messages.length
    });

    const requestBody = {
      model: this.ANALYSIS_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    };

    debugLog('📤 Request body:', requestBody);

    const response = await fetch(this.OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PromptShare Requirements Analysis',
      },
      body: JSON.stringify(requestBody),
    });

    debugLog('📥 API Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      debugLog('❌ API Error response:', errorData);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    debugLog('📦 API Response data:', data);

    const content = data.choices[0]?.message?.content || '';
    if (!content) {
      throw new Error('No content in API response');
    }

    return content;
  }

  private static parseAnalysisResponse(
    response: string,
    input: RequirementsAnalysisInput
  ): RequirementsAnalysisResult {
    try {
      debugLog('🔍 Parsing AI response:', response.substring(0, 200) + '...');

      // Try to extract JSON from response - look for various patterns
      let jsonMatch = response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        // Try to find JSON in code blocks
        jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }

      if (!jsonMatch) {
        debugLog('❌ No JSON found in response, using fallback parsing');
        // Try to create a basic structure from the response
        return this.createFallbackAnalysis(response, input);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      debugLog('✅ Successfully parsed JSON:', parsed);

      // Validate and normalize the parsed data
      const result: RequirementsAnalysisResult = {
        originalDescription: input.naturalLanguageDescription,
        parsedRequirements: Array.isArray(parsed.parsedRequirements) ? parsed.parsedRequirements : [],
        identifiedUseCase: parsed.identifiedUseCase || 'General purpose',
        targetAudience: parsed.targetAudience || 'General audience',
        desiredOutputFormat: parsed.desiredOutputFormat || 'Text',
        suggestedTone: parsed.suggestedTone || 'Professional',
        detectedConstraints: Array.isArray(parsed.detectedConstraints) ? parsed.detectedConstraints : [],
        generatedPrompts: Array.isArray(parsed.generatedPrompts) ? parsed.generatedPrompts : [],
        processingTime: 0, // Will be set by caller
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 85
      };

      // Ensure generated prompts have required fields
      result.generatedPrompts = result.generatedPrompts.map((prompt: any, index: number) => ({
        id: prompt.id || `prompt_${index + 1}`,
        title: prompt.title || `Generated Prompt ${index + 1}`,
        prompt: prompt.prompt || 'No prompt content available',
        explanation: prompt.explanation || 'No explanation provided',
        addressedRequirements: Array.isArray(prompt.addressedRequirements) ? prompt.addressedRequirements : [],
        qualityScore: typeof prompt.qualityScore === 'number' ? prompt.qualityScore : 80,
        estimatedEffectiveness: typeof prompt.estimatedEffectiveness === 'number' ? prompt.estimatedEffectiveness : 80,
        tags: Array.isArray(prompt.tags) ? prompt.tags : ['ai-generated']
      }));

      return result;
    } catch (error) {
      debugLog('❌ Failed to parse analysis response:', error);
      debugLog('📄 Raw response:', response);
      return this.createFallbackAnalysis(response, input);
    }
  }

  private static createFallbackAnalysis(response: string, input: RequirementsAnalysisInput): RequirementsAnalysisResult {
    debugLog('🔄 Creating fallback analysis from response');

    // Create a basic prompt from the AI response
    const basicPrompt = response.length > 50 ? response : `Enhanced prompt based on: ${input.naturalLanguageDescription}`;

    return {
      originalDescription: input.naturalLanguageDescription,
      parsedRequirements: [
        {
          id: 'req_1',
          description: 'User requirements',
          category: 'use_case',
          priority: 'high',
          value: input.naturalLanguageDescription
        }
      ],
      identifiedUseCase: 'Custom prompt creation',
      targetAudience: 'General users',
      desiredOutputFormat: 'Enhanced prompt',
      suggestedTone: 'Professional',
      detectedConstraints: [],
      generatedPrompts: [
        {
          id: 'prompt_1',
          title: 'AI Enhanced Prompt',
          prompt: basicPrompt,
          explanation: 'This prompt was generated based on your requirements using AI assistance.',
          addressedRequirements: ['req_1'],
          qualityScore: 75,
          estimatedEffectiveness: 75,
          tags: ['ai-generated', 'fallback']
        }
      ],
      processingTime: 0,
      confidence: 70
    };
  }

  // Cache management
  private static generateCacheKey(input: RequirementsAnalysisInput): string {
    return `req_${JSON.stringify(input)}`.replace(/\s+/g, '').toLowerCase();
  }

  private static getCachedResult(cacheKey: string): RequirementsAnalysisResult | null {
    const cached = requirementsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return cached.result;
    }
    if (cached) {
      requirementsCache.delete(cacheKey);
    }
    return null;
  }

  private static cacheResult(cacheKey: string, result: RequirementsAnalysisResult): void {
    requirementsCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  // Helper methods for refinements and additional prompts
  private static buildRefinementContext(refinements: RequirementRefinement[]): string {
    return refinements.map(r => `${r.requirementId}: ${r.newValue} (${r.reason})`).join('; ');
  }

  private static buildAdditionalPromptsMessages(analysis: RequirementsAnalysisResult, count: number): any[] {
    const systemPrompt = `Generate ${count} additional high-quality prompts based on the existing analysis. Each prompt should take a different approach while still fulfilling the core requirements.`;
    
    const userPrompt = `Based on this analysis, generate ${count} more prompts:
Use Case: ${analysis.identifiedUseCase}
Target Audience: ${analysis.targetAudience}
Output Format: ${analysis.desiredOutputFormat}
Tone: ${analysis.suggestedTone}
Requirements: ${analysis.parsedRequirements.map(r => r.description).join(', ')}

Respond with a JSON array of prompt objects.`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  private static parseAdditionalPromptsResponse(response: string): GeneratedPrompt[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      debugLog('❌ Failed to parse additional prompts response:', error);
      return [];
    }
  }

  // Mock implementations for offline/fallback scenarios
  private static getMockAnalysis(
    input: RequirementsAnalysisInput,
    processingTime: number
  ): RequirementsAnalysisResult {
    debugLog('🎭 Generating mock requirements analysis');

    const mockRequirements: PromptRequirement[] = [
      {
        id: 'req_1',
        description: 'Professional communication style',
        category: 'tone',
        priority: 'high',
        value: 'professional',
        examples: ['formal language', 'clear structure', 'respectful tone']
      },
      {
        id: 'req_2',
        description: 'Email format output',
        category: 'format',
        priority: 'high',
        value: 'email',
        examples: ['subject line', 'greeting', 'body', 'closing']
      },
      {
        id: 'req_3',
        description: 'Friendly but professional tone',
        category: 'tone',
        priority: 'medium',
        value: 'friendly-professional',
        examples: ['warm greeting', 'helpful language', 'positive closing']
      }
    ];

    const mockPrompts: GeneratedPrompt[] = [
      {
        id: 'prompt_1',
        title: 'Professional Email Assistant',
        prompt: `You are a professional email writing assistant. Help users compose clear, effective, and appropriately toned emails for business communication.

# CONTEXT
You specialize in creating professional emails that maintain a friendly yet business-appropriate tone.

# GOAL
Generate well-structured emails that effectively communicate the user's message while maintaining professionalism.

# GUIDELINES
- Use clear, concise language
- Include appropriate greetings and closings
- Maintain a friendly but professional tone
- Structure emails logically with clear paragraphs
- Suggest subject lines when appropriate

# OUTPUT FORMAT
Provide the complete email including:
- Subject line (if requested)
- Greeting
- Body paragraphs
- Professional closing
- Signature placeholder

Please help me write: [USER'S EMAIL REQUEST]`,
        explanation: 'This prompt creates a specialized email assistant that balances professionalism with friendliness, addressing your core requirements for professional email composition.',
        addressedRequirements: ['req_1', 'req_2', 'req_3'],
        qualityScore: 92,
        estimatedEffectiveness: 88,
        tags: ['email', 'professional', 'communication', 'business']
      },
      {
        id: 'prompt_2',
        title: 'Contextual Email Generator',
        prompt: `You are an expert email communication specialist. Your role is to help users craft emails that are both professional and personable, adapting to different business contexts and relationships.

# EXPERTISE
- Business communication best practices
- Tone adaptation for different audiences
- Email structure and formatting
- Professional relationship management

# TASK
When a user describes their email needs, analyze the context and generate an appropriate email that:
1. Matches the professional level required
2. Incorporates a friendly, approachable tone
3. Follows proper email etiquette
4. Achieves the communication objective

# RESPONSE STRUCTURE
1. Brief context analysis
2. Suggested subject line
3. Complete email draft
4. Alternative phrasings for key sections (if helpful)

# TONE GUIDELINES
- Professional yet warm
- Clear and direct
- Respectful and courteous
- Appropriately formal for the context

What email would you like help writing?`,
        explanation: 'This prompt provides more contextual analysis and offers alternative phrasings, giving users flexibility while maintaining professional standards.',
        addressedRequirements: ['req_1', 'req_2', 'req_3'],
        qualityScore: 89,
        estimatedEffectiveness: 91,
        tags: ['email', 'context-aware', 'professional', 'adaptable']
      },
      {
        id: 'prompt_3',
        title: 'Friendly Professional Email Coach',
        prompt: `Act as a professional email writing coach who helps create emails that are both effective and personable. Your expertise lies in balancing professionalism with warmth.

# YOUR ROLE
- Email writing specialist
- Communication tone expert
- Professional relationship advisor

# APPROACH
For each email request:
1. Understand the relationship context (colleague, client, supervisor, etc.)
2. Determine appropriate formality level
3. Craft emails that are professional yet friendly
4. Ensure clear communication of the main message

# EMAIL COMPONENTS TO INCLUDE
- Context-appropriate greeting
- Clear, well-organized body
- Friendly but professional language
- Appropriate closing
- Subject line suggestion

# TONE CHARACTERISTICS
- Warm and approachable
- Professionally competent
- Clear and concise
- Respectful of the recipient

Please describe the email you need help writing, including any context about your relationship with the recipient.`,
        explanation: 'This prompt emphasizes the coaching aspect and relationship context, helping users understand not just what to write but why certain approaches work better.',
        addressedRequirements: ['req_1', 'req_2', 'req_3'],
        qualityScore: 87,
        estimatedEffectiveness: 85,
        tags: ['email', 'coaching', 'relationship-aware', 'educational']
      }
    ];

    return {
      originalDescription: input.naturalLanguageDescription,
      parsedRequirements: mockRequirements,
      identifiedUseCase: 'Professional email composition',
      targetAudience: 'Business professionals',
      desiredOutputFormat: 'Structured email with all components',
      suggestedTone: 'Professional yet friendly',
      detectedConstraints: ['Must maintain professionalism', 'Should be friendly', 'Needs proper email structure'],
      generatedPrompts: mockPrompts,
      processingTime,
      confidence: 85
    };
  }

  private static getMockAdditionalPrompts(
    analysis: RequirementsAnalysisResult,
    count: number
  ): GeneratedPrompt[] {
    const additionalPrompts: GeneratedPrompt[] = [
      {
        id: 'prompt_additional_1',
        title: 'Email Template Generator',
        prompt: `You are an email template specialist who creates reusable, professional email templates with friendly touches.

# SPECIALIZATION
Create email templates that can be easily customized while maintaining consistent professional quality and warm tone.

# TEMPLATE APPROACH
- Provide placeholder sections for customization
- Include tone guidance for each section
- Offer multiple template variations
- Ensure scalability for different contexts

# OUTPUT
- Template structure with [PLACEHOLDERS]
- Tone notes for each section
- Customization guidelines
- Example variations

What type of email template do you need?`,
        explanation: 'Focuses on creating reusable templates rather than one-off emails, providing long-term value.',
        addressedRequirements: analysis.parsedRequirements.map(r => r.id),
        qualityScore: 84,
        estimatedEffectiveness: 82,
        tags: ['template', 'reusable', 'scalable', 'professional']
      },
      {
        id: 'prompt_additional_2',
        title: 'Situational Email Advisor',
        prompt: `You are a situational email communication expert who adapts writing style based on specific business scenarios and relationship dynamics.

# EXPERTISE AREAS
- Crisis communication
- Relationship building
- Conflict resolution
- Opportunity creation
- Follow-up strategies

# METHODOLOGY
1. Assess the situation and stakes
2. Identify relationship dynamics
3. Choose optimal communication strategy
4. Craft message with appropriate tone balance
5. Suggest follow-up approaches

# TONE CALIBRATION
Adjust professional-friendly balance based on:
- Urgency of situation
- Relationship history
- Desired outcome
- Cultural considerations

Describe your email situation and I'll help you navigate it effectively.`,
        explanation: 'Provides situational awareness and strategic communication advice beyond just writing the email.',
        addressedRequirements: analysis.parsedRequirements.map(r => r.id),
        qualityScore: 90,
        estimatedEffectiveness: 87,
        tags: ['situational', 'strategic', 'adaptive', 'relationship-focused']
      }
    ];

    return additionalPrompts.slice(0, count);
  }

  // Utility methods for analysis
  static validateRequirementsInput(input: RequirementsAnalysisInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.naturalLanguageDescription || input.naturalLanguageDescription.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (input.naturalLanguageDescription && input.naturalLanguageDescription.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static getAnalysisStats(): {
    cacheSize: number;
    totalAnalyses: number;
    averageProcessingTime: number;
  } {
    return {
      cacheSize: requirementsCache.size,
      totalAnalyses: 0, // Would be tracked in a real implementation
      averageProcessingTime: 0 // Would be calculated from usage tracking
    };
  }

  // Clear cache (useful for testing or memory management)
  static clearCache(): void {
    requirementsCache.clear();
    debugLog('🧹 Requirements analysis cache cleared');
  }
}
