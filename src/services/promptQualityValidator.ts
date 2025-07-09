import { debugLog } from '../utils/debug';
import { PromptTransformationResult, PromptQualityMetrics } from '../types/ai';

// Quality Validation Types
export interface QualityValidationResult {
  isValid: boolean;
  overallScore: number;
  metrics: PromptQualityMetrics;
  issues: QualityIssue[];
  suggestions: QualitySuggestion[];
  compliance: ComplianceCheck;
}

export interface QualityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  location?: string;
  impact: string;
}

export interface QualitySuggestion {
  priority: 'low' | 'medium' | 'high';
  category: string;
  suggestion: string;
  expectedImprovement: number;
  implementation: string;
}

export interface ComplianceCheck {
  hasExpertRole: boolean;
  hasStructuredFramework: boolean;
  hasContextSection: boolean;
  hasGoalSection: boolean;
  hasInformationSection: boolean;
  hasGuidelinesSection: boolean;
  hasOutputSection: boolean;
  meetsLengthRequirements: boolean;
  hasActionableElements: boolean;
  hasProfessionalTone: boolean;
}

// Professional Prompt Engineering Standards
export class PromptQualityValidator {
  private static readonly MIN_PROMPT_LENGTH = 200;
  private static readonly OPTIMAL_PROMPT_LENGTH = 500;
  private static readonly MAX_PROMPT_LENGTH = 2000;
  private static readonly MIN_QUALITY_SCORE = 70;
  private static readonly REQUIRED_SECTIONS = [
    '#CONTEXT',
    '#GOAL', 
    '#INFORMATION',
    '#RESPONSE GUIDELINES',
    '#OUTPUT'
  ];

  // Main validation method
  static validatePrompt(transformation: PromptTransformationResult): QualityValidationResult {
    debugLog('🔍 Starting prompt quality validation:', transformation.original);

    const metrics = this.calculateDetailedMetrics(transformation);
    const compliance = this.checkCompliance(transformation);
    const issues = this.identifyIssues(transformation, metrics, compliance);
    const suggestions = this.generateSuggestions(transformation, metrics, compliance, issues);
    
    const overallScore = this.calculateOverallScore(metrics, compliance);
    const isValid = overallScore >= this.MIN_QUALITY_SCORE && issues.filter(i => i.severity === 'critical').length === 0;

    debugLog('✅ Prompt validation completed:', {
      isValid,
      overallScore,
      issueCount: issues.length,
      suggestionCount: suggestions.length
    });

    return {
      isValid,
      overallScore,
      metrics,
      issues,
      suggestions,
      compliance
    };
  }

  // Calculate detailed quality metrics
  private static calculateDetailedMetrics(transformation: PromptTransformationResult): PromptQualityMetrics {
    const prompt = transformation.transformedPrompt;
    const wordCount = prompt.split(/\s+/).length;
    const charCount = prompt.length;

    // Clarity Score (0-100)
    let clarity = 60; // Base score
    if (prompt.includes('You are')) clarity += 15; // Clear role definition
    if (this.hasStructuredSections(prompt)) clarity += 15; // Structured format
    if (this.hasSpecificInstructions(prompt)) clarity += 10; // Specific instructions
    clarity = Math.min(clarity, 100);

    // Specificity Score (0-100)
    let specificity = 50; // Base score
    if (wordCount >= this.OPTIMAL_PROMPT_LENGTH / 4) specificity += 20; // Adequate detail
    if (this.hasExamples(prompt)) specificity += 15; // Includes examples
    if (this.hasConstraints(prompt)) specificity += 15; // Has constraints
    specificity = Math.min(specificity, 100);

    // Completeness Score (0-100)
    let completeness = 40; // Base score
    const sectionCount = this.REQUIRED_SECTIONS.filter(section => prompt.includes(section)).length;
    completeness += (sectionCount / this.REQUIRED_SECTIONS.length) * 40; // Section coverage
    if (this.hasOutputSpecifications(prompt)) completeness += 20; // Output specs
    completeness = Math.min(completeness, 100);

    // Professionalism Score (0-100)
    let professionalism = 70; // Base score
    if (this.hasProfessionalTerminology(prompt)) professionalism += 15; // Professional language
    if (this.hasExpertCredentials(prompt)) professionalism += 15; // Expert credentials
    professionalism = Math.min(professionalism, 100);

    // Actionability Score (0-100)
    let actionability = 60; // Base score
    if (this.hasActionVerbs(prompt)) actionability += 20; // Action-oriented
    if (this.hasStepByStepGuidance(prompt)) actionability += 20; // Clear process
    actionability = Math.min(actionability, 100);

    // Overall Score (weighted average)
    const overallScore = Math.round(
      clarity * 0.25 +
      specificity * 0.20 +
      completeness * 0.25 +
      professionalism * 0.15 +
      actionability * 0.15
    );

    return {
      clarity,
      specificity,
      completeness,
      professionalism,
      actionability,
      overallScore
    };
  }

