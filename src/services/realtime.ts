import { supabase } from '../lib/supabase';
import { debugLog } from '../utils/debug';
import { 
  NotificationData, 
  TypingIndicator, 
  UserPresence, 
  RealtimeSubscription, 
  RealtimeConnectionState,
  CommentUpdate,
  LiveEngagement,
  LiveComment
} from '../types/ai';

// Real-time event callbacks
type NotificationCallback = (notification: NotificationData) => void;
type TypingCallback = (typing: TypingIndicator) => void;
type PresenceCallback = (presence: UserPresence[]) => void;
type CommentCallback = (update: CommentUpdate) => void;
type EngagementCallback = (engagement: LiveEngagement) => void;

export class RealtimeService {
  private static subscriptions = new Map<string, RealtimeSubscription>();
  private static connectionState: RealtimeConnectionState = {
    connected: false,
    connecting: false,
    reconnectAttempts: 0
  };
  
  private static notificationCallbacks = new Set<NotificationCallback>();
  private static typingCallbacks = new Set<TypingCallback>();
  private static presenceCallbacks = new Set<PresenceCallback>();
  private static commentCallbacks = new Set<CommentCallback>();
  private static engagementCallbacks = new Set<EngagementCallback>();

  private static currentUserId: string | null = null;
  private static presenceChannel: any = null;
  private static typingTimeouts = new Map<string, NodeJS.Timeout>();

  // Initialize real-time service
  static async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    this.connectionState.connecting = true;
    
