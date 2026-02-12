'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, Clock, FileText, Users, Trophy, Activity } from 'lucide-react';
import { Popover } from '@/components/composite/Feedback/Popover';
import { IconButton } from '@/components/primitives/Button/IconButton';
import { Heading } from '@/components/primitives/Typography/Heading';
import { Text } from '@/components/primitives/Typography/Text';
import { ArcaneButton } from '@/components/primitives/Button/ArcaneButton';
import { Badge } from '@/components/primitives/Badge/Badge';
import { Skeleton } from '@/components/composite/Progress/Skeleton';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  dataJson?: any;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationsPopoverProps {
  /** Notification count for badge */
  notificationCount?: number;
  /** Callback when notifications are updated */
  onNotificationsUpdate?: (count: number) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'match_reminder':
    case 'match':
      return Activity;
    case 'report':
    case 'scouting_report':
      return FileText;
    case 'player':
      return Users;
    case 'camp':
      return Trophy;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'match_reminder':
    case 'match':
      return 'text-green-400';
    case 'report':
    case 'scouting_report':
      return 'text-purple-400';
    case 'player':
      return 'text-blue-400';
    case 'camp':
      return 'text-yellow-400';
    default:
      return 'text-arcane-yellow';
  }
};

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  notificationCount: initialCount = 0,
  onNotificationsUpdate,
}) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    // Check if user is authenticated
    const token = typeof window !== 'undefined' ? localStorage.getItem('arcane_auth_token') : null;
    if (!token) {
      setLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient.getNotifications(showUnreadOnly);
      setNotifications(data);

      // Count unread notifications
      const unread = data.filter((n: Notification) => !n.isRead).length;
      setUnreadCount(unread);
      onNotificationsUpdate?.(unread);
    } catch (error: any) {
      // Only log and show error if it's not an authentication error
      const isAuthError = error.message?.includes('Unauthorized') || error.message?.includes('401');

      if (!isAuthError) {
        console.error('Failed to fetch notifications:', error);
        toast.error('Failed to load notifications');
      }

      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [showUnreadOnly]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );

      // Update unread count
      const unread = notifications.filter((n) => !n.isRead && n.id !== notificationId).length;
      setUnreadCount(unread);
      onNotificationsUpdate?.(unread);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      onNotificationsUpdate?.(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const notificationsContent = (
    <div className="w-96 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-arcane-slate/30">
        <div className="flex items-center justify-between mb-3">
          <Heading level={5} className="text-lg">
            Notifications
          </Heading>
          {unreadCount > 0 && (
            <Badge variant="warning" size="sm">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-md transition-colors',
              showUnreadOnly
                ? 'bg-arcane-yellow text-arcane-black font-semibold'
                : 'bg-arcane-charcoal text-arcane-gray-300 hover:bg-arcane-charcoal/70'
            )}
          >
            {showUnreadOnly ? 'Show All' : 'Unread Only'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs px-3 py-1.5 rounded-md bg-arcane-charcoal text-arcane-gray-300 hover:bg-arcane-charcoal/70 transition-colors flex items-center gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} type="custom" height="80px" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="h-12 w-12 text-arcane-gray-500 opacity-50 mb-3" />
            <Text color="secondary" size="sm" className="text-center">
              {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
            </Text>
          </div>
        ) : (
          <div className="divide-y divide-arcane-slate/20">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 transition-colors cursor-pointer group',
                    notification.isRead
                      ? 'bg-transparent hover:bg-arcane-charcoal/30'
                      : 'bg-arcane-yellow/5 hover:bg-arcane-yellow/10'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        notification.isRead ? 'bg-arcane-charcoal' : 'bg-arcane-yellow/20'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', iconColor)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Text size="sm" weight="semibold" className="leading-tight">
                          {notification.title}
                        </Text>
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4 text-arcane-yellow hover:text-arcane-yellow/80" />
                          </button>
                        )}
                      </div>
                      <Text size="xs" color="secondary" className="mb-2 line-clamp-2">
                        {notification.body}
                      </Text>
                      <div className="flex items-center gap-2">
                        <Text size="xs" color="tertiary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(notification.createdAt)}
                        </Text>
                        {!notification.isRead && (
                          <div className="h-1.5 w-1.5 rounded-full bg-arcane-yellow" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-arcane-slate/30">
          <ArcaneButton
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => {
              router.push('/notifications');
            }}
          >
            View All Notifications
          </ArcaneButton>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={notificationsContent}
      placement="bottom"
      trigger="click"
      showArrow
      closeOnClickOutside
    >
      <div>
        <IconButton
          icon={<Bell />}
          variant="ghost"
          size="md"
          badge={unreadCount > 0 ? unreadCount : undefined}
          aria-label={`${unreadCount} notifications`}
          tooltip="Notifications"
        />
      </div>
    </Popover>
  );
};

NotificationsPopover.displayName = 'NotificationsPopover';
