import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useGeminiConfig } from "@/store/gemini-store";
import { sessionsAPI } from "@/lib/api";

export interface GeminiFormData {
  // Configuración básica
  userbot: string;
  apikey: string;
  sesionId: string;
  phoneNumber: string;
  promt: string;

  // Configuración avanzada
  server: string;
  pais: string;
  idioma: string;
  numerodemensajes: number;
  delay_seconds: number;

  // Configuración de IA
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  pause_timeout_minutes: number;
  ai_model: string;
  thinking_budget: number;

  // Estado
  activo: boolean;
}

export interface UseGeminiFormReturn {
  // Estado del formulario
  formData: GeminiFormData;
  isLoading: boolean;
  isTesting: boolean;
  testMessage: string;
  availableSessions: Array<{
    sesionId: string;
    nombresesion: string;
    numeroWhatsapp: string;
  }>;

  // Acciones del formulario
  updateField: <K extends keyof GeminiFormData>(
    field: K,
    value: GeminiFormData[K]
  ) => void;
  setTestMessage: (message: string) => void;

  // Acciones principales
  handleSave: () => Promise<void>;
  handleTest: () => Promise<void>;
  handleDelete: () => Promise<void>;
  loadAvailableSessions: () => Promise<void>;

  // Estados derivados
  hasValidConfig: boolean;
  isReadyToSave: boolean;
  canTest: boolean;
}

export const useGeminiForm = (
  userToken: string,
  onConfigSaved?: () => void
): UseGeminiFormReturn => {
  const { toast } = useToast();
  const {
    config,
    isLoading: configLoading,
    saveConfig,
    deleteConfig,
    testConfig,
    loadConfig,
    hasValidConfig,
    setConfig,
  } = useGeminiConfig();

  // Estado local del formulario
  const [formData, setFormData] = useState<GeminiFormData>({
    userbot: config?.userbot || "",
    apikey: config?.apikey || "",
    sesionId: config?.sesionId || "",
    phoneNumber: config?.phoneNumber || "",
    promt:
      config?.promt ||
      "Eres un asistente inteligente y amigable para WhatsApp. Responde de manera clara, útil y concisa.",
    server: config?.server || "https://backend.autosystemprojects.site",
    pais: config?.pais || "colombia",
    idioma: config?.idioma || "es",
    numerodemensajes: config?.numerodemensajes || 8,
    delay_seconds: config?.delay_seconds || 8,
    temperature: config?.temperature || 0.0,
    topP: config?.topP || 0.9,
    maxOutputTokens: config?.maxOutputTokens || 512,
    pause_timeout_minutes: config?.pause_timeout_minutes || 30,
    ai_model: config?.ai_model || "gemini-2.5-flash",
    thinking_budget: config?.thinking_budget || -1,
    activo: config?.activo !== undefined ? config.activo : true,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("Hola, ¿cómo estás?");
  const [availableSessions, setAvailableSessions] = useState<
    Array<{
      sesionId: string;
      nombresesion: string;
      numeroWhatsapp: string;
    }>
  >([]);

  // Actualizar campo del formulario
  const updateField = useCallback(
    <K extends keyof GeminiFormData>(field: K, value: GeminiFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Cargar sesiones disponibles
  const loadAvailableSessions = useCallback(async () => {
    try {
      const response = await sessionsAPI.list();
      if (response.success) {
        setAvailableSessions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error cargando sesiones:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones disponibles",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Guardar configuración
  const handleSave = useCallback(async () => {
    try {
      // Validaciones básicas
      if (!formData.userbot.trim()) {
        toast({
          title: "Error de validación",
          description: "El nombre del bot es requerido",
          variant: "destructive",
        });
        return;
      }

      if (!formData.apikey.trim()) {
        toast({
          title: "Error de validación",
          description: "La API Key de Gemini es requerida",
          variant: "destructive",
        });
        return;
      }

      if (!formData.sesionId) {
        toast({
          title: "Error de validación",
          description: "Debe seleccionar una sesión de WhatsApp",
          variant: "destructive",
        });
        return;
      }

      // Actualizar la configuración en el store antes de guardar
      setConfig(formData);
      await saveConfig(userToken);

      toast({
        title: "✅ Configuración guardada",
        description: "La configuración de IA se ha guardado exitosamente",
      });

      onConfigSaved?.();
    } catch (error: any) {
      console.error("Error guardando configuración:", error);
      toast({
        title: "Error al guardar",
        description:
          error.response?.data?.message ||
          "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  }, [formData, saveConfig, toast, onConfigSaved]);

  // Probar configuración
  const handleTest = useCallback(async () => {
    if (!testMessage.trim()) {
      toast({
        title: "Error",
        description: "Escribe un mensaje para probar",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      // Actualizar la configuración en el store antes de probar
      setConfig(formData);

      const result = await testConfig(testMessage, userToken);

      toast({
        title: "✅ Prueba exitosa",
        description: "La configuración de IA funcionó correctamente",
      });
    } catch (error: any) {
      console.error("Error en prueba:", error);
      toast({
        title: "Error en la prueba",
        description: error.response?.data?.message || "La prueba falló",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  }, [formData, testMessage, testConfig, toast]);

  // Eliminar configuración
  const handleDelete = useCallback(async () => {
    try {
      await deleteConfig(userToken);

      // Limpiar formulario
      setFormData({
        userbot: "",
        apikey: "",
        sesionId: "",
        phoneNumber: "",
        promt:
          "Eres un asistente inteligente y amigable para WhatsApp. Responde de manera clara, útil y concisa.",
        server: "https://backend.autosystemprojects.site",
        pais: "colombia",
        idioma: "es",
        numerodemensajes: 8,
        delay_seconds: 8,
        temperature: 0.0,
        topP: 0.9,
        maxOutputTokens: 512,
        pause_timeout_minutes: 30,
        ai_model: "gemini-2.5-flash",
        thinking_budget: -1,
        activo: true,
      });

      toast({
        title: "✅ Configuración eliminada",
        description: "La configuración se ha eliminado correctamente",
      });
    } catch (error: any) {
      console.error("Error eliminando configuración:", error);
      toast({
        title: "Error al eliminar",
        description:
          error.response?.data?.message ||
          "No se pudo eliminar la configuración",
        variant: "destructive",
      });
    }
  }, [deleteConfig, toast]);

  // Estados derivados
  const isReadyToSave = Boolean(
    formData.userbot.trim() &&
      formData.apikey.trim() &&
      formData.sesionId &&
      formData.promt.trim()
  );

  const canTest = Boolean(isReadyToSave && testMessage.trim() && !isTesting);

  return {
    // Estado del formulario
    formData,
    isLoading: configLoading,
    isTesting,
    testMessage,
    availableSessions,

    // Acciones del formulario
    updateField,
    setTestMessage,

    // Acciones principales
    handleSave,
    handleTest,
    handleDelete,
    loadAvailableSessions,

    // Estados derivados
    hasValidConfig,
    isReadyToSave,
    canTest,
  };
};
