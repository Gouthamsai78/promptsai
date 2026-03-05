import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Post } from '../types';
import RealtimeComments from './RealtimeComments';

interface PostCardProps {
  post: Post;
  onView?: () => void;
  onLikeChange?: (liked: boolean) => void;
  onSaveChange?: (saved: boolean) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onView, onLikeChange, onSaveChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (user) {
      checkInteractionStatus();
    }
    // Track view for recommendations
    onView?.();
  }, [user, post.id]);

  const checkInteractionStatus = async () => {
    if (!user) return;

    try {
      const [liked, saved] = await Promise.all([
        DatabaseService.isPostLiked(user.id, post.id),
        DatabaseService.isPostSaved(user.id, post.id),
      ]);

      setIsLiked(liked);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking interaction status:', error);
    }
  };

  const handleLike = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isLiked) {
        await DatabaseService.unlikePost(user.id, post.id);
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
        onLikeChange?.(false);
      } else {
        await DatabaseService.likePost(user.id, post.id);
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        onLikeChange?.(true);
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
        await DatabaseService.unsavePost(user.id, post.id);
        setIsSaved(false);
        onSaveChange?.(false);
      } else {
        await DatabaseService.savePost(user.id, post.id);
        setIsSaved(true);
        onSaveChange?.(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (post.prompt && post.allow_copy_prompt) {
      try {
        await navigator.clipboard.writeText(post.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error copying prompt:', error);
      }
    }
  };

  const nextImage = () => {
    if (post.media_type === 'carousel' && post.media_urls.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % post.media_urls.length);
    }
  };

  const prevImage = () => {
    if (post.media_type === 'carousel' && post.media_urls.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + post.media_urls.length) % post.media_urls.length);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden group">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/user/${post.author.username}`)}
            className="flex-shrink-0 hover:scale-105 transition-transform duration-300 ring-2 ring-transparent hover:ring-blue-500/50 rounded-full"
          >
            <img
              src={post.author.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100`}
              alt={post.author.username}
              className="w-10 h-10 rounded-full object-cover shadow-md"
            />
          </button>
          <div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigate(`/user/${post.author.username}`)}
                className="text-[17px] font-black font-outfit text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors tracking-tight"
              >
                {post.author.full_name || post.author.username}
              </button>
              {post.author.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </div>
              )}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              <button
                onClick={() => navigate(`/user/${post.author.username}`)}
                className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                @{post.author.username}
              </button>
              <span> • {new Date(post.created_at).toLocaleDateString()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h2 className="text-2xl font-black font-outfit text-gray-900 dark:text-white mb-2 tracking-tight leading-tight">
          {post.title}
        </h2>
        {post.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            {post.description}
          </p>
        )}
      </div>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="relative overflow-hidden group">
          {post.media_type === 'image' && (
            <div className="w-full max-w-full overflow-hidden bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <img
                src={post.media_urls[0]}
                alt={post.title}
                className="w-full h-auto object-contain max-h-[80vh] group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                style={{
                  imageRendering: '-webkit-optimize-contrast' as any
                }}
                onError={(e) => {
                  // Fallback to a placeholder image if the original fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800';
                }}
              />
            </div>
          )}

          {post.media_type === 'video' && (
            <div className="w-full max-w-full overflow-hidden bg-black">
              <video
                src={post.media_urls[0]}
                controls
                className="w-full h-auto object-contain max-h-[80vh]"
                preload="metadata"
                onError={() => {
                  console.error('Video failed to load:', post.media_urls[0]);
                }}
              />
            </div>
          )}

          {post.media_type === 'carousel' && (
            <div className="relative w-full max-w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={post.media_urls[currentImageIndex]}
                alt={`${post.title} ${currentImageIndex + 1}`}
                className="w-full h-auto object-contain max-h-[80vh]"
                style={{
                  imageRendering: '-webkit-optimize-contrast' as any
                }}
                onError={(e) => {
                  // Fallback to a placeholder image if the original fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800';
                }}
              />

              {post.media_urls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                    {post.media_urls.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prompt */}
      {post.prompt && (
        <div className="mx-4 mt-4 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200/30 dark:border-gray-700/30 shadow-inner group-hover:bg-gray-50/80 dark:group-hover:bg-gray-900/80 transition-all duration-500">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 leading-relaxed font-inter">
              {post.prompt}
            </p>
            {post.allow_copy_prompt && (
              <button
                onClick={handleCopyPrompt}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm border ${copied
                  ? 'bg-green-500 text-white border-green-600'
                  : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-gray-200/50 dark:border-gray-700/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10'
                  }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="px-4 mt-4">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/10 rounded-lg hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center space-x-2 transition-all duration-300 hover:scale-110 active:scale-90 disabled:opacity-50 ${isLiked ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
              }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110 active:scale-90"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{post.comments_count}</span>
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`transition-all duration-300 hover:scale-110 active:scale-90 disabled:opacity-50 ${isSaved ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
            }`}
        >
          <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Real-time Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <RealtimeComments
            contentId={post.id}
            contentType="post"
            className="h-96"
          />
        </div>
      )}
    </div>
  );
};

export default PostCard;