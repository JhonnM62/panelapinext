"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Download, RefreshCw, Trash2 } from "lucide-react";

interface NotificationItem {
  id: string;
  sessionId: string;
  eventType: string;
  eventData: any;
  timestamp: string;
  read: boolean;
  source: "whatsapp" | "external";
}

interface WebhookNotificationsProps {
  notifications: NotificationItem[];
  loading?: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onExport: () => void;
  onRefresh: () => void;
}

export default function WebhookNotifications({
  notifications,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onExport,
  onRefresh
}: WebhookNotificationsProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "MESSAGES_UPSERT": return "bg-blue-500";
      case "CONNECTION_UPDATE": return "bg-green-500";
      case "MESSAGES_DELETE": return "bg-red-500";
      case "test_notification": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {notifications.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4" />
                </Button>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay notificaciones disponibles
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 ${getEventTypeColor(
                          notification.eventType
                        )}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {notification.eventType}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {notification.sessionId}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMarkAsRead(notification.id)}
                        className="shrink-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}