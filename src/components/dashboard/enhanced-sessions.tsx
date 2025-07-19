'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, CreditCard, Smartphone, Wifi, WifiOff, MessageSquare, Bell, Plus, BarChart3, Trash2, Link, CheckCircle, XCircle, AlertCircle, Activity, Lock, Clipboard, Key, Camera, Phone, Signal, Copy, Power, Globe, Shield, Users, Clock, TrendingUp, Zap } from '@/components/ui/icons'
import { toast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

// Importar APIs después de las otras importaciones
import { sessionsAPI, webhooksAPI, utilsAPI, authAPI } from '@/lib/api'

// Importar componentes de analytics
import { MetricCard, RealtimeStats } from '@/components/dashboard/analytics-charts'
import { HealthMonitor } from '@/components/dashboard/health-monitor'

// Configuración por defecto para APIs
const defaultSettings = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://100.42.185.2:8015'
  }
}

// Tipos locales para evitar dependencias
interface SessionData {
  id: string;
  status: string;
  authenticated?: boolean;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  lastActivity?: string;
  qr?: string;
  code?: string;
  typeAuth?: 'qr' | 'code';
}

interface WebhookStats {
  totalNotifications: number;
  unreadNotifications: number;
  webhookActive: boolean;
  lastNotification: string | null;
  connectedClients: number;
}

interface Session extends SessionData {
  webhookId?: string
  webhookStats?: WebhookStats
  lastActivity?: string
  messageCount?: number
  chatCount?: number
}

