import { supabase } from '../lib/supabase';
import { supabaseWithRetry } from '../utils/supabaseWrapper';
import { RealtimeService, RealtimeSubscription, MessageEventHandler } from './realtimeService';
import { debugLog, debugError } from '../utils/debug';

// Types for community discussions
export interface CommunityMessage {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'announcement';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_id?: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  updated_at: string;
  // Populated fields
  user?: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    verified: boolean;
  };
  reply_to?: CommunityMessage;
  reactions?: { [key: string]: number };
  user_reaction?: string;
  reply_count?: number;
}

export interface CommunityMessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  created_at: string;
}

export interface CommunityDiscussionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class CommunityDiscussionsService {
  private static realtimeSubscriptions = new Map<string, RealtimeSubscription>();

  /**
   * Subscribe to real-time community messages
   */
  static subscribeToCommunityMessages(
    communityId: string,
    onNewMessage: (message: CommunityMessage) => void,
    onMessageUpdate: (message: CommunityMessage) => void,
    onMessageDelete: (messageId: string) => void,
    onError?: (error: any) => void
  ): RealtimeSubscription {
    const handlers: MessageEventHandler = {
      onInsert: (realtimeMessage) => {
        // Convert RealtimeMessage to CommunityMessage format
        const message: CommunityMessage = {
          id: realtimeMessage.id,
          community_id: realtimeMessage.community_id!,
          user_id: realtimeMessage.sender_id,
          content: realtimeMessage.content,
          message_type: realtimeMessage.message_type as 'text' | 'image' | 'file',
          file_url: realtimeMessage.file_url,
          file_name: realtimeMessage.file_name,
          file_size: realtimeMessage.file_size,
          reply_to_id: undefined,
          is_pinned: false,
          created_at: realtimeMessage.created_at,
          updated_at: realtimeMessage.updated_at,
          user: realtimeMessage.sender,
          reply_to: undefined,
          reactions: {},
          user_reaction: undefined,
          reply_count: 0
        };
        onNewMessage(message);
      },
      onUpdate: (realtimeMessage) => {
        const message: CommunityMessage = {
          id: realtimeMessage.id,
          community_id: realtimeMessage.community_id!,
          user_id: realtimeMessage.sender_id,
          content: realtimeMessage.content,
          message_type: realtimeMessage.message_type as 'text' | 'image' | 'file',
          file_url: realtimeMessage.file_url,
          file_name: realtimeMessage.file_name,
          file_size: realtimeMessage.file_size,
          reply_to_id: undefined,
          is_pinned: false,
          created_at: realtimeMessage.created_at,
          updated_at: realtimeMessage.updated_at,
          user: realtimeMessage.sender,
          reply_to: undefined,
          reactions: {},
          user_reaction: undefined,
          reply_count: 0
        };
        onMessageUpdate(message);
      },
      onDelete: onMessageDelete,
      onError: onError
    };

    const subscription = RealtimeService.subscribeToCommunityMessages(communityId, handlers);
    this.realtimeSubscriptions.set(`community_messages_${communityId}`, subscription);

    return subscription;
  }

  /**
   * Unsubscribe from real-time community messages
   */
  static unsubscribeFromCommunityMessages(communityId: string): void {
    const subscriptionKey = `community_messages_${communityId}`;
    const subscription = this.realtimeSubscriptions.get(subscriptionKey);

    if (subscription) {
      subscription.unsubscribe();
      this.realtimeSubscriptions.delete(subscriptionKey);
      debugLog('🔌 Unsubscribed from community messages for community:', communityId);
    }
  }

