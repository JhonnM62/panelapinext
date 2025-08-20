"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  List,
  Plus,
  Bell,
  Play,
  RefreshCw,
  Download,
  CreditCard,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useWebhookSocket } from "@/hooks/webhooks/useWebhookSocket";

// Componentes
import WebhookStatsCards from "./components/WebhookStats";
import WebhookList from "./components/WebhookList";
import WebhookForm from "./components/WebhookForm";
import NotificationsList from "./components/NotificationsList";
import WebhookTest from "./components/WebhookTest";
import WebhookCleanup from "./WebhookCleanup";

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

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
  statusCode?: number;
  payload?: any;
}

interface WebhookManagerProps {
  sessions: SessionOption[];
}

export default function WebhookManager({ sessions = [] }: WebhookManagerProps) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { suscripcion, resourceLimits, checkLimits } = usePlanLimits();
  
  // 🛡️ Asegurar que sessions siempre sea un array válido
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  
  // Estados principales
  const [activeTab, setActiveTab] = useState("list");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[]>([]);
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para operaciones
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Estados para edición
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  
  // Estados para pruebas
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  
  // 🔧 NUEVO: Estado para detección de webhooks fantasma
  const [phantomWebhooks, setPhantomWebhooks] = useState<string[]>([]);
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(true);
  
  // Cache para prevenir notificaciones duplicadas
  const processedNotificationIds = useRef<Set<string>>(new Set());
  const lastProcessedTime = useRef<number>(0);

  // Función para manejar nuevas notificaciones - DEFINIDA PRIMERO
  const handleNewNotification = useCallback((notification: NotificationItem) => {
    console.log("[WEBHOOK MANAGER] 📬 Nueva notificación:", notification);

    // Verificar duplicados
    if (processedNotificationIds.current.has(notification.id)) {
      console.log("[WEBHOOK MANAGER] 🚫 Notificación duplicada:", notification.id);
      return;
    }

    // Limpiar cache periódicamente
    const now = Date.now();
    if (now - lastProcessedTime.current > 300000) { // 5 minutos
      processedNotificationIds.current.clear();
      lastProcessedTime.current = now;
    }

    // Marcar como procesada
    processedNotificationIds.current.add(notification.id);

    // Actualizar lista de notificaciones
    setNotifications((prev) => {
      const existingIndex = prev.findIndex((n) => n.id === notification.id);
      
      if (existingIndex >= 0) {
        // Actualizar existente
        const updated = [...prev];
        updated[existingIndex] = notification;
        return updated;
      }

      // Agregar nueva (máximo 50)
      return [notification, ...prev.slice(0, 49)];
    });

    // Actualizar estadísticas
    setWebhookStats((prev) => {
      if (!prev) {
        return {
          totalNotifications: 1,
          unreadNotifications: notification.read ? 0 : 1,
          webhookActive: true,
          lastNotification: notification.timestamp,
          connectedClients: 1,
        };
      }

      return {
        ...prev,
        totalNotifications: prev.totalNotifications + 1,
        unreadNotifications: prev.unreadNotifications + (notification.read ? 0 : 1),
        lastNotification: notification.timestamp,
      };
    });
  }, []);

  // WebSocket connection - ESTABILIZADO para evitar re-renders
  const stableUserId = useMemo(() => user?.nombrebot || "", [user?.nombrebot]);
  
  const stableOnNotification = useCallback((notification: NotificationItem) => {
    handleNewNotification(notification);
  }, [handleNewNotification]);
  
  const stableOnStatsUpdate = useCallback((stats: WebhookStats) => {
    setWebhookStats(stats);
  }, []);
  
  const {
    isConnected: wsConnected,
    connectionError,
    connect: connectWebSocket,
  } = useWebhookSocket({
    userId: stableUserId,
    autoConnect: true,
    onNotification: stableOnNotification,
    onStatsUpdate: stableOnStatsUpdate,
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (!user) return;

    const initializeData = async () => {
      await loadInitialData();
      
      // Limpieza de webhooks órfanos después de cargar
      setTimeout(() => {
        if (safeSessions && safeSessions.length > 0) {
          cleanupOrphanedWebhooks();
        }
      }, 2000);
    };
    
    initializeData();
  }, [user]);

  // Limpiar notificaciones cuando cambien las sesiones
  useEffect(() => {
    if (safeSessions && safeSessions.length > 0 && notifications && notifications.length > 0) {
      cleanupOrphanedNotifications(safeSessions);
    }
  }, [safeSessions]);

  // Limpieza automática periódica (cada 2 minutos)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (safeSessions && safeSessions.length >= 0 && notifications && notifications.length > 0) {
        cleanupOrphanedNotifications(safeSessions);
      }
      
      // Limpiar cache de IDs procesados
      const now = Date.now();
      if (now - lastProcessedTime.current > 300000) {
        processedNotificationIds.current.clear();
        lastProcessedTime.current = now;
      }
    }, 120000); // 2 minutos

    return () => clearInterval(cleanupInterval);
  }, [safeSessions, notifications]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log("🔍 [WEBHOOKS] Cargando datos iniciales...");
      await Promise.all([
        loadAllWebhooks(),
        loadWebhookStats(),
        loadNotifications(),
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllWebhooks = async () => {
    if (!user?.nombrebot) return;

    try {
      const response = await fetch(
        `http://100.42.185.2:8015/webhook/user/${user.nombrebot}/list`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          // 🔧 NUEVO: Detectar webhooks fantasma comparando con servidor
          const serverWebhooks = result.data;
          const currentWebhooks = webhookConfigs;
          
          const phantoms = currentWebhooks.filter(localWebhook => 
            !serverWebhooks.find(serverWebhook => 
              serverWebhook.webhookId === localWebhook.webhookId
            )
          ).map(phantom => phantom.webhookId);
          
          if (phantoms.length > 0 && autoCleanupEnabled) {
            console.log(`🔧 [PHANTOM DETECTION] Encontrados ${phantoms.length} webhooks fantasma:`, phantoms);
            setPhantomWebhooks(phantoms);
            
            toast({
              title: "👻 Webhooks Fantasma Detectados",
              description: `Se encontraron ${phantoms.length} webhook(s) que no existen en el servidor`,
              variant: "default",
            });
            
            // Auto-limpiar webhooks fantasma después de 3 segundos
            setTimeout(() => {
              cleanupPhantomWebhooks(phantoms);
            }, 3000);
          }
          
          setWebhookConfigs(result.data);
        } else {
          setWebhookConfigs([]);
        }
      } else {
        setWebhookConfigs([]);
      }
    } catch (error) {
      console.error("Error cargando webhooks:", error);
      setWebhookConfigs([]);
    }
  };

  // 🔧 NUEVA FUNCIÓN: Limpieza automática de webhooks fantasma
  const cleanupPhantomWebhooks = async (phantomIds: string[]) => {
    if (phantomIds.length === 0) return;
    
    console.log(`🧹 [PHANTOM CLEANUP] Limpiando ${phantomIds.length} webhooks fantasma:`, phantomIds);
    
    // Remover de la lista local inmediatamente
    setWebhookConfigs(prev => 
      prev.filter(webhook => !phantomIds.includes(webhook.webhookId))
    );
    
    // Limpiar del estado de phantoms
    setPhantomWebhooks([]);
    
    // Notificar al usuario
    toast({
      title: "🧹 Limpieza Automática",
      description: `Se removieron ${phantomIds.length} webhook(s) fantasma de la lista`,
      variant: "default",
    });
    
    // Recargar stats para reflejar los cambios
    await loadWebhookStats();
  };
  
  // 🔧 NUEVA FUNCIÓN: Verificación manual de webhooks fantasma
  const checkForPhantomWebhooks = async () => {
    if (!user?.nombrebot) return;
    
    console.log('🔍 [PHANTOM CHECK] Verificando webhooks fantasma...');
    
    try {
      // Obtener lista actual del servidor
      const response = await fetch(
        `http://100.42.185.2:8015/webhook/user/${user.nombrebot}/list`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          const serverWebhooks = result.data;
          const localWebhooks = webhookConfigs;
          
          // Encontrar webhooks que existen localmente pero no en el servidor
          const phantoms = localWebhooks.filter(localWebhook => 
            !serverWebhooks.find(serverWebhook => 
              serverWebhook.webhookId === localWebhook.webhookId
            )
          );
          
          if (phantoms.length > 0) {
            console.log(`👻 [PHANTOM CHECK] Encontrados ${phantoms.length} webhooks fantasma:`);
            phantoms.forEach(phantom => {
              console.log(`   - ${phantom.webhookId} (sesión: ${phantom.sessionId})`);
            });
            
            const phantomIds = phantoms.map(p => p.webhookId);
            setPhantomWebhooks(phantomIds);
            
            const shouldClean = confirm(
              `Se encontraron ${phantoms.length} webhook(s) fantasma que no existen en el servidor.\n\n` +
              `IDs: ${phantomIds.join(', ')}\n\n` +
              `¿Deseas removerlos de la lista local?`
            );
            
            if (shouldClean) {
              await cleanupPhantomWebhooks(phantomIds);
            }
          } else {
            console.log('✅ [PHANTOM CHECK] No se encontraron webhooks fantasma');
            toast({
              title: "✅ Verificación Completada",
              description: "No se encontraron webhooks fantasma",
            });
          }
          
          // Actualizar la lista con datos frescos del servidor
          setWebhookConfigs(serverWebhooks);
        }
      }
    } catch (error) {
      console.error('❌ [PHANTOM CHECK] Error verificando webhooks:', error);
      toast({
        title: "❌ Error de Verificación",
        description: "No se pudo verificar el estado de los webhooks",
        variant: "destructive",
      });
    }
  };

  const loadWebhookStats = async () => {
    if (!user?.nombrebot) return;

    try {
      const response = await fetch(
        `http://100.42.185.2:8015/webhook/stats/${user.nombrebot}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setWebhookStats(result.data);
        }
      }
    } catch (error) {
      console.warn("Error cargando stats:", error);
    }
  };

  const loadNotifications = async () => {
    if (!user?.nombrebot) return;

    try {
      const response = await fetch(
        `http://100.42.185.2:8015/webhook/notifications/${user.nombrebot}?limit=50&offset=0`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const notificationsData = Array.isArray(result.data.notifications)
            ? result.data.notifications
            : Array.isArray(result.data)
            ? result.data
            : [];

          setNotifications(notificationsData);
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.warn("Error cargando notificaciones:", error);
      setNotifications([]);
    }
  };

  const createWebhook = async (formData: {
    selectedSessionId: string;
    clientWebhookUrl: string;
    selectedEvents: string[];
    webhookActive: boolean;
  }) => {
    // Verificar límites del plan
    const canCreate = await checkLimits('webhooks');
    if (!canCreate) {
      toast({
        title: "🔒 Límite Alcanzado",
        description: "Has alcanzado el límite de webhooks de tu plan. Actualiza para crear más.",
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
      // 🔧 CORRECCIÓN: Usar siempre el email del usuario autenticado para consistencia
      const requestBody = {
        userId: user.nombrebot, // Usar el email del usuario autenticado
        sessionId: formData.selectedSessionId,
        events: formData.selectedEvents,
        webhookUrl: formData.clientWebhookUrl || null,
      };

      const response = await fetch("http://100.42.185.2:8015/webhook/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const newWebhook = {
          userId: result.data.userId,
          sessionId: result.data.sessionId,
          webhookId: result.data.id || result.data.webhookId,
          webhookUrl: result.data.webhookUrl,
          clientWebhookUrl: result.data.clientWebhookUrl,
          events: result.data.events,
          active: result.data.active,
          createdAt: result.data.createdAt,
          deliverySettings: result.data.deliverySettings,
        };

        setWebhookConfigs(prev => [newWebhook, ...prev]);

        toast({
          title: "✅ Webhook Creado",
          description: `Webhook configurado para sesión ${result.data.sessionId}`,
        });

        // Recargar datos
        setTimeout(async () => {
          await Promise.all([loadAllWebhooks(), loadWebhookStats()]);
        }, 1000);

        setActiveTab("list");
      } else {
        throw new Error(result.message || "Error desconocido del servidor");
      }
    } catch (error: any) {
      console.error("Error creando webhook:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo crear el webhook",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const updateWebhook = async (formData: {
    selectedSessionId: string;
    clientWebhookUrl: string;
    selectedEvents: string[];
    webhookActive: boolean;
  }) => {
    if (!editingWebhook) return;

    setEditing(true);
    try {
      const requestBody = {
        webhookId: editingWebhook.webhookId,
        events: formData.selectedEvents,
        webhookUrl: formData.clientWebhookUrl || null,
        active: formData.webhookActive,
      };

      const url = `http://100.42.185.2:8015/webhook/${editingWebhook.webhookId}/update`;
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        // Actualizar en la lista local
        setWebhookConfigs(prev => 
          prev.map(webhook => 
            webhook.webhookId === editingWebhook.webhookId 
              ? {
                  ...webhook,
                  events: formData.selectedEvents,
                  clientWebhookUrl: formData.clientWebhookUrl,
                  active: formData.webhookActive,
                  updatedAt: new Date().toISOString(),
                }
              : webhook
          )
        );

        toast({
          title: "✅ Webhook Actualizado",
          description: "Configuración actualizada exitosamente",
        });

        // Limpiar estado de edición
        cancelEdit();
        setActiveTab("list");
      } else {
        throw new Error(result.message || "Error desconocido del servidor");
      }
    } catch (error: any) {
      console.error("Error actualizando webhook:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo actualizar el webhook",
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    setDeleting(true);
    try {
      console.log(`[WEBHOOK DELETE] Iniciando eliminación de webhook: ${webhookId}`);
      
      const url = `http://100.42.185.2:8015/webhook/${webhookId}/delete`;
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log(`[WEBHOOK DELETE] Respuesta HTTP: ${response.status}`);

      // 🔧 MEJORA: Manejar diferentes códigos de estado
      if (response.status === 404) {
        // Webhook ya no existe - remover de la lista local
        console.log(`[WEBHOOK DELETE] Webhook ${webhookId} no encontrado en servidor, removiendo de lista local`);
        
        setWebhookConfigs(prev => prev.filter(webhook => webhook.webhookId !== webhookId));
        
        toast({
          title: "🗑️ Webhook Limpiado",
          description: "El webhook fantasma ha sido removido de la lista",
        });
        
        await loadWebhookStats();
        return;
      }

      const result = await response.json();
      console.log(`[WEBHOOK DELETE] Resultado:`, result);

      if (result.success || response.ok) {
        // Remover de la lista local
        setWebhookConfigs(prev => prev.filter(webhook => webhook.webhookId !== webhookId));

        toast({
          title: "🗑️ Webhook Eliminado",
          description: "El webhook ha sido eliminado exitosamente",
        });

        // Recargar stats
        await loadWebhookStats();
      } else {
        throw new Error(result.message || "Error desconocido del servidor");
      }
    } catch (error: any) {
      console.error(`[WEBHOOK DELETE] Error eliminando webhook ${webhookId}:`, error);
      
      // 🔧 MEJORA: Si es un webhook fantasma, ofrecer limpieza
      if (error.message?.includes('Webhook no encontrado') || error.message?.includes('not found')) {
        console.log(`[WEBHOOK DELETE] Detectado webhook fantasma: ${webhookId}`);
        
        // Remover de la lista local automáticamente
        setWebhookConfigs(prev => prev.filter(webhook => webhook.webhookId !== webhookId));
        
        toast({
          title: "👻 Webhook Fantasma Removido",
          description: "El webhook no existía en el servidor y fue removido de la lista local",
          variant: "default",
        });
        
        return;
      }
      
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo eliminar el webhook",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const testWebhook = async (webhook: WebhookConfig, payload: any) => {
    if (!payload) {
      toast({
        title: "Error",
        description: "JSON inválido en el payload de prueba",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(
        `http://100.42.185.2:8015/webhook/${webhook.webhookId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      const testResultData: TestResult = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
        statusCode: response.status,
        payload: payload,
      };

      if (!result.success) {
        testResultData.error = result.message || "Error en la prueba del webhook";
      }

      setTestResult(testResultData);

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
      console.error("Error probando webhook:", error);
      const errorResult: TestResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      setTestResult(errorResult);

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
      // 🔧 CORRECCIÓN: Usar siempre el email del usuario autenticado
      const userEmail = user.nombrebot;

      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) return;

      // Verificar si la sesión aún existe
      if (notification.sessionId && safeSessions && safeSessions.length > 0) {
        const sessionExists = safeSessions.some((s) => s.id === notification.sessionId);
        if (!sessionExists) {
          // Limpiar notificación huérfana
          setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
          setWebhookStats((prev) =>
            prev ? {
              ...prev,
              unreadNotifications: Math.max(0, prev.unreadNotifications - (!notification.read ? 1 : 0)),
              totalNotifications: Math.max(0, prev.totalNotifications - 1),
            } : null
          );
          return;
        }
      }

      const response = await fetch(
        `http://100.42.185.2:8015/webhook/notifications/${userEmail}/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ read: true }),
        }
      );

      if (response.status === 404 || response.status === 410) {
        // Limpiar notificación que ya no existe
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setWebhookStats((prev) =>
          prev ? {
            ...prev,
            unreadNotifications: Math.max(0, prev.unreadNotifications - (!notification.read ? 1 : 0)),
            totalNotifications: Math.max(0, prev.totalNotifications - 1),
          } : null
        );
        return;
      }

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );

        setWebhookStats((prev) =>
          prev ? {
            ...prev,
            unreadNotifications: Math.max(0, prev.unreadNotifications - 1),
          } : null
        );
      }
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);

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
      await Promise.all([
        loadAllWebhooks(),
        loadWebhookStats(),
        loadNotifications(),
      ]);

      toast({
        title: "🔄 Actualizado",
        description: "Datos actualizados correctamente",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const exportNotifications = () => {
    const csv = [
      "ID,Tipo de Evento,Timestamp,Leído,Fuente,Sesión",
      ...notifications.map(
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
    a.download = `webhooks_notifications_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "📁 Exportado",
      description: "Notificaciones exportadas a CSV",
    });
  };

  const cleanupOrphanedWebhooks = async () => {
    if (!user?.nombrebot || !safeSessions || safeSessions.length === 0) return;
    
    try {
      const availableSessionIds = safeSessions.map(s => s.id);
      const orphanedWebhooks = webhookConfigs.filter(webhook => 
        !availableSessionIds.includes(webhook.sessionId)
      );
      
      if (orphanedWebhooks.length > 0) {
        console.log('🧹 [WEBHOOK CLEANUP] Webhooks órfanos detectados:', orphanedWebhooks.length);
        
        toast({
          title: "⚠️ Configuración de Webhooks",
          description: `Se encontraron ${orphanedWebhooks.length} webhook(s) configurados para sesiones que ya no existen.`,
          variant: "default",
          duration: 6000
        });
      }
    } catch (error) {
      console.warn('🧹 [WEBHOOK CLEANUP] Error en verificación:', error);
    }
  };

  const cleanupOrphanedNotifications = (currentSessions: SessionOption[]) => {
    try {
      // Verificar que currentSessions no sea undefined o null
      if (!currentSessions || !Array.isArray(currentSessions)) {
        console.warn('🧹 [WEBHOOK CLEANUP] currentSessions no es válido:', currentSessions);
        return;
      }

      // Verificar que notifications exista y sea un array
      if (!notifications || !Array.isArray(notifications)) {
        console.warn('🧹 [WEBHOOK CLEANUP] notifications no es válido:', notifications);
        return;
      }

      const currentSessionIds = currentSessions.map((s) => s.id);
      const validNotifications = notifications.filter((notification) => {
        if (!notification.sessionId) return true;
        return currentSessionIds.includes(notification.sessionId);
      });

      const removedCount = notifications.length - validNotifications.length;
      if (removedCount > 0) {
        console.log(`🧹 [WEBHOOK CLEANUP] Limpiando ${removedCount} notificaciones órfanas`);
        setNotifications(validNotifications);

        const unreadCount = validNotifications.filter((n) => !n.read).length;
        setWebhookStats((prev) =>
          prev ? {
            ...prev,
            totalNotifications: validNotifications.length,
            unreadNotifications: unreadCount,
          } : null
        );
      }
    } catch (error) {
      console.error("🧹 [WEBHOOK CLEANUP] Error en limpieza:", error);
    }
  };

  // Funciones de navegación
  const openEditWebhook = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setSelectedSessionId(webhook.sessionId);
    setActiveTab("create");
  };

  const cancelEdit = () => {
    setEditingWebhook(null);
    setSelectedSessionId("");
  };

  const handleCreateNew = () => {
    cancelEdit(); // Limpiar cualquier edición
    setActiveTab("create");
  };

  const handleFormSubmit = (formData: any) => {
    if (editingWebhook) {
      updateWebhook(formData);
    } else {
      createWebhook(formData);
    }
  };

  const handleFormCancel = () => {
    cancelEdit();
    setActiveTab("list");
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
      <WebhookStatsCards
        stats={webhookStats}
        resourceLimits={resourceLimits}
        webhookConfigs={webhookConfigs}
        isConnected={wsConnected}
      />

      {/* Alerta de webhooks fantasma detectados */}
      {phantomWebhooks.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-800 dark:text-red-200">
              👻 Webhooks Fantasma Detectados
            </h3>
          </div>
          <p className="text-red-700 dark:text-red-300 text-sm mb-3">
            Se encontraron {phantomWebhooks.length} webhook(s) que existen en la lista local pero no en el servidor:
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {phantomWebhooks.map((phantomId, index) => (
              <code key={index} className="text-xs bg-red-100 dark:bg-red-800 px-2 py-1 rounded">
                {phantomId}
              </code>
            ))}
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => cleanupPhantomWebhooks(phantomWebhooks)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpiar Ahora
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setPhantomWebhooks([])}
            >
              Ignorar
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs text-red-700 dark:text-red-300">
                <input
                  type="checkbox"
                  checked={autoCleanupEnabled}
                  onChange={(e) => setAutoCleanupEnabled(e.target.checked)}
                  className="mr-1"
                />
                Limpieza automática
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error de conexión WebSocket */}
      {connectionError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 text-sm">
            ⚠️ Error de conexión WebSocket: {connectionError}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={connectWebSocket}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconectar
          </Button>
        </div>
      )}

      {/* Navegación de tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {editingWebhook ? "Editar" : "Crear"}
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
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Pruebas
            </TabsTrigger>
            <TabsTrigger value="cleanup" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Limpieza
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            
            {/* 🔧 NUEVO: Botón para verificar webhooks fantasma */}
            <Button 
              variant={phantomWebhooks.length > 0 ? "destructive" : "outline"} 
              onClick={checkForPhantomWebhooks}
              disabled={loading}
            >
              {phantomWebhooks.length > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Fantasmas ({phantomWebhooks.length})
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Fantasmas
                </>
              )}
            </Button>
            
            {notifications.length > 0 && (
              <Button variant="outline" onClick={exportNotifications}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>

        {/* Tab: Lista de Webhooks */}
        <TabsContent value="list">
          <WebhookList
            webhookConfigs={webhookConfigs}
            sessions={safeSessions}
            loading={loading}
            deleting={deleting}
            testing={testing}
            onEdit={openEditWebhook}
            onDelete={deleteWebhook}
            onTest={testWebhook}
            onCreateNew={handleCreateNew}
          />
        </TabsContent>

        {/* Tab: Crear/Editar Webhook */}
        <TabsContent value="create">
          <WebhookForm
            editingWebhook={editingWebhook}
            sessions={safeSessions}
            resourceLimits={resourceLimits}
            creating={creating}
            editing={editing}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </TabsContent>

        {/* Tab: Notificaciones */}
        <TabsContent value="notifications">
          <NotificationsList
            notifications={notifications}
            loading={loading}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
        </TabsContent>

        {/* Tab: Pruebas */}
        <TabsContent value="test">
          <WebhookTest
            webhookConfigs={webhookConfigs}
            testing={testing}
            testResult={testResult}
            onTest={testWebhook}
          />
        </TabsContent>

        {/* Tab: Limpieza y Diagnóstico */}
        <TabsContent value="cleanup">
          <WebhookCleanup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
