/**
 * Gentle Companion Notifications - Simple, caring notifications from your AI companion
 * 
 * This aligns with the "rich circle" vision: gentle companion nudges,
 * not a complex notification center with multiple categories.
 */

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CompanionNotification {
  id: string;
  type: 'gentle-reminder' | 'caring-insight' | 'gentle-nudge';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actionType?: 'check' | 'cross' | 'dismiss';
}

interface NotificationStats {
  total: number;
  unread: number;
  completed: number;
  dismissed: number;
}

export default function AssistantNotificationSystem() {
  const [notifications, setNotifications] = useState<CompanionNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    completed: 0,
    dismissed: 0
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // Simulate gentle companion notifications
  useEffect(() => {
    const generateGentleNotifications = () => {
      const now = new Date();
      const mockNotifications: CompanionNotification[] = [
        {
          id: '1',
          type: 'gentle-reminder',
          title: 'Time for a Break',
          message: 'You\'ve been working for a while. Maybe take a moment to stretch or grab some water?',
          timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
          read: false,
          actionable: true,
          actionType: 'check'
        },
        {
          id: '2',
          type: 'caring-insight',
          title: 'I Noticed Something',
          message: 'You seem to be most creative in the mornings. Consider saving your important creative work for then.',
          timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
          read: false,
          actionable: false
        },
        {
          id: '3',
          type: 'gentle-nudge',
          title: 'How Are You Feeling?',
          message: 'Just checking in. Remember, it\'s okay to take things one step at a time.',
          timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
          read: true,
          actionable: true,
          actionType: 'check'
        }
      ];
      
      setNotifications(mockNotifications);
      updateStats(mockNotifications);
    };

    generateGentleNotifications();
  }, []);

  const updateStats = (notifs: CompanionNotification[]) => {
    setStats({
      total: notifs.length,
      unread: notifs.filter(n => !n.read).length,
      completed: notifs.filter(n => n.actionType === 'check' && n.read).length,
      dismissed: notifs.filter(n => n.actionType === 'cross' && n.read).length
    });
  };

  const handleNotificationAction = (notificationId: string, action: 'check' | 'cross' | 'dismiss') => {
    setNotifications(prev => {
      const updated = prev.map(notif => {
        if (notif.id === notificationId) {
          return { ...notif, read: true };
        }
        return notif;
      });
      updateStats(updated);
      return updated;
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'gentle-reminder':
        return <Clock className="h-5 w-5 text-blue-500" />;
             case 'caring-insight':
         return <Sparkles className="h-5 w-5 text-purple-500" />;
             case 'gentle-nudge':
         return <Heart className="h-5 w-5 text-pink-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'gentle-reminder':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
      case 'caring-insight':
        return 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800';
      case 'gentle-nudge':
        return 'border-pink-200 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-800';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - timestamp.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.ceil(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Bell className="h-6 w-6" />
        {stats.unread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {stats.unread > 9 ? '9+' : stats.unread}
          </Badge>
        )}
      </button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Companion's Messages
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gentle reminders and insights from your AI companion
            </p>
          </div>

          {/* Notifications List */}
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                                 <Heart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  No notifications right now. Your companion is giving you space.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                          {notification.message}
                        </p>
                        
                        {notification.actionable && notification.actionType && !notification.read && (
                          <div className="flex space-x-2">
                            {notification.actionType === 'check' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNotificationAction(notification.id, 'check')}
                                className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Got it
                              </Button>
                            )}
                            {notification.actionType === 'cross' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNotificationAction(notification.id, 'cross')}
                                className="text-gray-600 border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 text-xs"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Skip
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNotificationAction(notification.id, 'dismiss')}
                              className="text-gray-500 border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/20 text-xs"
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>{stats.unread} unread</span>
                <span>{stats.completed} completed</span>
                <span>{stats.dismissed} dismissed</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
