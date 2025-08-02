import React, { useState, useEffect, useRef } from 'react';
import {
  Send, ArrowLeft, Search, MoreVertical, Phone, Video,
  User, Check, CheckCheck, Clock, Reply, Smile, Paperclip
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MessagingService, Conversation, Message } from '../services/messaging';
import { RealtimeSubscription } from '../services/realtimeService';
import { debugLog, debugError } from '../utils/debug';
import LoadingSpinner from './LoadingSpinner';

interface DirectMessagesProps {
  className?: string;
}

const DirectMessages: React.FC<DirectMessagesProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showConversationList, setShowConversationList] = useState(true);
  const [realtimeSubscription, setRealtimeSubscription] = useState<RealtimeSubscription | null>(null);
  const [conversationSubscription, setConversationSubscription] = useState<RealtimeSubscription | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowConversationList(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize real-time messaging and load conversations
  useEffect(() => {
    if (!user) return;

    const initializeMessaging = async () => {
      try {
        setLoading(true);

        // Initialize real-time messaging
        await MessagingService.initializeRealtime(user.id);

        // Load conversations
        const response = await MessagingService.getConversations(user.id);

        if (response.success && response.data) {
          setConversations(response.data);
          debugLog('✅ Conversations loaded:', response.data.length);
        } else {
          debugError('Failed to load conversations:', response.error);
        }

        // Subscribe to real-time direct messages
        const messageSubscription = MessagingService.subscribeToDirectMessages(
          user.id,
          (newMessage: Message) => {
            debugLog('📨 Received new real-time message:', newMessage.id);

            // Add message to the current conversation if it's selected
            if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
              setMessages(prev => {
                // Check if message already exists to avoid duplicates
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
              });
            }

            // Update conversation list with new message
            setConversations(prev => prev.map(conv => {
              if (conv.id === newMessage.conversation_id) {
                return {
                  ...conv,
                  last_message: newMessage,
                  last_message_at: newMessage.created_at,
                  // Increment unread count if not the sender
                  participant_1_unread_count: conv.participant_1 === user.id && newMessage.sender_id !== user.id
                    ? conv.participant_1_unread_count + 1
                    : conv.participant_1_unread_count,
                  participant_2_unread_count: conv.participant_2 === user.id && newMessage.sender_id !== user.id
                    ? conv.participant_2_unread_count + 1
                    : conv.participant_2_unread_count
                };
              }
              return conv;
            }));
          },
          (updatedMessage: Message) => {
            debugLog('📝 Received updated real-time message:', updatedMessage.id);

            // Update message in current conversation if it's selected
            if (selectedConversation && updatedMessage.conversation_id === selectedConversation.id) {
              setMessages(prev => prev.map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              ));
            }
          },
          (deletedMessageId: string) => {
            debugLog('🗑️ Received deleted real-time message:', deletedMessageId);

            // Remove message from current conversation
            setMessages(prev => prev.filter(msg => msg.id !== deletedMessageId));
          },
          (error: any) => {
            debugError('❌ Real-time messaging error:', error);
          }
        );

        setRealtimeSubscription(messageSubscription);

        // Subscribe to conversation updates
        const convSubscription = MessagingService.subscribeToConversationUpdates(
          user.id,
          (updatedConversation: any) => {
            debugLog('📝 Received conversation update:', updatedConversation.id);

            setConversations(prev => prev.map(conv =>
              conv.id === updatedConversation.id
                ? { ...conv, ...updatedConversation }
                : conv
            ));
          }
        );

        setConversationSubscription(convSubscription);

      } catch (error: any) {
        debugError('Error initializing messaging:', error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeMessaging();

    // Cleanup function
    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
      if (conversationSubscription) {
        conversationSubscription.unsubscribe();
      }
      if (user) {
        MessagingService.unsubscribeFromRealtime(user.id);
      }
    };
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      try {
        setMessagesLoading(true);
        const response = await MessagingService.getMessages(selectedConversation.id);

        if (response.success && response.data) {
          setMessages(response.data);
          debugLog('✅ Messages loaded:', response.data.length);
        } else {
          debugError('Failed to load messages:', response.error);
        }
      } catch (error: any) {
        debugError('Error loading messages:', error.message);
      } finally {
        setMessagesLoading(false);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowConversationList(false);
    }
  };

  // Handle back to conversations (mobile)
  const handleBackToConversations = () => {
    setSelectedConversation(null);
    setShowConversationList(true);
    setReplyingTo(null);
  };

  // Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || !selectedConversation || sending) return;

    try {
      setSending(true);
      const messageContent = newMessage.trim();
      setNewMessage(''); // Clear input immediately

      const response = await MessagingService.sendMessage(
        selectedConversation.id,
        user.id,
        messageContent,
        'text',
        undefined,
        undefined,
        undefined,
        replyingTo?.id
      );

      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!]);
        setReplyingTo(null);
        debugLog('✅ Message sent successfully');
      } else {
        debugError('Failed to send message:', response.error);
        setNewMessage(messageContent); // Restore message on error
        alert(response.error || 'Failed to send message');
      }

    } catch (error: any) {
      debugError('Error sending message:', error.message);
      setNewMessage(newMessage); // Restore message on error
      alert('An error occurred while sending the message');
    } finally {
      setSending(false);
    }
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Get message status icon
  const getMessageStatusIcon = (message: Message) => {
    if (message.sender_id !== user?.id) return null;

    switch (message.status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherParticipant = conv.other_participant;
    return otherParticipant?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherParticipant?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex ${className}`}>
      {/* Conversations List */}
      <div className={`${
        isMobile
          ? (showConversationList ? 'w-full' : 'hidden')
          : 'w-1/3 border-r border-gray-200 dark:border-gray-700'
      } flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Messages
          </h2>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start a conversation with someone you follow!
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  {conversation.other_participant?.avatar_url ? (
                    <img
                      src={conversation.other_participant.avatar_url}
                      alt={conversation.other_participant.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {conversation.other_participant?.full_name || conversation.other_participant?.username}
                      </span>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatMessageTime(conversation.last_message_at)}
                        </span>
                      )}
                    </div>

                    {conversation.last_message && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>

                  {/* Unread Count */}
                  {((user?.id === conversation.participant_1 && conversation.participant_1_unread_count > 0) ||
                    (user?.id === conversation.participant_2 && conversation.participant_2_unread_count > 0)) && (
                    <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {user?.id === conversation.participant_1
                        ? conversation.participant_1_unread_count
                        : conversation.participant_2_unread_count}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className={`${
        isMobile
          ? (showConversationList ? 'hidden' : 'w-full')
          : 'flex-1'
      } flex flex-col`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Back Button (Mobile) */}
                {isMobile && (
                  <button
                    onClick={handleBackToConversations}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                )}

                {/* Avatar */}
                {selectedConversation.other_participant?.avatar_url ? (
                  <img
                    src={selectedConversation.other_participant.avatar_url}
                    alt={selectedConversation.other_participant.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                )}

                {/* User Info */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {selectedConversation.other_participant?.full_name || selectedConversation.other_participant?.username}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{selectedConversation.other_participant?.username}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Video className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center items-center h-32">
                  <LoadingSpinner />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Start the conversation
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Send a message to {selectedConversation.other_participant?.username}
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                      {/* Reply indicator */}
                      {message.reply_to && (
                        <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-2 border-blue-500">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Replying to {message.reply_to.sender?.username}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {message.reply_to.content}
                          </p>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`px-4 py-2 rounded-2xl ${
                        message.sender_id === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>

                      {/* Message Info */}
                      <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{formatMessageTime(message.created_at)}</span>
                        {getMessageStatusIcon(message)}
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
                      Replying to {replyingTo.sender?.username}
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

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Paperclip className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>

                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={replyingTo ? `Reply to ${replyingTo.sender?.username}...` : "Type a message..."}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={sending}
                  />
                </div>

                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Smile className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>

                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full transition-colors disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessages;