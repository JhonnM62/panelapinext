// components/templates/TemplatesDebugger.tsx
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
  Bug,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Database,
  Server,
  Wifi,
  Code,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/auth";

interface APITest {
  name: string;
  endpoint: string;
  method: "GET" | "POST";
  status: "pending" | "success" | "error";
  response?: any;
  error?: string;
  duration?: number;
}

interface DebugResult {
  timestamp: string;
  user: any;
  token: any;
  tests: APITest[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

export default function TemplatesDebugger() {
  const { user, token } = useAuthStore();
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);

  const runAPITest = async (test: APITest): Promise<APITest> => {
    const startTime = Date.now();

    try {
      console.log(`🔍 [DEBUG] Testing ${test.method} ${test.endpoint}`);

      const config: RequestInit = {
        method: test.method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      // Para endpoints que requieren token en params
      let url = test.endpoint;
      if (test.endpoint.includes("?token=")) {
        url = test.endpoint.replace("?token=", `?token=${token}`);
      }

      const response = await fetch(url, config);
      const responseData = await response.json().catch(() => ({}));

      const duration = Date.now() - startTime;

      if (response.ok) {
        console.log(`✅ [DEBUG] ${test.name} passed in ${duration}ms`);
        return {
          ...test,
          status: "success",
          response: responseData,
          duration,
        };
      } else {
        console.error(`❌ [DEBUG] ${test.name} failed: ${response.status}`);
        return {
          ...test,
          status: "error",
          error: `HTTP ${response.status}: ${
            responseData.message || "Unknown error"
          }`,
          response: responseData,
          duration,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [DEBUG] ${test.name} failed with exception:`, error);

      return {
        ...test,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      };
    }
  };

  const runFullDiagnostic = async () => {
    if (!user || !token) {
      toast({
        title: "Error",
        description: "No hay usuario o token disponible",
        variant: "destructive",
      });
      return;
    }

    setIsDebugging(true);
    console.log("🔍 [DEBUG] Iniciando diagnóstico completo...");

    const tests: APITest[] = [
      {
        name: "Health Check",
        endpoint: "https://backend.autosystemprojects.site/health",
        method: "GET",
        status: "pending",
      },
      {
        name: "Verificar Token",
        endpoint:
          "https://backend.autosystemprojects.site/api/v2/auth/verify-token",
        method: "POST",
        status: "pending",
      },
      {
        name: "Obtener Stats Usuario",
        endpoint: `https://backend.autosystemprojects.site/api/v2/auth/stats?token=${token}`,
        method: "GET",
        status: "pending",
      },
      {
        name: "Listar Sesiones Usuario",
        endpoint: `https://backend.autosystemprojects.site/api/v2/sesiones/user?token=${token}`,
        method: "GET",
        status: "pending",
      },
      {
        name: "Obtener Bots Usuario",
        endpoint: "https://backend.autosystemprojects.site/api/v2/bots/user",
        method: "GET",
        status: "pending",
      },
      {
        name: "Sesiones Disponibles para Bots",
        endpoint:
          "https://backend.autosystemprojects.site/api/v2/bots/sessions-available",
        method: "GET",
        status: "pending",
      },
      {
        name: "Listar Webhooks Usuario",
        endpoint: `https://backend.autosystemprojects.site/webhook/user/${user.nombrebot}/list`,
        method: "GET",
        status: "pending",
      },
      {
        name: "Stats Webhooks",
        endpoint: `https://backend.autosystemprojects.site/webhook/stats/${user.nombrebot}`,
        method: "GET",
        status: "pending",
      },
    ];

    try {
      const results: APITest[] = [];

      // Ejecutar tests secuencialmente para mejor debugging
      for (const test of tests) {
        const result = await runAPITest(test);
        results.push(result);

        // Pequeña pausa entre tests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const summary = {
        total: results.length,
        passed: results.filter((r) => r.status === "success").length,
        failed: results.filter((r) => r.status === "error").length,
      };

      const debugResult: DebugResult = {
        timestamp: new Date().toISOString(),
        user: {
          id: user._id,
          email: user.nombrebot,
          plan: user.tipoplan,
          expired: user.membershipExpired,
        },
        token: {
          exists: !!token,
          length: token?.length || 0,
          preview: token ? `${token.substring(0, 20)}...` : "No token",
        },
        tests: results,
        summary,
      };

      setDebugResult(debugResult);

      toast({
        title: "🔍 Diagnóstico Completado",
        description: `${summary.passed}/${summary.total} tests exitosos`,
        variant: summary.failed > 0 ? "destructive" : "default",
      });

      console.log("🔍 [DEBUG] Diagnóstico completado:", debugResult);
    } catch (error) {
      console.error("❌ [DEBUG] Error en diagnóstico:", error);
      toast({
        title: "❌ Error de Diagnóstico",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />;
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-blue-600" />
          Diagnóstico de Sistema Templates
        </CardTitle>
        <CardDescription>
          Herramienta de debugging para identificar problemas con endpoints y
          funcionalidad
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información del usuario */}
        {user && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Estado del Usuario
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                Email: <code>{user.nombrebot}</code>
              </div>
              <div>
                Plan: <Badge variant="outline">{user.tipoplan}</Badge>
              </div>
              <div>
                ID: <code className="text-xs">{user._id}</code>
              </div>
              <div>
                Token:{" "}
                <Badge variant={token ? "default" : "destructive"}>
                  {token ? `${token.length} chars` : "No token"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Control */}
        <Button
          onClick={runFullDiagnostic}
          disabled={isDebugging || !user || !token}
          className="w-full"
        >
          {isDebugging ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Ejecutando Diagnóstico...
            </>
          ) : (
            <>
              <Bug className="h-4 w-4 mr-2" />
              Ejecutar Diagnóstico Completo
            </>
          )}
        </Button>

        {/* Resultados */}
        {debugResult && (
          <div className="space-y-4">
            <Separator />

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {debugResult.summary.total}
                </div>
                <div className="text-xs text-gray-600">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {debugResult.summary.passed}
                </div>
                <div className="text-xs text-gray-600">Exitosos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {debugResult.summary.failed}
                </div>
                <div className="text-xs text-gray-600">Fallidos</div>
              </div>
            </div>

            <Separator />

            {/* Tests detallados */}
            <div className="space-y-2">
              <h4 className="font-medium">Resultados Detallados</h4>
              {debugResult.tests.map((test, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(test.status)}
                        <span className="font-medium">{test.name}</span>
                        {test.duration && (
                          <Badge variant="outline" className="text-xs">
                            {test.duration}ms
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-gray-600 mb-1">
                        <Code className="h-3 w-3 inline mr-1" />
                        {test.method} {test.endpoint}
                      </div>

                      {test.error && (
                        <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded mt-1">
                          ❌ {test.error}
                        </div>
                      )}

                      {test.response && test.status === "success" && (
                        <div className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded mt-1">
                          ✅ {test.response.message || "Success"}
                          {test.response.data && (
                            <div className="mt-1">
                              📊 Data:{" "}
                              {Array.isArray(test.response.data)
                                ? `${test.response.data.length} items`
                                : typeof test.response.data === "object"
                                ? `${
                                    Object.keys(test.response.data).length
                                  } properties`
                                : test.response.data}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-center">
              Diagnóstico ejecutado:{" "}
              {new Date(debugResult.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
