'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  Users,
  MessageSquare,
  Activity,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  UserCheck,
  Clock,
  Globe
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuthStore } from '@/store/auth'
import { analyticsAPI } from '@/lib/api'

// 🎨 ADVANCED ANALYTICS SKELETON COMPONENT
function AdvancedAnalyticsSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-80 bg-gradient-to-r from-purple-200 to-pink-200 mb-2" />
          <Skeleton className="h-5 w-96 bg-gray-200" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32 bg-gray-200" />
          <Skeleton className="h-9 w-40 bg-gradient-to-r from-blue-200 to-purple-200" />
          <Skeleton className="h-9 w-36 bg-green-200" />
        </div>
      </div>

      {/* Main Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 bg-gray-300" />
                <Skeleton className="h-5 w-5 rounded bg-gradient-to-br from-blue-200 to-purple-200" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-gradient-to-r from-gray-300 to-gray-400 mb-2" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3 w-3 bg-green-200" />
                <Skeleton className="h-3 w-12 bg-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Large Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 bg-gray-300" />
                <Skeleton className="h-4 w-64 bg-gray-200" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-16 bg-gray-200" />
                <Skeleton className="h-8 w-16 bg-gray-200" />
                <Skeleton className="h-8 w-16 bg-gray-200" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <div className="space-y-3 text-center">
                <Skeleton className="h-6 w-6 rounded-full bg-gray-300 mx-auto animate-pulse" />
                <Skeleton className="h-4 w-32 bg-gray-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32 bg-gray-300" />
                <Skeleton className="h-4 w-4 bg-gray-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <Skeleton className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 animate-pulse" />
              </div>
              <div className="mt-4 space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-3 w-3 rounded-full bg-gray-300" />
                      <Skeleton className="h-3 w-16 bg-gray-200" />
                    </div>
                    <Skeleton className="h-3 w-8 bg-gray-200" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40 bg-gray-300" />
                <Skeleton className="h-8 w-24 bg-gray-200" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-200 to-purple-200" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24 bg-gray-300" />
                        <Skeleton className="h-3 w-16 bg-gray-200" />
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-4 w-12 bg-gray-300" />
                      <Skeleton className="h-3 w-8 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AdvancedAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - en producción esto vendría de tu API
  const [analyticsData, setAnalyticsData] = useState({
    performance: {
      responseTime: [
        { time: '00:00', value: 145 },
        { time: '04:00', value: 122 },
        { time: '08:00', value: 167 },
        { time: '12:00', value: 189 },
        { time: '16:00', value: 156 },
        { time: '20:00', value: 134 }
      ],
      throughput: [
        { time: '00:00', messages: 45, webhooks: 12 },
        { time: '04:00', messages: 23, webhooks: 8 },
        { time: '08:00', messages: 89, webhooks: 24 },
        { time: '12:00', messages: 156, webhooks: 43 },
        { time: '16:00', messages: 134, webhooks: 38 },
        { time: '20:00', messages: 78, webhooks: 19 }
      ],
      errors: [
        { time: '00:00', count: 2, type: 'connection' },
        { time: '04:00', count: 1, type: 'timeout' },
        { time: '08:00', count: 0, type: 'none' },
        { time: '12:00', count: 3, type: 'auth' },
        { time: '16:00', count: 1, type: 'rate_limit' },
        { time: '20:00', count: 0, type: 'none' }
      ],
      sessionHealth: [
        { status: 'Autenticada', count: 8 },
        { status: 'Conectada', count: 3 },
        { status: 'Conectando', count: 1 },
        { status: 'Desconectada', count: 2 }
      ]
    },
    realtime: {
      activeConnections: 12,
      messagesPerSecond: 24,
      webhooksPerSecond: 8,
      cpuUsage: 45,
      memoryUsage: 67,
      diskUsage: 34
    },
    trends: {
      weeklyMessages: [
        { name: 'Lun', messages: 234, webhooks: 45 },
        { name: 'Mar', messages: 156, webhooks: 32 },
        { name: 'Mié', messages: 298, webhooks: 67 },
        { name: 'Jue', messages: 445, webhooks: 89 },
        { name: 'Vie', messages: 567, webhooks: 123 },
        { name: 'Sáb', messages: 234, webhooks: 56 },
        { name: 'Dom', messages: 123, webhooks: 23 }
      ],
      hourlyDistribution: [
        { name: '0-3', count: 12 },
        { name: '4-7', count: 8 },
        { name: '8-11', count: 45 },
        { name: '12-15', count: 67 },
        { name: '16-19', count: 89 },
        { name: '20-23', count: 34 }
      ],
      sessionTypes: [
        { name: 'QR Code', count: 8 },
        { name: 'Pairing Code', count: 4 },
        { name: 'Manual', count: 2 }
      ]
    }
  })

  useEffect(() => {
    loadAdvancedAnalytics()
  }, [])

  const loadAdvancedAnalytics = async () => {
    setLoading(true)
    try {
      // Aquí cargarías datos reales de tu API
      // const [sessions, health, webhooks] = await Promise.all([
      //   sessionsAPI.list(),
      //   utilsAPI.getHealth(),
      //   webhooksAPI.getStats(userId)
      // ])

      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Datos cargados",
        description: "Analytics avanzados actualizados",
      })
    } catch (error) {
      console.error('Error loading advanced analytics:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los analytics avanzados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAdvancedAnalytics()
    setRefreshing(false)
  }

  const exportAdvancedData = () => {
    const data = {
      exported_at: new Date().toISOString(),
      type: 'advanced_analytics',
      performance: analyticsData.performance,
      realtime: analyticsData.realtime,
      trends: analyticsData.trends
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `advanced_analytics_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <AdvancedAnalyticsSkeleton />
  }

export default function AdvancedAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - en producción esto vendría de tu API
  const [analyticsData, setAnalyticsData] = useState({
    performance: {
      responseTime: [
        { time: '00:00', value: 145 },
        { time: '04:00', value: 122 },
        { time: '08:00', value: 167 },
        { time: '12:00', value: 189 },
        { time: '16:00', value: 156 },
        { time: '20:00', value: 134 }
      ],
      throughput: [
        { time: '00:00', messages: 45, webhooks: 12 },
        { time: '04:00', messages: 23, webhooks: 8 },
        { time: '08:00', messages: 89, webhooks: 24 },
        { time: '12:00', messages: 156, webhooks: 43 },
        { time: '16:00', messages: 134, webhooks: 38 },
        { time: '20:00', messages: 78, webhooks: 19 }
      ],
      errors: [
        { time: '00:00', count: 2, type: 'connection' },
        { time: '04:00', count: 1, type: 'timeout' },
        { time: '08:00', count: 0, type: 'none' },
        { time: '12:00', count: 3, type: 'auth' },
        { time: '16:00', count: 1, type: 'rate_limit' },
        { time: '20:00', count: 0, type: 'none' }
      ],
      sessionHealth: [
        { status: 'Autenticada', count: 8 },
        { status: 'Conectada', count: 3 },
        { status: 'Conectando', count: 1 },
        { status: 'Desconectada', count: 2 }
      ]
    },
    realtime: {
      activeConnections: 12,
      messagesPerSecond: 24,
      webhooksPerSecond: 8,
      cpuUsage: 45,
      memoryUsage: 67,
      diskUsage: 34
    },
    trends: {
      weeklyMessages: [
        { name: 'Lun', messages: 234, webhooks: 45 },
        { name: 'Mar', messages: 156, webhooks: 32 },
        { name: 'Mié', messages: 298, webhooks: 67 },
        { name: 'Jue', messages: 445, webhooks: 89 },
        { name: 'Vie', messages: 567, webhooks: 123 },
        { name: 'Sáb', messages: 234, webhooks: 56 },
        { name: 'Dom', messages: 123, webhooks: 23 }
      ],
      hourlyDistribution: [
        { name: '0-3', count: 12 },
        { name: '4-7', count: 8 },
        { name: '8-11', count: 45 },
        { name: '12-15', count: 67 },
        { name: '16-19', count: 89 },
        { name: '20-23', count: 34 }
      ],
      sessionTypes: [
        { name: 'QR Code', count: 8 },
        { name: 'Pairing Code', count: 4 },
        { name: 'Manual', count: 2 }
      ]
    }
  })

  useEffect(() => {
    loadAdvancedAnalytics()
  }, [])

  const loadAdvancedAnalytics = async () => {
    setLoading(true)
    try {
      // Aquí cargarías datos reales de tu API
      // const [sessions, health, webhooks] = await Promise.all([
      //   sessionsAPI.list(),
      //   utilsAPI.getHealth(),
      //   webhooksAPI.getStats(userId)
      // ])
      
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Datos cargados",
        description: "Analytics avanzados actualizados",
      })
    } catch (error) {
      console.error('Error loading advanced analytics:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los analytics avanzados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAdvancedAnalytics()
    setRefreshing(false)
  }

  const exportAdvancedData = () => {
    const data = {
      exported_at: new Date().toISOString(),
      type: 'advanced_analytics',
      performance: analyticsData.performance,
      realtime: analyticsData.realtime,
      trends: analyticsData.trends
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `advanced_analytics_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <AdvancedAnalyticsSkeleton />
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Analytics Avanzados
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Análisis profundo del rendimiento y métricas del sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button variant="outline" onClick={exportAdvancedData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="realtime">Tiempo Real</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Throughput Total"
              value="1,234"
              change={15.2}
              changeLabel="vs mes anterior"
              icon={<Zap className="h-8 w-8" />}
              trend="up"
            />
            <MetricCard
              title="Tiempo Respuesta Promedio"
              value="156ms"
              change={-8.3}
              changeLabel="vs mes anterior"
              icon={<Activity className="h-8 w-8" />}
              trend="up"
            />
            <MetricCard
              title="Uptime del Sistema"
              value="99.97%"
              change={0.1}
              changeLabel="vs mes anterior"
              icon={<TrendingUp className="h-8 w-8" />}
              trend="up"
            />
            <MetricCard
              title="Sesiones Activas Pico"
              value="45"
              change={22.1}
              changeLabel="vs mes anterior"
              icon={<BarChart3 className="h-8 w-8" />}
              trend="up"
            />
          </div>

          {/* Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedChart
              data={analyticsData.trends.weeklyMessages}
              type="bar"
              title="Actividad Semanal"
              description="Mensajes y webhooks procesados en los últimos 7 días"
              height={300}
              dataKey="messages"
              xAxisKey="name"
              colors={['#3B82F6', '#10B981']}
            />
            
            <AdvancedChart
              data={analyticsData.trends.hourlyDistribution}
              type="area"
              title="Distribución por Franjas Horarias"
              description="Actividad agrupada por horarios del día"
              height={300}
              dataKey="count"
              xAxisKey="name"
              colors={['#8B5CF6']}
            />
          </div>

          {/* Session Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedChart
              data={analyticsData.trends.sessionTypes}
              type="pie"
              title="Tipos de Autenticación"
              description="Distribución de métodos de autenticación utilizados"
              height={300}
              dataKey="count"
              xAxisKey="name"
              colors={['#3B82F6', '#10B981', '#F59E0B']}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Rendimiento</CardTitle>
                <CardDescription>
                  Métricas clave del sistema en las últimas 24 horas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Pico de Conexiones</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Máximo simultáneo</p>
                    </div>
                    <Badge variant="outline" className="text-blue-700">45 conexiones</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Mensajes Procesados</p>
                      <p className="text-sm text-green-700 dark:text-green-300">Total en 24h</p>
                    </div>
                    <Badge variant="outline" className="text-green-700">2,347 mensajes</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100">Webhooks Enviados</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Total en 24h</p>
                    </div>
                    <Badge variant="outline" className="text-purple-700">456 webhooks</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-100">Tiempo Actividad Pico</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Mayor actividad</p>
                    </div>
                    <Badge variant="outline" className="text-orange-700">14:00 - 16:00</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMetrics data={analyticsData.performance} />
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <RealtimeStats stats={analyticsData.realtime} />
          
          {/* Real-time Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedChart
              data={analyticsData.performance.responseTime}
              type="line"
              title="Latencia en Tiempo Real"
              description="Tiempo de respuesta de la API en los últimos períodos"
              height={250}
              dataKey="value"
              xAxisKey="time"
              colors={['#EF4444']}
            />
            
            <AdvancedChart
              data={analyticsData.performance.throughput}
              type="bar"
              title="Throughput Actual"
              description="Mensajes y webhooks procesados por período"
              height={250}
              dataKey="messages"
              xAxisKey="time"
              colors={['#10B981']}
            />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Trend Analysis */}
          <div className="grid grid-cols-1 gap-6">
            <AdvancedChart
              data={analyticsData.trends.weeklyMessages}
              type="line"
              title="Tendencia de Mensajes - 7 Días"
              description="Evolución del volumen de mensajes procesados"
              height={350}
              dataKey="messages"
              xAxisKey="name"
              colors={['#3B82F6']}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedChart
                data={analyticsData.performance.errors}
                type="area"
                title="Tendencia de Errores"
                description="Evolución de errores en el sistema"
                height={300}
                dataKey="count"
                xAxisKey="time"
                colors={['#EF4444']}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Predicciones y Alertas</CardTitle>
                  <CardDescription>
                    Análisis predictivo basado en tendencias históricas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">
                          Predicción de Carga
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Se espera un aumento del 25% en el tráfico entre las 14:00-16:00
                      </p>
                    </div>
                    
                    <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          Optimización Sugerida
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Considerar aumentar los límites de rate limiting durante horas pico
                      </p>
                    </div>
                    
                    <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Sistema Estable
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        El rendimiento del sistema se mantiene dentro de parámetros normales
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}