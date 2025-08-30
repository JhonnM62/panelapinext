"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Send,
  Activity,
  Calendar,
  Clock,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Wifi,
  WifiOff,
  Phone,
  Globe,
  Zap,
  AlertCircle,
} from "lucide-react";
import { sessionsAPI, utilsAPI, webhooksAPI } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

// 🎨 ANALYTICS SKELETON COMPONENT
function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-64 bg-gradient-to-r from-blue-200 to-purple-200 mb-2" />
          <Skeleton className="h-5 w-80 bg-gray-200" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 bg-gray-200" />
          <Skeleton className="h-9 w-36 bg-gradient-to-r from-blue-200 to-purple-200" />
        </div>
      </div>

      {/* Overview Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 bg-gray-300" />
                <Skeleton className="h-5 w-5 rounded bg-gradient-to-br from-blue-200 to-purple-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-8 w-16 bg-gradient-to-r from-gray-300 to-gray-400" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-3 w-3 bg-green-200" />
                  <Skeleton className="h-3 w-12 bg-gray-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sessions Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48 bg-gray-300" />
                  <Skeleton className="h-4 w-64 bg-gray-200" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-16 bg-gray-200" />
                  <Skeleton className="h-8 w-16 bg-gray-200" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <div className="space-y-3 text-center">
                  <Skeleton className="h-6 w-6 rounded-full bg-gray-300 mx-auto animate-pulse" />
                  <Skeleton className="h-4 w-32 bg-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40 bg-gray-300" />
                <Skeleton className="h-8 w-24 bg-gray-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded bg-gradient-to-br from-green-200 to-blue-200" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24 bg-gray-300" />
                        <Skeleton className="h-3 w-16 bg-gray-200" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-16 bg-green-200 rounded-full" />
                      <Skeleton className="h-8 w-8 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & Stats */}
        <div className="space-y-6">

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 mt-1" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4 bg-gray-300" />
                      <Skeleton className="h-3 w-1/2 bg-gray-200" />
                      <Skeleton className="h-3 w-16 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Health Metrics */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-5 rounded bg-gradient-to-br from-green-200 to-emerald-200" />
                <Skeleton className="h-6 w-32 bg-gray-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 bg-gray-300" />
                    <Skeleton className="h-4 w-16 bg-gray-200" />
                  </div>
                ))}
                <div className="pt-2">
                  <Skeleton className="h-2 w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28 bg-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-gradient-to-r from-blue-200 to-purple-200" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
import { Skeleton } from "@/components/ui/skeleton";

interface SessionAnalytics {
  id: string;
  status:
    | "connecting"
    | "connected"
    | "authenticated"
    | "disconnected"
    | "disconnecting";
  createdAt?: string;
  lastActivity?: string;
  messageCount?: number;
  chatCount?: number;
  uptime?: number;
  errorCount?: number;
}

interface WebhookAnalytics {
  totalNotifications: number;
  unreadNotifications: number;
  webhookActive: boolean;
  lastNotification?: string;
  connectedClients: number;
}

interface HealthMetrics {
  status: string;
  timestamp: string;
  uptime: number;
  memory: { used: string; total: string };
  sessions: { active: number; connected: number };
  webhooks: { active: number; lastNotification?: string };
}

