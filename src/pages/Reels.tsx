import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReelCard from '../components/ReelCard';
import { DatabaseService } from '../services/database';
import { Reel } from '../types';
import { Loader } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const Reels: React.FC = () => {
  const location = useLocation();
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const isBottomVisible = useIntersectionObserver(bottomSentinelRef, {
    root: containerRef.current,
    threshold: 0.1,
    rootMargin: '200px', // Pre-load slightly before hitting bottom
  });

  useEffect(() => {
    loadReels();
  }, []);

  useEffect(() => {
    // Handle navigation from feed with specific reel
    const state = location.state as { startReelId?: string };
    if (state?.startReelId && reels.length > 0) {
      const reelIndex = reels.findIndex(reel => reel.id === state.startReelId);
      if (reelIndex !== -1) {
        setCurrentReelIndex(reelIndex);
        // Scroll to the specific reel
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: reelIndex * window.innerHeight,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [reels, location.state]);

  const loadReels = async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    setError('');

    try {
      console.log('🎬 Loading reels from database...', { offset });
      const reelsData = await DatabaseService.getReels(10, offset); // Load in batches of 10
      console.log('✅ Reels loaded:', { count: reelsData.length, reels: reelsData });

      if (offset === 0) {
        setReels(reelsData);
      } else {
        setReels(prev => [...prev, ...reelsData]);
      }

      // Update hasMore
      if (reelsData.length < 10) {
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('❌ Error loading reels:', error);
      setError('Failed to load reels. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isBottomVisible && hasMore && !loading && !loadingMore && reels.length > 0) {
      loadReels(reels.length);
    }
  }, [isBottomVisible, hasMore, loading, loadingMore, reels.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        const reelHeight = window.innerHeight;
        const newIndex = Math.round(scrollTop / reelHeight);
        if (newIndex !== currentReelIndex && newIndex < reels.length) {
          setCurrentReelIndex(newIndex);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentReelIndex, reels.length]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader className="w-8 h-8 animate-spin text-white" />
          <span className="text-white text-lg">Loading reels...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={loadReels}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-lg mb-2">No reels available</p>
          <p className="text-gray-400">Check back later for new content!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory reels-container"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .reels-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {reels.map((reel, index) => (
          <div key={reel.id} className="snap-start relative">
            <ReelCard
              reel={reel}
              isVisible={index === currentReelIndex}
            />
          </div>
        ))}

        {/* Infinite Loading Sentinel */}
        {reels.length > 0 && (
          <div ref={bottomSentinelRef} className="snap-start h-screen w-full flex items-center justify-center bg-black">
            {loadingMore ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <Loader className="w-8 h-8 animate-spin text-white" />
                <span className="text-white text-lg">Loading more reels...</span>
              </div>
            ) : !hasMore ? (
              <div className="flex flex-col items-center justify-center text-center px-4">
                <p className="text-white text-xl font-bold mb-2">You're caught up!</p>
                <p className="text-gray-400">You've seen all the reels.</p>
              </div>
            ) : (
              // Invisible sentinel that triggers intersection observer when scrolled near
              <div className="h-4 w-full opacity-0 pointer-events-none"></div>
            )}
          </div>
        )}
      </div>

      {/* Reel indicator */}
      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 z-10">
        <span className="text-white text-sm">
          {currentReelIndex + 1} / {reels.length}
        </span>
      </div>
    </div>
  );
};

export default Reels;