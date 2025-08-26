"use client";

import React, { useState, useEffect } from "react";
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
  Webhook,
  Link,
  Phone,
  Bot,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { botsAPI, geminiAPI } from "@/lib/api";

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

interface ChatBotFormProps {
  onConfigSaved?: () => void;
  editingBot?: any; // BotCreado para editar
}

interface SessionOption {
  sesionId: string;
  numeroWhatsapp: string;
  estado: string;
  disponible: boolean;
}

export default function ChatBotForm({
  onConfigSaved,
  editingBot,
}: ChatBotFormProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();

  // Estados del formulario
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Estado del formulario adaptado al modelo creacionbots
  const getInitialFormData = () => {
    if (editingBot) {
      const configIA = editingBot.configIA || {};

      // 🔧 DEBUG: Log del bot que se está editando
      console.log("🔧 [FORM] Cargando bot para edición:", {
        botId: editingBot.id || editingBot._id,
        nombreBot: editingBot.nombreBot,
        sesionId: editingBot.sesionId || editingBot.sesion?.id,
        tieneConfigIA: !!editingBot.configIA,
        configIAKeys: editingBot.configIA
          ? Object.keys(editingBot.configIA)
          : [],
        apikey: editingBot.configIA?.apikey
          ? "PRESENTE: " + editingBot.configIA.apikey.slice(0, 10) + "..."
          : "FALTANTE",
        activo: editingBot.configIA?.activo,
        sesionCompleta: editingBot.sesion,
      });

      return {
        // Datos básicos - MAPEAR CORRECTAMENTE
        nombreBot: editingBot.nombreBot || "",
        descripcion: editingBot.descripcion || "",
        tipoBot: editingBot.tipoBot || "ia",
        // 🔧 MAPEO MEJORADO: Soportar múltiples fuentes de sesionId
        sesionId:
          editingBot.sesionId ||
          editingBot.sesion?.id ||
          editingBot.sesion?.sesionId ||
          editingBot.sesion?._id ||
          (typeof editingBot.sesion === "string" ? editingBot.sesion : "") ||
          "",

        // configIA - todos los campos del modelo
        userbot: configIA.userbot || editingBot.nombreBot || "",
        apikey: configIA.apikey || "",
        server: configIA.server || "https://backend.autosystemprojects.site",
        promt:
          configIA.promt ||
          "Eres un asistente virtual útil y amigable que responde preguntas de manera clara y concisa.",
        pais: configIA.pais || "colombia",
        idioma: configIA.idioma || "es",
        numerodemensajes: configIA.numerodemensajes || 8,
        delay_seconds: configIA.delay_seconds || 8,
        temperature: configIA.temperature || 0.7,
        topP: configIA.topP || 0.9,
        maxOutputTokens: configIA.maxOutputTokens || 512,
        pause_timeout_minutes: configIA.pause_timeout_minutes || 30,
        ai_model: configIA.ai_model || "gemini-2.5-flash",
        thinking_budget: configIA.thinking_budget || -1,
        activo: configIA.activo !== false,

        // Configuración avanzada
        autoActivar: editingBot.configuracionAvanzada?.autoActivar !== false,
        limiteConversacionesDiario:
          editingBot.configuracionAvanzada?.limiteConversacionesDiario || 1000,

        // Tags
        tags: editingBot.tags?.join(", ") || "gemini, ia, chatbot",
      };
    }

    return {
      // Datos básicos
      nombreBot: "",
      descripcion: "",
      tipoBot: "ia",
      sesionId: "",

      // configIA
      userbot: "",
      apikey: "",
      server: "https://backend.autosystemprojects.site",
      promt:
        "Eres un asistente virtual útil y amigable que responde preguntas de manera clara y concisa.",
      pais: "colombia",
      idioma: "es",
      numerodemensajes: 8,
      delay_seconds: 8,
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 512,
      pause_timeout_minutes: 30,
      ai_model: "gemini-2.5-flash",
      thinking_budget: -1,
      activo: true,

      // Configuración avanzada
      autoActivar: true,
      limiteConversacionesDiario: 1000,

      // Tags
      tags: "gemini, ia, chatbot",
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // 🔧 CORRECCIÓN: Actualizar formulario cuando cambia el bot editado
  useEffect(() => {
    if (editingBot) {
      const newFormData = getInitialFormData();
      console.log("🔧 [FORM] Actualizando formulario con datos del bot:", {
        botId: editingBot.id || editingBot._id,
        nombreBot: newFormData.nombreBot,
        apikey: newFormData.apikey
          ? "CARGADA (" + newFormData.apikey.slice(0, 10) + "...)"
          : "VACIA",
        sesionId: newFormData.sesionId,
        activo: newFormData.activo,
        datosOriginales: editingBot,
        configIAOriginal: editingBot.configIA,
      });
      setFormData(newFormData);
    } else {
      // Si no hay bot editado, usar datos por defecto
      const defaultFormData = getInitialFormData();
      console.log("🔧 [FORM] Cargando datos por defecto (bot nuevo)");
      setFormData(defaultFormData);
    }
  }, [editingBot]);

  // Actualizar campo del formulario
  const updateField = (field: string, value: any) => {
    console.log(`🔧 [FORM DEBUG] Actualizando campo '${field}':`, {
      valor: value,
      tipo: typeof value,
    });
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      console.log(`🔧 [FORM DEBUG] FormData actualizado:`, newData);
      return newData;
    });
  };

  // Cargar sesiones disponibles
  useEffect(() => {
    loadAvailableSessions();
  }, []);

  const loadAvailableSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await botsAPI.getAvailableSessions();

      if (response.success && response.data) {
        // Filtrar sesiones válidas
        const validSessions = (response.data || [])
          .filter(
            (sesion: any) =>
              sesion &&
              typeof sesion.sesionId === "string" &&
              sesion.sesionId.trim() !== "" &&
              sesion.sesionId !== "undefined" &&
              sesion.sesionId !== "null"
          )
          .map((sesion: any) => ({
            sesionId: sesion.sesionId.trim(),
            numeroWhatsapp: sesion.numeroWhatsapp || "Sin número",
            estado: sesion.estado || "desconocido",
            disponible: Boolean(sesion.disponible),
          }));

        setSessions(validSessions);

        // Auto-seleccionar si hay solo una sesión disponible y no estamos editando
        const availableSessions = validSessions.filter(
          (s: SessionOption) => s.disponible
        );
        if (
          availableSessions.length === 1 &&
          !editingBot &&
          !formData.sesionId
        ) {
          updateField("sesionId", availableSessions[0].sesionId);
        }
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Error cargando sesiones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones disponibles",
        variant: "destructive",
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  // Guardar configuración
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validaciones
      if (!formData.nombreBot.trim()) {
        throw new Error("El nombre del bot es requerido");
      }
      if (!formData.sesionId) {
        throw new Error("Debes seleccionar una sesión de WhatsApp");
      }
      if (!formData.apikey) {
        throw new Error("La API Key de Gemini es requerida");
      }
      if (!formData.promt.trim()) {
        throw new Error("El prompt del bot es requerido");
      }

      // 🔧 DEBUG: Imprimir formData antes de preparar datos
      console.log("🔧 [FORM DEBUG] FormData completo antes de enviar:", {
        nombreBot: formData.nombreBot,
        longitud: formData.nombreBot?.length,
        userbot: formData.userbot,
        userbotLength: formData.userbot?.length,
        todoElFormData: formData,
      });

      // Preparar datos según el modelo creacionbots
      const botData = {
        nombreBot: formData.nombreBot,
        descripcion: formData.descripcion,
        tipoBot: formData.tipoBot,
        sesionId: formData.sesionId,
        configIA: {
          userbot: formData.nombreBot, // SIEMPRE usar el nombre completo del bot
          apikey: formData.apikey,
          server: formData.server,
          promt: formData.promt,
          pais: formData.pais,
          idioma: formData.idioma,
          numerodemensajes: formData.numerodemensajes,
          delay_seconds: formData.delay_seconds,
          temperature: formData.temperature,
          topP: formData.topP,
          maxOutputTokens: formData.maxOutputTokens,
          pause_timeout_minutes: formData.pause_timeout_minutes,
          ai_model: formData.ai_model,
          thinking_budget: formData.thinking_budget,
          activo: formData.activo,
        },
      };

      // 🔧 DEBUG: Imprimir botData antes de enviar
      console.log("🔧 [FORM DEBUG] BotData preparado para enviar:", {
        nombreBot: botData.nombreBot,
        nombreBotLength: botData.nombreBot?.length,
        userbot: botData.configIA?.userbot,
        userbotLength: botData.configIA?.userbot?.length,
        todoBotData: botData,
      });

      // Si estamos editando, agregar más campos
      if (editingBot) {
        Object.assign(botData, {
          configuracionAvanzada: {
            autoActivar: formData.autoActivar,
            limiteConversacionesDiario: formData.limiteConversacionesDiario,
          },
          tags: formData.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter((t: string) => t),
        });
      }

      let result;
      if (editingBot) {
        // Actualizar bot existente
        console.log(
          "🔧 [FORM DEBUG] Actualizando bot existente ID:",
          editingBot.id || editingBot._id
        );
        result = await botsAPI.update(editingBot.id || editingBot._id, botData);
      } else {
        // Crear nuevo bot
        console.log("🔧 [FORM DEBUG] Creando nuevo bot con datos:", botData);
        result = await botsAPI.create(botData);
      }

      console.log("🔧 [FORM DEBUG] Resultado de la API:", result);

      if (result.success) {
        // Guardar configuración en Gemini API también
        const geminiConfig = {
          userbot: formData.userbot || formData.nombreBot,
          apikey: formData.apikey,
          server: formData.server,
          numerodemensajes: formData.numerodemensajes,
          promt: formData.promt,
          pais: formData.pais,
          idioma: formData.idioma,
          delay_seconds: formData.delay_seconds,
          temperature: formData.temperature,
          topP: formData.topP,
          maxOutputTokens: formData.maxOutputTokens,
          pause_timeout_minutes: formData.pause_timeout_minutes,
          ai_model: formData.ai_model,
          thinking_budget: formData.thinking_budget,
          activo: formData.activo,
          sesionId: formData.sesionId,
          phoneNumber:
            sessions.find((s) => s.sesionId === formData.sesionId)
              ?.numeroWhatsapp || "",
        };

        try {
          if (editingBot) {
            await geminiAPI.updateConfig(geminiConfig);
          } else {
            await geminiAPI.saveConfig(geminiConfig);
          }
        } catch (error) {
          console.error("Error guardando configuración en Gemini:", error);
          // No fallar todo si Gemini falla, el bot ya está creado
        }

        toast({
          title: editingBot ? "Bot actualizado" : "Bot creado",
          description: `${formData.nombreBot} ha sido ${
            editingBot ? "actualizado" : "creado"
          } exitosamente`,
        });

        if (onConfigSaved) {
          onConfigSaved();
        }
      } else {
        throw new Error(result.message || "Error al guardar el bot");
      }
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Probar configuración
  const handleTest = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "Error",
        description: "Escribe un mensaje de prueba",
        variant: "destructive",
      });
      return;
    }

    if (!formData.apikey || !formData.sesionId) {
      toast({
        title: "Error",
        description: "Debes configurar la API Key y sesión antes de probar",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Usar la API de Gemini para procesar directamente
      const selectedSession = sessions.find(
        (s) => s.sesionId === formData.sesionId
      );
      const result = await geminiAPI.processDirect({
        lineaWA: selectedSession?.numeroWhatsapp || formData.sesionId,
        mensaje_reciente: testMessage,
        userbot: formData.userbot || formData.nombreBot,
        apikey: formData.apikey,
        server: formData.server,
        numerodemensajes: formData.numerodemensajes,
        promt: formData.promt,
        pais: formData.pais,
        idioma: formData.idioma,
        delay_seconds: formData.delay_seconds,
        temperature: formData.temperature,
        topP: formData.topP,
        maxOutputTokens: formData.maxOutputTokens,
        pause_timeout_minutes: formData.pause_timeout_minutes,
        ai_model: formData.ai_model,
        thinking_budget: formData.thinking_budget,
      });

      if (result.success) {
        setTestResult({
          success: true,
          response:
            result.data.response ||
            result.data.answer ||
            "Respuesta procesada correctamente",
          timestamp: new Date().toISOString(),
        });

        toast({
          title: "Prueba exitosa",
          description: "El bot respondió correctamente",
        });
      } else {
        throw new Error(result.message || "Error al procesar mensaje");
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || "Error al probar la configuración",
      });

      toast({
        title: "Error en la prueba",
        description: error.message || "No se pudo conectar con el bot",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              {editingBot ? "Editar ChatBot" : "Configurar Nuevo ChatBot"}
            </CardTitle>
            <CardDescription>
              Configura tu asistente inteligente con Gemini IA
            </CardDescription>
          </div>
          <Badge variant={formData.activo ? "default" : "secondary"}>
            {formData.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden md:inline">Básico</span>
            </TabsTrigger>
            <TabsTrigger value="ia" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden md:inline">Config IA</span>
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              <span className="hidden md:inline">Webhook</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden md:inline">Comportamiento</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Avanzado</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden md:inline">Pruebas</span>
            </TabsTrigger>
          </TabsList>

          {/* Configuración Básica */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreBot">
                  Nombre del Bot
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="nombreBot"
                  value={formData.nombreBot}
                  onChange={(e) => {
                    updateField("nombreBot", e.target.value);
                    // SIEMPRE actualizar userbot con el nombre completo del bot
                    updateField("userbot", e.target.value);
                  }}
                  placeholder="Ej: Asistente Virtual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sesionId">
                  Sesión de WhatsApp
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.sesionId}
                  onValueChange={(value) => updateField("sesionId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una sesión" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingSessions ? (
                      <SelectItem value="loading" disabled>
                        Cargando sesiones...
                      </SelectItem>
                    ) : sessions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No hay sesiones disponibles
                      </SelectItem>
                    ) : (
                      sessions.map((session) => (
                        <SelectItem
                          key={session.sesionId}
                          value={session.sesionId}
                          disabled={!session.disponible}
                        >
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {session.numeroWhatsapp} - {session.sesionId}
                            {!session.disponible && " (No disponible)"}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => updateField("descripcion", e.target.value)}
                  placeholder="Describe el propósito y funciones del bot..."
                  rows={3}
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="tags">Etiquetas (Tags)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => updateField("tags", e.target.value)}
                  placeholder="gemini, ia, chatbot (separadas por comas)"
                />
                <p className="text-sm text-muted-foreground">
                  Etiquetas para organizar y buscar tu bot
                </p>
              </div>

              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Estado del Bot</Label>
                    <p className="text-sm text-muted-foreground">
                      Activa o desactiva el bot
                    </p>
                  </div>
                  <Switch
                    checked={formData.activo}
                    onCheckedChange={(checked) =>
                      updateField("activo", checked)
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Configuración de IA */}
          <TabsContent value="ia" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apikey">
                    API Key de Gemini
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="apikey"
                    type="text"
                    value={formData.apikey}
                    onChange={(e) => updateField("apikey", e.target.value)}
                    placeholder="Tu API Key de Google Gemini"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_model">Modelo de IA</Label>
                  <Select
                    value={formData.ai_model}
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
                    value={formData.pais}
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
                    value={formData.idioma}
                    onValueChange={(value) => updateField("idioma", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promt">
                  Prompt del Bot (Personalidad)
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  id="promt"
                  value={formData.promt}
                  onChange={(e) => updateField("promt", e.target.value)}
                  placeholder="Describe el comportamiento y personalidad del bot..."
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Define cómo debe comportarse tu bot y qué tipo de respuestas
                  debe dar
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temperatura</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.temperature]}
                      onValueChange={([value]) =>
                        updateField("temperature", value)
                      }
                      min={0}
                      max={1}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {formData.temperature}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Controla la creatividad (0 = conservador, 1 = creativo)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tokens máximos de salida</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.maxOutputTokens]}
                      onValueChange={([value]) =>
                        updateField("maxOutputTokens", value)
                      }
                      min={128}
                      max={2048}
                      step={128}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16 text-right">
                      {formData.maxOutputTokens}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Longitud máxima de las respuestas
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                  <CardHeader className="pb-4">
                    <Label className="flex items-center gap-2 text-lg">
                      <Brain className="h-5 w-5 text-blue-600" />
                      Presupuesto de Pensamiento (Thinking Budget)
                      <span className="text-red-500">*</span>
                    </Label>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select
                      value={formData.thinking_budget.toString()}
                      onValueChange={(value) =>
                        updateField("thinking_budget", parseInt(value))
                      }
                    >
                      <SelectTrigger className="border-blue-300 dark:border-blue-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              Razonamiento Ilimitado
                            </span>
                            <Badge variant="default" className="ml-2">
                              Recomendado
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="0">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">
                              Sin Razonamiento
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              Rápido
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="1000">
                          1,000 tokens de razonamiento
                        </SelectItem>
                        <SelectItem value="5000">
                          5,000 tokens de razonamiento
                        </SelectItem>
                        <SelectItem value="10000">
                          10,000 tokens de razonamiento
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Alert className="border-blue-200 dark:border-blue-800">
                      <Brain className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Importante:</strong> Este parámetro controla la
                        capacidad de razonamiento del bot.
                        <div className="mt-2 space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="text-green-600 dark:text-green-400">
                              •
                            </span>
                            <span>
                              <strong>-1 (Ilimitado):</strong> El bot puede
                              pensar todo lo necesario para dar respuestas más
                              inteligentes y contextuales
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-orange-600 dark:text-orange-400">
                              •
                            </span>
                            <span>
                              <strong>0 (Desactivado):</strong> Respuestas
                              rápidas pero menos elaboradas, sin proceso de
                              razonamiento
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Configuración de Webhook */}
          <TabsContent value="webhook" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <Webhook className="h-4 w-4" />
                <AlertDescription>
                  La configuración del webhook permite que tu bot reciba
                  mensajes en tiempo real de WhatsApp. El webhook se configurará
                  automáticamente al crear el bot.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL del Webhook</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="webhookUrl"
                    value={`${formData.server}/api/v2/webhook/${
                      user?.id || user?._id || "[USER_ID]"
                    }`}
                    disabled
                    className="flex-1"
                  />
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Auto-configurado
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta URL se configurará automáticamente cuando crees el bot
                </p>
              </div>

              <div className="space-y-2">
                <Label>Eventos del Webhook</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Mensajes entrantes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Estados de conexión</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Cambios de estado de mensajes
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sesión seleccionada</Label>
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ID de Sesión:</span>
                      <span className="text-sm text-muted-foreground">
                        {formData.sesionId || "No seleccionada"}
                      </span>
                    </div>
                    {formData.sesionId &&
                      sessions.find(
                        (s) => s.sesionId === formData.sesionId
                      ) && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Número WhatsApp:
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {
                              sessions.find(
                                (s) => s.sesionId === formData.sesionId
                              )?.numeroWhatsapp
                            }
                          </span>
                        </div>
                      )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Comportamiento */}
          <TabsContent value="behavior" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Límites de Conversación
                </h3>

                <div className="space-y-2">
                  <Label>Número de mensajes en contexto</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.numerodemensajes]}
                      onValueChange={([value]) =>
                        updateField("numerodemensajes", value)
                      }
                      min={1}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {formData.numerodemensajes}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cantidad de mensajes anteriores que el bot recordará
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tiempo de pausa (minutos)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.pause_timeout_minutes]}
                      onValueChange={([value]) =>
                        updateField("pause_timeout_minutes", value)
                      }
                      min={5}
                      max={120}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-16 text-right">
                      {formData.pause_timeout_minutes} min
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tiempo de inactividad antes de pausar la conversación
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tiempos de Respuesta
                </h3>

                <div className="space-y-2">
                  <Label>Retraso entre mensajes (segundos)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.delay_seconds]}
                      onValueChange={([value]) =>
                        updateField("delay_seconds", value)
                      }
                      min={0}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {formData.delay_seconds}s
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tiempo de espera antes de enviar la respuesta
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Límite diario de conversaciones</Label>
                  <Input
                    type="number"
                    value={formData.limiteConversacionesDiario}
                    onChange={(e) =>
                      updateField(
                        "limiteConversacionesDiario",
                        parseInt(e.target.value) || 1000
                      )
                    }
                    min={1}
                    max={10000}
                  />
                  <p className="text-sm text-muted-foreground">
                    Máximo de conversaciones por día
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Configuración Avanzada */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Configuración Avanzada
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-activar al crear</Label>
                    <p className="text-sm text-muted-foreground">
                      El bot se activará automáticamente al crearlo
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoActivar}
                    onCheckedChange={(checked) =>
                      updateField("autoActivar", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aprender de conversaciones</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que el bot mejore con el tiempo (experimental)
                    </p>
                  </div>
                  <Switch checked={false} disabled onCheckedChange={() => {}} />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Top P</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.topP]}
                      onValueChange={([value]) => updateField("topP", value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {formData.topP}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Diversidad de vocabulario
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pruebas */}
          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Prueba tu configuración antes de guardar. Asegúrate de haber
                  configurado la API Key y seleccionado una sesión.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="testMessage">Mensaje de prueba</Label>
                <Textarea
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Escribe un mensaje para probar el bot..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleTest}
                disabled={isTesting || !formData.apikey || !formData.sesionId}
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Probando...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Probar Configuración
                  </>
                )}
              </Button>

              {testResult && (
                <Card
                  className={
                    testResult.success ? "border-green-200" : "border-red-200"
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {testResult.success ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Prueba exitosa
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          Error en la prueba
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {testResult.success
                        ? testResult.response
                        : testResult.error}
                    </p>
                    {testResult.timestamp && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(testResult.timestamp).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        {/* Botones de acción */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const initialData = getInitialFormData();
              setFormData(initialData);
              toast({
                title: "Formulario reiniciado",
                description: "Se han restaurado los valores predeterminados",
              });
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>

          <Button
            onClick={handleSave}
            disabled={
              isLoading ||
              !formData.apikey ||
              !formData.sesionId ||
              !formData.nombreBot
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {editingBot ? "Actualizar Bot" : "Crear Bot"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