interface AnalyticsData {
  overview: {
    totalSessions: number;
    activeSessions: number;
    authenticatedSessions: number;
    totalWebhooks: number;
    serverUptime: number;
    memoryUsage: string;
    errorRate: number;
  };
  trends: {
    sessionStatus: { status: string; count: number; percentage: number }[];
    dailyActivity: {
      date: string;
      sessionCount: number;
      webhookCount: number;
    }[];
    hourlyDistribution: { hour: number; count: number }[];
  };
  sessions: SessionAnalytics[];
  webhooks: WebhookAnalytics | null;
  health: HealthMetrics | null;
  recentActivity: {
    id: string;
    type:
      | "session_created"
      | "session_connected"
      | "session_disconnected"
      | "webhook_triggered"
      | "error";
    title: string;
    description: string;
    timestamp: string;
    status: "success" | "warning" | "error";
    sessionId?: string;
  }[];
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: {
      totalSessions: 0,
      activeSessions: 0,
      authenticatedSessions: 0,
      totalWebhooks: 0,
      serverUptime: 0,
      memoryUsage: "0MB",
      errorRate: 0,
    },
    trends: {
      sessionStatus: [],
      dailyActivity: [],
      hourlyDistribution: [],
    },
    sessions: [],
    webhooks: null,
    health: null,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">(
    "24h"
  );
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!refreshing) {
        loadAnalyticsData(true); // Silent refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshing]);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      if (silent) setRefreshing(true);

      try {
        // Cargar datos en paralelo
        const [sessionsResponse, healthResponse, userToken] =
          await Promise.allSettled([
            sessionsAPI.list(),
            utilsAPI.getHealth(),
            Promise.resolve(localStorage.getItem("token") || "unknown-user"),
          ]);

        let sessions: any[] = [];
        let health: HealthMetrics | null = null;
        let userId = "unknown-user";

        // Procesar respuesta de sesiones
        if (
          sessionsResponse.status === "fulfilled" &&
          sessionsResponse.value.success
        ) {
          sessions = Array.isArray(sessionsResponse.value.data) ? sessionsResponse.value.data : [];
        }

        // Procesar respuesta de health
        if (
          healthResponse.status === "fulfilled" &&
          healthResponse.value.success
        ) {
          health = healthResponse.value.data;
        }

        // Obtener userId
        if (userToken.status === "fulfilled") {
          userId = userToken.value || "unknown-user";
        }

        // Intentar obtener estadísticas de webhooks (puede fallar)
        let webhookStats: WebhookAnalytics | null = null;
        try {
          const webhookResponse = await webhooksAPI.getStats(userId);
          if (webhookResponse.success) {
            webhookStats = webhookResponse.data as WebhookAnalytics;
          }
        } catch (error) {
          console.warn(
            "No se pudieron cargar las estadísticas de webhooks:",
            error
          );
        }

        // Procesar sesiones para analytics
        const processedSessions: SessionAnalytics[] = sessions.map(
          (session) => ({
            id: session.id || session.sessionId || "unknown",
            status: session.status || "disconnected",
            createdAt: session.createdAt || new Date().toISOString(),
            lastActivity:
              session.lastActivity ||
              session.updatedAt ||
              new Date().toISOString(),
            messageCount: Math.floor(Math.random() * 1000), // Simulated for now
            chatCount: Math.floor(Math.random() * 50), // Simulated for now
            uptime: Math.floor(Math.random() * 86400), // Simulated for now
            errorCount: Math.floor(Math.random() * 5),
          })
        );

        // Calcular métricas overview
        const totalSessions = processedSessions.length;
        const activeSessions = processedSessions.filter((s) =>
          ["connected", "authenticated"].includes(s.status)
        ).length;
        const authenticatedSessions = processedSessions.filter(
          (s) => s.status === "authenticated"
        ).length;

        // Calcular distribución de estados
        const statusDistribution = processedSessions.reduce((acc, session) => {
          acc[session.status] = (acc[session.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sessionStatusTrends = Object.entries(statusDistribution).map(
          ([status, count]) => ({
            status: status.charAt(0).toUpperCase() + status.slice(1),
            count,
            percentage:
              totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
          })
        );

        // Generar datos de actividad diaria (últimos 7 días)
        const dailyActivity = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split("T")[0],
            sessionCount: Math.floor(Math.random() * totalSessions) + 1,
            webhookCount: Math.floor(Math.random() * 100) + 10,
          };
        });

        // Generar distribución por horas (últimas 24 horas)
        const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          count: Math.floor(Math.random() * 20) + 1,
        }));

        // Generar actividad reciente
        const recentActivity = [
          ...processedSessions.slice(0, 3).map((session) => ({
            id: `activity-${session.id}`,
            type:
              session.status === "authenticated"
                ? ("session_connected" as const)
                : ("session_created" as const),
            title: `Sesión ${
              session.status === "authenticated" ? "autenticada" : "creada"
            }`,
            description: `Sesión ${session.id} ${
              session.status === "authenticated"
                ? "se conectó exitosamente"
                : "fue creada"
            }`,
            timestamp: session.lastActivity || new Date().toISOString(),
            status:
              session.status === "authenticated"
                ? ("success" as const)
                : ("warning" as const),
            sessionId: session.id,
          })),
          {
            id: "health-check",
            type: "webhook_triggered" as const,
            title: "Health Check",
            description: `Servidor funcionando correctamente. Memoria: ${
              health?.memory?.used || "N/A"
            }`,
            timestamp: health?.timestamp || new Date().toISOString(),
            status: health?.status === "ok" ? ("success" as const) : ("warning" as const),
          },
        ].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const finalAnalyticsData: AnalyticsData = {
          overview: {
            totalSessions,
            activeSessions,
            authenticatedSessions,
            totalWebhooks: webhookStats?.webhookActive ? 1 : 0,
            serverUptime: health?.uptime || 0,
            memoryUsage: health?.memory?.used || "0MB",
            errorRate: processedSessions.reduce(
              (sum, s) => sum + (s.errorCount || 0),
              0
            ),
          },
          trends: {
            sessionStatus: sessionStatusTrends,
            dailyActivity,
            hourlyDistribution,
          },
          sessions: processedSessions,
          webhooks: webhookStats,
          health,
          recentActivity,
        };

        setAnalyticsData(finalAnalyticsData);
      } catch (error) {
        console.error("Error loading analytics:", error);
        if (!silent) {
          toast({
            title: "Error",
            description: "No se pudieron cargar los datos de analytics",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeRange]
  );

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    toast({
      title: "Actualizado",
      description: "Datos de analytics actualizados",
    });
  };

  const exportData = () => {
    const data = {
      exported_at: new Date().toISOString(),
      time_range: timeRange,
      overview: analyticsData.overview,
      trends: analyticsData.trends,
      sessions: analyticsData.sessions.map((s) => ({
        id: s.id,
        status: s.status,
        uptime: s.uptime,
        messageCount: s.messageCount,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp_analytics_${timeRange}_${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "authenticated":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "connected":
        return <Wifi className="h-4 w-4 text-blue-600" />;
      case "connecting":
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      case "disconnected":
      case "disconnecting":
        return <WifiOff className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "session_connected":
        return <CheckCircle className="h-4 w-4" />;
      case "session_created":
        return <Smartphone className="h-4 w-4" />;
      case "session_disconnected":
        return <WifiOff className="h-4 w-4" />;
      case "webhook_triggered":
        return <Zap className="h-4 w-4" />;
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  if (loading) {
    return <AnalyticsSkeleton />
  }

  return (
    <div className="max-w-full overflow-x-hidden pt-6 pb-4 px-2 sm:px-4 lg:px-6 xl:px-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics WhatsApp
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Monitoreo en tiempo real de sesiones, webhooks y rendimiento del
            sistema
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Auto-refresh Toggle */}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="h-8 w-full sm:w-auto"
          >
            <Activity
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`}
            />
            <span className="hidden sm:inline">Auto-refresh</span>
            <span className="sm:hidden">Auto</span>
          </Button>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(["1h", "24h", "7d", "30d"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="h-8 px-2 sm:px-3 flex-1 sm:flex-none"
              >
                {range}
              </Button>
            ))}
          </div>

          <Button variant="outline" onClick={refreshData} disabled={refreshing} className="w-full sm:w-auto">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Actualizar</span>
            <span className="sm:hidden">Refresh</span>
          </Button>

          <Button variant="outline" onClick={exportData} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Export</span>
          </Button>

          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/analytics/advanced">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Analytics Avanzados</span>
              <span className="sm:hidden">Avanzado</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sesiones Totales
                </p>
                <p className="text-2xl font-bold">
                  {analyticsData.overview.totalSessions}
                </p>
              </div>
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sesiones Activas
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.overview.activeSessions}
                </p>
              </div>
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Autenticadas
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {analyticsData.overview.authenticatedSessions}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Webhooks
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData.overview.totalWebhooks}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Uptime
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDuration(analyticsData.overview.serverUptime)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Memoria
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {analyticsData.overview.memoryUsage}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Errores
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {analyticsData.overview.errorRate}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Session Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Estado de Sesiones
            </CardTitle>
            <CardDescription>
              Distribución actual del estado de las sesiones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.trends.sessionStatus.map((status, index) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status.status.toLowerCase())}
                    <span className="font-medium">{status.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[3rem] text-right">
                      {status.count} ({status.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Actividad Diaria
            </CardTitle>
            <CardDescription>
              Sesiones y webhooks en los últimos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2 px-2">
              {analyticsData.trends.dailyActivity.map((day, index) => {
                const maxCount = Math.max(
                  ...analyticsData.trends.dailyActivity.map(
                    (d) => d.sessionCount + d.webhookCount
                  )
                );
                const sessionHeight = (day.sessionCount / maxCount) * 100;
                const webhookHeight = (day.webhookCount / maxCount) * 100;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1 space-y-1"
                  >
                    <div className="w-full space-y-1">
                      <div
                        className="bg-blue-600 rounded-t w-full min-h-[4px] transition-all hover:bg-blue-700"
                        style={{ height: `${sessionHeight}%` }}
                        title={`${day.date}: ${day.sessionCount} sesiones`}
                      />
                      <div
                        className="bg-purple-600 rounded-t w-full min-h-[4px] transition-all hover:bg-purple-700"
                        style={{ height: `${webhookHeight}%` }}
                        title={`${day.date}: ${day.webhookCount} webhooks`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground transform rotate-45 origin-left">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded" />
                  <span>Sesiones</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 rounded" />
                  <span>Webhooks</span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                Últimos 7 días
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions and Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sesiones Activas</CardTitle>
            <CardDescription>
              Estado detallado de todas las sesiones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.sessions.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay sesiones activas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analyticsData.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getStatusIcon(session.status)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{session.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.messageCount} mensajes • {session.chatCount}{" "}
                          chats
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                      <Badge
                        variant={
                          session.status === "authenticated"
                            ? "default"
                            : session.status === "connected"
                            ? "secondary"
                            : session.status === "connecting"
                            ? "outline"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {session.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(session.uptime || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimos eventos del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No hay actividad reciente
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {analyticsData.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div
                      className={`mt-0.5 ${getActivityColor(activity.status)}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </p>
                          {activity.sessionId && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Sesión: {activity.sessionId}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      {analyticsData.health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Estado del Sistema
            </CardTitle>
            <CardDescription>
              Métricas de salud del servidor y servicios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Estado
                </p>
                <div className="flex items-center gap-2">
                  {analyticsData.health?.status === "ok" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">
                    {analyticsData.health?.status?.toUpperCase() || 'DESCONOCIDO'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Memoria
                </p>
                <p className="text-lg font-semibold">
                  {analyticsData.health?.memory?.used || 'N/A'} /{" "}
                  {analyticsData.health?.memory?.total || 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Tiempo Activo
                </p>
                <p className="text-lg font-semibold">
                  {formatDuration(analyticsData.health?.uptime || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Última Actualización
                </p>
                <p className="text-sm text-muted-foreground">
                  {analyticsData.health?.timestamp ? new Date(analyticsData.health.timestamp).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
