import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Heart, MessageCircle, MoreVertical, Pin, Edit3,
  Trash2, Reply, Smile, User, Crown, Shield, Star,
  Image, Video, Paperclip, X, Check, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CommunityDiscussionsService, CommunityMessage } from '../services/communityDiscussions';
import { RealtimeSubscription } from '../services/realtimeService';
import { debugLog, debugError } from '../utils/debug';
import LoadingSpinner from './LoadingSpinner';

interface CommunityDiscussionProps {
  communityId: string;
  communityName: string;
  userRole?: 'owner' | 'admin' | 'moderator' | 'member';
}

const CommunityDiscussion: React.FC<CommunityDiscussionProps> = ({
  communityId,
  communityName,
  userRole = 'member'
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<CommunityMessage | null>(null);
  const [editContent, setEditContent] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [realtimeSubscription, setRealtimeSubscription] = useState<RealtimeSubscription | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load community messages and initialize real-time
  useEffect(() => {
    if (!communityId) return;

    const initializeCommunityDiscussion = async () => {
      try {
        setLoading(true);

        // Load messages
        const response = await CommunityDiscussionsService.getCommunityMessages(communityId);

        if (response.success && response.data) {
          setMessages(response.data.reverse()); // Show oldest first
          debugLog('✅ Community messages loaded:', response.data.length);
        } else {
          debugError('Failed to load community messages:', response.error);
        }

        // Subscribe to real-time community messages
        const subscription = CommunityDiscussionsService.subscribeToCommunityMessages(
          communityId,
          (newMessage: CommunityMessage) => {
            debugLog('📨 Received new real-time community message:', newMessage.id);

            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          },
          (updatedMessage: CommunityMessage) => {
            debugLog('📝 Received updated real-time community message:', updatedMessage.id);

            setMessages(prev => prev.map(msg =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            ));
          },
          (deletedMessageId: string) => {
            debugLog('🗑️ Received deleted real-time community message:', deletedMessageId);

            setMessages(prev => prev.filter(msg => msg.id !== deletedMessageId));
          },
          (error: any) => {
            debugError('❌ Real-time community messaging error:', error);
          }
        );

        setRealtimeSubscription(subscription);

      } catch (error: any) {
        debugError('Error initializing community discussion:', error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeCommunityDiscussion();

    // Cleanup function
    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
      CommunityDiscussionsService.unsubscribeFromCommunityMessages(communityId);
    };
  }, [communityId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle media file selection
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only images (JPG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) are allowed.');
      return;
    }

    if (file.size > maxSize) {
      alert('File size too large. Maximum size is 50MB.');
      return;
    }

    setSelectedMedia(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
  };

  // Clear selected media
  const clearSelectedMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setSelectedMedia(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle editing message
  const handleEditMessage = (message: CommunityMessage) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  // Save edited message
  const handleSaveEdit = async () => {
    if (!editingMessage || !user || !editContent.trim()) return;

    try {
      const response = await CommunityDiscussionsService.editMessage(
        editingMessage.id,
        user.id,
        editContent.trim()
      );

      if (response.success && response.data) {
        // Update message in local state
        setMessages(prev => prev.map(msg =>
          msg.id === editingMessage.id ? response.data! : msg
        ));
        setEditingMessage(null);
        setEditContent('');
        debugLog('✅ Message edited successfully');
      } else {
        debugError('Failed to edit message:', response.error);
        alert(response.error || 'Failed to edit message');
      }
    } catch (error: any) {
      debugError('Error editing message:', error.message);
      alert('An error occurred while editing the message');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  // Handle deleting message
  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const response = await CommunityDiscussionsService.deleteMessage(
        messageId,
        user.id,
        userRole
      );

      if (response.success) {
        // Remove message from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        setShowDeleteConfirm(null);
        debugLog('✅ Message deleted successfully');
      } else {
        debugError('Failed to delete message:', response.error);
        alert(response.error || 'Failed to delete message');
      }
    } catch (error: any) {
      debugError('Error deleting message:', error.message);
      alert('An error occurred while deleting the message');
    }
  };

  // Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && !selectedMedia) || !user || sending) return;

    try {
      setSending(true);
      setUploadingMedia(!!selectedMedia);

      let fileUrl: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;
      let messageType: 'text' | 'image' | 'file' = 'text';

      // Upload media if selected
      if (selectedMedia) {
        const uploadResponse = await CommunityDiscussionsService.uploadMessageMedia(
          selectedMedia,
          communityId,
          user.id
        );

        if (uploadResponse.success && uploadResponse.data) {
          fileUrl = uploadResponse.data.url;
          fileName = uploadResponse.data.fileName;
          fileSize = uploadResponse.data.fileSize;
          messageType = selectedMedia.type.startsWith('image/') ? 'image' : 'file';
        } else {
          debugError('Failed to upload media:', uploadResponse.error);
          alert(uploadResponse.error || 'Failed to upload media');
          return;
        }
      }

      const messageContent = newMessage.trim() || (selectedMedia ? `Shared ${selectedMedia.type.startsWith('image/') ? 'an image' : 'a video'}` : '');
      setNewMessage(''); // Clear input immediately for better UX
      clearSelectedMedia(); // Clear media selection

      // Send message
      const response = await CommunityDiscussionsService.sendCommunityMessage(
        communityId,
        user.id,
        messageContent,
        messageType,
        fileUrl,
        fileName,
        fileSize,
        replyingTo?.id
      );

      if (response.success && response.data) {
        // Add message to local state immediately
        setMessages(prev => [...prev, response.data!]);
        setReplyingTo(null); // Clear reply state
        debugLog('✅ Community message sent successfully');
      } else {
        debugError('Failed to send community message:', response.error);
        setNewMessage(messageContent); // Restore message on error
        alert(response.error || 'Failed to send message');
      }

    } catch (error: any) {
      debugError('Error sending community message:', error.message);
      setNewMessage(newMessage); // Restore message on error
      alert('An error occurred while sending the message');
    } finally {
      setSending(false);
      setUploadingMedia(false);
    }
  };

  // Handle message reactions
  const handleReaction = async (messageId: string, reactionType: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      if (message.user_reaction === reactionType) {
        // Remove reaction if same type
        await CommunityDiscussionsService.removeReaction(messageId, user.id);

        // Update local state
        setMessages(prev => prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                user_reaction: undefined,
                reactions: {
                  ...m.reactions,
                  [reactionType]: Math.max(0, (m.reactions?.[reactionType] || 1) - 1)
                }
              }
            : m
        ));
      } else {
        // Add new reaction
        await CommunityDiscussionsService.addReaction(messageId, user.id, reactionType as any);

        // Update local state
        setMessages(prev => prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                user_reaction: reactionType,
                reactions: {
                  ...m.reactions,
                  [reactionType]: (m.reactions?.[reactionType] || 0) + 1,
                  // Remove old reaction count if switching
                  ...(m.user_reaction ? { [m.user_reaction]: Math.max(0, (m.reactions?.[m.user_reaction] || 1) - 1) } : {})
                }
              }
            : m
        ));
      }
    } catch (error: any) {
      debugError('Error handling reaction:', error.message);
    }
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
          {communityName} Discussion
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {messages.length} messages • Community chat
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Start the conversation
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Be the first to share something with the community!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="group">
              {/* Reply indicator */}
              {message.reply_to && (
                <div className="ml-8 mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-2 border-blue-500">
                  <div className="flex items-center space-x-2 mb-1">
                    <Reply className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Replying to @{message.reply_to.user?.username}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {message.reply_to.content}
                  </p>
                </div>
              )}

              <div className="flex items-start space-x-3">
                {/* Avatar */}
                {message.user?.avatar_url ? (
                  <img
                    src={message.user.avatar_url}
                    alt={message.user.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                )}

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {message.user?.full_name || message.user?.username}
                    </span>
                    {message.user?.verified && (
                      <span className="text-blue-500">✓</span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatMessageTime(message.created_at)}
                    </span>
                    {message.is_pinned && (
                      <Pin className="h-3 w-3 text-yellow-500" />
                    )}
                    {message.is_announcement && (
                      <Star className="h-3 w-3 text-purple-500" />
                    )}
                  </div>

                  {/* Message Content - Editable */}
                  {editingMessage?.id === message.id ? (
                    <div className="mb-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        rows={3}
                        placeholder="Edit your message..."
                      />
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                        >
                          <Check className="h-3 w-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded-lg transition-colors"
                        >
                          <X className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <p className="text-gray-900 dark:text-white text-sm">
                        {message.content}
                      </p>
                      {message.updated_at !== message.created_at && (
                        <span className="text-xs text-gray-400 italic">
                          (edited)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Media Content */}
                  {message.file_url && (
                    <div className="mb-2">
                      {message.message_type === 'image' ? (
                        <img
                          src={message.file_url}
                          alt={message.file_name || 'Shared image'}
                          className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.file_url, '_blank')}
                        />
                      ) : message.message_type === 'file' && message.file_url.includes('video') ? (
                        <video
                          src={message.file_url}
                          controls
                          className="max-w-full max-h-64 rounded-lg"
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <a
                          href={message.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {message.file_name || 'Download file'}
                          </span>
                          {message.file_size && (
                            <span className="text-xs text-gray-500">
                              ({(message.file_size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          )}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex items-center space-x-2 mb-2">
                      {Object.entries(message.reactions).map(([reaction, count]) => (
                        count > 0 && (
                          <button
                            key={reaction}
                            onClick={() => handleReaction(message.id, reaction)}
                            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                              message.user_reaction === reaction
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <span>{reaction === 'like' ? '👍' : reaction === 'love' ? '❤️' : reaction === 'laugh' ? '😂' : reaction === 'wow' ? '😮' : reaction === 'sad' ? '😢' : '😠'}</span>
                            <span>{count}</span>
                          </button>
                        )
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleReaction(message.id, 'like')}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Heart className="h-3 w-3" />
                      <span>Like</span>
                    </button>
                    <button
                      onClick={() => setReplyingTo(message)}
                      className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Reply className="h-3 w-3" />
                      <span>Reply</span>
                    </button>

                    {/* Edit button - only for message author */}
                    {message.user_id === user?.id && editingMessage?.id !== message.id && (
                      <button
                        onClick={() => handleEditMessage(message)}
                        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Delete button - for message author or moderators */}
                    {(message.user_id === user?.id || ['owner', 'admin', 'moderator'].includes(userRole)) && (
                      <>
                        {showDeleteConfirm === message.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="flex items-center space-x-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>Confirm</span>
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded transition-colors"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(message.id)}
                            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Replying to @{replyingTo.user?.username}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
            {replyingTo.content}
          </p>
        </div>
      )}

      {/* Media Preview */}
      {selectedMedia && mediaPreview && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Selected: {selectedMedia.name}
            </span>
            <button
              onClick={clearSelectedMedia}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-w-xs">
            {selectedMedia.type.startsWith('image/') ? (
              <img
                src={mediaPreview}
                alt="Preview"
                className="max-h-32 rounded-lg object-cover"
              />
            ) : (
              <video
                src={mediaPreview}
                className="max-h-32 rounded-lg"
                controls
                muted
              />
            )}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex items-center space-x-3">
            {/* Media Upload Buttons */}
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploadingMedia}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload image or video"
              >
                <Image className="h-5 w-5" />
              </button>
            </div>

            {/* Text Input */}
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  replyingTo
                    ? `Reply to @${replyingTo.user?.username}...`
                    : selectedMedia
                      ? "Add a caption (optional)..."
                      : "Type a message..."
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={sending || uploadingMedia}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedMedia) || sending || uploadingMedia}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {sending || uploadingMedia ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Upload Status */}
          {uploadingMedia && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
              <span>Uploading media...</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CommunityDiscussion;