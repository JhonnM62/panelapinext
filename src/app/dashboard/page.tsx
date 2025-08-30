"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Smartphone,
  Users,
  Calendar,
  MessageSquare,
  Activity,
  CheckCircle,
  XCircle,
  TrendingUp,
  Plus,
  Bell,
  Zap,
  Globe,
  BarChart3,
  Send,
  Eye,
  Clock,
  Wifi,
  WifiOff,
  User,
  CreditCard,
  Crown,
  Bot,
  Webhook,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { sessionsAPI, webhooksAPI, utilsAPI, analyticsAPI } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { ResourceLimitBanner, LoadingState } from "@/components/common";

interface DashboardStats {
  totalSessions: number;
  activeSessions: number;
  connectedSessions: number;
  totalChats: number;
  totalMessages: number;
  totalMessagesYesterday: number;
  totalMessagesWeek: number;
  totalMessagesMonth: number;
  unreadNotifications: number;
  webhooksActive: number;
  daysRemaining: number;
  recentActivity: ActivityItem[];
  sessionStatus: Record<string, number>;
}

interface ActivityItem {
  id: string;
  type: "session" | "message" | "webhook" | "connection";
  title: string;
  description: string;
  timestamp: string;
  status: "success" | "warning" | "error" | "info";
}

