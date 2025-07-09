import { debugLog } from '../utils/debug';

// Memory System Types
export interface UserSessionMemory {
  sessionId: string;
  userId: string;
  conversationHistory: ConversationEntry[];
  promptPatterns: PromptPattern[];
  preferences: UserPreferences;
  startTime: Date;
  lastActivity: Date;
}

export interface UserProfileMemory {
  userId: string;
  longTermPreferences: LongTermPreferences;
  promptingStyle: PromptingStyle;
  domainExpertise: DomainExpertise[];
  learningProgress: LearningProgress;
  effectiveTemplates: TemplateEffectiveness[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateEffectivenessMemory {
  templateId: string;
  usageCount: number;
  successRate: number;
  averageQualityScore: number;
  userFeedback: UserFeedback[];
  performanceMetrics: PerformanceMetrics;
  lastUsed: Date;
}

export interface DomainKnowledgeMemory {
  domain: string;
  expertiseLevel: number;
  specializations: string[];
  bestPractices: BestPractice[];
  commonPatterns: Pattern[];
  successfulPrompts: SuccessfulPrompt[];
  updatedAt: Date;
}

// Supporting Types
export interface ConversationEntry {
  id: string;
  timestamp: Date;
  userInput: string;
  transformedPrompt?: string;
  qualityScore?: number;
  templateUsed?: string;
  userSatisfaction?: number;
}

export interface PromptPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  domains: string[];
}

export interface UserPreferences {
  preferredComplexity: 'basic' | 'intermediate' | 'advanced';
  favoriteTemplates: string[];
  outputFormat: string;
  communicationStyle: string;
}

export interface LongTermPreferences {
  primaryDomains: string[];
  expertiseAreas: string[];
  learningGoals: string[];
  preferredFrameworks: string[];
}

export interface PromptingStyle {
  verbosity: 'concise' | 'detailed' | 'comprehensive';
  structurePreference: 'formal' | 'casual' | 'mixed';
  exampleUsage: 'minimal' | 'moderate' | 'extensive';
}

export interface DomainExpertise {
  domain: string;
  level: number;
  certifications: string[];
  experience: string[];
}

export interface LearningProgress {
  completedLessons: string[];
  skillLevels: Record<string, number>;
  achievements: Achievement[];
  nextRecommendations: string[];
}

export interface TemplateEffectiveness {
  templateId: string;
  personalSuccessRate: number;
  averageQualityImprovement: number;
  preferredModifications: string[];
}

export interface UserFeedback {
  rating: number;
  comment?: string;
  timestamp: Date;
  context: string;
}

export interface PerformanceMetrics {
  averageProcessingTime: number;
  qualityImprovementRate: number;
  userSatisfactionScore: number;
  adoptionRate: number;
}

export interface BestPractice {
  id: string;
  title: string;
  description: string;
  examples: string[];
  effectiveness: number;
}

export interface Pattern {
  id: string;
  description: string;
  frequency: number;
  successRate: number;
  examples: string[];
}

export interface SuccessfulPrompt {
  originalPrompt: string;
  transformedPrompt: string;
  qualityScore: number;
  userRating: number;
  context: string;
  timestamp: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Date;
  category: string;
}

// Memory System Service
export class MemorySystemService {
  private static readonly SESSION_STORAGE_KEY = 'promptshare_session_memory';
  private static readonly PROFILE_STORAGE_KEY = 'promptshare_profile_memory';
  private static readonly TEMPLATE_STORAGE_KEY = 'promptshare_template_memory';
  private static readonly DOMAIN_STORAGE_KEY = 'promptshare_domain_memory';

  // Session Memory Management
  static createSession(userId: string): UserSessionMemory {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: UserSessionMemory = {
      sessionId,
      userId,
      conversationHistory: [],
      promptPatterns: [],
      preferences: this.getDefaultPreferences(),
      startTime: new Date(),
      lastActivity: new Date()
    };

    this.saveSessionMemory(session);
    debugLog('🧠 Created new session memory:', sessionId);
    return session;
  }

  static getSessionMemory(sessionId: string): UserSessionMemory | null {
    try {
      const stored = localStorage.getItem(`${this.SESSION_STORAGE_KEY}_${sessionId}`);
      if (!stored) return null;
      
      const session = JSON.parse(stored);
      // Convert date strings back to Date objects
      session.startTime = new Date(session.startTime);
      session.lastActivity = new Date(session.lastActivity);
      session.conversationHistory = session.conversationHistory.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
      
      return session;
    } catch (error) {
      debugLog('❌ Failed to load session memory:', error);
      return null;
    }
  }

  static saveSessionMemory(session: UserSessionMemory): void {
    try {
      session.lastActivity = new Date();
      localStorage.setItem(
        `${this.SESSION_STORAGE_KEY}_${session.sessionId}`,
        JSON.stringify(session)
      );
      debugLog('💾 Session memory saved:', session.sessionId);
    } catch (error) {
      debugLog('❌ Failed to save session memory:', error);
    }
  }

  static addConversationEntry(sessionId: string, entry: ConversationEntry): void {
    const session = this.getSessionMemory(sessionId);
    if (!session) return;

    session.conversationHistory.push(entry);
    
    // Keep only last 50 entries to prevent memory bloat
    if (session.conversationHistory.length > 50) {
      session.conversationHistory = session.conversationHistory.slice(-50);
    }

    this.saveSessionMemory(session);
    debugLog('📝 Added conversation entry to session:', sessionId);
  }

