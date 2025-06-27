'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  MessageSquare, 
  Users, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3
} from 'lucide-react'

interface AdvancedChartProps {
  data: any[]
  type: 'line' | 'bar' | 'area' | 'pie'
  title: string
  description?: string
  height?: number
  dataKey: string
  xAxisKey?: string
  colors?: string[]
}

const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
]

export function AdvancedChart({ 
  data, 
  type, 
  title, 
  description, 
  height = 300, 
  dataKey, 
  xAxisKey = 'name',
  colors = CHART_COLORS 
}: AdvancedChartProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={xAxisKey} 
              className="text-xs" 
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={colors[0]} 
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
            />
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={xAxisKey} 
              className="text-xs" 
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar 
              dataKey={dataKey} 
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={xAxisKey} 
              className="text-xs" 
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={colors[0]} 
              fill={colors[0]}
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </AreaChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={height / 3}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  trend = 'neutral',
  className = '' 
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center space-x-1">
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-sm text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PerformanceMetricsProps {
  data: {
    responseTime: { time: string; value: number }[]
    throughput: { time: string; messages: number; webhooks: number }[]
    errors: { time: string; count: number; type: string }[]
    sessionHealth: { status: string; count: number }[]
  }
}

export function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  const [activeTab, setActiveTab] = useState('response-time')

  const averageResponseTime = data.responseTime.length > 0 
    ? Math.round(data.responseTime.reduce((sum, item) => sum + item.value, 0) / data.responseTime.length)
    : 0

  const totalMessages = data.throughput.reduce((sum, item) => sum + item.messages, 0)
  const totalErrors = data.errors.reduce((sum, item) => sum + item.count, 0)
  const errorRate = totalMessages > 0 ? ((totalErrors / totalMessages) * 100).toFixed(2) : '0.00'

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tiempo de Respuesta Promedio"
          value={`${averageResponseTime}ms`}
          change={-5.2}
          changeLabel="vs semana anterior"
          icon={<Clock className="h-8 w-8" />}
          trend="up"
        />
        <MetricCard
          title="Mensajes Procesados"
          value={totalMessages.toLocaleString()}
          change={12.3}
          changeLabel="vs semana anterior"
          icon={<MessageSquare className="h-8 w-8" />}
          trend="up"
        />
        <MetricCard
          title="Tasa de Error"
          value={`${errorRate}%`}
          change={-2.1}
          changeLabel="vs semana anterior"
          icon={<AlertTriangle className="h-8 w-8" />}
          trend="up"
        />
        <MetricCard
          title="Disponibilidad"
          value="99.8%"
          change={0.2}
          changeLabel="vs semana anterior"
          icon={<CheckCircle className="h-8 w-8" />}
          trend="up"
        />
      </div>

      {/* Performance Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Métricas de Rendimiento Detalladas
          </CardTitle>
          <CardDescription>
            Análisis temporal del rendimiento del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="response-time">Tiempo de Respuesta</TabsTrigger>
              <TabsTrigger value="throughput">Throughput</TabsTrigger>
              <TabsTrigger value="errors">Errores</TabsTrigger>
              <TabsTrigger value="health">Estado de Sesiones</TabsTrigger>
            </TabsList>

            <TabsContent value="response-time" className="space-y-4">
              <AdvancedChart
                data={data.responseTime}
                type="line"
                title="Tiempo de Respuesta (ms)"
                description="Tiempo promedio de respuesta en los últimos períodos"
                height={300}
                dataKey="value"
                xAxisKey="time"
                colors={['#3B82F6']}
              />
            </TabsContent>

            <TabsContent value="throughput" className="space-y-4">
              <AdvancedChart
                data={data.throughput}
                type="bar"
                title="Throughput del Sistema"
                description="Mensajes y webhooks procesados por período"
                height={300}
                dataKey="messages"
                xAxisKey="time"
                colors={['#10B981', '#F59E0B']}
              />
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              <AdvancedChart
                data={data.errors}
                type="area"
                title="Errores del Sistema"
                description="Cantidad de errores registrados por período"
                height={300}
                dataKey="count"
                xAxisKey="time"
                colors={['#EF4444']}
              />
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <AdvancedChart
                data={data.sessionHealth}
                type="pie"
                title="Estado de Sesiones"
                description="Distribución del estado actual de las sesiones"
                height={300}
                dataKey="count"
                xAxisKey="status"
                colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444']}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface RealtimeStatsProps {
  stats: {
    activeConnections: number
    messagesPerSecond: number
    webhooksPerSecond: number
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
  }
}

export function RealtimeStats({ stats }: RealtimeStatsProps) {
  const [isLive, setIsLive] = useState(true)

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600'
    if (usage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getUsageBg = (usage: number) => {
    if (usage >= 90) return 'bg-red-600'
    if (usage >= 70) return 'bg-yellow-600'
    return 'bg-green-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Estadísticas en Tiempo Real
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-muted-foreground">
              {isLive ? 'En vivo' : 'Pausado'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? 'Pausar' : 'Reanudar'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Connection Stats */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">CONEXIONES</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Conexiones Activas</span>
                <Badge variant="outline" className="font-mono">
                  {stats.activeConnections}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Mensajes/seg</span>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-mono text-sm">{stats.messagesPerSecond}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Webhooks/seg</span>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="font-mono text-sm">{stats.webhooksPerSecond}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">RECURSOS</h4>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CPU</span>
                  <span className={`text-sm font-mono ${getUsageColor(stats.cpuUsage)}`}>
                    {stats.cpuUsage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageBg(stats.cpuUsage)}`}
                    style={{ width: `${stats.cpuUsage}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memoria</span>
                  <span className={`text-sm font-mono ${getUsageColor(stats.memoryUsage)}`}>
                    {stats.memoryUsage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageBg(stats.memoryUsage)}`}
                    style={{ width: `${stats.memoryUsage}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Disco</span>
                  <span className={`text-sm font-mono ${getUsageColor(stats.diskUsage)}`}>
                    {stats.diskUsage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageBg(stats.diskUsage)}`}
                    style={{ width: `${stats.diskUsage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">ESTADO</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">API Disponible</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Webhooks Activos</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Base de Datos</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {stats.activeConnections > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm">Sesiones WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}