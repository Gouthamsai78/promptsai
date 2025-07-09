import { debugLog } from '../utils/debug';
import { PromptAnalysis, PromptQualityMetrics, PromptTransformationResult } from '../types/ai';

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  structure: string;
  example: string;
  usageCount: number;
  effectiveness: number; // 0-100 rating
}

export interface TemplateDetectionResult {
  suggestedTemplate: PromptTemplate | null;
  confidence: number;
  alternativeTemplates: PromptTemplate[];
  reasoning: string;
}

export interface TemplateApplication {
  originalPrompt: string;
  appliedTemplate: PromptTemplate;
  enhancedPrompt: string;
  improvements: string[];
}

export class PromptTemplateService {
  private static readonly STORAGE_KEY = 'promptshare_template_usage';

  // Comprehensive template library with proven structures
  private static readonly TEMPLATE_LIBRARY: PromptTemplate[] = [
    {
      id: 'personal_writing_style',
      name: 'Personal Writing Style Adoption',
      category: 'personal_development',
      description: 'Helps users develop and refine their unique writing voice and style',
      keywords: ['writing', 'style', 'voice', 'personal', 'author', 'tone', 'expression'],
      structure: `#CONTEXT
You are a writing style analyst and personal writing coach helping someone develop their authentic voice.

#GOAL
Analyze the user's existing writing samples and help them adopt a consistent, engaging personal writing style that reflects their personality and resonates with their target audience.

#INFORMATION
- Current writing samples or style preferences
- Target audience and purpose
- Preferred tone (professional, casual, humorous, etc.)
- Writing goals and objectives
- Any style influences or inspirations

#RESPONSE GUIDELINES
- Provide specific, actionable style recommendations
- Include examples of improved sentence structures
- Suggest vocabulary and tone adjustments
- Offer techniques for maintaining consistency
- Give practical exercises for style development

#OUTPUT
Deliver a comprehensive writing style guide with before/after examples, specific techniques, and a personalized action plan for style improvement.`,
      example: 'Help me develop a more engaging writing style for my blog about sustainable living',
      usageCount: 0,
      effectiveness: 95
    },
    {
      id: 'ideal_self_development',
      name: 'Ideal Self Development',
      category: 'personal_development',
      description: 'Guides users through envisioning and working toward their ideal self',
      keywords: ['self', 'development', 'growth', 'ideal', 'goals', 'transformation', 'improvement'],
      structure: `#CONTEXT
You are a personal development coach specializing in helping people envision and achieve their ideal self through structured self-reflection and actionable planning.

#GOAL
Guide the user through a comprehensive process of defining their ideal self and creating a practical roadmap for personal transformation and growth.

#INFORMATION
- Current situation and challenges
- Values and core beliefs
- Areas for improvement or change
- Long-term vision and aspirations
- Available resources and constraints

#RESPONSE GUIDELINES
- Use reflective questioning techniques
- Provide structured frameworks for self-assessment
- Offer specific, measurable action steps
- Include accountability mechanisms
- Address potential obstacles and solutions

#OUTPUT
Create a detailed ideal self blueprint with specific goals, action plans, milestones, and tracking methods for sustainable personal development.`,
      example: 'Help me envision my ideal self and create a plan to become more confident and productive',
      usageCount: 0,
      effectiveness: 92
    },
    {
      id: 'professional_profile_analysis',
      name: 'Professional Profile Analysis',
      category: 'career_development',
      description: 'Analyzes and optimizes professional profiles for career advancement',
      keywords: ['professional', 'profile', 'career', 'linkedin', 'resume', 'networking', 'branding'],
      structure: `#CONTEXT
You are a career strategist and personal branding expert who helps professionals optimize their profiles for maximum career impact and opportunities.

#GOAL
Analyze the user's professional profile and provide comprehensive recommendations for enhancement that will attract opportunities and showcase their unique value proposition.

#INFORMATION
- Current professional profile/resume content
- Career goals and target positions
- Industry and field of expertise
- Key achievements and skills
- Target audience (recruiters, clients, peers)

#RESPONSE GUIDELINES
- Provide specific profile optimization strategies
- Suggest compelling headline and summary improvements
- Recommend skill highlighting techniques
- Offer networking and visibility strategies
- Include industry-specific best practices

#OUTPUT
Deliver a complete profile enhancement plan with rewritten sections, strategic keywords, and actionable steps for professional brand building.`,
      example: 'Analyze my LinkedIn profile and help me optimize it for senior marketing roles',
      usageCount: 0,
      effectiveness: 88
    },
    {
      id: 'content_strategy_planning',
      name: 'Content Strategy Planning',
      category: 'marketing',
      description: 'Develops comprehensive content strategies for businesses and creators',
      keywords: ['content', 'strategy', 'marketing', 'social media', 'planning', 'audience', 'engagement'],
      structure: `#CONTEXT
You are a content strategy expert who helps businesses and creators develop comprehensive, results-driven content plans that engage audiences and achieve business objectives.

#GOAL
Create a detailed content strategy that aligns with business goals, resonates with the target audience, and drives measurable results across chosen platforms.

#INFORMATION
- Business/brand overview and objectives
- Target audience demographics and preferences
- Available platforms and channels
- Content creation resources and constraints
- Competitive landscape and market position

#RESPONSE GUIDELINES
- Provide platform-specific content recommendations
- Include content calendar and posting schedules
- Suggest engagement and community building tactics
- Offer measurement and optimization strategies
- Address content creation workflows and tools

#OUTPUT
Deliver a comprehensive content strategy document with content pillars, editorial calendar, platform guidelines, and performance metrics framework.`,
      example: 'Create a content strategy for my sustainable fashion brand targeting millennials',
      usageCount: 0,
      effectiveness: 90
    },
    {
      id: 'budget_travel_planning',
      name: 'Budget Travel Planning',
      category: 'travel',
      description: 'Creates detailed budget-friendly travel plans and itineraries',
      keywords: ['travel', 'budget', 'planning', 'itinerary', 'destinations', 'savings', 'backpacking'],
      structure: `#CONTEXT
You are an experienced budget travel expert who helps people plan amazing trips while minimizing costs through smart planning, local insights, and money-saving strategies.

#GOAL
Create a comprehensive budget travel plan that maximizes experiences while staying within financial constraints, including detailed itineraries, cost breakdowns, and money-saving tips.

#INFORMATION
- Destination preferences and travel dates
- Total budget and spending priorities
- Travel style and accommodation preferences
- Group size and traveler demographics
- Must-see attractions and experiences

#RESPONSE GUIDELINES
- Provide detailed cost breakdowns by category
- Include specific money-saving strategies and tips
- Suggest alternative options for expensive activities
- Offer local insights and hidden gems
- Include practical logistics and booking advice

#OUTPUT
Deliver a complete budget travel guide with day-by-day itinerary, cost estimates, booking recommendations, and practical tips for affordable travel.`,
      example: 'Plan a 2-week budget trip to Southeast Asia for $1500 including flights',
      usageCount: 0,
      effectiveness: 87
    },
    {
      id: 'complex_topic_simplification',
      name: 'Complex Topic Simplification',
      category: 'education',
      description: 'Breaks down complex subjects into easily understandable explanations',
      keywords: ['simplify', 'explain', 'complex', 'education', 'learning', 'understanding', 'breakdown'],
      structure: `#CONTEXT
You are an expert educator and communicator who specializes in making complex topics accessible and engaging for diverse audiences through clear explanations and practical examples.

#GOAL
Transform complex subject matter into clear, understandable content that helps the audience grasp difficult concepts through progressive learning and relatable examples.

#INFORMATION
- Complex topic or concept to be simplified
- Target audience knowledge level
- Learning objectives and outcomes
- Available time or space constraints
- Preferred learning style (visual, auditory, kinesthetic)

#RESPONSE GUIDELINES
- Use progressive complexity building
- Include relatable analogies and examples
- Provide visual or conceptual frameworks
- Offer practical applications and exercises
- Check understanding with questions or summaries

#OUTPUT
Create a structured learning guide with simplified explanations, examples, visual aids suggestions, and comprehension checks for effective knowledge transfer.`,
      example: 'Explain quantum computing concepts to high school students in simple terms',
      usageCount: 0,
      effectiveness: 93
    },
    {
      id: 'professional_communication',
      name: 'Professional Communication',
      category: 'business',
      description: 'Crafts effective professional communications for various business contexts',
      keywords: ['professional', 'communication', 'business', 'email', 'presentation', 'meeting', 'formal'],
      structure: `#CONTEXT
You are a professional communication expert who helps individuals craft clear, persuasive, and appropriate business communications that achieve desired outcomes while maintaining professional relationships.

#GOAL
Create effective professional communication that clearly conveys the message, maintains appropriate tone, and achieves the desired response or action from the recipient.

#INFORMATION
- Communication purpose and desired outcome
- Audience and their relationship to sender
- Context and background information
- Tone requirements (formal, friendly, urgent, etc.)
- Key messages and supporting details

#RESPONSE GUIDELINES
- Use appropriate professional tone and language
- Structure content for clarity and impact
- Include clear calls to action when needed
- Consider cultural and organizational context
- Provide alternative phrasings for sensitive topics

#OUTPUT
Deliver polished professional communication with clear structure, appropriate tone, and strategic messaging that achieves business objectives while maintaining relationships.`,
      example: 'Write a professional email requesting a deadline extension for a project',
      usageCount: 0,
      effectiveness: 89
    },
    {
      id: 'productivity_planning',
      name: 'Productivity Planning',
      category: 'productivity',
      description: 'Develops personalized productivity systems and workflows',
      keywords: ['productivity', 'planning', 'efficiency', 'time management', 'workflow', 'organization', 'systems'],
      structure: `#CONTEXT
You are a productivity consultant who helps individuals design personalized systems and workflows that maximize efficiency, reduce stress, and achieve better work-life balance.

#GOAL
Create a comprehensive productivity system tailored to the user's specific needs, work style, and goals that improves efficiency and reduces overwhelm.

#INFORMATION
- Current productivity challenges and pain points
- Work style and preferences (digital vs analog, etc.)
- Available tools and resources
- Daily/weekly schedule and commitments
- Priority goals and objectives

#RESPONSE GUIDELINES
- Recommend specific tools and techniques
- Provide step-by-step implementation plans
- Include habit formation strategies
- Address common productivity obstacles
- Offer measurement and adjustment methods

#OUTPUT
Deliver a personalized productivity blueprint with specific systems, tools recommendations, implementation timeline, and optimization strategies for sustained improvement.`,
      example: 'Design a productivity system for a freelance graphic designer juggling multiple clients',
      usageCount: 0,
      effectiveness: 91
    },
    {
      id: 'goal_setting_tracking',
      name: 'Goal Setting & Tracking',
      category: 'personal_development',
      description: 'Creates structured goal-setting frameworks with tracking mechanisms',
      keywords: ['goals', 'setting', 'tracking', 'achievement', 'planning', 'milestones', 'progress'],
      structure: `#CONTEXT
You are a goal achievement specialist who helps people set meaningful, achievable goals and create robust tracking systems that ensure consistent progress and successful outcomes.

#GOAL
Establish a comprehensive goal-setting and tracking framework that transforms aspirations into actionable plans with clear milestones and accountability measures.

#INFORMATION
- Desired goals and aspirations
- Current situation and starting point
- Available resources and constraints
- Timeline and deadline preferences
- Motivation factors and potential obstacles

#RESPONSE GUIDELINES
- Use SMART goal framework and beyond
- Create specific milestone and checkpoint systems
- Include accountability and motivation strategies
- Provide progress tracking tools and methods
- Address obstacle anticipation and solutions

#OUTPUT
Create a detailed goal achievement plan with specific targets, milestone tracking, accountability systems, and adjustment protocols for sustained progress.`,
      example: 'Help me set and track goals for launching my online coaching business within 6 months',
      usageCount: 0,
      effectiveness: 94
    },
    {
      id: 'personalized_learning_paths',
      name: 'Personalized Learning Paths',
      category: 'education',
      description: 'Designs customized learning journeys for skill development',
      keywords: ['learning', 'education', 'skills', 'development', 'curriculum', 'training', 'knowledge'],
      structure: `#CONTEXT
You are a learning design expert who creates personalized educational pathways that optimize skill acquisition through tailored content, pacing, and methodologies based on individual learning preferences.

#GOAL
Design a comprehensive learning path that efficiently guides the learner from their current knowledge level to mastery of desired skills through structured, engaging, and effective educational experiences.

#INFORMATION
- Learning objectives and target skills
- Current knowledge and experience level
- Learning style preferences and constraints
- Available time and resources
- Preferred learning formats and tools

#RESPONSE GUIDELINES
- Create progressive skill-building sequences
- Include diverse learning modalities and resources
- Provide practical application opportunities
- Include assessment and feedback mechanisms
- Address different learning paces and styles

#OUTPUT
Deliver a structured learning curriculum with modules, resources, timelines, assessments, and practical projects that ensure effective skill development and knowledge retention.`,
      example: 'Create a learning path for mastering data science from beginner to job-ready level',
      usageCount: 0,
      effectiveness: 96
    }
  ];

