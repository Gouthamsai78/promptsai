import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Copy, Check, Play, Eye, X, Volume2, VolumeX, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Reel } from '../types';
import RealtimeComments from './RealtimeComments';

interface ReelCardProps {
  reel: Reel;
  isVisible: boolean;
  isInFeed?: boolean; // New prop to indicate if reel is in home feed
}

const ReelCard: React.FC<ReelCardProps> = ({ reel, isVisible, isInFeed = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [viewsCount, setViewsCount] = useState(reel.views_count);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasViewedOnce, setHasViewedOnce] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (user) {
      checkInteractionStatus();
    }
  }, [user, reel.id]);

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible && !isInFeed) {
        videoRef.current.play();
        setIsPlaying(true);
        // Increment view count when video becomes visible (only once per session)
        if (!hasViewedOnce) {
          incrementViewCount();
          setHasViewedOnce(true);
        }
      } else if (!isVisible) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isVisible, hasViewedOnce, isInFeed]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const checkInteractionStatus = async () => {
    if (!user) return;

    try {
      const [liked, saved, following] = await Promise.all([
        DatabaseService.isReelLiked(user.id, reel.id),
        DatabaseService.isReelSaved(user.id, reel.id),
        user.id !== reel.author.id ? DatabaseService.isFollowing(user.id, reel.author.id) : Promise.resolve(false),
      ]);

      setIsLiked(liked);
      setIsSaved(saved);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error checking interaction status:', error);
    }
  };

  const incrementViewCount = async () => {
    try {
      // Add debouncing to prevent rapid increments
      const now = Date.now();
      const lastViewTime = localStorage.getItem(`reel_view_${reel.id}`);
      if (lastViewTime && now - parseInt(lastViewTime) < 5000) {
        return; // Don't increment if viewed within last 5 seconds
      }

      await DatabaseService.updateReelViews(reel.id);
      setViewsCount(prev => prev + 1);
      localStorage.setItem(`reel_view_${reel.id}`, now.toString());
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  // Handle video metadata loading to determine aspect ratio
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const aspectRatio = video.videoWidth / video.videoHeight;
      setVideoAspectRatio(aspectRatio);
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight, 'Aspect ratio:', aspectRatio);
    }
  };

  // Enhanced tap handling for single/double tap
  const handleVideoTap = (e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    const timeDiff = now - lastTap;

    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap - like the reel
      handleLike();
    } else {
      // Single tap - toggle mute
      setIsMuted(!isMuted);
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
      }
    }
    setLastTap(now);
  };

  // Long press handling
  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      // Long press - pause video
      if (videoRef.current && isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleLike = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isLiked) {
        await DatabaseService.unlikeReel(user.id, reel.id);
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        await DatabaseService.likeReel(user.id, reel.id);
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isSaved) {
        await DatabaseService.unsaveReel(user.id, reel.id);
        setIsSaved(false);
      } else {
        await DatabaseService.saveReel(user.id, reel.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || followLoading || user.id === reel.author.id) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await DatabaseService.unfollowUser(user.id, reel.author.id);
        setIsFollowing(false);
      } else {
        await DatabaseService.followUser(user.id, reel.author.id);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (reel.prompt && reel.allow_copy_prompt) {
      try {
        await navigator.clipboard.writeText(reel.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error copying prompt:', error);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle reel click for feed integration
  const handleReelClick = () => {
    if (isInFeed) {
      navigate('/reels', { state: { startReelId: reel.id } });
    }
  };

  // Determine video display style based on aspect ratio
  const getVideoStyle = () => {
    let baseStyle = "";

    if (isInFeed) {
      baseStyle = "w-full h-full object-cover cursor-pointer";
    } else if (videoAspectRatio === null) {
      // Default while loading
      baseStyle = "w-full h-full object-cover";
    } else if (videoAspectRatio < 1) {
      // Vertical video - show full video, center it
      baseStyle = "w-full h-full object-contain";
    } else {
      // Horizontal video - crop to fill screen
      baseStyle = "w-full h-full object-cover";
    }

    return baseStyle;
  };

  // Feed mode - PostCard-style layout
  if (isInFeed) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/user/${reel.author.username}`)}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <img
                src={reel.author.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`}
                alt={reel.author.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            </button>
            <div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigate(`/user/${reel.author.username}`)}
                  className="font-semibold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  {reel.author.full_name || reel.author.username}
                </button>
                {reel.author.verified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <button
                  onClick={() => navigate(`/user/${reel.author.username}`)}
                  className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  @{reel.author.username}
                </button>
                <span> • {new Date(reel.created_at).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
              🎬 Reel
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {reel.title}
          </h2>
        </div>

        {/* Video */}
        <div className="relative cursor-pointer" onClick={handleReelClick}>
          <video
            ref={videoRef}
            src={reel.video_url}
            className="w-full h-80 object-cover"
            loop
            muted
            playsInline
            onLoadedMetadata={handleVideoLoadedMetadata}
            onError={() => {
              console.error('Video failed to load:', reel.video_url);
            }}
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play size={24} className="text-white ml-1" />
            </div>
          </div>
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-full">
              {Math.floor(viewsCount / 1000)}K views
            </span>
          </div>
        </div>

        {/* Prompt */}
        {reel.prompt && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 mx-4 mt-4 rounded-lg">
            <div className="flex items-start justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 pr-3">
                {reel.prompt}
              </p>
              {reel.allow_copy_prompt && (
                <button
                  onClick={handleCopyPrompt}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    copied
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {reel.tags && reel.tags.length > 0 && (
          <div className="px-4 mt-3">
            <div className="flex flex-wrap gap-2">
              {reel.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center space-x-2 transition-colors disabled:opacity-50 ${
                isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle size={20} />
              <span className="text-sm font-medium">{reel.comments_count}</span>
            </button>

            <button
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400"
            >
              <Eye size={20} />
              <span className="text-sm font-medium">{viewsCount}</span>
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`transition-colors disabled:opacity-50 ${
              isSaved ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
            }`}
          >
            <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Real-time Comments Section */}
        {showComments && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <RealtimeComments
              contentId={reel.id}
              contentType="reel"
              className="h-96"
            />
          </div>
        )}
      </div>
    );
  }

  // Full-screen mode - original TikTok-style layout
  return (
    <div
      className="relative w-full h-screen flex-shrink-0 bg-black overflow-hidden flex items-center justify-center"
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        className={getVideoStyle()}
        loop
        muted={isMuted}
        playsInline
        onClick={isInFeed ? undefined : handleVideoTap}
        onTouchStart={isInFeed ? undefined : handleTouchStart}
        onTouchEnd={isInFeed ? undefined : handleTouchEnd}
        onLoadedMetadata={handleVideoLoadedMetadata}
        onError={() => {
          console.error('Video failed to load:', reel.video_url);
        }}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          // Ensure high quality video rendering
          imageRendering: 'high-quality' as any
        }}
      />

      {/* Audio Control Indicator */}
      {!isInFeed && (
        <div className="absolute top-4 left-4 z-10">
          <div className={`p-2 bg-black/40 backdrop-blur-sm rounded-full transition-opacity ${isMuted ? 'opacity-60' : 'opacity-100'}`}>
            {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
          </div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <button
            onClick={togglePlay}
            className="p-4 bg-white/20 backdrop-blur-sm rounded-full"
          >
            <Play size={32} className="text-white ml-1" />
          </button>
        </div>
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30 pointer-events-none" />

      {/* Author Info - Top */}
      {!isInFeed && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/user/${reel.author.username}`)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img
                src={reel.author.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`}
                alt={reel.author.username}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
              />
              <div>
                <div className="flex items-center space-x-1">
                  <h3 className="font-bold text-white text-lg drop-shadow-lg">
                    {reel.author.username}
                  </h3>
                  {reel.author.verified && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Follow Button */}
            {user && user.id !== reel.author.id && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 disabled:opacity-50 ${
                  isFollowing
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {followLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isFollowing ? (
                  <div className="flex items-center space-x-1">
                    <UserCheck size={16} />
                    <span>Following</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <UserPlus size={16} />
                    <span>Follow</span>
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actions - Right Side */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6">
        {/* Views Count */}
        <div className="flex flex-col items-center space-y-1 text-white">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
            <Eye size={24} />
          </div>
          <span className="text-xs font-medium">{viewsCount}</span>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex flex-col items-center space-y-1 transition-transform hover:scale-110 disabled:opacity-50 ${
            isLiked ? 'text-red-500' : 'text-white'
          }`}
        >
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </div>
          <span className="text-xs font-medium text-white">{likesCount}</span>
        </button>

        {/* Comments Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-col items-center space-y-1 text-white transition-transform hover:scale-110"
        >
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
            <MessageCircle size={24} />
          </div>
          <span className="text-xs font-medium">{reel.comments_count}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex flex-col items-center space-y-1 transition-transform hover:scale-110 disabled:opacity-50 ${
            isSaved ? 'text-yellow-400' : 'text-white'
          }`}
        >
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
            <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
          </div>
          <span className="text-xs font-medium text-white">{reel.saves_count}</span>
        </button>

        {/* Copy Prompt Button */}
        {reel.allow_copy_prompt && (
          <button
            onClick={handleCopyPrompt}
            className={`flex flex-col items-center space-y-1 transition-all duration-200 hover:scale-110 ${
              copied ? 'text-green-400' : 'text-white'
            }`}
          >
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
              {copied ? <Check size={24} /> : <Copy size={24} />}
            </div>
            <span className="text-xs font-medium text-white">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        )}
      </div>

      {/* Content - Bottom Left */}
      {!isInFeed && (
        <div className="absolute bottom-20 left-4 right-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 mb-3">
            <h2 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
              {reel.title}
            </h2>

            {reel.prompt && (
              <p className="text-sm text-white/90 leading-relaxed">
                {reel.prompt}
              </p>
            )}
          </div>

          {reel.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {reel.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}



      {/* Comments Modal/Overlay */}
      {showComments && !isInFeed && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white dark:bg-gray-900 rounded-t-2xl max-h-[50vh] overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <MessageCircle size={18} className="text-gray-600 dark:text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Comments ({reel.comments_count})
                </h3>
              </div>
              <button
                onClick={() => setShowComments(false)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="bg-white dark:bg-gray-900 h-[calc(50vh-60px)]">
              <RealtimeComments
                contentId={reel.id}
                contentType="reel"
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelCard;