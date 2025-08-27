"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Webhook,
  Bell,
  Activity,
  Users,
  Globe,
  Settings,
  Plus,
  Smartphone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { sessionsAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import WebhookManager from "@/components/webhooks/WebhookManagerClean";
import { toast } from "@/components/ui/use-toast";

interface SessionOption {
  id: string;
  status: string;
  authenticated: boolean;
  nombresesion?: string | null;
  phoneNumber?: string | null;
}

import { Skeleton } from "@/components/ui/skeleton";

// 🎨 WEBHOOKS SKELETON COMPONENT
function WebhooksSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-gradient-to-r from-blue-200 to-purple-200" />
            <Skeleton className="h-4 w-96 bg-gray-200" />
          </div>
          <Skeleton className="h-10 w-32 bg-blue-200" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="relative overflow-hidden border-l-4 border-l-gray-200"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-8 w-16 bg-gradient-to-r from-gray-300 to-gray-400" />
                  <Skeleton className="h-3 w-32 bg-gray-200" />
                </div>
                <Skeleton className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-200 to-purple-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-gray-300" />
              <Skeleton className="h-4 w-64 bg-gray-200" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-24 bg-gray-200" />
              <Skeleton className="h-8 w-24 bg-gray-200" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tab buttons skeleton */}
          <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 flex-1 bg-gray-200" />
            ))}
          </div>

          {/* Content Area Skeleton */}
          <div className="space-y-6">
            {/* Webhook configuration */}
            <div className="space-y-4">
              <div className="grid gap-4">
                {/* Session selector */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-gray-300" />
                  <Skeleton className="h-10 w-full bg-gray-200" />
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-gray-300" />
                  <Skeleton className="h-10 w-full bg-gray-200" />
                </div>

                {/* Events selection */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-40 bg-gray-300" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4 bg-gray-200" />
                        <Skeleton className="h-4 w-20 bg-gray-200" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-2 pt-4">
                  <Skeleton className="h-10 w-32 bg-gradient-to-r from-blue-200 to-purple-200" />
                  <Skeleton className="h-10 w-24 bg-gray-200" />
                </div>
              </div>
            </div>

            {/* Documentation preview */}
            <div className="space-y-4">
              <Skeleton className="h-6 w-48 bg-gray-300" />
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32 bg-gray-300" />
                      <Skeleton className="h-20 w-full bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional shimmer effect */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

// 🚨 PLAN REQUIRED COMPONENT
function PlanRequiredCard() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Webhook className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              Plan Requerido
            </h3>
            <p className="text-amber-800 dark:text-amber-200 text-lg leading-relaxed">
              Necesitas una suscripción activa para acceder al sistema de
              webhooks. Los webhooks te permiten integrar WhatsApp con tus
              sistemas externos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ¿Qué son los Webhooks?
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
              <li>• Recibe notificaciones en tiempo real</li>
              <li>• Integra con CRM, bases de datos</li>
              <li>• Automatiza respuestas personalizadas</li>
              <li>• Sincroniza datos automáticamente</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              asChild
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold shadow-lg"
            >
              <a href="/dashboard/plans">
                <Webhook className="h-5 w-5 mr-2" />
                Ver Planes
              </a>
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1 h-12 text-lg font-medium"
            >
              <a href="/dashboard">Volver al Dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 📊 STATS CARD COMPONENT
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: any;
  color: "blue" | "green" | "purple" | "orange";
}) {
  return (
    <Card
      className={cn(
        "w-full hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] border-l-4",
        color === "blue" && "border-l-blue-500",
        color === "green" && "border-l-green-500",
        color === "purple" && "border-l-purple-500",
        color === "orange" && "border-l-orange-500"
      )}
    >
      <CardContent className="p-3 sm:p-6 flex items-center justify-between">
        <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
            {title}
          </p>
          <p
            className={cn(
              "text-lg sm:text-2xl lg:text-3xl font-bold",
              color === "blue" && "text-blue-600 dark:text-blue-400",
              color === "green" && "text-green-600 dark:text-green-400",
              color === "purple" && "text-purple-600 dark:text-purple-400",
              color === "orange" && "text-orange-600 dark:text-orange-400"
            )}
          >
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {description}
          </p>
        </div>
        <div
          className={cn(
            "p-2 sm:p-3 rounded-full flex-shrink-0",
            color === "blue" && "bg-blue-100 dark:bg-blue-900/30",
            color === "green" && "bg-green-100 dark:bg-green-900/30",
            color === "purple" && "bg-purple-100 dark:bg-purple-900/30",
            color === "orange" && "bg-orange-100 dark:bg-orange-900/30"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8",
              color === "blue" && "text-blue-600 dark:text-blue-400",
              color === "green" && "text-green-600 dark:text-green-400",
              color === "purple" && "text-purple-600 dark:text-purple-400",
              color === "orange" && "text-orange-600 dark:text-orange-400"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function WebhooksPage() {
  const { user } = useAuthStore();
  const { suscripcion, resourceLimits, loading: planLoading } = usePlanLimits();
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("manager");

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Obtener token del usuario autenticado
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No hay token de autenticación disponible");
        setSessions([]);
        return;
      }

      // Usar listForUser en lugar de list para obtener solo las sesiones del usuario
      const response = await sessionsAPI.listForUser(token);
      
      console.log("Response from listForUser:", response);

      if (response.success && response.data && response.data.sesiones) {
        // Los datos vienen en response.data.sesiones
        const sessionsArray = response.data.sesiones;
        
        console.log("Sessions array:", sessionsArray);
        
        // Los datos ya vienen del backend con la información completa de las sesiones
        const validSessions = sessionsArray
          .filter((session: any) => 
            session && 
            session.id && 
            typeof session.id === "string" && 
            session.id.trim() !== ""
          )
          .map((session: any) => ({
            id: session.id,
            status: session.estadoSesion || "unknown",
            // Corregido: comparar con "authenticated" en inglés que es lo que devuelve el backend
            authenticated: session.estadoSesion === "authenticated" || session.estadoSesion === "autenticada",
            nombresesion: session.nombresesion || null,
            phoneNumber: session.lineaWhatsApp || null,
          }));
        
        console.log("Valid sessions:", validSessions);
        setSessions(validSessions);
      } else {
        console.log("No data or unsuccessful response");
        setSessions([]);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      setSessions([]);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  // Loading state
  if (planLoading || loading) {
    return <WebhooksSkeleton />;
  }

  // Plan required check
  if (!suscripcion || !resourceLimits) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PlanRequiredCard />
      </div>
    );
  }

  const authenticatedSessions = sessions.filter((s) => s.authenticated);
  const connectedSessions = sessions.filter(
    (s) => s.status === "authenticated" || s.status === "connected"
  );

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* 🎯 HEADER - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex-1 min-w-0 space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
            <Webhook className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600 flex-shrink-0" />
            <span className="truncate">Sistema de Webhooks</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Configura webhooks para recibir notificaciones en tiempo real cuando
            lleguen mensajes a tus sesiones WhatsApp. Ideal para integrar con
            CRM, chatbots y sistemas de atención al cliente.
          </p>
        </div>

        {/* 📊 Plan Info - Mobile responsive */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="text-center px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 flex-1 sm:flex-none">
            <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
              {resourceLimits.webhooks.current}/{resourceLimits.webhooks.limit}
            </div>
            <div className="text-xs text-blue-600/80 dark:text-blue-400/80">
              Webhooks Configurados
            </div>
          </div>
          <Button
            onClick={loadSessions}
            variant="outline"
            disabled={loading}
            className="flex items-center justify-center gap-2 h-auto py-2 sm:py-3 w-full sm:w-auto flex-1 sm:flex-none"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span className="whitespace-nowrap">Actualizar</span>
          </Button>
        </div>
      </div>



      {/* 🚨 NO SESSIONS ALERT */}
      {sessions.length === 0 && (
        <Card className="w-full border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-800/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-base sm:text-lg font-semibold text-amber-900 dark:text-amber-100">
                  No hay sesiones WhatsApp configuradas
                </h3>
                <p className="text-sm sm:text-base text-amber-800 dark:text-amber-200">
                  Necesitas al menos una sesión WhatsApp autenticada para
                  configurar webhooks. Los webhooks te enviarán notificaciones
                  cuando recibas mensajes.
                </p>
              </div>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto flex-shrink-0"
              >
                <a href="/dashboard/sessions" className="flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="whitespace-nowrap">Crear Sesión</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🎨 MAIN CONTENT TABS - Mobile optimized */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">


        {/* 📱💻 Responsive Tabs */}
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <TabsTrigger
              value="manager"
              className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Gestión de Webhooks</span>
              <span className="md:hidden">Gestión</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Análisis</span>
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200"
            >
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Documentación</span>
              <span className="sm:hidden">Docs</span>
            </TabsTrigger>
          </TabsList>
        

        {/* 📄 TAB CONTENT */}
        <TabsContent value="manager" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <WebhookManager
            sessions={sessions}
          />
        </TabsContent>

          <TabsContent value="analytics" className="mt-4 sm:mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Análisis de Webhooks
                </CardTitle>
                <CardDescription>
                  Estadísticas detalladas sobre el rendimiento de tus webhooks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Análisis en Desarrollo
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Próximamente tendrás acceso a estadísticas detalladas sobre
                    el rendimiento de tus webhooks, tasas de entrega, errores y
                    más.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="mt-4 sm:mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Documentación de Webhooks
                </CardTitle>
                <CardDescription>
                  Aprende cómo integrar webhooks con tu sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <h3>¿Qué es un Webhook?</h3>
                  <p>
                    Un webhook es una forma de recibir notificaciones
                    automáticas cuando ocurre un evento específico en tu cuenta,
                    como recibir un nuevo mensaje en WhatsApp.
                  </p>

                  <h3>Configuración Básica</h3>
                  <ol>
                    <li>
                      Selecciona la sesión WhatsApp que quieres monitorear
                    </li>
                    <li>
                      Ingresa la URL de tu servidor donde quieres recibir las
                      notificaciones
                    </li>
                    <li>Configura los eventos que quieres escuchar</li>
                    <li>
                      Prueba la conexión para asegurar que funciona
                      correctamente
                    </li>
                  </ol>

                  <h3>Formato de Datos</h3>
                  <p>
                    Los webhooks envían datos en formato JSON con información
                    sobre el mensaje recibido, incluyendo el remitente,
                    contenido del mensaje, timestamp, y metadatos adicionales.
                  </p>

                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <h4>Ejemplo de Payload:</h4>
                    <pre className="text-sm overflow-x-auto">
                      {`{
  "event": "message.received",
  "sessionId": "session123",
  "from": "573001234567",
  "message": {
    "type": "text",
    "content": "Hola, necesito ayuda",
    "timestamp": 1234567890
  },
  "contact": {
    "name": "Juan Pérez",
    "pushname": "Juan"
  }
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
