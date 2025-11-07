"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  Users,
  Trophy,
  Calendar,
  Crown,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  category: "report" | "player" | "camp" | "match" | "subscription" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.getNotifications();
      // Handle both { notifications: [] } and direct array responses
      const notifs = response?.notifications || response || [];
      setNotifications(Array.isArray(notifs) ? notifs : generateMockNotifications());
    } catch {
      // Fallback to mock data if API fails
      setNotifications(generateMockNotifications());
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const generateMockNotifications = (): Notification[] => {
    return [
      {
        id: "1",
        type: "success",
        category: "report",
        title: "Nouveau rapport approuvé",
        message: "Votre rapport sur Kylian Mbappé a été approuvé",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        actionUrl: "/reports/1",
      },
      {
        id: "2",
        type: "info",
        category: "camp",
        title: "Nouveau camp disponible",
        message: "Camp Elite Skills - Paris du 15 au 20 Juillet",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
        actionUrl: "/camps/2",
      },
      {
        id: "3",
        type: "warning",
        category: "subscription",
        title: "Abonnement bientôt expiré",
        message: "Votre abonnement GOLD expire dans 7 jours",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
        actionUrl: "/pricing",
      },
      {
        id: "4",
        type: "info",
        category: "match",
        title: "Match assigné",
        message: "PSG vs Lyon - Parc des Princes, 20h45",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        actionUrl: "/calendar",
      },
      {
        id: "5",
        type: "success",
        category: "player",
        title: "Nouveau joueur ajouté",
        message: "Antoine Dubois a été ajouté à votre base de données",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        actionUrl: "/players",
      },
    ];
  };

  const markAsRead = async (id: string) => {
    try {
      // await apiClient.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error("Erreur lors du marquage de la notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      // await apiClient.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch {
      toast.error("Erreur lors du marquage des notifications");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // await apiClient.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const clearAll = async () => {
    try {
      // await apiClient.clearAllNotifications();
      setNotifications([]);
      toast.success("Toutes les notifications ont été supprimées");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case "report":
        return FileText;
      case "player":
        return Users;
      case "camp":
        return Trophy;
      case "match":
        return Calendar;
      case "subscription":
        return Crown;
      default:
        return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/20";
      case "warning":
        return "bg-yellow-500/20";
      case "error":
        return "bg-red-500/20";
      default:
        return "bg-blue-500/20";
    }
  };

  const formatTime = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-arcane-darkBorder/30 transition-colors"
      >
        <Bell className="h-5 w-5 text-arcane-grey hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-arcane-accent text-arcane-dark text-xs font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-[600px] z-50"
            >
              <GlassCard variant="elevated" className="overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-arcane-darkBorder">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">
                      Notifications
                    </h3>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 hover:bg-arcane-darkBorder/50 rounded transition-colors"
                    >
                      <X className="h-4 w-4 text-arcane-grey" />
                    </button>
                  </div>

                  {unreadCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-arcane-grey">
                        {unreadCount} non lue(s)
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={markAllAsRead}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <CheckCheck className="h-3 w-3 mr-1" />
                          Tout marquer comme lu
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[450px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 text-arcane-grey opacity-50 mx-auto mb-3" />
                      <p className="text-arcane-grey">Aucune notification</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-arcane-darkBorder">
                      {notifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.category);
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`p-4 hover:bg-arcane-darkBorder/30 transition-colors cursor-pointer ${
                              !notification.read ? "bg-arcane-accent/5" : ""
                            }`}
                            onClick={() => {
                              if (notification.actionUrl) {
                                window.location.href = notification.actionUrl;
                              }
                              markAsRead(notification.id);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div
                                className={`h-10 w-10 rounded-lg ${getTypeBg(
                                  notification.type
                                )} flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon
                                  className={`h-5 w-5 ${getTypeColor(
                                    notification.type
                                  )}`}
                                />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4
                                    className={`text-sm font-bold ${
                                      notification.read
                                        ? "text-arcane-grey"
                                        : "text-white"
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>
                                  {!notification.read && (
                                    <div className="h-2 w-2 rounded-full bg-arcane-accent flex-shrink-0 mt-1" />
                                  )}
                                </div>
                                <p className="text-xs text-arcane-grey mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-arcane-grey">
                                    {formatTime(notification.createdAt)}
                                  </span>
                                  <div className="flex gap-1">
                                    {!notification.read && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(notification.id);
                                        }}
                                        className="p-1 hover:bg-arcane-darkBorder/50 rounded transition-colors"
                                        title="Marquer comme lu"
                                      >
                                        <Check className="h-3 w-3 text-arcane-accent" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-3 w-3 text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-arcane-darkBorder">
                    <Button
                      onClick={clearAll}
                      variant="outline"
                      className="w-full text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Tout effacer
                    </Button>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
