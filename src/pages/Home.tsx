import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DatabaseService } from '../services/database';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import PageLayout from '../components/PageLayout';
import SearchBar from '../components/SearchBar';
import { useRecommendations } from '../hooks/useRecommendations';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Sparkles, Clock, Loader } from 'lucide-react';
import AISEOAnswerBlock from '../components/AISEOAnswerBlock';
import FAQSection from '../components/FAQSection';
import AuthorityStats from '../components/AuthorityStats';

const POST_BATCH = 50; // Match search page batch size to ensure parity

const Home: React.FC = () => {
  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  // Use refs so scroll callbacks always read the latest values (no stale closures)
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const isBottomVisible = useIntersectionObserver(bottomSentinelRef, {
    threshold: 0,
    rootMargin: '600px', // Trigger 600px before reaching the bottom - fires well in advance
  });

  const {
    mode,
    setMode,
    sortItems,
    onView,
    onLike,
    onUnlike,
    onSave,
    onUnsave,
    hasPersonalization,
  } = useRecommendations<Post>();

  const feedPosts = useMemo(() => sortItems(rawPosts), [rawPosts, sortItems]);

  const fetchPosts = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) return;
    if (!hasMoreRef.current && !isInitial) return;

    isFetchingRef.current = true;

    if (isInitial) {
      setLoading(true);
      offsetRef.current = 0;
      hasMoreRef.current = true;
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const posts = await DatabaseService.getPosts(POST_BATCH, offsetRef.current);
      console.log(`📄 Fetched ${posts.length} posts at offset ${offsetRef.current} (batch=${POST_BATCH})`);

      if (posts.length < POST_BATCH) {
        hasMoreRef.current = false;
        setHasMore(false);
        console.log('✅ All posts loaded — no more pages');
      } else {
        // Full batch returned — there may be more
        hasMoreRef.current = true;
        setHasMore(true);
      }

      offsetRef.current += posts.length;

      if (isInitial) {
        setRawPosts(posts);
      } else {
        setRawPosts(prev => {
          // Deduplicate by id in case of any overlapping pages
          const existingIds = new Set(prev.map(p => p.id));
          const newOnly = posts.filter(p => !existingIds.has(p.id));
          return [...prev, ...newOnly];
        });
      }

      setError('');
    } catch (err: any) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  // Infinite scroll trigger
  useEffect(() => {
    if (isBottomVisible && hasMoreRef.current && !isFetchingRef.current) {
      fetchPosts(false);
    }
  }, [isBottomVisible, fetchPosts]);

  const handleItemLike = (post: Post, liked: boolean) => {
    if (liked) onLike(post); else onUnlike(post);
  };
  const handleItemSave = (post: Post, saved: boolean) => {
    if (saved) onSave(post); else onUnsave(post);
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
        <div className="mb-8 pt-4 md:pt-6">
          <h1 className="text-3xl md:text-4xl font-extrabold font-outfit text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 tracking-tight mb-3">
            {mode === 'recommended' ? 'For You' : 'Latest Content'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
            {mode === 'recommended'
              ? 'Personalized recommendations based on your interests.'
              : 'Discover amazing AI prompts and tools from the community.'
            }
          </p>

          {/* Feed Mode Toggle */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setMode('recommended')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ${mode === 'recommended'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                : 'glass-panel text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50'
                }`}
            >
              <Sparkles size={16} />
              For You
              {hasPersonalization && mode === 'recommended' && (
                <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setMode('latest')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 ${mode === 'latest'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                : 'glass-panel text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50'
                }`}
            >
              <Clock size={16} />
              Latest
            </button>
          </div>

          {/* Personalization hint for new users */}
          {mode === 'recommended' && !hasPersonalization && (
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                ✨ Like and save posts to get personalized recommendations!
              </p>
            </div>
          )}

          {/* Search Bar */}
          <SearchBar
            placeholder="Search prompts and posts..."
            showTrending={true}
            variant="prominent"
            className="max-w-lg mx-auto md:mx-0"
          />

          {/* AI SEO Definition Block */}
          <AISEOAnswerBlock
            title="What is PromptShare AI?"
            answer="PromptShare AI is a community-driven platform for discovering, creating, and sharing high-quality AI prompts for models like Gemini, ChatGPT, and Midjourney. Our mission is to democratize prompt engineering by providing a collaborative library where creators can find inspiration and optimize their AI-driven workflows with proven, community-vetted prompt templates."
            id="about-promptshare"
          />

          {/* Authority Statistics */}
          <AuthorityStats />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchPosts(true)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Posts Feed */}
        {feedPosts.length > 0 && (
          <div className="space-y-6">
            {feedPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onView={() => onView(post)}
                onLikeChange={(liked) => handleItemLike(post, liked)}
                onSaveChange={(saved) => handleItemSave(post, saved)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {feedPosts.length === 0 && !loading && !error && (
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
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Create First Post
            </button>
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        {feedPosts.length > 0 && (
          <div ref={bottomSentinelRef} className="mt-10 mb-8 h-20 flex items-center justify-center">
            {loadingMore ? (
              <div className="flex items-center space-x-2 text-blue-500">
                <Loader className="w-6 h-6 animate-spin" />
                <span className="font-medium">Loading more posts...</span>
              </div>
            ) : !hasMore ? (
              <div className="text-gray-400 dark:text-gray-500 font-medium text-sm">
                ✓ You're all caught up!
              </div>
            ) : (
              <div className="h-4 w-full opacity-0 pointer-events-none" />
            )}
          </div>
        )}

        {/* AI SEO FAQ Section */}
        <div className="mt-16 border-t border-gray-100 dark:border-gray-800 pt-10">
          <FAQSection
            faqs={[
              {
                question: "How do I find the best AI prompts on PromptShare?",
                answer: "You can find the best AI prompts by browsing the 'For You' feed, which uses our personalization algorithm, or by exploring the 'Latest' tab. Use the search bar for specific models like 'Midjourney' or 'Gemini' to discover top-rated community contributions."
              },
              {
                question: "Is PromptShare AI free to use?",
                answer: "Yes, PromptShare AI is a free community platform where you can discover and share prompts. We aim to support the AI creative community by providing open access to a growing library of prompt engineering resources."
              },
              {
                question: "Can I use these prompts for commercial projects?",
                answer: "Most prompts shared on PromptShare AI are contributed by the community and are available for experimentation and use. We recommend citing the original creator when using complex prompt templates in high-stakes commercial environments."
              },
              {
                question: "What AI models are supported?",
                answer: "We support prompts for all major generative AI models, including Google Gemini, OpenAI ChatGPT, Anthropic Claude, Midjourney, DALL-E, and Stable Diffusion. Our categories help you filter for text, image, and code generation specifically."
              }
            ]}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default Home;
