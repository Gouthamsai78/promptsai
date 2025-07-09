import { debugLog } from '../utils/debug';
import { UsageTrackingService } from './usageTracking';
import { PromptTemplateService } from './promptTemplates';

// OpenRouter API configuration (Free models optimized for prompt engineering)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Universal prompt enhancement model - Optimized for all AI systems
const UNIVERSAL_ENHANCEMENT_MODEL = 'meta-llama/llama-3.2-3b-instruct:free'; // Primary: Best for universal prompt engineering
const VISION_MODEL_NAME = 'qwen/qwen2.5-vl-32b-instruct:free'; // Vision model for image analysis

// Enhanced fallback models optimized for universal prompt enhancement
const UNIVERSAL_FALLBACK_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free', // Primary: Best for instruction following and prompt engineering
  'microsoft/phi-3-mini-128k-instruct:free', // Fallback 1: Good for structured outputs
  'google/gemma-2-9b-it:free', // Fallback 2: Strong reasoning capabilities
  'mistralai/mistral-small-3.2-24b-instruct:free', // Fallback 3: Reliable general purpose
  'deepseek/deepseek-r1-0528-qwen3-8b:free', // Fallback 4: Good reasoning capabilities
  'deepseek/deepseek-r1-0528:free', // Fallback 5: General purpose
  'sarvamai/sarvam-m:free' // Fallback 6: Multilingual support
];

// Vision-capable fallback models
const VISION_FALLBACK_MODELS = [
  'qwen/qwen2.5-vl-32b-instruct:free'
];

// Universal model selection for all enhancement types
const getUniversalModel = (taskType: 'universal_enhancement' | 'vision'): string => {
  switch (taskType) {
    case 'universal_enhancement':
      return UNIVERSAL_ENHANCEMENT_MODEL;
    case 'vision':
      return VISION_MODEL_NAME;
    default:
      return UNIVERSAL_ENHANCEMENT_MODEL;
  }
};

// Universal prompt categories for Galaxy.AI style enhancement
const UNIVERSAL_CATEGORIES = {
  IMAGE_GENERATION: 'image_generation',
  TEXT_AI: 'text_ai',
  CODE_GENERATION: 'code_generation',
  CREATIVE_WRITING: 'creative_writing',
  ANALYSIS: 'analysis',
  RESEARCH: 'research'
} as const;

type UniversalCategory = typeof UNIVERSAL_CATEGORIES[keyof typeof UNIVERSAL_CATEGORIES];

// Keywords for intelligent category detection
const CATEGORY_KEYWORDS = {
  [UNIVERSAL_CATEGORIES.IMAGE_GENERATION]: [
    'image', 'photo', 'picture', 'art', 'painting', 'drawing', 'illustration', 'portrait', 'landscape',
    'midjourney', 'dall-e', 'stable diffusion', 'leonardo', 'generate', 'create image', 'visual',
    'camera', 'photography', 'artistic', 'digital art', 'concept art', 'render', 'scene', 'character',
    'lighting', 'composition', 'shot', 'angle', 'color', 'texture', 'realistic', 'cinematic',
    'a woman', 'a man', 'a person', 'a cat', 'a dog', 'a house', 'a car'
  ],
  [UNIVERSAL_CATEGORIES.TEXT_AI]: [
    'chatgpt', 'claude', 'gemini', 'gpt', 'conversation', 'chat', 'explain', 'help me', 'write',
    'email', 'letter', 'message', 'response', 'answer', 'question', 'discuss', 'tell me',
    'summarize', 'translate', 'rewrite', 'improve', 'edit', 'proofread', 'feedback'
  ],
  [UNIVERSAL_CATEGORIES.CODE_GENERATION]: [
    'code', 'function', 'class', 'method', 'algorithm', 'program', 'script', 'api', 'database',
    'react', 'python', 'javascript', 'typescript', 'java', 'c++', 'html', 'css', 'sql',
    'github copilot', 'codet5', 'codex', 'programming', 'development', 'software', 'debug',
    'refactor', 'optimize', 'test', 'documentation', 'framework', 'library'
  ],
  [UNIVERSAL_CATEGORIES.CREATIVE_WRITING]: [
    'story', 'novel', 'poem', 'creative', 'fiction', 'character', 'plot', 'narrative',
    'jasper', 'copy.ai', 'writesonic', 'marketing copy', 'blog post', 'article', 'content',
    'screenplay', 'dialogue', 'scene', 'chapter', 'verse', 'prose', 'creative writing'
  ],
  [UNIVERSAL_CATEGORIES.ANALYSIS]: [
    'analyze', 'analysis', 'review', 'evaluate', 'assess', 'examine', 'study', 'compare',
    'data', 'statistics', 'report', 'findings', 'insights', 'trends', 'patterns',
    'interpret', 'conclude', 'summarize findings', 'critical analysis'
  ],
  [UNIVERSAL_CATEGORIES.RESEARCH]: [
    'research', 'investigate', 'explore', 'find information', 'sources', 'references',
    'academic', 'scholarly', 'literature review', 'bibliography', 'citations',
    'fact check', 'verify', 'gather information', 'comprehensive study'
  ]
};

// Enhanced prompt styles
export type PromptStyle = 'photographic' | 'artistic' | 'cinematic' | 'digital_art';

export interface EnhancedPrompt {
  id: string;
  style: PromptStyle;
  prompt: string;
  description: string;
}

export interface PromptEnhancementResult {
  original: string;
  enhanced: EnhancedPrompt[];
  processingTime: number;
}

export interface ImageAnalysisResult {
  description: string;
  detectedStyle: string;
  suggestedTags: string[];
  enhancedPrompts: EnhancedPrompt[];
}

// Cache for enhanced prompts to avoid redundant API calls
const promptCache = new Map<string, CacheEntry>();
const imageCache = new Map<string, ImageCacheEntry>();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  result: PromptEnhancementResult;
  timestamp: number;
}

interface ImageCacheEntry {
  result: ImageAnalysisResult;
  timestamp: number;
}

export class AIService {
  // Get API key dynamically to ensure it's always current
  private static getApiKey(): string | undefined {
    return import.meta.env.VITE_OPENROUTER_API_KEY;
  }

  // Check if AI service is available
  static isAIAvailable(): boolean {
    const apiKey = this.getApiKey();

    // Enhanced debugging for API key issues
    debugLog('🔍 AI Service Debug Info:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey?.substring(0, 20) || 'undefined',
      envVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
      rawEnvValue: import.meta.env.VITE_OPENROUTER_API_KEY ? 'Present' : 'Missing',
      envType: typeof import.meta.env.VITE_OPENROUTER_API_KEY
    });

