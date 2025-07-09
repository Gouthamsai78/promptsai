import { debugLog } from '../utils/debug';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    promptCategory?: string;
    processingTime?: number;
    modelUsed?: string;
    enhancementCount?: number;
  };
}

export interface UserPreferences {
  preferredStyles: string[];
  commonTopics: string[];
  writingStyle: 'professional' | 'casual' | 'creative' | 'technical';
  preferredPromptLength: 'short' | 'medium' | 'long' | 'detailed';
  favoriteCategories: string[];
  qualityLevel: 'basic' | 'professional' | 'expert';
}

export interface SessionContext {
  sessionId: string;
  startTime: Date;
  totalPrompts: number;
  successfulEnhancements: number;
  preferredCategories: string[];
  averageProcessingTime: number;
  mostUsedStyles: string[];
  userSatisfactionScore: number;
}

export interface ConversationMemory {
  messages: ConversationMessage[];
  userPreferences: UserPreferences;
  sessionContext: SessionContext;
  learningInsights: {
    commonPatterns: string[];
    improvementSuggestions: string[];
    styleEvolution: string[];
  };
}

export class ConversationMemoryService {
  private static readonly STORAGE_KEY = 'promptshare_conversation_memory';
  private static readonly MAX_MESSAGES = 100; // Keep last 100 messages
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  // Initialize or load conversation memory
  static initializeMemory(userId?: string): ConversationMemory {
    const sessionId = this.generateSessionId();
    
    const defaultMemory: ConversationMemory = {
      messages: [],
      userPreferences: {
        preferredStyles: [],
        commonTopics: [],
        writingStyle: 'professional',
        preferredPromptLength: 'medium',
        favoriteCategories: [],
        qualityLevel: 'professional'
      },
      sessionContext: {
        sessionId,
        startTime: new Date(),
        totalPrompts: 0,
        successfulEnhancements: 0,
        preferredCategories: [],
        averageProcessingTime: 0,
        mostUsedStyles: [],
        userSatisfactionScore: 0
      },
      learningInsights: {
        commonPatterns: [],
        improvementSuggestions: [],
        styleEvolution: []
      }
    };

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedMemory = JSON.parse(stored) as ConversationMemory;
        
        // Check if session is still valid
        const sessionAge = Date.now() - new Date(parsedMemory.sessionContext.startTime).getTime();
        if (sessionAge < this.SESSION_TIMEOUT) {
          // Update session ID but keep other data
          parsedMemory.sessionContext.sessionId = sessionId;
          debugLog('📚 Loaded existing conversation memory');
          return parsedMemory;
        }
      }
    } catch (error) {
      debugLog('⚠️ Failed to load conversation memory, using default');
    }

    debugLog('🆕 Initialized new conversation memory');
    return defaultMemory;
  }

  // Save conversation memory to storage
  static saveMemory(memory: ConversationMemory): void {
    try {
      // Limit message history to prevent storage bloat
      if (memory.messages.length > this.MAX_MESSAGES) {
        memory.messages = memory.messages.slice(-this.MAX_MESSAGES);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(memory));
      debugLog('💾 Conversation memory saved');
    } catch (error) {
      debugLog('❌ Failed to save conversation memory:', error);
    }
  }

  // Add a new message to memory
  static addMessage(memory: ConversationMemory, message: ConversationMessage): ConversationMemory {
    const updatedMemory = { ...memory };
    updatedMemory.messages.push(message);

    // Update session context based on message
    if (message.type === 'user') {
      updatedMemory.sessionContext.totalPrompts++;
    }

    if (message.type === 'ai' && message.metadata?.enhancementCount) {
      updatedMemory.sessionContext.successfulEnhancements++;
    }

    // Update processing time average
    if (message.metadata?.processingTime) {
      const currentAvg = updatedMemory.sessionContext.averageProcessingTime;
      const totalEnhancements = updatedMemory.sessionContext.successfulEnhancements;
      updatedMemory.sessionContext.averageProcessingTime = 
        (currentAvg * (totalEnhancements - 1) + message.metadata.processingTime) / totalEnhancements;
    }

    // Update preferred categories
    if (message.metadata?.promptCategory) {
      const category = message.metadata.promptCategory;
      const categories = updatedMemory.sessionContext.preferredCategories;
      const existingIndex = categories.indexOf(category);
      
      if (existingIndex === -1) {
        categories.push(category);
      }
      
      // Sort by frequency (most used first)
      updatedMemory.sessionContext.preferredCategories = this.sortByFrequency(
        updatedMemory.messages
          .filter(m => m.metadata?.promptCategory)
          .map(m => m.metadata!.promptCategory!)
      );
    }

    this.saveMemory(updatedMemory);
    return updatedMemory;
  }

  // Analyze user preferences from conversation history
  static analyzeUserPreferences(memory: ConversationMemory): UserPreferences {
    const messages = memory.messages;
    const userMessages = messages.filter(m => m.type === 'user');
    const aiMessages = messages.filter(m => m.type === 'ai');

    // Analyze preferred styles from AI responses
    const styleFrequency = new Map<string, number>();
    aiMessages.forEach(msg => {
      if (msg.metadata?.promptCategory) {
        const count = styleFrequency.get(msg.metadata.promptCategory) || 0;
        styleFrequency.set(msg.metadata.promptCategory, count + 1);
      }
    });

    const preferredStyles = Array.from(styleFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([style]) => style);

    // Analyze common topics from user messages
    const topicKeywords = this.extractTopicKeywords(userMessages);
    
    // Determine writing style preference
    const writingStyle = this.determineWritingStyle(userMessages);
    
    // Determine preferred prompt length
    const preferredPromptLength = this.determinePromptLength(userMessages);

    return {
      preferredStyles,
      commonTopics: topicKeywords,
      writingStyle,
      preferredPromptLength,
      favoriteCategories: memory.sessionContext.preferredCategories.slice(0, 5),
      qualityLevel: 'professional' // Default for now, could be analyzed
    };
  }

  // Generate contextual prompt for AI based on conversation memory
  static generateContextualPrompt(memory: ConversationMemory, currentInput: string): string {
    const preferences = this.analyzeUserPreferences(memory);
    const recentMessages = memory.messages.slice(-10); // Last 10 messages for context
    
    const contextPrompt = `CONVERSATION CONTEXT:
Session Statistics:
- Total prompts created: ${memory.sessionContext.totalPrompts}
- Successful enhancements: ${memory.sessionContext.successfulEnhancements}
- Average processing time: ${Math.round(memory.sessionContext.averageProcessingTime)}ms
- Preferred categories: ${memory.sessionContext.preferredCategories.slice(0, 3).join(', ') || 'None yet'}

User Preferences (learned from conversation):
- Preferred styles: ${preferences.preferredStyles.slice(0, 3).join(', ') || 'Not determined'}
- Writing style: ${preferences.writingStyle}
- Prompt length preference: ${preferences.preferredPromptLength}
- Common topics: ${preferences.commonTopics.slice(0, 3).join(', ') || 'Various'}
- Quality level: ${preferences.qualityLevel}

Recent Conversation Context:
${recentMessages.slice(-5).map(msg => 
  `${msg.type.toUpperCase()}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
).join('\n')}

