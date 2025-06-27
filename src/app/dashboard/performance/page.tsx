'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Monitor,
  Server,
  Database,
  Globe,
  Smartphone,
  MessageSquare,
  Users,
  Eye,
  Timer,
  Gauge,
  BarChart3
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface SystemMetrics {
  timestamp: string
  cpu: {
    usage: number
    cores: number
    processes: number
    loadAverage: number[]
  }
  memory: {
    total: number
    used: number
    free: number
    cached: number
    percentage: number
  }
  disk: {
    total: number
    used: number
    free: number
    percentage: number
    iops: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    packetsIn: number
    packetsOut: number
    connections: number
  }
}

interface APIMetrics {
  timestamp: string
  requests: {
    total: number
    successful: number
    failed: number
    rate: number
  }
  latency: {
    average: number
    p50: number
    p95: number
    p99: number
  }
  endpoints: {
    [endpoint: string]: {
      requests: number
      averageLatency: number
      errorRate: number
    }
  }
}

interface WhatsAppMetrics {
  timestamp: string
  sessions: {
    total: number
    connected: number
    authenticated: number
    disconnected: number
  }
  messages: {
    sent: number
    received: number
    failed: number
    queued: number
    rate: number
  }
  webhooks: {
    delivered: number
    failed: number
    pending: number
    averageLatency: number
  }
}

interface PerformanceAlert {
  id: string
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'api' | 'whatsapp'
  severity: 'info' | 'warning' | 'critical'
  message: string
  value: number
  threshold: number
  timestamp: string
  acknowledged: boolean
}

// Mock data generators
const generateSystemMetrics = (): SystemMetrics => ({
  timestamp: new Date().toISOString(),
  cpu: {
    usage: Math.random() * 100,
    cores: 8,
    processes: Math.floor(Math.random() * 200) + 100,
    loadAverage: [Math.random() * 4, Math.random() * 4, Math.random() * 4]
  },
  memory: {
    total: 16 * 1024 * 1024 * 1024,
    used: Math.floor(Math.random() * 12 * 1024 * 1024 * 1024) + 2 * 1024 * 1024 * 1024,
    free: 0,
    cached: Math.floor(Math.random() * 2 * 1024 * 1024 * 1024),
    percentage: Math.random() * 80 + 10
  },
  disk: {
    total: 500 * 1024 * 1024 * 1024,
    used: Math.floor(Math.random() * 400 * 1024 * 1024 * 1024) + 50 * 1024 * 1024 * 1024,
    free: 0,
    percentage: Math.random() * 70 + 15,
    iops: Math.floor(Math.random() * 1000) + 100
  },
  network: {
    bytesIn: Math.floor(Math.random() * 1024 * 1024) + 1024,
    bytesOut: Math.floor(Math.random() * 1024 * 1024) + 1024,
    packetsIn: Math.floor(Math.random() * 1000) + 100,
    packetsOut: Math.floor(Math.random() * 1000) + 100,
    connections: Math.floor(Math.random() * 100) + 20
  }
})

const generateAPIMetrics = (): APIMetrics => ({
  timestamp: new Date().toISOString(),
  requests: {
    total: Math.floor(Math.random() * 1000) + 500,
    successful: Math.floor(Math.random() * 950) + 450,
    failed: Math.floor(Math.random() * 50) + 5,
    rate: Math.random() * 100 + 20
  },
  latency: {
    average: Math.random() * 500 + 50,
    p50: Math.random() * 300 + 30,
    p95: Math.random() * 1000 + 200,
    p99: Math.random() * 2000 + 500
  },
  endpoints: {
    '/sessions/add': {
      requests: Math.floor(Math.random() * 100) + 20,
      averageLatency: Math.random() * 800 + 100,
      errorRate: Math.random() * 5
    },
    '/chats/send': {
      requests: Math.floor(Math.random() * 500) + 100,
      averageLatency: Math.random() * 300 + 50,
      errorRate: Math.random() * 2
    },
    '/sessions/list': {
      requests: Math.floor(Math.random() * 200) + 50,
      averageLatency: Math.random() * 200 + 20,
      errorRate: Math.random() * 1
    }
  }
})

