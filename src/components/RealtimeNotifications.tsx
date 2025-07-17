import React, { useState, useEffect } from 'react';
import { Bell, X, Heart, MessageCircle, UserPlus, AtSign, Check } from 'lucide-react';
import { RealtimeService } from '../services/realtime';
import { NotificationData } from '../types/ai';
import { useAuth } from '../contexts/AuthContext';
import { debugLog } from '../utils/debug';

interface RealtimeNotificationsProps {
  className?: string;
}

const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize real-time service with proper cleanup
  useEffect(() => {
    let cleanupFunctions: (() => void)[] = [];
    let isComponentMounted = true;

    const initializeRealtime = async () => {
      if (!user?.id || !isComponentMounted) return;

      try {
        await RealtimeService.initialize(user.id);

        if (!isComponentMounted) return; // Component unmounted during initialization

        setIsConnected(true);

        // Subscribe to notifications with proper cleanup tracking
        const unsubscribeNotifications = RealtimeService.onNotification((notification) => {
          if (isComponentMounted) {
            handleNewNotification(notification);
          }
        });

        cleanupFunctions.push(unsubscribeNotifications);

        debugLog('✅ Real-time notifications initialized');
      } catch (error: any) {
        debugLog('❌ Failed to initialize real-time notifications:', error.message);
        if (isComponentMounted) {
          setIsConnected(false);
        }
      }
    };

    if (user?.id) {
      initializeRealtime();
    }

    // Cleanup function
    return () => {
      isComponentMounted = false;

      // Run all cleanup functions
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          debugLog('⚠️ Error during notification cleanup:', error);
        }
      });

      // Clean up real-time service
      RealtimeService.cleanup().catch(error => {
        debugLog('⚠️ Error during realtime service cleanup:', error);
      });
    };
  }, [user?.id]);

  // Handle new notification
  const handleNewNotification = (notification: NotificationData) => {
    debugLog('🔔 New notification received:', notification);

    // Add to notifications list
    setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Keep last 20

    // Update unread count
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // Show toast notification
    showToastNotification(notification);
  };

  // Show toast notification
  const showToastNotification = (notification: NotificationData) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `
      fixed top-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-800 
      border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg 
      p-4 transform transition-all duration-300 ease-in-out
      translate-x-full opacity-0
    `;

    const icon = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);

    toast.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          ${icon}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            ${notification.message}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Just now
          </p>
        </div>
        <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);

    // Add click to close
    const closeButton = toast.querySelector('button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      });
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'like':
        return '<svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
      case 'comment':
        return '<svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>';
      case 'follow':
        return '<svg class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>';
      case 'mention':
        return '<svg class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>';
      default:
        return '<svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z"/></svg>';
    }
  };

  // Get notification color
  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'like': return 'text-red-500';
      case 'comment': return 'text-blue-500';
      case 'follow': return 'text-green-500';
      case 'mention': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Bell className="h-6 w-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Connection Status */}
        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
          isConnected ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  You'll see notifications here when people interact with your content
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {notification.type === 'like' && <Heart className="h-5 w-5 text-red-500" />}
                        {notification.type === 'comment' && <MessageCircle className="h-5 w-5 text-blue-500" />}
                        {notification.type === 'follow' && <UserPlus className="h-5 w-5 text-green-500" />}
                        {notification.type === 'mention' && <AtSign className="h-5 w-5 text-purple-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-center">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeNotifications;