  // Detect the most appropriate template for a given prompt
  static detectTemplate(userInput: string): TemplateDetectionResult {
    const input = userInput.toLowerCase();
    const words = input.split(/\s+/);
    
    const templateScores = this.TEMPLATE_LIBRARY.map(template => {
      let score = 0;
      let matchedKeywords: string[] = [];

      // Check keyword matches
      template.keywords.forEach(keyword => {
        if (input.includes(keyword.toLowerCase())) {
          score += 10;
          matchedKeywords.push(keyword);
        }
      });

      // Check for partial keyword matches
      template.keywords.forEach(keyword => {
        words.forEach(word => {
          if (word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word)) {
            score += 5;
          }
        });
      });

      // Boost score based on template effectiveness
      score *= (template.effectiveness / 100);

      return {
        template,
        score,
        matchedKeywords
      };
    });

    // Sort by score
    templateScores.sort((a, b) => b.score - a.score);

    const bestMatch = templateScores[0];
    const confidence = Math.min(bestMatch.score / 50 * 100, 100); // Normalize to percentage

    let reasoning = '';
    if (confidence > 70) {
      reasoning = `High confidence match based on keywords: ${bestMatch.matchedKeywords.join(', ')}`;
    } else if (confidence > 40) {
      reasoning = `Moderate confidence match. Consider this template or explore alternatives.`;
    } else {
      reasoning = `Low confidence match. General enhancement recommended or manual template selection.`;
    }