const generateWhatsAppMetrics = (): WhatsAppMetrics => ({
  timestamp: new Date().toISOString(),
  sessions: {
    total: Math.floor(Math.random() * 20) + 5,
    connected: Math.floor(Math.random() * 15) + 3,
    authenticated: Math.floor(Math.random() * 12) + 2,
    disconnected: Math.floor(Math.random() * 5)
  },
  messages: {
    sent: Math.floor(Math.random() * 1000) + 200,
    received: Math.floor(Math.random() * 800) + 150,
    failed: Math.floor(Math.random() * 20) + 2,
    queued: Math.floor(Math.random() * 50) + 5,
    rate: Math.random() * 50 + 10
  },
  webhooks: {
    delivered: Math.floor(Math.random() * 500) + 100,
    failed: Math.floor(Math.random() * 20) + 2,
    pending: Math.floor(Math.random() * 10) + 1,
    averageLatency: Math.random() * 1000 + 200
  }
})

// Simple Chart Component
const SimpleLineChart = ({ data, dataKeys, colors, height = 200 }: {
  data: any[]
  dataKeys: string[]
  colors: string[]
  height?: number
}) => {
  if (!data.length) return <div>No data</div>

  const maxValues = dataKeys.map(key => 
    Math.max(...data.map(d => d[key] || 0))
  )

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        {dataKeys.map((key, keyIndex) => {
          const maxValue = maxValues[keyIndex]
          const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100
            const y = 100 - ((d[key] || 0) / maxValue) * 80
            return `${x},${y}`
          }).join(' ')

          return (
            <polyline
              key={key}
              fill="none"
              stroke={colors[keyIndex]}
              strokeWidth="2"
              points={points}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
        <span>{new Date(data[0]?.timestamp).toLocaleTimeString()}</span>
        <span>{new Date(data[data.length - 1]?.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  )
}

const SimpleBarChart = ({ data, dataKey, color, height = 200 }: {
  data: any[]
  dataKey: string
  color: string
  height?: number
}) => {
  if (!data.length) return <div>No data</div>

  const maxValue = Math.max(...data.map(d => d[dataKey] || 0))

  return (
    <div className="flex items-end justify-between h-48 px-2">
      {data.slice(-10).map((d, i) => {
        const height = ((d[dataKey] || 0) / maxValue) * 180
        return (
          <div key={i} className="flex flex-col items-center">
            <div 
              className="w-6 rounded-t"
              style={{ 
                height: `${height}px`,
                backgroundColor: color,
                minHeight: '2px'
              }}
            />
            <span className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
              {new Date(d.timestamp).toLocaleTimeString().slice(0, 5)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function PerformancePage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([])
  const [apiMetrics, setAPIMetrics] = useState<APIMetrics[]>([])
  const [whatsappMetrics, setWhatsappMetrics] = useState<WhatsAppMetrics[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(true)

  const generateAlerts = useCallback((system: SystemMetrics, api: APIMetrics, whatsapp: WhatsAppMetrics) => {
    const newAlerts: PerformanceAlert[] = []

    if (system.cpu.usage > 80) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: 'cpu',
        severity: system.cpu.usage > 95 ? 'critical' : 'warning',
        message: `Alto uso de CPU: ${system.cpu.usage.toFixed(1)}%`,
        value: system.cpu.usage,
        threshold: 80,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }

    if (system.memory.percentage > 85) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'memory',
        severity: system.memory.percentage > 95 ? 'critical' : 'warning',
        message: `Alto uso de memoria: ${system.memory.percentage.toFixed(1)}%`,
        value: system.memory.percentage,
        threshold: 85,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }

    const errorRate = (api.requests.failed / api.requests.total) * 100
    if (errorRate > 5) {
      newAlerts.push({
        id: `api-error-${Date.now()}`,
        type: 'api',
        severity: errorRate > 10 ? 'critical' : 'warning',
        message: `Alta tasa de errores en API: ${errorRate.toFixed(1)}%`,
        value: errorRate,
        threshold: 5,
        timestamp: new Date().toISOString(),
        acknowledged: false
      })
    }

    return newAlerts
  }, [])

  useEffect(() => {
    const loadInitialData = () => {
      const initialSystem = Array.from({ length: 20 }, (_, i) => {
        const metrics = generateSystemMetrics()
        metrics.timestamp = new Date(Date.now() - (19 - i) * 60000).toISOString()
        return metrics
      })
      
      const initialAPI = Array.from({ length: 20 }, (_, i) => {
        const metrics = generateAPIMetrics()
        metrics.timestamp = new Date(Date.now() - (19 - i) * 60000).toISOString()
        return metrics
      })
      
      const initialWhatsApp = Array.from({ length: 20 }, (_, i) => {
        const metrics = generateWhatsAppMetrics()
        metrics.timestamp = new Date(Date.now() - (19 - i) * 60000).toISOString()
        return metrics
      })

      setSystemMetrics(initialSystem)
      setAPIMetrics(initialAPI)
      setWhatsappMetrics(initialWhatsApp)
      setLoading(false)

      const latestAlerts = generateAlerts(
        initialSystem[initialSystem.length - 1],
        initialAPI[initialAPI.length - 1],
        initialWhatsApp[initialWhatsApp.length - 1]
      )
      setAlerts(latestAlerts)
    }

    loadInitialData()
  }, [generateAlerts])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      const newSystem = generateSystemMetrics()
      const newAPI = generateAPIMetrics()
      const newWhatsApp = generateWhatsAppMetrics()

      setSystemMetrics(prev => [...prev.slice(-19), newSystem])
      setAPIMetrics(prev => [...prev.slice(-19), newAPI])
      setWhatsappMetrics(prev => [...prev.slice(-19), newWhatsApp])

      const newAlerts = generateAlerts(newSystem, newAPI, newWhatsApp)
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev.slice(0, 19)])
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, generateAlerts])

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
    }
  }

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const currentSystem = systemMetrics[systemMetrics.length - 1]
  const currentAPI = apiMetrics[apiMetrics.length - 1]
  const currentWhatsApp = whatsappMetrics[whatsappMetrics.length - 1]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando métricas de rendimiento...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            Performance Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Monitoreo en tiempo real del rendimiento del sistema, API y WhatsApp
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hora</SelectItem>
              <SelectItem value="6h">6 Horas</SelectItem>
              <SelectItem value="24h">24 Horas</SelectItem>
              <SelectItem value="7d">7 Días</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                <p className="text-2xl font-bold">{currentSystem?.cpu.usage.toFixed(1)}%</p>
                <Progress value={currentSystem?.cpu.usage} className="mt-2" />
              </div>
              <Cpu className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Memory</p>
                <p className="text-2xl font-bold">{currentSystem?.memory.percentage.toFixed(1)}%</p>
                <Progress value={currentSystem?.memory.percentage} className="mt-2" />
              </div>
              <MemoryStick className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Latency</p>
                <p className="text-2xl font-bold">{currentAPI?.latency.average.toFixed(0)}ms</p>
                <div className="flex items-center mt-2">
                  {currentAPI?.latency.average > 1000 ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                  <span className="text-sm text-muted-foreground ml-1">
                    P95: {currentAPI?.latency.p95.toFixed(0)}ms
                  </span>
                </div>
              </div>
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">WhatsApp Sessions</p>
                <p className="text-2xl font-bold">{currentWhatsApp?.sessions.authenticated}/{currentWhatsApp?.sessions.total}</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground ml-1">
                    {currentWhatsApp?.sessions.connected} conectadas
                  </span>
                </div>
              </div>
              <Smartphone className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Alertas Activas ({alerts.filter(a => !a.acknowledged).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(a => !a.acknowledged).slice(0, 3).map((alert) => (
                <div key={alert.id} className={`p-3 border rounded-lg ${getAlertColor(alert.severity)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.severity)}
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {alert.type.toUpperCase()}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Confirmar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU y Memoria</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={systemMetrics} 
                  dataKeys={['cpu.usage', 'memory.percentage']}
                  colors={['#3b82f6', '#10b981']}
                />
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>CPU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Memoria</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Procesos del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={systemMetrics} 
                  dataKey="cpu.processes" 
                  color="#fbbf24"
                />
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Procesos activos:</span>
                    <span className="font-medium ml-2">{currentSystem?.cpu.processes}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conexiones:</span>
                    <span className="font-medium ml-2">{currentSystem?.network.connections}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso de Disco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Usado</span>
                      <span>{currentSystem?.disk.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={currentSystem?.disk.percentage} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium ml-2">{formatBytes(currentSystem?.disk.total || 0)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IOPS:</span>
                      <span className="font-medium ml-2">{currentSystem?.disk.iops}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Red</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Entrada</div>
                      <div className="text-lg font-medium text-blue-600">
                        {formatBytes(currentSystem?.network.bytesIn || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Salida</div>
                      <div className="text-lg font-medium text-green-600">
                        {formatBytes(currentSystem?.network.bytesOut || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Paquetes IN:</span>
                      <span className="font-medium ml-2">{formatNumber(currentSystem?.network.packetsIn || 0)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Paquetes OUT:</span>
                      <span className="font-medium ml-2">{formatNumber(currentSystem?.network.packetsOut || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Requests por Minuto</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={apiMetrics} 
                  dataKeys={['requests.successful', 'requests.failed']}
                  colors={['#10b981', '#ef4444']}
                />
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Exitosos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Fallidos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latencia de API</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={apiMetrics} 
                  dataKeys={['latency.average', 'latency.p95']}
                  colors={['#3b82f6', '#f59e0b']}
                />
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Promedio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>P95</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endpoints más Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                {currentAPI && (
                  <div className="space-y-4">
                    {Object.entries(currentAPI.endpoints)
                      .sort(([,a], [,b]) => b.requests - a.requests)
                      .map(([endpoint, metrics]) => (
                        <div key={endpoint} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{endpoint}</span>
                            <Badge variant="outline">{metrics.requests} req</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <span>Latencia: {metrics.averageLatency.toFixed(0)}ms</span>
                            <span>Error: {metrics.errorRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={metrics.errorRate * 10} className="h-2" />
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasa de Éxito</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Exitosos</span>
                      <span>{currentAPI?.requests.successful}</span>
                    </div>
                    <Progress value={((currentAPI?.requests.successful || 0) / (currentAPI?.requests.total || 1)) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Fallidos</span>
                      <span>{currentAPI?.requests.failed}</span>
                    </div>
                    <Progress 
                      value={((currentAPI?.requests.failed || 0) / (currentAPI?.requests.total || 1)) * 100} 
                      className="[&>div]:bg-red-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Sesiones</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={whatsappMetrics} 
                  dataKeys={['sessions.authenticated', 'sessions.connected', 'sessions.disconnected']}
                  colors={['#10b981', '#3b82f6', '#ef4444']}
                />
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Autenticadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Conectadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Desconectadas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flujo de Mensajes</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart 
                  data={whatsappMetrics} 
                  dataKeys={['messages.sent', 'messages.received', 'messages.failed']}
                  colors={['#10b981', '#3b82f6', '#ef4444']}
                />
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Enviados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Recibidos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Fallidos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance de Webhooks</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={whatsappMetrics} 
                  dataKey="webhooks.delivered" 
                  color="#10b981"
                />
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entregados:</span>
                    <span className="font-medium ml-2 text-green-600">{currentWhatsApp?.webhooks.delivered}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fallidos:</span>
                    <span className="font-medium ml-2 text-red-600">{currentWhatsApp?.webhooks.failed}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pendientes:</span>
                    <span className="font-medium ml-2 text-yellow-600">{currentWhatsApp?.webhooks.pending}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Sesiones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Autenticadas</span>
                      <span>{currentWhatsApp?.sessions.authenticated}</span>
                    </div>
                    <Progress value={((currentWhatsApp?.sessions.authenticated || 0) / (currentWhatsApp?.sessions.total || 1)) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Conectadas</span>
                      <span>{currentWhatsApp?.sessions.connected}</span>
                    </div>
                    <Progress 
                      value={((currentWhatsApp?.sessions.connected || 0) / (currentWhatsApp?.sessions.total || 1)) * 100}
                      className="[&>div]:bg-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Desconectadas</span>
                      <span>{currentWhatsApp?.sessions.disconnected}</span>
                    </div>
                    <Progress 
                      value={((currentWhatsApp?.sessions.disconnected || 0) / (currentWhatsApp?.sessions.total || 1)) * 100}
                      className="[&>div]:bg-red-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
