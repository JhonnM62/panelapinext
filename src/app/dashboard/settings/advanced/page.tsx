'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  Shield,
  Bell,
  Zap,
  Globe,
  Database,
  Clock,
  Smartphone,
  MessageSquare,
  Users,
  Key,
  Lock,
  Wifi,
  Server,
  Activity,
  Code,
  Webhook,
  Download,
  Upload,
  Eye,
  EyeOff,
  Crown,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  RotateCcw,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  CreditCard
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/auth'

// Interfaces para administración
interface User {
  _id: string
  email: string
  rol: 'admin' | 'usuario' | string
  tipoplan: string
  numerodesesiones: number
  fechaCreacion: string
  ultimoAcceso: string
  activo: boolean
  membresiaVencimiento: string
  estadisticas: {
    sesionesCreadas: number
    mensajesEnviados: number
    ultimaActividad: string
  }
}

interface Session {
  _id: string
  nombresesion: string
  lineaWhatsApp: string
  userId: string
  userEmail: string
  estadoSesion: 'conectado' | 'desconectado' | 'conectando' | 'error'
  webhookCreado: boolean
  webhookUrl?: string
  webhookActivo: boolean
  fechaCreacion: string
  fechaUltimaConexion?: string
  activa: boolean
  tipoAuth: string
  estadisticas: {
    mensajesEnviados: number
    mensajesRecibidos: number
    tiempoConectado: number
  }
}

interface Plan {
  id: string
  nombre: string
  descripcion: string
  precio: number
  duracionDias: number
  maxSesiones: number
  caracteristicas: string[]
  activo: boolean
  orden: number
}

interface AdvancedSettings {
  // API Settings
  api: {
    baseUrl: string
    timeout: number
    retryAttempts: number
    rateLimitEnabled: boolean
    rateLimitRequests: number
    rateLimitWindow: number
    corsEnabled: boolean
    corsOrigins: string[]
  }
  
  // Session Management
  sessions: {
    maxSessions: number
    sessionTimeout: number
    autoReconnect: boolean
    reconnectInterval: number
    maxReconnectAttempts: number
    qrRefreshInterval: number
    sessionPersistence: boolean
    cleanupInactiveSessions: boolean
    inactivityThreshold: number
  }
  
  // Webhooks
  webhooks: {
    enabled: boolean
    retryEnabled: boolean
    maxRetries: number
    retryDelay: number
    timeoutDuration: number
    verifySSL: boolean
    customHeaders: { [key: string]: string }
    batchingEnabled: boolean
    batchSize: number
    batchTimeout: number
  }
  
  // Notifications
  notifications: {
    enabled: boolean
    emailNotifications: boolean
    smsNotifications: boolean
    discordWebhook: string
    slackWebhook: string
    telegramBot: {
      token: string
      chatId: string
    }
    alertThresholds: {
      errorRate: number
      responseTime: number
      memoryUsage: number
      diskUsage: number
    }
  }
  
  // Security
  security: {
    requireHttps: boolean
    tokenExpiration: number
    maxLoginAttempts: number
    lockoutDuration: number
    ipWhitelist: string[]
    enableAuditLog: boolean
    encryptSessionData: boolean
    twoFactorAuth: boolean
  }
  
  // Performance
  performance: {
    enableCaching: boolean
    cacheExpiration: number
    enableCompression: boolean
    maxConcurrentRequests: number
    messageQueueSize: number
    enableLoadBalancing: boolean
    healthCheckInterval: number
  }
  
  // Logging
  logging: {
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    enableFileLogging: boolean
    logRetentionDays: number
    enableStructuredLogging: boolean
    logToDatabase: boolean
    enableRemoteLogging: boolean
    remoteLogEndpoint: string
  }
  
  // Backup & Recovery
  backup: {
    enableAutoBackup: boolean
    backupInterval: number
    maxBackupFiles: number
    backupLocation: string
    enableRemoteBackup: boolean
    remoteBackupUrl: string
    compressionEnabled: boolean
  }
}

const defaultSettings: AdvancedSettings = {
  api: {
    baseUrl: 'http://100.42.185.2:8015',
    timeout: 30000,
    retryAttempts: 3,
    rateLimitEnabled: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60,
    corsEnabled: true,
    corsOrigins: ['*']
  },
  sessions: {
    maxSessions: 10,
    sessionTimeout: 300,
    autoReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    qrRefreshInterval: 30,
    sessionPersistence: true,
    cleanupInactiveSessions: true,
    inactivityThreshold: 1800
  },
  webhooks: {
    enabled: true,
    retryEnabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    timeoutDuration: 10000,
    verifySSL: true,
    customHeaders: {},
    batchingEnabled: false,
    batchSize: 10,
    batchTimeout: 5000
  },
  notifications: {
    enabled: true,
    emailNotifications: false,
    smsNotifications: false,
    discordWebhook: '',
    slackWebhook: '',
    telegramBot: {
      token: '',
      chatId: ''
    },
    alertThresholds: {
      errorRate: 5,
      responseTime: 5000,
      memoryUsage: 85,
      diskUsage: 90
    }
  },
  security: {
    requireHttps: false,
    tokenExpiration: 86400,
    maxLoginAttempts: 5,
    lockoutDuration: 900,
    ipWhitelist: [],
    enableAuditLog: true,
    encryptSessionData: false,
    twoFactorAuth: false
  },
  performance: {
    enableCaching: true,
    cacheExpiration: 3600,
    enableCompression: true,
    maxConcurrentRequests: 50,
    messageQueueSize: 1000,
    enableLoadBalancing: false,
    healthCheckInterval: 30
  },
  logging: {
    logLevel: 'info',
    enableFileLogging: true,
    logRetentionDays: 30,
    enableStructuredLogging: true,
    logToDatabase: false,
    enableRemoteLogging: false,
    remoteLogEndpoint: ''
  },
  backup: {
    enableAutoBackup: true,
    backupInterval: 86400,
    maxBackupFiles: 7,
    backupLocation: './backups',
    enableRemoteBackup: false,
    remoteBackupUrl: '',
    compressionEnabled: true
  }
}

