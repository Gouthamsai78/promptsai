/**
 * useRecommendations Hook
 * 
 * React hook for consuming the recommendation service in components.
 * Provides sorted feed items and interaction tracking.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Post, Reel } from '../types';
import {
    RecommendationService,
    ScoredItem,
    UserPreferences,
    getUserPreferences,
    sortByRecommendation,
    hasEnoughHistory,
    recordView,
    recordLike,
    recordUnlike,
    recordSave,
    recordUnsave,
} from '../services/recommendationService';

export type FeedMode = 'recommended' | 'latest';

export interface UseRecommendationsOptions {
    defaultMode?: FeedMode;
}

export interface UseRecommendationsResult<T extends Post | Reel> {
    /** Current feed display mode */
    mode: FeedMode;
    /** Set the feed display mode */
    setMode: (mode: FeedMode) => void;
    /** Toggle between recommended and latest */
    toggleMode: () => void;
    /** Sort items based on current mode */
    sortItems: (items: T[]) => T[];
    /** Get scored items with breakdown (for debugging/analytics) */
    getScoredItems: (items: T[]) => ScoredItem<T>[];
    /** Record that an item was viewed */
    onView: (item: T) => void;
    /** Record that an item was liked */
    onLike: (item: T) => void;
    /** Record that an item was unliked */
    onUnlike: (item: T) => void;
    /** Record that an item was saved */
    onSave: (item: T) => void;
    /** Record that an item was unsaved */
    onUnsave: (item: T) => void;
    /** Whether user has enough history for personalized recommendations */
    hasPersonalization: boolean;
    /** Current user preferences (readonly) */
    preferences: UserPreferences;
}

/**
 * Hook for managing feed recommendations
 */
export function useRecommendations<T extends Post | Reel>(
    options: UseRecommendationsOptions = {}
): UseRecommendationsResult<T> {
    const { defaultMode = 'recommended' } = options;

    // Feed display mode state
    const [mode, setMode] = useState<FeedMode>(() => {
        // Try to load saved preference
        try {
            const saved = localStorage.getItem('promptshare_feed_mode');
            if (saved === 'recommended' || saved === 'latest') {
                return saved;
            }
        } catch {
            // Ignore localStorage errors
        }
        return defaultMode;
    });

    // User preferences state
    const [preferences, setPreferences] = useState<UserPreferences>(getUserPreferences);

    // Persist mode preference
    useEffect(() => {
        try {
            localStorage.setItem('promptshare_feed_mode', mode);
        } catch {
            // Ignore localStorage errors
        }
    }, [mode]);

    // Refresh preferences periodically (in case of changes from other tabs)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'promptshare_user_prefs') {
                setPreferences(getUserPreferences());
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Toggle between modes
    const toggleMode = useCallback(() => {
        setMode(prev => prev === 'recommended' ? 'latest' : 'recommended');
    }, []);

    // Check if user has enough interaction history
    const hasPersonalization = useMemo(() => hasEnoughHistory(), [preferences]);

    // Sort items based on current mode
    const sortItems = useCallback((items: T[]): T[] => {
        if (mode === 'latest') {
            // Sort by creation date (newest first)
            return [...items].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        }

        // Sort by recommendation score
        const scored = sortByRecommendation(items, preferences);
        return scored.map(s => s.item);
    }, [mode, preferences]);

    // Get scored items with full breakdown
    const getScoredItems = useCallback((items: T[]): ScoredItem<T>[] => {
        return sortByRecommendation(items, preferences);
    }, [preferences]);

    // Interaction handlers that update preferences
    const onView = useCallback((item: T) => {
        recordView(item);
        setPreferences(getUserPreferences());
    }, []);

    const onLike = useCallback((item: T) => {
        recordLike(item);
        setPreferences(getUserPreferences());
    }, []);

    const onUnlike = useCallback((item: T) => {
        recordUnlike(item);
        setPreferences(getUserPreferences());
    }, []);

    const onSave = useCallback((item: T) => {
        recordSave(item);
        setPreferences(getUserPreferences());
    }, []);

    const onUnsave = useCallback((item: T) => {
        recordUnsave(item);
        setPreferences(getUserPreferences());
    }, []);

    return {
        mode,
        setMode,
        toggleMode,
        sortItems,
        getScoredItems,
        onView,
        onLike,
        onUnlike,
        onSave,
        onUnsave,
        hasPersonalization,
        preferences,
    };
}

export default useRecommendations;
