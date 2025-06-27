'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ScrollText, 
  Search, 
  Download, 
  RefreshCw, 
  Filter,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Eye,
  Calendar,
  Clock,
  Smartphone,
  Zap,
  MessageSquare,
  Settings,
  Users,
  Activity
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface LogEntry {
  id: string
  timestamp: string
  level: 'error' | 'warning' | 'info' | 'success' | 'debug'
  category: 'system' | 'api' | 'webhook' | 'session' | 'message' | 'auth'
  message: string
  details?: any
  source?: string
  userId?: string
  sessionId?: string
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    level: 'info',
    category: 'session',
    message: 'Nueva sesión WhatsApp creada exitosamente',
    details: { sessionId: 'session_123', method: 'qr' },
    source: 'SessionController',
    userId: 'user_456'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    level: 'success',
    category: 'message',
    message: 'Mensaje enviado correctamente',
    details: { recipient: '+57300123456', messageType: 'text' },
    source: 'MessageService',
    sessionId: 'session_123'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    level: 'warning',
    category: 'webhook',
    message: 'Webhook timeout - reintentando entrega',
    details: { webhookUrl: 'https://ejemplo.com/webhook', attempt: 2 },
    source: 'WebhookService'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    level: 'error',
    category: 'api',
    message: 'Error de autenticación en API',
    details: { endpoint: '/sessions/create', error: 'Invalid token' },
    source: 'AuthMiddleware',
    userId: 'user_789'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1500000).toISOString(),
    level: 'info',
    category: 'system',
    message: 'Sistema iniciado correctamente',
    details: { version: '2.3.0', uptime: 0 },
    source: 'SystemBootstrap'
  }
]

const logLevels = [
  { value: 'all', label: 'Todos los niveles', color: 'default' },
  { value: 'error', label: 'Errores', color: 'destructive' },
  { value: 'warning', label: 'Advertencias', color: 'secondary' },
  { value: 'info', label: 'Información', color: 'outline' },
  { value: 'success', label: 'Éxito', color: 'default' },
  { value: 'debug', label: 'Debug', color: 'outline' }
]

const logCategories = [
  { value: 'all', label: 'Todas las categorías', icon: Activity },
  { value: 'system', label: 'Sistema', icon: Settings },
  { value: 'api', label: 'API', icon: Zap },
  { value: 'webhook', label: 'Webhooks', icon: Zap },
  { value: 'session', label: 'Sesiones', icon: Smartphone },
  { value: 'message', label: 'Mensajes', icon: MessageSquare },
  { value: 'auth', label: 'Autenticación', icon: Users }
]

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs)
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(mockLogs)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    filterLogs()
  }, [logs, searchQuery, selectedLevel, selectedCategory])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simular nuevos logs
        addRandomLog()
      }, 10000) // Cada 10 segundos

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const filterLogs = () => {
    let filtered = [...logs]

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrar por nivel
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel)
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory)
    }

    // Ordenar por timestamp (más recientes primero)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setFilteredLogs(filtered)
  }

  const addRandomLog = () => {
    const randomLogs = [
      {
        level: 'info' as const,
        category: 'system' as const,
        message: 'Verificación de salud del sistema completada',
        source: 'HealthChecker'
      },
      {
        level: 'success' as const,
        category: 'message' as const,
        message: 'Mensaje entregado exitosamente',
        source: 'MessageService'
      },
      {
        level: 'warning' as const,
        category: 'session' as const,
        message: 'Sesión desconectada inesperadamente',
        source: 'SessionManager'
      }
    ]

    const randomLog = randomLogs[Math.floor(Math.random() * randomLogs.length)]
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...randomLog,
      details: { generated: true }
    }

    setLogs(prev => [newLog, ...prev.slice(0, 99)]) // Mantener solo los últimos 100 logs
  }

  const refreshLogs = async () => {
    setLoading(true)
    try {
      // Simular carga de logs desde API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Agregar algunos logs nuevos
      for (let i = 0; i < 3; i++) {
        addRandomLog()
      }
      
      toast({
        title: "Logs actualizados",
        description: "Se han cargado los logs más recientes",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los logs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = () => {
    const logsToExport = {
      exported_at: new Date().toISOString(),
      filters: {
        search: searchQuery,
        level: selectedLevel,
        category: selectedCategory
      },
      logs: filteredLogs
    }

    const blob = new Blob([JSON.stringify(logsToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system_logs_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    setLogs([])
    toast({
      title: "Logs eliminados",
      description: "Todos los logs han sido eliminados",
    })
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <X className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      case 'debug':
        return <Eye className="h-4 w-4 text-gray-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive' as const
      case 'warning':
        return 'secondary' as const
      case 'success':
        return 'default' as const
      case 'info':
        return 'outline' as const
      case 'debug':
        return 'outline' as const
      default:
        return 'outline' as const
    }
  }

  const getCategoryIcon = (category: string) => {
    const categoryData = logCategories.find(c => c.value === category)
    return categoryData?.icon || Activity
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    }
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Logs del Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Monitorea la actividad, errores y eventos del sistema en tiempo real
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh
          </Button>
          
          <Button variant="outline" onClick={refreshLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button variant="outline" onClick={clearLogs}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nivel</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total de logs: {filteredLogs.length}</span>
            <span>•</span>
            <span>Errores: {filteredLogs.filter(l => l.level === 'error').length}</span>
            <span>•</span>
            <span>Advertencias: {filteredLogs.filter(l => l.level === 'warning').length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ScrollText className="h-5 w-5 mr-2" />
                Logs ({filteredLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <ScrollText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No se encontraron logs</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredLogs.map((log) => {
                    const { date, time } = formatTimestamp(log.timestamp)
                    const CategoryIcon = getCategoryIcon(log.category)
                    
                    return (
                      <div 
                        key={log.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedLog?.id === log.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 mt-0.5">
                            {getLevelIcon(log.level)}
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                                {log.level.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {log.category}
                              </Badge>
                              {log.source && (
                                <span className="text-xs text-muted-foreground">
                                  {log.source}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {log.message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Log Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Detalles del Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLog ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">ID</label>
                    <p className="text-sm text-muted-foreground font-mono">{selectedLog.id}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Timestamp</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Nivel</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getLevelIcon(selectedLog.level)}
                      <Badge variant={getLevelBadgeVariant(selectedLog.level)}>
                        {selectedLog.level.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Categoría</label>
                    <p className="text-sm text-muted-foreground capitalize">{selectedLog.category}</p>
                  </div>
                  
                  {selectedLog.source && (
                    <div>
                      <label className="text-sm font-medium">Fuente</label>
                      <p className="text-sm text-muted-foreground">{selectedLog.source}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium">Mensaje</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedLog.message}</p>
                  </div>
                  
                  {selectedLog.details && (
                    <div>
                      <label className="text-sm font-medium">Detalles</label>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedLog.userId && (
                    <div>
                      <label className="text-sm font-medium">Usuario ID</label>
                      <p className="text-sm text-muted-foreground font-mono">{selectedLog.userId}</p>
                    </div>
                  )}
                  
                  {selectedLog.sessionId && (
                    <div>
                      <label className="text-sm font-medium">Sesión ID</label>
                      <p className="text-sm text-muted-foreground font-mono">{selectedLog.sessionId}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Selecciona un log para ver los detalles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}