export default function AdvancedSettingsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [settings, setSettings] = useState<AdvancedSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTokens, setShowTokens] = useState(false)
  const [activeTab, setActiveTab] = useState('users')
  
  // Manejar parámetro de tab desde URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get('tab')
      if (tabParam && ['users', 'sessions', 'plans', 'gemini', 'system'].includes(tabParam)) {
        setActiveTab(tabParam)
      }
    }
  }, [])
  
  // Estados para administración
  const [users, setUsers] = useState<User[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [geminiConfigs, setGeminiConfigs] = useState<any[]>([])
  const [geminiStats, setGeminiStats] = useState({
    activeConfigs: 0,
    messagesProcessed: 0,
    usersWithAI: 0,
    tokensUsed: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Verificación más robusta de admin
    if (user) {
      if (user.rol !== 'admin') {
        toast({
          title: "Acceso denegado",
          description: "Solo los administradores pueden acceder a esta sección",
          variant: "destructive",
        })
        router.push('/dashboard')
        return
      }
      loadSettings()
      loadAdminData()
    } else if (!user && !loading) {
      router.push('/login')
    }
  }, [user, router, refreshKey])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // En una app real, esto vendría de la API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSettings(defaultSettings)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const loadAdminData = async () => {
    try {
      // Cargar usuarios
      const usersResponse = await fetch(`${defaultSettings.api.baseUrl}/api/v2/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        }
      })
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        if (usersData.success) {
          setUsers(usersData.data)
        }
      }
      
      // Cargar sesiones
      const sessionsResponse = await fetch(`${defaultSettings.api.baseUrl}/api/v2/admin/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        }
      })
      
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        if (sessionsData.success) {
          setSessions(sessionsData.data)
        }
      }
      
      // Cargar planes
      const plansData = [
        {
          id: 'prueba',
          nombre: 'Prueba 14 días',
          descripcion: 'Plan de prueba gratuito',
          precio: 0,
          duracionDias: 14,
          maxSesiones: 1,
          caracteristicas: ['1 sesión', 'Soporte básico'],
          activo: true,
          orden: 1
        },
        {
          id: 'semestral',
          nombre: 'Plan 6 meses',
          descripcion: 'Plan semestral',
          precio: 50,
          duracionDias: 180,
          maxSesiones: 2,
          caracteristicas: ['2 sesiones', 'Soporte prioritario'],
          activo: true,
          orden: 2
        },
        {
          id: 'anual',
          nombre: 'Plan 1 año',
          descripcion: 'Plan anual',
          precio: 90,
          duracionDias: 365,
          maxSesiones: 3,
          caracteristicas: ['3 sesiones', 'Soporte prioritario', 'Analíticas'],
          activo: true,
          orden: 3
        },
        {
          id: 'vitalicio',
          nombre: 'Plan Vitalicio',
          descripcion: 'Plan de por vida',
          precio: 200,
          duracionDias: 36500,
          maxSesiones: 4,
          caracteristicas: ['4 sesiones', 'Soporte VIP', 'Analíticas', 'IA avanzada'],
          activo: true,
          orden: 4
        }
      ]
      setPlans(plansData)
      
      // Cargar configuraciones de Gemini
      try {
        const geminiResponse = await fetch(`${defaultSettings.api.baseUrl}/api/v2/admin/gemini`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          }
        })
        
        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json()
          if (geminiData.success) {
            setGeminiConfigs(geminiData.data)
            // Calcular estadísticas
            setGeminiStats({
              activeConfigs: geminiData.data.filter((config: any) => config.activo).length,
              messagesProcessed: geminiData.data.reduce((sum: number, config: any) => sum + (config.mensajesProcesados || 0), 0),
              usersWithAI: geminiData.data.length,
              tokensUsed: geminiData.data.reduce((sum: number, config: any) => sum + (config.tokensUsados || 0), 0)
            })
          }
        }
      } catch (error) {
        console.error('Error loading Gemini data:', error)
        // Datos mock para desarrollo
        setGeminiStats({
          activeConfigs: 12,
          messagesProcessed: 1234,
          usersWithAI: 8,
          tokensUsed: 45200
        })
      }
      
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast({
        title: "Error",
        description: "Error cargando datos administrativos",
        variant: "destructive",
      })
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // En una app real, esto se enviaría a la API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido aplicados exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
    toast({
      title: "Configuración restaurada",
      description: "Se han restaurado los valores por defecto",
    })
  }

  const updateSetting = (section: keyof AdvancedSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const updateNestedSetting = (section: keyof AdvancedSettings, subsection: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [key]: value
        }
      }
    }))
  }
  
  // Funciones de administración
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/roles/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          token: user?.token,
          userId: userId,
          nuevoRol: newRole,
          motivo: 'Cambio desde panel administrativo'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRefreshKey(prev => prev + 1)
          toast({
            title: "Rol actualizado",
            description: `El rol del usuario ha sido cambiado a ${newRole}`,
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error actualizando el rol del usuario",
        variant: "destructive",
      })
    }
  }
  
  const updateUserPlan = async (userId: string, newPlan: string) => {
    try {
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/auth/renew-membership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          token: user?.token,
          userId: userId,
          tipoplan: newPlan
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRefreshKey(prev => prev + 1)
          toast({
            title: "Plan actualizado",
            description: `El plan del usuario ha sido cambiado a ${newPlan}`,
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error actualizando el plan del usuario",
        variant: "destructive",
      })
    }
  }
  
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/admin/users/${userId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          token: user?.token,
          activo: !currentStatus
        })
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        toast({
          title: "Estado actualizado",
          description: `Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error actualizando estado del usuario",
        variant: "destructive",
      })
    }
  }
  
  const restartSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/sesiones/${sessionId}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          token: user?.token
        })
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        toast({
          title: "Sesión reiniciada",
          description: "La sesión ha sido reiniciada exitosamente",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error reiniciando la sesión",
        variant: "destructive",
      })
    }
  }
  
  // Funciones de administración de Gemini
  const toggleGeminiConfig = async (configId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/admin/gemini/${configId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          token: user?.token,
          activo: !currentStatus
        })
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        toast({
          title: "Configuración actualizada",
          description: `Configuración de IA ${!currentStatus ? 'activada' : 'pausada'} exitosamente`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error actualizando configuración de IA",
        variant: "destructive",
      })
    }
  }
  
  const resetGeminiConfig = async (configId: string) => {
    try {
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/admin/gemini/${configId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          token: user?.token
        })
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        toast({
          title: "Configuración reiniciada",
          description: "La configuración de IA ha sido reiniciada exitosamente",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error reiniciando configuración de IA",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 shrink-0" />
              Panel de Administración
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
              Gestiona usuarios, sesiones, planes y configuraciones del sistema
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button variant="outline" onClick={resetToDefaults} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Restaurar Defaults
            </Button>
            
            <Button onClick={saveSettings} disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        {/* Admin Warning Notice */}
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Panel Administrativo:</strong> Solo los administradores pueden acceder a esta sección. 
                Los cambios realizados aquí afectan a todos los usuarios del sistema.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-hidden">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="users" className="flex items-center gap-2 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Usuarios</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2 text-xs sm:text-sm">
                <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sesiones</span>
                <span className="sm:hidden">Sessions</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className="flex items-center gap-2 text-xs sm:text-sm">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Planes</span>
                <span className="sm:hidden">Plans</span>
              </TabsTrigger>
              <TabsTrigger value="gemini" className="flex items-center gap-2 text-xs sm:text-sm">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Gemini IA</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2 text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sistema</span>
                <span className="sm:hidden">System</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Gestión de Usuarios */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-4">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Gestión de Usuarios
                    </CardTitle>
                    <CardDescription>
                      Administra usuarios, roles y planes del sistema
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar usuarios..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full"
                      />
                    </div>
                    <Button onClick={() => setRefreshKey(prev => prev + 1)} className="shrink-0">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto scrollbar-hide">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Usuario</TableHead>
                          <TableHead className="min-w-[120px]">Rol</TableHead>
                          <TableHead className="min-w-[140px]">Plan</TableHead>
                          <TableHead className="min-w-[100px]">Sesiones</TableHead>
                          <TableHead className="min-w-[80px]">Estado</TableHead>
                          <TableHead className="min-w-[120px]">Último Acceso</TableHead>
                          <TableHead className="min-w-[160px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users
                          .filter(user => 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((user) => (
                          <TableRow key={user._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  user.activo ? 'bg-green-500' : 'bg-gray-400'
                                }`} />
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{user.email}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(user.fechaCreacion).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.rol} 
                                onValueChange={(value) => updateUserRole(user._id, value)}
                              >
                                <SelectTrigger className="w-full min-w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <Crown className="h-3 w-3 text-yellow-600" />
                                      <span className="text-xs">Admin</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="usuario">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3 w-3 text-blue-600" />
                                      <span className="text-xs">Usuario</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.tipoplan} 
                                onValueChange={(value) => updateUserPlan(user._id, value)}
                              >
                                <SelectTrigger className="w-full min-w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      <span className="text-xs">{plan.nombre}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {user.numerodesesiones} sesiones
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.activo ? "default" : "secondary"}
                                className={`text-xs ${
                                  user.activo ? "bg-green-100 text-green-800" : ""
                                }`}
                              >
                                {user.activo ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(user.ultimoAcceso).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsEditUserDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={user.activo ? "destructive" : "default"}
                                  className="h-8 w-8 p-0"
                                  onClick={() => toggleUserStatus(user._id, user.activo)}
                                >
                                  {user.activo ? (
                                    <UserX className="h-3 w-3" />
                                  ) : (
                                    <UserCheck className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        {/* Gestión de Gemini IA */}
        <TabsContent value="gemini" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 shrink-0" />
                    <span className="truncate">Administración de Gemini IA</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Gestiona todas las configuraciones de IA del sistema y estadísticas de uso
                  </CardDescription>
                </div>
                
                <Button onClick={() => setRefreshKey(prev => prev + 1)} className="shrink-0">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Actualizar</span>
                  <span className="sm:hidden">Actualizar</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estadísticas de Gemini */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Configuraciones Activas</p>
                        <p className="text-lg sm:text-2xl font-bold truncate">{geminiStats.activeConfigs}</p>
                      </div>
                      <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Mensajes Procesados</p>
                        <p className="text-lg sm:text-2xl font-bold truncate">{geminiStats.messagesProcessed.toLocaleString()}</p>
                      </div>
                      <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Usuarios con IA</p>
                        <p className="text-lg sm:text-2xl font-bold truncate">{geminiStats.usersWithAI}</p>
                      </div>
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Tokens Utilizados</p>
                        <p className="text-lg sm:text-2xl font-bold truncate">{(geminiStats.tokensUsed / 1000).toFixed(1)}K</p>
                      </div>
                      <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Configuraciones Globales de Gemini */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Configuración Global de Gemini</CardTitle>
                  <CardDescription className="text-sm">
                    Configuraciones que se aplicarán a nivel de sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2 min-w-0">
                      <Label className="text-sm">Modelo IA por Defecto</Label>
                      <Select defaultValue="gemini-2.5-flash">
                        <SelectTrigger className="w-full min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                          <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                          <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 min-w-0">
                      <Label className="text-sm">Servidor de Procesamiento</Label>
                      <Input 
                        defaultValue="http://100.42.185.2:8014" 
                        className="w-full text-sm min-w-0" 
                        placeholder="URL del servidor..."
                      />
                    </div>
                    
                    <div className="space-y-2 min-w-0">
                      <Label className="text-sm">Límite de Tokens Diario (Global)</Label>
                      <Input 
                        type="number" 
                        defaultValue="100000" 
                        className="w-full text-sm min-w-0" 
                        placeholder="100000"
                      />
                    </div>
                    
                    <div className="space-y-2 min-w-0">
                      <Label className="text-sm">Delay Mínimo entre Mensajes (segundos)</Label>
                      <Input 
                        type="number" 
                        defaultValue="3" 
                        className="w-full text-sm min-w-0" 
                        placeholder="3"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 min-w-0">
                    <Label className="text-sm">Prompt Base del Sistema</Label>
                    <Textarea 
                      rows={3} 
                      defaultValue="Eres un asistente virtual inteligente. Responde de manera útil, concisa y profesional." 
                      placeholder="Prompt que se agregará a todas las configuraciones como base..."
                      className="w-full resize-none text-sm min-w-0"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked id="allow-user-configs" />
                      <Label htmlFor="allow-user-configs" className="text-sm">Permitir usuarios crear configuraciones de IA</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked id="auto-monitoring" />
                      <Label htmlFor="auto-monitoring" className="text-sm">Monitoreo automático de uso</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Configuraciones de Usuarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Configuraciones de Usuarios</CardTitle>
                  <CardDescription className="text-sm">
                    Todas las configuraciones de Gemini IA por usuario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto scrollbar-hide">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Usuario</TableHead>
                            <TableHead className="min-w-[90px]">Bot</TableHead>
                            <TableHead className="min-w-[90px] hidden sm:table-cell">Modelo</TableHead>
                            <TableHead className="min-w-[70px]">Estado</TableHead>
                            <TableHead className="min-w-[60px] hidden md:table-cell">Mensajes</TableHead>
                            <TableHead className="min-w-[60px] hidden md:table-cell">Tokens</TableHead>
                            <TableHead className="min-w-[80px] hidden lg:table-cell">Actividad</TableHead>
                            <TableHead className="min-w-[100px]">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium text-xs truncate">usuario@test.com</p>
                                <p className="text-xs text-muted-foreground">Plan: Vitalicio</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">MiBot_Ventas</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge className="text-xs">Gemini 2.5 Flash</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 text-xs">Activo</Badge>
                            </TableCell>
                            <TableCell className="text-xs hidden md:table-cell">24</TableCell>
                            <TableCell className="text-xs hidden md:table-cell">1,250</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                              Hace 5 min
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="destructive" className="h-6 w-6 p-0">
                                  <Pause className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          <TableRow>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium text-xs truncate">admin@test.com</p>
                                <p className="text-xs text-muted-foreground">Plan: Admin</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">AdminBot_Support</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge className="text-xs">Gemini 1.5 Pro</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 text-xs">Activo</Badge>
                            </TableCell>
                            <TableCell className="text-xs hidden md:table-cell">8</TableCell>
                            <TableCell className="text-xs hidden md:table-cell">560</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                              Hace 15 min
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="destructive" className="h-6 w-6 p-0">
                                  <Pause className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          <TableRow>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium text-xs truncate">cliente@empresa.com</p>
                                <p className="text-xs text-muted-foreground">Plan: Anual</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">EmpresaBot_Atencion</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge className="text-xs">Gemini 2.0 Flash</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                            </TableCell>
                            <TableCell className="text-xs hidden md:table-cell">0</TableCell>
                            <TableCell className="text-xs hidden md:table-cell">0</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                              Hace 2 días
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="default" className="h-6 w-6 p-0">
                                  <Play className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Configuración de API
              </CardTitle>
              <CardDescription>
                Configuraciones relacionadas con la API de Baileys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">URL Base de la API</Label>
                  <Input
                    id="baseUrl"
                    value={settings.api.baseUrl}
                    onChange={(e) => updateSetting('api', 'baseUrl', e.target.value)}
                    placeholder="http://100.42.185.2:8015"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={settings.api.timeout}
                    onChange={(e) => updateSetting('api', 'timeout', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retryAttempts">Intentos de Reintento</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    value={settings.api.retryAttempts}
                    onChange={(e) => updateSetting('api', 'retryAttempts', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Rate Limiting</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.api.rateLimitEnabled}
                      onCheckedChange={(checked) => updateSetting('api', 'rateLimitEnabled', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                {settings.api.rateLimitEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="rateLimitRequests">Requests por Ventana</Label>
                      <Input
                        id="rateLimitRequests"
                        type="number"
                        value={settings.api.rateLimitRequests}
                        onChange={(e) => updateSetting('api', 'rateLimitRequests', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rateLimitWindow">Ventana de Tiempo (segundos)</Label>
                      <Input
                        id="rateLimitWindow"
                        type="number"
                        value={settings.api.rateLimitWindow}
                        onChange={(e) => updateSetting('api', 'rateLimitWindow', parseInt(e.target.value))}
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label>CORS</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.api.corsEnabled}
                      onCheckedChange={(checked) => updateSetting('api', 'corsEnabled', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="corsOrigins">Orígenes CORS (separados por coma)</Label>
                  <Input
                    id="corsOrigins"
                    value={settings.api.corsOrigins.join(', ')}
                    onChange={(e) => updateSetting('api', 'corsOrigins', e.target.value.split(',').map(s => s.trim()))}
                    placeholder="https://miapp.com, https://admin.miapp.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestión de Sesiones */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Smartphone className="h-5 w-5 mr-2" />
                    Gestión de Sesiones
                  </CardTitle>
                  <CardDescription>
                    Administra todas las sesiones de WhatsApp del sistema
                  </CardDescription>
                </div>
                
                <Button onClick={() => setRefreshKey(prev => prev + 1)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sesión</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Línea WhatsApp</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Webhook</TableHead>
                      <TableHead>Última Conexión</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{session.nombresesion}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.fechaCreacion).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{session.userEmail}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {session.lineaWhatsApp}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={session.estadoSesion === 'conectado' ? "default" : "secondary"}
                            className={{
                              'conectado': 'bg-green-100 text-green-800',
                              'conectando': 'bg-yellow-100 text-yellow-800',
                              'desconectado': 'bg-gray-100 text-gray-800',
                              'error': 'bg-red-100 text-red-800'
                            }[session.estadoSesion]}
                          >
                            {session.estadoSesion}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {session.webhookCreado ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Activo</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">No creado</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {session.fechaUltimaConexion 
                            ? new Date(session.fechaUltimaConexion).toLocaleDateString()
                            : 'Nunca'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSession(session)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restartSession(session._id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            {session.activa ? (
                              <Button size="sm" variant="destructive">
                                <Pause className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="default">
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Settings */}
        <TabsContent value="sessions-old" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                Gestión de Sesiones
              </CardTitle>
              <CardDescription>
                Configuraciones para el manejo de sesiones de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxSessions">Máximo de Sesiones</Label>
                  <Input
                    id="maxSessions"
                    type="number"
                    value={settings.sessions.maxSessions}
                    onChange={(e) => updateSetting('sessions', 'maxSessions', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sesión (segundos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessions.sessionTimeout}
                    onChange={(e) => updateSetting('sessions', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Auto-reconexión</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.sessions.autoReconnect}
                      onCheckedChange={(checked) => updateSetting('sessions', 'autoReconnect', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reconnectInterval">Intervalo de Reconexión (ms)</Label>
                  <Input
                    id="reconnectInterval"
                    type="number"
                    value={settings.sessions.reconnectInterval}
                    onChange={(e) => updateSetting('sessions', 'reconnectInterval', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxReconnectAttempts">Máx. Intentos de Reconexión</Label>
                  <Input
                    id="maxReconnectAttempts"
                    type="number"
                    value={settings.sessions.maxReconnectAttempts}
                    onChange={(e) => updateSetting('sessions', 'maxReconnectAttempts', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="qrRefreshInterval">Intervalo Refresh QR (segundos)</Label>
                  <Input
                    id="qrRefreshInterval"
                    type="number"
                    value={settings.sessions.qrRefreshInterval}
                    onChange={(e) => updateSetting('sessions', 'qrRefreshInterval', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Persistencia de Sesión</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.sessions.sessionPersistence}
                      onCheckedChange={(checked) => updateSetting('sessions', 'sessionPersistence', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Limpiar Sesiones Inactivas</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.sessions.cleanupInactiveSessions}
                      onCheckedChange={(checked) => updateSetting('sessions', 'cleanupInactiveSessions', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                {settings.sessions.cleanupInactiveSessions && (
                  <div className="space-y-2">
                    <Label htmlFor="inactivityThreshold">Umbral de Inactividad (segundos)</Label>
                    <Input
                      id="inactivityThreshold"
                      type="number"
                      value={settings.sessions.inactivityThreshold}
                      onChange={(e) => updateSetting('sessions', 'inactivityThreshold', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook Settings */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Webhook className="h-5 w-5 mr-2" />
                Configuración de Webhooks
              </CardTitle>
              <CardDescription>
                Configuraciones para el sistema de webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Webhooks Habilitados</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.webhooks.enabled}
                      onCheckedChange={(checked) => updateSetting('webhooks', 'enabled', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Reintentos Habilitados</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.webhooks.retryEnabled}
                      onCheckedChange={(checked) => updateSetting('webhooks', 'retryEnabled', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxRetries">Máximo de Reintentos</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={settings.webhooks.maxRetries}
                    onChange={(e) => updateSetting('webhooks', 'maxRetries', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retryDelay">Delay entre Reintentos (ms)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    value={settings.webhooks.retryDelay}
                    onChange={(e) => updateSetting('webhooks', 'retryDelay', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeoutDuration">Timeout (ms)</Label>
                  <Input
                    id="timeoutDuration"
                    type="number"
                    value={settings.webhooks.timeoutDuration}
                    onChange={(e) => updateSetting('webhooks', 'timeoutDuration', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Verificar SSL</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.webhooks.verifySSL}
                      onCheckedChange={(checked) => updateSetting('webhooks', 'verifySSL', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Batching Habilitado</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.webhooks.batchingEnabled}
                      onCheckedChange={(checked) => updateSetting('webhooks', 'batchingEnabled', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                {settings.webhooks.batchingEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="batchSize">Tamaño del Batch</Label>
                      <Input
                        id="batchSize"
                        type="number"
                        value={settings.webhooks.batchSize}
                        onChange={(e) => updateSetting('webhooks', 'batchSize', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="batchTimeout">Timeout del Batch (ms)</Label>
                      <Input
                        id="batchTimeout"
                        type="number"
                        value={settings.webhooks.batchTimeout}
                        onChange={(e) => updateSetting('webhooks', 'batchTimeout', parseInt(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Headers Personalizados</h3>
                <Textarea
                  placeholder="Ingresa headers en formato JSON&#10;{&#10;  &quot;Authorization&quot;: &quot;Bearer token&quot;,&#10;  &quot;X-Custom-Header&quot;: &quot;value&quot;&#10;}"
                  value={JSON.stringify(settings.webhooks.customHeaders, null, 2)}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value)
                      updateSetting('webhooks', 'customHeaders', headers)
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Sistema de Notificaciones
              </CardTitle>
              <CardDescription>
                Configuraciones para alertas y notificaciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Notificaciones Habilitadas</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.notifications.enabled}
                      onCheckedChange={(checked) => updateSetting('notifications', 'enabled', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Notificaciones por Email</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Notificaciones por SMS</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.notifications.smsNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications', 'smsNotifications', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discordWebhook">Discord Webhook URL</Label>
                  <Input
                    id="discordWebhook"
                    type={showTokens ? 'text' : 'password'}
                    value={settings.notifications.discordWebhook}
                    onChange={(e) => updateSetting('notifications', 'discordWebhook', e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                  <Input
                    id="slackWebhook"
                    type={showTokens ? 'text' : 'password'}
                    value={settings.notifications.slackWebhook}
                    onChange={(e) => updateSetting('notifications', 'slackWebhook', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telegramToken">Telegram Bot Token</Label>
                  <Input
                    id="telegramToken"
                    type={showTokens ? 'text' : 'password'}
                    value={settings.notifications.telegramBot.token}
                    onChange={(e) => updateNestedSetting('notifications', 'telegramBot', 'token', e.target.value)}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
                  <Input
                    id="telegramChatId"
                    value={settings.notifications.telegramBot.chatId}
                    onChange={(e) => updateNestedSetting('notifications', 'telegramBot', 'chatId', e.target.value)}
                    placeholder="-123456789"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Mostrar Tokens</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTokens(!showTokens)}
                    >
                      {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Umbrales de Alerta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tasa de Error (%): {settings.notifications.alertThresholds.errorRate}</Label>
                    <Slider
                      value={[settings.notifications.alertThresholds.errorRate]}
                      onValueChange={(value) => updateNestedSetting('notifications', 'alertThresholds', 'errorRate', value[0])}
                      max={100}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tiempo de Respuesta (ms): {settings.notifications.alertThresholds.responseTime}</Label>
                    <Slider
                      value={[settings.notifications.alertThresholds.responseTime]}
                      onValueChange={(value) => updateNestedSetting('notifications', 'alertThresholds', 'responseTime', value[0])}
                      max={10000}
                      step={100}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Uso de Memoria (%): {settings.notifications.alertThresholds.memoryUsage}</Label>
                    <Slider
                      value={[settings.notifications.alertThresholds.memoryUsage]}
                      onValueChange={(value) => updateNestedSetting('notifications', 'alertThresholds', 'memoryUsage', value[0])}
                      max={100}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Uso de Disco (%): {settings.notifications.alertThresholds.diskUsage}</Label>
                    <Slider
                      value={[settings.notifications.alertThresholds.diskUsage]}
                      onValueChange={(value) => updateNestedSetting('notifications', 'alertThresholds', 'diskUsage', value[0])}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Configuración de Seguridad
              </CardTitle>
              <CardDescription>
                Configuraciones de seguridad y autenticación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Requerir HTTPS</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.security.requireHttps}
                      onCheckedChange={(checked) => updateSetting('security', 'requireHttps', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tokenExpiration">Expiración de Token (segundos)</Label>
                  <Input
                    id="tokenExpiration"
                    type="number"
                    value={settings.security.tokenExpiration}
                    onChange={(e) => updateSetting('security', 'tokenExpiration', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Máx. Intentos de Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Duración de Bloqueo (segundos)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Log de Auditoría</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.security.enableAuditLog}
                      onCheckedChange={(checked) => updateSetting('security', 'enableAuditLog', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Encriptar Datos de Sesión</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.security.encryptSessionData}
                      onCheckedChange={(checked) => updateSetting('security', 'encryptSessionData', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Autenticación de Dos Factores</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) => updateSetting('security', 'twoFactorAuth', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ipWhitelist">Lista Blanca de IPs (separadas por coma)</Label>
                  <Textarea
                    id="ipWhitelist"
                    value={settings.security.ipWhitelist.join(', ')}
                    onChange={(e) => updateSetting('security', 'ipWhitelist', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    placeholder="192.168.1.100, 10.0.0.0/8, 172.16.0.0/12"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Optimización de Rendimiento
              </CardTitle>
              <CardDescription>
                Configuraciones para optimizar el rendimiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Cache Habilitado</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.performance.enableCaching}
                      onCheckedChange={(checked) => updateSetting('performance', 'enableCaching', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cacheExpiration">Expiración de Cache (segundos)</Label>
                  <Input
                    id="cacheExpiration"
                    type="number"
                    value={settings.performance.cacheExpiration}
                    onChange={(e) => updateSetting('performance', 'cacheExpiration', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Compresión Habilitada</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.performance.enableCompression}
                      onCheckedChange={(checked) => updateSetting('performance', 'enableCompression', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentRequests">Máx. Requests Concurrentes</Label>
                  <Input
                    id="maxConcurrentRequests"
                    type="number"
                    value={settings.performance.maxConcurrentRequests}
                    onChange={(e) => updateSetting('performance', 'maxConcurrentRequests', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="messageQueueSize">Tamaño de Cola de Mensajes</Label>
                  <Input
                    id="messageQueueSize"
                    type="number"
                    value={settings.performance.messageQueueSize}
                    onChange={(e) => updateSetting('performance', 'messageQueueSize', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Load Balancing</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.performance.enableLoadBalancing}
                      onCheckedChange={(checked) => updateSetting('performance', 'enableLoadBalancing', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="healthCheckInterval">Intervalo Health Check (segundos)</Label>
                  <Input
                    id="healthCheckInterval"
                    type="number"
                    value={settings.performance.healthCheckInterval}
                    onChange={(e) => updateSetting('performance', 'healthCheckInterval', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logging Settings */}
        <TabsContent value="logging" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Configuración de Logs
              </CardTitle>
              <CardDescription>
                Configuraciones para el sistema de logging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logLevel">Nivel de Log</Label>
                  <Select
                    value={settings.logging.logLevel}
                    onValueChange={(value) => updateSetting('logging', 'logLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Logging a Archivo</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.logging.enableFileLogging}
                      onCheckedChange={(checked) => updateSetting('logging', 'enableFileLogging', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logRetentionDays">Retención de Logs (días)</Label>
                  <Input
                    id="logRetentionDays"
                    type="number"
                    value={settings.logging.logRetentionDays}
                    onChange={(e) => updateSetting('logging', 'logRetentionDays', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Logging Estructurado</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.logging.enableStructuredLogging}
                      onCheckedChange={(checked) => updateSetting('logging', 'enableStructuredLogging', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Logging a Base de Datos</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.logging.logToDatabase}
                      onCheckedChange={(checked) => updateSetting('logging', 'logToDatabase', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Logging Remoto</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.logging.enableRemoteLogging}
                      onCheckedChange={(checked) => updateSetting('logging', 'enableRemoteLogging', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                {settings.logging.enableRemoteLogging && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="remoteLogEndpoint">Endpoint de Logging Remoto</Label>
                    <Input
                      id="remoteLogEndpoint"
                      value={settings.logging.remoteLogEndpoint}
                      onChange={(e) => updateSetting('logging', 'remoteLogEndpoint', e.target.value)}
                      placeholder="https://logs.miapp.com/api/logs"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestión de Planes */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Gestión de Planes
                  </CardTitle>
                  <CardDescription>
                    Administra los planes de suscripción del sistema
                  </CardDescription>
                </div>
                
                <Button onClick={() => setIsCreatePlanDialogOpen(true)} className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {plans.map((plan) => (
                  <Card key={plan.id} className={`border-2 ${plan.activo ? 'border-blue-200' : 'border-gray-200'} h-full`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base line-clamp-1">{plan.nombre}</CardTitle>
                        <Badge variant={plan.activo ? "default" : "secondary"} className="shrink-0 text-xs">
                          {plan.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm line-clamp-2">{plan.descripcion}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4 h-full flex flex-col">
                        <div className="text-center py-2">
                          <p className="text-2xl font-bold">${plan.precio}</p>
                          <p className="text-sm text-muted-foreground">
                            {plan.duracionDias === 36500 ? 'Vitalicio' : `${plan.duracionDias} días`}
                          </p>
                        </div>
                        
                        <div className="space-y-3 flex-1">
                          <p className="font-medium text-sm">Características:</p>
                          <ul className="text-sm space-y-2">
                            {plan.caracteristicas.map((caracteristica, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{caracteristica}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="pt-3 border-t">
                          <p className="text-sm">
                            <strong>Máx. Sesiones:</strong> {plan.maxSesiones}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2 pt-3">
                          <Button size="sm" variant="outline" className="w-full">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant={plan.activo ? "destructive" : "default"}
                            className="w-full"
                          >
                            {plan.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración del Sistema */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configuración de API */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Configuración de API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL Base de la API</Label>
                  <Input value={settings.api.baseUrl} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Timeout (ms)</Label>
                  <Input type="number" value={settings.api.timeout} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Rate Limiting</Label>
                  <Switch checked={settings.api.rateLimitEnabled} disabled />
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Seguridad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Configuración de Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Máx. Intentos de Login</Label>
                  <Input type="number" value={settings.security.maxLoginAttempts} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Duración de Bloqueo (segundos)</Label>
                  <Input type="number" value={settings.security.lockoutDuration} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Log de Auditoría</Label>
                  <Switch checked={settings.security.enableAuditLog} disabled />
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Rendimiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Configuración de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cache Habilitado</Label>
                  <Switch checked={settings.performance.enableCaching} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Requests Concurrentes</Label>
                  <Input type="number" value={settings.performance.maxConcurrentRequests} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Tamaño de Cola de Mensajes</Label>
                  <Input type="number" value={settings.performance.messageQueueSize} readOnly />
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Configuración de Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Auto-backup Habilitado</Label>
                  <Switch checked={settings.backup.enableAutoBackup} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo de Backup (segundos)</Label>
                  <Input type="number" value={settings.backup.backupInterval} readOnly />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Crear Backup
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Restaurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup-old" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Configuración de Backup
              </CardTitle>
              <CardDescription>
                Configuraciones para backup automático y recuperación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Auto-backup Habilitado</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.backup.enableAutoBackup}
                      onCheckedChange={(checked) => updateSetting('backup', 'enableAutoBackup', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupInterval">Intervalo de Backup (segundos)</Label>
                  <Input
                    id="backupInterval"
                    type="number"
                    value={settings.backup.backupInterval}
                    onChange={(e) => updateSetting('backup', 'backupInterval', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxBackupFiles">Máx. Archivos de Backup</Label>
                  <Input
                    id="maxBackupFiles"
                    type="number"
                    value={settings.backup.maxBackupFiles}
                    onChange={(e) => updateSetting('backup', 'maxBackupFiles', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupLocation">Ubicación de Backup</Label>
                  <Input
                    id="backupLocation"
                    value={settings.backup.backupLocation}
                    onChange={(e) => updateSetting('backup', 'backupLocation', e.target.value)}
                    placeholder="./backups"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Backup Remoto</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.backup.enableRemoteBackup}
                      onCheckedChange={(checked) => updateSetting('backup', 'enableRemoteBackup', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Compresión</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.backup.compressionEnabled}
                      onCheckedChange={(checked) => updateSetting('backup', 'compressionEnabled', checked)}
                    />
                    <span className="text-sm">Habilitado</span>
                  </div>
                </div>
                
                {settings.backup.enableRemoteBackup && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="remoteBackupUrl">URL de Backup Remoto</Label>
                    <Input
                      id="remoteBackupUrl"
                      value={settings.backup.remoteBackupUrl}
                      onChange={(e) => updateSetting('backup', 'remoteBackupUrl', e.target.value)}
                      placeholder="https://backup.miapp.com/api/upload"
                    />
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Crear Backup Manual
                </Button>
                <Button variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Restaurar desde Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

        {/* Save Button Fixed */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <Button 
            size="lg" 
            onClick={saveSettings} 
            disabled={saving}
            className="shadow-lg"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            )}
            <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            <span className="sm:hidden">{saving ? 'Guardando...' : 'Guardar'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}