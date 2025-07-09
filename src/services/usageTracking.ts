import { debugLog } from '../utils/debug';

export interface UsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  requestsByCategory: Record<string, number>;
  requestsByModel: Record<string, number>;
  dailyUsage: Record<string, number>;
  costEstimate: number;
}

export interface UsageSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  requests: UsageRequest[];
  totalCost: number;
}

export interface UsageRequest {
  id: string;
  timestamp: Date;
  type: 'prompt_enhancement' | 'image_analysis' | 'chat_response';
  category: string;
  model: string;
  processingTime: number;
  tokensUsed: number;
  success: boolean;
  costEstimate: number;
  inputLength: number;
  outputLength: number;
}

export interface UsageLimits {
  dailyRequestLimit: number;
  monthlyRequestLimit: number;
  dailyCostLimit: number;
  monthlyCostLimit: number;
  warningThreshold: number; // Percentage of limit to trigger warning
}

export class UsageTrackingService {
  private static readonly STORAGE_KEY = 'promptshare_usage_tracking';
  private static readonly SESSION_KEY = 'promptshare_current_session';
  private static readonly LIMITS_KEY = 'promptshare_usage_limits';
  
  // Cost estimates per model (in USD per 1K tokens)
  private static readonly MODEL_COSTS = {
    'mistralai/mistral-small-3.2-24b-instruct:free': 0.0, // Free model
    'moonshotai/kimi-dev-72b:free': 0.0, // Free model
    'deepseek/deepseek-r1-0528-qwen3-8b:free': 0.0, // Free model
    'qwen/qwen2.5-vl-32b-instruct:free': 0.0, // Free model
    'default': 0.0 // Default for free models
  };

  // Default usage limits
  private static readonly DEFAULT_LIMITS: UsageLimits = {
    dailyRequestLimit: 100,
    monthlyRequestLimit: 2000,
    dailyCostLimit: 0.0, // Free models
    monthlyCostLimit: 0.0, // Free models
    warningThreshold: 80 // 80% of limit
  };