  // Check compliance with prompt engineering standards
  private static checkCompliance(transformation: PromptTransformationResult): ComplianceCheck {
    const prompt = transformation.transformedPrompt;
    const wordCount = prompt.split(/\s+/).length;

    return {
      hasExpertRole: prompt.includes('You are') && this.hasExpertCredentials(prompt),
      hasStructuredFramework: this.hasStructuredSections(prompt),
      hasContextSection: prompt.includes('#CONTEXT'),
      hasGoalSection: prompt.includes('#GOAL'),
      hasInformationSection: prompt.includes('#INFORMATION'),
      hasGuidelinesSection: prompt.includes('#RESPONSE GUIDELINES'),
      hasOutputSection: prompt.includes('#OUTPUT'),
      meetsLengthRequirements: wordCount >= this.MIN_PROMPT_LENGTH / 4 && wordCount <= this.MAX_PROMPT_LENGTH / 4,
      hasActionableElements: this.hasActionVerbs(prompt),
      hasProfessionalTone: this.hasProfessionalTerminology(prompt)
    };
  }

  // Identify quality issues
  private static identifyIssues(
    transformation: PromptTransformationResult,
    metrics: PromptQualityMetrics,
    compliance: ComplianceCheck
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const prompt = transformation.transformedPrompt;

    // Critical Issues
    if (!compliance.hasExpertRole) {
      issues.push({
        severity: 'critical',
        category: 'Role Definition',
        description: 'Missing or inadequate expert role definition',
        impact: 'AI may not adopt appropriate expertise level',
        location: 'Beginning of prompt'
      });
    }

    if (!compliance.hasStructuredFramework) {
      issues.push({
        severity: 'critical',
        category: 'Structure',
        description: 'Missing structured framework sections',
        impact: 'Reduces prompt effectiveness and clarity',
        location: 'Overall structure'
      });
    }

    // High Severity Issues
    if (metrics.clarity < 70) {
      issues.push({
        severity: 'high',
        category: 'Clarity',
        description: 'Prompt lacks clarity and specific instructions',
        impact: 'May lead to ambiguous or off-target responses',
        location: 'Throughout prompt'
      });
    }

    if (metrics.completeness < 60) {
      issues.push({
        severity: 'high',
        category: 'Completeness',
        description: 'Missing essential sections or requirements',
        impact: 'Incomplete guidance may result in suboptimal outputs',
        location: 'Missing sections'
      });
    }

    // Medium Severity Issues
    if (metrics.specificity < 60) {
      issues.push({
        severity: 'medium',
        category: 'Specificity',
        description: 'Lacks sufficient detail and specific requirements',
        impact: 'May result in generic rather than tailored responses',
        location: 'Requirements sections'
      });
    }

    if (!compliance.hasOutputSection) {
      issues.push({
        severity: 'medium',
        category: 'Output Specification',
        description: 'Missing detailed output requirements',
        impact: 'AI may not format response appropriately',
        location: '#OUTPUT section'
      });
    }

    // Low Severity Issues
    if (metrics.professionalism < 80) {
      issues.push({
        severity: 'low',
        category: 'Professionalism',
        description: 'Could benefit from more professional terminology',
        impact: 'May not fully leverage domain expertise',
        location: 'Language and terminology'
      });
    }

    if (prompt.length < this.MIN_PROMPT_LENGTH) {
      issues.push({
        severity: 'low',
        category: 'Length',
        description: 'Prompt may be too brief for complex tasks',
        impact: 'Insufficient guidance for comprehensive responses',
        location: 'Overall prompt length'
      });
    }

    return issues;
  }

  // Generate improvement suggestions
  private static generateSuggestions(
    transformation: PromptTransformationResult,
    metrics: PromptQualityMetrics,
    compliance: ComplianceCheck,
    issues: QualityIssue[]
  ): QualitySuggestion[] {
    const suggestions: QualitySuggestion[] = [];

    // High Priority Suggestions
    if (!compliance.hasExpertRole) {
      suggestions.push({
        priority: 'high',
        category: 'Role Enhancement',
        suggestion: 'Add comprehensive expert role with specific credentials and experience',
        expectedImprovement: 15,
        implementation: 'Start with "You are a [specific expert title] with [credentials/experience]..."'
      });
    }

    if (metrics.clarity < 70) {
      suggestions.push({
        priority: 'high',
        category: 'Clarity Improvement',
        suggestion: 'Add more specific instructions and clear expectations',
        expectedImprovement: 12,
        implementation: 'Use bullet points, numbered lists, and explicit requirements'
      });
    }

    // Medium Priority Suggestions
    if (metrics.specificity < 70) {
      suggestions.push({
        priority: 'medium',
        category: 'Detail Enhancement',
        suggestion: 'Include specific examples, constraints, and success criteria',
        expectedImprovement: 10,
        implementation: 'Add concrete examples and measurable outcomes'
      });
    }

    if (!compliance.hasOutputSection) {
      suggestions.push({
        priority: 'medium',
        category: 'Output Specification',
        suggestion: 'Add detailed output format and structure requirements',
        expectedImprovement: 8,
        implementation: 'Include format, length, style, and quality requirements'
      });
    }

    // Low Priority Suggestions
    if (metrics.actionability < 80) {
      suggestions.push({
        priority: 'low',
        category: 'Actionability',
        suggestion: 'Include more action-oriented language and step-by-step guidance',
        expectedImprovement: 5,
        implementation: 'Use action verbs and provide clear process steps'
      });
    }

    return suggestions;
  }

