import React, { useState, useEffect } from 'react';
import { Send, Heart, Reply, MoreHorizontal, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Comment } from '../types';

interface CommentsProps {
  postId?: string;
  reelId?: string;
  className?: string;
}

const Comments: React.FC<CommentsProps> = ({ postId, reelId, className = '' }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (postId || reelId) {
      loadComments();
    }
  }, [postId, reelId]);

  const loadComments = async () => {
    setLoading(true);
    setError('');
    try {
      const commentsData = await DatabaseService.getComments(postId, reelId);
      setComments(commentsData);

      // Check which comments are liked by the current user
      if (user && commentsData.length > 0) {
        const likedStatus = new Set<string>();
        await Promise.all(
          commentsData.map(async (comment) => {
            try {
              const isLiked = await DatabaseService.isCommentLiked(user.id, comment.id);
              if (isLiked) {
                likedStatus.add(comment.id);
              }
              // Check replies too
              if (comment.replies) {
                await Promise.all(
                  comment.replies.map(async (reply) => {
                    const isReplyLiked = await DatabaseService.isCommentLiked(user.id, reply.id);
                    if (isReplyLiked) {
                      likedStatus.add(reply.id);
                    }
                  })
                );
              }
            } catch (error) {
              console.error('Error checking comment like status:', error);
            }
          })
        );
        setLikedComments(likedStatus);
      }
    } catch (error: any) {
      console.error('Error loading comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const commentData = {
        user_id: user.id,
        post_id: postId || null,
        reel_id: reelId || null,
        content: newComment.trim(),
        parent_id: null
      };

      const createdComment = await DatabaseService.createComment(commentData);
      setComments(prev => [createdComment, ...prev]);
      setNewComment('');
    } catch (error: any) {
      console.error('Error creating comment:', error);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyText.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const replyData = {
        user_id: user.id,
        post_id: postId || null,
        reel_id: reelId || null,
        content: replyText.trim(),
        parent_id: parentId
      };

      const createdReply = await DatabaseService.createComment(replyData);
      
      // Add reply to the parent comment
      setComments(prev => prev.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...(comment.replies || []), createdReply] }
          : comment
      ));
      
      setReplyText('');
      setReplyingTo(null);
    } catch (error: any) {
      console.error('Error creating reply:', error);
      setError('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user || likingComments.has(commentId)) return;

    setLikingComments(prev => new Set(prev).add(commentId));

    try {
      const isCurrentlyLiked = likedComments.has(commentId);

      if (isCurrentlyLiked) {
        await DatabaseService.unlikeComment(user.id, commentId);
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
        // Update local comment likes count
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, likes_count: (comment.likes_count || 0) - 1 };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? { ...reply, likes_count: (reply.likes_count || 0) - 1 }
                  : reply
              )
            };
          }
          return comment;
        }));
      } else {
        await DatabaseService.likeComment(user.id, commentId);
        setLikedComments(prev => new Set(prev).add(commentId));
        // Update local comment likes count
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, likes_count: (comment.likes_count || 0) + 1 };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? { ...reply, likes_count: (reply.likes_count || 0) + 1 }
                  : reply
              )
            };
          }
          return comment;
        }));
      }
    } catch (error: any) {
      console.error('Error toggling comment like:', error);
      setError('Failed to like comment');
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const CommentItem: React.FC<{ comment: Comment; isReply?: boolean }> = ({ comment, isReply = false }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {comment.author?.avatar_url ? (
              <img 
                src={comment.author.avatar_url} 
                alt={comment.author.username} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-sm font-medium">
                {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.author?.username || 'Unknown User'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(comment.created_at)}
            </span>
          </div>
          
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {comment.content}
          </p>
          
          <div className="mt-2 flex items-center space-x-4">
            <button
              onClick={() => handleLikeComment(comment.id)}
              disabled={likingComments.has(comment.id)}
              className={`flex items-center space-x-1 text-xs transition-colors disabled:opacity-50 ${
                likedComments.has(comment.id)
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart size={14} fill={likedComments.has(comment.id) ? 'currentColor' : 'none'} />
              <span>{comment.likes_count || 0}</span>
            </button>
            
            {!isReply && (
              <button 
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Reply size={14} />
                <span>Reply</span>
              </button>
            )}
          </div>
          
          {/* Reply Form */}
          {replyingTo === comment.id && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitReply(comment.id);
              }}
              className="mt-3"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.username} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {profile?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={submitting}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No comments yet. Be the first to comment!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;
