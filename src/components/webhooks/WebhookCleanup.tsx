// components/webhooks/WebhookCleanup.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Trash2,
  RefreshCw,
  CheckCircle,
  Search,
  Database,
  Zap,
  Settings,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/auth";

interface WebhookDiagnostic {
  webhookId: string;
  userId: string;
  sessionId: string;
  status: "valid" | "orphaned" | "inconsistent";
  issues: string[];
  canDelete: boolean;
  sessionExists: boolean;
}

interface CleanupResult {
  analyzed: number;
  cleaned: number;
  errors: string[];
}

export default function WebhookCleanup() {
  const { user, token } = useAuthStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<WebhookDiagnostic[]>([]);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(
    null
  );

  const analyzeWebhooks = async () => {
    if (!user?.nombrebot) {
      toast({
        title: "Error",
        description: "No hay usuario autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log("🔍 [WEBHOOK CLEANUP] Iniciando análisis de webhooks...");

      // 1. Obtener webhooks del usuario
      const webhooksResponse = await fetch(
        `https://backend.autosystemprojects.site/webhook/user/${user.nombrebot}/list`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let webhookConfigs = [];
      if (webhooksResponse.ok) {
        const webhooksResult = await webhooksResponse.json();
        webhookConfigs = webhooksResult.success
          ? webhooksResult.data || []
          : [];
      }

      console.log(
        `🔍 [WEBHOOK CLEANUP] Encontrados ${webhookConfigs.length} webhooks`
      );

      // 2. Obtener sesiones del usuario
      const sessionsResponse = await fetch(
        `https://backend.autosystemprojects.site/api/v2/sesiones/user?token=${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let sessions = [];
      if (sessionsResponse.ok) {
        const sessionsResult = await sessionsResponse.json();
        sessions = sessionsResult.success
          ? sessionsResult.data?.sesiones || []
          : [];
      }

      console.log(
        `🔍 [WEBHOOK CLEANUP] Encontradas ${sessions.length} sesiones`
      );

      // 3. Analizar cada webhook
      const diagnosticResults: WebhookDiagnostic[] = [];

      for (const webhook of webhookConfigs) {
        const diagnostic: WebhookDiagnostic = {
          webhookId: webhook.webhookId,
          userId: webhook.userId,
          sessionId: webhook.sessionId,
          status: "valid",
          issues: [],
          canDelete: false,
          sessionExists: false,
        };

        // Verificar si la sesión existe
        const sessionExists = sessions.some(
          (session: any) =>
            session._id === webhook.sessionId ||
            session.sesionId === webhook.sessionId
        );

        diagnostic.sessionExists = sessionExists;

        if (!sessionExists) {
          diagnostic.status = "orphaned";
          diagnostic.issues.push("Sesión no existe en la base de datos");
          diagnostic.canDelete = true;
        }

        // Verificar consistencia de datos
        if (sessionExists) {
          const matchingSession = sessions.find(
            (session: any) =>
              session._id === webhook.sessionId ||
              session.sesionId === webhook.sessionId
          );

          if (matchingSession) {
            // Verificar consistencia de configuración
            if (matchingSession.webhookCreado !== true && webhook.active) {
              diagnostic.status = "inconsistent";
              diagnostic.issues.push(
                "Webhook activo pero sesión marca webhookCreado=false"
              );
            }

            if (matchingSession.webhookActivo !== webhook.active) {
              diagnostic.status = "inconsistent";
              diagnostic.issues.push(
                "Estado activo inconsistente entre webhook y sesión"
              );
            }

            if (!matchingSession.webhookUrl && webhook.webhookUrl) {
              diagnostic.status = "inconsistent";
              diagnostic.issues.push("Webhook tiene URL pero sesión no");
            }
          }
        }

        // Verificar si el webhook se puede eliminar desde la API
        try {
          const testResponse = await fetch(
            `https://backend.autosystemprojects.site/webhook/${webhook.webhookId}/delete`,
            {
              method: "HEAD", // Solo verificar, no eliminar
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (testResponse.status === 404) {
            diagnostic.status = "orphaned";
            diagnostic.issues.push("Webhook no encontrado en el servidor");
            diagnostic.canDelete = false; // No se puede eliminar porque no existe
          }
        } catch (error) {
          diagnostic.issues.push(
            `Error verificando webhook: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }

        diagnosticResults.push(diagnostic);
      }

      setDiagnostics(diagnosticResults);

      const issues = diagnosticResults.filter(
        (d) => d.status !== "valid"
      ).length;

      toast({
        title: "🔍 Análisis Completado",
        description: `Analizados ${diagnosticResults.length} webhooks. ${issues} con problemas.`,
        variant: issues > 0 ? "destructive" : "default",
      });

      console.log(
        `🔍 [WEBHOOK CLEANUP] Análisis completado: ${issues} problemas encontrados`
      );
    } catch (error) {
      console.error("Error analizando webhooks:", error);
      toast({
        title: "❌ Error de Análisis",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo completar el análisis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanupWebhooks = async () => {
    if (!user?.nombrebot) return;

    const webhooksToClean = diagnostics.filter(
      (d) => d.status === "orphaned" && d.canDelete
    );

    if (webhooksToClean.length === 0) {
      toast({
        title: "🧹 Sin Limpieza Necesaria",
        description: "No hay webhooks fantasma para limpiar",
      });
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de eliminar ${webhooksToClean.length} webhook(s) fantasma?`
      )
    ) {
      return;
    }

    setIsCleaning(true);
    const results: CleanupResult = {
      analyzed: webhooksToClean.length,
      cleaned: 0,
      errors: [],
    };

    try {
      console.log(
        `🧹 [WEBHOOK CLEANUP] Limpiando ${webhooksToClean.length} webhooks fantasma...`
      );

      for (const webhook of webhooksToClean) {
        try {
          const response = await fetch(
            `https://backend.autosystemprojects.site/webhook/${webhook.webhookId}/delete`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok || response.status === 404) {
            // Éxito o ya no existe (ambos son buenos resultados)
            results.cleaned++;
            console.log(`✅ Webhook ${webhook.webhookId} eliminado`);
          } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.message || `HTTP ${response.status}`;
            results.errors.push(`${webhook.webhookId}: ${errorMsg}`);
            console.error(
              `❌ Error eliminando ${webhook.webhookId}: ${errorMsg}`
            );
          }
        } catch (error) {
          results.errors.push(
            `${webhook.webhookId}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
          console.error(`❌ Excepción eliminando ${webhook.webhookId}:`, error);
        }
      }

      setCleanupResult(results);

      if (results.cleaned > 0) {
        toast({
          title: "🧹 Limpieza Completada",
          description: `${results.cleaned} webhooks fantasma eliminados`,
        });

        // Volver a analizar después de la limpieza
        setTimeout(() => {
          analyzeWebhooks();
        }, 2000);
      }

      if (results.errors.length > 0) {
        toast({
          title: "⚠️ Limpieza Parcial",
          description: `${results.errors.length} errores durante la limpieza`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error en limpieza de webhooks:", error);
      toast({
        title: "❌ Error de Limpieza",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo completar la limpieza",
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "orphaned":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "inconsistent":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-orange-600" />
          Diagnóstico y Limpieza de Webhooks
        </CardTitle>
        <CardDescription>
          Detecta y corrige webhooks fantasma e inconsistencias en el sistema
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex gap-2">
          <Button
            onClick={analyzeWebhooks}
            disabled={isAnalyzing}
            variant="outline"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Analizar Webhooks
              </>
            )}
          </Button>

          {diagnostics.length > 0 && (
            <Button
              onClick={cleanupWebhooks}
              disabled={
                isCleaning ||
                diagnostics.filter(
                  (d) => d.status === "orphaned" && d.canDelete
                ).length === 0
              }
              variant="destructive"
            >
              {isCleaning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Limpiando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Fantasmas
                </>
              )}
            </Button>
          )}
        </div>

        {/* Resultados del análisis */}
        {diagnostics.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <h4 className="font-medium">Resultados del Diagnóstico</h4>

            <div className="grid gap-2">
              {diagnostics.map((diagnostic, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusColor(diagnostic.status)}>
                          {diagnostic.status === "valid" && "Válido"}
                          {diagnostic.status === "orphaned" && "Huérfano"}
                          {diagnostic.status === "inconsistent" &&
                            "Inconsistente"}
                        </Badge>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {diagnostic.webhookId}
                        </code>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Sesión: {diagnostic.sessionId}</div>
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          Sesión existe:{" "}
                          {diagnostic.sessionExists ? "✅" : "❌"}
                        </div>
                      </div>

                      {diagnostic.issues.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                            Problemas encontrados:
                          </div>
                          {diagnostic.issues.map((issue, i) => (
                            <div
                              key={i}
                              className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {issue}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {diagnostic.status === "valid" && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {diagnostic.status === "orphaned" && (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                      {diagnostic.status === "inconsistent" && (
                        <Zap className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Resultado de la limpieza */}
        {cleanupResult && (
          <div className="space-y-2">
            <Separator />
            <h4 className="font-medium">Resultado de la Limpieza</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {cleanupResult.analyzed}
                </div>
                <div className="text-xs text-gray-600">Analizados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {cleanupResult.cleaned}
                </div>
                <div className="text-xs text-gray-600">Limpiados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {cleanupResult.errors.length}
                </div>
                <div className="text-xs text-gray-600">Errores</div>
              </div>
            </div>

            {cleanupResult.errors.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-red-600 mb-1">
                  Errores:
                </div>
                {cleanupResult.errors.map((error, i) => (
                  <div
                    key={i}
                    className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-1 rounded"
                  >
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
