'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Webhook, Bell, Activity, Users } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { sessionsAPI } from '@/lib/api'
import WebhookManager from '@/components/webhooks/WebhookManagerClean'

interface SessionOption {
  id: string
  status: string
  authenticated: boolean
  nombresesion?: string | null
  phoneNumber?: string | null
}

export default function WebhooksPage() {
  const { user } = useAuthStore()
  const { suscripcion, resourceLimits, loading: planLoading } = usePlanLimits()
  const [sessions, setSessions] = useState<SessionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('manager')

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await sessionsAPI.list()
      
      if (response.success && response.data) {
        const sessionPromises = response.data.map(async (sessionId: string) => {
          try {
            const statusResponse = await sessionsAPI.status(sessionId)
            return {
              id: sessionId,
              status: statusResponse.success ? statusResponse.data.status : 'unknown',
              authenticated: statusResponse.success ? statusResponse.data.authenticated || false : false,
              nombresesion: statusResponse.success ? statusResponse.data.nombresesion : null,
              phoneNumber: statusResponse.success ? statusResponse.data.phoneNumber : null,
            }
          } catch (error) {
            return {
              id: sessionId,
              status: 'error',
              authenticated: false,
              nombresesion: null,
              phoneNumber: null,
            }
          }
        })

        const sessionsWithStatus = await Promise.all(sessionPromises)
        // 🔧 CORRECCIÓN: Filtrar solo sesiones válidas y con datos completos
        const validSessions = sessionsWithStatus.filter(session => 
          session && 
          session.id && 
          typeof session.id === 'string' && 
          session.id.trim() !== ''
        )
        setSessions(validSessions)
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

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  if (planLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Cargando sistema de webhooks...</p>
        </div>
      </div>
    )
  }

  if (!suscripcion || !resourceLimits) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-6 text-center">
            <Webhook className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-900 dark:text-amber-100 mb-2">
              Plan Requerido
            </h3>
            <p className="text-amber-800 dark:text-amber-200">
              Necesitas una suscripción activa para acceder al sistema de webhooks.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Sistema de Webhooks
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Configura y gestiona webhooks para recibir notificaciones de WhatsApp en tiempo real
            </p>
          </div>
        </div>



        {/* Navegación de tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Gestión de Webhooks
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Resumen del Plan
            </TabsTrigger>
          </TabsList>

          {/* Tab: Gestión de Webhooks */}
          <TabsContent value="manager" className="space-y-6">
            <WebhookManager sessions={sessions} />
          </TabsContent>

          {/* Tab: Resumen del Plan */}
          <TabsContent value="overview" className="space-y-6">
            {/* Información adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Sesiones Disponibles
                  </CardTitle>
                  <CardDescription>
                    Lista de sesiones de WhatsApp para configurar webhooks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      No hay sesiones configuradas
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div 
                          key={session.id} 
                          className="flex items-center justify-between p-2 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {session.nombresesion || session.id}
                            </p>
                            {session.phoneNumber && (
                              <p className="text-sm text-gray-500">
                                {session.phoneNumber}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className={`inline-block w-2 h-2 rounded-full ${
                                session.authenticated ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            />
                            <span className="text-xs text-gray-500">
                              {session.authenticated ? 'Conectada' : 'Desconectada'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    Eventos de Webhook
                  </CardTitle>
                  <CardDescription>
                    Tipos de eventos que puedes recibir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>MESSAGES_UPSERT</span>
                      <span className="text-green-600">✓ Recomendado</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>CONNECTION_UPDATE</span>
                      <span className="text-blue-600">ℹ️ Útil</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>MESSAGES_DELETE</span>
                      <span className="text-gray-600">○ Opcional</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>CHATS_UPSERT</span>
                      <span className="text-gray-600">○ Opcional</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ALL</span>
                      <span className="text-yellow-600">⚠️ Mucho tráfico</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}