import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, MoreHorizontal, User } from 'lucide-react';
import { RealtimeService } from '../services/realtime';
import { LiveComment, CommentUpdate, TypingIndicator } from '../types/ai';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { debugLog } from '../utils/debug';

interface RealtimeCommentsProps {
  contentId: string;
  contentType: 'post' | 'reel';
  initialComments?: LiveComment[];
  className?: string;
}

const RealtimeComments: React.FC<RealtimeCommentsProps> = ({
  contentId,
  contentType,
  initialComments = [],
  className = ''
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<LiveComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Initialize real-time subscriptions
  useEffect(() => {
    if (user?.id) {
      initializeRealtime();
    }

    return () => {
      RealtimeService.unsubscribeFromComments(contentId, contentType);
    };
  }, [contentId, contentType, user?.id]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const initializeRealtime = async () => {
    if (!user?.id) return;

    try {
      // Subscribe to comments for this content
      await RealtimeService.subscribeToComments(contentId, contentType);
      setIsConnected(true);

      // Subscribe to comment updates
      const unsubscribeComments = RealtimeService.onComment((update) => {
        handleCommentUpdate(update);
      });

      // Subscribe to typing indicators
      const unsubscribeTyping = RealtimeService.onTyping((typing) => {
        handleTypingUpdate(typing);
      });

      debugLog('✅ Real-time comments initialized for:', contentId);

      return () => {
        unsubscribeComments();
        unsubscribeTyping();
      };
    } catch (error: any) {
      debugLog('❌ Failed to initialize real-time comments:', error.message);
      setIsConnected(false);
    }
  };

  // Handle comment updates
  const handleCommentUpdate = (update: CommentUpdate) => {
    debugLog('💬 Comment update received:', update);

    const isRelevant = 
      (contentType === 'post' && update.postId === contentId) ||
      (contentType === 'reel' && update.reelId === contentId);

    if (!isRelevant) return;

    switch (update.type) {
      case 'INSERT':
        // Add new comment (avoid duplicates)
        setComments(prev => {
          const exists = prev.some(c => c.id === update.comment.id);
          if (exists) return prev;
          return [...prev, update.comment];
        });
        break;

      case 'UPDATE':
        // Update existing comment
        setComments(prev =>
          prev.map(c => c.id === update.comment.id ? update.comment : c)
        );
        break;

      case 'DELETE':
        // Remove deleted comment
        setComments(prev =>
          prev.filter(c => c.id !== update.comment.id)
        );
        break;
    }
  };

  // Handle typing indicators
  const handleTypingUpdate = (typing: TypingIndicator) => {
    const isRelevant = 
      (contentType === 'post' && typing.postId === contentId) ||
      (contentType === 'reel' && typing.reelId === contentId);

    if (!isRelevant || typing.userId === user?.id) return;

    // Add or update typing indicator
    setTypingUsers(prev => {
      const filtered = prev.filter(t => t.userId !== typing.userId);
      return [...filtered, typing];
    });

    // Remove typing indicator after 3 seconds
    setTimeout(() => {
      setTypingUsers(prev => prev.filter(t => t.userId !== typing.userId));
    }, 3000);
  };

  // Handle typing in comment input
  const handleCommentChange = (value: string) => {
    setNewComment(value);

    // Send typing indicator
    if (value.trim() && user?.id) {
      RealtimeService.sendTypingIndicator(contentId, contentType);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Clear typing indicator after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        RealtimeService.clearTypingIndicator();
      }, 2000);
    }
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user?.id || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Create optimistic comment
      const optimisticComment: LiveComment = {
        id: `temp-${Date.now()}`,
        content: newComment.trim(),
        userId: user.id,
        username: user.username || 'You',
        avatar: user.avatar_url,
        postId: contentType === 'post' ? contentId : undefined,
        reelId: contentType === 'reel' ? contentId : undefined,
        parentId: undefined,
        likesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
        isOptimistic: true
      };

      // Add optimistic comment immediately
      setComments(prev => [...prev, optimisticComment]);
      setNewComment('');
      
      // Clear typing indicator
      RealtimeService.clearTypingIndicator();

      // Submit to database
      const commentData = {
        user_id: user.id,
        content: newComment.trim(),
        post_id: contentType === 'post' ? contentId : null,
        reel_id: contentType === 'reel' ? contentId : null,
        parent_id: null
      };

      const savedComment = await DatabaseService.createComment(commentData);

      // Replace optimistic comment with real one
      setComments(prev =>
        prev.map(c => 
          c.id === optimisticComment.id 
            ? { ...savedComment, username: user.username || 'You', avatar: user.avatar_url }
            : c
        )
      );

      debugLog('✅ Comment submitted successfully');
    } catch (error: any) {
      debugLog('❌ Failed to submit comment:', error.message);
      
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => !c.isOptimistic));
      
      // Restore comment text
      setNewComment(newComment);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Like comment
  const handleLikeComment = async (commentId: string) => {
    if (!user?.id) return;

    try {
      // Optimistic update
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            const isLiked = c.isLiked;
            return {
              ...c,
              isLiked: !isLiked,
              likesCount: isLiked ? c.likesCount - 1 : c.likesCount + 1
            };
          }
          return c;
        })
      );

      // Submit to database
      const comment = comments.find(c => c.id === commentId);
      if (comment?.isLiked) {
        await DatabaseService.unlikeComment(user.id, commentId);
      } else {
        await DatabaseService.likeComment(user.id, commentId);
      }
    } catch (error: any) {
      debugLog('❌ Failed to like comment:', error.message);
      
      // Revert optimistic update
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            const isLiked = c.isLiked;
            return {
              ...c,
              isLiked: !isLiked,
              likesCount: isLiked ? c.likesCount + 1 : c.likesCount - 1
            };
          }
          return c;
        })
      );
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex space-x-3 ${comment.isOptimistic ? 'opacity-70' : ''}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.avatar ? (
                    <img
                      src={comment.avatar}
                      alt={comment.username}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.username}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>

                  {/* Comment Actions */}
                  <div className="flex items-center space-x-4 mt-2">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center space-x-1 text-xs transition-colors ${
                        comment.isLiked
                          ? 'text-red-500'
                          : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likesCount}</span>
                    </button>
                    <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>
                  {typingUsers.length === 1
                    ? `${typingUsers[0].username} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              </div>
            )}

            <div ref={commentsEndRef} />
          </>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmitComment} className="flex space-x-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Your avatar"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="flex-shrink-0 p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {/* Connection Status */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isConnected ? 'Live comments' : 'Offline'}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RealtimeComments;
