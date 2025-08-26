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
import { sessionsAPI, authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { WebhooksSkeleton } from "@/components/skeletons";

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
  // 🔧 SOLUCION: Incluir propiedades del webhook
  webhook?: {
    creado?: boolean;
    activo?: boolean;
    url?: string;
  };
  webhookActivo?: boolean;
  webhookCreado?: boolean;
  webhookUrl?: string | null;
  // 🔧 SOLUCION: Añadir nombre de sesión y teléfono
  nombresesion?: string | null;
  phoneNumber?: string | null;
}

// 🔧 SINGLETON FINAL AGRESIVO: Garantía absoluta de 1 conexión
const globalWebSocketManager = (() => {
  let instance: WebSocket | null = null;
  let connectionPromise: Promise<WebSocket> | null = null;
  let connectionAttempt = false;
  let subscribers: Set<(ws: WebSocket | null, connected: boolean) => void> =
    new Set();
  let lastConnectionUrl: string | null = null;
  let isConnecting = false;
  let connectionInProgress = false;
  let lastConnectionTime = 0;
  let globalConnectionLock = false; // 🚀 FINAL: Lock global de conexión
  let forcedSingletonMode = true; // 🚀 FINAL: Modo singleton forzado
  let connectionId: string | null = null; // 🚀 FINAL: ID único de conexión

  const cleanup = () => {
    console.log(
      `[WS SINGLETON] 🧹 FINAL CLEANUP iniciado (ID: ${connectionId})`
    );

    if (instance) {
      console.log("[WS SINGLETON] 🧹 Cerrando instancia WebSocket existente");
      instance.onopen = null;
      instance.onmessage = null;
      instance.onclose = null;
      instance.onerror = null;
      if (instance.readyState !== WebSocket.CLOSED) {
        instance.close(1000, "Final cleanup");
      }
      instance = null;
    }

    // 🚀 FINAL: Limpiar TODOS los flags y locks
    connectionPromise = null;
    connectionAttempt = false;
    isConnecting = false;
    connectionInProgress = false;
    globalConnectionLock = false;
    lastConnectionUrl = null;
    lastConnectionTime = 0;
    connectionId = null;

    console.log("[WS SINGLETON] 🧹 Notificando a subscribers del cleanup");
    subscribers.forEach((cb) => {
      try {
        cb(null, false);
      } catch (error) {
        console.warn("[WS SINGLETON] Error en subscriber callback:", error);
      }
    });

    console.log("[WS SINGLETON] ✅ FINAL CLEANUP completado");
  };

  return {
    getInstance: () => instance,
    isConnected: () => instance?.readyState === WebSocket.OPEN,
    subscribe: (
      callback: (ws: WebSocket | null, connected: boolean) => void
    ) => {
      subscribers.add(callback);
      // Immediately notify current state
      callback(instance, instance?.readyState === WebSocket.OPEN || false);
      return () => subscribers.delete(callback);
    },
    connect: async (url: string): Promise<WebSocket> => {
      const now = Date.now();

      // 🚀 FINAL: Lock global absoluto
      if (globalConnectionLock) {
        console.log(
          "[WS SINGLETON] 🔒 FINAL LOCK: Conexión bloqueada por lock global"
        );
        if (instance && instance.readyState === WebSocket.OPEN) {
          return instance;
        }
        throw new Error("Lock global activo - solo 1 conexión permitida");
      }

      // 🚀 FINAL: Verificación de singleton forzado
      if (
        forcedSingletonMode &&
        instance &&
        instance.readyState === WebSocket.OPEN
      ) {
        console.log(
          "[WS SINGLETON] 🎯 FINAL: Modo singleton - reutilizando conexión única"
        );
        return instance;
      }

      // 🚀 FINAL: Rate limiting agresivo (3 segundos)
      if (now - lastConnectionTime < 3000) {
        console.log(
          "[WS SINGLETON] ⏱️ FINAL BLOCK: Rate limiting agresivo activo"
        );
        if (instance && instance.readyState === WebSocket.OPEN) {
          return instance;
        }
        throw new Error("Rate limiting agresivo activo");
      }

      // 🚀 FINAL: Triple verificación de estado
      if (isConnecting || connectionInProgress || globalConnectionLock) {
        console.log(
          "[WS SINGLETON] 🛑 FINAL BLOCK: Triple verificación falló",
          {
            isConnecting,
            connectionInProgress,
            globalConnectionLock,
          }
        );
        if (connectionPromise) return connectionPromise;
        throw new Error("Múltiples flags de bloqueo activos");
      }

      // 🚀 FINAL: Forzar cierre de conexión existente
      if (instance) {
        console.log(
          "[WS SINGLETON] 💥 FINAL: Forzando cierre de conexión existente"
        );
        instance.close(1000, "Forced singleton cleanup");
        instance = null;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // 🚀 FINAL: Activar TODOS los locks
      isConnecting = true;
      connectionInProgress = true;
      globalConnectionLock = true;
      lastConnectionTime = now;
      connectionId = `conn_${now}_${Math.random().toString(36).substr(2, 9)}`;

      // 🚀 FINAL: Crear conexión única absoluta
      console.log(
        `[WS SINGLETON] 🎯 FINAL: Creando conexión ÚNICA (ID: ${connectionId})...`
      );
      connectionPromise = new Promise((resolve, reject) => {
        try {
          const ws = new WebSocket(url);

          const connectionTimeout = setTimeout(() => {
            console.log("[WS SINGLETON] ⏰ FINAL: Timeout de conexión");
            isConnecting = false;
            connectionInProgress = false;
            globalConnectionLock = false;
            reject(new Error("Connection timeout"));
            if (ws.readyState !== WebSocket.CLOSED) {
              ws.close();
            }
          }, 5000);

          ws.onopen = () => {
            clearTimeout(connectionTimeout);
            instance = ws;
            connectionPromise = null;
            isConnecting = false;
            connectionInProgress = false;
            // 🚀 FINAL: Mantener globalConnectionLock para prevenir otras conexiones
            lastConnectionUrl = url;
            console.log(
              `[WS SINGLETON] 🎯 FINAL: Conexión ÚNICA establecida (ID: ${connectionId})`
            );

            // 🚀 FINAL: Enviar identificador único al backend
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "set_connection_id",
                    connectionId: connectionId,
                    timestamp: Date.now(),
                  })
                );
              }
            }, 100);

            subscribers.forEach((cb) => {
              try {
                cb(ws, true);
              } catch (error) {
                console.warn(
                  "[WS SINGLETON] Error en subscriber onopen:",
                  error
                );
              }
            });
            resolve(ws);
          };

          ws.onerror = (error) => {
            console.error(
              `[WS SINGLETON] ❌ FINAL: Error de conexión (ID: ${connectionId}):`,
              error
            );
            clearTimeout(connectionTimeout);
            connectionPromise = null;
            isConnecting = false;
            connectionInProgress = false;
            globalConnectionLock = false;

            subscribers.forEach((cb) => {
              try {
                cb(null, false);
              } catch (cbError) {
                console.warn(
                  "[WS SINGLETON] Error en subscriber onerror:",
                  cbError
                );
              }
            });
            reject(error);
          };

          ws.onclose = (event) => {
            console.log(
              `[WS SINGLETON] 🔴 FINAL: Conexión cerrada (ID: ${connectionId})`,
              {
                code: event.code,
                reason: event.reason,
              }
            );
            instance = null;
            connectionPromise = null;
            isConnecting = false;
            connectionInProgress = false;
            globalConnectionLock = false;
            connectionId = null;

            subscribers.forEach((cb) => {
              try {
                cb(null, false);
              } catch (cbError) {
                console.warn(
                  "[WS SINGLETON] Error en subscriber onclose:",
                  cbError
                );
              }
            });
          };
        } catch (error) {
          console.error(
            `[WS SINGLETON] ❌ FINAL: Excepción en creación (ID: ${connectionId}):`,
            error
          );
          connectionPromise = null;
          isConnecting = false;
          connectionInProgress = false;
          globalConnectionLock = false;
          connectionId = null;
          reject(error);
        }
      });

      return connectionPromise;
    },
    cleanup,
  };
})();

