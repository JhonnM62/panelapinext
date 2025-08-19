"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Webhook,
  Bell,
  Settings,
  Send,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Copy,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Code,
  Play,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
  Zap,
  Users,
  MessageSquare,
  Smartphone,
  Lock,
  CreditCard,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

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

interface WebhookConfig {
  userId: string;
  sessionId: string;
  webhookId: string;
  webhookUrl: string;
  clientWebhookUrl?: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  deliverySettings?: {
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
  };
}

interface WebhookStats {
  totalNotifications: number;
  unreadNotifications: number;
  webhookActive: boolean;
  lastNotification: string | null;
  connectedClients: number;
}

interface SessionOption {
  id: string;
  status: string;
  authenticated: boolean;
  webhook?: {
    creado?: boolean;
    activo?: boolean;
    url?: string;
  };
  webhookActivo?: boolean;
  webhookCreado?: boolean;
  webhookUrl?: string | null;
  nombresesion?: string | null;
  phoneNumber?: string | null;
}

// Singleton WebSocket Manager
const globalWebSocketManager = (() => {
  let instance: WebSocket | null = null;
  let connectionPromise: Promise<WebSocket> | null = null;
  let subscribers: Set<(ws: WebSocket | null, connected: boolean) => void> = new Set();
  let lastConnectionUrl: string | null = null;
  let isConnecting = false;
  let connectionId: string | null = null;
  
  const cleanup = () => {
    console.log(`[WS SINGLETON] Cleanup iniciado (ID: ${connectionId})`);
    
    if (instance) {
      console.log('[WS SINGLETON] Cerrando instancia WebSocket existente');
      instance.onopen = null;
      instance.onmessage = null;
      instance.onclose = null;
      instance.onerror = null;
      if (instance.readyState !== WebSocket.CLOSED) {
        instance.close(1000, 'Cleanup');
      }
      instance = null;
    }
    
    connectionPromise = null;
    isConnecting = false;
    lastConnectionUrl = null;
    connectionId = null;
    
    subscribers.forEach(cb => {
      try {
        cb(null, false);
      } catch (error) {
        console.warn('[WS SINGLETON] Error en subscriber callback:', error);
      }
    });
  };
  
  return {
    getInstance: () => instance,
    isConnected: () => instance?.readyState === WebSocket.OPEN,
    subscribe: (callback: (ws: WebSocket | null, connected: boolean) => void) => {
      subscribers.add(callback);
      callback(instance, instance?.readyState === WebSocket.OPEN || false);
      return () => subscribers.delete(callback);
    },
    connect: async (url: string): Promise<WebSocket> => {
      const now = Date.now();
      
      if (instance && instance.readyState === WebSocket.OPEN) {
        console.log('[WS SINGLETON] Reutilizando conexión existente');
        return instance;
      }
      
      if (isConnecting && connectionPromise) {
        console.log('[WS SINGLETON] Esperando conexión en progreso');
        return connectionPromise;
      }
      
      if (instance) {
        instance.close(1000, 'Nueva conexión');
        instance = null;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      isConnecting = true;
      connectionId = `conn_${now}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`[WS SINGLETON] Creando nueva conexión (ID: ${connectionId})`);
      connectionPromise = new Promise((resolve, reject) => {
        try {
          const ws = new WebSocket(url);
          
          const connectionTimeout = setTimeout(() => {
            console.log('[WS SINGLETON] Timeout de conexión');
            isConnecting = false;
            reject(new Error('Connection timeout'));
            if (ws.readyState !== WebSocket.CLOSED) {
              ws.close();
            }
          }, 5000);
          
          ws.onopen = () => {
            clearTimeout(connectionTimeout);
            instance = ws;
            connectionPromise = null;
            isConnecting = false;
            lastConnectionUrl = url;
            console.log(`[WS SINGLETON] Conexión establecida (ID: ${connectionId})`);
            
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'set_connection_id',
                  connectionId: connectionId,
                  timestamp: Date.now()
                }));
              }
            }, 100);
            
            subscribers.forEach(cb => {
              try {
                cb(ws, true);
              } catch (error) {
                console.warn('[WS SINGLETON] Error en subscriber onopen:', error);
              }
            });
            resolve(ws);
          };
          
          ws.onerror = (error) => {
            console.error(`[WS SINGLETON] Error de conexión (ID: ${connectionId}):`, error);
            clearTimeout(connectionTimeout);
            connectionPromise = null;
            isConnecting = false;
            
            subscribers.forEach(cb => {
              try {
                cb(null, false);
              } catch (cbError) {
                console.warn('[WS SINGLETON] Error en subscriber onerror:', cbError);
              }
            });
            reject(error);
          };
          
          ws.onclose = (event) => {
            console.log(`[WS SINGLETON] Conexión cerrada (ID: ${connectionId})`, {
              code: event.code, reason: event.reason
            });
            instance = null;
            connectionPromise = null;
            isConnecting = false;
            connectionId = null;
            
            subscribers.forEach(cb => {
              try {
                cb(null, false);
              } catch (cbError) {
                console.warn('[WS SINGLETON] Error en subscriber onclose:', cbError);
              }
            });
          };
          
        } catch (error) {
          console.error(`[WS SINGLETON] Excepción en creación (ID: ${connectionId}):`, error);
          connectionPromise = null;
          isConnecting = false;
          connectionId = null;
          reject(error);
        }
      });
      
      return connectionPromise;
    },
    cleanup
  };
})();

export default function WebhookManager() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingEvents, setEditingEvents] = useState(false);
  const [tempSelectedEvents, setTempSelectedEvents] = useState<string[]>(["ALL"]);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Cache para prevenir notificaciones duplicadas
  const processedNotificationIds = useRef<Set<string>>(new Set());
  const lastProcessedTime = useRef<number>(0);

  // WebSocket connection usando singleton
  const [wsConnected, setWsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Webhook configuration
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [clientWebhookUrl, setClientWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["MESSAGES_UPSERT"]);
  const [webhookActive, setWebhookActive] = useState(true);

  // Test webhook
  const [testPayload, setTestPayload] = useState("");
  const [testResult, setTestResult] = useState<any>(null);

  // Available events from Baileys API
  const availableEvents = [
    "ALL",
    "MESSAGES_UPSERT",
    "MESSAGES_DELETE",
    "MESSAGES_UPDATE",
    "MESSAGES_RECEIPT_UPDATE",
    "MESSAGES_REACTION",
    "CONNECTION_UPDATE",
    "CHATS_SET",
    "CHATS_UPSERT",
    "CHATS_DELETE",
    "CHATS_UPDATE",
    "CONTACTS_SET",
    "CONTACTS_UPSERT",
    "CONTACTS_UPDATE",
    "GROUPS_UPSERT",
    "GROUPS_UPDATE",
    "GROUP_PARTICIPANTS_UPDATE",
    "PRESENCE_UPDATE",
  ];

  useEffect(() => {
    if (!user) return;

    const initializeData = async () => {
      await loadInitialData();
      
      setTimeout(() => {
        if (sessions.length > 0) {
          cleanupOrphanedWebhooks();
        }
      }, 2000);
    };
    
    initializeData();
    
    // Suscribirse al singleton
    const unsubscribe = globalWebSocketManager.subscribe((ws, connected) => {
      setWs(ws);
      setWsConnected(connected);
      if (ws && connected) {
        setupWebSocketHandlers(ws);
      }
    });
    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      cleanup();
    };
  }, [user]);

  // Conexión WebSocket
  useEffect(() => {
    if (!selectedSessionId || !sessions.length || !user?.nombrebot) {
      return;
    }
    
    // Verificación triple - instancia, estado y handlers
    const existingWs = globalWebSocketManager.getInstance();
    if (existingWs && existingWs.readyState === WebSocket.OPEN) {
      console.log('[WS SINGLETON] Conexión ya activa, verificando handlers');
      
      if (!existingWs.onmessage || existingWs.onmessage.toString().indexOf('authenticate') === -1) {
        console.log('[WS SINGLETON] Configurando handlers en conexión existente');
        setupWebSocketHandlers(existingWs);
      }
      return;
    }
    
    const debounceId = setTimeout(() => {
      if (selectedSessionId && 
          user?.nombrebot && 
          !globalWebSocketManager.isConnected() &&
          !globalWebSocketManager.getInstance()) {
        connectWebSocket().catch(error => {
          console.error(`[WS SINGLETON] Error en conexión:`, error);
        });
      }
    }, 1500);
    
    return () => {
      clearTimeout(debounceId);
    };
  }, [selectedSessionId, sessions.length, user?.nombrebot]);

  const cleanup = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (processedNotificationIds.current.size > 0) {
      processedNotificationIds.current.clear();
      lastProcessedTime.current = 0;
    }
    
    setWsConnected(false);
    setWs(null);
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const loadedSessions = await loadSessions();
      await loadWebhookData(loadedSessions);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('http://100.42.185.2:8015/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        const sessionPromises = data.data.map(async (sessionId: string) => {
          try {
            const statusResponse = await fetch(`http://100.42.185.2:8015/sessions/${sessionId}/status`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            const statusData = await statusResponse.json();
            
            return {
              id: sessionId,
              status: statusData.success ? statusData.data.status : "unknown",
              authenticated: statusData.success ? statusData.data.authenticated || false : false,
              webhook: statusData.success ? statusData.data.webhook : undefined,
              webhookActivo: statusData.success ? statusData.data.webhookActivo || false : false,
              webhookCreado: statusData.success ? statusData.data.webhookCreado || false : false,
              webhookUrl: statusData.success ? statusData.data.webhookUrl : null,
              nombresesion: statusData.success ? statusData.data.nombresesion : null,
              phoneNumber: statusData.success ? statusData.data.phoneNumber : null,
            };
          } catch (error) {
            console.error(`Error obteniendo status para ${sessionId}:`, error);
            return {
              id: sessionId,
              status: "error",
              authenticated: false,
              webhook: undefined,
              webhookActivo: false,
              webhookCreado: false,
              webhookUrl: null,
              nombresesion: null,
              phoneNumber: null,
            };
          }
        });

        const sessionsWithStatus = await Promise.all(sessionPromises);
        setSessions(sessionsWithStatus);

        const firstAuthenticated = sessionsWithStatus.find(s => s.authenticated);
        if (firstAuthenticated && !selectedSessionId) {
          setSelectedSessionId(firstAuthenticated.id);
        }

        return sessionsWithStatus;
      } else {
        setSessions([]);
        return [];
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      setSessions([]);
      return [];
    }
  };

  const loadWebhookData = async (currentSessions?: SessionOption[]) => {
    if (!user?.nombrebot) return;

    const availableSessions = currentSessions || sessions;
    const userId = user.nombrebot;

    try {
      // Load webhook stats
      try {
        const statsResponse = await fetch(
          `http://100.42.185.2:8015/webhook/stats/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();
          if (statsResult.success && statsResult.data) {
            setWebhookStats(statsResult.data);

            if (statsResult.data.webhookActive && statsResult.data.configExists) {
              const webhookSessionExists = availableSessions.some(
                (s) => s.id === statsResult.data.sessionId
              );
              
              if (webhookSessionExists) {
                const webhookConfigData = {
                  userId: userId,
                  sessionId: statsResult.data.sessionId,
                  webhookId: statsResult.data.webhookId || `webhook_${userId}_${Date.now()}`,
                  webhookUrl: statsResult.data.webhookUrl || "",
                  clientWebhookUrl: statsResult.data.clientWebhookUrl || "",
                  events: statsResult.data.events || ["ALL"],
                  active: true,
                  createdAt: statsResult.data.createdAt || new Date().toISOString(),
                  deliverySettings: statsResult.data.deliverySettings,
                };
                
                setWebhookConfig(webhookConfigData);
                setSelectedSessionId(statsResult.data.sessionId);
                setSelectedEvents(webhookConfigData.events);
                setTempSelectedEvents(webhookConfigData.events);
                setClientWebhookUrl(webhookConfigData.clientWebhookUrl || "");
              }
            }
          }
        }
      } catch (statsError) {
        console.warn("Error cargando stats:", statsError);
      }

      // Load notifications
      try {
        const notificationsResponse = await fetch(
          `http://100.42.185.2:8015/webhook/notifications/${userId}?limit=50&offset=0`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (notificationsResponse.ok) {
          const notificationsResult = await notificationsResponse.json();
          if (notificationsResult.success && notificationsResult.data) {
            const notificationsData = Array.isArray(notificationsResult.data.notifications)
              ? notificationsResult.data.notifications
              : Array.isArray(notificationsResult.data)
              ? notificationsResult.data
              : [];

            setNotifications(notificationsData);
          } else {
            setNotifications([]);
          }
        } else {
          setNotifications([]);
        }
      } catch (notificationsError) {
        console.warn("Error cargando notificaciones:", notificationsError);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error general loading webhook data:", error);
      setNotifications([]);
      if (!webhookStats) {
        setWebhookStats({
          totalNotifications: 0,
          unreadNotifications: 0,
          webhookActive: false,
          lastNotification: null,
          connectedClients: 0,
        });
      }
    }
  };

  const connectWebSocket = async () => {
    if (!user?.nombrebot || !selectedSessionId) {
      return;
    }

    if (globalWebSocketManager.isConnected()) {
      return;
    }

    try {
      await globalWebSocketManager.connect("ws://100.42.185.2:8015/ws");
    } catch (error) {
      console.error('[WS SINGLETON] Error conectando:', error);
      setWsConnected(false);
      setWs(null);
      
      if (user?.nombrebot && selectedSessionId && !globalWebSocketManager.isConnected()) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (user?.nombrebot && selectedSessionId && !globalWebSocketManager.isConnected()) {
            connectWebSocket();
          }
        }, 5000);
      }
    }
  };

  const setupWebSocketHandlers = (ws: WebSocket) => {
    if (!ws || !user?.nombrebot) return;
    
    if (ws.onmessage && ws.onmessage.toString().includes('authenticate')) {
      return;
    }
    
    ws.onmessage = null;
    ws.onerror = null;
    
    const sessionUserId = selectedSessionId ? 
      sessions.find(s => s.id === selectedSessionId)?.nombresesion || user.nombrebot :
      user.nombrebot;
      
    ws.send(JSON.stringify({
      type: "authenticate",
      userId: sessionUserId,
    }));
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "authenticated":
            if (message.stats) setWebhookStats(message.stats);
            break;

          case "notification":
            if (message.data) {
              const formattedNotification = {
                id: message.data.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId: message.data.sessionId || "",
                eventType: message.data.eventType || "UNKNOWN",
                eventData: message.data.data || message.data.eventData || {},
                timestamp: message.data.timestamp || new Date().toISOString(),
                read: message.data.read || false,
                source: "whatsapp",
              };
              handleNewNotification(formattedNotification);
            }
            break;

          case "notifications":
            const notificationsData = Array.isArray(message.data) ? message.data : [];
            setNotifications(notificationsData);
            break;

          case "notificationMarkedAsRead":
            setNotifications(prev => {
              const prevArray = Array.isArray(prev) ? prev : [];
              return prevArray.map(n => 
                n.id === message.notificationId ? { ...n, read: true } : n
              );
            });
            break;

          case "error":
            console.warn("[WS SINGLETON] Mensaje del servidor:", message.message || message.error || 'Sin detalles');
            break;
            
          case "ping":
          case "pong": 
          case "heartbeat":
            break;

          default:
            if (message.type && typeof message.type === "string" && message.type.includes("_")) {
              const eventNotification = {
                id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId: sessionUserId,
                eventType: message.type,
                eventData: message.data || message,
                timestamp: new Date().toISOString(),
                read: false,
                source: "whatsapp",
              };
              handleNewNotification(eventNotification);
            }
        }
      } catch (error) {
        console.error("[WS SINGLETON] Error procesando mensaje:", error);
      }
    };
  };

  const handleNewNotification = (notification: NotificationItem) => {
    const now = Date.now();

    if (!notification.id || !notification.eventType) {
      console.warn("[WEBHOOK WS] Notificación inválida:", notification);
      return;
    }

    if (processedNotificationIds.current.has(notification.id)) {
      return;
    }

    if (now - lastProcessedTime.current > 300000) {
      processedNotificationIds.current.clear();
    }

    processedNotificationIds.current.add(notification.id);
    lastProcessedTime.current = now;

    if (processedNotificationIds.current.size > 100) {
      const oldestIds = Array.from(processedNotificationIds.current).slice(0, 50);
      oldestIds.forEach(id => processedNotificationIds.current.delete(id));
    }

    setNotifications((prev) => {
      const prevArray = Array.isArray(prev) ? prev : [];

      const existingIndex = prevArray.findIndex(n => n.id === notification.id);
      
      if (existingIndex >= 0) {
        const updatedArray = [...prevArray];
        updatedArray[existingIndex] = notification;
        return updatedArray;
      }

      return [notification, ...prevArray.slice(0, 49)];
    });

    setWebhookStats((prev) => {
      const newStats = prev
        ? {
            ...prev,
            totalNotifications: prev.totalNotifications + 1,
            unreadNotifications: prev.unreadNotifications + (notification.read ? 0 : 1),
            lastNotification: notification.timestamp,
          }
        : {
            totalNotifications: 1,
            unreadNotifications: notification.read ? 0 : 1,
            webhookActive: true,
            lastNotification: notification.timestamp,
            connectedClients: 1,
          };

      return newStats;
    });

    if (!notification.read && notification.eventType === 'MESSAGES_UPSERT') {
      toast({
        title: "📨 Nuevo Mensaje",
        description: `Mensaje entrante en sesión ${notification.sessionId || "desconocida"}`,
        duration: 3000,
      });
    }
  };

  const createWebhook = async () => {
    if (!selectedSessionId) {
      toast({
        title: "Error",
        description: "Debes seleccionar una sesión activa",
        variant: "destructive",
      });
      return;
    }

    if (!user?.nombrebot) {
      toast({
        title: "Error",
        description: "No se pudo obtener el usuario actual",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const sessionUserId = sessions.find(s => s.id === selectedSessionId)?.nombresesion || user.nombrebot;
      
      const requestBody = {
        userId: sessionUserId,
        sessionId: selectedSessionId,
        events: selectedEvents,
        webhookUrl: clientWebhookUrl || null,
      };

      const response = await fetch("http://100.42.185.2:8015/webhook/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setWebhookConfig({
          userId: result.data.userId,
          sessionId: result.data.sessionId,
          webhookId: result.data.id || result.data.webhookId,
          webhookUrl: result.data.webhookUrl,
          clientWebhookUrl: result.data.clientWebhookUrl,
          events: result.data.events,
          active: result.data.active,
          createdAt: result.data.createdAt,
          deliverySettings: result.data.deliverySettings,
        });

        toast({
          title: "✅ Webhook Creado",
          description: `Webhook configurado para sesión ${result.data.sessionId}`,
        });

        setTimeout(async () => {
          const reloadedSessions = await loadSessions();
          await loadWebhookData(reloadedSessions);
        }, 1000);

        setActiveTab("config");
        const initialSessions = await loadSessions();
        await loadWebhookData(initialSessions);
      } else {
        throw new Error(result.message || "Error desconocido del servidor");
      }
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo crear el webhook",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.nombrebot) return;

    try {
      const sessionUserId = selectedSessionId ? 
        sessions.find(s => s.id === selectedSessionId)?.nombresesion || user.nombrebot :
        user.nombrebot;

      const response = await fetch(
        `http://100.42.185.2:8015/webhook/notifications/${sessionUserId}/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ read: true }),
        }
      );

      if (response.ok) {
        setNotifications((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          );
        });

        setWebhookStats((prev) =>
          prev
            ? {
                ...prev,
                unreadNotifications: Math.max(0, prev.unreadNotifications - 1),
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const refreshedSessions = await loadSessions();
      await loadWebhookData(refreshedSessions);

      toast({
        title: "🔄 Actualizado",
        description: "Datos actualizados correctamente",
      });
    } finally {
      setRefreshing(false);
    }
  };

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

  const cleanupOrphanedWebhooks = async () => {
    // Implementación básica de limpieza
    console.log('Verificando webhooks órfanos...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando sistema de webhooks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <Bell className="h-6 w-6 flex-shrink-0 text-blue-600" />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">
                {webhookStats?.totalNotifications || 0}
              </p>
              <p className="text-xs text-gray-600 truncate">
                Total Notificaciones
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-orange-600" />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">
                {webhookStats?.unreadNotifications || 0}
              </p>
              <p className="text-xs text-gray-600 truncate">Sin Leer</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <Activity
              className={`h-6 w-6 flex-shrink-0 ${
                wsConnected ? "text-green-600" : "text-red-600"
              }`}
            />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">
                {wsConnected ? "Conectado" : "Desconectado"}
              </p>
              <p className="text-xs text-gray-600 truncate">WebSocket</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <Webhook
              className={`h-6 w-6 flex-shrink-0 ${
                webhookStats?.webhookActive ? "text-green-600" : "text-gray-600"
              }`}
            />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">
                {webhookStats?.webhookActive ? "Activo" : "Inactivo"}
              </p>
              <p className="text-xs text-gray-600 truncate">Webhook</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-4">
            <Users className="h-6 w-6 flex-shrink-0 text-purple-600" />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">
                {webhookStats?.connectedClients || 0}
              </p>
              <p className="text-xs text-gray-600 truncate">
                Clientes Conectados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navegación de tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
              {(webhookStats?.unreadNotifications || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 py-0 text-xs flex items-center justify-center">
                  {webhookStats.unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Pruebas
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Tab: Resumen */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Estado del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        wsConnected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">Conexión WebSocket</span>
                    </div>
                    <Badge variant={wsConnected ? 'default' : 'destructive'}>
                      {wsConnected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        webhookStats?.webhookActive ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="font-medium">Webhooks</span>
                    </div>
                    <Badge variant={webhookStats?.webhookActive ? 'default' : 'secondary'}>
                      {webhookStats?.webhookActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">{notification.eventType}</p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        <Badge variant={notification.read ? 'secondary' : 'default'}>
                          {notification.read ? 'Leído' : 'Nuevo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Notificaciones */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notificaciones ({notifications.length})
                </span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => {
                    notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
                  }}>
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
                  <p className="text-gray-500">Las notificaciones aparecerán aquí cuando se reciban eventos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${getEventTypeColor(notification.eventType)}`} />
                            <span className="font-medium text-sm">{notification.eventType}</span>
                            <Badge variant="outline" className="text-xs">
                              {notification.source}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            Sesión: {notification.sessionId || 'Desconocida'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="config">
          <div className="space-y-6">
            {!webhookConfig ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Crear Webhook
                  </CardTitle>
                  <CardDescription>
                    Configura un webhook para recibir notificaciones en tiempo real
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Sesión de WhatsApp</Label>
                    <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una sesión" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.filter(s => s.authenticated).map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>{session.id}</span>
                              {session.phoneNumber && (
                                <Badge variant="secondary" className="text-xs">
                                  {session.phoneNumber}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>URL Cliente (Opcional)</Label>
                    <Input
                      value={clientWebhookUrl}
                      onChange={(e) => setClientWebhookUrl(e.target.value)}
                      placeholder="https://tu-servidor.com/webhook"
                    />
                  </div>

                  <div>
                    <Label>Eventos a Escuchar</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {availableEvents.map((event) => (
                        <Button
                          key={event}
                          variant={selectedEvents.includes(event) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (event === "ALL") {
                              setSelectedEvents(["ALL"]);
                            } else {
                              setSelectedEvents((prev) => {
                                const filtered = prev.filter((e) => e !== "ALL");
                                if (filtered.includes(event)) {
                                  const newEvents = filtered.filter((e) => e !== event);
                                  return newEvents.length === 0 ? ["ALL"] : newEvents;
                                } else {
                                  return [...filtered, event];
                                }
                              });
                            }
                          }}
                          className="justify-start text-xs"
                        >
                          {event}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={createWebhook}
                    disabled={creating || !selectedSessionId}
                    className="w-full"
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Crear Webhook
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Webhook className="h-5 w-5 mr-2" />
                      Webhook Configurado
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>ID del Webhook</Label>
                      <Input value={webhookConfig.webhookId} disabled />
                    </div>
                    <div>
                      <Label>Sesión</Label>
                      <Input value={webhookConfig.sessionId} disabled />
                    </div>
                  </div>

                  <div>
                    <Label>URL del Webhook</Label>
                    <div className="flex gap-2">
                      <Input value={webhookConfig.webhookUrl} disabled className="flex-1" />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(webhookConfig.webhookUrl);
                          toast({
                            title: "📋 Copiado",
                            description: "URL copiada al portapapeles",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {webhookConfig.clientWebhookUrl && (
                    <div>
                      <Label>URL Cliente</Label>
                      <Input value={webhookConfig.clientWebhookUrl} disabled />
                    </div>
                  )}

                  <div>
                    <Label>Eventos Configurados</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {webhookConfig.events.map((event) => (
                        <Badge key={event} variant="default">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>Estado del Webhook</span>
                    <Badge variant={webhookConfig.active ? 'default' : 'secondary'}>
                      {webhookConfig.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Pruebas */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="h-5 w-5 mr-2" />
                Probar Webhook
              </CardTitle>
              <CardDescription>
                Envía un webhook de prueba para verificar la configuración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!webhookConfig ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay webhook configurado para probar</p>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Payload de Prueba (JSON)</Label>
                    <Textarea
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      placeholder={JSON.stringify({
                        type: "test_notification",
                        data: {
                          message: "Webhook de prueba desde el panel de control",
                          timestamp: new Date().toISOString(),
                          source: "dashboard"
                        }
                      }, null, 2)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      // Test webhook functionality
                      console.log('Testing webhook...');
                    }}
                    disabled={testing}
                    className="w-full"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Prueba
                      </>
                    )}
                  </Button>

                  {testResult && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Resultado de la Prueba</h4>
                      <pre className="text-sm bg-white p-2 rounded border overflow-auto">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este webhook? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowDeleteDialog(false);
                // Delete webhook functionality
                console.log('Deleting webhook...');
              }}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}