    return {
      suggestedTemplate: confidence > 40 ? bestMatch.template : null,
      confidence,
      alternativeTemplates: templateScores.slice(1, 4).map(s => s.template),
      reasoning
    };
  }

  // Get template by ID
  static getTemplate(templateId: string): PromptTemplate | null {
    return this.TEMPLATE_LIBRARY.find(t => t.id === templateId) || null;
  }

  // Get all templates in a category
  static getTemplatesByCategory(category: string): PromptTemplate[] {
    return this.TEMPLATE_LIBRARY.filter(t => t.category === category);
  }

  // Get all available categories
  static getCategories(): string[] {
    return [...new Set(this.TEMPLATE_LIBRARY.map(t => t.category))];
  }

  // Apply template to user input
  static applyTemplate(userInput: string, template: PromptTemplate): TemplateApplication {
    const enhancedPrompt = this.generateTemplatePrompt(userInput, template);
    
    const improvements = [
      'Added structured framework with clear sections',
      'Included specific context and goal definition',
      'Enhanced with professional guidelines and best practices',
      'Provided comprehensive output specifications',
      'Incorporated proven template methodology'
    ];

    // Track template usage
    this.trackTemplateUsage(template.id);

    return {
      originalPrompt: userInput,
      appliedTemplate: template,
      enhancedPrompt,
      improvements
    };
  }

  // Generate the actual prompt using template structure
  private static generateTemplatePrompt(userInput: string, template: PromptTemplate): string {
    return `${template.structure}

USER REQUEST: ${userInput}

Please follow the template structure above to provide a comprehensive, professional response that addresses all sections (#CONTEXT, #GOAL, #INFORMATION, #RESPONSE GUIDELINES, #OUTPUT) while specifically addressing the user's request.`;
  }

  // Track template usage for analytics
  private static trackTemplateUsage(templateId: string): void {
    try {
      const usage = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      usage[templateId] = (usage[templateId] || 0) + 1;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
      debugLog('📊 Template usage tracked:', templateId);
    } catch (error) {
      debugLog('⚠️ Failed to track template usage:', error);
    }
  }

  // Get template usage statistics
  static getUsageStatistics(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch (error) {
      debugLog('⚠️ Failed to load template usage statistics');
      return {};
    }
  }

  // Get most popular templates
  static getPopularTemplates(limit: number = 5): PromptTemplate[] {
    const usage = this.getUsageStatistics();
    
    return this.TEMPLATE_LIBRARY
      .map(template => ({
        ...template,
        usageCount: usage[template.id] || 0
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // ===== ADVANCED PROMPT TRANSFORMATION ENGINE =====

  // Analyze prompt characteristics and requirements
  static analyzePrompt(userInput: string): PromptAnalysis {
    const input = userInput.toLowerCase().trim();
    const words = input.split(/\s+/);
    const wordCount = words.length;

    // Detect intent patterns
    let intent = 'general';
    if (input.includes('write') || input.includes('create') || input.includes('generate')) {
      intent = 'content_creation';
    } else if (input.includes('analyze') || input.includes('review') || input.includes('evaluate')) {
      intent = 'analysis';
    } else if (input.includes('plan') || input.includes('strategy') || input.includes('organize')) {
      intent = 'planning';
    } else if (input.includes('learn') || input.includes('teach') || input.includes('explain')) {
      intent = 'education';
    } else if (input.includes('improve') || input.includes('optimize') || input.includes('enhance')) {
      intent = 'optimization';
    }

    // Detect domain
    let domain = 'general';
    const domainKeywords = {
      'business': ['business', 'marketing', 'sales', 'strategy', 'company', 'revenue', 'profit'],
      'technology': ['code', 'programming', 'software', 'app', 'website', 'tech', 'ai', 'data'],
      'creative': ['design', 'art', 'creative', 'visual', 'aesthetic', 'brand', 'logo'],
      'education': ['learn', 'teach', 'course', 'curriculum', 'student', 'education', 'training'],
      'health': ['health', 'fitness', 'medical', 'wellness', 'nutrition', 'exercise'],
      'personal': ['personal', 'life', 'goal', 'habit', 'productivity', 'self', 'career']
    };

    for (const [domainName, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        domain = domainName;
        break;
      }
    }

    // Determine complexity level
    let complexityLevel: 'basic' | 'intermediate' | 'advanced' = 'basic';
    if (wordCount > 20 || input.includes('comprehensive') || input.includes('detailed') || input.includes('advanced')) {
      complexityLevel = 'advanced';
    } else if (wordCount > 10 || input.includes('specific') || input.includes('professional')) {
      complexityLevel = 'intermediate';
    }

    // Identify required expertise
    const requiredExpertise: string[] = [];
    if (domain === 'business') requiredExpertise.push('Business Strategy', 'Market Analysis');
    if (domain === 'technology') requiredExpertise.push('Technical Architecture', 'Software Development');
    if (domain === 'creative') requiredExpertise.push('Creative Direction', 'Visual Design');
    if (domain === 'education') requiredExpertise.push('Instructional Design', 'Learning Psychology');
    if (domain === 'health') requiredExpertise.push('Health Sciences', 'Evidence-Based Practice');
    if (domain === 'personal') requiredExpertise.push('Personal Development', 'Behavioral Psychology');

    // Suggest framework
    const frameworks = {
      'content_creation': 'AIDA (Attention, Interest, Desire, Action)',
      'analysis': 'SWOT Analysis Framework',
      'planning': 'SMART Goals + Action Planning',
      'education': 'Bloom\'s Taxonomy + Learning Objectives',
      'optimization': 'Continuous Improvement Methodology',
      'general': 'Problem-Solution Framework'
    };
    const suggestedFramework = frameworks[intent as keyof typeof frameworks] || frameworks.general;

    // Identify missing elements
    const missingElements: string[] = [];
    if (!input.includes('target') && !input.includes('audience')) {
      missingElements.push('Target audience specification');
    }
    if (!input.includes('goal') && !input.includes('objective')) {
      missingElements.push('Clear objectives and success criteria');
    }
    if (wordCount < 5) {
      missingElements.push('Sufficient context and details');
    }
    if (!input.includes('format') && !input.includes('structure')) {
      missingElements.push('Output format and structure requirements');
    }

    // Improvement opportunities
    const improvementOpportunities: string[] = [
      'Add specific role-based expertise',
      'Include detailed output specifications',
      'Specify quality criteria and constraints',
      'Add relevant examples or references',
      'Define success metrics and evaluation criteria'
    ];

    return {
      intent,
      domain,
      complexityLevel,
      requiredExpertise,
      suggestedFramework,
      missingElements,
      improvementOpportunities
    };
  }

  // Calculate prompt quality metrics
  static calculateQualityMetrics(userInput: string, analysis: PromptAnalysis): PromptQualityMetrics {
    const input = userInput.trim();
    const wordCount = input.split(/\s+/).length;

    // Clarity score (0-100)
    let clarity = 50;
    if (input.includes('?')) clarity += 10; // Questions show clear intent
    if (wordCount >= 10) clarity += 20; // Sufficient detail
    if (analysis.intent !== 'general') clarity += 20; // Clear intent detected
    clarity = Math.min(clarity, 100);

    // Specificity score (0-100)
    let specificity = 30;
    if (analysis.domain !== 'general') specificity += 25; // Domain-specific
    if (analysis.complexityLevel === 'advanced') specificity += 25;
    else if (analysis.complexityLevel === 'intermediate') specificity += 15;
    if (input.includes('specific') || input.includes('detailed')) specificity += 20;
    specificity = Math.min(specificity, 100);

    // Completeness score (0-100)
    let completeness = 40;
    if (analysis.missingElements.length === 0) completeness += 30;
    else if (analysis.missingElements.length <= 2) completeness += 15;
    if (wordCount >= 20) completeness += 20;
    if (input.includes('target') || input.includes('audience')) completeness += 10;
    completeness = Math.min(completeness, 100);

    // Professionalism score (0-100)
    let professionalism = 60;
    if (input.includes('professional') || input.includes('expert')) professionalism += 20;
    if (analysis.requiredExpertise.length > 0) professionalism += 20;
    professionalism = Math.min(professionalism, 100);

    // Actionability score (0-100)
    let actionability = 50;
    if (input.includes('create') || input.includes('write') || input.includes('develop')) actionability += 25;
    if (input.includes('step') || input.includes('process') || input.includes('method')) actionability += 25;
    actionability = Math.min(actionability, 100);

    // Overall score (weighted average)
    const overallScore = Math.round(
      (clarity * 0.2 + specificity * 0.25 + completeness * 0.25 + professionalism * 0.15 + actionability * 0.15)
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

  // Transform basic prompt into professional meta-prompt
  static transformToMetaPrompt(userInput: string, analysis: PromptAnalysis): PromptTransformationResult {
    const startTime = Date.now();
    const qualityMetrics = this.calculateQualityMetrics(userInput, analysis);

    // Generate expert role based on domain and intent
    const expertRole = this.generateExpertRole(analysis);

    // Create comprehensive context section
    const contextSection = this.generateContextSection(userInput, analysis);

    // Generate goal and requirements
    const goalSection = this.generateGoalSection(userInput, analysis);

    // Create information requirements
    const informationSection = this.generateInformationSection(analysis);

    // Generate response guidelines
    const guidelinesSection = this.generateResponseGuidelines(analysis);

    // Create output specifications
    const outputSection = this.generateOutputSpecifications(analysis);

    // Assemble the complete meta-prompt
    const transformedPrompt = `${expertRole}

#CONTEXT
${contextSection}

#GOAL
${goalSection}

#INFORMATION
${informationSection}

#RESPONSE GUIDELINES
${guidelinesSection}

#OUTPUT
${outputSection}`;

    // Track applied techniques
    const appliedTechniques = [
      'Role-based expert persona assignment',
      'Structured framework implementation',
      'Context-goal-information-guidelines-output format',
      'Domain-specific terminology integration',
      'Professional quality specifications'
    ];

    // Generate improvement descriptions
    const improvements = [
      'Added comprehensive expert role definition',
      'Implemented structured prompt framework',
      'Included specific context and objectives',
      'Added professional guidelines and constraints',
      'Specified detailed output requirements'
    ];

    // Generate output specifications list
    const outputSpecifications = [
      'Professional tone and terminology',
      'Structured format with clear sections',
      'Actionable and specific recommendations',
      'Evidence-based approach when applicable',
      'Quality control measures included'
    ];

    return {
      original: userInput,
      transformedPrompt,
      transformationType: 'meta-prompt',
      qualityScore: qualityMetrics.overallScore,
      improvements,
      appliedTechniques,
      expertRole: expertRole.split('\n')[0], // First line contains the role
      outputSpecifications,
      processingTime: Date.now() - startTime,
      templateUsed: analysis.domain
    };
  }

  // Helper methods for meta-prompt generation
  private static generateExpertRole(analysis: PromptAnalysis): string {
    const domainExperts = {
      'business': 'You are a senior business strategist and management consultant with 15+ years of experience in corporate strategy, market analysis, and business development.',
      'technology': 'You are a senior software architect and technology consultant with extensive experience in system design, software development, and digital transformation.',
      'creative': 'You are a creative director and design strategist with expertise in visual communication, brand development, and creative problem-solving.',
      'education': 'You are an educational specialist and instructional designer with advanced degrees in learning psychology and curriculum development.',
      'health': 'You are a healthcare professional and wellness expert with clinical experience and evidence-based practice expertise.',
      'personal': 'You are a certified life coach and personal development expert with specialization in behavioral psychology and goal achievement.',
      'general': 'You are a professional consultant and subject matter expert with broad interdisciplinary knowledge and analytical expertise.'
    };

    const baseRole = domainExperts[analysis.domain as keyof typeof domainExperts] || domainExperts.general;

    // Add intent-specific expertise
    const intentModifiers = {
      'content_creation': ' You specialize in content strategy, copywriting, and audience engagement.',
      'analysis': ' You excel at analytical thinking, data interpretation, and strategic assessment.',
      'planning': ' You are skilled in project management, strategic planning, and systematic organization.',
      'education': ' You have expertise in knowledge transfer, learning design, and skill development.',
      'optimization': ' You focus on process improvement, efficiency optimization, and performance enhancement.',
      'general': ' You provide comprehensive, actionable guidance across multiple domains.'
    };

    return baseRole + (intentModifiers[analysis.intent as keyof typeof intentModifiers] || intentModifiers.general);
  }

  private static generateContextSection(userInput: string, analysis: PromptAnalysis): string {
    const contexts = {
      'business': 'You are working with a business professional who needs strategic guidance for organizational growth and market positioning.',
      'technology': 'You are assisting a technology professional or organization with technical challenges and digital solutions.',
      'creative': 'You are supporting a creative professional or brand with design, visual communication, and creative strategy needs.',
      'education': 'You are helping an educator, trainer, or learner with educational content and learning objectives.',
      'health': 'You are providing guidance to someone seeking evidence-based health and wellness information.',
      'personal': 'You are coaching an individual focused on personal growth, productivity, and life improvement.',
      'general': 'You are providing professional consultation to address specific challenges and objectives.'
    };

    const baseContext = contexts[analysis.domain as keyof typeof contexts] || contexts.general;
    return `${baseContext}\n\nOriginal request: "${userInput}"\n\nThis requires ${analysis.complexityLevel}-level expertise with focus on ${analysis.suggestedFramework}.`;
  }

  private static generateGoalSection(userInput: string, analysis: PromptAnalysis): string {
    const goalTemplates = {
      'content_creation': 'Create comprehensive, engaging content that meets professional standards and achieves specific communication objectives.',
      'analysis': 'Conduct thorough analysis using established frameworks to provide actionable insights and recommendations.',
      'planning': 'Develop detailed, actionable plans with clear timelines, milestones, and success criteria.',
      'education': 'Design effective learning experiences that facilitate knowledge transfer and skill development.',
      'optimization': 'Identify improvement opportunities and provide systematic approaches to enhance performance.',
      'general': 'Provide expert guidance that addresses the specific needs and objectives outlined in the request.'
    };

    const baseGoal = goalTemplates[analysis.intent as keyof typeof goalTemplates] || goalTemplates.general;
    return `${baseGoal}\n\nSpecific objectives:\n- Address all aspects of the original request\n- Provide actionable, implementable solutions\n- Include relevant best practices and methodologies\n- Ensure professional quality and accuracy`;
  }

  private static generateInformationSection(analysis: PromptAnalysis): string {
    const infoRequirements = [
      'Current situation and context',
      'Specific goals and success criteria',
      'Target audience and stakeholders',
      'Available resources and constraints',
      'Timeline and priority requirements'
    ];

    // Add domain-specific information needs
    const domainInfo = {
      'business': ['Market conditions', 'Competitive landscape', 'Budget parameters', 'Organizational structure'],
      'technology': ['Technical requirements', 'System constraints', 'Performance criteria', 'Integration needs'],
      'creative': ['Brand guidelines', 'Visual preferences', 'Style requirements', 'Creative objectives'],
      'education': ['Learning objectives', 'Audience skill level', 'Assessment criteria', 'Delivery format'],
      'health': ['Health status', 'Medical history', 'Lifestyle factors', 'Professional guidance needs'],
      'personal': ['Current situation', 'Personal values', 'Life goals', 'Preferred approaches']
    };

    const specificInfo = domainInfo[analysis.domain as keyof typeof domainInfo] || [];
    const allRequirements = [...infoRequirements, ...specificInfo];

    return `Required information to provide optimal guidance:\n${allRequirements.map(req => `- ${req}`).join('\n')}`;
  }

  private static generateResponseGuidelines(analysis: PromptAnalysis): string {
    const baseGuidelines = [
      'Provide specific, actionable recommendations',
      'Use professional terminology appropriate to the domain',
      'Include relevant examples and best practices',
      'Structure information logically and clearly',
      'Address potential challenges and solutions'
    ];

    // Add domain-specific guidelines
    const domainGuidelines = {
      'business': ['Include ROI considerations', 'Reference industry standards', 'Consider scalability factors'],
      'technology': ['Follow technical best practices', 'Consider security implications', 'Include implementation details'],
      'creative': ['Maintain brand consistency', 'Consider visual hierarchy', 'Include creative rationale'],
      'education': ['Use clear learning objectives', 'Include assessment methods', 'Consider different learning styles'],
      'health': ['Base recommendations on evidence', 'Include safety considerations', 'Suggest professional consultation when needed'],
      'personal': ['Respect individual values', 'Provide realistic timelines', 'Include motivation strategies']
    };

    const specificGuidelines = domainGuidelines[analysis.domain as keyof typeof domainGuidelines] || [];
    const allGuidelines = [...baseGuidelines, ...specificGuidelines];

    return allGuidelines.map(guideline => `- ${guideline}`).join('\n');
  }

  private static generateOutputSpecifications(analysis: PromptAnalysis): string {
    const baseSpecs = [
      'Comprehensive response addressing all aspects of the request',
      'Professional tone and clear communication',
      'Structured format with logical organization',
      'Actionable recommendations with implementation guidance',
      'Quality assurance and validation criteria'
    ];

    // Add complexity-specific requirements
    if (analysis.complexityLevel === 'advanced') {
      baseSpecs.push(
        'Detailed analysis with supporting rationale',
        'Multiple solution options with trade-offs',
        'Risk assessment and mitigation strategies',
        'Long-term implications and considerations'
      );
    } else if (analysis.complexityLevel === 'intermediate') {
      baseSpecs.push(
        'Clear step-by-step guidance',
        'Relevant examples and case studies',
        'Key success factors and metrics'
      );
    }

    return baseSpecs.map(spec => `- ${spec}`).join('\n');
  }
}
