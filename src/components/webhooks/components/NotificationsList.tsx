"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  RefreshCw,
} from "lucide-react";

interface NotificationItem {
  id: string;
  sessionId: string;
  eventType: string;
  eventData: any;
  timestamp: string;
  read: boolean;
  source: "whatsapp" | "external";
  webhookId?: string;
}

interface NotificationsListProps {
  notifications: NotificationItem[];
  loading: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationsList({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationsListProps) {
  const [markingAsRead, setMarkingAsRead] = useState<Set<string>>(new Set());

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "MESSAGES_UPSERT":
        return "bg-blue-500";
      case "CONNECTION_UPDATE":
        return "bg-green-500";
      case "MESSAGES_DELETE":
        return "bg-red-500";
      case "EXTERNAL_WEBHOOK":
      case "test_notification":
        return "bg-purple-500";
      case "CHATS_UPSERT":
        return "bg-yellow-500";
      case "GROUPS_UPSERT":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingAsRead(prev => new Set(prev).add(notificationId));
    try {
      await onMarkAsRead(notificationId);
    } finally {
      setMarkingAsRead(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mr-2" />
          <span>Cargando notificaciones...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notificaciones ({notifications.length})
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} sin leer
              </Badge>
            )}
          </span>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
              Marcar todas como leídas
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay notificaciones</h3>
            <p className="text-gray-500">
              Las notificaciones aparecerán aquí cuando se reciban eventos
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  notification.read 
                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-sm'
                }`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${getEventTypeColor(notification.eventType)}`} 
                      />
                      <span className="font-medium text-sm">
                        {notification.eventType}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {notification.source}
                      </Badge>
                      {!notification.read && (
                        <Badge variant="default" className="text-xs bg-blue-600">
                          Nuevo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Sesión:</span> {notification.sessionId || 'Desconocida'}
                      </p>
                      
                      {notification.webhookId && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Webhook:</span> {notification.webhookId}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                      
                      {/* Mostrar información adicional para mensajes */}
                      {notification.eventType === 'MESSAGES_UPSERT' && 
                       notification.eventData && 
                       Array.isArray(notification.eventData) && 
                       notification.eventData.length > 0 && (
                        <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border text-xs">
                          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                            📱 Mensaje recibido:
                          </p>
                          {notification.eventData.map((msg: any, index: number) => (
                            <div key={index} className="text-gray-600 dark:text-gray-400">
                              {msg?.key?.remoteJid && (
                                <p>
                                  <span className="font-medium">De:</span> {msg.key.remoteJid.replace('@s.whatsapp.net', '')}
                                </p>
                              )}
                              {(msg?.message?.conversation || msg?.message?.extendedTextMessage?.text) && (
                                <p className="italic">
                                  "{(msg.message.conversation || msg.message.extendedTextMessage?.text || '').substring(0, 100)}..."
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      disabled={notification.read || markingAsRead.has(notification.id)}
                      className="min-w-[80px]"
                    >
                      {markingAsRead.has(notification.id) ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : notification.read ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Leída
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Marcar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
