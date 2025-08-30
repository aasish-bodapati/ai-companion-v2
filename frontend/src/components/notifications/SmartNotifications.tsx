'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { notificationService, type NotificationItem } from '@/services/notificationService';
import Link from 'next/link';

interface SmartNotificationsProps {
  maxNotifications?: number;
  showUnreadOnly?: boolean;
  className?: string;
}

export default function SmartNotifications({ 
  maxNotifications = 5, 
  showUnreadOnly = false,
  className = '' 
}: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const allNotifications = await notificationService.getNotifications();
        const filteredNotifications = showUnreadOnly 
          ? allNotifications.filter(n => !n.read)
          : allNotifications;
        setNotifications(filteredNotifications.slice(0, maxNotifications));
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [maxNotifications, showUnreadOnly]);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleDismiss = (id: string) => {
    notificationService.dismissNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return '⏰';
      case 'suggestion': return '💡';
      case 'achievement': return '🎉';
      case 'warning': return '⚠️';
      default: return '📢';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workout': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'nutrition': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'sleep': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
      case 'routine': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'general': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Smart Notifications</h3>
          <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1 w-2/3"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <div className="text-2xl mb-2">⚠️</div>
          <p>Unable to load notifications</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 underline"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <div className="text-2xl mb-2">✨</div>
          <p>All caught up!</p>
          <p className="text-sm">No notifications at the moment</p>
        </div>
      </Card>
    );
  }

  const displayedNotifications = expanded ? notifications : notifications.slice(0, 3);

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Smart Notifications
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </h3>
        {notifications.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {expanded ? 'Show Less' : `Show ${notifications.length - 3} More`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} transition-all duration-200 ${
              notification.read ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl">{notification.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{getTypeIcon(notification.type)}</span>
                  <h4 className={`text-sm font-medium text-gray-800 dark:text-gray-200 ${
                    notification.read ? 'line-through' : ''
                  }`}>
                    {notification.title}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                    {notification.category}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {notification.actionable && notification.actionText && notification.actionUrl && (
                      <Link
                        href={notification.actionUrl}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                      >
                        {notification.actionText} →
                      </Link>
                    )}
                    
                    <span className="text-xs text-gray-400">
                      {notification.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              {notifications.filter(n => !n.read).length} unread
            </span>
            <button
              onClick={() => {
                notifications.forEach(n => notificationService.markAsRead(n.id));
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Mark all read
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

