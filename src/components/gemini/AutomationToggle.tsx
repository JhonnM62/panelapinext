"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Brain,
  Webhook,
  Eye,
  EyeOff,
} from "lucide-react";
import { useGeminiConfig } from "@/store/gemini-store";

interface AutomationToggleProps {
  userToken: string;
  onStateChange?: (isActive: boolean) => void;
}

export default function AutomationToggle({
  userToken,
  onStateChange,
}: AutomationToggleProps) {
  const { config, updateField, saveConfig, hasValidConfig, isLoading } =
    useGeminiConfig();

  const { toast } = useToast();
  const [isToggling, setIsToggling] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Sincronizar cambios con el callback
  useEffect(() => {
    if (config?.activo !== undefined) {
      onStateChange?.(config.activo);
    }
  }, [config?.activo, onStateChange]);

  const handleToggle = async (checked: boolean) => {
    if (!hasValidConfig) {
      toast({
        title: "❌ Configuración incompleta",
        description:
          "Completa la configuración básica antes de activar la automatización",
        variant: "destructive",
      });
      return;
    }

    setIsToggling(true);

    try {
      console.log("🔄 [AUTOMATION TOGGLE] Iniciando cambio de estado:", {
        from: config?.activo,
        to: checked,
        sesionId: config?.sesionId,
        userbot: config?.userbot,
        timestamp: new Date().toISOString(),
      });

      // 1. Actualizar el estado local inmediatamente
      updateField("activo", checked);

      // 2. Esperar un momento para que se actualice el estado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 3. Guardar explícitamente en el backend
      console.log(
        "💾 [AUTOMATION TOGGLE] Guardando configuración en backend..."
      );
      await saveConfig(userToken);

      // 4. Verificar que se guardó correctamente haciendo debug
      await debugCurrentState();

      // 5. Mostrar confirmación
      toast({
        title: checked
          ? "🚀 Automatización activada"
          : "⏸️ Automatización pausada",
        description: checked
          ? "El bot procesará mensajes automáticamente"
          : "El bot no procesará mensajes automáticamente",
        duration: 3000,
      });

      console.log(
        "✅ [AUTOMATION TOGGLE] Cambio de estado completado exitosamente"
      );
    } catch (error) {
      console.error("❌ [AUTOMATION TOGGLE] Error cambiando estado:", error);

      // Revertir el cambio en caso de error
      updateField("activo", !checked);

      toast({
        title: "❌ Error",
        description: "No se pudo cambiar el estado de automatización",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const debugCurrentState = async () => {
    try {
      console.log("🔍 [AUTOMATION DEBUG] Obteniendo estado actual...");

      const frontendData = {
        timestamp: new Date().toISOString(),
        frontend_config: {
          activo: config?.activo,
          sesionId: config?.sesionId,
          userbot: config?.userbot,
          apikey: config?.apikey ? "SET" : "NOT_SET",
          hasValidConfig,
        },
        user_token: {
          exists: !!userToken,
          length: userToken?.length || 0,
          preview: userToken ? userToken.substring(0, 20) + "..." : "NOT_SET",
        },
      };

      let debugData: any = { ...frontendData, backend_status: null };

      // 🔧 NUEVO: Verificar estado en el backend usando el nuevo endpoint
      if (config?.sesionId && userToken) {
        console.log(
          "🔍 [AUTOMATION DEBUG] Verificando estado en backend para sesión:",
          config.sesionId
        );

        try {
          const response = await fetch(
            "http://100.42.185.2:8015/api/v2/gemini/debug/bot-status",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
                "x-access-token": userToken,
              },
              body: JSON.stringify({
                sesionId: config.sesionId,
              }),
            }
          );

          if (response.ok) {
            const backendStatus = await response.json();
            debugData.backend_status = {
              success: true,
              data: backendStatus.data,
              found: backendStatus.data?.found || false,
              isActive: backendStatus.data?.isActive || false,
              configIA_activo: backendStatus.data?.configIA?.activo || false,
            };

            console.log(
              "🔍 [AUTOMATION DEBUG] Estado en backend:",
              backendStatus
            );
          } else {
            const errorData = await response.text();
            debugData.backend_status = {
              success: false,
              error: `HTTP ${response.status}: ${errorData}`,
              status: response.status,
            };

            console.error(
              "🔍 [AUTOMATION DEBUG] Error en backend:",
              response.status,
              errorData
            );
          }
        } catch (fetchError) {
          debugData.backend_status = {
            success: false,
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            type: "fetch_error",
          };

          console.error(
            "🔍 [AUTOMATION DEBUG] Error haciendo fetch:",
            fetchError
          );
        }
      } else {
        debugData.backend_status = {
          success: false,
          error: "No hay sesionId o token para verificar backend",
          type: "missing_data",
        };
      }

      setDebugInfo(debugData);

      console.log("🔍 [AUTOMATION DEBUG] Estado completo:", debugData);
    } catch (error) {
      console.error("❌ [AUTOMATION DEBUG] Error en debug:", error);
      setDebugInfo({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        type: "debug_error",
      });
    }
  };

  const handleForceRefresh = async () => {
    setIsToggling(true);
    try {
      await debugCurrentState();
      toast({
        title: "🔄 Estado actualizado",
        description: "Se ha verificado el estado actual de automatización",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "No se pudo verificar el estado",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  if (!config) {
    return (
      <Card className="p-6">
        <CardContent className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Cargando configuración de automatización...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control principal de automatización */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              Automatización del Bot
            </h3>
            <p className="text-sm text-gray-600">
              {config.activo
                ? "El bot está procesando mensajes automáticamente"
                : "El bot solo responderá cuando se envíen mensajes manualmente"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant={config.activo ? "default" : "secondary"}
              className={config.activo ? "bg-green-100 text-green-800" : ""}
            >
              {config.activo ? "Activo" : "Inactivo"}
            </Badge>
            <Switch
              checked={config.activo || false}
              onCheckedChange={handleToggle}
              disabled={isToggling || isLoading || !hasValidConfig}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </Card>

      {/* Información de estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle
                className={`w-4 h-4 ${
                  hasValidConfig ? "text-green-600" : "text-gray-400"
                }`}
              />
              <Label className="text-sm font-medium">Configuración</Label>
            </div>
            <p className="text-xs text-gray-600">
              {hasValidConfig
                ? "✓ Lista para usar"
                : "✗ Configuración incompleta"}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Webhook
                className={`w-4 h-4 ${
                  config.sesionId ? "text-green-600" : "text-gray-400"
                }`}
              />
              <Label className="text-sm font-medium">Sesión WhatsApp</Label>
            </div>
            <p className="text-xs text-gray-600">
              {config.sesionId ? `✓ ${config.sesionId}` : "✗ Sin sesión"}
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Brain
                className={`w-4 h-4 ${
                  config.apikey ? "text-green-600" : "text-gray-400"
                }`}
              />
              <Label className="text-sm font-medium">Gemini IA</Label>
            </div>
            <p className="text-xs text-gray-600">
              {config.apikey ? "✓ API Key configurada" : "✗ Sin API Key"}
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
              <strong>Configuración incompleta:</strong> Completa la
              configuración básica antes de activar la automatización.
            </AlertDescription>
          </Alert>
        )}

        {hasValidConfig && config.activo && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Automatización activa:</strong> El bot procesará todos los
              mensajes entrantes automáticamente. Asegúrate de que el prompt
              esté bien configurado para evitar respuestas no deseadas.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Debug tools */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">
            Herramientas de Diagnóstico
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
          >
            {showDebugInfo ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceRefresh}
            disabled={isToggling}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Verificar Estado
          </Button>
        </div>

        {showDebugInfo && debugInfo && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Label className="text-xs font-medium text-gray-600">
              Debug Info:
            </Label>
            <pre className="text-xs text-gray-700 dark:text-gray-300 mt-1 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}
