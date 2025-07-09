import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/database';
import { Post, Reel } from '../types';
import PostCard from '../components/PostCard';
import ReelCard from '../components/ReelCard';
import PageLayout from '../components/PageLayout';

type FeedItem = (Post & { type: 'post' }) | (Reel & { type: 'reel' });

const Home: React.FC = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFeedItems();
  }, []);

  const loadFeedItems = async (offset = 0) => {
    try {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Load both posts and reels
      const [posts, reels] = await Promise.all([
        DatabaseService.getPosts(15, Math.floor(offset * 0.75)), // 75% posts
        DatabaseService.getReels(5, Math.floor(offset * 0.25))   // 25% reels
      ]);

      // Combine and shuffle posts and reels
      const combinedItems: FeedItem[] = [
        ...posts.map(post => ({ ...post, type: 'post' as const })),
        ...reels.map(reel => ({ ...reel, type: 'reel' as const }))
      ];

      // Sort by creation date for chronological feed
      combinedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (offset === 0) {
        setFeedItems(combinedItems);
      } else {
        setFeedItems(prev => [...prev, ...combinedItems]);
      }

      // Check if there are more items
      if (combinedItems.length < 20) {
        setHasMore(false);
      }

      setError('');
    } catch (error: any) {
      console.error('Error loading feed items:', error);
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadFeedItems(feedItems.length);
    }
  };

  if (loading) {
    return (
      <PageLayout className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Latest Content
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover amazing AI prompts, reels, and tools from the community
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={() => loadFeedItems()}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Feed Items */}
        {feedItems.length > 0 && (
          <div className="space-y-6">
            {feedItems.map(item => (
              item.type === 'post' ? (
                <PostCard key={`post-${item.id}`} post={item} />
              ) : (
                <ReelCard key={`reel-${item.id}`} reel={item} isVisible={false} isInFeed={true} />
              )
            ))}
          </div>
        )}

        {/* Empty State */}
        {feedItems.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No content yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to share amazing AI content!
            </p>
            <button
              onClick={() => window.location.href = '/create'}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Create First Post
            </button>
          </div>
        )}

        {/* Load More */}
        {feedItems.length > 0 && hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Loading...' : 'Load More Content'}
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Home;