  // Initialize usage tracking
  static initializeTracking(): UsageMetrics {
    const defaultMetrics: UsageMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      requestsByCategory: {},
      requestsByModel: {},
      dailyUsage: {},
      costEstimate: 0
    };

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const metrics = JSON.parse(stored) as UsageMetrics;
        debugLog('📊 Loaded existing usage metrics');
        return metrics;
      }
    } catch (error) {
      debugLog('⚠️ Failed to load usage metrics, using default');
    }

    debugLog('🆕 Initialized new usage tracking');
    return defaultMetrics;
  }

  // Start a new usage session
  static startSession(): UsageSession {
    const session: UsageSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      requests: [],
      totalCost: 0
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    debugLog('🎬 Started new usage session:', session.sessionId);
    return session;
  }

  // Track a new AI request
  static trackRequest(
    type: UsageRequest['type'],
    category: string,
    model: string,
    processingTime: number,
    success: boolean,
    inputLength: number,
    outputLength: number
  ): void {
    const tokensUsed = this.estimateTokens(inputLength, outputLength);
    const costEstimate = this.calculateCost(model, tokensUsed);

    const request: UsageRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      category,
      model,
      processingTime,
      tokensUsed,
      success,
      costEstimate,
      inputLength,
      outputLength
    };

    // Update current session
    this.updateSession(request);

    // Update overall metrics
    this.updateMetrics(request);

    debugLog('📈 Tracked AI request:', {
      type,
      category,
      model,
      success,
      tokensUsed,
      costEstimate
    });
  }

  // Get current usage metrics
  static getUsageMetrics(): UsageMetrics {
    return this.initializeTracking();
  }

  // Get current session
  static getCurrentSession(): UsageSession | null {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        return JSON.parse(stored) as UsageSession;
      }
    } catch (error) {
      debugLog('⚠️ Failed to load current session');
    }
    return null;
  }

  // Check if usage limits are exceeded
  static checkUsageLimits(): {
    dailyLimitExceeded: boolean;
    monthlyLimitExceeded: boolean;
    dailyWarning: boolean;
    monthlyWarning: boolean;
    remainingDaily: number;
    remainingMonthly: number;
  } {
    const metrics = this.getUsageMetrics();
    const limits = this.getUsageLimits();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    const dailyUsage = metrics.dailyUsage[today] || 0;
    const monthlyUsage = Object.keys(metrics.dailyUsage)
      .filter(date => date.startsWith(thisMonth))
      .reduce((sum, date) => sum + metrics.dailyUsage[date], 0);

    const dailyLimitExceeded = dailyUsage >= limits.dailyRequestLimit;
    const monthlyLimitExceeded = monthlyUsage >= limits.monthlyRequestLimit;
    const dailyWarning = dailyUsage >= (limits.dailyRequestLimit * limits.warningThreshold / 100);
    const monthlyWarning = monthlyUsage >= (limits.monthlyRequestLimit * limits.warningThreshold / 100);

    return {
      dailyLimitExceeded,
      monthlyLimitExceeded,
      dailyWarning,
      monthlyWarning,
      remainingDaily: Math.max(0, limits.dailyRequestLimit - dailyUsage),
      remainingMonthly: Math.max(0, limits.monthlyRequestLimit - monthlyUsage)
    };
  }

  // Get usage limits
  static getUsageLimits(): UsageLimits {
    try {
      const stored = localStorage.getItem(this.LIMITS_KEY);
      if (stored) {
        return { ...this.DEFAULT_LIMITS, ...JSON.parse(stored) };
      }
    } catch (error) {
      debugLog('⚠️ Failed to load usage limits, using default');
    }
    return this.DEFAULT_LIMITS;
  }

  // Update usage limits
  static updateUsageLimits(limits: Partial<UsageLimits>): void {
    const currentLimits = this.getUsageLimits();
    const updatedLimits = { ...currentLimits, ...limits };
    localStorage.setItem(this.LIMITS_KEY, JSON.stringify(updatedLimits));
    debugLog('⚙️ Updated usage limits');
  }

  // Export usage data for analysis
  static exportUsageData(): string {
    const metrics = this.getUsageMetrics();
    const session = this.getCurrentSession();
    const limits = this.getUsageLimits();

    return JSON.stringify({
      metrics,
      session,
      limits,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Clear usage data
  static clearUsageData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    debugLog('🗑️ Cleared usage data');
  }

  // Private helper methods
  private static updateSession(request: UsageRequest): void {
    const session = this.getCurrentSession() || this.startSession();
    session.requests.push(request);
    session.totalCost += request.costEstimate;
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  private static updateMetrics(request: UsageRequest): void {
    const metrics = this.getUsageMetrics();
    const today = new Date().toISOString().split('T')[0];

    // Update counters
    metrics.totalRequests++;
    if (request.success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Update tokens and processing time
    metrics.totalTokensUsed += request.tokensUsed;
    metrics.totalProcessingTime += request.processingTime;
    metrics.averageProcessingTime = metrics.totalProcessingTime / metrics.totalRequests;

    // Update cost estimate
    metrics.costEstimate += request.costEstimate;

    // Update category tracking
    metrics.requestsByCategory[request.category] = (metrics.requestsByCategory[request.category] || 0) + 1;

    // Update model tracking
    metrics.requestsByModel[request.model] = (metrics.requestsByModel[request.model] || 0) + 1;

    // Update daily usage
    metrics.dailyUsage[today] = (metrics.dailyUsage[today] || 0) + 1;

    // Save updated metrics
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metrics));
  }

  private static estimateTokens(inputLength: number, outputLength: number): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil((inputLength + outputLength) / 4);
  }

  private static calculateCost(model: string, tokens: number): number {
    const costPerToken = this.MODEL_COSTS[model] || this.MODEL_COSTS.default;
    return (tokens / 1000) * costPerToken;
  }
}