  /**
   * Cleanup all real-time subscriptions
   */
  static cleanupRealtime(): void {
    this.realtimeSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.realtimeSubscriptions.clear();
    debugLog('🔌 Cleaned up all community discussion real-time subscriptions');
  }
  /**
   * Get messages in a community
   */
  static async getCommunityMessages(
    communityId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CommunityDiscussionResponse<CommunityMessage[]>> {
    try {
      debugLog('💬 Fetching community messages:', communityId);

      // First get the basic messages with user info
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          *,
          user:profiles!community_messages_user_id_fkey (
            id, username, full_name, avatar_url, verified
          )
        `)
        .eq('community_id', communityId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch community messages: ${error.message}`);
      }

      // Get current user for reaction checking
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      // Process messages to add reaction counts, reply info, and reply counts
      const messages: CommunityMessage[] = await Promise.all(
        data.map(async (msg: any) => {
          // Get reply-to message info if exists
          let replyToMessage = null;
          if (msg.reply_to_id) {
            const { data: replyData } = await supabase
              .from('community_messages')
              .select(`
                id, content, user_id, created_at,
                user:profiles!community_messages_user_id_fkey (
                  id, username, full_name, avatar_url, verified
                )
              `)
              .eq('id', msg.reply_to_id)
              .single();

            if (replyData) {
              replyToMessage = {
                ...replyData,
                user: replyData.user
              };
            }
          }

          // Get reaction counts
          const { data: reactions } = await supabase
            .from('community_message_reactions')
            .select('reaction_type')
            .eq('message_id', msg.id);

          const reactionCounts: { [key: string]: number } = {};
          reactions?.forEach(r => {
            reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
          });

          // Get user's reaction
          let userReaction = null;
          if (currentUserId) {
            const { data: userReactionData } = await supabase
              .from('community_message_reactions')
              .select('reaction_type')
              .eq('message_id', msg.id)
              .eq('user_id', currentUserId)
              .single();
            userReaction = userReactionData?.reaction_type;
          }

          // Get reply count
          const { count: replyCount } = await supabase
            .from('community_messages')
            .select('*', { count: 'exact', head: true })
            .eq('reply_to_id', msg.id);

          return {
            ...msg,
            user: msg.user,
            reply_to: replyToMessage,
            reactions: reactionCounts,
            user_reaction: userReaction,
            reply_count: replyCount || 0
          };
        })
      );

      debugLog('✅ Community messages fetched successfully:', messages.length);
      return { success: true, data: messages };

    } catch (error: any) {
      debugError('❌ Error fetching community messages:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a message to a community
   */
  static async sendCommunityMessage(
    communityId: string,
    userId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'announcement' = 'text',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    replyToId?: string,
    isAnnouncement: boolean = false
  ): Promise<CommunityDiscussionResponse<CommunityMessage>> {
    try {
      debugLog('💬 Sending community message:', { communityId, userId });

      const messageData = {
        community_id: communityId,
        user_id: userId,
        content,
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        reply_to_id: replyToId,
        is_announcement: isAnnouncement
      };

      // Try direct insert first
      let { data, error } = await supabase
        .from('community_messages')
        .insert(messageData)
        .select(`
          *,
          user:profiles!community_messages_user_id_fkey (
            id, username, full_name, avatar_url, verified
          )
        `)
        .single();

      // If RLS policy blocks the insert, try the secure function
      if (error && error.message.includes('row-level security policy')) {
        debugLog('🔄 RLS policy blocked insert, trying secure function...');

        try {
          // Use the secure function to insert the message
          const { data: messageId, error: funcError } = await supabase.rpc(
            'send_community_message_secure',
            {
              p_community_id: communityId,
              p_user_id: userId,
              p_content: content,
              p_message_type: messageType,
              p_file_url: fileUrl,
              p_file_name: fileName,
              p_file_size: fileSize,
              p_reply_to_id: replyToId,
              p_is_announcement: isAnnouncement
            }
          );

          if (funcError) {
            throw new Error(`Secure function failed: ${funcError.message}`);
          }

          // Fetch the inserted message with user data
          const { data: fetchedData, error: fetchError } = await supabase
            .from('community_messages')
            .select(`
              *,
              user:profiles!community_messages_user_id_fkey (
                id, username, full_name, avatar_url, verified
              )
            `)
            .eq('id', messageId)
            .single();

          if (fetchError) {
            throw new Error(`Failed to fetch inserted message: ${fetchError.message}`);
          }

          data = fetchedData;
          error = null;
        } catch (secureError: any) {
          throw new Error(`Both direct insert and secure function failed: ${secureError.message}`);
        }
      } else if (error) {
        throw new Error(`Failed to send community message: ${error.message}`);
      }

      // Get reply-to message info if exists
      let replyToMessage = null;
      if (data.reply_to_id) {
        const { data: replyData } = await supabase
          .from('community_messages')
          .select(`
            id, content, user_id, created_at,
            user:profiles!community_messages_user_id_fkey (
              id, username, full_name, avatar_url, verified
            )
          `)
          .eq('id', data.reply_to_id)
          .single();

        if (replyData) {
          replyToMessage = {
            ...replyData,
            user: replyData.user
          };
        }
      }

      const message: CommunityMessage = {
        ...data,
        user: data.user,
        reply_to: replyToMessage,
        reactions: {},
        reply_count: 0
      };

      debugLog('✅ Community message sent successfully:', message.id);
      return { success: true, data: message };

    } catch (error: any) {
      debugError('❌ Error sending community message:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add reaction to a community message
   */
  static async addReaction(
    messageId: string,
    userId: string,
    reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'
  ): Promise<CommunityDiscussionResponse<CommunityMessageReaction>> {
    try {
      debugLog('👍 Adding reaction to message:', { messageId, reactionType });

      // Remove existing reaction first (users can only have one reaction per message)
      await supabase
        .from('community_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);

      // Add new reaction
      const { data, error } = await supabase
        .from('community_message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          reaction_type: reactionType
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add reaction: ${error.message}`);
      }

      debugLog('✅ Reaction added successfully');
      return { success: true, data };

    } catch (error: any) {
      debugError('❌ Error adding reaction:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove reaction from a community message
   */
  static async removeReaction(
    messageId: string,
    userId: string
  ): Promise<CommunityDiscussionResponse<void>> {
    try {
      debugLog('👎 Removing reaction from message:', messageId);

      const { error } = await supabase
        .from('community_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove reaction: ${error.message}`);
      }

      debugLog('✅ Reaction removed successfully');
      return { success: true };

    } catch (error: any) {
      debugError('❌ Error removing reaction:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Edit a community message
   */
  static async editMessage(
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<CommunityDiscussionResponse<CommunityMessage>> {
    try {
      debugLog('✏️ Editing community message:', messageId);

      // Update the message content and set updated_at
      const { data, error } = await supabase
        .from('community_messages')
        .update({
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', userId) // Users can only edit their own messages
        .select(`
          *,
          user:profiles!community_messages_user_id_fkey (
            id, username, full_name, avatar_url, verified
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to edit message: ${error.message}`);
      }

      // Get reply-to message info if exists
      let replyToMessage = null;
      if (data.reply_to_id) {
        const { data: replyData } = await supabase
          .from('community_messages')
          .select(`
            id, content, user_id, created_at,
            user:profiles!community_messages_user_id_fkey (
              id, username, full_name, avatar_url, verified
            )
          `)
          .eq('id', data.reply_to_id)
          .single();

        if (replyData) {
          replyToMessage = {
            ...replyData,
            user: replyData.user
          };
        }
      }

      const message: CommunityMessage = {
        ...data,
        user: data.user,
        reply_to: replyToMessage,
        reactions: {},
        reply_count: 0
      };

      debugLog('✅ Message edited successfully');
      return { success: true, data: message };

    } catch (error: any) {
      debugError('❌ Error editing message:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a community message (enhanced with moderator permissions)
   */
  static async deleteMessage(
    messageId: string,
    userId: string,
    userRole?: 'owner' | 'admin' | 'moderator' | 'member'
  ): Promise<CommunityDiscussionResponse<void>> {
    try {
      debugLog('🗑️ Deleting community message:', messageId);

      // Check if user can delete the message
      let deleteQuery = supabase
        .from('community_messages')
        .delete()
        .eq('id', messageId);

      // If user is not a moderator/admin/owner, they can only delete their own messages
      if (!userRole || userRole === 'member') {
        deleteQuery = deleteQuery.eq('user_id', userId);
      }
      // Moderators, admins, and owners can delete any message in their community

      const { error } = await deleteQuery;

      if (error) {
        throw new Error(`Failed to delete message: ${error.message}`);
      }

      debugLog('✅ Message deleted successfully');
      return { success: true };

    } catch (error: any) {
      debugError('❌ Error deleting message:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload media file for community message
   */
  static async uploadMessageMedia(
    file: File,
    communityId: string,
    userId: string
  ): Promise<CommunityDiscussionResponse<{ url: string; fileName: string; fileSize: number }>> {
    try {
      debugLog('📁 Uploading message media:', file.name);

      // Validate file type and size
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov'];
      const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only images (JPG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) are allowed.');
      }

      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 50MB.');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `community-messages/${communityId}/${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(filePath);

      debugLog('✅ Media uploaded successfully:', urlData.publicUrl);
      return {
        success: true,
        data: {
          url: urlData.publicUrl,
          fileName: file.name,
          fileSize: file.size
        }
      };

    } catch (error: any) {
      debugError('❌ Error uploading media:', error.message);
      return { success: false, error: error.message };
    }
  }
}