  // User Profile Memory Management
  static getUserProfile(userId: string): UserProfileMemory | null {
    try {
      const stored = localStorage.getItem(`${this.PROFILE_STORAGE_KEY}_${userId}`);
      if (!stored) return null;
      
      const profile = JSON.parse(stored);
      profile.createdAt = new Date(profile.createdAt);
      profile.updatedAt = new Date(profile.updatedAt);
      
      return profile;
    } catch (error) {
      debugLog('❌ Failed to load user profile:', error);
      return null;
    }
  }

  static createUserProfile(userId: string): UserProfileMemory {
    const profile: UserProfileMemory = {
      userId,
      longTermPreferences: {
        primaryDomains: [],
        expertiseAreas: [],
        learningGoals: [],
        preferredFrameworks: []
      },
      promptingStyle: {
        verbosity: 'detailed',
        structurePreference: 'formal',
        exampleUsage: 'moderate'
      },
      domainExpertise: [],
      learningProgress: {
        completedLessons: [],
        skillLevels: {},
        achievements: [],
        nextRecommendations: []
      },
      effectiveTemplates: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.saveUserProfile(profile);
    debugLog('👤 Created user profile:', userId);
    return profile;
  }

  static saveUserProfile(profile: UserProfileMemory): void {
    try {
      profile.updatedAt = new Date();
      localStorage.setItem(
        `${this.PROFILE_STORAGE_KEY}_${profile.userId}`,
        JSON.stringify(profile)
      );
      debugLog('💾 User profile saved:', profile.userId);
    } catch (error) {
      debugLog('❌ Failed to save user profile:', error);
    }
  }

  // Template Effectiveness Memory
  static getTemplateEffectiveness(templateId: string): TemplateEffectivenessMemory | null {
    try {
      const stored = localStorage.getItem(`${this.TEMPLATE_STORAGE_KEY}_${templateId}`);
      if (!stored) return null;
      
      const effectiveness = JSON.parse(stored);
      effectiveness.lastUsed = new Date(effectiveness.lastUsed);
      effectiveness.userFeedback = effectiveness.userFeedback.map((feedback: any) => ({
        ...feedback,
        timestamp: new Date(feedback.timestamp)
      }));
      
      return effectiveness;
    } catch (error) {
      debugLog('❌ Failed to load template effectiveness:', error);
      return null;
    }
  }

  static updateTemplateEffectiveness(
    templateId: string, 
    qualityScore: number, 
    userRating?: number
  ): void {
    let effectiveness = this.getTemplateEffectiveness(templateId);
    
    if (!effectiveness) {
      effectiveness = {
        templateId,
        usageCount: 0,
        successRate: 0,
        averageQualityScore: 0,
        userFeedback: [],
        performanceMetrics: {
          averageProcessingTime: 0,
          qualityImprovementRate: 0,
          userSatisfactionScore: 0,
          adoptionRate: 0
        },
        lastUsed: new Date()
      };
    }

    // Update metrics
    effectiveness.usageCount++;
    effectiveness.averageQualityScore = 
      (effectiveness.averageQualityScore * (effectiveness.usageCount - 1) + qualityScore) / effectiveness.usageCount;
    
    if (userRating) {
      effectiveness.userFeedback.push({
        rating: userRating,
        timestamp: new Date(),
        context: 'prompt_transformation'
      });
      
      // Update satisfaction score
      const totalRating = effectiveness.userFeedback.reduce((sum, feedback) => sum + feedback.rating, 0);
      effectiveness.performanceMetrics.userSatisfactionScore = totalRating / effectiveness.userFeedback.length;
    }

    effectiveness.lastUsed = new Date();
    
    try {
      localStorage.setItem(
        `${this.TEMPLATE_STORAGE_KEY}_${templateId}`,
        JSON.stringify(effectiveness)
      );
      debugLog('📊 Template effectiveness updated:', templateId);
    } catch (error) {
      debugLog('❌ Failed to update template effectiveness:', error);
    }
  }

  // Helper Methods
  private static getDefaultPreferences(): UserPreferences {
    return {
      preferredComplexity: 'intermediate',
      favoriteTemplates: [],
      outputFormat: 'structured',
      communicationStyle: 'professional'
    };
  }

  // Memory Cleanup
  static cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.SESSION_STORAGE_KEY)) {
        try {
          const session = JSON.parse(localStorage.getItem(key) || '{}');
          const lastActivity = new Date(session.lastActivity).getTime();
          
          if (lastActivity < cutoffTime) {
            localStorage.removeItem(key);
            debugLog('🧹 Cleaned up old session:', key);
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    }
  }

  // Memory Statistics
  static getMemoryStats(): {
    sessionCount: number;
    profileCount: number;
    templateCount: number;
    totalMemoryUsage: number;
  } {
    let sessionCount = 0;
    let profileCount = 0;
    let templateCount = 0;
    let totalMemoryUsage = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key || '');
      
      if (key?.startsWith(this.SESSION_STORAGE_KEY)) sessionCount++;
      else if (key?.startsWith(this.PROFILE_STORAGE_KEY)) profileCount++;
      else if (key?.startsWith(this.TEMPLATE_STORAGE_KEY)) templateCount++;
      
      totalMemoryUsage += (key?.length || 0) + (value?.length || 0);
    }

    return {
      sessionCount,
      profileCount,
      templateCount,
      totalMemoryUsage
    };
  }
}
