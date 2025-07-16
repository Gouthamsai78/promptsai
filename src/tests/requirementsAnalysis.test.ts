import { RequirementsAnalysisService } from '../services/requirementsAnalysis';
import { RequirementsAnalysisInput, RequirementsAnalysisResult } from '../types/ai';

// Mock the environment variable
const mockApiKey = 'test-api-key';
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_OPENROUTER_API_KEY: mockApiKey
  }
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('RequirementsAnalysisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RequirementsAnalysisService.clearCache();
  });

  describe('isAvailable', () => {
    it('should return true when API key is available', () => {
      expect(RequirementsAnalysisService.isAvailable()).toBe(true);
    });

    it('should return false when API key is not available', () => {
      // Temporarily remove API key
      const originalEnv = import.meta.env.VITE_OPENROUTER_API_KEY;
      delete import.meta.env.VITE_OPENROUTER_API_KEY;
      
      expect(RequirementsAnalysisService.isAvailable()).toBe(false);
      
      // Restore API key
      import.meta.env.VITE_OPENROUTER_API_KEY = originalEnv;
    });
  });

  describe('validateRequirementsInput', () => {
    it('should validate correct input', () => {
      const input: RequirementsAnalysisInput = {
        naturalLanguageDescription: 'I need a prompt for writing professional emails'
      };

      const result = RequirementsAnalysisService.validateRequirementsInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject input that is too short', () => {
      const input: RequirementsAnalysisInput = {
        naturalLanguageDescription: 'short'
      };

      const result = RequirementsAnalysisService.validateRequirementsInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description must be at least 10 characters long');
    });

    it('should reject input that is too long', () => {
      const input: RequirementsAnalysisInput = {
        naturalLanguageDescription: 'a'.repeat(2001)
      };

      const result = RequirementsAnalysisService.validateRequirementsInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description must be less than 2000 characters');
    });
  });

  describe('analyzeRequirements', () => {
    const mockInput: RequirementsAnalysisInput = {
      naturalLanguageDescription: 'I need a prompt that will help me write professional emails with a friendly tone',
      targetLength: 'medium',
      complexityLevel: 'intermediate'
    };

    it('should return cached result when available', async () => {
      // First call
      const result1 = await RequirementsAnalysisService.analyzeRequirements(mockInput);
      
      // Second call should use cache
      const result2 = await RequirementsAnalysisService.analyzeRequirements(mockInput);
      
      expect(result1).toEqual(result2);
      expect(fetch).toHaveBeenCalledTimes(0); // Should use mock data, not API
    });

    it('should return mock analysis when API is not available', async () => {
      // Remove API key temporarily
      const originalEnv = import.meta.env.VITE_OPENROUTER_API_KEY;
      delete import.meta.env.VITE_OPENROUTER_API_KEY;

      const result = await RequirementsAnalysisService.analyzeRequirements(mockInput);

      expect(result).toBeDefined();
      expect(result.originalDescription).toBe(mockInput.naturalLanguageDescription);
      expect(result.generatedPrompts).toHaveLength(3);
      expect(result.parsedRequirements.length).toBeGreaterThan(0);

      // Restore API key
      import.meta.env.VITE_OPENROUTER_API_KEY = originalEnv;
    });

    it('should handle API success response', async () => {
      const mockApiResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              parsedRequirements: [
                {
                  id: 'req_1',
                  description: 'Professional tone',
                  category: 'tone',
                  priority: 'high',
                  value: 'professional'
                }
              ],
              identifiedUseCase: 'Email writing',
              targetAudience: 'Business professionals',
              desiredOutputFormat: 'Email',
              suggestedTone: 'Professional',
              detectedConstraints: ['Professional tone required'],
              generatedPrompts: [
                {
                  id: 'prompt_1',
                  title: 'Professional Email Assistant',
                  prompt: 'You are a professional email writing assistant...',
                  explanation: 'This prompt helps write professional emails',
                  addressedRequirements: ['req_1'],
                  qualityScore: 90,
                  estimatedEffectiveness: 85,
                  tags: ['email', 'professional']
                }
              ],
              confidence: 90
            })
          }
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const result = await RequirementsAnalysisService.analyzeRequirements(mockInput);

      expect(result.identifiedUseCase).toBe('Email writing');
      expect(result.generatedPrompts).toHaveLength(1);
      expect(result.confidence).toBe(90);
    });

    it('should handle API error gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await RequirementsAnalysisService.analyzeRequirements(mockInput);

      // Should fallback to mock analysis
      expect(result).toBeDefined();
      expect(result.originalDescription).toBe(mockInput.naturalLanguageDescription);
      expect(result.generatedPrompts.length).toBeGreaterThan(0);
    });
  });

  describe('refineRequirements', () => {
    it('should refine requirements and regenerate prompts', async () => {
      const originalAnalysis: RequirementsAnalysisResult = {
        originalDescription: 'Original description',
        parsedRequirements: [],
        identifiedUseCase: 'Original use case',
        targetAudience: 'Original audience',
        desiredOutputFormat: 'Original format',
        suggestedTone: 'Original tone',
        detectedConstraints: [],
        generatedPrompts: [],
        processingTime: 1000,
        confidence: 80
      };

      const refinements = [
        {
          requirementId: 'req_1',
          newValue: 'More formal tone',
          reason: 'Need more formality'
        }
      ];

      const result = await RequirementsAnalysisService.refineRequirements(originalAnalysis, refinements);

      expect(result).toBeDefined();
      expect(result.originalDescription).toBe(originalAnalysis.originalDescription);
    });
  });

  describe('generateMorePrompts', () => {
    it('should generate additional prompts based on existing analysis', async () => {
      const analysis: RequirementsAnalysisResult = {
        originalDescription: 'Test description',
        parsedRequirements: [],
        identifiedUseCase: 'Test use case',
        targetAudience: 'Test audience',
        desiredOutputFormat: 'Test format',
        suggestedTone: 'Test tone',
        detectedConstraints: [],
        generatedPrompts: [],
        processingTime: 1000,
        confidence: 80
      };

      const additionalPrompts = await RequirementsAnalysisService.generateMorePrompts(analysis, 2);

      expect(additionalPrompts).toBeDefined();
      expect(additionalPrompts.length).toBeLessThanOrEqual(2);
    });
  });

  describe('cache management', () => {
    it('should cache and retrieve results correctly', async () => {
      const input: RequirementsAnalysisInput = {
        naturalLanguageDescription: 'Test caching functionality'
      };

      // First call
      const result1 = await RequirementsAnalysisService.analyzeRequirements(input);
      
      // Second call should use cache
      const result2 = await RequirementsAnalysisService.analyzeRequirements(input);

      expect(result1).toEqual(result2);
    });

    it('should clear cache correctly', async () => {
      const input: RequirementsAnalysisInput = {
        naturalLanguageDescription: 'Test cache clearing'
      };

      await RequirementsAnalysisService.analyzeRequirements(input);
      
      const statsBefore = RequirementsAnalysisService.getAnalysisStats();
      expect(statsBefore.cacheSize).toBeGreaterThan(0);

      RequirementsAnalysisService.clearCache();
      
      const statsAfter = RequirementsAnalysisService.getAnalysisStats();
      expect(statsAfter.cacheSize).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle malformed API responses', async () => {
      const mockApiResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const input: RequirementsAnalysisInput = {
        naturalLanguageDescription: 'Test malformed response handling'
      };

      const result = await RequirementsAnalysisService.analyzeRequirements(input);

      // Should fallback to mock analysis
      expect(result).toBeDefined();
      expect(result.generatedPrompts.length).toBeGreaterThan(0);
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const input: RequirementsAnalysisInput = {
        naturalLanguageDescription: 'Test network error handling'
      };

      const result = await RequirementsAnalysisService.analyzeRequirements(input);

      // Should fallback to mock analysis
      expect(result).toBeDefined();
      expect(result.originalDescription).toBe(input.naturalLanguageDescription);
    });
  });
});