    if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined') {
      debugLog('🤖 AI Service: OpenRouter API key not configured or invalid');
      debugLog('🔍 Environment check:', {
        VITE_OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY ? 'Present' : 'Missing',
        keyStartsWith: apiKey?.startsWith('sk-or-v1-') ? 'Valid format' : 'Invalid format'
      });
      return false;
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-or-v1-')) {
      debugLog('❌ Invalid OpenRouter API key format. Should start with "sk-or-v1-"');
      return false;
    }

    debugLog('✅ AI Service available with valid API key');
    return true;
  }

  // Make API request to OpenRouter with universal model support
  private static async makeAPIRequest(messages: any[], temperature = 0.7, taskType: 'universal_enhancement' | 'general_chat' = 'universal_enhancement', requestType: 'universal_prompt_enhancement' | 'image_analysis' | 'chat_response' = 'chat_response', category: string = 'general'): Promise<string> {
    const primaryModel = getUniversalModel(taskType === 'universal_enhancement' ? 'universal_enhancement' : 'universal_enhancement');
    return this.makeAPIRequestWithModels([primaryModel, ...UNIVERSAL_FALLBACK_MODELS], messages, temperature, requestType, category);
  }

  // Make vision API request to OpenRouter with vision-capable models
  private static async makeVisionAPIRequest(messages: any[], temperature = 0.7, category: string = 'image_analysis'): Promise<string> {
    return this.makeAPIRequestWithModels([VISION_MODEL_NAME, ...VISION_FALLBACK_MODELS], messages, temperature, 'image_analysis', category);
  }

  // Generic method to make API requests with specific model list
  private static async makeAPIRequestWithModels(modelsToTry: string[], messages: any[], temperature = 0.7, requestType: 'prompt_enhancement' | 'image_analysis' | 'chat_response' = 'chat_response', category: string = 'general'): Promise<string> {
    if (!this.isAIAvailable()) {
      throw new Error('AI service not available - missing API key');
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API key not available');
    }

    let lastError: Error | null = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i];

      try {
        debugLog(`🤖 Attempting OpenRouter API request with model ${i + 1}/${modelsToTry.length}:`, {
          model: currentModel,
          url: OPENROUTER_API_URL,
          hasApiKey: !!apiKey,
          apiKeyPrefix: apiKey?.substring(0, 15),
          messagesCount: messages.length,
          temperature,
          attemptNumber: i + 1,
          isVisionModel: currentModel.includes('vl') || currentModel.includes('vision')
        });

        const requestBody = {
          model: currentModel,
          messages,
          temperature,
          max_tokens: 2000,
        };

        return await this.makeModelRequest(requestBody, apiKey, currentModel, requestType, category);
      } catch (error: any) {
        lastError = error;
        debugLog(`❌ Model ${currentModel} failed:`, {
          error: error.message,
          attemptNumber: i + 1,
          willRetry: i < modelsToTry.length - 1
        });

        // Track failed request (only for the last attempt to avoid duplicate tracking)
        if (i === modelsToTry.length - 1) {
          const inputLength = JSON.stringify(messages).length;
          UsageTrackingService.trackRequest(
            requestType,
            category,
            currentModel,
            0, // No processing time for failed requests
            false, // failed
            inputLength,
            0 // No output for failed requests
          );
        }

        // If this is a 404 error (model not found), try the next model
        if (error.message.includes('404') || error.message.includes('No endpoints found')) {
          continue;
        }

        // For other errors, still try fallback models but log the specific error
        if (i < modelsToTry.length - 1) {
          debugLog(`🔄 Trying fallback model due to error: ${error.message}`);
          continue;
        }
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All models failed');
  }

  // Make request to specific model
  private static async makeModelRequest(requestBody: any, apiKey: string, modelName: string, requestType: 'prompt_enhancement' | 'image_analysis' | 'chat_response' = 'chat_response', category: string = 'general'): Promise<string> {
    debugLog('🔍 Request details:', {
      model: modelName,
      body: requestBody,
      headers: {
        'Authorization': `Bearer ${apiKey?.substring(0, 15)}...`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PromptShare AI Enhancement',
      }
    });

    debugLog('🚀 Making fetch request to OpenRouter...');
    const startTime = Date.now();

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'PromptShare AI Enhancement',
      },
      body: JSON.stringify(requestBody),
    });

    const processingTime = Date.now() - startTime;
    debugLog('🔍 Fetch completed, response received');

    debugLog('🔍 Response status:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      model: modelName,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      let errorData: string;
      try {
        errorData = await response.text();
      } catch (e) {
        errorData = 'Unable to read error response';
      }

      debugLog('❌ OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: OPENROUTER_API_URL,
        model: modelName,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Try to parse error as JSON for structured error messages
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(errorData);
      } catch (e) {
        // Error data is not JSON, use as-is
      }

      // Provide specific error messages for common issues
      if (response.status === 404) {
        const errorMsg = parsedError?.error?.message || errorData;
        throw new Error(`Model '${modelName}' not found: ${errorMsg}. The model may have been deprecated or the name is incorrect.`);
      } else if (response.status === 401) {
        const errorMsg = parsedError?.error?.message || 'Invalid API key';
        throw new Error(`Authentication failed: ${errorMsg}. Please check your OpenRouter API key.`);
      } else if (response.status === 429) {
        const errorMsg = parsedError?.error?.message || 'Rate limit exceeded';
        throw new Error(`Rate limit exceeded: ${errorMsg}. Please try again later.`);
      } else if (response.status === 400) {
        const errorMsg = parsedError?.error?.message || errorData;
        throw new Error(`Bad request: ${errorMsg}. Check your request parameters.`);
      } else if (response.status === 500) {
        const errorMsg = parsedError?.error?.message || 'Internal server error';
        throw new Error(`OpenRouter server error: ${errorMsg}. Please try again later.`);
      } else {
        const errorMsg = parsedError?.error?.message || errorData;
        throw new Error(`OpenRouter API error (${response.status}): ${errorMsg}`);
      }
    }

    const data = await response.json();

    // Comprehensive response structure logging
    debugLog('🔍 Raw API Response Structure:', {
      model: modelName,
      fullResponse: data,
      responseType: typeof data,
      hasChoices: 'choices' in data,
      choicesType: typeof data.choices,
      choicesLength: Array.isArray(data.choices) ? data.choices.length : 'not array',
      choicesContent: data.choices,
      firstChoice: data.choices?.[0],
      firstChoiceType: typeof data.choices?.[0],
      hasMessage: data.choices?.[0] && 'message' in data.choices[0],
      messageContent: data.choices?.[0]?.message,
      messageType: typeof data.choices?.[0]?.message,
      hasContent: data.choices?.[0]?.message && 'content' in data.choices[0].message,
      contentValue: data.choices?.[0]?.message?.content,
      contentType: typeof data.choices?.[0]?.message?.content,
      allKeys: Object.keys(data),
      choicesKeys: data.choices?.[0] ? Object.keys(data.choices[0]) : 'no first choice',
      messageKeys: data.choices?.[0]?.message ? Object.keys(data.choices[0].message) : 'no message'
    });

      // Step-by-step content extraction with detailed logging
      debugLog('🔍 Step-by-step content extraction:');

      // Step 1: Check if data exists
      if (!data) {
        debugLog('❌ Step 1 failed: No data object');
        throw new Error('Invalid AI response format: No data object received');
      }
      debugLog('✅ Step 1: Data object exists');

      // Step 2: Check if choices array exists
      if (!data.choices) {
        debugLog('❌ Step 2 failed: No choices array in response');
        debugLog('Available fields:', Object.keys(data));

        // Check for OpenRouter-specific error formats
        if (data.error) {
          debugLog('🔍 OpenRouter error detected:', data.error);
          throw new Error(`OpenRouter API error: ${data.error.message || data.error}`);
        }

        // Check for alternative response structures
        if (data.content) {
          debugLog('🔍 Found direct content field, using alternative structure');
          return data.content.trim();
        }

        if (data.response) {
          debugLog('🔍 Found response field, using alternative structure');
          return data.response.trim();
        }

        throw new Error('Invalid AI response format: No choices array found and no alternative content structure detected');
      }
      debugLog('✅ Step 2: Choices array exists');

      // Step 3: Check if choices is an array and has elements
      if (!Array.isArray(data.choices)) {
        debugLog('❌ Step 3 failed: Choices is not an array, type:', typeof data.choices);
        throw new Error('Invalid AI response format: Choices is not an array');
      }
      if (data.choices.length === 0) {
        debugLog('❌ Step 3 failed: Choices array is empty');
        throw new Error('Invalid AI response format: Empty choices array');
      }
      debugLog('✅ Step 3: Choices array has elements:', data.choices.length);

      // Step 4: Check first choice
      const firstChoice = data.choices[0];
      if (!firstChoice) {
        debugLog('❌ Step 4 failed: First choice is null/undefined');
        throw new Error('Invalid AI response format: First choice is null');
      }
      debugLog('✅ Step 4: First choice exists:', firstChoice);

      // Step 5: Check message object
      if (!firstChoice.message) {
        debugLog('❌ Step 5 failed: No message in first choice');
        debugLog('Available fields in first choice:', Object.keys(firstChoice));
        throw new Error('Invalid AI response format: No message object in first choice');
      }
      debugLog('✅ Step 5: Message object exists:', firstChoice.message);

      // Step 6: Check content field
      const content = firstChoice.message.content;
      if (content === undefined || content === null) {
        debugLog('❌ Step 6 failed: Content is null/undefined');
        debugLog('Available fields in message:', Object.keys(firstChoice.message));
        throw new Error('Invalid AI response format: No content field in message');
      }
      if (typeof content !== 'string') {
        debugLog('❌ Step 6 failed: Content is not a string:', { type: typeof content, value: content });
        throw new Error(`Invalid AI response format: Content is not a string (${typeof content})`);
      }
      if (content.trim().length === 0) {
        debugLog('❌ Step 6 failed: Content is empty string');
        throw new Error('Invalid AI response format: Content is empty');
      }
      debugLog('✅ Step 6: Content is valid string with length:', content.length);

      debugLog('✅ OpenRouter API response successfully parsed', {
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      });

      // Track successful request
      const inputLength = JSON.stringify(requestBody.messages).length;
      const outputLength = content.length;

      UsageTrackingService.trackRequest(
        requestType,
        category,
        modelName,
        processingTime,
        true, // success
        inputLength,
        outputLength
      );

    return content.trim();
  }

  // Generate cache key for prompts
  private static getCacheKey(prompt: string): string {
    return `prompt_${prompt.toLowerCase().trim().replace(/\s+/g, '_')}`;
  }

  // Generate unique cache key for images based on file content
  private static async generateImageCacheKey(file: File): Promise<string> {
    // Create a unique identifier based on file properties and content hash
    const fileInfo = `${file.name}_${file.size}_${file.lastModified}_${file.type}`;

    // For additional uniqueness, we'll use a simple hash of the file content
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return `image_${hashHex.substring(0, 16)}_${file.size}`;
    } catch (error) {
      // Fallback to file properties if crypto is not available
      debugLog('⚠️ Crypto not available, using fallback cache key');
      return `image_${fileInfo.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  }

  // Check cache for existing enhancement
  private static getCachedResult(prompt: string): PromptEnhancementResult | null {
    const key = this.getCacheKey(prompt);
    const cached = promptCache.get(key) as CacheEntry | undefined;

    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      debugLog('🎯 Using cached prompt enhancement');
      return cached.result;
    }

    if (cached) {
      promptCache.delete(key); // Remove expired cache
    }

    return null;
  }

  // Cache enhancement result
  private static cacheResult(prompt: string, result: PromptEnhancementResult): void {
    const key = this.getCacheKey(prompt);
    const cacheEntry: CacheEntry = {
      result,
      timestamp: Date.now(),
    };
    promptCache.set(key, cacheEntry);
  }

  // Check cache for existing image analysis
  private static getCachedImageResult(cacheKey: string): ImageAnalysisResult | null {
    const cached = imageCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      debugLog('🎯 Using cached image analysis');
      return cached.result;
    }

    if (cached) {
      imageCache.delete(cacheKey); // Remove expired cache
    }

    return null;
  }

  // Cache image analysis result
  private static cacheImageResult(cacheKey: string, result: ImageAnalysisResult): void {
    const cacheEntry: ImageCacheEntry = {
      result,
      timestamp: Date.now(),
    };
    imageCache.set(cacheKey, cacheEntry);
  }

  // Detect universal prompt category for Galaxy.AI style enhancement
  static detectUniversalCategory(text: string): UniversalCategory {
    const lowerText = text.toLowerCase();

    // Check each category for matches using predefined keywords
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category as UniversalCategory;
      }
    }

    // Default to text AI if no specific category detected
    return UNIVERSAL_CATEGORIES.TEXT_AI;
  }

  // Legacy method for backward compatibility
  static isImageGenerationPrompt(text: string): boolean {
    return this.detectUniversalCategory(text) === UNIVERSAL_CATEGORIES.IMAGE_GENERATION;
  }

  // Universal enhancement system prompt for all AI systems
  private static getUniversalEnhancementPrompt(category: UniversalCategory): string {
    return `#CONTEXT
You are a world-class universal prompt engineer specializing in optimizing prompts for ANY AI system. Your expertise spans image generation AI (Midjourney, DALL-E, Stable Diffusion, Leonardo), text generation AI (ChatGPT, Claude, Gemini, GPT-4), code generation AI (GitHub Copilot, CodeT5, Codex), creative writing AI (Jasper, Copy.ai, Writesonic), and analysis AI systems. You work with professionals who need superior results from their AI tools.

#GOAL
Transform basic prompts into comprehensive, professional-grade prompts optimized for the specific AI system category. Create detailed, 200-500 word enhanced prompts that will generate dramatically superior results compared to the original input.

#INFORMATION
CATEGORY-SPECIFIC OPTIMIZATION STRATEGIES:

${this.getCategorySpecificGuidelines(category)}

UNIVERSAL QUALITY ENHANCEMENT ELEMENTS:
- Precise technical specifications and parameters
- Clear context and background information
- Specific output format requirements
- Quality modifiers and success criteria
- Professional terminology and industry standards
- Detailed constraints and guidelines
- Examples and reference points where applicable

#RESPONSE GUIDELINES
1. NEVER ask questions - automatically infer optimal enhancements based on the input
2. Create ONE comprehensive, detailed prompt optimized for the detected AI system category
3. Each enhanced prompt should be 200-500 words with specific technical details
4. Use professional terminology and industry-standard specifications
5. Include quality enhancement keywords for superior AI generation results
6. Focus purely on prompt-to-prompt transformation (no conversational elements)
7. Ensure the enhanced prompt is immediately usable in the target AI system

#OUTPUT
Return ONLY the enhanced prompt text - no explanations, no markdown, no additional commentary. Just the optimized prompt ready for use in the target AI system.`;
  }

  // Get display name for category
  private static getCategoryDisplayName(category: UniversalCategory): string {
    switch (category) {
      case UNIVERSAL_CATEGORIES.IMAGE_GENERATION:
        return 'Image Generation AI (Midjourney, DALL-E, Stable Diffusion, Leonardo)';
      case UNIVERSAL_CATEGORIES.TEXT_AI:
        return 'Text/Chat AI (ChatGPT, Claude, Gemini, GPT-4)';
      case UNIVERSAL_CATEGORIES.CODE_GENERATION:
        return 'Code Generation AI (GitHub Copilot, CodeT5, Codex)';
      case UNIVERSAL_CATEGORIES.CREATIVE_WRITING:
        return 'Creative Writing AI (Jasper, Copy.ai, Writesonic)';
      case UNIVERSAL_CATEGORIES.ANALYSIS:
        return 'Analysis AI (Research assistants, data analysis tools)';
      case UNIVERSAL_CATEGORIES.RESEARCH:
        return 'Research AI (Academic research, information gathering tools)';
      default:
        return 'AI Systems';
    }
  }

  // Get style identifier for category
  private static getStyleForCategory(category: UniversalCategory): string {
    switch (category) {
      case UNIVERSAL_CATEGORIES.IMAGE_GENERATION:
        return 'visual';
      case UNIVERSAL_CATEGORIES.TEXT_AI:
        return 'conversational';
      case UNIVERSAL_CATEGORIES.CODE_GENERATION:
        return 'technical';
      case UNIVERSAL_CATEGORIES.CREATIVE_WRITING:
        return 'creative';
      case UNIVERSAL_CATEGORIES.ANALYSIS:
        return 'analytical';
      case UNIVERSAL_CATEGORIES.RESEARCH:
        return 'research';
      default:
        return 'universal';
    }
  }

  // Category-specific enhancement guidelines
  private static getCategorySpecificGuidelines(category: UniversalCategory): string {
    switch (category) {
      case UNIVERSAL_CATEGORIES.IMAGE_GENERATION:
        return `IMAGE GENERATION AI OPTIMIZATION:
- Camera specifications: focal length (14mm-600mm), aperture (f/1.2-f/22), shutter speed, ISO (100-6400)
- Lighting setup: key light, fill light, rim light, color temperature (2700K-6500K), light modifiers
- Composition: rule of thirds, leading lines, depth of field, perspective, framing techniques
- Style specifications: photographic, artistic, cinematic, digital art with specific techniques
- Quality modifiers: award-winning, 8K resolution, hyperdetailed, professional grade, masterpiece
- Technical parameters: rendering quality, post-processing effects, artistic movements, artist references`;

      case UNIVERSAL_CATEGORIES.TEXT_AI:
        return `TEXT/CHAT AI OPTIMIZATION:
- Role definition: specific expert persona with relevant background and expertise
- Context setting: detailed background information and situational context
- Output format: structure, length, style, tone, and presentation requirements
- Reasoning instructions: step-by-step thinking, analysis depth, consideration factors
- Constraint definitions: limitations, boundaries, ethical guidelines, scope parameters
- Quality criteria: accuracy standards, completeness requirements, validation methods`;

      case UNIVERSAL_CATEGORIES.CODE_GENERATION:
        return `CODE GENERATION AI OPTIMIZATION:
- Language specifications: version, syntax standards, framework requirements
- Architecture patterns: design patterns, best practices, coding conventions
- Documentation level: comments, docstrings, README requirements, API documentation
- Error handling: exception management, validation, logging, debugging considerations
- Performance considerations: optimization, scalability, efficiency requirements
- Testing requirements: unit tests, integration tests, test coverage, validation methods`;

      case UNIVERSAL_CATEGORIES.CREATIVE_WRITING:
        return `CREATIVE WRITING AI OPTIMIZATION:
- Genre specifications: detailed genre conventions, tropes, and expectations
- Tone and voice: specific mood, personality, narrative perspective, writing style
- Structure requirements: format, length, pacing, plot elements, character development
- Target audience: demographics, reading level, interests, cultural considerations
- Style guidelines: literary devices, language complexity, dialogue patterns
- Creative constraints: themes, motifs, symbolic elements, narrative techniques`;

      case UNIVERSAL_CATEGORIES.ANALYSIS:
        return `ANALYSIS AI OPTIMIZATION:
- Methodology specifications: analytical framework, approach, systematic process
- Data requirements: sources, types, quality standards, validation criteria
- Analysis depth: surface-level vs deep analysis, multiple perspectives, critical thinking
- Output format: structure, sections, visual elements, summary requirements
- Objectivity guidelines: bias mitigation, evidence-based conclusions, balanced perspectives
- Quality standards: accuracy, completeness, reliability, actionable insights`;

      case UNIVERSAL_CATEGORIES.RESEARCH:
        return `RESEARCH AI OPTIMIZATION:
- Research methodology: systematic approach, search strategies, source evaluation
- Source requirements: academic, scholarly, primary vs secondary, credibility standards
- Scope definition: breadth, depth, time frame, geographical considerations
- Documentation standards: citations, bibliography, reference formatting, attribution
- Verification processes: fact-checking, cross-referencing, source validation
- Deliverable format: comprehensive reports, executive summaries, structured findings`;

      default:
        return `GENERAL AI OPTIMIZATION:
- Clear objective definition and success criteria
- Comprehensive context and background information
- Specific output requirements and format specifications
- Quality standards and professional terminology
- Relevant constraints and guidelines
- Technical specifications where applicable`;
    }
  }

  // Specialized enhancement template methods
  private static getWritingStyleTemplate(userInput: string): string {
    return `You are an expert writing style analyst and prompt engineer. Your task is to help users adopt and maintain their personal writing style across all content.

ANALYSIS REQUIREMENTS:
1. Analyze the user's request for writing style adoption or maintenance
2. If they provide writing samples, identify key style elements (tone, vocabulary, sentence structure, voice)
3. Create prompts that will help them write consistently in their identified style
4. Include specific style guidelines and examples

ENHANCEMENT FOCUS:
- Personal voice and tone consistency
- Vocabulary and language patterns
- Sentence structure and rhythm
- Stylistic preferences and quirks
- Audience-appropriate adaptations

Generate 4 enhanced prompts that help the user maintain their writing style across different contexts:
- Professional: Business and formal writing contexts
- Creative: Artistic and expressive writing
- Educational: Teaching and explanatory content
- Personal: Casual and conversational writing

Each prompt should be 200-300 words with specific style guidance and examples.`;
  }

  private static getPersonalDevelopmentTemplate(userInput: string): string {
    return `You are an expert personal development coach and prompt engineer. Your task is to help users define, develop, and work toward their ideal self.

DEVELOPMENT REQUIREMENTS:
1. Analyze the user's personal growth request or ideal self definition
2. Identify key character traits, values, and goals they want to develop
3. Create actionable prompts for self-reflection and improvement
4. Include specific steps and measurable outcomes

ENHANCEMENT FOCUS:
- Character trait development and strengthening
- Value clarification and alignment
- Goal setting and achievement strategies
- Self-reflection and awareness building
- Habit formation and behavior change

Generate 4 enhanced prompts for comprehensive personal development:
- Self-Assessment: Deep self-reflection and current state analysis
- Goal-Setting: Clear, actionable personal development goals
- Action-Planning: Specific steps and daily practices
- Progress-Tracking: Methods to measure growth and maintain momentum

Each prompt should be 200-300 words with specific exercises and reflection questions.`;
  }

  private static getProfessionalAnalysisTemplate(userInput: string): string {
    return `You are an expert career analyst and professional development specialist. Your task is to create comprehensive, intelligence-report style analyses of professional capabilities and development opportunities.

ANALYSIS REQUIREMENTS:
1. Analyze the user's professional profile, skills, and career context
2. Identify strengths, growth areas, and market opportunities
3. Create structured, engaging professional assessments
4. Include actionable recommendations and development paths

ENHANCEMENT FOCUS:
- Comprehensive skill assessment and gap analysis
- Market positioning and competitive advantages
- Career trajectory planning and optimization
- Professional brand development
- Leadership and competency evaluation

Generate 4 enhanced prompts for professional analysis:
- Skills-Audit: Comprehensive technical and soft skills evaluation
- Market-Analysis: Industry positioning and opportunity assessment
- Leadership-Profile: Management and influence capabilities review
- Development-Plan: Strategic career advancement roadmap

Each prompt should be 200-300 words with professional terminology and structured analysis frameworks.`;
  }

  private static getContentStrategyTemplate(userInput: string): string {
    return `You are an expert content strategist and digital marketing specialist. Your task is to create comprehensive content strategies and blog planning systems.

STRATEGY REQUIREMENTS:
1. Analyze the user's content goals, audience, and niche
2. Generate diverse, audience-targeted content ideas
3. Include SEO considerations and engagement strategies
4. Create sustainable content planning systems

ENHANCEMENT FOCUS:
- Audience analysis and persona development
- Content pillar identification and topic clustering
- SEO optimization and keyword strategy
- Engagement tactics and community building
- Content calendar and workflow optimization

Generate 4 enhanced prompts for content strategy:
- Audience-Research: Deep audience analysis and persona development
- Content-Planning: Strategic content calendar and topic clusters
- SEO-Strategy: Keyword research and optimization tactics
- Engagement-Tactics: Community building and audience interaction strategies

Each prompt should be 200-300 words with actionable marketing strategies and specific tactics.`;
  }

  private static getTravelPlanningTemplate(userInput: string): string {
    return `You are an expert travel planner and budget optimization specialist. Your task is to create detailed, cost-effective travel itineraries that balance affordability with memorable experiences.

PLANNING REQUIREMENTS:
1. Analyze the user's travel goals, budget constraints, and preferences
2. Create detailed itineraries with cost breakdowns
3. Include money-saving tips and budget optimization strategies
4. Balance must-see attractions with hidden gems

ENHANCEMENT FOCUS:
- Budget optimization and cost-saving strategies
- Itinerary planning and time management
- Local experience discovery and cultural immersion
- Transportation and accommodation optimization
- Safety considerations and travel preparation

Generate 4 enhanced prompts for travel planning:
- Budget-Planning: Comprehensive cost analysis and saving strategies
- Itinerary-Design: Day-by-day detailed travel schedules
- Local-Experiences: Authentic cultural activities and hidden gems
- Travel-Preparation: Packing, documentation, and safety planning

Each prompt should be 200-300 words with specific recommendations and practical tips.`;
  }

  private static getEducationalContentTemplate(userInput: string): string {
    return `You are an expert educational content creator and learning specialist. Your task is to break down complex topics into beginner-friendly, engaging educational content.

EDUCATIONAL REQUIREMENTS:
1. Analyze the complex topic or concept to be explained
2. Identify the target learning level and audience needs
3. Create structured, progressive learning approaches
4. Use relatable examples and practical applications

ENHANCEMENT FOCUS:
- Concept simplification and clarity
- Progressive learning structure and scaffolding
- Relatable examples and analogies
- Interactive elements and engagement techniques
- Assessment and comprehension checking

Generate 4 enhanced prompts for educational content:
- Concept-Breakdown: Step-by-step topic deconstruction
- Example-Creation: Relatable analogies and practical applications
- Learning-Structure: Progressive curriculum and skill building
- Assessment-Design: Comprehension checks and practice exercises

Each prompt should be 200-300 words with clear learning objectives and teaching methodologies.`;
  }

  private static getProfessionalCommunicationTemplate(userInput: string): string {
    return `You are an expert business communication specialist and professional writing coach. Your task is to create polished, contextually appropriate professional communications.

COMMUNICATION REQUIREMENTS:
1. Analyze the communication context, recipient, and desired outcome
2. Determine appropriate tone, formality level, and structure
3. Create clear, persuasive, and professional messaging
4. Include cultural and hierarchical considerations

ENHANCEMENT FOCUS:
- Tone and formality calibration
- Clear and persuasive messaging
- Professional etiquette and protocol
- Cultural sensitivity and awareness
- Outcome-focused communication strategies

Generate 4 enhanced prompts for professional communication:
- Email-Crafting: Professional email composition and etiquette
- Presentation-Communication: Clear and engaging business presentations
- Negotiation-Language: Persuasive and diplomatic communication
- Cross-Cultural: Culturally sensitive international business communication

Each prompt should be 200-300 words with specific communication frameworks and examples.`;
  }

  private static getProductivityPlanningTemplate(userInput: string): string {
    return `You are an expert productivity coach and time management specialist. Your task is to create structured productivity systems and time management solutions.

PRODUCTIVITY REQUIREMENTS:
1. Analyze the user's productivity challenges and time management needs
2. Create structured planning systems and workflow optimization
3. Include task prioritization and energy management strategies
4. Design reflection and continuous improvement systems

ENHANCEMENT FOCUS:
- Time blocking and schedule optimization
- Task prioritization and energy management
- Workflow design and automation opportunities
- Distraction management and focus techniques
- Progress tracking and system refinement

Generate 4 enhanced prompts for productivity planning:
- Weekly-Planning: Comprehensive weekly schedule and task organization
- Priority-Management: Task prioritization and energy optimization
- Focus-Systems: Distraction management and deep work strategies
- Progress-Tracking: Productivity measurement and system improvement

Each prompt should be 200-300 words with actionable productivity techniques and tracking methods.`;
  }

  private static getGoalSettingTemplate(userInput: string): string {
    return `You are an expert goal-setting coach and achievement specialist. Your task is to create comprehensive goal-setting and tracking systems that drive consistent progress.

GOAL-SETTING REQUIREMENTS:
1. Analyze the user's goals, timeline, and current situation
2. Create SMART goals with clear milestones and metrics
3. Design accountability systems and progress tracking methods
4. Include motivation strategies and obstacle management

ENHANCEMENT FOCUS:
- SMART goal formulation and clarity
- Milestone creation and progress measurement
- Accountability systems and support structures
- Motivation maintenance and momentum building
- Obstacle anticipation and problem-solving strategies

Generate 4 enhanced prompts for goal setting and achievement:
- Goal-Definition: Clear, measurable goal setting with timelines
- Milestone-Planning: Progress checkpoints and achievement markers
- Accountability-Systems: Support structures and progress sharing
- Motivation-Maintenance: Strategies for sustained effort and momentum

Each prompt should be 200-300 words with specific goal-setting frameworks and tracking systems.`;
  }

  private static getLearningPathTemplate(userInput: string): string {
    return `You are an expert learning designer and skill development specialist. Your task is to create comprehensive, step-by-step learning paths with timelines and resource recommendations.

LEARNING PATH REQUIREMENTS:
1. Analyze the skill or knowledge area the user wants to develop
2. Create progressive learning stages with clear prerequisites
3. Recommend specific resources, tools, and practice methods
4. Include motivation strategies and progress milestones

ENHANCEMENT FOCUS:
- Skill assessment and gap analysis
- Progressive learning structure and sequencing
- Resource curation and recommendation
- Practice opportunities and application methods
- Motivation maintenance and progress celebration

Generate 4 enhanced prompts for personalized learning paths:
- Skill-Assessment: Current ability evaluation and learning goal definition
- Learning-Sequence: Step-by-step curriculum with progressive difficulty
- Resource-Curation: Specific books, courses, tools, and practice materials
- Progress-Tracking: Milestone achievement and skill development measurement

Each prompt should be 200-300 words with specific learning methodologies and resource recommendations.`;
  }

  // Legacy enhancement template method (deprecated - now using universal system)
  private static getEnhancementTemplate(category: UniversalCategory, userInput: string): string {
    // This method is deprecated but kept for backward compatibility
    // The universal system now handles all enhancement through getUniversalEnhancementPrompt
    return this.getUniversalEnhancementPrompt(category);
  }

  // Legacy template methods removed - now using universal enhancement system

  // Track template effectiveness for analytics
  private static trackTemplateEffectiveness(templateId: string, successful: boolean): void {
    try {
      const effectivenessKey = 'promptshare_template_effectiveness';
      const effectiveness = JSON.parse(localStorage.getItem(effectivenessKey) || '{}');

      if (!effectiveness[templateId]) {
        effectiveness[templateId] = { successful: 0, total: 0 };
      }

      effectiveness[templateId].total++;
      if (successful) {
        effectiveness[templateId].successful++;
      }

      localStorage.setItem(effectivenessKey, JSON.stringify(effectiveness));
      debugLog('📊 Template effectiveness tracked:', { templateId, successful });
    } catch (error) {
      debugLog('⚠️ Failed to track template effectiveness:', error);
    }
  }

  // Enhanced chat response with template detection
  static async chatResponseWithTemplates(userInput: string, contextualPrompt?: string): Promise<{
    response: string;
    templateSuggestion?: any;
    appliedTemplate?: any;
  }> {
    if (!this.isAIAvailable()) {
      debugLog('❌ AI service not available for chat response, using mock response');
      return {
        response: "I'm currently in offline mode. While I can't provide AI-enhanced responses right now, I'd be happy to help once the AI service is available. Please check your internet connection or try again later."
      };
    }

    try {
      debugLog('💬 Processing chat response with template detection:', userInput);

      // Detect if a template could be applied
      let templateSuggestion = null;
      let appliedTemplate = null;

      try {
        // Try to detect template suggestions using the PromptTemplateService
        templateSuggestion = PromptTemplateService.analyzePrompt(userInput);
        debugLog('📋 Template suggestion detected:', templateSuggestion);
      } catch (error) {
        debugLog('⚠️ Template detection failed, continuing without templates:', error);
      }

      const finalPrompt = contextualPrompt || userInput;

      const messages = [
        {
          role: 'system',
          content: `You are a helpful AI assistant for PromptShare, a platform for AI creators. You help users with:

1. General questions about AI, creativity, and content creation
2. Writing assistance (blog posts, articles, stories, etc.)
3. Explaining concepts and providing tutorials
4. Brainstorming and creative ideas
5. Technical help with AI tools and platforms

Be conversational, helpful, and creative. Provide detailed, useful responses. If the user asks for content creation (like writing), provide the actual content they requested.

IMPORTANT: If the user's request seems like they want to create an image generation prompt, suggest they use the image prompt enhancement feature instead.`
        },
        {
          role: 'user',
          content: finalPrompt
        }
      ];

      const response = await this.makeAPIRequest(messages, 0.7, 'general_chat', 'chat_response', 'general_chat');
      debugLog('✅ Chat response generated successfully');

      return {
        response,
        templateSuggestion,
        appliedTemplate
      };

    } catch (error: any) {
      debugLog('❌ Template-enhanced chat response failed:', error.message);
      throw new Error(`Chat response failed: ${error.message}`);
    }
  }

  // Handle general chat conversation (not image generation)
  static async chatResponse(userMessage: string): Promise<string> {
    if (!this.isAIAvailable()) {
      return "I'm sorry, but the AI service is currently unavailable. Please check your internet connection and try again.";
    }

    try {
      debugLog('💬 Processing chat message:', userMessage);

      const systemPrompt = `You are a helpful AI assistant for PromptShare, a platform for AI creators. You help users with:

1. General questions about AI, creativity, and content creation
2. Writing assistance (blog posts, articles, stories, etc.)
3. Explaining concepts and providing tutorials
4. Brainstorming and creative ideas
5. Technical help with AI tools and platforms

Be conversational, helpful, and creative. Provide detailed, useful responses. If the user asks for content creation (like writing), provide the actual content they requested.

IMPORTANT: If the user's request seems like they want to create an image generation prompt, suggest they use the image prompt enhancement feature instead.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const response = await this.makeAPIRequest(messages, 0.7, 'general_chat', 'chat_response', 'general_chat');
      debugLog('✅ Chat response generated successfully');
      return response;

    } catch (error: any) {
      debugLog('❌ Chat response failed:', error.message);
      return `I apologize, but I encountered an error while processing your request: ${error.message}. Please try again.`;
    }
  }

  // DEPRECATED: Use detectUniversalCategory() instead for consistent results
  // Detect prompt category for proper enhancement
  static detectPromptCategory(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // Image generation keywords
    const imageKeywords = [
      'image', 'photo', 'picture', 'artwork', 'painting', 'drawing', 'illustration', 'render',
      'portrait', 'landscape', 'scene', 'character', 'design', 'style', 'lighting', 'composition',
      'camera', 'lens', 'aperture', 'depth of field', 'bokeh', 'cinematic', 'photorealistic',
      'digital art', 'concept art', 'fantasy', 'sci-fi', 'realistic', 'abstract', 'minimalist',
      'vintage', 'modern', 'futuristic', 'artistic', 'creative', 'visual', 'aesthetic'
    ];

    // Text/Chat AI keywords
    const textKeywords = [
      'write', 'explain', 'describe', 'tell me', 'help me', 'how to', 'what is', 'why',
      'article', 'essay', 'story', 'blog', 'content', 'copy', 'text', 'paragraph',
      'summary', 'analysis', 'review', 'guide', 'tutorial', 'instructions'
    ];

    // Code generation keywords
    const codeKeywords = [
      'code', 'function', 'class', 'method', 'algorithm', 'programming', 'script',
      'javascript', 'python', 'react', 'html', 'css', 'api', 'database', 'sql',
      'debug', 'fix', 'optimize', 'refactor', 'implement', 'develop'
    ];

    // Creative writing keywords
    const creativeKeywords = [
      'poem', 'poetry', 'song', 'lyrics', 'creative', 'fiction', 'novel', 'screenplay',
      'dialogue', 'character', 'plot', 'narrative', 'storytelling', 'creative writing'
    ];

    // Analysis keywords
    const analysisKeywords = [
      'analyze', 'analysis', 'research', 'study', 'examine', 'evaluate', 'assess',
      'data', 'statistics', 'report', 'findings', 'insights', 'trends', 'compare'
    ];

    // Count keyword matches for each category
    const imageScore = imageKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
    const textScore = textKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
    const codeScore = codeKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
    const creativeScore = creativeKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
    const analysisScore = analysisKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;

    // Determine category based on highest score
    const scores = {
      image_generation: imageScore,
      text_ai: textScore,
      code_generation: codeScore,
      creative_writing: creativeScore,
      analysis: analysisScore
    };

    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === 0) {
      // Default to text_ai for general conversation
      return 'text_ai';
    }

    // Return the category with the highest score
    const category = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore);
    return category || 'text_ai';
  }

  // Universal prompt enhancement for all AI systems (Galaxy.AI style)
  static async enhancePrompt(basicPrompt: string, useFallback: boolean = true): Promise<PromptEnhancementResult> {
    const startTime = Date.now();

    // Enhanced validation
    if (!basicPrompt || typeof basicPrompt !== 'string') {
      throw new Error('Invalid prompt: must be a non-empty string');
    }

    const trimmedPrompt = basicPrompt.trim();

    if (trimmedPrompt.length < 2) {
      throw new Error('Prompt too short to enhance (minimum 2 characters)');
    }

    if (trimmedPrompt.length > 5000) {
      throw new Error('Prompt too long to enhance (maximum 5000 characters)');
    }

    // Detect universal category for intelligent enhancement
    const category = this.detectUniversalCategory(trimmedPrompt);
    debugLog('🎯 Detected universal category:', category);

    // Check cache first
    const cached = this.getCachedResult(trimmedPrompt);
    if (cached) {
      debugLog('🎯 Using cached result for prompt:', trimmedPrompt);
      return cached;
    }

    if (!this.isAIAvailable()) {
      const message = 'AI service not available - OpenRouter API key not configured';
      debugLog('❌ AI service unavailable:', message);
      if (useFallback) {
        // Return mock enhancement when AI is unavailable
        return this.getUniversalMockEnhancement(trimmedPrompt, category, Date.now() - startTime);
      } else {
        throw new Error(message);
      }
    }

    try {
      debugLog('🚀 Enhancing prompt with universal system:', { prompt: trimmedPrompt, category });

      // Get universal enhancement system prompt
      const systemPrompt = this.getUniversalEnhancementPrompt(category);

      // Create universal enhancement user prompt
      const userPrompt = `Transform this basic prompt: "${trimmedPrompt}"

ENHANCEMENT TARGET: ${category.toUpperCase().replace('_', ' ')} AI SYSTEM

REQUIREMENTS:
- Create ONE comprehensive, professional-grade prompt optimized for ${this.getCategoryDisplayName(category)}
- Length: 200-500 words with specific technical details and professional terminology
- Include all relevant specifications, parameters, and quality modifiers for superior results
- Maintain the core intent while dramatically enhancing technical and professional specifications
- Use industry-standard terminology and best practices for the target AI system

Transform the basic input into a detailed, professional prompt that will generate dramatically superior results when used in ${this.getCategoryDisplayName(category)}.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const response = await this.makeAPIRequest(messages, 0.7, 'universal_enhancement', 'universal_prompt_enhancement', category);

      if (!response || response.trim().length === 0) {
        throw new Error('Empty response from AI service');
      }

      // For image generation prompts, create 4 style variations
      if (category === UNIVERSAL_CATEGORIES.IMAGE_GENERATION) {
        const basePrompt = response.trim();

        debugLog('🎨 Creating 4-style variations for image generation prompt:', {
          category,
          basePromptLength: basePrompt.length,
          originalPrompt: trimmedPrompt
        });

        const result: PromptEnhancementResult = {
          original: trimmedPrompt,
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
          processingTime: Date.now() - startTime,
          model: getUniversalModel('universal_enhancement'),
          category: category,
          cached: false
        };

        // Cache the result
        this.cacheResult(trimmedPrompt, result);

        debugLog('✅ Image generation prompt enhanced with 4 styles:', {
          originalLength: trimmedPrompt.length,
          enhancedCount: result.enhanced.length,
          category,
          processingTime: result.processingTime
        });

        return result;
      } else {
        // For other categories, return single enhanced prompt
        const enhancedPrompt = response.trim();

        if (!enhancedPrompt || enhancedPrompt.length === 0) {
          throw new Error('Empty response from AI service');
        }

        const result: PromptEnhancementResult = {
          original: trimmedPrompt,
          enhanced: [{
            id: `universal_${Date.now()}`,
            style: this.getStyleForCategory(category),
            prompt: enhancedPrompt,
            description: `Enhanced for ${this.getCategoryDisplayName(category)}`
          }],
          processingTime: Date.now() - startTime,
          model: getUniversalModel('universal_enhancement'),
          category: category,
          cached: false
        };

        // Cache the result
        this.cacheResult(trimmedPrompt, result);

        debugLog('✅ Universal prompt enhancement completed:', {
          originalLength: trimmedPrompt.length,
          enhancedLength: enhancedPrompt.length,
          category,
          processingTime: result.processingTime
        });

        return result;
      }
    } catch (error: any) {
      debugLog('❌ Universal prompt enhancement failed:', {
        message: error.message,
        stack: error.stack,
        useFallback,
        apiAvailable: this.isAIAvailable()
      });

      if (useFallback) {
        debugLog('🔄 Falling back to universal mock enhancement due to error');
        // Return universal mock enhancement as fallback
        return this.getUniversalMockEnhancement(trimmedPrompt, category, Date.now() - startTime);
      } else {
        // Re-throw the error for proper error handling
        throw error;
      }
    }
  }

  // Universal mock enhancement for when AI is unavailable
  private static getUniversalMockEnhancement(prompt: string, category: UniversalCategory, processingTime: number): PromptEnhancementResult {
    debugLog('🔄 Using universal mock prompt enhancement for category:', category);

    const mockEnhancements = {
      [UNIVERSAL_CATEGORIES.IMAGE_GENERATION]: `${prompt}, professional photography, 85mm lens f/1.8, shallow depth of field, natural lighting, golden hour, high resolution 8K, award-winning composition, photorealistic, hyperdetailed, masterpiece quality`,
      [UNIVERSAL_CATEGORIES.TEXT_AI]: `You are an expert assistant. Please provide a comprehensive, well-structured response to: "${prompt}". Include relevant context, detailed explanations, practical examples, and actionable insights. Structure your response clearly with headings and bullet points where appropriate.`,
      [UNIVERSAL_CATEGORIES.CODE_GENERATION]: `Create a well-documented, production-ready solution for: "${prompt}". Include proper error handling, type annotations, comprehensive comments, unit tests, and follow industry best practices. Ensure code is maintainable, scalable, and follows established design patterns.`,
      [UNIVERSAL_CATEGORIES.CREATIVE_WRITING]: `Write a compelling, engaging piece about: "${prompt}". Develop rich characters, vivid descriptions, authentic dialogue, and a compelling narrative structure. Use literary devices, maintain consistent tone and voice, and create emotional resonance with the target audience.`,
      [UNIVERSAL_CATEGORIES.ANALYSIS]: `Conduct a thorough, systematic analysis of: "${prompt}". Examine multiple perspectives, identify key patterns and trends, evaluate evidence critically, draw well-supported conclusions, and provide actionable recommendations based on comprehensive research and data.`,
      [UNIVERSAL_CATEGORIES.RESEARCH]: `Perform comprehensive research on: "${prompt}". Gather information from credible academic and professional sources, verify facts through cross-referencing, organize findings systematically, cite sources properly, and present a balanced, objective overview of current knowledge and developments.`
    };

    // For image generation, return 4 style variations
    if (category === UNIVERSAL_CATEGORIES.IMAGE_GENERATION) {
      const basePrompt = mockEnhancements[category] || `Enhanced version of: ${prompt}`;

      debugLog('🎨 Creating 4-style MOCK variations for image generation prompt:', {
        category,
        basePromptLength: basePrompt.length,
        originalPrompt: prompt
      });

      return {
        original: prompt,
        enhanced: [
          {
            id: 'mock_photo_1',
            style: 'photographic',
            prompt: `${basePrompt} | Professional photography: shot with 85mm lens at f/2.8, natural lighting, award-winning composition, 8K quality, photorealistic detail`,
            description: 'Professional photography with technical specifications'
          },
          {
            id: 'mock_art_1',
            style: 'artistic',
            prompt: `${basePrompt} | Fine art style: museum-quality composition, artistic lighting, rich textures, masterpiece quality, gallery-worthy presentation`,
            description: 'Fine art style with artistic techniques'
          },
          {
            id: 'mock_cinema_1',
            style: 'cinematic',
            prompt: `${basePrompt} | Cinematic style: movie-quality lighting, dramatic atmosphere, epic visual storytelling, blockbuster aesthetic`,
            description: 'Cinematic film style with dramatic elements'
          },
          {
            id: 'mock_digital_1',
            style: 'digital_art',
            prompt: `${basePrompt} | Digital art: 8K resolution, trending on ArtStation, concept art quality, modern digital techniques, vibrant colors`,
            description: 'Digital art with modern rendering techniques'
          }
        ],
        processingTime,
        model: 'mock_universal_enhancer',
        category: category,
        cached: false
      };
    } else {
      // For other categories, return single enhanced prompt
      const enhancedPrompt = mockEnhancements[category] || `Enhanced version of: ${prompt} with professional specifications and detailed requirements for optimal AI system performance.`;

      return {
        original: prompt,
        enhanced: [{
          id: `mock_${category}_${Date.now()}`,
          style: this.getStyleForCategory(category),
          prompt: enhancedPrompt,
          description: `Mock enhancement for ${this.getCategoryDisplayName(category)}`
        }],
        processingTime,
        model: 'mock_universal_enhancer',
        category: category,
        cached: false
      };
    }
  }

  // Analyze uploaded image and generate enhanced prompts
  static async analyzeImage(imageFile: File): Promise<ImageAnalysisResult> {
    const startTime = Date.now();

    // Enhanced validation
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    if (!imageFile.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${imageFile.type}. Please upload an image file.`);
    }

    if (imageFile.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Image file too large. Please upload an image smaller than 10MB.');
    }

    // Force real API usage - only fall back to mock if API is genuinely unavailable
    const aiAvailable = this.isAIAvailable();
    debugLog('🔍 Image Analysis - AI Service Check:', {
      aiAvailable,
      apiKey: !!this.getApiKey(),
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type
    });

    if (!aiAvailable) {
      debugLog('❌ AI service not available for image analysis - API key missing or invalid');
      throw new Error('AI service not available. Please check your OpenRouter API key configuration.');
    }

    debugLog('✅ AI service available, proceeding with real image analysis...');

    try {
      debugLog('🖼️ Starting comprehensive image analysis:', {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type,
        timestamp: new Date().toISOString()
      });

      // Generate unique cache key for this image
      const cacheKey = await this.generateImageCacheKey(imageFile);
      debugLog('🔑 Generated unique image cache key:', cacheKey);

      // Check cache first
      const cached = this.getCachedImageResult(cacheKey);
      if (cached) {
        debugLog('✅ Using cached image analysis result');
        return cached;
      }

      // Convert image to base64 with validation
      debugLog('🔄 Converting image to base64...');
      const base64Image = await this.fileToBase64(imageFile);

      if (!base64Image || !base64Image.startsWith('data:image/')) {
        throw new Error('Failed to convert image to base64 format');
      }

      debugLog('✅ Image converted to base64:', {
        dataUrlLength: base64Image.length,
        hasDataPrefix: base64Image.startsWith('data:'),
        mimeType: base64Image.split(';')[0]?.split(':')[1] || 'unknown'
      });

      const systemPrompt = `You are an expert image analyst and prompt engineer specializing in creating detailed prompts optimized for ChatGPT and OpenAI's image generation systems (DALL-E, GPT-4 Vision). Your analysis must be specific to each image and create prompts that work exceptionally well with ChatGPT's understanding and generation capabilities.

CHATGPT-OPTIMIZED ANALYSIS REQUIREMENTS:
1. SPECIFIC IMAGE ANALYSIS: Analyze this exact image's unique visual elements with precise descriptions
2. CHATGPT-FRIENDLY DESCRIPTIONS: Use clear, descriptive language that ChatGPT understands well:
   - LIGHTING: Natural language descriptions (soft morning light, dramatic side lighting, warm golden hour, cool blue shadows)
   - COMPOSITION: Clear spatial relationships (centered subject, rule of thirds, leading lines, balanced composition)
   - COLORS: Descriptive color language (warm earth tones, vibrant blues, muted pastels, high contrast black and white)
   - STYLE: Recognizable artistic movements and photography styles (portrait photography, impressionist painting, film noir cinematography)
   - MOOD: Emotional and atmospheric descriptors (serene, dramatic, energetic, contemplative, mysterious)
3. TEXT DETECTION: Identify any readable text, signs, or written elements
4. CHATGPT-OPTIMIZED PROMPTS: Create 4 detailed prompts (150-200 words each) using language patterns that work best with ChatGPT:
   - Use descriptive adjectives and clear nouns
   - Include specific style references ChatGPT recognizes
   - Add technical details in accessible language
   - Structure prompts for maximum ChatGPT comprehension
5. RETURN CLEAN JSON: Provide only valid JSON without markdown formatting or extra text

Return JSON in this exact format:
{
  "description": "Clear 100-150 word description of this image's visual content, style, and key elements",
  "detectedStyle": "Specific style classification (e.g., Portrait Photography, Digital Art, Oil Painting, etc.)",
  "suggestedTags": ["descriptive-tag1", "style-tag2", "mood-tag3", "subject-tag4", "quality-tag5"],
  "textElements": "Any visible text or 'None detected'",
  "colorPalette": "Brief description of the main colors and color scheme",
  "lightingAnalysis": "Simple description of the lighting style and mood",
  "enhancedPrompts": [
    {
      "id": "photo_1",
      "style": "photographic",
      "prompt": "Professional photograph recreating this image: [detailed description of subject and pose], shot with DSLR camera using 85mm lens at f/2.8, [specific lighting description], [composition details], high resolution, sharp focus, professional color grading, award-winning photography, magazine quality, [specific mood and atmosphere], realistic skin tones, perfect exposure, commercial photography style",
      "description": "Professional photography style optimized for ChatGPT"
    },
    {
      "id": "art_1",
      "style": "artistic",
      "prompt": "Fine art painting recreating this image: [detailed subject description], painted in [specific medium like oil paint, watercolor, etc.], [artistic style reference], masterful brushwork, [color palette description], [lighting and mood], museum quality artwork, [composition details], expressive technique, gallery-worthy presentation, artistic interpretation, classical art influence, rich textures and depth",
      "description": "Fine art style optimized for ChatGPT"
    },
    {
      "id": "cinema_1",
      "style": "cinematic",
      "prompt": "Cinematic scene recreating this image: [detailed scene description], filmed with professional cinema camera, [specific lighting setup], [director style reference], dramatic composition, [color grading description], atmospheric mood, [camera angle and framing], film quality, movie poster aesthetic, [genre influence], professional cinematography, epic visual storytelling, blockbuster production value",
      "description": "Cinematic style optimized for ChatGPT"
    },
    {
      "id": "digital_1",
      "style": "digital_art",
      "prompt": "Digital artwork recreating this image: [detailed subject description], created with professional digital art software, [rendering style], 8K ultra high resolution, [lighting and materials], trending on ArtStation, concept art quality, [color and mood description], hyperdetailed rendering, modern digital art style, [specific technique], photorealistic quality, award-winning digital art",
      "description": "Digital art style optimized for ChatGPT"
    }
  ]
}`;

      const userPrompt = `Analyze this image carefully and create 4 detailed prompts optimized for ChatGPT and OpenAI systems. Each prompt should be 150-200 words and designed to help ChatGPT understand and recreate this image effectively.

ANALYSIS REQUIREMENTS:
- VISUAL CONTENT: Describe exactly what you see - subjects, objects, setting, actions
- LIGHTING: Describe the lighting in natural language (soft, dramatic, warm, cool, natural, artificial)
- COMPOSITION: Explain how elements are arranged (centered, rule of thirds, close-up, wide shot)
- COLORS: Describe the color scheme and mood (warm tones, cool blues, high contrast, muted colors)
- STYLE: Identify the artistic or photographic style (portrait, landscape, abstract, realistic, etc.)
- MOOD: Capture the emotional feeling (serene, energetic, mysterious, professional, casual)
- TEXT: Note any visible text, signs, or written elements

PROMPT REQUIREMENTS FOR CHATGPT OPTIMIZATION:
- Use clear, descriptive language that ChatGPT understands well
- Include specific style references (photography styles, art movements, film genres)
- Add quality descriptors (professional, high-resolution, award-winning, detailed)
- Structure prompts with logical flow: subject → setting → style → technical details → mood
- Make each prompt self-contained and complete for ChatGPT to process
- Focus on visual elements that ChatGPT can interpret and generate effectively

Create prompts that will help ChatGPT generate images very similar to this one.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: { url: base64Image }
            }
          ]
        }
      ];

      debugLog('🚀 Making REAL OpenRouter vision API request for image analysis...');

      // Use vision-capable API request method with enhanced error handling
      let response: string;
      try {
        debugLog('📡 Calling OpenRouter API with vision model:', VISION_MODEL_NAME);
        response = await this.makeVisionAPIRequest(messages, 0.7, 'image_analysis');

        if (!response || response.trim().length === 0) {
          throw new Error('Empty response from OpenRouter vision API');
        }

        debugLog('✅ Received REAL response from OpenRouter vision API:', {
          responseLength: response.length,
          responsePreview: response.substring(0, 200),
          hasOpenBrace: response.includes('{'),
          hasCloseBrace: response.includes('}'),
          startsWithBrace: response.trim().startsWith('{'),
          endsWithBrace: response.trim().endsWith('}'),
          isRealAPI: true,
          modelUsed: VISION_MODEL_NAME
        });

        // Log the FULL raw response for debugging
        console.log('🔍 FULL RAW AI RESPONSE:', response);
        console.log('🔍 RAW RESPONSE LENGTH:', response.length);
        console.log('🔍 RAW RESPONSE TYPE:', typeof response);
      } catch (apiError: any) {
        debugLog('❌ Vision API request failed:', {
          error: apiError.message,
          stack: apiError.stack,
          fileName: imageFile.name,
          apiKeyPresent: !!this.getApiKey(),
          isNetworkError: apiError.message?.includes('fetch') || apiError.message?.includes('network')
        });

        // Only fall back to mock if it's a genuine network/server error, not a configuration issue
        if (apiError.message?.includes('API key') || apiError.message?.includes('authentication')) {
          throw new Error(`OpenRouter API authentication failed: ${apiError.message}. Please check your API key.`);
        }

        // For network errors, throw to let the user know there's a connectivity issue
        throw new Error(`Image analysis failed due to network error: ${apiError.message}. Please check your internet connection and try again.`);
      }

      debugLog('🔍 Parsing JSON response with enhanced strategies...');

      let parsedResponse;
      let parseAttempts = 0;
      const maxParseAttempts = 3;

      while (parseAttempts < maxParseAttempts) {
        parseAttempts++;
        debugLog(`🔄 JSON parsing attempt ${parseAttempts}/${maxParseAttempts}`);

        try {
          // Extract JSON with enhanced strategies
          const cleanedResponse = this.extractJSONFromResponse(response);

          // Pre-parsing validation
          if (!cleanedResponse || cleanedResponse.trim().length === 0) {
            throw new Error('Empty cleaned response');
          }

          // Log the cleaned response for debugging
          console.log('🔍 CLEANED JSON RESPONSE:', cleanedResponse);

          // Attempt to parse JSON
          parsedResponse = JSON.parse(cleanedResponse);

          // Log the parsed response structure
          console.log('🔍 PARSED JSON STRUCTURE:', parsedResponse);
          console.log('🔍 PARSED ENHANCED PROMPTS:', parsedResponse.enhancedPrompts);

          debugLog('✅ Successfully parsed JSON response on attempt:', parseAttempts);
          break;

        } catch (parseError: any) {
          debugLog(`❌ JSON parsing attempt ${parseAttempts} failed:`, {
            error: parseError.message,
            responseLength: response.length,
            responsePreview: response.substring(0, 300),
            cleanedPreview: this.extractJSONFromResponse(response).substring(0, 300)
          });

          if (parseAttempts === maxParseAttempts) {
            // Final attempt failed - throw error with detailed information
            debugLog('❌ All JSON parsing attempts failed');
            throw new Error(`Failed to parse AI response after ${maxParseAttempts} attempts. The AI service returned an invalid response format. Please try again.`);
          }

          // Try different cleaning strategies for next attempt
          if (parseAttempts === 2) {
            // Second attempt: try more aggressive cleaning
            response = response.replace(/[^\x20-\x7E\n\r\t]/g, ''); // Remove non-printable characters
          }
        }
      }

      // Enhanced response structure validation with detailed debugging
      debugLog('🔍 Validating response structure...');
      debugLog('📋 Parsed response structure:', {
        type: typeof parsedResponse,
        keys: Object.keys(parsedResponse),
        hasDescription: !!parsedResponse.description,
        hasDetectedStyle: !!parsedResponse.detectedStyle,
        hasSuggestedTags: !!parsedResponse.suggestedTags,
        hasEnhancedPrompts: !!parsedResponse.enhancedPrompts,
        enhancedPromptsType: typeof parsedResponse.enhancedPrompts,
        enhancedPromptsIsArray: Array.isArray(parsedResponse.enhancedPrompts),
        enhancedPromptsLength: parsedResponse.enhancedPrompts?.length || 0,
        fullResponse: JSON.stringify(parsedResponse, null, 2)
      });

      // Check for required fields
      const requiredFields = ['description', 'detectedStyle', 'suggestedTags', 'enhancedPrompts'];
      const missingFields = requiredFields.filter(field => !parsedResponse[field]);

      if (missingFields.length > 0) {
        debugLog('❌ Missing required fields:', missingFields);
        debugLog('📋 Available fields:', Object.keys(parsedResponse));
        throw new Error(`Invalid response structure: missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate enhancedPrompts array with detailed debugging
      debugLog('🔍 Validating enhancedPrompts array...');

      if (!Array.isArray(parsedResponse.enhancedPrompts)) {
        debugLog('❌ enhancedPrompts is not an array:', {
          type: typeof parsedResponse.enhancedPrompts,
          value: parsedResponse.enhancedPrompts,
          isNull: parsedResponse.enhancedPrompts === null,
          isUndefined: parsedResponse.enhancedPrompts === undefined
        });
        throw new Error('Invalid response structure: enhancedPrompts must be an array');
      }

      debugLog('✅ enhancedPrompts is an array with length:', parsedResponse.enhancedPrompts.length);
      debugLog('📋 enhancedPrompts content:', parsedResponse.enhancedPrompts.map((p: any, i: number) => ({
        index: i,
        id: p?.id,
        style: p?.style,
        hasPrompt: !!p?.prompt,
        promptLength: p?.prompt?.length || 0,
        hasDescription: !!p?.description
      })));

      if (parsedResponse.enhancedPrompts.length !== 4) {
        debugLog('❌ Invalid enhancedPrompts array length:', {
          expected: 4,
          actual: parsedResponse.enhancedPrompts.length,
          prompts: parsedResponse.enhancedPrompts
        });

        // Try to fix if we have some prompts but not exactly 4
        if (parsedResponse.enhancedPrompts.length > 0 && parsedResponse.enhancedPrompts.length < 4) {
          debugLog('🔧 Attempting to fix incomplete prompts array...');
          const styles = ['photographic', 'artistic', 'cinematic', 'digital_art'];
          const existingStyles = parsedResponse.enhancedPrompts.map((p: any) => p.style);

          // Fill missing prompts with basic versions
          for (let i = parsedResponse.enhancedPrompts.length; i < 4; i++) {
            const missingStyle = styles.find(style => !existingStyles.includes(style)) || styles[i];
            const styleMap = {
              'photographic': 'photo',
              'artistic': 'art',
              'cinematic': 'cinema',
              'digital_art': 'digital'
            };
            const idPrefix = styleMap[missingStyle as keyof typeof styleMap] || 'prompt';

            parsedResponse.enhancedPrompts.push({
              id: `${idPrefix}_${i + 1}`,
              style: missingStyle,
              prompt: `Enhanced ${missingStyle} prompt based on the analyzed image with professional specifications and technical details.`,
              description: `${missingStyle.charAt(0).toUpperCase() + missingStyle.slice(1)} style enhancement`
            });
          }
          debugLog('✅ Fixed incomplete prompts array');
        } else {
          throw new Error(`Invalid response structure: expected 4 enhanced prompts, got ${parsedResponse.enhancedPrompts.length}`);
        }
      }

      // Validate individual prompts
      const promptValidation = parsedResponse.enhancedPrompts.map((p: any, i: number) => {
        const validation = {
          index: i,
          id: p.id || 'missing',
          style: p.style || 'unknown',
          hasId: !!p.id,
          hasPrompt: !!p.prompt,
          promptLength: p.prompt?.length || 0,
          hasDescription: !!p.description,
          valid: !!(p.id && p.style && p.prompt && p.description)
        };

        debugLog(`📏 Prompt ${i + 1} validation:`, validation);
        return validation;
      });

      const invalidPrompts = promptValidation.filter(v => !v.valid);
      if (invalidPrompts.length > 0) {
        debugLog('❌ Invalid prompts found, attempting to fix:', invalidPrompts);

        // Try to fix missing IDs
        parsedResponse.enhancedPrompts.forEach((p: any, i: number) => {
          if (!p.id) {
            const styleMap = {
              'photographic': 'photo',
              'artistic': 'art',
              'cinematic': 'cinema',
              'digital_art': 'digital'
            };
            const idPrefix = styleMap[p.style as keyof typeof styleMap] || 'prompt';
            p.id = `${idPrefix}_${i + 1}`;
            debugLog(`🔧 Fixed missing ID for prompt ${i + 1}:`, p.id);
          }
        });

        // Re-validate after fixes
        const revalidation = parsedResponse.enhancedPrompts.map((p: any, i: number) => ({
          index: i,
          valid: !!(p.id && p.style && p.prompt && p.description)
        }));

        const stillInvalid = revalidation.filter(v => !v.valid);
        if (stillInvalid.length > 0) {
          debugLog('❌ Still invalid prompts after fixes:', stillInvalid);
          throw new Error(`Invalid prompt structure: ${stillInvalid.length} prompts are still missing required fields`);
        }

        debugLog('✅ Fixed all invalid prompts');
      }

      const promptLengths = promptValidation.map(v => v.promptLength);
      const shortPrompts = promptLengths.filter(length => length < 100);
      if (shortPrompts.length > 0) {
        debugLog('⚠️ Warning: Some prompts are very short:', {
          promptLengths,
          shortPromptsCount: shortPrompts.length,
          threshold: 100
        });
      }

      debugLog('🎉 REAL AI image analysis completed successfully:', {
        processingTime: Date.now() - startTime,
        promptLengths,
        averagePromptLength: Math.round(promptLengths.reduce((a: number, b: number) => a + b, 0) / promptLengths.length),
        cacheKey,
        isRealAPI: true,
        modelUsed: VISION_MODEL_NAME,
        apiProvider: 'OpenRouter',
        enhancedPromptsGenerated: parsedResponse.enhancedPrompts?.length || 0,
        promptStyles: parsedResponse.enhancedPrompts?.map((p: any) => p.style) || []
      });

      // Cache the result for future use
      this.cacheImageResult(cacheKey, parsedResponse as ImageAnalysisResult);

      // Add metadata to indicate this is a real AI response
      const result = parsedResponse as ImageAnalysisResult;
      (result as any).isRealAI = true;
      (result as any).apiProvider = 'OpenRouter';
      (result as any).modelUsed = VISION_MODEL_NAME;

      // Final validation before returning
      debugLog('🔍 Final result validation before return:', {
        hasDescription: !!result.description,
        hasDetectedStyle: !!result.detectedStyle,
        hasSuggestedTags: Array.isArray(result.suggestedTags),
        hasEnhancedPrompts: Array.isArray(result.enhancedPrompts),
        enhancedPromptsCount: result.enhancedPrompts?.length || 0,
        enhancedPromptsStructure: result.enhancedPrompts?.map((p: any) => ({
          id: p.id,
          style: p.style,
          hasPrompt: !!p.prompt,
          hasDescription: !!p.description
        })) || [],
        resultKeys: Object.keys(result)
      });

      if (!result.enhancedPrompts || !Array.isArray(result.enhancedPrompts) || result.enhancedPrompts.length === 0) {
        debugLog('❌ CRITICAL: Enhanced prompts missing or empty in final result!');
        throw new Error('Enhanced prompts are missing from the analysis result');
      }

      debugLog('✅ Final result validation passed - returning result with enhanced prompts');
      return result;
    } catch (error: any) {
      debugLog('❌ Image analysis failed with error:', {
        error: error.message,
        stack: error.stack,
        fileName: imageFile.name,
        fileSize: imageFile.size,
        processingTime: Date.now() - startTime
      });

      // DO NOT fall back to mock analysis - throw the error to indicate real failure
      throw new Error(`Image analysis failed: ${error.message}. Please try again or check your internet connection.`);
    }
  }

  // Convert file to base64 data URL
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Enhanced mock image analysis with better structure
  private static getEnhancedMockImageAnalysis(fileName: string, fileType: string): ImageAnalysisResult {
    debugLog('🔄 Using enhanced mock image analysis due to API issues');

    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'unknown';
    const isPhoto = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension);
    const isVector = ['svg', 'ai', 'eps'].includes(fileExtension);

    return {
      description: `Analyzed image: ${fileName}. ${isPhoto ? 'Photographic content' : isVector ? 'Vector artwork' : 'Digital image'} with professional composition and visual appeal. The image shows good technical execution with clear subject matter and thoughtful presentation.`,
      detectedStyle: isPhoto ? 'Professional Digital Photography' : isVector ? 'Vector Illustration' : 'Digital Artwork',
      suggestedTags: [
        'professional',
        'high-quality',
        'well-composed',
        isPhoto ? 'photography' : 'digital-art',
        'detailed',
        'creative'
      ],
      enhancedPrompts: [
        {
          id: 'photo_1',
          style: 'photographic',
          prompt: `Professional photograph recreating the content from ${fileName}: high-quality portrait or scene shot with DSLR camera using 85mm lens at f/2.8 aperture, natural lighting with soft shadows, award-winning composition following rule of thirds, shallow depth of field with beautiful background blur, rich and balanced color palette, commercial photography quality, magazine-worthy presentation, crisp details and sharp focus throughout, professional color grading, studio-quality lighting setup, realistic skin tones and textures, perfect exposure and contrast`,
          description: 'Professional photography style optimized for ChatGPT'
        },
        {
          id: 'art_1',
          style: 'artistic',
          prompt: `Fine art painting recreating the scene from ${fileName}: masterful oil painting on canvas with visible brushstrokes, classical artistic composition, rich color palette with harmonious tones, dramatic use of light and shadow, museum-quality artwork with detailed texture work, expressive artistic technique, gallery-worthy presentation, artistic interpretation with emotional depth, influenced by classical art masters, traditional painting methods with modern sensibility, fine art quality with artistic flair`,
          description: 'Fine art style optimized for ChatGPT'
        },
        {
          id: 'cinema_1',
          style: 'cinematic',
          prompt: `Cinematic scene recreating the mood from ${fileName}: professional film production quality shot with cinema camera, dramatic three-point lighting setup, Hollywood blockbuster aesthetic, atmospheric mood with cinematic color grading, movie poster composition, epic visual storytelling, film noir lighting influence, anamorphic lens characteristics, professional cinematography techniques, theatrical lighting design, blockbuster movie quality, IMAX-worthy detail and clarity`,
          description: 'Cinematic style optimized for ChatGPT'
        },
        {
          id: 'digital_1',
          style: 'digital_art',
          prompt: `Digital artwork recreating the concept from ${fileName}: created with professional digital art software like Photoshop or Blender, 8K ultra-high resolution rendering, photorealistic materials and lighting, modern digital art style, trending on ArtStation quality, concept art level detail, hyperrealistic rendering with perfect textures, award-winning digital composition, contemporary digital art techniques, professional digital artist quality, cutting-edge rendering technology`,
          description: 'Digital art style optimized for ChatGPT'
        }
      ],
      textElements: 'None detected',
      colorPalette: 'Balanced color composition with professional color grading',
      lightingAnalysis: 'Well-balanced lighting with good contrast and shadow detail'
    };
  }

  // Mock image analysis for when AI is unavailable (should rarely be used now)
  private static getMockImageAnalysis(fileName: string): ImageAnalysisResult {
    debugLog('🔄 Using basic mock image analysis - this should only happen when AI service is completely unavailable');

    return {
      description: `Uploaded image: ${fileName}. Professional quality content with excellent composition, balanced lighting, and strong visual appeal. The image demonstrates good technical execution with clear subject matter and thoughtful framing.`,
      detectedStyle: 'Professional Digital Photography',
      suggestedTags: ['professional', 'high-quality', 'well-composed', 'balanced-lighting', 'digital-photography', 'award-worthy'],
      enhancedPrompts: [
        {
          id: 'photo_1',
          style: 'photographic',
          prompt: `Professional photograph recreating the uploaded image: high-quality digital photography shot with 85mm lens at f/2.8 aperture, natural lighting with soft shadows, award-winning composition following rule of thirds, 8K resolution with photorealistic detail, perfect exposure and color balance, shallow depth of field with beautiful bokeh, professional studio quality, commercial photography standard, magazine-worthy presentation, crisp focus and clarity`,
          description: 'Professional photography style optimized for ChatGPT'
        },
        {
          id: 'art_1',
          style: 'artistic',
          prompt: `Fine art painting recreating the uploaded image: masterful artistic interpretation in oil painting style, museum-quality composition with classical proportions, artistic lighting with dramatic shadows and highlights, rich and harmonious color palette, detailed brushwork and texture, gallery-worthy presentation, fine art photography influence, contemporary art style, expressive artistic technique, professional artist quality`,
          description: 'Fine art style optimized for ChatGPT'
        },
        {
          id: 'cinema_1',
          style: 'cinematic',
          prompt: `Cinematic scene recreating the uploaded image: professional film production quality, dramatic cinematography with movie-quality lighting, atmospheric mood and composition, blockbuster movie aesthetic, high contrast lighting and shadows, epic visual storytelling, professional cinematography techniques, IMAX-worthy detail and clarity, film poster quality, Hollywood production standard`,
          description: 'Cinematic style optimized for ChatGPT'
        },
        {
          id: 'digital_1',
          style: 'digital_art',
          prompt: `Digital artwork recreating the uploaded image: professional digital art masterpiece, 8K ultra-high resolution rendering, trending on ArtStation quality, concept art level detail, modern digital art techniques, vibrant color grading and effects, award-winning digital composition, hyperrealistic detail and textures, contemporary digital art style, professional digital artist quality`,
          description: 'Digital art style optimized for ChatGPT'
        }
      ]
    };
  }

  // Generate enhanced title and description based on prompt
  static async generateContentMetadata(prompt: string): Promise<{ title: string; description: string; tags: string[] }> {
    if (!this.isAIAvailable()) {
      return this.getMockMetadata(prompt);
    }

    try {
      debugLog('📝 Generating content metadata for prompt');

      const systemPrompt = `You are an expert content creator. Generate engaging titles, descriptions, and tags for social media posts based on AI prompts.

CRITICAL RULES:
1. Create catchy, engaging titles (5-8 words max)
2. Write compelling descriptions (1-2 sentences)
3. Generate 5-8 relevant hashtags/tags
4. Return ONLY valid JSON, no other text

Return JSON in this exact format:
{
  "title": "engaging title here",
  "description": "compelling description here",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

      const userPrompt = `Based on this AI prompt, create an engaging title, description, and tags for a social media post:

"${prompt}"

Make it appealing to AI art enthusiasts and creators.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const response = await this.makeAPIRequest(messages, 0.8);

      let parsedResponse;
      try {
        // Extract JSON from markdown code blocks if present
        const cleanedResponse = this.extractJSONFromResponse(response);
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        debugLog('❌ Failed to parse metadata response:', {
          error: parseError,
          responseLength: response.length,
          responsePreview: response.substring(0, 500),
          cleanedPreview: this.extractJSONFromResponse(response).substring(0, 500)
        });
        throw new Error('Invalid AI response format');
      }

      debugLog('✅ Content metadata generated successfully');
      return parsedResponse;
    } catch (error: any) {
      debugLog('❌ Metadata generation failed:', error.message);
      return this.getMockMetadata(prompt);
    }
  }

  // Mock metadata generation
  private static getMockMetadata(prompt: string): { title: string; description: string; tags: string[] } {
    const words = prompt.split(' ').slice(0, 3);
    const title = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Creation';

    return {
      title,
      description: `Amazing AI-generated content created with advanced prompting techniques. Check out this incredible result!`,
      tags: ['ai-art', 'prompt-engineering', 'creative', 'digital-art', 'ai-generated']
    };
  }

  // Clear all caches (useful for testing)
  static clearCache(): void {
    promptCache.clear();
    imageCache.clear();
    debugLog('🗑️ AI prompt and image caches cleared');
  }

  // Get cache statistics
  static getCacheStats(): { promptCache: { size: number; keys: string[] }; imageCache: { size: number; keys: string[] } } {
    return {
      promptCache: {
        size: promptCache.size,
        keys: Array.from(promptCache.keys())
      },
      imageCache: {
        size: imageCache.size,
        keys: Array.from(imageCache.keys())
      }
    };
  }

  // Enhanced JSON extraction with multiple parsing strategies and validation
  private static extractJSONFromResponse(response: string): string {
    debugLog('🔍 Extracting JSON from AI response with enhanced strategies...');

    if (!response || response.trim().length === 0) {
      throw new Error('Empty response received from AI service');
    }

    // Remove any leading/trailing whitespace
    let cleaned = response.trim();
    debugLog('📝 Original response length:', response.length);
    debugLog('📝 Response preview:', response.substring(0, 300) + '...');

    // Strategy 1: Check for markdown code blocks with various formats
    const codeBlockPatterns = [
      /```(?:json)?\s*(\{[\s\S]*?\})\s*```/gi,
      /```(\{[\s\S]*?\})```/gi,
      /`(\{[\s\S]*?\})`/gi
    ];

    for (const pattern of codeBlockPatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        debugLog('✅ Found JSON in code block with pattern:', pattern.source);
        // Extract the JSON content from the first capture group
        const jsonContent = match[0].replace(/```(?:json)?/gi, '').replace(/```/g, '').replace(/`/g, '').trim();
        if (this.isValidJSONStructure(jsonContent)) {
          debugLog('✅ Valid JSON structure found in code block');
          return jsonContent;
        }
      }
    }

    // Strategy 2: Look for JSON object boundaries with better detection
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      debugLog('✅ Found JSON object boundaries at positions:', { start: jsonStart, end: jsonEnd });
      const extractedJson = cleaned.substring(jsonStart, jsonEnd + 1);

      if (this.isValidJSONStructure(extractedJson)) {
        debugLog('✅ Valid JSON structure found in boundaries');
        return extractedJson;
      }
    }

    // Strategy 3: Try to find nested JSON objects
    const nestedJsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    const nestedMatches = cleaned.match(nestedJsonRegex);

    if (nestedMatches) {
      for (const match of nestedMatches) {
        if (this.isValidJSONStructure(match)) {
          debugLog('✅ Valid nested JSON structure found');
          return match;
        }
      }
    }

    // Strategy 4: Clean common formatting issues
    const cleanedFormatted = cleaned
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays

    if (this.isValidJSONStructure(cleanedFormatted)) {
      debugLog('✅ Valid JSON found after formatting cleanup');
      return cleanedFormatted;
    }

    debugLog('❌ No valid JSON structure found with any strategy');
    debugLog('🔍 Final cleaned preview:', cleaned.substring(0, 500));

    // Return the best attempt for error reporting
    return cleaned;
  }

  // Validate JSON structure before parsing
  private static isValidJSONStructure(text: string): boolean {
    try {
      const trimmed = text.trim();
      if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
        return false;
      }

      // Quick validation - count braces
      let braceCount = 0;
      for (const char of trimmed) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (braceCount < 0) return false;
      }

      return braceCount === 0;
    } catch {
      return false;
    }
  }

  // Debug image analysis with detailed logging
  static async debugImageAnalysis(imageFile: File): Promise<{ success: boolean; result?: any; error?: string; details: any }> {
    debugLog('🧪 DEBUG: Starting comprehensive image analysis test...');

    const details: any = {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type,
      timestamp: new Date().toISOString(),
      steps: []
    };

    try {
      // Step 1: Check AI availability
      const aiAvailable = this.isAIAvailable();
      details.steps.push({ step: 'AI_AVAILABILITY', result: aiAvailable });
      debugLog('🔍 Step 1 - AI Service availability:', aiAvailable);

      if (!aiAvailable) {
        details.steps.push({ step: 'FALLBACK_TO_MOCK', reason: 'AI service not available' });
        const mockResult = this.getEnhancedMockImageAnalysis(imageFile.name, imageFile.type);
        return {
          success: true,
          result: mockResult,
          details
        };
      }

      // Step 2: Convert to base64
      debugLog('🔍 Step 2 - Converting to base64...');
      const base64Image = await this.fileToBase64(imageFile);
      details.steps.push({
        step: 'BASE64_CONVERSION',
        result: 'success',
        dataUrlLength: base64Image.length,
        hasDataPrefix: base64Image.startsWith('data:image/')
      });

      if (!base64Image || !base64Image.startsWith('data:image/')) {
        throw new Error('Failed to convert image to base64 format');
      }

      // Step 3: Prepare API request
      debugLog('🔍 Step 3 - Preparing API request...');
      const systemPrompt = `You are an expert image analyst. Analyze this image and return ONLY valid JSON in this exact format:
{
  "description": "Brief description of the image",
  "detectedStyle": "Style classification",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "textElements": "Any visible text or 'None detected'",
  "colorPalette": "Color description",
  "lightingAnalysis": "Lighting description",
  "enhancedPrompts": [
    {
      "id": "photo_1",
      "style": "photographic",
      "prompt": "Detailed photography prompt",
      "description": "Photography style description"
    },
    {
      "id": "art_1",
      "style": "artistic",
      "prompt": "Detailed art prompt",
      "description": "Art style description"
    },
    {
      "id": "cinema_1",
      "style": "cinematic",
      "prompt": "Detailed cinema prompt",
      "description": "Cinema style description"
    },
    {
      "id": "digital_1",
      "style": "digital_art",
      "prompt": "Detailed digital art prompt",
      "description": "Digital art style description"
    }
  ]
}`;

      const userPrompt = `Analyze this image and create 4 detailed prompts optimized for ChatGPT. Return only valid JSON.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ];

      details.steps.push({ step: 'API_REQUEST_PREPARED', messageCount: messages.length });

      // Step 4: Make API request
      debugLog('🔍 Step 4 - Making API request...');
      const response = await this.makeVisionAPIRequest(messages, 0.7, 'debug_image_analysis');

      details.steps.push({
        step: 'API_RESPONSE_RECEIVED',
        responseLength: response.length,
        responsePreview: response.substring(0, 300),
        hasOpenBrace: response.includes('{'),
        hasCloseBrace: response.includes('}')
      });

      // Step 5: Parse JSON
      debugLog('🔍 Step 5 - Parsing JSON response...');
      const cleanedResponse = this.extractJSONFromResponse(response);
      details.steps.push({
        step: 'JSON_EXTRACTION',
        cleanedLength: cleanedResponse.length,
        cleanedPreview: cleanedResponse.substring(0, 300)
      });

      const parsedResponse = JSON.parse(cleanedResponse);
      details.steps.push({
        step: 'JSON_PARSING',
        result: 'success',
        hasEnhancedPrompts: !!parsedResponse.enhancedPrompts,
        promptCount: parsedResponse.enhancedPrompts?.length || 0
      });

      // Step 6: Validate structure
      debugLog('🔍 Step 6 - Validating response structure...');
      const requiredFields = ['description', 'detectedStyle', 'suggestedTags', 'enhancedPrompts'];
      const missingFields = requiredFields.filter(field => !parsedResponse[field]);

      if (missingFields.length > 0) {
        details.steps.push({ step: 'VALIDATION_FAILED', missingFields });
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (!Array.isArray(parsedResponse.enhancedPrompts) || parsedResponse.enhancedPrompts.length !== 4) {
        details.steps.push({
          step: 'PROMPTS_VALIDATION_FAILED',
          isArray: Array.isArray(parsedResponse.enhancedPrompts),
          length: parsedResponse.enhancedPrompts?.length || 0
        });
        throw new Error(`Expected 4 enhanced prompts, got ${parsedResponse.enhancedPrompts?.length || 0}`);
      }

      details.steps.push({ step: 'VALIDATION_SUCCESS', promptCount: 4 });

      debugLog('✅ DEBUG: Image analysis completed successfully');
      return {
        success: true,
        result: parsedResponse,
        details
      };

    } catch (error: any) {
      debugLog('❌ DEBUG: Image analysis failed:', error.message);
      details.steps.push({ step: 'ERROR', error: error.message });

      // Return mock as fallback
      const mockResult = this.getEnhancedMockImageAnalysis(imageFile.name, imageFile.type);
      return {
        success: false,
        result: mockResult,
        error: error.message,
        details
      };
    }
  }

  // Test image analysis functionality (for debugging)
  static async testImageAnalysis(imageFile: File): Promise<{ success: boolean; details: any }> {
    debugLog('🧪 Testing image analysis functionality...');

    try {
      const startTime = Date.now();

      // Test 1: Check AI availability
      const aiAvailable = this.isAIAvailable();
      debugLog('🔍 AI Service availability:', aiAvailable);

      if (!aiAvailable) {
        return {
          success: false,
          details: {
            error: 'AI service not available',
            aiAvailable: false,
            apiKey: !!this.getApiKey()
          }
        };
      }

      // Test 2: Check image conversion
      const base64Image = await this.fileToBase64(imageFile);
      const isValidBase64 = base64Image.startsWith('data:image/');
      debugLog('🔍 Image conversion test:', {
        isValidBase64,
        dataUrlLength: base64Image.length,
        mimeType: base64Image.split(';')[0]?.split(':')[1]
      });

      // Test 3: Attempt actual analysis
      const result = await this.analyzeImage(imageFile);
      const processingTime = Date.now() - startTime;

      // Test 4: Validate result quality
      const promptLengths = result.enhancedPrompts.map(p => p.prompt.length);
      const averageLength = promptLengths.reduce((a, b) => a + b, 0) / promptLengths.length;
      const hasDetailedPrompts = promptLengths.every(length => length >= 200);

      debugLog('✅ Image analysis test completed:', {
        processingTime,
        promptLengths,
        averageLength,
        hasDetailedPrompts
      });

      return {
        success: true,
        details: {
          processingTime,
          promptLengths,
          averageLength,
          hasDetailedPrompts,
          promptCount: result.enhancedPrompts.length,
          description: result.description,
          detectedStyle: result.detectedStyle,
          suggestedTagsCount: result.suggestedTags.length
        }
      };
    } catch (error: any) {
      debugLog('❌ Image analysis test failed:', error.message);
      return {
        success: false,
        details: {
          error: error.message,
          stack: error.stack
        }
      };
    }
  }

  // ===== ADVANCED PROMPT TRANSFORMATION ENGINE =====

  // Transform basic prompts into professional meta-prompts
  static transformPrompt(basicPrompt: string): PromptTransformationResult {
    if (!basicPrompt || basicPrompt.trim().length < 2) {
      throw new Error('Prompt too short to transform');
    }

    const trimmedPrompt = basicPrompt.trim();
    debugLog('🔄 Starting prompt transformation:', trimmedPrompt);

    try {
      // Step 1: Analyze the prompt
      const analysis = PromptTemplateService.analyzePrompt(trimmedPrompt);
      debugLog('📊 Prompt analysis completed:', analysis);

      // Step 2: Transform to meta-prompt
      const transformation = PromptTemplateService.transformToMetaPrompt(trimmedPrompt, analysis);
      debugLog('✨ Prompt transformation completed:', {
        original: transformation.original,
        qualityScore: transformation.qualityScore,
        appliedTechniques: transformation.appliedTechniques.length,
        processingTime: transformation.processingTime
      });

      return transformation;
    } catch (error: any) {
      debugLog('❌ Prompt transformation failed:', error.message);
      throw new Error(`Prompt transformation failed: ${error.message}`);
    }
  }

  // Enhanced prompt processing that returns transformed prompts instead of content
  static async enhancePromptToMetaPrompt(basicPrompt: string): Promise<PromptTransformationResult> {
    if (!basicPrompt || basicPrompt.trim().length < 2) {
      throw new Error('Prompt too short to enhance');
    }

    const trimmedPrompt = basicPrompt.trim();
    debugLog('🚀 Enhancing prompt to meta-prompt:', trimmedPrompt);

    // For now, use the local transformation engine
    // In the future, this could be enhanced with AI-powered optimization
    return this.transformPrompt(trimmedPrompt);
  }

  // Batch transform multiple prompts
  static transformMultiplePrompts(prompts: string[]): PromptTransformationResult[] {
    debugLog('🔄 Batch transforming prompts:', prompts.length);

    return prompts.map(prompt => {
      try {
        return this.transformPrompt(prompt);
      } catch (error: any) {
        debugLog('❌ Failed to transform prompt:', { prompt, error: error.message });
        // Return a basic transformation result for failed prompts
        return {
          original: prompt,
          transformedPrompt: `You are a professional consultant. Please address the following request: "${prompt}"`,
          transformationType: 'meta-prompt' as const,
          qualityScore: 30,
          improvements: ['Basic professional framing applied'],
          appliedTechniques: ['Simple role assignment'],
          expertRole: 'Professional consultant',
          outputSpecifications: ['Professional response required'],
          processingTime: 0,
          templateUsed: 'fallback'
        };
      }
    });
  }

  // Validate transformed prompt quality
  static validateTransformedPrompt(transformation: PromptTransformationResult): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check quality score
    if (transformation.qualityScore < 60) {
      issues.push('Quality score below recommended threshold (60)');
      suggestions.push('Consider adding more specific context and requirements');
    }

    // Check prompt length
    if (transformation.transformedPrompt.length < 200) {
      issues.push('Transformed prompt may be too brief for complex tasks');
      suggestions.push('Add more detailed specifications and examples');
    }

    // Check for required sections
    const requiredSections = ['#CONTEXT', '#GOAL', '#INFORMATION', '#RESPONSE GUIDELINES', '#OUTPUT'];
    const missingSections = requiredSections.filter(section =>
      !transformation.transformedPrompt.includes(section)
    );

    if (missingSections.length > 0) {
      issues.push(`Missing required sections: ${missingSections.join(', ')}`);
      suggestions.push('Ensure all framework sections are included');
    }

    // Check for expert role
    if (!transformation.expertRole || transformation.expertRole.length < 20) {
      issues.push('Expert role definition may be insufficient');
      suggestions.push('Add more specific expertise and credentials');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}
