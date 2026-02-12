"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Clock, FileText, Users, Trophy, Activity } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "match_reminder":
    case "match":
      return Activity;
    case "report":
    case "scouting_report":
      return FileText;
    case "player":
      return Users;
    case "camp":
      return Trophy;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "match_reminder":
    case "match":
      return "text-green-400";
    case "report":
    case "scouting_report":
      return "text-purple-400";
    case "player":
      return "text-blue-400";
    case "camp":
      return "text-yellow-400";
    default:
      return "text-arcane-yellow";
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("arcane_auth_token") : null;
    if (!token) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient.getNotifications(showUnreadOnly);
      setNotifications(data);
    } catch (error: any) {
      const isAuthError = error.message?.includes("Unauthorized") || error.message?.includes("401");
      if (!isAuthError) {
        console.error("Failed to fetch notifications:", error);
        toast.error("Failed to load notifications");
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [showUnreadOnly]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };

  return (
    <main className="min-h-screen bg-arcane-dark py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Notifications</h1>
            <p className="text-arcane-grey mt-2">Stay updated with your latest activity.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowUnreadOnly((prev) => !prev)}
            >
              {showUnreadOnly ? "Show all" : "Unread only"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </div>

        <GlassCard variant="elevated" className="p-0">
          {loading ? (
            <div className="p-8 text-center text-arcane-grey">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-arcane-grey mx-auto mb-4" />
              <p className="text-arcane-grey">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-arcane-darkBorder">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4",
                      notification.isRead ? "bg-transparent" : "bg-arcane-yellow/5"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "h-12 w-12 rounded-lg flex items-center justify-center",
                          notification.isRead ? "bg-arcane-darkBorder" : "bg-arcane-yellow/20"
                        )}
                      >
                        <Icon className={cn("h-6 w-6", iconColor)} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-white">{notification.title}</h3>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-arcane-yellow" />
                          )}
                        </div>
                        <p className="text-arcane-grey mb-2">{notification.body}</p>
                        <div className="flex items-center gap-2 text-sm text-arcane-grey">
                          <Clock className="h-4 w-4" />
                          {formatTimestamp(notification.createdAt)}
                        </div>
                      </div>
                    </div>

                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                        Mark as read
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