Current User Input: ${currentInput}

Please provide a response that:
1. Acknowledges the user's established preferences and patterns
2. Builds upon previous conversation context when relevant
3. Adapts to their preferred communication style
4. Suggests improvements based on their usage patterns
5. Maintains consistency with their quality expectations`;

    return contextPrompt;
  }

  // Helper methods
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static sortByFrequency(items: string[]): string[] {
    const frequency = new Map<string, number>();
    items.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });
    
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => item);
  }

  private static extractTopicKeywords(messages: ConversationMessage[]): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
    
    const words = messages
      .map(m => m.content.toLowerCase())
      .join(' ')
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    return this.sortByFrequency(words).slice(0, 10);
  }

  private static determineWritingStyle(messages: ConversationMessage[]): UserPreferences['writingStyle'] {
    const content = messages.map(m => m.content).join(' ').toLowerCase();
    
    if (content.includes('professional') || content.includes('business') || content.includes('formal')) {
      return 'professional';
    } else if (content.includes('creative') || content.includes('artistic') || content.includes('imaginative')) {
      return 'creative';
    } else if (content.includes('technical') || content.includes('specification') || content.includes('detailed')) {
      return 'technical';
    }
    
    return 'casual';
  }

  private static determinePromptLength(messages: ConversationMessage[]): UserPreferences['preferredPromptLength'] {
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    
    if (avgLength > 200) return 'detailed';
    if (avgLength > 100) return 'long';
    if (avgLength > 50) return 'medium';
    return 'short';
  }

  // Clear conversation memory
  static clearMemory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    debugLog('🗑️ Conversation memory cleared');
  }

  // Export conversation for analysis or backup
  static exportConversation(memory: ConversationMemory): string {
    return JSON.stringify(memory, null, 2);
  }
}
