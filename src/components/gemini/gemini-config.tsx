import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Brain,
  Save,
  TestTube,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  MessageSquare,
  Zap,
  Globe,
  Clock,
  BarChart3,
  Cpu,
  Webhook, // 🆕 Nuevo icono para webhooks
  Link, // 🆕 Nuevo icono para conexiones
} from "lucide-react";
import { useGeminiConfig } from "@/store/gemini-store";
import { sessionsAPI } from "@/lib/api";
import AutoProcessor from "./AutoProcessor"; // 🆕 Import AutoProcessor

interface GeminiConfigProps {
  userToken: string;
  onConfigSaved?: () => void;
}

const aiModels = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recomendado)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
];

const countries = [
  { value: "colombia", label: "Colombia" },
  { value: "mexico", label: "México" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "peru", label: "Perú" },
  { value: "venezuela", label: "Venezuela" },
  { value: "españa", label: "España" },
];

const languages = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

export default function GeminiConfig({
  userToken,
  onConfigSaved,
}: GeminiConfigProps) {
  const {
    config,
    isLoading,
    error,
    isConfigured,
    lastTest,
    loadConfig,
    saveConfig,
    deleteConfig,
    testConfig,
    updateField,
    clearError,
    hasValidConfig,
    isReadyToUse,
  } = useGeminiConfig();

  const { toast } = useToast();
  const [testMessage, setTestMessage] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // 🔧 NUEVO: Control de inicialización

  // 🆕 NUEVOS ESTADOS para integración con webhooks
  const [sessions, setSessions] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedWebhookId, setSelectedWebhookId] = useState<string>("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);

  // Cargar configuración al montar el componente
  useEffect(() => {
    if (
      userToken &&
      userToken.trim() !== "" &&
      userToken !== "undefined" &&
      userToken !== "null"
    ) {
      console.log("🤖 [CHATBOT] Cargando configuración con token válido");
      loadConfig(userToken);
      // 🔧 NUEVA FUNCIONALIDAD: Cargar sesiones primero, luego webhooks
      loadAvailableSessions();
    } else {
      console.log(
        "🤖 [CHATBOT] Token no válido, omitiendo carga de configuración:",
        { userToken, type: typeof userToken }
      );
    }
  }, [userToken, loadConfig]);

  // 🔧 NUEVO: Inicializar configuración predeterminada si no existe
  useEffect(() => {
    if (!config && !isLoading && !error && !isInitialized) {
      console.log("🤖 [CHATBOT] Inicializando configuración predeterminada...");
      // Pre-llenar con valores predeterminados útiles
      updateField("userbot", "MiBot_IA");
      updateField(
        "promt",
        "Eres un asistente virtual útil y amigable que responde preguntas de manera clara y concisa."
      );
      updateField("server", "http://100.42.185.2:8015");
      updateField("pais", "colombia");
      updateField("idioma", "es");
      updateField("numerodemensajes", 8);
      updateField("delay_seconds", 8);
      updateField("temperature", 0.0);
      updateField("topP", 0.9);
      updateField("maxOutputTokens", 512);
      updateField("pause_timeout_minutes", 30);
      updateField("ai_model", "gemini-2.5-flash");
      updateField("thinking_budget", -1);
      updateField("activo", true);
      setIsInitialized(true);
    }
  }, [config, isLoading, error, isInitialized, updateField]);

  // 🔧 CORRECCIÓN: Sincronizar cuando se carga configuración desde backend
  useEffect(() => {
    if (config && config.sesionId && !selectedSessionId) {
      console.log(
        "🤖 [CHATBOT] Sincronizando sesión desde configuración cargada:",
        config.sesionId
      );
      setSelectedSessionId(config.sesionId);
    }
    if (config && config.phoneNumber && sessions.length > 0) {
      console.log(
        "🤖 [CHATBOT] Número de teléfono cargado desde configuración:",
        config.phoneNumber
      );
    }
  }, [config]);

  // 🔧 NUEVO: Cargar webhooks después de cargar sesiones
  useEffect(() => {
    if (sessions.length > 0) {
      loadAvailableWebhooks();
    }
  }, [sessions]);

  // 🆕 NUEVA FUNCIONALIDAD: Cargar sesiones disponibles
  const loadAvailableSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await sessionsAPI.list();
      if (response.success && response.data) {
        console.log("🤖 [CHATBOT] Sesiones disponibles:", response.data);

        // Obtener detalles de cada sesión
        const sessionPromises = response.data.map(async (sessionId: string) => {
          try {
            const statusResponse = await sessionsAPI.status(sessionId);
            return {
              id: sessionId,
              status: statusResponse.success
                ? statusResponse.data.status
                : "unknown",
              authenticated: statusResponse.success
                ? statusResponse.data.authenticated || false
                : false,
              phone: statusResponse.success
                ? statusResponse.data.lineaWhatsApp
                : null,
            };
          } catch (error) {
            console.error(`Error obteniendo status para ${sessionId}:`, error);
            return {
              id: sessionId,
              status: "error",
              authenticated: false,
              phone: null,
            };
          }
        });

        const sessionsWithDetails = await Promise.all(sessionPromises);

        // Solo mostrar sesiones autenticadas
        const authenticatedSessions = sessionsWithDetails.filter(
          (s) => s.authenticated
        );
        console.log(
          "🤖 [CHATBOT] Sesiones autenticadas:",
          authenticatedSessions
        );

        setSessions(authenticatedSessions);

        // 🔧 AUTO-SELECCIÓN: Si hay solo una sesión, seleccionarla automáticamente
        if (authenticatedSessions.length === 1 && !selectedSessionId) {
          const session = authenticatedSessions[0];
          setSelectedSessionId(session.id);
          // 🔧 NUEVO: Actualizar también el campo sesionId en el config
          updateField("sesionId", session.id);
          // 🔧 NUEVO: Auto-completar número de teléfono si está disponible
          if (session.phone && !config?.phoneNumber) {
            updateField("phoneNumber", session.phone);
            console.log(
              "🤖 [CHATBOT] Auto-completando número de teléfono:",
              session.phone
            );
          }
          console.log(
            "🤖 [CHATBOT] Auto-seleccionando única sesión y actualizando config:",
            session.id
          );
        }
      } else {
        console.warn("🤖 [CHATBOT] No se encontraron sesiones");
        setSessions([]);
      }
    } catch (error) {
      console.error("🤖 [CHATBOT] Error cargando sesiones:", error);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  // 🆕 NUEVA FUNCIONALIDAD: Cargar webhooks disponibles
  const loadAvailableWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      // 🔧 SOLUCIÓN: Usar información de webhooks de las sesiones cargadas
      console.log(
        "🤖 [CHATBOT] Extrayendo webhooks de sesiones disponibles..."
      );

      const webhooksFromSessions: any[] = [];

      for (const session of sessions) {
        try {
          // Obtener información detallada de la sesión que incluye webhook
          const statusResponse = await sessionsAPI.status(session.id);
          if (statusResponse.success && statusResponse.data) {
            const sessionData = statusResponse.data;

            // 🔧 VERIFICAR si la sesión tiene webhook configurado
            if (
              sessionData.webhook &&
              (sessionData.webhook.creado || sessionData.webhook.activo)
            ) {
              console.log(
                `🤖 [CHATBOT] Webhook encontrado en sesión ${session.id}:`,
                sessionData.webhook
              );

              const webhookInfo = {
                id: `webhook_${session.id}`,
                sessionId: session.id,
                url: sessionData.webhook.url || null,
                active:
                  sessionData.webhook.activo ||
                  sessionData.webhook.creado ||
                  false,
                events: ["MESSAGES_UPSERT"], // Evento por defecto para chatbots
                source: "session_data", // Indicar que viene de datos de sesión
              };

              webhooksFromSessions.push(webhookInfo);
            } else {
              console.log(
                `🤖 [CHATBOT] Sesión ${session.id} sin webhook configurado`
              );
            }
          }
        } catch (error) {
          console.error(
            `🤖 [CHATBOT] Error obteniendo webhook para sesión ${session.id}:`,
            error
          );
        }
      }

      console.log(
        "🤖 [CHATBOT] Webhooks extraídos de sesiones:",
        webhooksFromSessions
      );
      setWebhooks(webhooksFromSessions);

      // 🔧 AUTO-SELECCIÓN: Si hay solo un webhook, seleccionarlo automáticamente
      if (webhooksFromSessions.length === 1 && !selectedWebhookId) {
        setSelectedWebhookId(webhooksFromSessions[0].id);
        console.log(
          "🤖 [CHATBOT] Auto-seleccionando único webhook:",
          webhooksFromSessions[0].id
        );
      }
    } catch (error) {
      console.error(
        "🤖 [CHATBOT] Error general en loadAvailableWebhooks:",
        error
      );
      setWebhooks([]);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  // Limpiar errores cuando cambie
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSave = async () => {
    console.log("🤖 [SAVE] Intentando guardar configuración...");
    console.log("🤖 [SAVE] hasValidConfig:", hasValidConfig);
    console.log("🤖 [SAVE] config actual:", {
      userbot: config?.userbot,
      apikey: config?.apikey ? "SET" : "EMPTY",
      promt: config?.promt,
      sesionId: config?.sesionId,
      phoneNumber: config?.phoneNumber,
    });

    if (!hasValidConfig) {
      // 🔧 DIAGNÓSTICO: Mostrar qué campos faltan
      const missingFields = [];
      if (!config?.userbot) missingFields.push("Nombre del Bot");
      if (!config?.apikey) missingFields.push("API Key");
      if (!config?.promt) missingFields.push("Prompt");
      if (!config?.sesionId) missingFields.push("Sesión de WhatsApp");
      // phoneNumber ya NO es requerido

      console.warn("🤖 [SAVE] Campos faltantes:", missingFields);

      toast({
        title: "Configuración incompleta",
        description: `Faltan: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    try {
      await saveConfig(userToken);
      toast({
        title: "✅ Configuración guardada",
        description: "Tu configuración de Gemini ha sido guardada exitosamente",
      });
      onConfigSaved?.();
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const handleTest = async () => {
    if (!config) return;

    console.log("🤖 [TEST] Iniciando prueba con userToken:", !!userToken);

    setIsTesting(true);
    try {
      const result = await testConfig(testMessage || undefined, userToken);

      if (result.success) {
        toast({
          title: "✅ Prueba exitosa",
          description: "La configuración de Gemini funciona correctamente",
        });
      } else {
        toast({
          title: "❌ Prueba fallida",
          description: result.error || "Error en la prueba",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error en la prueba",
        description: "No se pudo realizar la prueba",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConfig(userToken);
      toast({
        title: "🗑️ Configuración eliminada",
        description: "La configuración de Gemini ha sido eliminada",
      });
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la configuración",
        variant: "destructive",
      });
    }
  };

  if (isLoading && !config) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando configuración...</span>
        </CardContent>
      </Card>
    );
  }

  // 🔧 NUEVO: Mostrar mensaje si no hay token válido
  if (
    !userToken ||
    userToken.trim() === "" ||
    userToken === "undefined" ||
    userToken === "null"
  ) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Token de Autenticación Requerido
          </h3>
          <p className="text-gray-500 text-center mb-4">
            No se pudo cargar la configuración de Gemini porque no hay un token
            de autenticación válido.
          </p>
          <p className="text-sm text-gray-400 text-center">
            Asegúrate de estar autenticado correctamente en la aplicación.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-6 h-6 text-purple-600" />
              <div>
                <CardTitle>Configuración de Gemini IA</CardTitle>
                <CardDescription>
                  Configura tu integración con Google Gemini para respuestas
                  automáticas inteligentes
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConfigured ? (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Configurado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  No configurado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {/* 🔧 NUEVO: Indicador de progreso de configuración */}
        {!isConfigured && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Progreso de configuración:
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={config?.userbot ? "default" : "outline"}
                  className="text-xs"
                >
                  {config?.userbot ? "✓" : "✗"} Nombre del Bot
                </Badge>
                <Badge
                  variant={config?.apikey ? "default" : "outline"}
                  className="text-xs"
                >
                  {config?.apikey ? "✓" : "✗"} API Key
                </Badge>
                <Badge
                  variant={config?.promt ? "default" : "outline"}
                  className="text-xs"
                >
                  {config?.promt ? "✓" : "✗"} Prompt
                </Badge>
                <Badge
                  variant={config?.sesionId ? "default" : "outline"}
                  className="text-xs"
                >
                  {config?.sesionId ? "✓" : "✗"} Sesión
                </Badge>
                {config?.phoneNumber && (
                  <Badge
                    variant="default"
                    className="text-xs bg-blue-100 text-blue-800"
                  >
                    ✓ Número (Opcional)
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Configuración */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger
                value="basic"
                className="flex items-center space-x-1"
              >
                <Settings className="w-4 h-4" />
                <span>Básica</span>
              </TabsTrigger>
              <TabsTrigger
                value="webhook"
                className="flex items-center space-x-1"
              >
                <Webhook className="w-4 h-4" />
                <span>Webhook</span>
              </TabsTrigger>
              <TabsTrigger
                value="automation"
                className="flex items-center space-x-1"
              >
                <Zap className="w-4 h-4" />
                <span>Automatización</span>
              </TabsTrigger>
              <TabsTrigger
                value="behavior"
                className="flex items-center space-x-1"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Comportamiento</span>
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="flex items-center space-x-1"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Avanzada</span>
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center space-x-1">
                <TestTube className="w-4 h-4" />
                <span>Pruebas</span>
              </TabsTrigger>
            </TabsList>

            {/* Configuración Básica */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userbot">
                    Nombre del Bot <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="userbot"
                    placeholder="ej: MiBot_WhatsApp"
                    value={config?.userbot || ""}
                    onChange={(e) => updateField("userbot", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    Número de WhatsApp{" "}
                    <span className="text-gray-400">(Opcional)</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="ej: 573181359070"
                    value={config?.phoneNumber || ""}
                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                  />
                  <div className="text-xs text-gray-500">
                    🌐 El número se extrae automáticamente del webhook. Solo
                    especifica si quieres probar con un número concreto.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sesionId">
                    Sesión de WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedSessionId}
                    onValueChange={(value) => {
                      setSelectedSessionId(value);
                      updateField("sesionId", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una sesión" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{session.id}</span>
                            {session.phone && (
                              <Badge variant="secondary" className="text-xs">
                                {session.phone}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500">
                    Sesión autenticada para el bot. Total: {sessions.length}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apikey">
                    API Key de Gemini <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="apikey"
                    type="text"
                    placeholder="Ingresa tu API Key de Google Gemini"
                    value={config?.apikey || ""}
                    onChange={(e) => updateField("apikey", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server">Servidor</Label>
                  <Input
                    id="server"
                    placeholder="http://100.42.185.2:8015"
                    value={config?.server || ""}
                    onChange={(e) => updateField("server", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_model">Modelo de IA</Label>
                  <Select
                    value={config?.ai_model || "gemini-2.5-flash"}
                    onValueChange={(value) => updateField("ai_model", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Select
                    value={config?.pais || "colombia"}
                    onValueChange={(value) => updateField("pais", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idioma">Idioma</Label>
                  <Select
                    value={config?.idioma || "es"}
                    onValueChange={(value) => updateField("idioma", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promt">
                  Prompt del Sistema <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="promt"
                  rows={4}
                  placeholder="Describe cómo debe comportarse tu asistente de IA..."
                  value={config?.promt || ""}
                  onChange={(e) => updateField("promt", e.target.value)}
                />
              </div>
            </TabsContent>

            {/* 🆕 NUEVA PESTAÑA: Automatización */}
            <TabsContent value="automation" className="space-y-6">
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="font-medium text-green-900 dark:text-green-100">
                        Procesamiento Automático de Mensajes
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Cuando está activo, el bot procesará automáticamente todos los mensajes entrantes de WhatsApp usando IA.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                {/* Control principal de automatización */}
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-600" />
                        Automatización del Bot
                      </h3>
                      <p className="text-sm text-gray-600">
                        {config?.activo ? 
                          'El bot está procesando mensajes automáticamente' : 
                          'El bot solo responderá cuando se envíen mensajes manualmente'
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={config?.activo ? "default" : "secondary"} 
                             className={config?.activo ? "bg-green-100 text-green-800" : ""}>
                        {config?.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <Switch
                        checked={config?.activo || false}
                        onCheckedChange={(checked) => {
                          updateField("activo", checked);
                          toast({
                            title: checked ? "🚀 Automatización activada" : "⏸️ Automatización pausada",
                            description: checked ? 
                              "El bot procesará mensajes automáticamente" : 
                              "El bot no procesará mensajes automáticamente",
                            duration: 3000
                          });
                        }}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                  </div>
                </Card>

                {/* Estado de la automatización */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`w-4 h-4 ${hasValidConfig ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label className="text-sm font-medium">Configuración</Label>
                      </div>
                      <p className="text-xs text-gray-600">
                        {hasValidConfig ? '✓ Lista para usar' : '✗ Configuración incompleta'}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Webhook className={`w-4 h-4 ${config?.sesionId ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label className="text-sm font-medium">Sesión WhatsApp</Label>
                      </div>
                      <p className="text-xs text-gray-600">
                        {config?.sesionId ? `✓ ${config.sesionId}` : '✗ Sin sesión'}
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Brain className={`w-4 h-4 ${config?.apikey ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label className="text-sm font-medium">Gemini IA</Label>
                      </div>
                      <p className="text-xs text-gray-600">
                        {config?.apikey ? '✓ API Key configurada' : '✗ Sin API Key'}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Advertencias y recomendaciones */}
                <div className="space-y-3">
                  {!hasValidConfig && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Configuración incompleta:</strong> Completa la configuración básica antes de activar la automatización.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {hasValidConfig && config?.activo && (
                    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        <strong>Automatización activa:</strong> El bot procesará todos los mensajes entrantes automáticamente. 
                        Asegúrate de que el prompt esté bien configurado para evitar respuestas no deseadas.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* 🆕 PESTAÑA: Configuración de Webhook */}
            <TabsContent value="webhook" className="space-y-6">
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Link className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">
                        Integración con Webhooks de WhatsApp
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Conecta tu chatbot con un webhook para recibir y
                        procesar mensajes de WhatsApp automáticamente. Solo se
                        procesarán mensajes entrantes (no los que envía el bot).
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          • <strong>MESSAGES_UPSERT:</strong> Se recomienda este
                          evento para chatbots
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          • <strong>Una sesión, un chatbot:</strong> Cada sesión
                          puede tener solo un chatbot activo
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          • <strong>Procesamiento inteligente:</strong> Extrae
                          automáticamente número y texto del mensaje
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <Label className="text-base font-medium">
                      Sesión de WhatsApp
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Seleccionar Sesión Autenticada</Label>
                    <Select
                      value={selectedSessionId}
                      onValueChange={setSelectedSessionId}
                      disabled={loadingSessions}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingSessions
                              ? "Cargando sesiones..."
                              : "Selecciona una sesión"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>{session.id}</span>
                              {session.phone && (
                                <Badge variant="secondary" className="text-xs">
                                  {session.phone}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-500">
                      Solo se muestran sesiones autenticadas. Total disponibles:{" "}
                      {sessions.length}
                    </div>
                  </div>

                  {selectedSessionId && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Sesión seleccionada:{" "}
                        <strong>{selectedSessionId}</strong>
                        <br />
                        Esta sesión procesará los mensajes entrantes con IA.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Webhook className="w-5 h-5 text-purple-600" />
                    <Label className="text-base font-medium">
                      Webhook Asociado
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook Activo (Opcional)</Label>
                    <Select
                      value={selectedWebhookId}
                      onValueChange={setSelectedWebhookId}
                      disabled={loadingWebhooks}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingWebhooks
                              ? "Cargando webhooks..."
                              : "Webhook automático"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto-detect">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-600" />
                            <span>Detección automática</span>
                          </div>
                        </SelectItem>
                        {webhooks.map((webhook) => (
                          <SelectItem key={webhook.id} value={webhook.id}>
                            <div className="flex items-center gap-2">
                              <Webhook className="w-4 h-4 text-purple-600" />
                              <span>{webhook.id}</span>
                              <Badge variant="outline" className="text-xs">
                                {webhook.sessionId}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-500">
                      El sistema detectará automáticamente mensajes de la sesión
                      seleccionada. Webhooks disponibles: {webhooks.length}
                    </div>
                  </div>

                  {webhooks.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No se encontraron webhooks activos.
                        <br />
                        Ve a la sección de Webhooks para crear uno con evento{" "}
                        <strong>MESSAGES_UPSERT</strong>.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        ¡Excelente! Se encontraron{" "}
                        <strong>{webhooks.length} webhook(s) activo(s)</strong>.
                        <br />
                        Tu chatbot está listo para procesar mensajes
                        automáticamente.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-orange-600" />
                  <Label className="text-base font-medium">
                    Procesamiento de Mensajes
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <Label className="text-sm font-medium">
                          1. Recepción
                        </Label>
                      </div>
                      <p className="text-xs text-gray-600">
                        Webhook recibe mensaje de WhatsApp
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-4 h-4 text-green-600" />
                        <Label className="text-sm font-medium">
                          2. Extracción
                        </Label>
                      </div>
                      <p className="text-xs text-gray-600">
                        Se extrae número y texto del mensaje
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <Label className="text-sm font-medium">
                          3. Procesamiento IA
                        </Label>
                      </div>
                      <p className="text-xs text-gray-600">
                        Gemini procesa y responde automáticamente
                      </p>
                    </div>
                  </Card>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Formato de mensaje soportado:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Texto simple y extendido</li>
                    <li>Imágenes con texto (se procesa el caption)</li>
                    <li>Videos con texto (se procesa el caption)</li>
                    <li>Se ignoran mensajes propios (fromMe: true)</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Configuración de Comportamiento */}
            <TabsContent value="behavior" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <Label className="text-base font-medium">Mensajes</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Número de mensajes en contexto:{" "}
                      {config?.numerodemensajes || 8}
                    </Label>
                    <Slider
                      value={[config?.numerodemensajes || 8]}
                      onValueChange={([value]) =>
                        updateField("numerodemensajes", value)
                      }
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500">
                      Cantidad de mensajes previos que recordará la IA
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <Label className="text-base font-medium">Tiempos</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Delay entre respuestas: {config?.delay_seconds || 8}s
                    </Label>
                    <Slider
                      value={[config?.delay_seconds || 8]}
                      onValueChange={([value]) =>
                        updateField("delay_seconds", value)
                      }
                      min={1}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Timeout de pausa: {config?.pause_timeout_minutes || 30}{" "}
                      min
                    </Label>
                    <Slider
                      value={[config?.pause_timeout_minutes || 30]}
                      onValueChange={([value]) =>
                        updateField("pause_timeout_minutes", value)
                      }
                      min={5}
                      max={120}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    Estado del Bot
                  </Label>
                  <p className="text-sm text-gray-500">
                    Activa o desactiva las respuestas automáticas
                  </p>
                </div>
                <Switch
                  checked={config?.activo || false}
                  onCheckedChange={(checked) => updateField("activo", checked)}
                />
              </div>
            </TabsContent>

            {/* Configuración Avanzada */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <Label className="text-base font-medium">
                      Parámetros del Modelo
                    </Label>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Temperature: {config?.temperature || 0}</Label>
                      <Slider
                        value={[config?.temperature || 0]}
                        onValueChange={([value]) =>
                          updateField("temperature", value)
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500">
                        Creatividad de las respuestas (0 = conservador, 1 =
                        creativo)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Top P: {config?.topP || 0.9}</Label>
                      <Slider
                        value={[config?.topP || 0.9]}
                        onValueChange={([value]) => updateField("topP", value)}
                        min={0.1}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    <Label className="text-base font-medium">Límites</Label>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>
                        Max Output Tokens: {config?.maxOutputTokens || 512}
                      </Label>
                      <Slider
                        value={[config?.maxOutputTokens || 512]}
                        onValueChange={([value]) =>
                          updateField("maxOutputTokens", value)
                        }
                        min={100}
                        max={2048}
                        step={50}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Thinking Budget: {config?.thinking_budget || -1}
                      </Label>
                      <Slider
                        value={[config?.thinking_budget || -1]}
                        onValueChange={([value]) =>
                          updateField("thinking_budget", value)
                        }
                        min={-1}
                        max={1000}
                        step={50}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500">
                        -1 = sin límite, 0+ = límite específico
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pruebas */}
            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testMessage">Mensaje de prueba</Label>
                  <Textarea
                    id="testMessage"
                    rows={3}
                    placeholder="Escribe un mensaje para probar la configuración..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleTest}
                  disabled={!hasValidConfig || isTesting}
                  className="w-full"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Probar Configuración
                </Button>

                {lastTest && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        {lastTest.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        Resultado de la prueba
                        {lastTest.data?.timestamp && (
                          <span className="text-xs text-gray-500 ml-auto">
                            {new Date(
                              lastTest.data.timestamp
                            ).toLocaleTimeString()}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          {lastTest.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            {lastTest.success
                              ? "Prueba exitosa"
                              : "Prueba fallida"}
                          </span>
                          {lastTest.data?.model && (
                            <Badge variant="outline" className="text-xs">
                              {lastTest.data.model}
                            </Badge>
                          )}
                        </div>

                        {lastTest.response && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-green-700">
                              Respuesta de la IA:
                            </Label>
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-800 whitespace-pre-wrap">
                                {lastTest.response}
                              </p>
                            </div>
                          </div>
                        )}

                        {lastTest.data?.thinking && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-blue-700">
                              Proceso de pensamiento:
                            </Label>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                {lastTest.data.thinking}
                              </p>
                            </div>
                          </div>
                        )}

                        {lastTest.error && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-red-700">
                              Error:
                            </Label>
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-800">
                                {lastTest.error}
                              </p>
                            </div>
                          </div>
                        )}

                        {lastTest.data?.usage && (
                          <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex justify-between">
                              <span>Tokens usados:</span>
                              <span>
                                {lastTest.data.usage.total_tokens || "N/A"}
                              </span>
                            </div>
                            {lastTest.data.usage.prompt_tokens && (
                              <div className="flex justify-between">
                                <span>Tokens de entrada:</span>
                                <span>{lastTest.data.usage.prompt_tokens}</span>
                              </div>
                            )}
                            {lastTest.data.usage.completion_tokens && (
                              <div className="flex justify-between">
                                <span>Tokens de respuesta:</span>
                                <span>
                                  {lastTest.data.usage.completion_tokens}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {lastTest.data?.userbot && (
                          <div className="text-xs text-gray-500">
                            Bot:{" "}
                            <span className="font-mono">
                              {lastTest.data.userbot}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-between">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={!isConfigured || isLoading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar Configuración
        </Button>

        <Button
          onClick={handleSave}
          disabled={!hasValidConfig || isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Configuración
        </Button>
      </div>

      {/* 🤖 AutoProcessor - Automatización webhook → IA */}
      {hasValidConfig && config?.activo && (
        <AutoProcessor
          key={`auto-${config.sesionId}-${config.activo}`}
          userToken={userToken}
          enabled={true}
          onProcessingStart={(message) => {
            console.log('🤖 [AutoProcessor] Procesando mensaje:', message.key?.id);
          }}
          onProcessingComplete={(result) => {
            console.log('🤖 [AutoProcessor] ✅ Mensaje procesado:', result);
          }}
          onError={(error) => {
            console.error('🤖 [AutoProcessor] ❌ Error:', error);
          }}
        />
      )}
    </div>
  );
}