export default function WebhooksComponent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(
    null
  );
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingEvents, setEditingEvents] = useState(false);
  const [tempSelectedEvents, setTempSelectedEvents] = useState<string[]>([
    "ALL",
  ]);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 🔧 NUEVA: Cache para prevenir notificaciones duplicadas
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
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "MESSAGES_UPSERT",
  ]);
  const [webhookActive, setWebhookActive] = useState(true);

  // Test webhook
  const [testPayload, setTestPayload] = useState("");
  const [testResult, setTestResult] = useState<any>(null);

  // Available events from Baileys API - 🆕 OPTIMIZADO para tipos de mensaje
  const availableEvents = [
    "ALL", // Todos los eventos
    "MESSAGES_UPSERT", // 📩 SOLO MENSAJES ENTRANTES (recomendado para chatbots)
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

      // Verificar webhooks órfanos después de cargar sesiones
      setTimeout(() => {
        if (sessions.length > 0) {
          cleanupOrphanedWebhooks();
        }
      }, 2000);
    };

    initializeData();

    // 🔧 SUSCRIBIRSE AL SINGLETON
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

  // 🔧 ULTRA MEJORADO: Conexión WebSocket con máxima protección contra duplicados
  useEffect(() => {
    if (!selectedSessionId || !sessions.length || !user?.nombrebot) {
      console.log(
        "[WS SINGLETON] ⚠️ ULTRA: Condiciones no cumplidas para conexión",
        {
          selectedSessionId: !!selectedSessionId,
          sessionsLength: sessions.length,
          userNombrebot: !!user?.nombrebot,
        }
      );
      return;
    }

    console.log(
      `[WS SINGLETON] 🔄 ULTRA: Solicitud de conexión para sesión: ${selectedSessionId}`
    );

    // 🆕 ULTRA: Verificación triple - instancia, estado y handlers
    const existingWs = globalWebSocketManager.getInstance();
    if (existingWs && existingWs.readyState === WebSocket.OPEN) {
      console.log(
        "[WS SINGLETON] ⚠️ ULTRA: Conexión ya activa, verificando handlers"
      );

      // Solo configurar handlers si no existen
      if (
        !existingWs.onmessage ||
        existingWs.onmessage.toString().indexOf("authenticate") === -1
      ) {
        console.log(
          "[WS SINGLETON] 🔧 ULTRA: Configurando handlers en conexión existente"
        );
        setupWebSocketHandlers(existingWs);
      } else {
        console.log(
          "[WS SINGLETON] ✅ ULTRA: Handlers ya configurados, no hay nada que hacer"
        );
      }
      return;
    }

    // 🆕 ULTRA: ID único por efecto para prevenir overlapping
    const effectId = `effect_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    console.log(`[WS SINGLETON] 🆔 ULTRA: Effect ID: ${effectId}`);

    // 🆕 ULTRA: Debounce más largo + verificación final
    const debounceId = setTimeout(() => {
      // Triple verificación antes de conectar
      if (
        selectedSessionId &&
        user?.nombrebot &&
        !globalWebSocketManager.isConnected() &&
        !globalWebSocketManager.getInstance()
      ) {
        console.log(`[WS SINGLETON] 🚀 ULTRA: Iniciando conexión ${effectId}`);
        connectWebSocket().catch((error) => {
          console.error(
            `[WS SINGLETON] ❌ ULTRA: Error en conexión ${effectId}:`,
            error
          );
        });
      } else {
        console.log(`[WS SINGLETON] 🚫 ULTRA: Conexión cancelada ${effectId}`, {
          selectedSessionId: !!selectedSessionId,
          userNombrebot: !!user?.nombrebot,
          isConnected: globalWebSocketManager.isConnected(),
          hasInstance: !!globalWebSocketManager.getInstance(),
        });
      }
    }, 1500); // Aumentado a 1.5 segundos

    return () => {
      console.log(`[WS SINGLETON] 🧹 ULTRA: Limpiando effect ${effectId}`);
      clearTimeout(debounceId);
    };
  }, [selectedSessionId, sessions.length, user?.nombrebot]); // Dependencias estables

  // 🔧 NUEVO: Limpiar notificaciones cuando cambien las sesiones
  useEffect(() => {
    if (sessions.length > 0) {
      console.log(
        "🧹 [WEBHOOK CLEANUP] Sesiones cambiaron, verificando notificaciones..."
      );
      cleanupOrphanedNotifications(sessions);
    }
  }, [sessions]);

  // 🔧 NUEVO: Limpieza automática periódica + cache
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (sessions.length >= 0) {
        // Ejecutar siempre, incluso si no hay sesiones
        console.log("🧹 [WEBHOOK CLEANUP] Limpieza automática periódica...");
        cleanupOrphanedNotifications(sessions);

        // 🔧 NUEVA: Limpiar cache de IDs periódicamente
        const now = Date.now();
        if (now - lastProcessedTime.current > 300000) {
          // 5 minutos
          console.log(
            "🧹 [WEBHOOK CLEANUP] Limpiando cache de IDs por timeout"
          );
          processedNotificationIds.current.clear();
          lastProcessedTime.current = now;
        }
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(cleanupInterval);
  }, [sessions, notifications]);

  const cleanup = () => {
    console.log("[WS SINGLETON] 🧹 Ejecutando cleanup completo...");

    // 🔧 MEJORADO: Limpiar TODOS los timeouts pendientes
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
      console.log("[WS SINGLETON] 🔥 Timeout de reconexión cancelado");
    }

    // 🔧 NUEVA: Limpiar cache de notificaciones
    if (processedNotificationIds.current.size > 0) {
      console.log(
        "[WS SINGLETON] 🧹 Limpiando cache de notificaciones procesadas"
      );
      processedNotificationIds.current.clear();
      lastProcessedTime.current = 0;
    }

    // 🔧 NUEVA: Limpiar estado de WebSocket local
    setWsConnected(false);
    setWs(null);

    console.log("[WS SINGLETON] ✅ Cleanup completado");
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // 🔧 ORDEN CORRECTO: Primero cargar sesiones, luego webhooks
      console.log("🔍 [WEBHOOKS] Iniciando carga de datos - Paso 1: Sesiones");
      const loadedSessions = await loadSessions();

      console.log("🔍 [WEBHOOKS] Iniciando carga de datos - Paso 2: Webhooks");
      await loadWebhookData(loadedSessions);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    console.log("🚀 [WEBHOOK SESSIONS] Cargando sesiones...");
    try {
      // 🔧 CORRECCIÓN: Usar listForUser para obtener solo las sesiones del usuario autenticado
      const token = user?.token;
      if (!token) {
        console.warn("🚀 [WEBHOOK SESSIONS] No hay token disponible");
        setSessions([]);
        return [];
      }

      const response = await sessionsAPI.listForUser(token);
      console.log(
        "🚀 [WEBHOOK SESSIONS] Response from sessionsAPI.listForUser():",
        response
      );

      if (response.success && response.data) {
        console.log("🚀 [WEBHOOK SESSIONS] Sessions data:", response.data);

        // 🔧 CORRECCIÓN: listForUser devuelve objetos de sesión, no solo IDs
        // Extraer los IDs de las sesiones para obtener el status
        const sessionIds = response.data.map(
          (sesion: any) => sesion._id || sesion.id
        );
        console.log("🚀 [WEBHOOK SESSIONS] Session IDs extraídos:", sessionIds);

        // Convert session IDs to session objects with status
        const sessionPromises = sessionIds.map(async (sessionId: string) => {
          try {
            console.log(
              "🚀 [WEBHOOK SESSIONS] Obteniendo status para sesión:",
              sessionId
            );
            const statusResponse = await sessionsAPI.status(sessionId);
            console.log(
              `🚀 [WEBHOOK SESSIONS] Status response para ${sessionId}:`,
              statusResponse
            );

            // 🔧 CORRECCIÓN: Obtener información adicional de la sesión desde response.data
            const sesionInfo = response.data.find(
              (s: any) => (s._id || s.id) === sessionId
            );

            return {
              id: sessionId,
              status: statusResponse.success
                ? statusResponse.data.status
                : "unknown",
              authenticated: statusResponse.success
                ? statusResponse.data.authenticated || false
                : false,
              // 🔧 SOLUCION: Incluir información del webhook del backend
              webhook: statusResponse.success
                ? statusResponse.data.webhook
                : undefined,
              webhookActivo: statusResponse.success
                ? (statusResponse.data as any)?.webhookActivo || false
                : false,
              webhookCreado: statusResponse.success
                ? (statusResponse.data as any)?.webhookCreado || false
                : false,
              webhookUrl: statusResponse.success
                ? (statusResponse.data as any)?.webhookUrl
                : null,
              // 🔧 CORRECCIÓN: Usar información de la sesión desde la BD
              nombresesion:
                sesionInfo?.nombresesion ||
                (statusResponse.success
                  ? (statusResponse.data as any)?.nombresesion
                  : null),
              phoneNumber:
                sesionInfo?.lineaWhatsApp ||
                (statusResponse.success
                  ? (statusResponse.data as any)?.phoneNumber
                  : null),
            };
          } catch (error) {
            console.error(
              `🚀 [WEBHOOK SESSIONS] Error obteniendo status para ${sessionId}:`,
              error
            );
            // 🔧 CORRECCIÓN: Obtener información de la sesión incluso en caso de error
            const sesionInfo = response.data.find(
              (s: any) => (s._id || s.id) === sessionId
            );

            return {
              id: sessionId,
              status: "error",
              authenticated: false,
              // 🔧 SOLUCION: Inicializar propiedades del webhook también en caso de error
              webhook: undefined,
              webhookActivo: false,
              webhookCreado: false,
              webhookUrl: null,
              // 🔧 CORRECCIÓN: Usar información de la sesión desde la BD incluso en error
              nombresesion: sesionInfo?.nombresesion || null,
              phoneNumber: sesionInfo?.lineaWhatsApp || null,
            };
          }
        });

        const sessionsWithStatus = await Promise.all(sessionPromises);
        console.log(
          "🚀 [WEBHOOK SESSIONS] Sessions con status:",
          sessionsWithStatus
        );
        setSessions(sessionsWithStatus);

        // 🔧 NUEVA FUNCIONALIDAD: Limpiar notificaciones órfanas
        cleanupOrphanedNotifications(sessionsWithStatus);

        // Auto-select first authenticated session
        const firstAuthenticated = sessionsWithStatus.find(
          (s) => s.authenticated
        );
        console.log(
          "🚀 [WEBHOOK SESSIONS] Primera sesión autenticada:",
          firstAuthenticated
        );

        if (firstAuthenticated && !selectedSessionId) {
          console.log(
            "🚀 [WEBHOOK SESSIONS] Auto-seleccionando sesión:",
            firstAuthenticated.id
          );
          setSelectedSessionId(firstAuthenticated.id);
        }

        // 🔧 RETORNAR SESIONES PARA USO INMEDIATO
        return sessionsWithStatus;
      } else {
        console.warn(
          "🚀 [WEBHOOK SESSIONS] No se encontraron sesiones en la respuesta"
        );
        setSessions([]);

        // 🔧 Si no hay sesiones, limpiar todas las notificaciones
        cleanupOrphanedNotifications([]);

        return [];
      }
    } catch (error) {
      console.error("🚀 [WEBHOOK SESSIONS] Error loading sessions:", error);
      setSessions([]);
      return [];
    }
  };

  const loadWebhookData = async (currentSessions?: SessionOption[]) => {
    if (!user?.token && !user?.nombrebot) return;

    // 🔧 USAR SESIONES ACTUALES O LAS PASADAS COMO PARAMETRO
    const availableSessions = currentSessions || sessions;

    console.log(
      "🔍 [WEBHOOKS] Cargando datos de webhook con sesiones:",
      availableSessions.length
    );

    try {
      // **MEJORA: Intentar usar el nuevo endpoint de dashboard primero**
      if (user?.token) {
        try {
          console.log("🔍 [WEBHOOKS] Usando endpoint dashboard mejorado...");
          const dashboardResponse = await authAPI.getDashboardData(user.token);

          if (dashboardResponse.success && dashboardResponse.data) {
            const data = dashboardResponse.data;

            // Crear estadísticas de webhook desde datos del dashboard
            const sesiones = data.sesiones || [];
            const webhooksActivos = sesiones.filter(
              (s: any) =>
                s.webhook?.activo || s.webhookActivo || s.webhookCreado
            ).length;
            const sesionesConectadas = data.estadisticas?.sesionesActivas || 0;

            console.log("🔍 [WEBHOOKS] Procesando sesiones del dashboard:", {
              totalSesiones: sesiones.length,
              webhooksActivos,
              sesionesConectadas,
              sesionesSample: sesiones.slice(0, 2),
            });

            setWebhookStats({
              totalNotifications: 0, // Se calcula después
              unreadNotifications: 0, // Se calcula después
              webhookActive: webhooksActivos > 0,
              lastNotification: null, // Se obtiene después
              connectedClients: sesionesConectadas,
            });

            console.log(
              "🔍 [WEBHOOKS] Datos del dashboard cargados exitosamente"
            );

            // 🔧 CORRECCIÓN: NO auto-sincronizar webhooks - solo cargar si existen explícitamente
            console.log(
              "🔍 [WEBHOOKS] Verificando webhooks existentes explícitos..."
            );
            await cargarWebhooksExistentes(availableSessions);
          }
        } catch (dashboardError) {
          console.warn(
            "🔍 [WEBHOOKS] Fallback: dashboard endpoint no disponible",
            dashboardError
          );

          // 🔧 FALLBACK COMPLETO: Si no tenemos dashboard, intentar directamente con stats
          try {
            const userId = user?.nombrebot || user?.email || user?.id;
            if (userId) {
              console.log(
                "🔍 [WEBHOOKS] Intentando obtener webhook stats directamente..."
              );

              const statsResponse = await fetch(
                `https://backend.autosystemprojects.site/webhook/stats/${userId}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              if (statsResponse.ok) {
                const statsResult = await statsResponse.json();

                if (
                  statsResult.success &&
                  statsResult.data &&
                  statsResult.data.configExists
                ) {
                  console.log(
                    "🔍 [WEBHOOKS] Webhook encontrado en stats directas:",
                    statsResult.data
                  );

                  // 🔧 VALIDACION CRITICA: Verificar sesiones antes de configurar webhook
                  if (availableSessions.length === 0) {
                    console.log(
                      "⚠️ [WEBHOOKS] WEBHOOK ÓRFANO EN FALLBACK - No hay sesiones activas"
                    );
                    console.log(
                      "⚠️ [WEBHOOKS] SessionId del webhook:",
                      statsResult.data.sessionId
                    );
                    console.log(
                      "🧹 [WEBHOOKS] Ignorando webhook órfano en fallback"
                    );
                    return;
                  }

                  // Verificar que la sesión del webhook exista
                  const webhookSessionExists = availableSessions.some(
                    (s) => s.id === statsResult.data.sessionId
                  );
                  if (!webhookSessionExists) {
                    console.log(
                      "⚠️ [WEBHOOKS] SESION DEL WEBHOOK NO ENCONTRADA EN FALLBACK"
                    );
                    console.log(
                      "⚠️ [WEBHOOKS] SessionId del webhook:",
                      statsResult.data.sessionId
                    );
                    console.log(
                      "⚠️ [WEBHOOKS] Sesiones disponibles:",
                      availableSessions.map((s) => s.id)
                    );
                    console.log(
                      "🧹 [WEBHOOKS] Ignorando webhook de sesión inexistente en fallback"
                    );
                    return;
                  }

                  console.log(
                    "✅ [WEBHOOKS] Sesión del webhook encontrada en fallback, sincronizando..."
                  );

                  // Simular sesión con webhook para la función de sincronización
                  const simulatedSession = {
                    id: statsResult.data.sessionId || "unknown",
                    sesionId: statsResult.data.sessionId || "unknown",
                    webhook: {
                      activo: statsResult.data.webhookActive,
                      creado: true,
                      url: statsResult.data.webhookUrl,
                    },
                    webhookActivo: statsResult.data.webhookActive,
                    webhookCreado: true,
                    webhookUrl: statsResult.data.webhookUrl,
                  };

                  console.log(
                    "🔍 [WEBHOOKS] Sincronizando con sesión simulada..."
                  );
                  // 🔧 NO auto-sincronizar - el usuario debe crear el webhook explícitamente
                  console.log(
                    "⚠️ [WEBHOOKS] Webhook encontrado pero no cargaremos automáticamente"
                  );
                } else {
                  console.log(
                    "🔍 [WEBHOOKS] No hay webhook activo en stats directas"
                  );
                }
              } else {
                console.log(
                  "🔍 [WEBHOOKS] Stats response no exitosa en fallback"
                );
              }
            }
          } catch (fallbackError) {
            console.warn(
              "🔍 [WEBHOOKS] Error en fallback stats:",
              fallbackError
            );
          }
        }
      }

      // **Fallback: Usar endpoints originales**
      const userId = user?.nombrebot || user?.email || user?.id;
      if (!userId) {
        console.warn(
          "🔍 [WEBHOOKS] No se pudo determinar userId para webhooks"
        );
        return;
      }

      // Load webhook stats (solo si no se cargaron del dashboard)
      if (!webhookStats?.webhookActive) {
        try {
          const statsResponse = await fetch(
            `https://backend.autosystemprojects.site/webhook/stats/${userId}`,
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
              // Combinar con datos existentes o usar como fallback
              setWebhookStats((prev) =>
                prev
                  ? {
                      ...prev,
                      ...statsResult.data,
                    }
                  : statsResult.data
              );

              console.log("🔍 [WEBHOOKS] Stats originales cargadas");

              // 🔧 VALIDACION CRITICA: Solo sincronizar si hay webhook activo Y sesiones disponibles
              if (
                statsResult.data.webhookActive &&
                statsResult.data.configExists
              ) {
                console.log(
                  "🔍 [WEBHOOKS] Webhook activo encontrado en stats, verificando sesiones..."
                );

                // 🔧 VERIFICAR QUE EXISTAN SESIONES ACTIVAS ANTES DE SINCRONIZAR
                if (availableSessions.length === 0) {
                  console.log(
                    "⚠️ [WEBHOOKS] WEBHOOK ÓRFANO DETECTADO - No hay sesiones activas pero webhook existe"
                  );
                  console.log(
                    "⚠️ [WEBHOOKS] SessionId del webhook:",
                    statsResult.data.sessionId
                  );
                  console.log(
                    "⚠️ [WEBHOOKS] Sesiones disponibles:",
                    availableSessions.length
                  );
                  console.log(
                    "🧹 [WEBHOOKS] Ignorando webhook órfano hasta que haya sesiones activas"
                  );

                  // No configurar webhook si no hay sesiones
                  return;
                }

                // 🔧 VERIFICAR QUE LA SESION DEL WEBHOOK REALMENTE EXISTA
                const webhookSessionExists = availableSessions.some(
                  (s) => s.id === statsResult.data.sessionId
                );
                if (!webhookSessionExists) {
                  console.log("⚠️ [WEBHOOKS] SESION DEL WEBHOOK NO ENCONTRADA");
                  console.log(
                    "⚠️ [WEBHOOKS] SessionId del webhook:",
                    statsResult.data.sessionId
                  );
                  console.log(
                    "⚠️ [WEBHOOKS] Sesiones disponibles:",
                    availableSessions.map((s) => s.id)
                  );
                  console.log(
                    "🧹 [WEBHOOKS] Ignorando webhook de sesión inexistente"
                  );

                  // No configurar webhook si la sesión no existe
                  return;
                }

                console.log(
                  "✅ [WEBHOOKS] Sesión del webhook encontrada, sincronizando..."
                );

                const simulatedSession = {
                  id: statsResult.data.sessionId || "stats-session",
                  sesionId: statsResult.data.sessionId || "stats-session",
                  webhook: {
                    activo: true,
                    creado: true,
                    url: statsResult.data.webhookUrl,
                  },
                  webhookActivo: true,
                  webhookCreado: true,
                  webhookUrl: statsResult.data.webhookUrl,
                };

                // 🔧 NO auto-sincronizar - el usuario debe crear el webhook explícitamente
                console.log(
                  "⚠️ [WEBHOOKS] Webhook en fallback encontrado pero no cargaremos automáticamente"
                );
              } else {
                console.log("🔍 [WEBHOOKS] No hay webhook activo en stats");
              }
            }
          }
        } catch (statsError) {
          console.warn("🔍 [WEBHOOKS] Error cargando stats:", statsError);
        }
      }

      // Load notifications
      try {
        const notificationsResponse = await fetch(
          `https://backend.autosystemprojects.site/webhook/notifications/${userId}?limit=50&offset=0`,
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
            // Asegurar que notificationsResult.data es un array
            const notificationsData = Array.isArray(
              notificationsResult.data.notifications
            )
              ? notificationsResult.data.notifications
              : Array.isArray(notificationsResult.data)
              ? notificationsResult.data
              : [];

            setNotifications(notificationsData);
            console.log(
              "🔍 [WEBHOOKS] Notificaciones cargadas:",
              notificationsData.length
            );
          } else {
            // Si no hay notificaciones, asegurar array vacío
            setNotifications([]);
            console.log("🔍 [WEBHOOKS] No hay notificaciones disponibles");
          }
        } else {
          setNotifications([]);
          console.log(
            "🔍 [WEBHOOKS] Error cargando notificaciones, usando array vacío"
          );
        }
      } catch (notificationsError) {
        console.warn(
          "🔍 [WEBHOOKS] Error cargando notificaciones:",
          notificationsError
        );
        setNotifications([]); // Asegurar array vacío en caso de error
      }
    } catch (error) {
      console.error("🔍 [WEBHOOKS] Error general loading webhook data:", error);
      // Asegurar estados seguros en caso de error
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

  // 🔧 NUEVA FUNCION: Limpiar notificaciones de sesiones eliminadas
  const connectWebSocket = async () => {
    if (!user?.nombrebot || !selectedSessionId) {
      console.log(
        "[WS SINGLETON] ⚠️ No hay nombrebot o sesión, omitiendo conexión"
      );
      return;
    }

    // 🔧 NUEVA: Verificar que no hay conexión activa antes de intentar
    if (globalWebSocketManager.isConnected()) {
      console.log(
        "[WS SINGLETON] ⚠️ Ya hay conexión activa, omitiendo nueva conexión"
      );
      return;
    }

    try {
      console.log("[WS SINGLETON] 🔌 Solicitando conexión WebSocket...");
      await globalWebSocketManager.connect(
        "wss://backend.autosystemprojects.site/ws"
      );
    } catch (error) {
      console.error("[WS SINGLETON] ❌ Error conectando:", error);
      setWsConnected(false);
      setWs(null);

      // 🔧 MEJORADO: Auto-reconnect con verificaciones adicionales
      if (
        user?.nombrebot &&
        selectedSessionId &&
        !globalWebSocketManager.isConnected()
      ) {
        // 🔧 NUEVA: Limpiar timeout previo antes de crear nuevo
        if (reconnectTimeoutRef.current) {
          console.log(
            "[WS SINGLETON] 🧹 Limpiando timeout de reconexión previo"
          );
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        console.log("[WS SINGLETON] 🔄 Reintentando en 5s...");
        reconnectTimeoutRef.current = setTimeout(() => {
          // 🔧 NUEVA: Verificar condiciones antes de reconectar
          if (
            user?.nombrebot &&
            selectedSessionId &&
            !globalWebSocketManager.isConnected()
          ) {
            connectWebSocket();
          } else {
            console.log(
              "[WS SINGLETON] 🚫 Cancelando reconexión - condiciones no cumplidas"
            );
          }
        }, 5000);
      }
    }
  };

  const setupWebSocketHandlers = (ws: WebSocket) => {
    if (!ws || !user?.nombrebot) return;

    // 🔧 NUEVA: Verificar si ya tiene handlers configurados
    if (ws.onmessage && ws.onmessage.toString().includes("authenticate")) {
      console.log(
        "[WS SINGLETON] ⚠️ Handlers ya configurados, omitiendo configuración"
      );
      return;
    }

    console.log("[WS SINGLETON] ⚙️ Configurando handlers para WebSocket");

    // 🔧 MEJORADA: Limpiar handlers existentes de manera más robusta
    ws.onmessage = null;
    ws.onerror = null;

    // Autenticar
    const sessionUserId = selectedSessionId
      ? sessions.find((s) => s.id === selectedSessionId)?.nombresesion ||
        user.nombrebot
      : user.nombrebot;

    console.log(`[WS SINGLETON] 🔑 Autenticando con userId: ${sessionUserId}`);

    ws.send(
      JSON.stringify({
        type: "authenticate",
        userId: sessionUserId,
      })
    );

    // 🔧 NUEVA: Configurar handler único sin preservar anteriores
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("[WS SINGLETON] 📨 Mensaje recibido:", message.type);

        switch (message.type) {
          case "authenticated":
            console.log("[WS SINGLETON] ✅ Autenticado exitosamente");
            if (message.stats) setWebhookStats(message.stats);
            break;

          case "notification":
            if (message.data) {
              const formattedNotification: NotificationItem = {
                id:
                  message.data.id ||
                  `notif_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                sessionId: message.data.sessionId || "",
                eventType: message.data.eventType || "UNKNOWN",
                eventData: message.data.data || message.data.eventData || {},
                timestamp: message.data.timestamp || new Date().toISOString(),
                read: message.data.read || false,
                source: "whatsapp" as const,
              };
              console.log(
                "[WS SINGLETON] 📬 Nueva notificación:",
                formattedNotification
              );
              handleNewNotification(formattedNotification);
            }
            break;

          case "notifications":
            const notificationsData = Array.isArray(message.data)
              ? message.data
              : [];
            setNotifications(notificationsData);
            break;

          case "notificationMarkedAsRead":
            setNotifications((prev) => {
              const prevArray = Array.isArray(prev) ? prev : [];
              return prevArray.map((n) =>
                n.id === message.notificationId ? { ...n, read: true } : n
              );
            });
            break;

          case "error":
            // 🔧 CORREGIDO: Solo mensaje informativo del servidor, no error crítico
            console.warn(
              "[WS SINGLETON] ℹ️ Mensaje del servidor:",
              message.message || message.error || "Sin detalles"
            );
            break;

          case "ping":
          case "pong":
          case "heartbeat":
            // Ignorar mensajes de keep-alive silenciosamente
            console.log("[WS SINGLETON] 💓 Keep-alive recibido");
            break;

          default:
            // 🔧 MEJORADO: Log informativo en lugar de error
            console.log(
              "[WS SINGLETON] 📋 Mensaje no manejado (tipo:",
              message.type || "undefined",
              "):",
              message
            );

            // Si es evento de WhatsApp, procesarlo
            if (
              message.type &&
              typeof message.type === "string" &&
              message.type.includes("_")
            ) {
              const eventNotification: NotificationItem = {
                id: `event_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                sessionId: sessionUserId,
                eventType: message.type,
                eventData: message.data || message,
                timestamp: new Date().toISOString(),
                read: false,
                source: "whatsapp" as const,
              };
              console.log(
                "[WS SINGLETON] 🎯 Procesando como evento WhatsApp:",
                eventNotification.eventType
              );
              handleNewNotification(eventNotification);
            }
        }
      } catch (error) {
        console.error("[WS SINGLETON] ❌ Error procesando mensaje:", error);
      }
    };
  };

  const cleanupOrphanedNotifications = (currentSessions: SessionOption[]) => {
    try {
      const currentSessionIds = currentSessions.map((s) => s.id);
      console.log(
        "🧹 [WEBHOOK CLEANUP] Iniciando limpieza de notificaciones órfanas..."
      );
      console.log("🧹 [WEBHOOK CLEANUP] Sesiones actuales:", currentSessionIds);

      const notificationsArray = Array.isArray(notifications)
        ? notifications
        : [];
      console.log(
        "🧹 [WEBHOOK CLEANUP] Notificaciones actuales:",
        notificationsArray.length
      );

      if (notificationsArray.length === 0) {
        console.log("🧹 [WEBHOOK CLEANUP] No hay notificaciones para limpiar");
        return;
      }

      // Filtrar notificaciones que pertenecen a sesiones que ya no existen
      const validNotifications = notificationsArray.filter((notification) => {
        // Si no tiene sessionId, mantenerla (notificaciones del sistema)
        if (!notification.sessionId) {
          return true;
        }

        // Solo mantener si la sesión aún existe
        const isValid = currentSessionIds.includes(notification.sessionId);

        if (!isValid) {
          console.log("🧹 [WEBHOOK CLEANUP] Notificación órfana detectada:", {
            notificationId: notification.id,
            sessionId: notification.sessionId,
            eventType: notification.eventType,
            timestamp: notification.timestamp,
          });
        }

        return isValid;
      });

      const removedCount =
        notificationsArray.length - validNotifications.length;

      if (removedCount > 0) {
        console.log(
          `🧹 [WEBHOOK CLEANUP] 🗑️ Limpiando ${removedCount} notificaciones órfanas`
        );

        // Actualizar estado de notificaciones
        setNotifications(validNotifications);

        // Recalcular estadísticas
        const unreadCount = validNotifications.filter((n) => !n.read).length;
        const totalCount = validNotifications.length;

        setWebhookStats((prev) =>
          prev
            ? {
                ...prev,
                totalNotifications: totalCount,
                unreadNotifications: unreadCount,
              }
            : null
        );

        console.log("🧹 [WEBHOOK CLEANUP] ✅ Limpieza completada:", {
          notificacionesEliminadas: removedCount,
          notificacionesRestantes: totalCount,
          noLeidas: unreadCount,
        });

        // Mostrar notificación al usuario si se limpiaron notificaciones
        toast({
          title: "🧹 Notificaciones Limpiadas",
          description: `Se eliminaron ${removedCount} notificaciones de sesiones eliminadas`,
        });
      } else {
        console.log(
          "🧹 [WEBHOOK CLEANUP] ✅ No hay notificaciones órfanas para limpiar"
        );
      }
    } catch (error) {
      console.error(
        "🧹 [WEBHOOK CLEANUP] 🚨 Error en limpieza de notificaciones:",
        error
      );
    }
  };

  const handleNewNotification = (notification: NotificationItem) => {
    const now = Date.now();
    console.log("[WEBHOOK WS] 📬 Procesando nueva notificación:", {
      id: notification.id,
      eventType: notification.eventType,
      timestamp: notification.timestamp,
      cacheSize: processedNotificationIds.current.size,
    });

    // 🔧 VALIDACION: Verificar que la notificación tiene los campos requeridos
    if (!notification.id || !notification.eventType) {
      console.warn(
        "[WEBHOOK WS] ⚠️ Notificación inválida - faltan campos requeridos:",
        notification
      );
      return;
    }

    // 🔧 NUEVA: Verificar cache de IDs procesados recientemente
    if (processedNotificationIds.current.has(notification.id)) {
      console.log(
        "[WEBHOOK WS] 🚫 DUPLICADO DETECTADO - Notificación ya procesada:",
        notification.id
      );
      return;
    }

    // 🔧 NUEVA: Limpiar cache si ha pasado mucho tiempo (5 minutos)
    if (now - lastProcessedTime.current > 300000) {
      console.log("[WEBHOOK WS] 🧹 Limpiando cache de notificaciones antigas");
      processedNotificationIds.current.clear();
    }

    // 🔧 NUEVA: Agregar ID al cache
    processedNotificationIds.current.add(notification.id);
    lastProcessedTime.current = now;

    // 🔧 NUEVA: Limpiar cache si excede 100 elementos
    if (processedNotificationIds.current.size > 100) {
      const oldestIds = Array.from(processedNotificationIds.current).slice(
        0,
        50
      );
      oldestIds.forEach((id) => processedNotificationIds.current.delete(id));
      console.log(
        "[WEBHOOK WS] 🧹 Cache de IDs reducido de 100+ a 50 elementos"
      );
    }

    setNotifications((prev) => {
      // Asegurar que prev es un array
      const prevArray = Array.isArray(prev) ? prev : [];

      // 🔧 SOLUCION MEJORADA: Verificar duplicados tanto por ID como por contenido
      const existingIndex = prevArray.findIndex(
        (n) => n.id === notification.id
      );

      if (existingIndex >= 0) {
        console.log(
          "[WEBHOOK WS] 🔄 Actualizando notificación existente:",
          notification.id
        );
        const updatedArray = [...prevArray];
        updatedArray[existingIndex] = notification;
        return updatedArray;
      }

      console.log(
        "[WEBHOOK WS] ➕ Agregando nueva notificación:",
        notification.id
      );
      return [notification, ...prevArray.slice(0, 49)]; // Mantener solo 50 notificaciones
    });

    // Update stats
    setWebhookStats((prev) => {
      const newStats = prev
        ? {
            ...prev,
            totalNotifications: prev.totalNotifications + 1,
            unreadNotifications:
              prev.unreadNotifications + (notification.read ? 0 : 1),
            lastNotification: notification.timestamp,
          }
        : {
            totalNotifications: 1,
            unreadNotifications: notification.read ? 0 : 1,
            webhookActive: true,
            lastNotification: notification.timestamp,
            connectedClients: 1,
          };

      console.log("[WEBHOOK WS] 📊 Estadísticas actualizadas:", newStats);
      return newStats;
    });

    // Show toast for new notifications (solo si no está marcada como leída)
    if (!notification.read) {
      // 🎯 FILTRO: Solo mostrar toasts para mensajes entrantes
      if (notification.eventType === "MESSAGES_UPSERT") {
        toast({
          title: "📨 Nuevo Mensaje",
          description: `Mensaje entrante en sesión ${
            notification.sessionId || "desconocida"
          }`,
          duration: 3000,
        });

        console.log(
          "[WEBHOOK WS] 📨 Toast mostrado para mensaje entrante:",
          notification.eventType
        );
      } else {
        console.log(
          "[WEBHOOK WS] 🔇 Toast omitido para evento:",
          notification.eventType,
          "(solo se muestran MESSAGES_UPSERT)"
        );
      }
    }
  };

  // 🔧 NUEVA FUNCION: Cargar solo webhooks existentes explícitos (NO auto-crear)
  const cargarWebhooksExistentes = async (sesiones: any[]) => {
    try {
      console.log(
        "🔍 [WEBHOOK LOAD] Cargando webhooks existentes explícitos..."
      );

      // Solo buscar webhooks que fueron creados explícitamente por el usuario
      const userId = user?.nombrebot || user?.email || user?.id;
      if (!userId) {
        console.log("🔍 [WEBHOOK LOAD] No hay userId disponible");
        return;
      }

      try {
        const statsResponse = await fetch(
          `https://backend.autosystemprojects.site/webhook/stats/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();

          // Solo configurar si existe webhook Y fue creado explícitamente
          if (
            statsResult.success &&
            statsResult.data &&
            statsResult.data.configExists &&
            statsResult.data.webhookActive &&
            statsResult.data.createdExplicitly !== false // Solo cargar si fue creado explícitamente
          ) {
            console.log(
              "✅ [WEBHOOK LOAD] Webhook explícito encontrado:",
              statsResult.data
            );

            // Verificar que la sesión asociada existe
            const webhookSessionExists = sesiones.some(
              (s) => s.id === statsResult.data.sessionId
            );

            if (webhookSessionExists) {
              const webhookConfigData = {
                userId: userId,
                sessionId: statsResult.data.sessionId,
                webhookId:
                  statsResult.data.webhookId ||
                  `webhook_${userId}_${Date.now()}`,
                webhookUrl: statsResult.data.webhookUrl || "",
                clientWebhookUrl: statsResult.data.clientWebhookUrl || "",
                events: statsResult.data.events || ["ALL"],
                active: true,
                createdAt:
                  statsResult.data.createdAt || new Date().toISOString(),
                deliverySettings: statsResult.data.deliverySettings,
              };

              console.log(
                "✅ [WEBHOOK LOAD] Configurando webhook existente:",
                webhookConfigData
              );
              setWebhookConfig(webhookConfigData);
              setSelectedSessionId(statsResult.data.sessionId);
              setSelectedEvents(webhookConfigData.events);
              setTempSelectedEvents(webhookConfigData.events);
            } else {
              console.log(
                "⚠️ [WEBHOOK LOAD] Sesión del webhook no existe, ignorando"
              );
            }
          } else {
            console.log(
              "🔍 [WEBHOOK LOAD] No hay webhook explícito configurado"
            );
          }
        } else {
          console.log(
            "🔍 [WEBHOOK LOAD] No se pudieron obtener stats de webhook"
          );
        }
      } catch (error) {
        console.warn(
          "🔍 [WEBHOOK LOAD] Error obteniendo webhook existente:",
          error
        );
      }
    } catch (error) {
      console.error("❌ [WEBHOOK LOAD] Error en carga de webhooks:", error);
    }
  };

  // 🔄 FUNCION DEPRECADA: Mantener para compatibilidad pero no usar
  const verificarYSincronizarWebhooks_DEPRECATED = async (sesiones: any[]) => {
    try {
      console.log("🔍 [WEBHOOK SYNC] Verificando webhooks existentes...");
      console.log("🔍 [WEBHOOK SYNC] Sesiones recibidas:", sesiones.length);

      // 🔧 SOLUCION MEJORADA: Verificar tanto en sesiones como en stats del backend
      let webhookEncontrado = false;

      for (const sesion of sesiones) {
        console.log(
          `🔍 [WEBHOOK SYNC] Verificando sesión: ${
            sesion.id || sesion.sesionId
          }`,
          {
            webhook: sesion.webhook,
            webhookCreado: sesion.webhookCreado,
            webhookActivo: sesion.webhookActivo,
            webhookUrl: sesion.webhookUrl,
          }
        );

        // 🔧 DETECTAR WEBHOOK ACTIVO: Múltiples formas de verificación
        const tieneWebhookActivo =
          sesion.webhook?.activo ||
          sesion.webhook?.creado ||
          sesion.webhookActivo ||
          sesion.webhookCreado ||
          (sesion.webhook?.url && sesion.webhook.url !== "");

        if (tieneWebhookActivo) {
          console.log(
            `✅ [WEBHOOK SYNC] Webhook activo detectado para sesión ${
              sesion.id || sesion.sesionId
            }`
          );

          // 🔧 VALIDACIÓN CRITICA: Verificar que el webhook sea para la sesión actual
          const webhookSessionId =
            sesion.webhook?.sessionId || sesion.sesionId || sesion.id;
          const currentSessionId = sesion.id || sesion.sesionId;

          if (webhookSessionId !== currentSessionId) {
            console.warn(
              `⚠️ [WEBHOOK SYNC] DISCREPANCIA DE SESION DETECTADA:
              - Webhook configurado para: ${webhookSessionId}
              - Sesión actual: ${currentSessionId}
              - Creando nuevo webhook para sesión actual...`
            );

            // 🔧 SOLUCIÓN: Crear nuevo webhook para la sesión actual
            try {
              console.log(
                `🔄 [WEBHOOK SYNC] Creando webhook corregido para sesión ${currentSessionId}`
              );

              const createResponse = await fetch(
                `https://backend.autosystemprojects.site/webhook/create`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userId: user?.nombrebot || user?.email,
                    sessionId: currentSessionId,
                    events: ["ALL"],
                    webhookUrl: null,
                  }),
                }
              );

              if (createResponse.ok) {
                const createResult = await createResponse.json();
                console.log(
                  `✅ [WEBHOOK SYNC] Nuevo webhook creado exitosamente:`,
                  createResult.data
                );

                // Configurar el nuevo webhook
                setWebhookConfig({
                  userId: createResult.data.userId,
                  sessionId: createResult.data.sessionId,
                  webhookId:
                    createResult.data.id || createResult.data.webhookId,
                  webhookUrl: createResult.data.webhookUrl,
                  clientWebhookUrl: createResult.data.clientWebhookUrl || "",
                  events: createResult.data.events || ["ALL"],
                  active: createResult.data.active,
                  createdAt:
                    createResult.data.createdAt || new Date().toISOString(),
                });

                webhookEncontrado = true;
                continue; // Continuar con el siguiente elemento del bucle
              } else {
                console.warn(
                  `⚠️ [WEBHOOK SYNC] Error creando webhook: ${createResponse.status}`
                );
              }
            } catch (createError) {
              console.error(
                `❗ [WEBHOOK SYNC] Error creando webhook corregido:`,
                createError
              );
            }
          }

          // Si ya tenemos configuración, omitir pero actualizar datos
          if (webhookConfig && !webhookEncontrado) {
            console.log(
              "🔍 [WEBHOOK SYNC] Webhook ya configurado en frontend, actualizando datos"
            );

            // Actualizar configuración existente con datos más recientes
            setWebhookConfig((prev) =>
              prev
                ? {
                    ...prev,
                    webhookUrl:
                      sesion.webhook?.url ||
                      sesion.webhookUrl ||
                      prev.webhookUrl,
                    active: true,
                    sessionId: sesion.id || sesion.sesionId || prev.sessionId,
                  }
                : null
            );

            webhookEncontrado = true;
            continue;
          }

          // 🔧 OBTENER CONFIGURACIÓN COMPLETA DEL BACKEND
          try {
            // 🔧 SOLUCION: Usar userId correcto
            const sessionUserId = sesion.nombresesion || user?.nombrebot;
            console.log(
              `🔍 [WEBHOOK SYNC] Obteniendo configuración de webhook para usuario: ${sessionUserId}`
            );

            const response = await fetch(
              `https://backend.autosystemprojects.site/webhook/stats/${sessionUserId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              const result = await response.json();
              console.log(`🔍 [WEBHOOK SYNC] Stats response:`, result);

              if (result.success && result.data) {
                // 🔧 CONFIGURAR WEBHOOK CON DATOS COMPLETOS Y VALIDACIONES
                const webhookConfigData = {
                  userId: sessionUserId,
                  sessionId: sesion.id || sesion.sesionId,
                  webhookId:
                    result.data.webhookId ||
                    `webhook_${sessionUserId}_${Date.now()}`,
                  webhookUrl:
                    result.data.webhookUrl ||
                    sesion.webhook?.url ||
                    sesion.webhookUrl ||
                    "", // 🔧 Nunca null
                  clientWebhookUrl: result.data.clientWebhookUrl || "",
                  events: result.data.events || ["ALL"],
                  active: true,
                  createdAt: result.data.createdAt || new Date().toISOString(),
                  deliverySettings: result.data.deliverySettings,
                };

                console.log(
                  `✅ [WEBHOOK SYNC] Configurando webhook completo en frontend:`,
                  webhookConfigData
                );

                setWebhookConfig(webhookConfigData);
                setSelectedSessionId(sesion.id || sesion.sesionId);
                setSelectedEvents(webhookConfigData.events);

                webhookEncontrado = true;
                break; // Solo configurar el primero encontrado
              }
            } else {
              console.warn(
                `⚠️ [WEBHOOK SYNC] Stats response not OK: ${response.status}`
              );
            }
          } catch (statsError) {
            console.warn(
              `⚠️ [WEBHOOK SYNC] Error obteniendo stats del backend:`,
              statsError
            );
          }

          // 🔧 FALLBACK: Si no podemos obtener stats, usar datos de sesión directamente
          if (!webhookEncontrado) {
            const fallbackConfig = {
              userId: user?.nombrebot || "",
              sessionId: sesion.id || sesion.sesionId,
              webhookId: `webhook_${user?.nombrebot}_fallback_${Date.now()}`,
              webhookUrl:
                sesion.webhook?.url ||
                sesion.webhookUrl ||
                `https://backend.autosystemprojects.site/webhook/webhook_${user?.nombrebot}_fallback`, // 🔧 Nunca null
              events: ["ALL"],
              active: true,
              createdAt: new Date().toISOString(),
            };

            console.log(
              `🔄 [WEBHOOK SYNC] Usando configuración fallback:`,
              fallbackConfig
            );
            setWebhookConfig(fallbackConfig);
            setSelectedSessionId(sesion.id || sesion.sesionId);

            webhookEncontrado = true;
          }
        } else {
          console.log(
            `⚪ [WEBHOOK SYNC] Sesión ${
              sesion.id || sesion.sesionId
            } sin webhook activo`
          );
        }
      }

      // 🔧 ACTUALIZAR ESTADÍSTICAS FINALES
      if (webhookEncontrado) {
        setWebhookStats((prev) =>
          prev
            ? {
                ...prev,
                webhookActive: true,
                webhooksConfigurados: 1,
              }
            : {
                totalNotifications: 0,
                unreadNotifications: 0,
                webhookActive: true,
                lastNotification: null,
                connectedClients: 1,
                webhooksConfigurados: 1,
              }
        );

        console.log("✅ [WEBHOOK SYNC] Webhook sincronizado exitosamente");
      } else {
        console.log("⚪ [WEBHOOK SYNC] No se encontraron webhooks activos");
      }

      console.log("✅ [WEBHOOK SYNC] Verificación completada");
    } catch (error) {
      console.error("❌ [WEBHOOK SYNC] Error en sincronización:", error);
    }
  };

  const createWebhook = async () => {
    console.log("🚀 [WEBHOOK CREATE] Iniciando creación de webhook...");
    console.log("🚀 [WEBHOOK CREATE] User:", user);
    console.log("🚀 [WEBHOOK CREATE] User nombrebot:", user?.nombrebot);
    console.log("🚀 [WEBHOOK CREATE] Selected session:", selectedSessionId);
    console.log("🚀 [WEBHOOK CREATE] Selected events:", selectedEvents);
    console.log("🚀 [WEBHOOK CREATE] Client webhook URL:", clientWebhookUrl);
    console.log(
      "🚀 [WEBHOOK CREATE] Membership expired:",
      user?.membershipExpired
    );

    // Check membership
    if (user?.membershipExpired) {
      console.log("🚀 [WEBHOOK CREATE] Error: Membresía expirada");
      toast({
        title: "🔒 Funcionalidad Restringida",
        description:
          "No puedes crear webhooks con membresía expirada. Actualiza tu plan.",
        variant: "destructive",
        action: (
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/upgrade")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Actualizar Plan
          </Button>
        ),
      });
      return;
    }

    if (!selectedSessionId) {
      console.log("🚀 [WEBHOOK CREATE] Error: No hay sesión seleccionada");
      toast({
        title: "Error",
        description: "Debes seleccionar una sesión activa",
        variant: "destructive",
      });
      return;
    }

    if (!user?.nombrebot) {
      console.log("🚀 [WEBHOOK CREATE] Error: No hay nombrebot en user");
      console.log(
        "🚀 [WEBHOOK CREATE] User object keys:",
        Object.keys(user || {})
      );
      toast({
        title: "Error",
        description: "No se pudo obtener el usuario actual",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // 🔧 SOLUCION: Usar userId correcto basado en la sesión
      const sessionUserId =
        sessions.find((s) => s.id === selectedSessionId)?.nombresesion ||
        user.nombrebot;

      const requestBody = {
        userId: sessionUserId,
        sessionId: selectedSessionId,
        events: selectedEvents,
        webhookUrl: clientWebhookUrl || null,
      };

      console.log(
        "🚀 [WEBHOOK CREATE] 🔑 Usando userId de sesión:",
        sessionUserId
      );

      console.log(
        "🚀 [WEBHOOK CREATE] Request body:",
        JSON.stringify(requestBody, null, 2)
      );

      const url = "https://backend.autosystemprojects.site/webhook/create";
      console.log("🚀 [WEBHOOK CREATE] Enviando POST a:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("🚀 [WEBHOOK CREATE] Response status:", response.status);
      console.log("🚀 [WEBHOOK CREATE] Response ok:", response.ok);
      console.log(
        "🚀 [WEBHOOK CREATE] Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      const result = await response.json();
      console.log(
        "🚀 [WEBHOOK CREATE] Response body:",
        JSON.stringify(result, null, 2)
      );

      if (result.success && result.data) {
        console.log("🚀 [WEBHOOK CREATE] Éxito - configurando webhook...");

        // 🔧 DEBUGGING: Mostrar información detallada
        console.log(
          "🔍 [WEBHOOK CREATE] 📊 Información completa del response:"
        );
        console.log("   • Success:", result.success);
        console.log("   • Message:", result.message);
        console.log("   • Data keys:", Object.keys(result.data || {}));
        console.log("   • Session synced:", result.data?.sessionSynced);
        console.log("   • Webhook URL:", result.data?.webhookUrl);
        console.log("   • Active:", result.data?.active);
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

        console.log("🔍 [WEBHOOK CREATE] Webhook configurado en frontend:");
        console.log("   • Session ID:", result.data.sessionId);
        console.log(
          "   • Webhook ID:",
          result.data.id || result.data.webhookId
        );
        console.log("   • Active:", result.data.active);
        console.log("   • Events:", result.data.events);

        toast({
          title: "✅ Webhook Creado",
          description: `Webhook configurado para sesión ${result.data.sessionId}`,
        });

        // Forzar recarga de datos para verificar sincronización
        console.log("🔄 [WEBHOOK CREATE] Recargando datos del dashboard...");

        // 🔧 SOLUCION: Recargar datos múltiples veces para asegurar sincronización
        setTimeout(async () => {
          console.log("🔄 [WEBHOOK CREATE] Primera recarga...");
          const reloadedSessions = await loadSessions();
          await loadWebhookData(reloadedSessions);
        }, 1000);

        setTimeout(async () => {
          console.log("🔄 [WEBHOOK CREATE] Segunda recarga (verificación)...");
          const reloadedSessions = await loadSessions();
          await loadWebhookData(reloadedSessions);
        }, 3000);

        setActiveTab("config");
        // Recarga inicial inmediata
        const initialSessions = await loadSessions();
        await loadWebhookData(initialSessions);
        console.log("🚀 [WEBHOOK CREATE] Proceso completado exitosamente");
      } else {
        console.error("🚀 [WEBHOOK CREATE] Error en respuesta del servidor:");
        console.error("🚀 [WEBHOOK CREATE] Result success:", result.success);
        console.error("🚀 [WEBHOOK CREATE] Result message:", result.message);
        console.error("🚀 [WEBHOOK CREATE] Full result:", result);
        throw new Error(result.message || "Error desconocido del servidor");
      }
    } catch (error: any) {
      console.error("🚀 [WEBHOOK CREATE] Error capturado:", error);
      console.error("🚀 [WEBHOOK CREATE] Error type:", typeof error);
      console.error("🚀 [WEBHOOK CREATE] Error name:", error.name);
      console.error("🚀 [WEBHOOK CREATE] Error message:", error.message);
      console.error("🚀 [WEBHOOK CREATE] Error stack:", error.stack);

      toast({
        title: "❌ Error",
        description: error.message || "No se pudo crear el webhook",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
      console.log("🚀 [WEBHOOK CREATE] Proceso finalizado");
    }
  };

  const testWebhook = async () => {
    if (!webhookConfig?.webhookId) {
      toast({
        title: "Error",
        description: "No hay webhook configurado para probar",
        variant: "destructive",
      });
      return;
    }

    let payload;
    try {
      payload = testPayload
        ? JSON.parse(testPayload)
        : {
            type: "test_notification",
            data: {
              message: "Webhook de prueba desde el panel de control",
              timestamp: new Date().toISOString(),
              source: "dashboard",
              testId: crypto.randomUUID(),
            },
          };
    } catch (error) {
      toast({
        title: "Error",
        description: "JSON inválido en el payload de prueba",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      console.log(
        "[WEBHOOK TEST] Sending to:",
        `https://backend.autosystemprojects.site/webhook/${webhookConfig.webhookId}`
      );
      console.log("[WEBHOOK TEST] Payload:", payload);

      const response = await fetch(
        `https://backend.autosystemprojects.site/webhook/${webhookConfig.webhookId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log("[WEBHOOK TEST] Response:", result);

      setTestResult({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
        statusCode: response.status,
        payload: payload,
      });

      if (result.success) {
        toast({
          title: "✅ Prueba Exitosa",
          description: "Webhook de prueba enviado correctamente",
        });
      } else {
        toast({
          title: "⚠️ Prueba Fallida",
          description: result.message || "Error en la prueba del webhook",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("[WEBHOOK TEST] Error:", error);
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      toast({
        title: "❌ Error de Prueba",
        description: error.message || "Error enviando webhook de prueba",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.nombrebot) return;

    try {
      console.log(
        "[WEBHOOKS] Marcando notificación como leída:",
        notificationId
      );

      // 🔧 SOLUCIÓN: Usar userId correcto basado en la sesión
      const sessionUserId = selectedSessionId
        ? sessions.find((s) => s.id === selectedSessionId)?.nombresesion ||
          user.nombrebot
        : user.nombrebot;

      console.log(
        `[WEBHOOKS] 🔑 Usando userId para markAsRead: ${sessionUserId}`
      );

      // 🔧 VALIDACIÓN: Verificar que la notificación existe en el estado actual
      const notificationsArray = Array.isArray(notifications)
        ? notifications
        : [];
      const notification = notificationsArray.find(
        (n) => n.id === notificationId
      );

      if (!notification) {
        console.warn(
          "[WEBHOOKS] ⚠️ Notificación no encontrada en estado actual:",
          notificationId
        );
        return;
      }

      // 🔧 VALIDACIÓN: Verificar que la sesión de la notificación aún existe
      if (notification.sessionId) {
        const sessionExists = sessions.some(
          (s) => s.id === notification.sessionId
        );
        if (!sessionExists) {
          console.warn(
            "[WEBHOOKS] ⚠️ Sesión de notificación eliminada, limpiando notificación:",
            {
              notificationId,
              sessionId: notification.sessionId,
              availableSessions: sessions.map((s) => s.id),
            }
          );

          // Limpiar notificación del estado sin hacer request al backend
          setNotifications((prev) => {
            const prevArray = Array.isArray(prev) ? prev : [];
            return prevArray.filter((n) => n.id !== notificationId);
          });

          setWebhookStats((prev) =>
            prev
              ? {
                  ...prev,
                  unreadNotifications: Math.max(
                    0,
                    prev.unreadNotifications - (!notification.read ? 1 : 0)
                  ),
                  totalNotifications: Math.max(0, prev.totalNotifications - 1),
                }
              : null
          );

          console.log(
            "[WEBHOOKS] 🧹 Notificación de sesión eliminada removida del estado"
          );
          return;
        }
      }

      const response = await fetch(
        `https://backend.autosystemprojects.site/webhook/notifications/${sessionUserId}/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          // 🔧 SOLUCION: Enviar body válido JSON
          body: JSON.stringify({ read: true }),
        }
      );

      console.log("[WEBHOOKS] Mark as read response status:", response.status);

      // 🔧 MEJORA: Manejar caso de sesión eliminada desde el backend
      if (response.status === 404 || response.status === 410) {
        console.warn(
          "[WEBHOOKS] ⚠️ Backend confirmó que webhook/sesión no existe, limpiando notificación"
        );

        // Limpiar notificación del estado
        setNotifications((prev) => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.filter((n) => n.id !== notificationId);
        });

        setWebhookStats((prev) =>
          prev
            ? {
                ...prev,
                unreadNotifications: Math.max(
                  0,
                  prev.unreadNotifications - (!notification.read ? 1 : 0)
                ),
                totalNotifications: Math.max(0, prev.totalNotifications - 1),
              }
            : null
        );

        console.log(
          "[WEBHOOKS] 🧹 Notificación huerfana eliminada del estado frontend"
        );
        return;
      }

      if (response.ok) {
        const result = await response.json().catch(() => ({ success: true }));
        console.log("[WEBHOOKS] Mark as read result:", result);

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

        console.log(
          "[WEBHOOKS] ✅ Notificación marcada como leída exitosamente"
        );
      } else {
        console.warn(
          "[WEBHOOKS] ⚠️ Error response al marcar como leída:",
          response.status,
          response.statusText
        );

        // Intentar leer respuesta para obtener más información
        try {
          const errorData = await response.json();
          if (errorData.reason === "session_deleted") {
            console.warn(
              "[WEBHOOKS] Backend confirmó sesión eliminada, limpiando notificación"
            );

            setNotifications((prev) => {
              const prevArray = Array.isArray(prev) ? prev : [];
              return prevArray.filter((n) => n.id !== notificationId);
            });
          }
        } catch (parseError) {
          console.warn(
            "[WEBHOOKS] No se pudo parsear respuesta de error:",
            parseError
          );
        }
      }
    } catch (error) {
      console.error("[WEBHOOKS] 🚨 Error marking notification as read:", error);

      // 🔧 MEJORA: Si hay error de red, asumir que la sesión podría haber sido eliminada
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.warn(
          "[WEBHOOKS] Error de red detectado, podría ser sesión eliminada"
        );
      }
    }
  };

  const markAllAsRead = async () => {
    const notificationsArray = Array.isArray(notifications)
      ? notifications
      : [];
    const unreadNotifications = notificationsArray.filter((n) => !n.read);

    try {
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }

      toast({
        title: "✅ Éxito",
        description: "Todas las notificaciones marcadas como leídas",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // 🔧 MISMO PATRON: Primero sesiones, luego webhooks
      console.log("🔄 [WEBHOOKS] Refrescando datos - Paso 1: Sesiones");
      const refreshedSessions = await loadSessions();

      console.log("🔄 [WEBHOOKS] Refrescando datos - Paso 2: Webhooks");
      await loadWebhookData(refreshedSessions);

      toast({
        title: "🔄 Actualizado",
        description: "Datos actualizados correctamente",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "📋 Copiado",
      description: "URL copiada al portapapeles",
    });
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

  const exportNotifications = () => {
    const notificationsArray = Array.isArray(notifications)
      ? notifications
      : [];
    const csv = [
      "ID,Tipo de Evento,Timestamp,Leído,Fuente,Sesión",
      ...notificationsArray.map(
        (n) =>
          `"${n.id}","${n.eventType}","${n.timestamp}","${
            n.read ? "Sí" : "No"
          }","${n.source}","${n.sessionId}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `webhooks_notifications_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "📁 Exportado",
      description: "Notificaciones exportadas a CSV",
    });
  };

  const requestNewNotifications = () => {
    if (ws && user?.nombrebot) {
      // 🔧 SOLUCION: Usar userId correcto basado en la sesión
      const sessionUserId = selectedSessionId
        ? sessions.find((s) => s.id === selectedSessionId)?.nombresesion ||
          user.nombrebot
        : user.nombrebot;

      console.log(
        `[WEBHOOK WS] 📨 Solicitando notificaciones para userId: ${sessionUserId}`
      );

      ws.send(
        JSON.stringify({
          type: "getNotifications",
          userId: sessionUserId,
          limit: 50,
          offset: 0,
        })
      );
    }
  };

  // 🆕 Funciones de edición de eventos
  const startEditingEvents = () => {
    if (webhookConfig) {
      setTempSelectedEvents([...webhookConfig.events]);
      setEditingEvents(true);
    }
  };

  const cancelEditingEvents = () => {
    setTempSelectedEvents([...selectedEvents]);
    setEditingEvents(false);
  };

  const saveEventsChanges = async () => {
    if (!webhookConfig) return;

    setEditing(true);
    try {
      const requestBody = {
        webhookId: webhookConfig.webhookId,
        events: tempSelectedEvents,
        webhookUrl: clientWebhookUrl || null,
        active: webhookActive,
      };

      const response = await fetch(
        `https://backend.autosystemprojects.site/webhook/${webhookConfig.webhookId}/update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();
      if (result.success) {
        setWebhookConfig({
          ...webhookConfig,
          events: tempSelectedEvents,
          updatedAt: new Date().toISOString(),
        });
        setSelectedEvents([...tempSelectedEvents]);
        setEditingEvents(false);

        toast({
          title: "✅ Eventos Actualizados",
          description: "Configuración de eventos guardada exitosamente",
        });

        // Recargar datos
        const reloadedSessions = await loadSessions();
        await loadWebhookData(reloadedSessions);
      } else {
        throw new Error(result.message || "Error actualizando eventos");
      }
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "No se pudieron actualizar los eventos",
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const toggleEventSelection = (event: string) => {
    if (event === "ALL") {
      setTempSelectedEvents(["ALL"]);
    } else {
      setTempSelectedEvents((prev) => {
        const filtered = prev.filter((e) => e !== "ALL");
        if (filtered.includes(event)) {
          const newEvents = filtered.filter((e) => e !== event);
          return newEvents.length === 0 ? ["ALL"] : newEvents;
        } else {
          return [...filtered, event];
        }
      });
    }
  };

  // 🆕 NUEVA FUNCIONALIDAD: Editar webhook existente
  const editWebhook = async () => {
    if (!webhookConfig) {
      toast({
        title: "Error",
        description: "No hay webhook para editar",
        variant: "destructive",
      });
      return;
    }

    if (user?.membershipExpired) {
      toast({
        title: "🔒 Funcionalidad Restringida",
        description:
          "No puedes editar webhooks con membresía expirada. Actualiza tu plan.",
        variant: "destructive",
        action: (
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/upgrade")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Actualizar Plan
          </Button>
        ),
      });
      return;
    }

    setEditing(true);
    try {
      console.log("😀 [WEBHOOK EDIT] Iniciando edición de webhook...");
      console.log("😀 [WEBHOOK EDIT] Webhook config:", webhookConfig);
      console.log("😀 [WEBHOOK EDIT] Nuevos eventos:", selectedEvents);
      console.log("😀 [WEBHOOK EDIT] Nueva URL cliente:", clientWebhookUrl);

      const requestBody = {
        webhookId: webhookConfig.webhookId,
        events: selectedEvents,
        webhookUrl: clientWebhookUrl || null,
        active: webhookActive,
      };

      console.log(
        "😀 [WEBHOOK EDIT] Request body:",
        JSON.stringify(requestBody, null, 2)
      );

      // 🔧 SOLUCION: URL corregida para endpoint de actualización
      const url = `https://backend.autosystemprojects.site/webhook/${webhookConfig.webhookId}/update`;
      console.log("😀 [WEBHOOK EDIT] Enviando PUT a:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("😀 [WEBHOOK EDIT] Response status:", response.status);
      const result = await response.json();
      console.log("😀 [WEBHOOK EDIT] Response body:", result);

      if (result.success && result.data) {
        console.log("😀 [WEBHOOK EDIT] Éxito - actualizando webhook...");

        // Actualizar configuración local
        setWebhookConfig({
          ...webhookConfig,
          events: result.data.events || selectedEvents,
          clientWebhookUrl: result.data.clientWebhookUrl || clientWebhookUrl,
          active:
            result.data.active !== undefined
              ? result.data.active
              : webhookActive,
          updatedAt: result.data.updatedAt || new Date().toISOString(),
        });

        toast({
          title: "✅ Webhook Actualizado",
          description: `Configuración actualizada exitosamente`,
        });

        // Recargar datos
        const reloadedSessions = await loadSessions();
        await loadWebhookData(reloadedSessions);
      } else {
        throw new Error(result.message || "Error desconocido del servidor");
      }
    } catch (error: any) {
      console.error("😀 [WEBHOOK EDIT] Error:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo actualizar el webhook",
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  // 🆕 NUEVA FUNCIONALIDAD: Eliminar webhook
  const deleteWebhook = async () => {
    if (!webhookConfig) {
      toast({
        title: "Error",
        description: "No hay webhook para eliminar",
        variant: "destructive",
      });
      return;
    }

    if (user?.membershipExpired) {
      toast({
        title: "🔒 Funcionalidad Restringida",
        description:
          "No puedes eliminar webhooks con membresía expirada. Actualiza tu plan.",
        variant: "destructive",
        action: (
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/upgrade")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Actualizar Plan
          </Button>
        ),
      });
      return;
    }

    // Confirmación de eliminación
    setShowDeleteDialog(true);
    return;
  };

  // Función para confirmar eliminación
  const confirmDeleteWebhook = async () => {
    setShowDeleteDialog(false);
    setDeleting(true);
    try {
      console.log("🗑️ [WEBHOOK DELETE] Iniciando eliminación de webhook...");
      console.log("🗑️ [WEBHOOK DELETE] Webhook ID:", webhookConfig?.webhookId);

      const url = `https://backend.autosystemprojects.site/webhook/${webhookConfig?.webhookId}/delete`;
      console.log("🗑️ [WEBHOOK DELETE] Enviando DELETE a:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("🗑️ [WEBHOOK DELETE] Response status:", response.status);
      const result = await response.json();
      console.log("🗑️ [WEBHOOK DELETE] Response body:", result);

      if (result.success) {
        console.log("🗑️ [WEBHOOK DELETE] Éxito - limpiando estado...");

        // Limpiar configuración local
        setWebhookConfig(null);
        setSelectedSessionId("");
        setSelectedEvents(["ALL"]);
        setClientWebhookUrl("");
        setNotifications([]);

        // Actualizar estadísticas
        setWebhookStats((prev) =>
          prev
            ? {
                ...prev,
                webhookActive: false,
                totalNotifications: 0,
                unreadNotifications: 0,
              }
            : null
        );

        toast({
          title: "🗑️ Webhook Eliminado",
          description: "El webhook ha sido eliminado exitosamente",
        });

        // Recargar datos
        const reloadedSessions = await loadSessions();
        await loadWebhookData(reloadedSessions);

        // Cambiar a tab de configuración
        setActiveTab("config");
      } else {
        throw new Error(result.message || "Error desconocido del servidor");
      }
    } catch (error: any) {
      console.error("🗑️ [WEBHOOK DELETE] Error:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo eliminar el webhook",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // 🔧 NUEVA FUNCIÓN: Limpiar webhooks órfanos
  const cleanupOrphanedWebhooks = async () => {
    if (!user?.nombrebot) return;

    try {
      console.log("🧹 [WEBHOOK CLEANUP] Verificando webhooks órfanos...");

      const userId = user.nombrebot;
      const availableSessionIds = sessions.map((s) => s.id);

      // Verificar si hay webhook configurado
      const statsResponse = await fetch(
        `https://backend.autosystemprojects.site/webhook/stats/${userId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();

        if (statsResult.success && statsResult.data?.configExists) {
          const webhookSessionId = statsResult.data.sessionId;

          if (!availableSessionIds.includes(webhookSessionId)) {
            console.log("🧹 [WEBHOOK CLEANUP] ⚠️ WEBHOOK ÓRFANO DETECTADO:", {
              webhookSessionId,
              availableSessions: availableSessionIds,
              webhookActive: statsResult.data.webhookActive,
            });

            // Notificar al usuario sin ser intrusivo
            toast({
              title: "⚠️ Configuración de Webhook",
              description: `Webhook configurado para sesión ${webhookSessionId} que ya no existe. Considera crear uno nuevo.`,
              variant: "default", // No destructive, solo informativo
              duration: 6000,
            });

            // Actualizar stats para reflejar estado órfano
            setWebhookStats((prev) =>
              prev
                ? {
                    ...prev,
                    webhookActive: false,
                    orphaned: true,
                    orphanedSessionId: webhookSessionId,
                  }
                : null
            );

            // Limpiar configuración local del webhook órfano
            setWebhookConfig(null);

            console.log(
              "🧹 [WEBHOOK CLEANUP] Estado actualizado - webhook marcado como órfano"
            );
          } else {
            console.log(
              "🧹 [WEBHOOK CLEANUP] ✅ Webhook válido - sesión existe"
            );
          }
        }
      }
    } catch (error) {
      console.warn("🧹 [WEBHOOK CLEANUP] Error en verificación:", error);
    }
  };

  if (loading) {
    return <WebhooksSkeleton />;
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

      {/* Alertas de membresía */}
      {user?.membershipExpired && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-amber-800 dark:text-amber-200 font-medium">
                  Membresía Expirada - Funciones de Webhook Restringidas
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  Solo puedes ver webhooks existentes. Actualiza tu plan para
                  crear nuevos webhooks.
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard/upgrade")}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Actualizar Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegación de tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notificaciones
              {(webhookStats?.unreadNotifications || 0) > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-4 min-w-4 px-1 py-0 text-xs flex items-center justify-center"
                >
                  {webhookStats?.unreadNotifications || 0}
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
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
            {(Array.isArray(notifications) ? notifications : []).length > 0 && (
              <Button variant="outline" onClick={exportNotifications}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>

        {/* Tab: Resumen */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estado del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Estado del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>WebSocket</span>
                  <Badge variant={wsConnected ? "default" : "destructive"}>
                    {wsConnected ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Webhook</span>
                  <Badge
                    variant={
                      webhookStats?.webhookActive ? "default" : "secondary"
                    }
                  >
                    {webhookStats?.webhookActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Sesiones Disponibles</span>
                  <Badge variant="outline">{sessions.length} sesiones</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Sesiones Autenticadas</span>
                  <Badge variant="outline">
                    {sessions.filter((s) => s.authenticated).length}{" "}
                    autenticadas
                  </Badge>
                </div>

                {webhookStats?.lastNotification && (
                  <div className="flex items-center justify-between">
                    <span>Última Notificación</span>
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(webhookStats.lastNotification)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuración Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Webhook className="h-5 w-5 mr-2" />
                  Configuración Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {webhookConfig ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Webhook ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {webhookConfig.webhookId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyWebhookUrl(webhookConfig.webhookId)
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        URL del Webhook
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={webhookConfig.webhookUrl || ""}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyWebhookUrl(webhookConfig.webhookUrl)
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Eventos Configurados
                        </Label>
                        {!editingEvents && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={startEditingEvents}
                            disabled={user?.membershipExpired}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        )}
                      </div>

                      {editingEvents ? (
                        <div className="space-y-3 mt-2">
                          <div className="grid grid-cols-2 gap-2">
                            {availableEvents.map((event) => (
                              <label
                                key={event}
                                className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={tempSelectedEvents.includes(event)}
                                  onChange={() => toggleEventSelection(event)}
                                  className="rounded"
                                />
                                <span className="text-sm">{event}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={saveEventsChanges}
                              disabled={editing}
                              size="sm"
                            >
                              {editing ? "Guardando..." : "Guardar"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={cancelEditingEvents}
                              disabled={editing}
                              size="sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {webhookConfig.events.map((event) => (
                            <Badge
                              key={event}
                              variant="secondary"
                              className="text-xs"
                            >
                              {event}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Creado: {formatTimestamp(webhookConfig.createdAt)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      No hay webhook configurado
                    </p>
                    <Button onClick={() => setActiveTab("config")} size="sm">
                      Configurar Webhook
                    </Button>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notificaciones en Tiempo Real
                  </CardTitle>
                  <CardDescription>
                    Eventos de WhatsApp y webhooks externos recibidos
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={requestNewNotifications}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Solicitar
                  </Button>
                  {(Array.isArray(notifications)
                    ? notifications.filter((n) => !n.read)
                    : []
                  ).length > 0 && (
                    <Button onClick={markAllAsRead} size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar Todas
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(Array.isArray(notifications) ? notifications : []).length ===
              0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay notificaciones
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Las notificaciones aparecerán aquí cuando ocurran eventos de
                    WhatsApp
                  </p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>
                      Estado WebSocket:{" "}
                      <span
                        className={`font-medium ${
                          wsConnected ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {wsConnected ? "Conectado" : "Desconectado"}
                      </span>
                    </p>
                    <p>
                      Webhook activo:{" "}
                      <span
                        className={`font-medium ${
                          webhookStats?.webhookActive
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {webhookStats?.webhookActive ? "Sí" : "No"}
                      </span>
                    </p>
                  </div>
                  {!webhookConfig && (
                    <Button
                      onClick={() => setActiveTab("config")}
                      size="sm"
                      className="mt-4"
                    >
                      Configurar Webhook
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {(Array.isArray(notifications) ? notifications : []).map(
                    (notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                          notification.read
                            ? "bg-gray-50 dark:bg-gray-800/50"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className={`w-3 h-3 rounded-full ${getEventTypeColor(
                                  notification.eventType
                                )}`}
                              />
                              <Badge variant="outline" className="text-xs">
                                {notification.eventType}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {notification.source}
                              </Badge>
                              {!notification.read && (
                                <Badge className="text-xs bg-blue-600">
                                  Nuevo
                                </Badge>
                              )}
                            </div>

                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {formatTimestamp(notification.timestamp)}
                              {notification.sessionId && (
                                <>
                                  <Smartphone className="h-3 w-3 inline ml-3 mr-1" />
                                  {notification.sessionId}
                                </>
                              )}
                            </div>

                            <div className="text-sm">
                              <details className="cursor-pointer">
                                <summary className="font-medium hover:text-blue-600 select-none">
                                  Ver datos del evento (
                                  {
                                    Object.keys(notification.eventData || {})
                                      .length
                                  }{" "}
                                  campos)
                                </summary>
                                <div className="mt-2 space-y-2">
                                  <div className="text-xs text-gray-500">
                                    Tipo: {notification.eventType} | Fuente:{" "}
                                    {notification.source}
                                  </div>
                                  <pre className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto max-h-40 border">
                                    {JSON.stringify(
                                      notification.eventData,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>
                              </details>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                title="Marcar como leído"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  JSON.stringify(
                                    notification.eventData,
                                    null,
                                    2
                                  )
                                );
                                toast({
                                  title: "📋 Copiado",
                                  description: "Datos copiados al portapapeles",
                                });
                              }}
                              title="Copiar datos"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="config">
          <div className="space-y-6">
            {webhookConfig ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Webhook className="h-5 w-5 mr-2" />
                    Webhook Configurado
                  </CardTitle>
                  <CardDescription>
                    Tu webhook está activo y recibiendo eventos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium">ID del Webhook</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={webhookConfig.webhookId}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyWebhookUrl(webhookConfig.webhookId)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          ID único de tu webhook
                        </p>
                      </div>

                      <div>
                        <Label className="font-medium">URL del Webhook</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={webhookConfig.webhookUrl}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyWebhookUrl(webhookConfig.webhookUrl)
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(webhookConfig.webhookUrl, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Usa esta URL para enviar eventos externos a tu webhook
                        </p>
                      </div>

                      <div>
                        <Label className="font-medium">
                          URL del Cliente (Opcional)
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={webhookConfig.clientWebhookUrl || ""}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyWebhookUrl(
                                webhookConfig.clientWebhookUrl || ""
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          URL donde se envían las notificaciones de WhatsApp
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium">Sesión Vinculada</Label>
                        <Input
                          value={webhookConfig.sessionId || ""}
                          readOnly
                          className="font-mono text-sm"
                        />
                      </div>

                      <div>
                        <Label className="font-medium">
                          Eventos Configurados
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {webhookConfig.events.map((event) => (
                            <Badge key={event} variant="secondary">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={webhookConfig.active}
                            onCheckedChange={setWebhookActive}
                            disabled={user?.membershipExpired}
                          />
                          <Label>Webhook Activo</Label>
                        </div>

                        <Badge
                          variant={
                            webhookConfig.active ? "default" : "secondary"
                          }
                          className="flex items-center gap-1"
                        >
                          <Activity className="h-3 w-3" />
                          {webhookConfig.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {webhookConfig.deliverySettings && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">
                        Configuración de Entrega
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-500">
                            Reintentos
                          </Label>
                          <p className="font-medium">
                            {webhookConfig.deliverySettings.retryAttempts}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Delay (ms)
                          </Label>
                          <p className="font-medium">
                            {webhookConfig.deliverySettings.retryDelay}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">
                            Timeout (ms)
                          </Label>
                          <p className="font-medium">
                            {webhookConfig.deliverySettings.timeout}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Creado: {formatTimestamp(webhookConfig.createdAt)}</p>
                    {webhookConfig.updatedAt && (
                      <p>
                        Actualizado: {formatTimestamp(webhookConfig.updatedAt)}
                      </p>
                    )}
                  </div>

                  {/* 🆕 NUEVA FUNCIONALIDAD: Botones de administración */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={editWebhook}
                      disabled={editing || user?.membershipExpired}
                      variant="default"
                      className="flex-1"
                    >
                      {editing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4 mr-2" />
                      )}
                      {editing ? "Actualizando..." : "Editar Webhook"}
                    </Button>

                    <Button
                      onClick={deleteWebhook}
                      disabled={deleting || user?.membershipExpired}
                      variant="destructive"
                      className="flex-1"
                    >
                      {deleting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {deleting ? "Eliminando..." : "Eliminar Webhook"}
                    </Button>
                  </div>

                  {user?.membershipExpired && (
                    <p className="text-sm text-amber-600 text-center pt-2">
                      Necesitas una membresía activa para administrar webhooks
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configurar Nuevo Webhook
                  </CardTitle>
                  <CardDescription>
                    Configura un webhook para recibir eventos de WhatsApp en
                    tiempo real
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="session-select">Sesión de WhatsApp</Label>
                      <Select
                        value={selectedSessionId}
                        onValueChange={setSelectedSessionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una sesión activa" />
                        </SelectTrigger>
                        <SelectContent>
                          {sessions
                            .filter(
                              (session) =>
                                session.id &&
                                session.id.trim() !== "" &&
                                session.id !== "undefined" &&
                                session.id !== "null" &&
                                session.id.length > 0 &&
                                typeof session.id === "string" &&
                                !session.id.includes("null") &&
                                !session.id.includes("undefined")
                            ) // 🔧 SOLUCION COMPLETA: Filtrar sesiones con IDs estrictamente válidos
                            .map((session) => (
                              <SelectItem
                                key={session.id}
                                value={
                                  session.id || `fallback-${Math.random()}`
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      session.authenticated
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                    }`}
                                  />
                                  {session.id || "Sin ID"}
                                  <Badge
                                    variant={
                                      session.authenticated
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="ml-auto"
                                  >
                                    {session.status || "unknown"}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          {sessions.filter(
                            (session) =>
                              session.id &&
                              session.id.trim() !== "" &&
                              session.id !== "undefined" &&
                              session.id !== "null" &&
                              session.id.length > 0 &&
                              typeof session.id === "string" &&
                              !session.id.includes("null") &&
                              !session.id.includes("undefined")
                          ).length === 0 && (
                            <SelectItem value="no-sessions" disabled>
                              No hay sesiones válidas disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        Solo sesiones autenticadas pueden recibir eventos
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="client-webhook-url">
                        URL del Cliente (Opcional)
                      </Label>
                      <Input
                        id="client-webhook-url"
                        placeholder="https://tu-servidor.com/webhook-endpoint"
                        value={clientWebhookUrl || ""}
                        onChange={(e) => setClientWebhookUrl(e.target.value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        URL donde se enviarán las notificaciones de eventos de
                        WhatsApp
                      </p>
                    </div>

                    <div>
                      <Label>Eventos a Escuchar</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
                        {availableEvents.map((event) => (
                          <div
                            key={event}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={event}
                              checked={selectedEvents.includes(event)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEvents([...selectedEvents, event]);
                                } else {
                                  setSelectedEvents(
                                    selectedEvents.filter((ev) => ev !== event)
                                  );
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={event} className="text-xs">
                              {event}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Selecciona 'MESSAGES_UPSERT' para chatbots (solo
                        mensajes entrantes) o 'ALL' para todos los eventos
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={webhookActive}
                        onCheckedChange={setWebhookActive}
                      />
                      <Label>Activar webhook automáticamente</Label>
                    </div>
                  </div>

                  <Button
                    onClick={createWebhook}
                    disabled={
                      creating || !selectedSessionId || user?.membershipExpired
                    }
                    className="w-full"
                  >
                    {creating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Webhook className="h-4 w-4 mr-2" />
                    )}
                    {creating ? "Creando Webhook..." : "Crear Webhook"}
                  </Button>

                  {user?.membershipExpired && (
                    <p className="text-sm text-amber-600 text-center">
                      Necesitas una membresía activa para crear webhooks
                    </p>
                  )}
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
                Envía webhooks de prueba para verificar la configuración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {webhookConfig ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="test-payload">
                      Payload de Prueba (JSON)
                    </Label>
                    <Textarea
                      id="test-payload"
                      placeholder={`{
  "type": "test_notification",
  "data": {
    "message": "Webhook de prueba desde el panel",
    "timestamp": "${new Date().toISOString()}",
    "source": "dashboard"
  }
}`}
                      value={testPayload || ""}
                      onChange={(e) => setTestPayload(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      Deja vacío para usar un payload de prueba automático
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={testWebhook}
                      disabled={testing}
                      className="flex-1"
                    >
                      {testing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {testing ? "Enviando..." : "Enviar Webhook de Prueba"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setTestPayload("");
                        setTestResult(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpiar
                    </Button>
                  </div>

                  {testResult && (
                    <div className="space-y-2">
                      <Label>Resultado de la Prueba</Label>
                      <div
                        className={`p-4 rounded-lg border ${
                          testResult.success
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {testResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">
                            {testResult.success
                              ? "Prueba Exitosa"
                              : "Prueba Fallida"}
                          </span>
                          {testResult.timestamp && (
                            <span className="text-xs text-gray-500 ml-auto">
                              {formatTimestamp(testResult.timestamp)}
                            </span>
                          )}
                        </div>
                        <pre className="text-sm overflow-x-auto bg-white dark:bg-gray-900 p-2 rounded border">
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Información del webhook */}
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                    <h4 className="font-medium mb-3">Información de Prueba</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>URL de Destino:</span>
                        <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded">
                          {webhookConfig.webhookUrl}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Método:</span>
                        <Badge variant="outline">POST</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Content-Type:</span>
                        <code className="text-xs">application/json</code>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay webhook configurado
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Configura un webhook primero para poder realizar pruebas
                  </p>
                  <Button onClick={() => setActiveTab("config")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Webhook
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmación para eliminar webhook */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este webhook? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteWebhook}
              disabled={deleting}
            >
              {deleting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {deleting ? "Eliminando..." : "Eliminar Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
