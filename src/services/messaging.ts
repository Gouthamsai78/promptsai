import { supabase } from '../lib/supabase';
import { supabaseWithRetry } from '../utils/supabaseWrapper';
import { supabaseWithAutoRetry } from '../utils/apiInterceptor';
import { RealtimeService, RealtimeSubscription, MessageEventHandler } from './realtimeService';
import { debugLog, debugError } from '../utils/debug';

// Types for messaging system
export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_id?: string;
  last_message_at: string;
  participant_1_unread_count: number;
  participant_2_unread_count: number;
  created_at: string;
  updated_at: string;
  // Populated fields
  other_participant?: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    verified: boolean;
  };
  last_message?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  status: 'sent' | 'delivered' | 'read';
  reply_to_id?: string;
  created_at: string;
  updated_at: string;
  // Populated fields
  sender?: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    verified: boolean;
  };
  reply_to?: Message;
  read_by?: string[]; // User IDs who have read this message
}

export interface MessageTyping {
  id: string;
  conversation_id: string;
  user_id: string;
  username?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface MessagingServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class MessagingService {
  private static realtimeSubscriptions = new Map<string, RealtimeSubscription>();

  /**
   * Initialize real-time messaging for a user
   */
  static async initializeRealtime(userId: string): Promise<void> {
    try {
      await RealtimeService.initialize();
      debugLog('✅ Real-time messaging initialized for user:', userId);
    } catch (error: any) {
      debugError('❌ Failed to initialize real-time messaging:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time direct messages for a user
   */
  static subscribeToDirectMessages(
    userId: string,
    onNewMessage: (message: Message) => void,
    onMessageUpdate: (message: Message) => void,
    onMessageDelete: (messageId: string) => void,
    onError?: (error: any) => void
  ): RealtimeSubscription {
    const handlers: MessageEventHandler = {
      onInsert: (realtimeMessage) => {
        // Convert RealtimeMessage to Message format
        const message: Message = {
          id: realtimeMessage.id,
          conversation_id: realtimeMessage.conversation_id!,
          sender_id: realtimeMessage.sender_id,
          content: realtimeMessage.content,
          message_type: realtimeMessage.message_type as 'text' | 'image' | 'file',
          file_url: realtimeMessage.file_url,
          file_name: realtimeMessage.file_name,
          file_size: realtimeMessage.file_size,
          status: 'delivered',
          reply_to_id: undefined,
          created_at: realtimeMessage.created_at,
          updated_at: realtimeMessage.updated_at,
          sender: realtimeMessage.sender
        };
        onNewMessage(message);
      },
      onUpdate: (realtimeMessage) => {
        const message: Message = {
          id: realtimeMessage.id,
          conversation_id: realtimeMessage.conversation_id!,
          sender_id: realtimeMessage.sender_id,
          content: realtimeMessage.content,
          message_type: realtimeMessage.message_type as 'text' | 'image' | 'file',
          file_url: realtimeMessage.file_url,
          file_name: realtimeMessage.file_name,
          file_size: realtimeMessage.file_size,
          status: 'delivered',
          reply_to_id: undefined,
          created_at: realtimeMessage.created_at,
          updated_at: realtimeMessage.updated_at,
          sender: realtimeMessage.sender
        };
        onMessageUpdate(message);
      },
      onDelete: onMessageDelete,
      onError: onError
    };

    const subscription = RealtimeService.subscribeToDirectMessages(userId, handlers);
    this.realtimeSubscriptions.set(`direct_messages_${userId}`, subscription);

    return subscription;
  }

  /**
   * Subscribe to conversation updates (for updating last message, unread counts, etc.)
   */
  static subscribeToConversationUpdates(
    userId: string,
    onConversationUpdate: (conversation: any) => void
  ): RealtimeSubscription {
    const subscription = RealtimeService.subscribeToConversationUpdates(userId, onConversationUpdate);
    this.realtimeSubscriptions.set(`conversation_updates_${userId}`, subscription);

    return subscription;
  }

  /**
   * Unsubscribe from real-time updates for a user
   */
  static unsubscribeFromRealtime(userId: string): void {
    const directMessagesKey = `direct_messages_${userId}`;
    const conversationUpdatesKey = `conversation_updates_${userId}`;

    const directMessagesSubscription = this.realtimeSubscriptions.get(directMessagesKey);
    if (directMessagesSubscription) {
      directMessagesSubscription.unsubscribe();
      this.realtimeSubscriptions.delete(directMessagesKey);
    }

    const conversationUpdatesSubscription = this.realtimeSubscriptions.get(conversationUpdatesKey);
    if (conversationUpdatesSubscription) {
      conversationUpdatesSubscription.unsubscribe();
      this.realtimeSubscriptions.delete(conversationUpdatesKey);
    }

    debugLog('🔌 Unsubscribed from real-time messaging for user:', userId);
  }

  /**
   * Cleanup all real-time subscriptions
   */
  static cleanupRealtime(): void {
    this.realtimeSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.realtimeSubscriptions.clear();
    debugLog('🔌 Cleaned up all messaging real-time subscriptions');
  }
  /**
   * Get user's conversations
   */
  static async getConversations(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MessagingServiceResponse<Conversation[]>> {
    try {
      debugLog('💬 Fetching conversations for user:', userId);

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1_profile:profiles!conversations_participant_1_fkey (
            id, username, full_name, avatar_url, verified
          ),
          participant_2_profile:profiles!conversations_participant_2_fkey (
            id, username, full_name, avatar_url, verified
          ),
          last_message:messages!conversations_last_message_id_fkey (
            id, content, sender_id, created_at
          )
        `)
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      // Process conversations to add other_participant field
      const conversations: Conversation[] = data.map((conv: any) => {
        const otherParticipant = conv.participant_1 === userId
          ? conv.participant_2_profile
          : conv.participant_1_profile;

        return {
          ...conv,
          other_participant: otherParticipant,
          last_message: conv.last_message
        };
      });

      debugLog('✅ Conversations fetched successfully:', conversations.length);
      return { success: true, data: conversations };

    } catch (error: any) {
      debugError('❌ Error fetching conversations:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get or create a conversation between two users
   */
  static async getOrCreateConversation(
    userId: string,
    otherUserId: string
  ): Promise<MessagingServiceResponse<Conversation>> {
    try {
      debugLog('💬 Getting/creating conversation between:', { userId, otherUserId });

      // Use the database function to get or create conversation
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: userId,
        user2_id: otherUserId
      });

      if (error) {
        throw new Error(`Failed to get/create conversation: ${error.message}`);
      }

      // Fetch the full conversation data
      const conversationId = data;
      const conversationResponse = await this.getConversationById(conversationId, userId);

      if (!conversationResponse.success || !conversationResponse.data) {
        throw new Error('Failed to fetch created conversation');
      }

      debugLog('✅ Conversation retrieved/created successfully:', conversationId);
      return { success: true, data: conversationResponse.data };

    } catch (error: any) {
      debugError('❌ Error getting/creating conversation:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a specific conversation by ID
   */
  static async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<MessagingServiceResponse<Conversation>> {
    try {
      debugLog('💬 Fetching conversation:', conversationId);

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant_1_profile:profiles!conversations_participant_1_fkey (
            id, username, full_name, avatar_url, verified
          ),
          participant_2_profile:profiles!conversations_participant_2_fkey (
            id, username, full_name, avatar_url, verified
          ),
          last_message:messages!conversations_last_message_id_fkey (
            id, content, sender_id, created_at
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch conversation: ${error.message}`);
      }

      // Process conversation to add other_participant field
      const otherParticipant = data.participant_1 === userId
        ? data.participant_2_profile
        : data.participant_1_profile;

      const conversation: Conversation = {
        ...data,
        other_participant: otherParticipant,
        last_message: data.last_message
      };

      debugLog('✅ Conversation fetched successfully:', conversationId);
      return { success: true, data: conversation };

    } catch (error: any) {
      debugError('❌ Error fetching conversation:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get messages in a conversation
   */
  static async getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessagingServiceResponse<Message[]>> {
    try {
      debugLog('💬 Fetching messages for conversation:', conversationId);

      // Get messages with sender info (avoid self-referencing in select)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id, username, full_name, avatar_url, verified
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      // Process messages to add reply info
      const messages: Message[] = await Promise.all(
        data.reverse().map(async (msg: any) => {
          // Get reply-to message info if exists
          let replyToMessage = null;
          if (msg.reply_to_id) {
            const { data: replyData } = await supabase
              .from('messages')
              .select(`
                id, content, sender_id, created_at,
                sender:profiles!messages_sender_id_fkey (
                  id, username, full_name, avatar_url, verified
                )
              `)
              .eq('id', msg.reply_to_id)
              .single();

            if (replyData) {
              replyToMessage = {
                ...replyData,
                sender: replyData.sender
              };
            }
          }

          return {
            ...msg,
            sender: msg.sender,
            reply_to: replyToMessage
          };
        })
      );

      debugLog('✅ Messages fetched successfully:', messages.length);
      return { success: true, data: messages };

    } catch (error: any) {
      debugError('❌ Error fetching messages:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    replyToId?: string
  ): Promise<MessagingServiceResponse<Message>> {
    try {
      debugLog('💬 Sending message to conversation:', conversationId);

      const messageData = {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        reply_to_id: replyToId
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id, username, full_name, avatar_url, verified
          ),
          reply_to:messages!messages_reply_to_id_fkey (
            id, content, sender_id, created_at
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }

      const message: Message = {
        ...data,
        sender: data.sender,
        reply_to: data.reply_to
      };

      debugLog('✅ Message sent successfully:', message.id);
      return { success: true, data: message };

    } catch (error: any) {
      debugError('❌ Error sending message:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<MessagingServiceResponse<void>> {
    try {
      debugLog('💬 Marking messages as read:', { conversationId, userId });

      const { error } = await supabase.rpc('mark_messages_as_read', {
        conv_id: conversationId,
        user_id: userId
      });

      if (error) {
        throw new Error(`Failed to mark messages as read: ${error.message}`);
      }

      debugLog('✅ Messages marked as read successfully');
      return { success: true };

    } catch (error: any) {
      debugError('❌ Error marking messages as read:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send typing indicator
   */
  static async sendTypingIndicator(
    conversationId: string,
    userId: string,
    username?: string,
    avatar?: string
  ): Promise<MessagingServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('message_typing')
        .upsert({
          conversation_id: conversationId,
          user_id: userId,
          username,
          avatar,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to send typing indicator: ${error.message}`);
      }

      return { success: true };

    } catch (error: any) {
      debugError('❌ Error sending typing indicator:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove typing indicator
   */
  static async removeTypingIndicator(
    conversationId: string,
    userId: string
  ): Promise<MessagingServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('message_typing')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove typing indicator: ${error.message}`);
      }

      return { success: true };

    } catch (error: any) {
      debugError('❌ Error removing typing indicator:', error.message);
      return { success: false, error: error.message };
    }
  }
}