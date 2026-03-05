/**
 * Client-Side Recommendation Service
 * 
 * A pure client-side recommendation engine that scores posts/reels based on:
 * - Engagement signals (likes, comments, saves)
 * - Content freshness (time decay)
 * - User affinity (matching tags from user's interaction history)
 * 
 * No server computation required - all scoring happens in the browser.
 */

import { Post, Reel } from '../types';

// Types for the recommendation system
export interface UserPreferences {
  tagWeights: Record<string, number>;
  viewedPosts: string[];
  likedTags: string[];
  savedTags: string[];
  lastUpdated: number;
}

export interface ScoredItem<T> {
  item: T;
  score: number;
  breakdown: {
    engagement: number;
    freshness: number;
    affinity: number;
  };
}

// Constants for scoring weights
const WEIGHTS = {
  ENGAGEMENT: 0.4,
  FRESHNESS: 0.3,
  AFFINITY: 0.3,
} as const;

// Engagement scoring multipliers
const ENGAGEMENT_MULTIPLIERS = {
  LIKES: 1.0,
  COMMENTS: 2.0,
  SAVES: 1.5,
  VIEWS: 0.1, // For reels
} as const;

// Maximum engagement score normalization factor
const MAX_ENGAGEMENT_VALUE = 100;

// Freshness decay half-life in hours (~17 hours for reasonable decay)
const FRESHNESS_HALF_LIFE_HOURS = 24;

// Local storage key for user preferences
const STORAGE_KEY = 'promptshare_user_prefs';

// Maximum number of viewed posts to track
const MAX_VIEWED_POSTS = 500;

// Tag weight decay factor per day
const TAG_WEIGHT_DECAY = 0.95;

/**
 * Calculate engagement score (0-1) based on likes, comments, saves, and views
 */
export function calculateEngagementScore(
  likesCount: number,
  commentsCount: number,
  savesCount: number,
  viewsCount: number = 0
): number {
  const rawScore =
    likesCount * ENGAGEMENT_MULTIPLIERS.LIKES +
    commentsCount * ENGAGEMENT_MULTIPLIERS.COMMENTS +
    savesCount * ENGAGEMENT_MULTIPLIERS.SAVES +
    viewsCount * ENGAGEMENT_MULTIPLIERS.VIEWS;

  // Normalize to 0-1 range with diminishing returns
  return Math.min(1, rawScore / MAX_ENGAGEMENT_VALUE);
}

/**
 * Calculate freshness score (0-1) with exponential decay
 */
export function calculateFreshnessScore(createdAt: string | Date): number {
  const now = Date.now();
  const createdTime = new Date(createdAt).getTime();
  const hoursOld = (now - createdTime) / (1000 * 60 * 60);

  // Exponential decay: e^(-t/τ) where τ is the half-life
  return Math.exp(-hoursOld / FRESHNESS_HALF_LIFE_HOURS);
}

/**
 * Calculate user affinity score (0-1) based on matching tags
 */
export function calculateAffinityScore(
  postTags: string[],
  userPreferences: UserPreferences
): number {
  if (!postTags || postTags.length === 0) {
    return 0.5; // Neutral score for posts without tags
  }

  const normalizedPostTags = postTags.map(tag => tag.toLowerCase().trim());
  let totalWeight = 0;
  let matchWeight = 0;

  for (const tag of normalizedPostTags) {
    if (userPreferences.tagWeights[tag]) {
      matchWeight += userPreferences.tagWeights[tag];
    }
    totalWeight += 1;
  }

  // Also check liked and saved tags for bonus
  const likedMatch = normalizedPostTags.filter(tag => 
    userPreferences.likedTags.includes(tag)
  ).length;
  const savedMatch = normalizedPostTags.filter(tag => 
    userPreferences.savedTags.includes(tag)
  ).length;

  const bonusScore = (likedMatch * 0.2 + savedMatch * 0.3) / normalizedPostTags.length;

  // Combine weighted match with bonus, cap at 1
  const weightedScore = totalWeight > 0 ? matchWeight / (totalWeight * 5) : 0;
  return Math.min(1, weightedScore + bonusScore);
}

/**
 * Calculate final recommendation score for a post or reel
 */
export function calculateRecommendationScore<T extends Post | Reel>(
  item: T,
  userPreferences: UserPreferences
): ScoredItem<T> {
  // Get counts based on item type
  const likesCount = item.likes_count || 0;
  const commentsCount = item.comments_count || 0;
  const savesCount = item.saves_count || 0;
  const viewsCount = 'views_count' in item ? (item.views_count || 0) : 0;

  // Calculate individual scores
  const engagementScore = calculateEngagementScore(
    likesCount,
    commentsCount,
    savesCount,
    viewsCount
  );

  const freshnessScore = calculateFreshnessScore(item.created_at);

  const affinityScore = calculateAffinityScore(
    item.tags || [],
    userPreferences
  );

  // Calculate weighted final score
  const finalScore =
    WEIGHTS.ENGAGEMENT * engagementScore +
    WEIGHTS.FRESHNESS * freshnessScore +
    WEIGHTS.AFFINITY * affinityScore;

  // Apply penalty for already viewed posts (small penalty to reduce repetition)
  const viewedPenalty = userPreferences.viewedPosts.includes(item.id) ? 0.1 : 0;

  return {
    item,
    score: Math.max(0, finalScore - viewedPenalty),
    breakdown: {
      engagement: engagementScore,
      freshness: freshnessScore,
      affinity: affinityScore,
    },
  };
}

/**
 * Get user preferences from localStorage
 */
export function getUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const prefs = JSON.parse(stored) as UserPreferences;
      
      // Apply daily decay to tag weights
      const daysSinceUpdate = (Date.now() - prefs.lastUpdated) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 0) {
        const decayFactor = Math.pow(TAG_WEIGHT_DECAY, daysSinceUpdate);
        for (const tag in prefs.tagWeights) {
          prefs.tagWeights[tag] *= decayFactor;
          // Remove very low weights
          if (prefs.tagWeights[tag] < 0.01) {
            delete prefs.tagWeights[tag];
          }
        }
      }
      
      return prefs;
    }
  } catch (error) {
    console.error('Error loading user preferences:', error);
  }

  // Return default preferences for new users
  return {
    tagWeights: {},
    viewedPosts: [],
    likedTags: [],
    savedTags: [],
    lastUpdated: Date.now(),
  };
}

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(preferences: UserPreferences): void {
  try {
    // Trim viewed posts to prevent localStorage bloat
    if (preferences.viewedPosts.length > MAX_VIEWED_POSTS) {
      preferences.viewedPosts = preferences.viewedPosts.slice(-MAX_VIEWED_POSTS);
    }

    preferences.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

/**
 * Record a post/reel view to update preferences
 */
export function recordView(item: Post | Reel): void {
  const prefs = getUserPreferences();
  
  if (!prefs.viewedPosts.includes(item.id)) {
    prefs.viewedPosts.push(item.id);
  }

  // Slightly boost tags from viewed content
  const tags = item.tags || [];
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().trim();
    prefs.tagWeights[normalizedTag] = (prefs.tagWeights[normalizedTag] || 0) + 0.1;
  }

  saveUserPreferences(prefs);
}

/**
 * Record a like action to update preferences
 */
export function recordLike(item: Post | Reel): void {
  const prefs = getUserPreferences();
  
  const tags = item.tags || [];
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Boost tag weight significantly for likes
    prefs.tagWeights[normalizedTag] = (prefs.tagWeights[normalizedTag] || 0) + 1;
    
    // Add to liked tags if not already present
    if (!prefs.likedTags.includes(normalizedTag)) {
      prefs.likedTags.push(normalizedTag);
    }
  }

  saveUserPreferences(prefs);
}

/**
 * Record an unlike action to update preferences
 */
export function recordUnlike(item: Post | Reel): void {
  const prefs = getUserPreferences();
  
  const tags = item.tags || [];
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Reduce tag weight
    prefs.tagWeights[normalizedTag] = Math.max(
      0,
      (prefs.tagWeights[normalizedTag] || 0) - 0.5
    );
    
    // Remove from liked tags
    prefs.likedTags = prefs.likedTags.filter(t => t !== normalizedTag);
  }

  saveUserPreferences(prefs);
}

/**
 * Record a save action to update preferences
 */
export function recordSave(item: Post | Reel): void {
  const prefs = getUserPreferences();
  
  const tags = item.tags || [];
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Boost tag weight significantly for saves (even more than likes)
    prefs.tagWeights[normalizedTag] = (prefs.tagWeights[normalizedTag] || 0) + 1.5;
    
    // Add to saved tags if not already present
    if (!prefs.savedTags.includes(normalizedTag)) {
      prefs.savedTags.push(normalizedTag);
    }
  }

  saveUserPreferences(prefs);
}

/**
 * Record an unsave action to update preferences
 */
export function recordUnsave(item: Post | Reel): void {
  const prefs = getUserPreferences();
  
  const tags = item.tags || [];
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().trim();
    
    // Reduce tag weight
    prefs.tagWeights[normalizedTag] = Math.max(
      0,
      (prefs.tagWeights[normalizedTag] || 0) - 0.7
    );
    
    // Remove from saved tags
    prefs.savedTags = prefs.savedTags.filter(t => t !== normalizedTag);
  }

  saveUserPreferences(prefs);
}

/**
 * Sort items by recommendation score (descending)
 */
export function sortByRecommendation<T extends Post | Reel>(
  items: T[],
  userPreferences?: UserPreferences
): ScoredItem<T>[] {
  const prefs = userPreferences || getUserPreferences();
  
  // Score all items
  const scoredItems = items.map(item => calculateRecommendationScore(item, prefs));
  
  // Sort by score descending
  scoredItems.sort((a, b) => b.score - a.score);
  
  return scoredItems;
}

/**
 * Check if user has enough interaction history for personalized recommendations
 */
export function hasEnoughHistory(): boolean {
  const prefs = getUserPreferences();
  const totalTagWeight = Object.values(prefs.tagWeights).reduce((sum, w) => sum + w, 0);
  
  // Consider having "enough" history if user has interacted with at least 5 items
  // or has meaningful tag weights
  return prefs.viewedPosts.length >= 5 || totalTagWeight >= 3;
}

/**
 * Clear all user preferences (useful for testing or user privacy)
 */
export function clearUserPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user preferences:', error);
  }
}

/**
 * Export the recommendation service as a singleton-like object
 */
export const RecommendationService = {
  calculateEngagementScore,
  calculateFreshnessScore,
  calculateAffinityScore,
  calculateRecommendationScore,
  getUserPreferences,
  saveUserPreferences,
  recordView,
  recordLike,
  recordUnlike,
  recordSave,
  recordUnsave,
  sortByRecommendation,
  hasEnoughHistory,
  clearUserPreferences,
};

export default RecommendationService;
