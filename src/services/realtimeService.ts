import { supabase } from '../lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { debugLog, debugError } from '../utils/debug';

// Types for real-time events
export interface RealtimeMessage {
  id: string;
  conversation_id?: string;
  community_id?: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
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
}

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export type MessageEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface MessageEventHandler {
  onInsert?: (message: RealtimeMessage) => void;
  onUpdate?: (message: RealtimeMessage) => void;
  onDelete?: (messageId: string) => void;
  onError?: (error: any) => void;
}

/**
 * Real-time service for managing WebSocket connections and subscriptions
 */
export class RealtimeService {
  private static subscriptions = new Map<string, RealtimeSubscription>();
  private static connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectDelay = 1000; // Start with 1 second

  /**
   * Initialize real-time connection
   */
  static async initialize(): Promise<void> {
    try {
      debugLog('🔌 Initializing real-time service...');
      this.connectionStatus = 'connecting';

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('User must be authenticated to use real-time features');
      }

      // Listen for connection state changes
      supabase.realtime.onOpen(() => {
        debugLog('✅ Real-time connection opened');
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      });

      supabase.realtime.onClose(() => {
        debugLog('❌ Real-time connection closed');
        this.connectionStatus = 'disconnected';
        this.handleReconnection();
      });

      supabase.realtime.onError((error: any) => {
        debugError('❌ Real-time connection error:', error);
        this.connectionStatus = 'disconnected';
        this.handleReconnection();
      });

      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Real-time connection timeout'));
        }, 10000); // 10 second timeout

        const checkConnection = () => {
          if (this.connectionStatus === 'connected') {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkConnection, 100);
          }
        };

        // Start checking connection status
        checkConnection();

        // Trigger connection by creating a temporary channel
        const tempChannel = supabase.channel('connection-test');
        tempChannel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.connectionStatus = 'connected';
            tempChannel.unsubscribe();
          }
        });
      });

      debugLog('✅ Real-time service initialized and connected');

    } catch (error: any) {
      debugError('❌ Failed to initialize real-time service:', error);
      this.connectionStatus = 'disconnected';
      throw error;
    }
  }

  /**
   * Handle reconnection logic
   */
  private static handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      debugError('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    debugLog(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.initialize().catch(error => {
        debugError('❌ Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Subscribe to direct messages for a specific user
   */
  static subscribeToDirectMessages(
    userId: string,
    handlers: MessageEventHandler
  ): RealtimeSubscription {
    const subscriptionKey = `direct_messages_${userId}`;

    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);

    debugLog('📡 Subscribing to direct messages for user:', userId);

    const channel = supabase
      .channel(`direct_messages_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
          // Note: Complex filters with subqueries are not supported in real-time
          // We'll filter on the client side instead
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDirectMessageEvent(payload, handlers, userId);
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          debugLog('✅ Subscribed to direct messages for user:', userId);
        } else if (status === 'CHANNEL_ERROR') {
          debugError('❌ Failed to subscribe to direct messages');
          handlers.onError?.('Failed to subscribe to direct messages');
        }
      });

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(subscriptionKey)
    };

    this.subscriptions.set(subscriptionKey, subscription);
    return subscription;
  }

  /**
   * Subscribe to community messages for a specific community
   */
  static subscribeToCommunityMessages(
    communityId: string,
    handlers: MessageEventHandler
  ): RealtimeSubscription {
    const subscriptionKey = `community_messages_${communityId}`;

    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);

    debugLog('📡 Subscribing to community messages for community:', communityId);

    const channel = supabase
      .channel(`community_messages_${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleMessageEvent(payload, handlers);
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          debugLog('✅ Subscribed to community messages for community:', communityId);
        } else if (status === 'CHANNEL_ERROR') {
          debugError('❌ Failed to subscribe to community messages');
          handlers.onError?.('Failed to subscribe to community messages');
        }
      });

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(subscriptionKey)
    };

    this.subscriptions.set(subscriptionKey, subscription);
    return subscription;
  }

  /**
   * Handle direct message events with user filtering
   */
  private static async handleDirectMessageEvent(
    payload: RealtimePostgresChangesPayload<any>,
    handlers: MessageEventHandler,
    userId: string
  ): Promise<void> {
    try {
      // First check if this message is relevant to the user
      if (payload.new) {
        const conversationId = payload.new.conversation_id;
        if (conversationId) {
          // Check if user is part of this conversation
          const { data: conversation } = await supabase
            .from('conversations')
            .select('participant_1, participant_2')
            .eq('id', conversationId)
            .single();

          if (!conversation ||
              (conversation.participant_1 !== userId && conversation.participant_2 !== userId)) {
            // This message is not for this user, ignore it
            return;
          }
        }
      }

      // Process the message event
      await this.handleMessageEvent(payload, handlers);

    } catch (error: any) {
      debugError('❌ Error handling direct message event:', error);
      handlers.onError?.(error);
    }
  }

  /**
   * Handle message events from real-time subscriptions
   */
  private static async handleMessageEvent(
    payload: RealtimePostgresChangesPayload<any>,
    handlers: MessageEventHandler
  ): Promise<void> {
    try {
      debugLog('📨 Received real-time message event:', payload.eventType);

      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new && handlers.onInsert) {
            // Fetch complete message data with user info
            const enrichedMessage = await this.enrichMessageData(payload.new);
            handlers.onInsert(enrichedMessage);
          }
          break;

        case 'UPDATE':
          if (payload.new && handlers.onUpdate) {
            // Fetch complete message data with user info
            const enrichedMessage = await this.enrichMessageData(payload.new);
            handlers.onUpdate(enrichedMessage);
          }
          break;

        case 'DELETE':
          if (payload.old && handlers.onDelete) {
            handlers.onDelete(payload.old.id);
          }
          break;

        default:
          debugLog('🤷 Unknown event type:', (payload as any).eventType);
      }

    } catch (error: any) {
      debugError('❌ Error handling message event:', error);
      handlers.onError?.(error);
    }
  }

  /**
   * Enrich message data with user information
   */
  private static async enrichMessageData(messageData: any): Promise<RealtimeMessage> {
    try {
      // Fetch user profile for the sender
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, verified')
        .eq('id', messageData.sender_id)
        .single();

      return {
        ...messageData,
        sender: userProfile || undefined
      };

    } catch (error: any) {
      debugError('❌ Error enriching message data:', error);
      // Return message without user data if enrichment fails
      return messageData;
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  static unsubscribe(subscriptionKey: string): void {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      debugLog('🔌 Unsubscribing from:', subscriptionKey);
      subscription.channel.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  static unsubscribeAll(): void {
    debugLog('🔌 Unsubscribing from all real-time subscriptions');
    this.subscriptions.forEach((subscription) => {
      subscription.channel.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Get connection status
   */
  static getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionStatus;
  }

  /**
   * Get active subscriptions count
   */
  static getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Subscribe to conversation updates (for updating last message, unread counts, etc.)
   */
  static subscribeToConversationUpdates(
    userId: string,
    onUpdate: (conversation: any) => void
  ): RealtimeSubscription {
    const subscriptionKey = `conversation_updates_${userId}`;

    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);

    debugLog('📡 Subscribing to conversation updates for user:', userId);

    const channel = supabase
      .channel(`conversation_updates_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1=eq.${userId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.new) {
            onUpdate(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `participant_2=eq.${userId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (payload.new) {
            onUpdate(payload.new);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          debugLog('✅ Subscribed to conversation updates for user:', userId);
        } else if (status === 'CHANNEL_ERROR') {
          debugError('❌ Failed to subscribe to conversation updates');
        }
      });

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(subscriptionKey)
    };

    this.subscriptions.set(subscriptionKey, subscription);
    return subscription;
  }
}