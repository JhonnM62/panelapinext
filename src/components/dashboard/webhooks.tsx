'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Webhook, 
  Bell, 
  Settings, 
  Send, 
  RefreshCw, 
  Check, 
  X, 
  ExternalLink, 
  Copy, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Code,
  Play,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload,
  Zap,
  Users,
  MessageSquare,
  Smartphone,
  Lock,
  CreditCard
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { sessionsAPI, authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

interface NotificationItem {
  id: string
  sessionId: string
  eventType: string
  eventData: any
  timestamp: string
  read: boolean
  source: 'whatsapp' | 'external'
  webhookId?: string
}

interface WebhookConfig {
  userId: string
  sessionId: string
  webhookId: string
  webhookUrl: string
  clientWebhookUrl?: string
  events: string[]
  active: boolean
  createdAt: string
  updatedAt?: string
  deliverySettings?: {
    retryAttempts: number
    retryDelay: number
    timeout: number
  }
}

interface WebhookStats {
  totalNotifications: number
  unreadNotifications: number
  webhookActive: boolean
  lastNotification: string | null
  connectedClients: number
}

interface SessionOption {
  id: string
  status: string
  authenticated: boolean
}

export default function WebhooksComponent() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null)
  const [sessions, setSessions] = useState<SessionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [testing, setTesting] = useState(false)
  
  // WebSocket connection
  const [wsConnected, setWsConnected] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Webhook configuration
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [clientWebhookUrl, setClientWebhookUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['ALL'])
  const [webhookActive, setWebhookActive] = useState(true)
  
  // Test webhook
  const [testPayload, setTestPayload] = useState('')
  const [testResult, setTestResult] = useState<any>(null)

  // Available events from Baileys API
  const availableEvents = [
    'ALL',
    'MESSAGES_UPSERT',
    'MESSAGES_DELETE', 
    'MESSAGES_UPDATE',
    'MESSAGES_RECEIPT_UPDATE',
    'MESSAGES_REACTION',
    'CONNECTION_UPDATE',
    'CHATS_SET',
    'CHATS_UPSERT',
    'CHATS_DELETE',
    'CHATS_UPDATE',
    'CONTACTS_SET',
    'CONTACTS_UPSERT',
    'CONTACTS_UPDATE',
    'GROUPS_UPSERT',
    'GROUPS_UPDATE',
    'GROUP_PARTICIPANTS_UPDATE',
    'PRESENCE_UPDATE'
  ]

  useEffect(() => {
    if (!user) return
    
    loadInitialData()
    connectWebSocket()
    
    return () => {
      cleanup()
    }
  }, [user])

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setWs(null)
    setWsConnected(false)
  }

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadSessions(),
        loadWebhookData()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    console.log('🚀 [WEBHOOK SESSIONS] Cargando sesiones...')
    try {
      const response = await sessionsAPI.list()
      console.log('🚀 [WEBHOOK SESSIONS] Response from sessionsAPI.list():', response)
      
      if (response.success && response.data) {
        console.log('🚀 [WEBHOOK SESSIONS] Sessions data:', response.data)
        
        // Convert session IDs to session objects with status
        const sessionPromises = response.data.map(async (sessionId: string) => {
          try {
            console.log('🚀 [WEBHOOK SESSIONS] Obteniendo status para sesión:', sessionId)
            const statusResponse = await sessionsAPI.status(sessionId)
            console.log(`🚀 [WEBHOOK SESSIONS] Status response para ${sessionId}:`, statusResponse)
            
            return {
              id: sessionId,
              status: statusResponse.success ? statusResponse.data.status : 'unknown',
              authenticated: statusResponse.success ? statusResponse.data.authenticated || false : false
            }
          } catch (error) {
            console.error(`🚀 [WEBHOOK SESSIONS] Error obteniendo status para ${sessionId}:`, error)
            return {
              id: sessionId,
              status: 'error',
              authenticated: false
            }
          }
        })
        
        const sessionsWithStatus = await Promise.all(sessionPromises)
        console.log('🚀 [WEBHOOK SESSIONS] Sessions con status:', sessionsWithStatus)
        setSessions(sessionsWithStatus)
        
        // Auto-select first authenticated session
        const firstAuthenticated = sessionsWithStatus.find(s => s.authenticated)
        console.log('🚀 [WEBHOOK SESSIONS] Primera sesión autenticada:', firstAuthenticated)
        
        if (firstAuthenticated && !selectedSessionId) {
          console.log('🚀 [WEBHOOK SESSIONS] Auto-seleccionando sesión:', firstAuthenticated.id)
          setSelectedSessionId(firstAuthenticated.id)
        }
      } else {
        console.warn('🚀 [WEBHOOK SESSIONS] No se encontraron sesiones en la respuesta')
        setSessions([])
      }
    } catch (error) {
      console.error('🚀 [WEBHOOK SESSIONS] Error loading sessions:', error)
      setSessions([])
    }
  }

  const loadWebhookData = async () => {
    if (!user?.token && !user?.nombrebot) return
    
    try {
      // **MEJORA: Intentar usar el nuevo endpoint de dashboard primero**
      if (user?.token) {
        try {
          console.log('🔍 [WEBHOOKS] Usando endpoint dashboard mejorado...')
          const dashboardResponse = await authAPI.getDashboardData(user.token)
          
          if (dashboardResponse.success && dashboardResponse.data) {
            const data = dashboardResponse.data
            
            // Crear estadísticas de webhook desde datos del dashboard
            const sesiones = data.sesiones || []
            const webhooksActivos = sesiones.filter((s: any) => s.webhook?.activo).length
            const sesionesConectadas = data.estadisticas?.sesionesActivas || 0
            
            setWebhookStats({
              totalNotifications: data.estadisticas?.mensajesRecientes || 0,
              unreadNotifications: 0, // Se calcula después
              webhookActive: webhooksActivos > 0,
              lastNotification: null, // Se obtiene después
              connectedClients: sesionesConectadas,
              webhooksConfigurados: webhooksActivos,
              totalSesiones: sesiones.length
            })
            
            console.log('🔍 [WEBHOOKS] Datos del dashboard cargados exitosamente')
          }
        } catch (dashboardError) {
          console.warn('🔍 [WEBHOOKS] Fallback: dashboard endpoint no disponible', dashboardError)
        }
      }
      
      // **Fallback: Usar endpoints originales**
      const userId = user?.nombrebot || user?.email || user?.id
      if (!userId) {
        console.warn('🔍 [WEBHOOKS] No se pudo determinar userId para webhooks')
        return
      }
      
      // Load webhook stats
      try {
        const statsResponse = await fetch(`http://100.42.185.2:8015/webhook/stats/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (statsResponse.ok) {
          const statsResult = await statsResponse.json()
          if (statsResult.success && statsResult.data) {
            // Combinar con datos existentes o usar como fallback
            setWebhookStats(prev => prev ? {
              ...prev,
              ...statsResult.data
            } : statsResult.data)
            console.log('🔍 [WEBHOOKS] Stats originales cargadas')
          }
        }
      } catch (statsError) {
        console.warn('🔍 [WEBHOOKS] Error cargando stats:', statsError)
      }
      
      // Load notifications
      try {
        const notificationsResponse = await fetch(
          `http://100.42.185.2:8015/webhook/notifications/${userId}?limit=50&offset=0`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (notificationsResponse.ok) {
          const notificationsResult = await notificationsResponse.json()
          if (notificationsResult.success && notificationsResult.data) {
            setNotifications(notificationsResult.data)
            console.log('🔍 [WEBHOOKS] Notificaciones cargadas')
          }
        }
      } catch (notificationsError) {
        console.warn('🔍 [WEBHOOKS] Error cargando notificaciones:', notificationsError)
      }
      
    } catch (error) {
      console.error('🔍 [WEBHOOKS] Error general loading webhook data:', error)
    }
  }

  const connectWebSocket = () => {
    if (!user?.nombrebot) return
    
    try {
      cleanup() // Clean any existing connection
      
      const wsUrl = 'ws://100.42.185.2:8015/ws'
      console.log('[WEBHOOK WS] Connecting to:', wsUrl)
      
      const newWs = new WebSocket(wsUrl)
      wsRef.current = newWs
      
      newWs.onopen = () => {
        console.log('[WEBHOOK WS] Connected')
        setWsConnected(true)
        setWs(newWs)
        
        // Authenticate
        newWs.send(JSON.stringify({
          type: 'authenticate',
          userId: user.nombrebot
        }))
      }
      
      newWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('[WEBHOOK WS] Message received:', message.type)
          
          switch (message.type) {
            case 'authenticated':
              console.log('[WEBHOOK WS] Authenticated successfully')
              if (message.stats) {
                setWebhookStats(message.stats)
              }
              break
              
            case 'notification':
              console.log('[WEBHOOK WS] New notification received')
              handleNewNotification(message.data)
              break
              
            case 'notifications':
              console.log('[WEBHOOK WS] Bulk notifications received')
              setNotifications(message.data)
              break
              
            case 'notificationMarkedAsRead':
              console.log('[WEBHOOK WS] Notification marked as read')
              setNotifications(prev =>
                prev.map(n => n.id === message.notificationId ? { ...n, read: true } : n)
              )
              break
              
            case 'error':
              console.error('[WEBHOOK WS] Error:', message.message)
              break
              
            default:
              console.log('[WEBHOOK WS] Unknown message type:', message.type)
          }
        } catch (error) {
          console.error('[WEBHOOK WS] Error processing message:', error)
        }
      }
      
      newWs.onclose = (event) => {
        console.log('[WEBHOOK WS] Connection closed:', event.code, event.reason)
        setWsConnected(false)
        setWs(null)
        wsRef.current = null
        
        // Auto-reconnect after 5 seconds if not manually closed
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000)
        }
      }
      
      newWs.onerror = (error) => {
        console.error('[WEBHOOK WS] Error:', error)
        setWsConnected(false)
      }
      
    } catch (error) {
      console.error('[WEBHOOK WS] Connection error:', error)
      setWsConnected(false)
    }
  }

  const handleNewNotification = (notification: NotificationItem) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)])
    
    // Update stats
    setWebhookStats(prev => prev ? {
      ...prev,
      totalNotifications: prev.totalNotifications + 1,
      unreadNotifications: prev.unreadNotifications + 1,
      lastNotification: notification.timestamp
    } : null)
    
    // Show toast for new notifications
    toast({
      title: "Nueva Notificación",
      description: `Evento: ${notification.eventType}`,
    })
  }

  const createWebhook = async () => {
    console.log('🚀 [WEBHOOK CREATE] Iniciando creación de webhook...')
    console.log('🚀 [WEBHOOK CREATE] User:', user)
    console.log('🚀 [WEBHOOK CREATE] User nombrebot:', user?.nombrebot)
    console.log('🚀 [WEBHOOK CREATE] Selected session:', selectedSessionId)
    console.log('🚀 [WEBHOOK CREATE] Selected events:', selectedEvents)
    console.log('🚀 [WEBHOOK CREATE] Client webhook URL:', clientWebhookUrl)
    console.log('🚀 [WEBHOOK CREATE] Membership expired:', user?.membershipExpired)
    
    // Check membership
    if (user?.membershipExpired) {
      console.log('🚀 [WEBHOOK CREATE] Error: Membresía expirada')
      toast({
        title: "🔒 Funcionalidad Restringida",
        description: "No puedes crear webhooks con membresía expirada. Actualiza tu plan.",
        variant: "destructive",
        action: (
          <Button 
            size="sm" 
            onClick={() => router.push('/dashboard/upgrade')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Actualizar Plan
          </Button>
        )
      })
      return
    }

    if (!selectedSessionId) {
      console.log('🚀 [WEBHOOK CREATE] Error: No hay sesión seleccionada')
      toast({
        title: "Error",
        description: "Debes seleccionar una sesión activa",
        variant: "destructive",
      })
      return
    }

    if (!user?.nombrebot) {
      console.log('🚀 [WEBHOOK CREATE] Error: No hay nombrebot en user')
      console.log('🚀 [WEBHOOK CREATE] User object keys:', Object.keys(user || {}))
      toast({
        title: "Error",
        description: "No se pudo obtener el usuario actual",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      const requestBody = {
        userId: user.nombrebot,
        sessionId: selectedSessionId,
        events: selectedEvents,
        webhookUrl: clientWebhookUrl || null
      }
      
      console.log('🚀 [WEBHOOK CREATE] Request body:', JSON.stringify(requestBody, null, 2))
      
      const url = 'http://100.42.185.2:8015/webhook/create'
      console.log('🚀 [WEBHOOK CREATE] Enviando POST a:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('🚀 [WEBHOOK CREATE] Response status:', response.status)
      console.log('🚀 [WEBHOOK CREATE] Response ok:', response.ok)
      console.log('🚀 [WEBHOOK CREATE] Response headers:', Object.fromEntries(response.headers.entries()))
      
      const result = await response.json()
      console.log('🚀 [WEBHOOK CREATE] Response body:', JSON.stringify(result, null, 2))
      
      if (result.success && result.data) {
        console.log('🚀 [WEBHOOK CREATE] Éxito - configurando webhook...')
        setWebhookConfig({
          userId: result.data.userId,
          sessionId: result.data.sessionId,
          webhookId: result.data.webhookId,
          webhookUrl: result.data.webhookUrl,
          clientWebhookUrl: result.data.clientWebhookUrl,
          events: result.data.events,
          active: result.data.active,
          createdAt: result.data.createdAt,
          deliverySettings: result.data.deliverySettings
        })
        
        toast({
          title: "✅ Webhook Creado",
          description: "Webhook configurado exitosamente",
        })
        
        setActiveTab('config')
        await loadWebhookData()
        console.log('🚀 [WEBHOOK CREATE] Proceso completado exitosamente')
      } else {
        console.error('🚀 [WEBHOOK CREATE] Error en respuesta del servidor:')
        console.error('🚀 [WEBHOOK CREATE] Result success:', result.success)
        console.error('🚀 [WEBHOOK CREATE] Result message:', result.message)
        console.error('🚀 [WEBHOOK CREATE] Full result:', result)
        throw new Error(result.message || 'Error desconocido del servidor')
      }
    } catch (error: any) {
      console.error('🚀 [WEBHOOK CREATE] Error capturado:', error)
      console.error('🚀 [WEBHOOK CREATE] Error type:', typeof error)
      console.error('🚀 [WEBHOOK CREATE] Error name:', error.name)
      console.error('🚀 [WEBHOOK CREATE] Error message:', error.message)
      console.error('🚀 [WEBHOOK CREATE] Error stack:', error.stack)
      
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo crear el webhook",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
      console.log('🚀 [WEBHOOK CREATE] Proceso finalizado')
    }
  }

  const testWebhook = async () => {
    if (!webhookConfig?.webhookId) {
      toast({
        title: "Error",
        description: "No hay webhook configurado para probar",
        variant: "destructive",
      })
      return
    }

    let payload
    try {
      payload = testPayload ? JSON.parse(testPayload) : {
        type: 'test_notification',
        data: {
          message: 'Webhook de prueba desde el panel de control',
          timestamp: new Date().toISOString(),
          source: 'dashboard',
          testId: crypto.randomUUID()
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "JSON inválido en el payload de prueba",
        variant: "destructive",
      })
      return
    }

    setTesting(true)
    try {
      console.log('[WEBHOOK TEST] Sending to:', `http://100.42.185.2:8015/webhook/${webhookConfig.webhookId}`)
      console.log('[WEBHOOK TEST] Payload:', payload)
      
      const response = await fetch(`http://100.42.185.2:8015/webhook/${webhookConfig.webhookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      console.log('[WEBHOOK TEST] Response:', result)
      
      setTestResult({
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
        statusCode: response.status,
        payload: payload
      })
      
      if (result.success) {
        toast({
          title: "✅ Prueba Exitosa",
          description: "Webhook de prueba enviado correctamente",
        })
      } else {
        toast({
          title: "⚠️ Prueba Fallida",
          description: result.message || "Error en la prueba del webhook",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error('[WEBHOOK TEST] Error:', error)
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      toast({
        title: "❌ Error de Prueba",
        description: error.message || "Error enviando webhook de prueba",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user?.nombrebot) return
    
    try {
      const response = await fetch(
        `http://100.42.185.2:8015/webhook/notifications/${user.nombrebot}/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        
        setWebhookStats(prev => prev ? {
          ...prev,
          unreadNotifications: Math.max(0, prev.unreadNotifications - 1)
        } : null)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read)
    
    try {
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id)
      }
      
      toast({
        title: "✅ Éxito",
        description: "Todas las notificaciones marcadas como leídas",
      })
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await loadWebhookData()
      toast({
        title: "🔄 Actualizado",
        description: "Datos actualizados correctamente",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "📋 Copiado",
      description: "URL copiada al portapapeles",
    })
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'MESSAGES_UPSERT':
        return 'bg-blue-500'
      case 'CONNECTION_UPDATE':
        return 'bg-green-500'
      case 'MESSAGES_DELETE':
        return 'bg-red-500'
      case 'EXTERNAL_WEBHOOK':
      case 'test_notification':
        return 'bg-purple-500'
      case 'CHATS_UPSERT':
        return 'bg-yellow-500'
      case 'GROUPS_UPSERT':
        return 'bg-indigo-500'
      default:
        return 'bg-gray-500'
    }
  }

  const exportNotifications = () => {
    const csv = [
      'ID,Tipo de Evento,Timestamp,Leído,Fuente,Sesión',
      ...notifications.map(n => 
        `"${n.id}","${n.eventType}","${n.timestamp}","${n.read ? 'Sí' : 'No'}","${n.source}","${n.sessionId}"`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webhooks_notifications_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "📁 Exportado",
      description: "Notificaciones exportadas a CSV",
    })
  }

  const requestNewNotifications = () => {
    if (ws && user?.nombrebot) {
      ws.send(JSON.stringify({
        type: 'getNotifications',
        userId: user.nombrebot,
        limit: 50,
        offset: 0
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando sistema de webhooks...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="flex items-center p-4">
            <Bell className="h-6 w-6 flex-shrink-0 text-blue-600" />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">{webhookStats?.totalNotifications || 0}</p>
              <p className="text-xs text-gray-600 truncate">Total Notificaciones</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 text-orange-600" />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">{webhookStats?.unreadNotifications || 0}</p>
              <p className="text-xs text-gray-600 truncate">Sin Leer</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <Activity className={`h-6 w-6 flex-shrink-0 ${wsConnected ? 'text-green-600' : 'text-red-600'}`} />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">{wsConnected ? 'Conectado' : 'Desconectado'}</p>
              <p className="text-xs text-gray-600 truncate">WebSocket</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <Webhook className={`h-6 w-6 flex-shrink-0 ${webhookStats?.webhookActive ? 'text-green-600' : 'text-gray-600'}`} />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">{webhookStats?.webhookActive ? 'Activo' : 'Inactivo'}</p>
              <p className="text-xs text-gray-600 truncate">Webhook</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-4">
            <Users className="h-6 w-6 flex-shrink-0 text-purple-600" />
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-lg font-bold truncate">{webhookStats?.connectedClients || 0}</p>
              <p className="text-xs text-gray-600 truncate">Clientes Conectados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de membresía */}
      {user?.membershipExpired && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-amber-800 dark:text-amber-200 font-medium">
                  Membresía Expirada - Funciones de Webhook Restringidas
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  Solo puedes ver webhooks existentes. Actualiza tu plan para crear nuevos webhooks.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/dashboard/upgrade')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Actualizar Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navegación de tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
              {(webhookStats?.unreadNotifications || 0) > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                  {webhookStats.unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Pruebas
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {notifications.length > 0 && (
              <Button variant="outline" onClick={exportNotifications}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>

        {/* Tab: Resumen */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estado del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Estado del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>WebSocket</span>
                  <Badge variant={wsConnected ? 'default' : 'destructive'}>
                    {wsConnected ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Webhook</span>
                  <Badge variant={webhookStats?.webhookActive ? 'default' : 'secondary'}>
                    {webhookStats?.webhookActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Sesiones Disponibles</span>
                  <Badge variant="outline">
                    {sessions.length} sesiones
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Sesiones Autenticadas</span>
                  <Badge variant="outline">
                    {sessions.filter(s => s.authenticated).length} autenticadas
                  </Badge>
                </div>
                
                {webhookStats?.lastNotification && (
                  <div className="flex items-center justify-between">
                    <span>Última Notificación</span>
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(webhookStats.lastNotification)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuración Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Webhook className="h-5 w-5 mr-2" />
                  Configuración Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {webhookConfig ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Webhook ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {webhookConfig.webhookId}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyWebhookUrl(webhookConfig.webhookId)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">URL del Webhook</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
                          value={webhookConfig.webhookUrl} 
                          readOnly 
                          className="font-mono text-xs"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyWebhookUrl(webhookConfig.webhookUrl)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Eventos Configurados</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhookConfig.events.map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Creado: {formatTimestamp(webhookConfig.createdAt)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No hay webhook configurado</p>
                    <Button onClick={() => setActiveTab('config')} size="sm">
                      Configurar Webhook
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Notificaciones */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notificaciones en Tiempo Real
                  </CardTitle>
                  <CardDescription>
                    Eventos de WhatsApp y webhooks externos recibidos
                  </CardDescription>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={requestNewNotifications} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Solicitar
                  </Button>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Button onClick={markAllAsRead} size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar Todas
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay notificaciones
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Las notificaciones aparecerán aquí cuando ocurran eventos
                  </p>
                  {!webhookConfig && (
                    <Button onClick={() => setActiveTab('config')} size="sm">
                      Configurar Webhook
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                        notification.read 
                          ? 'bg-gray-50 dark:bg-gray-800/50' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className={`w-3 h-3 rounded-full ${getEventTypeColor(notification.eventType)}`}
                            />
                            <Badge variant="outline" className="text-xs">
                              {notification.eventType}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {notification.source}
                            </Badge>
                            {!notification.read && (
                              <Badge className="text-xs bg-blue-600">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatTimestamp(notification.timestamp)}
                            {notification.sessionId && (
                              <>
                                <Smartphone className="h-3 w-3 inline ml-3 mr-1" />
                                {notification.sessionId}
                              </>
                            )}
                          </div>
                          
                          <div className="text-sm">
                            <details className="cursor-pointer">
                              <summary className="font-medium hover:text-blue-600 select-none">
                                Ver datos del evento
                              </summary>
                              <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto max-h-40">
                                {JSON.stringify(notification.eventData, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              title="Marcar como leído"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(notification.eventData, null, 2))
                              toast({
                                title: "📋 Copiado",
                                description: "Datos copiados al portapapeles",
                              })
                            }}
                            title="Copiar datos"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="config">
          <div className="space-y-6">
            {webhookConfig ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Webhook className="h-5 w-5 mr-2" />
                    Webhook Configurado
                  </CardTitle>
                  <CardDescription>
                    Tu webhook está activo y recibiendo eventos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium">ID del Webhook</Label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            value={webhookConfig.webhookId} 
                            readOnly 
                            className="font-mono text-sm"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => copyWebhookUrl(webhookConfig.webhookId)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          ID único de tu webhook
                        </p>
                      </div>
                      
                      <div>
                        <Label className="font-medium">URL del Webhook</Label>
                        <div className="flex gap-2 mt-1">
                          <Input 
                            value={webhookConfig.webhookUrl} 
                            readOnly 
                            className="font-mono text-sm"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => copyWebhookUrl(webhookConfig.webhookUrl)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(webhookConfig.webhookUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Usa esta URL para enviar eventos externos a tu webhook
                        </p>
                      </div>
                      
                      <div>
                        <Label className="font-medium">URL del Cliente (Opcional)</Label>
                        <Input 
                          value={webhookConfig.clientWebhookUrl || 'No configurada'} 
                          readOnly 
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          URL donde se envían las notificaciones de WhatsApp
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium">Sesión Vinculada</Label>
                        <Input 
                          value={webhookConfig.sessionId} 
                          readOnly 
                          className="font-mono text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="font-medium">Eventos Configurados</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {webhookConfig.events.map((event) => (
                            <Badge key={event} variant="secondary">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={webhookConfig.active} 
                            onCheckedChange={setWebhookActive}
                            disabled={user?.membershipExpired}
                          />
                          <Label>Webhook Activo</Label>
                        </div>
                        
                        <Badge 
                          variant={webhookConfig.active ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          <Activity className="h-3 w-3" />
                          {webhookConfig.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {webhookConfig.deliverySettings && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Configuración de Entrega</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-500">Reintentos</Label>
                          <p className="font-medium">{webhookConfig.deliverySettings.retryAttempts}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Delay (ms)</Label>
                          <p className="font-medium">{webhookConfig.deliverySettings.retryDelay}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Timeout (ms)</Label>
                          <p className="font-medium">{webhookConfig.deliverySettings.timeout}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Creado: {formatTimestamp(webhookConfig.createdAt)}</p>
                    {webhookConfig.updatedAt && (
                      <p>Actualizado: {formatTimestamp(webhookConfig.updatedAt)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configurar Nuevo Webhook
                  </CardTitle>
                  <CardDescription>
                    Configura un webhook para recibir eventos de WhatsApp en tiempo real
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="session-select">Sesión de WhatsApp</Label>
                      <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una sesión activa" />
                        </SelectTrigger>
                        <SelectContent>
                          {sessions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  session.authenticated ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                                {session.id}
                                <Badge variant={session.authenticated ? 'default' : 'secondary'} className="ml-auto">
                                  {session.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        Solo sesiones autenticadas pueden recibir eventos
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="client-webhook-url">URL del Cliente (Opcional)</Label>
                      <Input
                        id="client-webhook-url"
                        placeholder="https://tu-servidor.com/webhook-endpoint"
                        value={clientWebhookUrl}
                        onChange={(e) => setClientWebhookUrl(e.target.value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        URL donde se enviarán las notificaciones de eventos de WhatsApp
                      </p>
                    </div>
                    
                    <div>
                      <Label>Eventos a Escuchar</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
                        {availableEvents.map((event) => (
                          <div key={event} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={event}
                              checked={selectedEvents.includes(event)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEvents([...selectedEvents, event])
                                } else {
                                  setSelectedEvents(selectedEvents.filter(ev => ev !== event))
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={event} className="text-xs">
                              {event}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Selecciona 'ALL' para recibir todos los eventos
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={webhookActive} 
                        onCheckedChange={setWebhookActive}
                      />
                      <Label>Activar webhook automáticamente</Label>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={createWebhook} 
                    disabled={creating || !selectedSessionId || user?.membershipExpired}
                    className="w-full"
                  >
                    {creating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Webhook className="h-4 w-4 mr-2" />
                    )}
                    {creating ? 'Creando Webhook...' : 'Crear Webhook'}
                  </Button>
                  
                  {user?.membershipExpired && (
                    <p className="text-sm text-amber-600 text-center">
                      Necesitas una membresía activa para crear webhooks
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Pruebas */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="h-5 w-5 mr-2" />
                Probar Webhook
              </CardTitle>
              <CardDescription>
                Envía webhooks de prueba para verificar la configuración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {webhookConfig ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="test-payload">Payload de Prueba (JSON)</Label>
                    <Textarea
                      id="test-payload"
                      placeholder={`{
  "type": "test_notification",
  "data": {
    "message": "Webhook de prueba desde el panel",
    "timestamp": "${new Date().toISOString()}",
    "source": "dashboard"
  }
}`}
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      Deja vacío para usar un payload de prueba automático
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={testWebhook} 
                      disabled={testing}
                      className="flex-1"
                    >
                      {testing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {testing ? 'Enviando...' : 'Enviar Webhook de Prueba'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setTestPayload('')
                        setTestResult(null)
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpiar
                    </Button>
                  </div>
                  
                  {testResult && (
                    <div className="space-y-2">
                      <Label>Resultado de la Prueba</Label>
                      <div className={`p-4 rounded-lg border ${
                        testResult.success 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {testResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">
                            {testResult.success ? 'Prueba Exitosa' : 'Prueba Fallida'}
                          </span>
                          {testResult.timestamp && (
                            <span className="text-xs text-gray-500 ml-auto">
                              {formatTimestamp(testResult.timestamp)}
                            </span>
                          )}
                        </div>
                        <pre className="text-sm overflow-x-auto bg-white dark:bg-gray-900 p-2 rounded border">
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Información del webhook */}
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                    <h4 className="font-medium mb-3">Información de Prueba</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>URL de Destino:</span>
                        <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded">
                          {webhookConfig.webhookUrl}
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Método:</span>
                        <Badge variant="outline">POST</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Content-Type:</span>
                        <code className="text-xs">application/json</code>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No hay webhook configurado
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Configura un webhook primero para poder realizar pruebas
                  </p>
                  <Button onClick={() => setActiveTab('config')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Webhook
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