    try {
      debugLog('🔄 Initializing real-time service for user:', userId);
      
      // Set up presence tracking
      await this.setupPresenceTracking();
      
      // Subscribe to notifications
      await this.subscribeToNotifications();
      
      // Subscribe to typing indicators
      await this.subscribeToTypingIndicators();
      
      this.connectionState.connected = true;
      this.connectionState.connecting = false;
      this.connectionState.lastConnected = new Date();
      this.connectionState.reconnectAttempts = 0;
      
      debugLog('✅ Real-time service initialized successfully');
    } catch (error: any) {
      this.connectionState.connected = false;
      this.connectionState.connecting = false;
      this.connectionState.error = error.message;
      debugLog('❌ Failed to initialize real-time service:', error.message);
      
      // Attempt reconnection
      this.scheduleReconnect();
    }
  }

  // Set up presence tracking
  private static async setupPresenceTracking(): Promise<void> {
    if (!this.currentUserId) return;

    this.presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: this.currentUserId,
        },
      },
    });

    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = this.presenceChannel.presenceState();
        const users: UserPresence[] = [];
        
        for (const userId in presenceState) {
          const presence = presenceState[userId][0];
          users.push({
            userId,
            username: presence.username || 'Unknown',
            avatar: presence.avatar,
            isOnline: true,
            lastSeen: new Date()
          });
        }
        
        this.notifyPresenceCallbacks(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        debugLog('👋 User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        debugLog('👋 User left:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await this.presenceChannel.track({
            userId: this.currentUserId,
            username: 'Current User', // This should come from user profile
            online_at: new Date().toISOString(),
          });
        }
      });
  }

  // Subscribe to notifications
  private static async subscribeToNotifications(): Promise<void> {
    if (!this.currentUserId) return;

    const notificationSub = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.currentUserId}`,
        },
        (payload) => {
          debugLog('🔔 New notification received:', payload);
          this.handleNotificationInsert(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set('notifications', {
      id: 'notifications',
      channel: 'notifications',
      table: 'notifications',
      filter: `user_id=eq.${this.currentUserId}`,
      callback: this.handleNotificationInsert.bind(this),
      isActive: true
    });
  }

  // Subscribe to typing indicators
  private static async subscribeToTypingIndicators(): Promise<void> {
    const typingSub = supabase
      .channel('typing-indicators')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_typing',
        },
        (payload) => {
          debugLog('⌨️ Typing indicator update:', payload);
          this.handleTypingUpdate(payload);
        }
      )
      .subscribe();

    this.subscriptions.set('typing', {
      id: 'typing',
      channel: 'typing-indicators',
      table: 'comment_typing',
      callback: this.handleTypingUpdate.bind(this),
      isActive: true
    });
  }

  // Subscribe to comments for a specific post/reel
  static async subscribeToComments(contentId: string, contentType: 'post' | 'reel'): Promise<void> {
    const subscriptionId = `comments-${contentType}-${contentId}`;
    
    if (this.subscriptions.has(subscriptionId)) {
      debugLog('💬 Already subscribed to comments for:', contentId);
      return;
    }

    const column = contentType === 'post' ? 'post_id' : 'reel_id';
    
    const commentSub = supabase
      .channel(`comments-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `${column}=eq.${contentId}`,
        },
        (payload) => {
          debugLog('💬 Comment update received:', payload);
          this.handleCommentUpdate(payload, contentId, contentType);
        }
      )
      .subscribe();

    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      channel: `comments-${contentId}`,
      table: 'comments',
      filter: `${column}=eq.${contentId}`,
      callback: (payload) => this.handleCommentUpdate(payload, contentId, contentType),
      isActive: true
    });

    debugLog('✅ Subscribed to comments for:', contentId);
  }

  // Unsubscribe from comments
  static async unsubscribeFromComments(contentId: string, contentType: 'post' | 'reel'): Promise<void> {
    const subscriptionId = `comments-${contentType}-${contentId}`;
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      await supabase.removeChannel(supabase.channel(subscription.channel));
      this.subscriptions.delete(subscriptionId);
      debugLog('🔇 Unsubscribed from comments for:', contentId);
    }
  }

  // Handle notification insert
  private static handleNotificationInsert(notification: any): void {
    const notificationData: NotificationData = {
      id: notification.id,
      type: notification.type,
      userId: notification.user_id,
      actorId: notification.actor_id,
      actorUsername: notification.actor_username || 'Unknown',
      actorAvatar: notification.actor_avatar,
      postId: notification.post_id,
      reelId: notification.reel_id,
      commentId: notification.comment_id,
      message: this.formatNotificationMessage(notification),
      createdAt: notification.created_at,
      read: notification.read || false
    };

    this.notifyNotificationCallbacks(notificationData);
  }

  // Handle typing indicator updates
  private static handleTypingUpdate(payload: any): void {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const typing: TypingIndicator = {
        userId: payload.new.user_id,
        username: payload.new.username || 'Unknown',
        avatar: payload.new.avatar,
        postId: payload.new.post_id,
        reelId: payload.new.reel_id,
        timestamp: new Date(payload.new.updated_at)
      };

      this.notifyTypingCallbacks(typing);

      // Clear typing indicator after 3 seconds
      const key = `${typing.userId}-${typing.postId || typing.reelId}`;
      if (this.typingTimeouts.has(key)) {
        clearTimeout(this.typingTimeouts.get(key)!);
      }

      this.typingTimeouts.set(key, setTimeout(() => {
        this.clearTypingIndicator(typing.userId, typing.postId, typing.reelId);
      }, 3000));
    }
  }

  // Handle comment updates
  private static handleCommentUpdate(payload: any, contentId: string, contentType: 'post' | 'reel'): void {
    const update: CommentUpdate = {
      type: payload.eventType,
      comment: this.formatLiveComment(payload.new || payload.old),
      postId: contentType === 'post' ? contentId : undefined,
      reelId: contentType === 'reel' ? contentId : undefined
    };

    this.notifyCommentCallbacks(update);
  }

  // Format live comment from database row
  private static formatLiveComment(commentRow: any): LiveComment {
    return {
      id: commentRow.id,
      content: commentRow.content,
      userId: commentRow.user_id,
      username: commentRow.username || 'Unknown',
      avatar: commentRow.avatar,
      postId: commentRow.post_id,
      reelId: commentRow.reel_id,
      parentId: commentRow.parent_id,
      likesCount: commentRow.likes_count || 0,
      createdAt: commentRow.created_at,
      updatedAt: commentRow.updated_at,
      replies: []
    };
  }

  // Format notification message
  private static formatNotificationMessage(notification: any): string {
    const actor = notification.actor_username || 'Someone';
    
    switch (notification.type) {
      case 'like':
        return `${actor} liked your ${notification.post_id ? 'post' : 'reel'}`;
      case 'comment':
        return `${actor} commented on your ${notification.post_id ? 'post' : 'reel'}`;
      case 'follow':
        return `${actor} started following you`;
      case 'mention':
        return `${actor} mentioned you in a comment`;
      default:
        return `${actor} interacted with your content`;
    }
  }

  // Send typing indicator
  static async sendTypingIndicator(contentId: string, contentType: 'post' | 'reel'): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const { error } = await supabase
        .from('comment_typing')
        .upsert({
          user_id: this.currentUserId,
          post_id: contentType === 'post' ? contentId : null,
          reel_id: contentType === 'reel' ? contentId : null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error: any) {
      debugLog('❌ Failed to send typing indicator:', error.message);
    }
  }

  // Clear typing indicator
  static async clearTypingIndicator(userId?: string, postId?: string, reelId?: string): Promise<void> {
    const targetUserId = userId || this.currentUserId;
    if (!targetUserId) return;

    try {
      let query = supabase
        .from('comment_typing')
        .delete()
        .eq('user_id', targetUserId);

      if (postId) query = query.eq('post_id', postId);
      if (reelId) query = query.eq('reel_id', reelId);

      const { error } = await query;
      if (error) throw error;
    } catch (error: any) {
      debugLog('❌ Failed to clear typing indicator:', error.message);
    }
  }

  // Callback management
  static onNotification(callback: NotificationCallback): () => void {
    this.notificationCallbacks.add(callback);
    return () => this.notificationCallbacks.delete(callback);
  }

  static onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.add(callback);
    return () => this.typingCallbacks.delete(callback);
  }

  static onPresence(callback: PresenceCallback): () => void {
    this.presenceCallbacks.add(callback);
    return () => this.presenceCallbacks.delete(callback);
  }

  static onComment(callback: CommentCallback): () => void {
    this.commentCallbacks.add(callback);
    return () => this.commentCallbacks.delete(callback);
  }

  static onEngagement(callback: EngagementCallback): () => void {
    this.engagementCallbacks.add(callback);
    return () => this.engagementCallbacks.delete(callback);
  }

  // Notify callbacks
  private static notifyNotificationCallbacks(notification: NotificationData): void {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        debugLog('❌ Error in notification callback:', error);
      }
    });
  }

  private static notifyTypingCallbacks(typing: TypingIndicator): void {
    this.typingCallbacks.forEach(callback => {
      try {
        callback(typing);
      } catch (error) {
        debugLog('❌ Error in typing callback:', error);
      }
    });
  }

  private static notifyPresenceCallbacks(presence: UserPresence[]): void {
    this.presenceCallbacks.forEach(callback => {
      try {
        callback(presence);
      } catch (error) {
        debugLog('❌ Error in presence callback:', error);
      }
    });
  }

  private static notifyCommentCallbacks(update: CommentUpdate): void {
    this.commentCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        debugLog('❌ Error in comment callback:', error);
      }
    });
  }

  private static notifyEngagementCallbacks(engagement: LiveEngagement): void {
    this.engagementCallbacks.forEach(callback => {
      try {
        callback(engagement);
      } catch (error) {
        debugLog('❌ Error in engagement callback:', error);
      }
    });
  }

  // Schedule reconnection
  private static scheduleReconnect(): void {
    if (this.connectionState.reconnectAttempts >= 5) {
      debugLog('❌ Max reconnection attempts reached');
      return;
    }

    const delay = Math.pow(2, this.connectionState.reconnectAttempts) * 1000; // Exponential backoff
    this.connectionState.reconnectAttempts++;

    setTimeout(() => {
      if (this.currentUserId) {
        debugLog('🔄 Attempting to reconnect real-time service...');
        this.initialize(this.currentUserId);
      }
    }, delay);
  }

  // Get connection state
  static getConnectionState(): RealtimeConnectionState {
    return { ...this.connectionState };
  }

  // Cleanup
  static async cleanup(): Promise<void> {
    debugLog('🧹 Cleaning up real-time service...');
    
    // Clear all timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    
    // Remove all subscriptions
    for (const subscription of this.subscriptions.values()) {
      await supabase.removeChannel(supabase.channel(subscription.channel));
    }
    this.subscriptions.clear();
    
    // Remove presence channel
    if (this.presenceChannel) {
      await supabase.removeChannel(this.presenceChannel);
      this.presenceChannel = null;
    }
    
    // Clear callbacks
    this.notificationCallbacks.clear();
    this.typingCallbacks.clear();
    this.presenceCallbacks.clear();
    this.commentCallbacks.clear();
    this.engagementCallbacks.clear();
    
    // Reset state
    this.currentUserId = null;
    this.connectionState = {
      connected: false,
      connecting: false,
      reconnectAttempts: 0
    };
    
    debugLog('✅ Real-time service cleanup complete');
  }
}