  // Calculate overall quality score
  private static calculateOverallScore(metrics: PromptQualityMetrics, compliance: ComplianceCheck): number {
    const metricsScore = metrics.overallScore;
    
    // Compliance bonus/penalty
    const complianceItems = Object.values(compliance);
    const complianceRate = complianceItems.filter(Boolean).length / complianceItems.length;
    const complianceBonus = (complianceRate - 0.5) * 20; // -10 to +10 adjustment
    
    return Math.max(0, Math.min(100, Math.round(metricsScore + complianceBonus)));
  }

  // Helper methods for content analysis
  private static hasStructuredSections(prompt: string): boolean {
    return this.REQUIRED_SECTIONS.filter(section => prompt.includes(section)).length >= 3;
  }

  private static hasSpecificInstructions(prompt: string): boolean {
    const indicators = ['specific', 'detailed', 'must include', 'requirements', 'criteria'];
    return indicators.some(indicator => prompt.toLowerCase().includes(indicator));
  }

  private static hasExamples(prompt: string): boolean {
    const indicators = ['example', 'for instance', 'such as', 'like', 'including'];
    return indicators.some(indicator => prompt.toLowerCase().includes(indicator));
  }

  private static hasConstraints(prompt: string): boolean {
    const indicators = ['must', 'should', 'avoid', 'limit', 'maximum', 'minimum', 'constraint'];
    return indicators.some(indicator => prompt.toLowerCase().includes(indicator));
  }

  private static hasOutputSpecifications(prompt: string): boolean {
    const indicators = ['format', 'structure', 'length', 'style', 'tone', 'output'];
    return indicators.some(indicator => prompt.toLowerCase().includes(indicator));
  }

  private static hasProfessionalTerminology(prompt: string): boolean {
    const indicators = ['professional', 'expert', 'analysis', 'methodology', 'framework', 'best practices'];
    return indicators.some(indicator => prompt.toLowerCase().includes(indicator));
  }

  private static hasExpertCredentials(prompt: string): boolean {
    const indicators = ['years of experience', 'expert', 'specialist', 'certified', 'professional', 'consultant'];
    return indicators.some(indicator => prompt.toLowerCase().includes(indicator));
  }

  private static hasActionVerbs(prompt: string): boolean {
    const actionVerbs = ['create', 'develop', 'analyze', 'design', 'implement', 'provide', 'generate', 'build'];
    return actionVerbs.some(verb => prompt.toLowerCase().includes(verb));
  }

  private static hasStepByStepGuidance(prompt: string): boolean {
    const indicators = ['step', 'process', 'methodology', 'approach', 'procedure', 'workflow'];
    return indicators.some(indicator => prompt.toLowerCase().includes(indicator));
  }

  // Batch validation for multiple prompts
  static validateMultiplePrompts(transformations: PromptTransformationResult[]): QualityValidationResult[] {
    debugLog('🔍 Batch validating prompts:', transformations.length);
    return transformations.map(transformation => this.validatePrompt(transformation));
  }

  // Generate quality report
  static generateQualityReport(validations: QualityValidationResult[]): {
    averageScore: number;
    passRate: number;
    commonIssues: string[];
    topSuggestions: string[];
    complianceRate: number;
  } {
    const totalScore = validations.reduce((sum, v) => sum + v.overallScore, 0);
    const averageScore = totalScore / validations.length;
    
    const passCount = validations.filter(v => v.isValid).length;
    const passRate = (passCount / validations.length) * 100;

    // Analyze common issues
    const issueFrequency: Record<string, number> = {};
    validations.forEach(v => {
      v.issues.forEach(issue => {
        issueFrequency[issue.category] = (issueFrequency[issue.category] || 0) + 1;
      });
    });

    const commonIssues = Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // Analyze top suggestions
    const suggestionFrequency: Record<string, number> = {};
    validations.forEach(v => {
      v.suggestions.forEach(suggestion => {
        suggestionFrequency[suggestion.category] = (suggestionFrequency[suggestion.category] || 0) + 1;
      });
    });

    const topSuggestions = Object.entries(suggestionFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // Calculate compliance rate
    const complianceScores = validations.map(v => {
      const complianceItems = Object.values(v.compliance);
      return complianceItems.filter(Boolean).length / complianceItems.length;
    });
    const complianceRate = (complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length) * 100;

    return {
      averageScore: Math.round(averageScore),
      passRate: Math.round(passRate),
      commonIssues,
      topSuggestions,
      complianceRate: Math.round(complianceRate)
    };
  }
}
