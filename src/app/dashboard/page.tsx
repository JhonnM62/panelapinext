'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getDaysRemaining, formatDate } from '@/lib/utils'
import { 
  Smartphone, 
  MessageSquare, 
  Users, 
  Calendar,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
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
  Webhook
} from 'lucide-react'
import Link from 'next/link'
import { sessionsAPI, webhooksAPI, utilsAPI, chatsAPI, authAPI, analyticsAPI } from '@/lib/api'
import { SessionData, WebhookStats } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'
import { ResourceLimitBanner, LoadingState } from '@/components/common'

interface DashboardStats {
  totalSessions: number
  activeSessions: number
  connectedSessions: number
  totalChats: number
  totalMessages: number
  totalMessagesYesterday: number
  totalMessagesWeek: number
  totalMessagesMonth: number
  unreadNotifications: number
  webhooksActive: number
  daysRemaining: number
  recentActivity: ActivityItem[]
  sessionStatus: Record<string, number>
}

interface ActivityItem {
  id: string
  type: 'session' | 'message' | 'webhook' | 'connection'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { suscripcion, resourceLimits, loading: limitsLoading } = usePlanLimits()
  
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
    sessionStatus: {}
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [healthStatus, setHealthStatus] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
    // Actualizar datos cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    if (!user) return
    
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('🔧 [Dashboard] No hay token disponible')
      return
    }
    
    console.log(`🔧 [Dashboard] Cargando datos para usuario: ${user.email} (ID: ${user.id})`)
    
    setLoading(true)
    try {
      // Cargar datos en paralelo con manejo robusto de errores
      const [
        sessionsResponse,
        healthResponse,
        webhookStatsResponse
      ] = await Promise.allSettled([
        sessionsAPI.listForUser(token).catch(err => {
          console.warn('Error en sessionsAPI.listForUser:', err)
          return { success: false, data: [], message: 'No se pudieron cargar las sesiones' }
        }),
        utilsAPI.getHealth(),
        webhooksAPI.getStats(user.id || user._id || user.email)
      ])

      // Procesar sesiones con validación robusta
      let sessionsData: SessionData[] = []
      if (sessionsResponse.status === 'fulfilled' && sessionsResponse.value.success) {
        // CORREGIDO: La respuesta viene como {sesiones: Array, total, activas, limites}
        const rawData = sessionsResponse.value.data?.sesiones || []
        sessionsData = Array.isArray(rawData) ? rawData : []
        setSessions(sessionsData)
        console.log(`🔧 [Dashboard] Sesiones cargadas para ${user.nombrebot}: ${sessionsData.length}`, sessionsData.map(s => s.id))
      } else {
        console.log(`🔧 [Dashboard] No se pudieron cargar sesiones para ${user.nombrebot}`)
        setSessions([]) // Asegurar que siempre sea un array vacío
      }

      // Procesar health
      let health: any = null
      if (healthResponse.status === 'fulfilled' && healthResponse.value.success) {
        health = healthResponse.value.data
        setHealthStatus(health)
      }

      // Procesar webhook stats con manejo robusto de errores
      let webhookStats: WebhookStats | null = null
      if (webhookStatsResponse.status === 'fulfilled' && webhookStatsResponse.value?.success) {
        webhookStats = webhookStatsResponse.value.data
      } else if (webhookStatsResponse.status === 'rejected') {
        console.log('⚠️ [Dashboard] Webhook stats no disponibles:', webhookStatsResponse.reason?.message || 'endpoint no encontrado')
        // No es un error crítico, continuamos sin stats de webhook
      }

      // Calcular estadísticas
      const daysRemaining = getDaysRemaining(user.fechaFin)
      const activeSessions = sessionsData.filter(s => s.status === 'authenticated').length
      const connectedSessions = sessionsData.filter(s => 
        s.status === 'authenticated' || s.status === 'connected'
      ).length

      // Contar status de sesiones
      const sessionStatus = sessionsData.reduce((acc, session) => {
        acc[session.status] = (acc[session.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Generar actividad reciente (simulada por ahora)
      const recentActivity: ActivityItem[] = [
        ...sessionsData.slice(0, 3).map(session => ({
          id: session.id,
          type: 'session' as const,
          title: `Sesión ${session.id}`,
          description: `Estado: ${session.status}`,
          timestamp: session.createdAt || new Date().toISOString(),
          status: session.status === 'authenticated' ? 'success' as const : 'warning' as const
        })),
        {
          id: 'health-check',
          type: 'connection' as const,
          title: 'Estado del Sistema',
          description: health ? `Tiempo activo: ${Math.floor(health.uptime / 3600)}h` : 'Verificando...',
          timestamp: new Date().toISOString(),
          status: health?.status === 'healthy' ? 'success' as const : 'warning' as const
        }
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // 🔧 OBTENER ANALYTICS REALES DEL BACKEND
      let analyticsData = { messages: { today: 0, yesterday: 0, week: 0, month: 0 } }
      try {
        console.log('🔧 [Dashboard] Obteniendo analytics desde backend...')
        const analyticsResponse = await analyticsAPI.getDashboard()
        
        if (analyticsResponse.success && analyticsResponse.data) {
          analyticsData = analyticsResponse.data
          console.log('🔧 [Dashboard] Analytics obtenido:', analyticsData)
        } else {
          console.warn('🔧 [Dashboard] Analytics no disponible:', analyticsResponse.message)
        }
      } catch (error) {
        console.warn('🔧 [Dashboard] Error obteniendo analytics:', error)
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
        sessionStatus
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar algunos datos del dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadDashboardData()
    toast({
      title: "Actualizado",
      description: "Dashboard actualizado correctamente",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authenticated':
        return 'default'
      case 'connecting':
      case 'connected':
        return 'secondary'
      case 'disconnected':
      case 'disconnecting':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authenticated':
        return <CheckCircle className="h-4 w-4" />
      case 'connecting':
      case 'connected':
        return <Activity className="h-4 w-4" />
      case 'disconnected':
      case 'disconnecting':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session':
        return <Smartphone className="h-4 w-4" />
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'webhook':
        return <Bell className="h-4 w-4" />
      case 'connection':
        return <Activity className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  if (!user) return null

  // 🚀 Mostrar loading state mejorado
  if (limitsLoading) {
    return (
      <LoadingState 
        isLoading={true}
        title="Cargando dashboard"
        className="max-w-4xl mx-auto mt-8"
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* 📊 Banner de límites críticos */}
      {suscripcion && resourceLimits && (
        <>
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
        </>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ¡Hola, {user.nombrebot}!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mt-2">
            Aquí tienes un resumen de tu actividad en WhatsApp
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Link href="/dashboard/sessions?create=true">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sesión
          </Button>
          </Link>
        </div>
      </div>

      {/* Membership Alert */}
      {!loading && user && stats.daysRemaining <= 7 && (
        <Card className={`${
          stats.daysRemaining === 0 
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
            : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${
              stats.daysRemaining === 0 
                ? 'text-red-800 dark:text-red-200' 
                : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              <AlertCircle className="h-5 w-5 mr-2" />
              {stats.daysRemaining === 0 ? 'Membresía Expirada' : 'Membresía por Expirar'}
            </CardTitle>
            <CardDescription className={
              stats.daysRemaining === 0 
                ? 'text-red-700 dark:text-red-300' 
                : 'text-yellow-700 dark:text-yellow-300'
            }>
              {stats.daysRemaining === 0 
                ? 'Tu membresía ha expirado. Renueva ahora para continuar usando todas las funciones.'
                : `Tu membresía expira en ${stats.daysRemaining} ${stats.daysRemaining === 1 ? 'día' : 'días'}. Renueva ahora para evitar interrupciones.`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Ver Planes
                </Button>
              </Link>
              <Link href="/dashboard/upgrade">
                <Button variant="outline">
                  Renovar Membresía
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card key="stats-card-total-sessions" className="hover:shadow-lg transition-shadow border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-600" />
              Sesiones WhatsApp
            </CardTitle>
            {resourceLimits && (
              <Badge variant="outline" className="text-xs">
                {resourceLimits.sesiones.current}/{resourceLimits.sesiones.limit}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {resourceLimits?.sesiones.current || stats.totalSessions}
            </div>
            <div className="flex items-center mt-2 space-x-2">
              <div className="flex items-center text-green-600">
                <Wifi className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{stats.connectedSessions}</span>
              </div>
              <span className="text-sm text-gray-500">conectadas</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resourceLimits 
                ? `${resourceLimits.sesiones.remaining} disponibles en tu plan`
                : `${stats.activeSessions} autenticadas y activas`
              }
            </p>
          </CardContent>
        </Card>

        <Card key="stats-card-bots-ia" className="hover:shadow-lg transition-shadow border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-600" />
              ChatBots con IA
            </CardTitle>
            {resourceLimits && (
              <Badge variant="outline" className="text-xs">
                {resourceLimits.botsIA.current}/{resourceLimits.botsIA.limit}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {resourceLimits?.botsIA.current || 0}
            </div>
            <div className="flex items-center mt-2">
              <Zap className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm text-purple-600 font-medium">
                {resourceLimits?.botsIA.percentage || 0}%
              </span>
              <span className="text-sm text-gray-500 ml-1">en uso</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resourceLimits 
                ? `${resourceLimits.botsIA.remaining} disponibles en tu plan`
                : 'Crea bots inteligentes para automatizar'
              }
            </p>
          </CardContent>
        </Card>

        <Card key="stats-card-webhooks" className="hover:shadow-lg transition-shadow border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Webhook className="h-4 w-4 text-green-600" />
              Webhooks
            </CardTitle>
            {resourceLimits && (
              <Badge variant="outline" className="text-xs">
                {resourceLimits.webhooks.current}/{resourceLimits.webhooks.limit}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {resourceLimits?.webhooks.current || stats.webhooksActive}
            </div>
            <div className="flex items-center mt-2">
              <Globe className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                {resourceLimits?.webhooks.percentage || 0}%
              </span>
              <span className="text-sm text-gray-500 ml-1">configurados</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resourceLimits 
                ? `${resourceLimits.webhooks.remaining} disponibles en tu plan`
                : 'Recibe notificaciones en tiempo real'
              }
            </p>
          </CardContent>
        </Card>

        <Card key="stats-card-plan-status" className="hover:shadow-lg transition-shadow border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4 text-orange-600" />
              Estado del Plan
            </CardTitle>
            {suscripcion && (
              <Badge variant={suscripcion.estaActiva ? 'default' : 'destructive'}>
                {suscripcion.estado}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              (suscripcion?.diasRestantes || stats.daysRemaining) <= 3 ? 'text-red-600' : 
              (suscripcion?.diasRestantes || stats.daysRemaining) <= 7 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {suscripcion?.diasRestantes || stats.daysRemaining}
            </div>
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-orange-600 mr-1" />
              <span className="text-sm text-orange-600 font-medium">
                {suscripcion ? suscripcion.plan.nombre : (user.tipoplan || 'Básico')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {suscripcion 
                ? `Hasta ${new Date(suscripcion.fechas.fin).toLocaleDateString()}`
                : `Hasta ${formatDate(user.fechaFin).split(',')[0]}`
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card key="system-status-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Estado del Sistema
            </CardTitle>
            <CardDescription>
              Salud y rendimiento de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                {/* API Health */}
                <div key="status-api-health" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      healthStatus?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">API de WhatsApp</span>
                  </div>
                  <Badge variant={healthStatus?.status === 'healthy' ? 'default' : 'destructive'}>
                    {healthStatus?.status || 'Desconocido'}
                  </Badge>
                </div>

                {/* Webhook Status */}
                <div key="status-webhook" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      stats.webhooksActive > 0 ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium">Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={stats.webhooksActive > 0 ? 'default' : 'secondary'}>
                      {stats.webhooksActive} activos
                    </Badge>
                    {stats.unreadNotifications > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600">
                        {stats.unreadNotifications} nuevas
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Uptime */}
                {healthStatus?.uptime && (
                  <div key="status-uptime" className="text-center py-2">
                    <p className="text-sm text-gray-600">
                      Tiempo activo: <span className="font-medium">{Math.floor(healthStatus.uptime / 3600)}h {Math.floor((healthStatus.uptime % 3600) / 60)}m</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card key="recent-activity-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimos eventos y cambios en tus sesiones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : stats.recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className={`mt-0.5 ${getActivityColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sessions Overview */}
      <Card key="sessions-overview-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Resumen de Sesiones</CardTitle>
            <CardDescription>Estado actual de todas tus sesiones de WhatsApp</CardDescription>
          </div>
          <Link href="/dashboard/sessions">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver Todas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !Array.isArray(sessions) || sessions.length === 0 ? (
            <div key="no-sessions-message" className="text-center py-12">
              <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay sesiones configuradas
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Crea tu primera sesión de WhatsApp para comenzar a enviar mensajes y automatizar tus conversaciones.
              </p>
              <Link href="/dashboard/sessions?create=true">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Sesión
              </Button>
              </Link>
            </div>
          ) : (
            <div key="sessions-list" className="space-y-4">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Smartphone className="h-8 w-8 text-blue-600" />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                          session.status === 'authenticated' ? 'bg-green-500' :
                          session.status === 'connecting' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{session.id}</p>
                        <p className="text-sm text-gray-500">
                          {session.phoneNumber ? `+${session.phoneNumber}` : 'Sin número asignado'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(session.status)} className="flex items-center gap-1">
                      {getStatusIcon(session.status)}
                      {session.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {session.createdAt ? formatDate(session.createdAt) : 'Fecha desconocida'}
                    </p>
                  </div>
                </div>
              ))}
              
              {sessions.length > 5 && (
                <div key="more-sessions-button" className="text-center pt-4">
                  <Link href="/dashboard/sessions">
                    <Button variant="outline">
                      Ver {sessions.length - 5} sesiones más
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card key="quick-actions-card">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link key="quick-action-sessions" href="/dashboard/sessions">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20">
                <Smartphone className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Sesiones</span>
                <span className="text-xs text-gray-500">{stats.totalSessions} configuradas</span>
              </Button>
            </Link>
            
            <Link key="quick-action-chats" href="/dashboard/chats">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-900/20">
                <MessageSquare className="h-6 w-6 text-purple-600" />
                <span className="font-medium">Mensajes</span>
                <span className="text-xs text-gray-500">{stats.totalChats} chats activos</span>
              </Button>
            </Link>
            
            <Link key="quick-action-webhooks" href="/dashboard/webhooks">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20">
                <Bell className="h-6 w-6 text-green-600" />
                <span className="font-medium">Webhooks</span>
                <span className="text-xs text-gray-500">{stats.unreadNotifications} nuevas</span>
              </Button>
            </Link>
            
            <Link key="quick-action-settings" href="/dashboard/settings">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20">
                <Users className="h-6 w-6 text-orange-600" />
                <span className="font-medium">Configuración</span>
                <span className="text-xs text-gray-500">Personalizar</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