export default function EnhancedSessionsComponent() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  
  // Form states
  const [sessionName, setSessionName] = useState('')
  const [authType, setAuthType] = useState<'qr' | 'code'>('qr')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  
  // Estados para código de verificación
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null)
  const [verificationSessionName, setVerificationSessionName] = useState<string | null>(null)
  const [verificationPhoneNumber, setVerificationPhoneNumber] = useState<string | null>(null)
  const [codeExpiryTime, setCodeExpiryTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(30)
  const [requestingNewCode, setRequestingNewCode] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [modalSessionStatus, setModalSessionStatus] = useState<string>('connecting')
  const [modalSessionAuthenticated, setModalSessionAuthenticated] = useState<boolean>(false)
  
  // Estados para selección múltiple y operaciones en lote
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectAllMode, setSelectAllMode] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [cleaningInactive, setCleaningInactive] = useState(false)
  
  // Estados para QR Code
  const [qrCodeData, setQrCodeData] = useState<{sessionId: string, sessionName: string, qrCode: string, phoneNumber?: string} | null>(null)
  const [qrPollingActive, setQrPollingActive] = useState<boolean>(false)

  // Estados para métricas del dashboard
  const [dashboardStats, setDashboardStats] = useState({
    totalSessions: 0,
    connectedSessions: 0,
    authenticatedSessions: 0,
    totalMessages: 0,
    activeConnections: 0,
    messagesPerSecond: 0,
    webhooksPerSecond: 0,
    cpuUsage: 25,
    memoryUsage: 45,
    diskUsage: 30
  })

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 45000)
    return () => clearInterval(interval)
  }, [])

  // Función para cargar sesiones
  const loadSessions = async (forceRefresh = false) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }

      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const response = await sessionsAPI.listForUser(token)
      
      if (response.success) {
        const sessionsData = Array.isArray(response.data?.sesiones) ? response.data.sesiones : []
        
        if (sessionsData.length === 0) {
          setSessions([])
          return
        }

        const enhancedSessions = sessionsData.map((sessionData: any) => {
          const sessionId = sessionData.id || sessionData.sesionId || sessionData.nombresesion
          
          return {
            id: sessionId,
            status: mapBackendStatus(sessionData.estadoSesion || sessionData.estado || 'disconnected'),
            authenticated: sessionData.estadoSesion === 'authenticated' || sessionData.estado === 'authenticated' || sessionData.authenticated === true,
            phoneNumber: sessionData.lineaWhatsApp || sessionData.phoneNumber,
            createdAt: sessionData.fechaCreacion || sessionData.createdAt,
            updatedAt: sessionData.fechaActualizacion || sessionData.updatedAt,
            lastActivity: sessionData.fechaActualizacion || new Date().toISOString(),
            messageCount: Math.floor(Math.random() * 1000),
            chatCount: Math.floor(Math.random() * 50)
          }
        })

        setSessions(enhancedSessions)
        
        // Actualizar estadísticas del dashboard
        setDashboardStats(prev => ({
          ...prev,
          totalSessions: enhancedSessions.length,
          connectedSessions: enhancedSessions.filter(s => s.status === 'connected').length,
          authenticatedSessions: enhancedSessions.filter(s => s.authenticated).length,
          activeConnections: enhancedSessions.filter(s => s.status !== 'disconnected').length
        }))
      } else {
        setSessions([])
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  // Función para mapear estados del backend
  const mapBackendStatus = (backendStatus: string): string => {
    const statusMap: { [key: string]: string } = {
      'conectando': 'connecting',
      'connecting': 'connecting',
      'conectado': 'connected',
      'connected': 'connected',
      'autenticado': 'authenticated',
      'authenticated': 'authenticated',
      'desconectado': 'disconnected',
      'disconnected': 'disconnected',
      'desconectando': 'disconnecting',
      'disconnecting': 'disconnecting',
      'eliminada': 'deleted',
      'deleted': 'deleted',
      'error': 'error'
    }
    
    return statusMap[backendStatus.toLowerCase()] || backendStatus
  }

  // Función para crear sesión
  const createSession = async () => {
    if (user?.membershipExpired) {
      toast({
        title: "🔒 Funcionalidad Restringida",
        description: "Tu membresía ha expirado. Actualiza tu plan para crear nuevas sesiones.",
        variant: "destructive",
      })
      return
    }

    if (!sessionName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la sesión es requerido",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }

      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/sesiones/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: token,
          nombresesion: sessionName,
          lineaWhatsApp: phoneNumber.trim() ? phoneNumber : undefined,
          tipoAuth: authType,
          crearWebhook: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const responseData = await response.json()
      
      if (responseData.success) {
        toast({
          title: "✅ Éxito",
          description: "Sesión creada exitosamente",
        })

        setSessionName('')
        setPhoneNumber('')
        setWebhookUrl('')
        setShowCreateForm(false)
        
        setTimeout(() => {
          loadSessions(true)
        }, 1000)
      } else {
        throw new Error(responseData.message || 'Error creando sesión')
      }
      
    } catch (error) {
      console.error('Error creating session:', error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "No se pudo crear la sesión",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  // Función para eliminar sesión
  const deleteSession = async (sessionId: string) => {
    if (user?.membershipExpired) {
      toast({
        title: "🔒 Funcionalidad Restringida",
        description: "No puedes eliminar sesiones con membresía expirada.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await sessionsAPI.delete(sessionId)
      
      if (response.success) {
        toast({
          title: "✅ Éxito",
          description: `La sesión "${sessionId}" ha sido eliminada exitosamente.`,
        })
        loadSessions()
      } else {
        throw new Error(response.message || 'Error eliminando sesión')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la sesión",
        variant: "destructive",
      })
    }
  }

  // Función para refrescar sesión
  const refreshSession = async (sessionId: string) => {
    setRefreshing(sessionId)
    try {
      const response = await sessionsAPI.status(sessionId)
      if (response.success) {
        loadSessions()
        toast({
          title: "Actualizado",
          description: "Estado de la sesión actualizado",
        })
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setRefreshing(null)
    }
  }

  // Funciones para indicadores de estado
  const getStatusColor = (status: string, authenticated: boolean = false) => {
    if (authenticated) return 'bg-green-500'
    
    switch (status) {
      case 'authenticated': return 'bg-green-500'
      case 'connected': return 'bg-blue-500'
      case 'connecting': return 'bg-yellow-500 animate-pulse'
      case 'disconnected':
      case 'disconnecting': return 'bg-red-500'
      case 'error': return 'bg-red-600'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string, authenticated: boolean = false) => {
    if (authenticated) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    
    switch (status) {
      case 'authenticated':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'connected':
        return <Wifi className="h-4 w-4 text-blue-600" />
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />
      case 'disconnected':
      case 'disconnecting':
        return <WifiOff className="h-4 w-4 text-red-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string, authenticated: boolean = false) => {
    if (authenticated) return 'Autenticado'
    
    switch (status) {
      case 'authenticated': return 'Autenticado'
      case 'connected': return 'Conectado'
      case 'connecting': return 'Conectando...'
      case 'disconnected': return 'Desconectado'
      case 'disconnecting': return 'Desconectando...'
      case 'error': return 'Error'
      default: return status
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              Gestión de Sesiones WhatsApp
            </CardTitle>
            <CardDescription>
              Administra tus conexiones de WhatsApp Business API
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                console.log('Botón clickeado, showCreateForm actual:', showCreateForm)
                setShowCreateForm(!showCreateForm)
              }}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sesión
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Métricas del Dashboard */}
        <div className="mb-6 space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Sesiones"
              value={dashboardStats.totalSessions}
              change={12.3}
              changeLabel="vs semana anterior"
              icon={<Smartphone className="h-8 w-8" />}
              trend="up"
            />
            <MetricCard
              title="Sesiones Conectadas"
              value={dashboardStats.connectedSessions}
              change={5.7}
              changeLabel="vs semana anterior"
              icon={<Wifi className="h-8 w-8" />}
              trend="up"
            />
            <MetricCard
              title="Autenticadas"
              value={dashboardStats.authenticatedSessions}
              change={-2.1}
              changeLabel="vs semana anterior"
              icon={<CheckCircle className="h-8 w-8" />}
              trend="down"
            />
            <MetricCard
              title="Mensajes Hoy"
              value={dashboardStats.totalMessages.toLocaleString()}
              change={18.4}
              changeLabel="vs ayer"
              icon={<MessageSquare className="h-8 w-8" />}
              trend="up"
            />
          </div>

          {/* Estadísticas en Tiempo Real */}
          <RealtimeStats stats={{
            activeConnections: dashboardStats.activeConnections,
            messagesPerSecond: dashboardStats.messagesPerSecond,
            webhooksPerSecond: dashboardStats.webhooksPerSecond,
            cpuUsage: dashboardStats.cpuUsage,
            memoryUsage: dashboardStats.memoryUsage,
            diskUsage: dashboardStats.diskUsage
          }} />
        </div>
        {showCreateForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4">Crear Nueva Sesión</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sessionName">Nombre de la Sesión</Label>
                <Input
                  id="sessionName"
                  placeholder="ej: mi-negocio-whatsapp"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  disabled={creating}
                />
              </div>

              <div>
                <Label>Tipo de Autenticación</Label>
                <Tabs value={authType} onValueChange={(value) => setAuthType(value as 'qr' | 'code')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="qr" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Código QR
                    </TabsTrigger>
                    <TabsTrigger value="code" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Código de Verificación
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <Label htmlFor="phoneNumber">
                  Número de WhatsApp {authType === 'code' ? '(Requerido)' : '(Opcional)'}
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="+57 300 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={creating}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createSession}
                  disabled={creating || !sessionName.trim()}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Sesión
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setSessionName('')
                    setPhoneNumber('')
                    setWebhookUrl('')
                  }}
                  disabled={creating}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No hay sesiones activas</p>
            <p className="text-sm mt-2">Crea una nueva sesión para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{session.id}</h4>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${getStatusColor(session.status, session.authenticated)}`} />
                          {getStatusIcon(session.status, session.authenticated)}
                          <span className="text-sm">{getStatusText(session.status, session.authenticated)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {session.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {session.phoneNumber}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {session.lastActivity ? new Date(session.lastActivity).toLocaleString() : 'Sin actividad'}
                        </div>
                        {session.messageCount !== undefined && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {session.messageCount} mensajes
                          </div>
                        )}
                        {session.chatCount !== undefined && (
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {session.chatCount} chats
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refreshSession(session.id)}
                      disabled={refreshing === session.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing === session.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
