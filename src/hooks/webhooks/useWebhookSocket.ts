"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "@/components/ui/use-toast";

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

interface WebhookStats {
  totalNotifications: number;
  unreadNotifications: number;
  webhookActive: boolean;
  lastNotification: string | null;
  connectedClients: number;
}

interface UseWebhookSocketOptions {
  userId: string;
  selectedSessionId?: string;
  autoConnect?: boolean;
  onNotification?: (notification: NotificationItem) => void;
  onStatsUpdate?: (stats: WebhookStats) => void;
}

// Singleton WebSocket Manager CORREGIDO
const createWebSocketManager = () => {
  let instance: WebSocket | null = null;
  let connectionPromise: Promise<WebSocket> | null = null;
  let isConnecting = false;
  let connectionId: string | null = null;
  let subscribers: Set<(ws: WebSocket | null, connected: boolean) => void> =
    new Set();
  let reconnectAttempts = 0;
  let isAuthenticated = false;
  const maxReconnectAttempts = 3;

  const cleanup = () => {
    console.log(`[WS MANAGER] 🧹 Cleanup iniciado (ID: ${connectionId})`);

    if (instance) {
      instance.onopen = null;
      instance.onmessage = null;
      instance.onclose = null;
      instance.onerror = null;
      if (instance.readyState !== WebSocket.CLOSED) {
        instance.close(1000, "Manager cleanup");
      }
      instance = null;
    }

    connectionPromise = null;
    isConnecting = false;
    connectionId = null;
    reconnectAttempts = 0;
    isAuthenticated = false;

    // Notificar a todos los subscribers
    subscribers.forEach((callback) => {
      try {
        callback(null, false);
      } catch (error) {
        console.warn("[WS MANAGER] Error en subscriber callback:", error);
      }
    });

    console.log("[WS MANAGER] ✅ Cleanup completado");
  };

  return {
    getInstance: () => instance,
    isConnected: () => instance?.readyState === WebSocket.OPEN,
    isAuthenticated: () => isAuthenticated,

    subscribe: (
      callback: (ws: WebSocket | null, connected: boolean) => void
    ) => {
      subscribers.add(callback);
      // Notificar estado actual inmediatamente - SOLO UNA VEZ
      setTimeout(() => {
        callback(instance, instance?.readyState === WebSocket.OPEN || false);
      }, 0);

      // Retornar función de limpieza
      return () => subscribers.delete(callback);
    },

    connect: async (url: string): Promise<WebSocket> => {
      // Si ya hay una conexión activa, reutilizarla
      if (instance && instance.readyState === WebSocket.OPEN) {
        console.log("[WS MANAGER] 🔄 Reutilizando conexión existente");
        return instance;
      }

      // Si ya se está conectando, esperar a que termine
      if (isConnecting && connectionPromise) {
        console.log("[WS MANAGER] ⏳ Esperando conexión en progreso");
        return connectionPromise;
      }

      // Evitar demasiados intentos de reconexión
      if (reconnectAttempts >= maxReconnectAttempts) {
        throw new Error(
          `Máximo de intentos de reconexión alcanzado (${maxReconnectAttempts})`
        );
      }

      isConnecting = true;
      connectionId = `conn_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      console.log(
        `[WS MANAGER] 🚀 Iniciando conexión (ID: ${connectionId}, intento: ${
          reconnectAttempts + 1
        })`
      );

      connectionPromise = new Promise((resolve, reject) => {
        try {
          const ws = new WebSocket(url);

          const connectionTimeout = setTimeout(() => {
            console.log("[WS MANAGER] ⏰ Timeout de conexión");
            isConnecting = false;
            reject(new Error("Connection timeout"));
            if (ws.readyState !== WebSocket.CLOSED) {
              ws.close();
            }
          }, 10000); // 10 segundos timeout

          ws.onopen = () => {
            clearTimeout(connectionTimeout);
            instance = ws;
            connectionPromise = null;
            isConnecting = false;
            reconnectAttempts = 0; // Reset en conexión exitosa
            isAuthenticated = false;

            console.log(
              `[WS MANAGER] ✅ Conexión establecida (ID: ${connectionId})`
            );

            // Notificar a subscribers SOLO UNA VEZ
            subscribers.forEach((callback) => {
              try {
                callback(ws, true);
              } catch (error) {
                console.warn("[WS MANAGER] Error en subscriber onopen:", error);
              }
            });

            resolve(ws);
          };

          ws.onerror = (error) => {
            console.error(
              `[WS MANAGER] ❌ Error de conexión (ID: ${connectionId}):`,
              error
            );
            clearTimeout(connectionTimeout);
            connectionPromise = null;
            isConnecting = false;
            reconnectAttempts++;
            isAuthenticated = false;

            subscribers.forEach((callback) => {
              try {
                callback(null, false);
              } catch (error) {
                console.warn(
                  "[WS MANAGER] Error en subscriber onerror:",
                  error
                );
              }
            });

            reject(error);
          };

          ws.onclose = (event) => {
            console.log(
              `[WS MANAGER] 🔴 Conexión cerrada (ID: ${connectionId})`,
              {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
              }
            );

            instance = null;
            connectionPromise = null;
            isConnecting = false;
            isAuthenticated = false;

            // Si no fue un cierre limpio, incrementar intentos
            if (!event.wasClean && event.code !== 1000) {
              reconnectAttempts++;
            }

            subscribers.forEach((callback) => {
              try {
                callback(null, false);
              } catch (error) {
                console.warn(
                  "[WS MANAGER] Error en subscriber onclose:",
                  error
                );
              }
            });
          };

          // Configurar handler de mensajes a nivel de manager
          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);

              if (message.type === "authenticated") {
                isAuthenticated = true;
                console.log("[WS MANAGER] ✅ Autenticación completada");
              }

              // Los mensajes los manejarán los subscribers individualmente
            } catch (error) {
              console.error("[WS MANAGER] ❌ Error procesando mensaje:", error);
            }
          };
        } catch (error) {
          console.error(
            `[WS MANAGER] ❌ Excepción creando WebSocket (ID: ${connectionId}):`,
            error
          );
          connectionPromise = null;
          isConnecting = false;
          reconnectAttempts++;
          reject(error);
        }
      });

      return connectionPromise;
    },

    cleanup,

    authenticate: (userId: string) => {
      if (
        instance &&
        instance.readyState === WebSocket.OPEN &&
        !isAuthenticated
      ) {
        console.log(`[WS MANAGER] 🔑 Autenticando con userId: ${userId}`);
        instance.send(
          JSON.stringify({
            type: "authenticate",
            userId: userId,
          })
        );
      }
    },

    getStats: () => ({
      isConnected: instance?.readyState === WebSocket.OPEN || false,
      connectionId,
      subscribers: subscribers.size,
      reconnectAttempts,
      isAuthenticated,
    }),
  };
};

// Instancia global del manager
const globalWebSocketManager = createWebSocketManager();

export const useWebhookSocket = (options: UseWebhookSocketOptions) => {
  const {
    userId,
    selectedSessionId,
    autoConnect = true,
    onNotification,
    onStatsUpdate,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const processedNotificationIds = useRef<Set<string>>(new Set());
  const lastProcessedTime = useRef<number>(0);
  const isSetupRef = useRef<boolean>(false);

  // Memorizar callbacks para evitar re-creaciones
  const stableOnNotification = useCallback(
    (notification: NotificationItem) => {
      onNotification?.(notification);
    },
    [onNotification]
  );

  const stableOnStatsUpdate = useCallback(
    (stats: WebhookStats) => {
      onStatsUpdate?.(stats);
    },
    [onStatsUpdate]
  );

  // Función para limpiar cache de notificaciones procesadas
  const cleanupProcessedNotifications = useCallback(() => {
    const now = Date.now();
    if (now - lastProcessedTime.current > 300000) {
      // 5 minutos
      processedNotificationIds.current.clear();
      lastProcessedTime.current = now;
      console.log("[WEBHOOK SOCKET] 🧹 Cache de notificaciones limpiado");
    }
  }, []);

  // Función para procesar nuevas notificaciones
  const handleNewNotification = useCallback(
    (notification: NotificationItem) => {
      if (!notification.id || !notification.eventType) {
        console.warn(
          "[WEBHOOK SOCKET] ⚠️ Notificación inválida:",
          notification
        );
        return;
      }

      // Verificar duplicados
      if (processedNotificationIds.current.has(notification.id)) {
        console.log(
          "[WEBHOOK SOCKET] 🚫 Notificación duplicada:",
          notification.id
        );
        return;
      }

      // Limpiar cache periódicamente
      cleanupProcessedNotifications();

      // Marcar como procesada
      processedNotificationIds.current.add(notification.id);

      // Limitar tamaño del cache
      if (processedNotificationIds.current.size > 100) {
        const oldestIds = Array.from(processedNotificationIds.current).slice(
          0,
          50
        );
        oldestIds.forEach((id) => processedNotificationIds.current.delete(id));
      }

      console.log("[WEBHOOK SOCKET] 📬 Nueva notificación procesada:", {
        id: notification.id,
        eventType: notification.eventType,
        sessionId: notification.sessionId,
      });

      // Callback personalizado
      stableOnNotification(notification);

      // Toast para mensajes importantes
      if (!notification.read && notification.eventType === "MESSAGES_UPSERT") {
        toast({
          title: "📨 Nuevo Mensaje",
          description: `Mensaje entrante en sesión ${
            notification.sessionId || "desconocida"
          }`,
          duration: 3000,
        });
      }
    },
    [stableOnNotification, cleanupProcessedNotifications]
  );

  // Configurar handlers del WebSocket - SOLO UNA VEZ POR CONEXIÓN
  const setupWebSocketHandlers = useCallback(
    (websocket: WebSocket) => {
      if (!websocket || !userId || isSetupRef.current) return;

      console.log("[WEBHOOK SOCKET] ⚙️ Configurando handlers (SOLO UNA VEZ)");
      isSetupRef.current = true;

      // Handler de mensajes ÚNICO
      const originalOnMessage = websocket.onmessage;

      websocket.onmessage = (event) => {
        // Llamar al handler original del manager primero
        if (originalOnMessage) {
          originalOnMessage.call(websocket, event);
        }

        try {
          const message = JSON.parse(event.data);
          console.log("[WEBHOOK SOCKET] 📨 Mensaje recibido:", message.type);

          switch (message.type) {
            case "authenticated":
              console.log("[WEBHOOK SOCKET] ✅ Autenticado exitosamente");
              if (message.stats && stableOnStatsUpdate) {
                stableOnStatsUpdate(message.stats);
              }
              setConnectionError(null);
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
                  source: "whatsapp",
                };
                handleNewNotification(formattedNotification);
              }
              break;

            case "notifications":
              console.log(
                "[WEBHOOK SOCKET] 📋 Lista de notificaciones recibida"
              );
              break;

            case "error":
              const errorMsg =
                message.message ||
                message.error ||
                "Error desconocido del servidor";
              console.warn("[WEBHOOK SOCKET] ⚠️ Error del servidor:", errorMsg);
              setConnectionError(errorMsg);
              break;

            case "ping":
            case "pong":
            case "heartbeat":
              // Keep-alive messages
              break;

            default:
              console.log(
                "[WEBHOOK SOCKET] 📋 Mensaje no manejado:",
                message.type
              );

              // Intentar procesar como evento de WhatsApp
              if (
                message.type &&
                typeof message.type === "string" &&
                message.type.includes("_")
              ) {
                const eventNotification: NotificationItem = {
                  id: `event_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                  sessionId: selectedSessionId || userId,
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
          console.error("[WEBHOOK SOCKET] ❌ Error procesando mensaje:", error);
        }
      };

      // Handler de errores
      websocket.onerror = (error) => {
        console.error("[WEBHOOK SOCKET] ❌ Error WebSocket:", error);
        setConnectionError("Error de conexión WebSocket");
        isSetupRef.current = false;
      };

      // Autenticar SOLO SI NO ESTÁ AUTENTICADO
      if (!globalWebSocketManager.isAuthenticated()) {
        globalWebSocketManager.authenticate(userId);
      }
    },
    [userId, selectedSessionId, stableOnStatsUpdate, handleNewNotification]
  );

  // Función para conectar con debounce
  const connect = useCallback(async () => {
    if (!userId) {
      console.log("[WEBHOOK SOCKET] ⚠️ No hay userId, omitiendo conexión");
      return;
    }

    if (globalWebSocketManager.isConnected()) {
      console.log("[WEBHOOK SOCKET] ⚠️ Ya conectado");
      return;
    }

    try {
      console.log("[WEBHOOK SOCKET] 🔌 Iniciando conexión...");
      const websocket = await globalWebSocketManager.connect(
        "wss://backend.autosystemprojects.site/ws"
      );
      // Los handlers se configurarán en el subscriber callback
    } catch (error: any) {
      console.error("[WEBHOOK SOCKET] ❌ Error conectando:", error);
      setConnectionError(error.message || "Error de conexión");

      // Reintentar después de un delay MÁS LARGO
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (autoConnect && userId && !globalWebSocketManager.isConnected()) {
          console.log("[WEBHOOK SOCKET] 🔄 Reintentando conexión...");
          connect();
        }
      }, 10000); // 10 segundos en lugar de 5
    }
  }, [userId, autoConnect]);

  // Función para desconectar
  const disconnect = useCallback(() => {
    console.log("[WEBHOOK SOCKET] 🔌 Desconectando...");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    isSetupRef.current = false;
    setWs(null);
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  // Effect principal para manejar conexión - CON DEPENDENCIES ESTABLES
  useEffect(() => {
    if (!userId) return;

    // Suscribirse al manager global
    const unsubscribe = globalWebSocketManager.subscribe(
      (websocket, connected) => {
        setWs(websocket);
        setIsConnected(connected);

        if (websocket && connected && !isSetupRef.current) {
          setupWebSocketHandlers(websocket);
        } else if (!connected) {
          isSetupRef.current = false;
        }
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Conectar si está configurado para auto-conectar - CON DEBOUNCE MÁS LARGO
    if (autoConnect) {
      const debounceTimeout = setTimeout(() => {
        connect();
      }, 2000); // 2 segundos de debounce

      return () => {
        clearTimeout(debounceTimeout);
        unsubscribe();
      };
    }

    return () => {
      unsubscribe();
    };
  }, [userId, autoConnect]); // SOLO estas dependencies - NO selectedSessionId

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnect();
      processedNotificationIds.current.clear();
    };
  }, [disconnect]);

  // Función para enviar mensajes
  const sendMessage = useCallback(
    (message: any) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
      }
      return false;
    },
    [ws]
  );

  return {
    isConnected,
    connectionError,
    ws,
    connect,
    disconnect,
    sendMessage,
    stats: globalWebSocketManager.getStats(),
  };
};

export default useWebhookSocket;