// 🎨 DASHBOARD SKELETON COMPONENTS
const DashboardSkeleton = () => (
  <div className="space-y-6 lg:space-y-8">
    {/* Header Skeleton - matches real header */}
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-64 sm:h-10 sm:w-80 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200" />
          <Skeleton className="h-6 w-6 lg:h-8 lg:w-8 rounded bg-yellow-200" />
        </div>
        <Skeleton className="h-4 w-96 bg-gray-200" />
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Skeleton className="h-11 w-28 bg-gray-200 rounded" />
        <Skeleton className="h-11 w-36 bg-gradient-to-r from-blue-200 to-purple-200 rounded" />
      </div>
    </div>

    {/* Resource Limit Banners Skeleton */}
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 bg-gray-300" />
                <Skeleton className="h-3 w-64 bg-gray-200" />
              </div>
              <Skeleton className="h-8 w-20 bg-blue-200 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Stats Cards Skeleton - matches real cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {[
        { gradient: "from-blue-200 to-cyan-200", icon: "phone" },
        { gradient: "from-purple-200 to-pink-200", icon: "bot" },
        { gradient: "from-green-200 to-emerald-200", icon: "webhook" },
        { gradient: "from-orange-200 to-amber-200", icon: "clock" }
      ].map((item, i) => (
        <Card key={i} className="relative overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient}`}>
                <Skeleton className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-3 w-24 bg-gray-200 mb-2" />
                <div className="flex items-baseline flex-wrap gap-2">
                  <Skeleton className="h-7 w-12 bg-gray-300" />
                  <Skeleton className="h-5 w-16 bg-gray-200 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32 bg-gray-200 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Quick Actions Skeleton */}
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded bg-blue-200" />
        <Skeleton className="h-6 w-36 bg-gray-300" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-200 to-purple-200" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-28 bg-gray-300 mb-1" />
                  <Skeleton className="h-3 w-20 bg-gray-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {/* Recent Activity Skeleton */}
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded bg-green-200" />
        <Skeleton className="h-6 w-36 bg-gray-300" />
      </div>
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-200 to-blue-200" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-48 bg-gray-300 mb-1" />
                  <Skeleton className="h-3 w-32 bg-gray-200" />
                </div>
                <Skeleton className="h-3 w-16 bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const StatsCardSkeleton = () => (
  <Card className="relative overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-200 to-purple-200 animate-pulse" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20 bg-gray-200 animate-pulse" />
          <Skeleton className="h-8 w-16 bg-gradient-to-r from-gray-300 to-gray-400 animate-pulse" />
          <Skeleton className="h-3 w-24 bg-gray-200 animate-pulse" />
        </div>
      </div>
    </CardContent>
    {/* Shimmer effect */}
    <div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
      style={{
        transform: "translateX(-100%)",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  </Card>
);

// Componente StatsCard mejorado
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?:
    | "up"
    | "down"
    | "neutral"
    | { value: number; label: string; direction: "up" | "down" };
  icon?: any;
  description?: string;
  loading?: boolean;
  gradient?: string;
  color?: string;
  badge?: {
    current: number;
    limit: number;
  };
}

const StatsCard = ({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  description = "",
  loading = false,
  gradient = "from-blue-500 to-purple-600",
  color,
  badge,
}: StatsCardProps) => {
  if (loading) return <StatsCardSkeleton />;

  const trendData =
    typeof trend === "object"
      ? trend
      : { direction: trend as "up" | "down" | "neutral", value: 0, label: "" };
  const TrendIcon =
    trendData.direction === "up"
      ? ArrowUp
      : trendData.direction === "down"
      ? ArrowDown
      : null;
  const trendColor =
    trendData.direction === "up"
      ? "text-green-600 dark:text-green-400"
      : trendData.direction === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-gray-600 dark:text-gray-400";

  return (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          {Icon && (
            <div
              className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg self-start`}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {title}
            </p>
            <div className="flex items-baseline flex-wrap gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {value}
              </h3>
              {/* Render trend if it exists and has value */}
              {TrendIcon &&
                ((typeof trend === "object" &&
                  trend.value !== undefined &&
                  trend.value !== 0) ||
                  change) && (
                  <div className={`flex items-center space-x-1 ${trendColor}`}>
                    <TrendIcon className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {change ||
                        (typeof trend === "object"
                          ? `${trend.value} ${trend.label}`
                          : "")}
                    </span>
                  </div>
                )}
              {/* Render badge if provided */}
              {badge && (
                <Badge
                  variant="secondary"
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0"
                >
                  {badge.current}/{badge.limit}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/5 dark:to-blue-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  );
};

// 🚀 QUICK ACTION CARD
function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
  external = false,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
  external?: boolean;
}) {
  const Component = external ? "a" : Link;

  const bgColorClass =
    color === "blue"
      ? "bg-blue-100 dark:bg-blue-900/20"
      : color === "green"
      ? "bg-green-100 dark:bg-green-900/20"
      : color === "purple"
      ? "bg-purple-100 dark:bg-purple-900/20"
      : color === "orange"
      ? "bg-orange-100 dark:bg-orange-900/20"
      : "";

  const textColorClass =
    color === "blue"
      ? "text-blue-600 dark:text-blue-400"
      : color === "green"
      ? "text-green-600 dark:text-green-400"
      : color === "purple"
      ? "text-purple-600 dark:text-purple-400"
      : color === "orange"
      ? "text-orange-600 dark:text-orange-400"
      : "";

  return (
    <Component href={href} className="block group">
      <Card className="h-full hover:shadow-lg transition-all duration-200 transform group-hover:scale-[1.02] cursor-pointer border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${bgColorClass}`}>
              <Icon className={`h-6 w-6 ${textColorClass}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Component>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { suscripcion, resourceLimits, loading: planLoading } = usePlanLimits();

  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    activeSessions: 0,
    connectedSessions: 0,
    totalChats: 0,
    totalMessages: 0,
    totalMessagesYesterday: 0,
    totalMessagesWeek: 0,
    totalMessagesMonth: 0,
    unreadNotifications: 0,
    webhooksActive: 0,
    daysRemaining: 0,
    recentActivity: [],
    sessionStatus: {},
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const getDaysRemaining = (fechaFin: string): number => {
    if (!fechaFin) return 0;
    const endDate = new Date(fechaFin);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const loadDashboardData = async () => {
    if (!user) {
      console.log('🎯 [Dashboard] No hay usuario disponible, cancelando carga de datos');
      return;
    }

    console.log('🎯 [Dashboard] Iniciando carga de datos del dashboard...');
    setLoading(true);
    try {
      // Cargar datos básicos
      const [sessionsResponse, healthResponse] = await Promise.all([
        sessionsAPI.list().catch(() => ({ success: false, data: [] })),
        utilsAPI.getHealth().catch(() => ({ success: false, data: null })),
      ]);

      const sessionsData: string[] = sessionsResponse.success
        ? (Array.isArray(sessionsResponse.data) ? sessionsResponse.data : [])
        : [];
      const health = healthResponse.success ? healthResponse.data : null;

      let activeSessions = 0;
      let connectedSessions = 0;

      // Procesar estados de sesión
      const sessionStatus: Record<string, number> = {};
      const sessionPromises = sessionsData.map(async (sessionId: string) => {
        try {
          const statusResponse = await sessionsAPI.status(sessionId);
          if (statusResponse.success) {
            const status = statusResponse.data.status;
            sessionStatus[status] = (sessionStatus[status] || 0) + 1;

            if (statusResponse.data.authenticated) activeSessions++;
            if (status === "authenticated" || status === "connected")
              connectedSessions++;
          }
          return statusResponse;
        } catch {
          return null;
        }
      });

      await Promise.all(sessionPromises);

      // Calcular días restantes
      const daysRemaining = user?.fechaFin
        ? getDaysRemaining(user.fechaFin)
        : 0;

      // Crear actividad reciente simulada
      const recentActivity: ActivityItem[] = [
        {
          id: "1",
          type: "session",
          title: "Nueva sesión conectada",
          description: `${connectedSessions} sesiones activas`,
          timestamp: new Date().toISOString(),
          status: "success",
        },
        {
          id: "2",
          type: "message",
          title: "Mensajes procesados",
          description: "Sistema funcionando correctamente",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          status: "info",
        },
      ];

      // Obtener estadísticas de webhooks - CORREGIDO
      let webhookStats: any = { unreadNotifications: 0, webhookActive: false };
      try {
        if (user.id) {
          const webhookResponse = await webhooksAPI.getStats(user.id);
          if (webhookResponse.success) {
            webhookStats = webhookResponse.data;
          }
        }
      } catch (error) {
        console.warn("Error obteniendo webhook stats:", error);
      }

      // Obtener analytics - CORREGIDO
      let analyticsData: any = {
        messages: { today: 0, yesterday: 0, week: 0, month: 0 },
      };
      try {
        const analyticsResponse = await analyticsAPI.getDashboard();
        if (analyticsResponse.success) {
          analyticsData = analyticsResponse.data;
        }
      } catch (error) {
        console.warn("Error obteniendo analytics:", error);
      }

      setStats({
        totalSessions: sessionsData.length,
        activeSessions,
        connectedSessions,
        totalChats: health?.sessions?.active || 0,
        totalMessages: analyticsData.messages?.today || 0,
        totalMessagesYesterday: analyticsData.messages?.yesterday || 0,
        totalMessagesWeek: analyticsData.messages?.week || 0,
        totalMessagesMonth: analyticsData.messages?.month || 0,
        unreadNotifications: webhookStats?.unreadNotifications || 0,
        webhooksActive: webhookStats?.webhookActive ? 1 : 0,
        daysRemaining,
        recentActivity,
        sessionStatus,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar algunos datos del dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
      console.log('🎯 [Dashboard] ✅ Carga de datos completada exitosamente');
    }
  };

  useEffect(() => {
    // Cargar datos inmediatamente cuando el usuario esté disponible
    if (user) {
      console.log('🎯 [Dashboard] Usuario disponible, cargando datos del dashboard...');
      loadDashboardData();

      // Auto-refresh cada 60 segundos (aumentado para reducir carga)
      const interval = setInterval(() => {
        // Solo refrescar si no hay otra carga en progreso
        if (!loading && !refreshing) {
          setRefreshing(true);
          loadDashboardData();
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [user]); // Solo depender del usuario, no del planLoading

  const refreshData = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // 🎨 MOSTRAR SKELETON SOLO MIENTRAS CARGA EL DASHBOARD
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            No autenticado
          </h2>
          <p className="text-gray-600">
            Por favor, inicia sesión para continuar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-hidden pt-6 pb-4 px-2 sm:px-4 lg:px-6 xl:px-8 space-y-4 sm:space-y-6">
      {/* 📊 Resource Limit Banners */}
      {!planLoading && suscripcion && resourceLimits && (
        <div className="space-y-4">
          <ResourceLimitBanner
            suscripcion={suscripcion}
            resourceLimits={resourceLimits}
            resourceType="sesiones"
            resourceDisplayName="Sesiones WhatsApp"
          />
          <ResourceLimitBanner
            suscripcion={suscripcion}
            resourceLimits={resourceLimits}
            resourceType="botsIA"
            resourceDisplayName="ChatBots con IA"
          />
          <ResourceLimitBanner
            suscripcion={suscripcion}
            resourceLimits={resourceLimits}
            resourceType="webhooks"
            resourceDisplayName="Webhooks"
          />
        </div>
      )}
      
      {/* 📊 Plan Loading State */}
      {planLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48 bg-gray-300" />
                    <Skeleton className="h-3 w-64 bg-gray-200" />
                  </div>
                  <Skeleton className="h-8 w-20 bg-blue-200 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 🎯 HEADER - Super Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            ¡Hola, {user.nombrebot}!
            <Sparkles className="inline h-6 w-6 lg:h-8 lg:w-8 text-yellow-500 ml-2" />
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            Aquí tienes un resumen completo de tu actividad en WhatsApp y el
            estado de tus servicios
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 h-11"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          <Link href="/dashboard/sessions?create=true">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11 px-6">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sesión
            </Button>
          </Link>
        </div>
      </div>

      {/* 🚨 MEMBERSHIP ALERT - Mobile Optimized */}
      {!loading && user && stats.daysRemaining <= 7 && (
        <Card
          className={`border-l-4 shadow-lg ${
            stats.daysRemaining === 0
              ? "border-l-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800"
              : "border-l-amber-500 bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 border-amber-200 dark:border-amber-800"
          }`}
        >
          <CardHeader>
            <CardTitle
              className={`flex items-center text-lg font-bold ${
                stats.daysRemaining === 0
                  ? "text-red-800 dark:text-red-200"
                  : "text-amber-800 dark:text-amber-200"
              }`}
            >
              <AlertCircle className="h-6 w-6 mr-3" />
              {stats.daysRemaining === 0
                ? "Membresía Expirada"
                : "Membresía por Expirar"}
            </CardTitle>
            <CardDescription
              className={`text-base ${
                stats.daysRemaining === 0
                  ? "text-red-700 dark:text-red-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {stats.daysRemaining === 0
                ? "Tu membresía ha expirado. Renueva ahora para continuar usando todas las funciones."
                : `Tu membresía expira en ${stats.daysRemaining} ${
                    stats.daysRemaining === 1 ? "día" : "días"
                  }. Renueva ahora para evitar interrupciones.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/pricing" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Ver Planes
                </Button>
              </Link>
              <Link href="/dashboard/upgrade" className="flex-1">
                <Button variant="outline" className="w-full h-11">
                  <Crown className="h-4 w-4 mr-2" />
                  Renovar Membresía
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 📊 STATS CARDS - Perfect Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Sesiones WhatsApp"
          value={resourceLimits?.sesiones.current || stats.totalSessions}
          description={
            resourceLimits
              ? `${resourceLimits.sesiones.remaining} disponibles en tu plan`
              : `${stats.activeSessions} autenticadas y activas`
          }
          icon={Smartphone}
          gradient="from-blue-500 to-cyan-600"
          badge={
            resourceLimits
              ? {
                  current: resourceLimits.sesiones.current,
                  limit: resourceLimits.sesiones.limit,
                }
              : undefined
          }
          trend={
            stats.connectedSessions > 0
              ? {
                  value: stats.connectedSessions,
                  label: "conectadas",
                  direction: "up",
                }
              : undefined
          }
        />

        <StatsCard
          title="ChatBots con IA"
          value={resourceLimits?.botsIA.current || 0}
          description={
            resourceLimits
              ? `${resourceLimits.botsIA.remaining} disponibles en tu plan`
              : "Crea bots inteligentes para automatizar"
          }
          icon={Bot}
          gradient="from-purple-500 to-pink-600"
          badge={
            resourceLimits
              ? {
                  current: resourceLimits.botsIA.current,
                  limit: resourceLimits.botsIA.limit,
                }
              : undefined
          }
          trend={
            resourceLimits?.botsIA.percentage &&
            resourceLimits.botsIA.percentage > 0
              ? {
                  value: resourceLimits.botsIA.percentage,
                  label: "% en uso",
                  direction: "up",
                }
              : undefined
          }
        />

        <StatsCard
          title="Webhooks"
          value={resourceLimits?.webhooks.current || stats.webhooksActive}
          description={
            resourceLimits
              ? `${resourceLimits.webhooks.remaining} disponibles en tu plan`
              : "Integra con sistemas externos"
          }
          icon={Webhook}
          gradient="from-green-500 to-emerald-600"
          badge={
            resourceLimits
              ? {
                  current: resourceLimits.webhooks.current,
                  limit: resourceLimits.webhooks.limit,
                }
              : undefined
          }
          trend={
            resourceLimits?.webhooks.percentage &&
            resourceLimits.webhooks.percentage > 0
              ? {
                  value: resourceLimits.webhooks.percentage,
                  label: "% configurados",
                  direction: "up",
                }
              : undefined
          }
        />

        <StatsCard
          title="Días Restantes"
          value={stats.daysRemaining}
          description="de tu membresía"
          icon={Clock}
          gradient="from-orange-500 to-amber-600"
        />
      </div>

      {/* 🚀 QUICK ACTIONS - Mobile First */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Nueva Sesión WhatsApp"
            description="Conectar nuevo número"
            icon={Plus}
            href="/dashboard/sessions?create=true"
            color="blue"
          />
          <QuickActionCard
            title="Ver Chatbots"
            description="Gestionar chatbots y mensajes"
            icon={Bot}
            href="/dashboard/templates"
            color="green"
          />
          <QuickActionCard
            title="Configurar Webhook"
            description="Integrar con tu sistema"
            icon={Webhook}
            href="/dashboard/webhooks"
            color="purple"
          />
          <QuickActionCard
            title="Crear ChatBot IA"
            description="Automatizar respuestas"
            icon={Bot}
            href="/dashboard/templates?tab=bots"
            color="orange"
          />
        </div>
      </div>

      {/* 📈 RECENT ACTIVITY - Responsive */}
      {stats.recentActivity.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Actividad Reciente
          </h2>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <Card
                key={activity.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        activity.status === "success"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : activity.status === "warning"
                          ? "bg-yellow-100 dark:bg-yellow-900/30"
                          : activity.status === "error"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-blue-100 dark:bg-blue-900/30"
                      }`}
                    >
                      {activity.type === "session" && (
                        <Smartphone className="h-4 w-4" />
                      )}
                      {activity.type === "message" && (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      {activity.type === "webhook" && (
                        <Webhook className="h-4 w-4" />
                      )}
                      {activity.type === "connection" && (
                        <Activity className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
