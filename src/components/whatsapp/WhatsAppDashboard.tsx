'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SessionManager } from './SessionManager'
import { MessageSender } from './MessageSender'
import { ChatList } from './ChatList'
import { 
  Smartphone, 
  Send, 
  MessageSquare, 
  Settings,
  Zap
} from 'lucide-react'
import { baileysAPI } from '@/lib/api'

interface Session {
  id: string;
  status?: string;
}

export function WhatsAppDashboard() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [sessionStatus, setSessionStatus] = useState<string>('')

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      checkSessionStatus()
      // Verificar estado cada 30 segundos
      const interval = setInterval(checkSessionStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [selectedSession])

  const loadSessions = async () => {
    try {
      const response = await baileysAPI.listSessions()
      if (response.success) {
        const sessionList = response.data.map((id: string) => ({ id }))
        setSessions(sessionList)
        
        // Seleccionar primera sesión automáticamente
        if (sessionList.length > 0 && !selectedSession) {
          setSelectedSession(sessionList[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const checkSessionStatus = async () => {
    if (!selectedSession) return
    
    try {
      const response = await baileysAPI.getSessionStatus(selectedSession)
      if (response.success) {
        setSessionStatus(response.data.status)
      }
    } catch (error) {
      console.error('Error checking session status:', error)
      setSessionStatus('disconnected')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authenticated': return 'bg-green-500'
      case 'connected': return 'bg-blue-500'
      case 'connecting': return 'bg-yellow-500'
      case 'disconnecting': return 'bg-orange-500'
      case 'disconnected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'authenticated': return 'Autenticado'
      case 'connected': return 'Conectado'
      case 'connecting': return 'Conectando...'
      case 'disconnecting': return 'Desconectando...'
      case 'disconnected': return 'Desconectado'
      default: return 'Desconocido'
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                <span className="text-lg md:text-xl">WhatsApp Business Dashboard</span>
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Gestiona tus sesiones y mensajes de WhatsApp desde un solo lugar
              </CardDescription>
            </div>
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              {/* Selector de sesión */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sesión:</span>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Seleccionar sesión" />
                  </SelectTrigger>
                  <SelectContent>
                  {sessions.length === 0 ? (
                  <SelectItem value="none" disabled>
                  No hay sesiones
                  </SelectItem>
                  ) : (
                  sessions
                  .filter(session => session.id && session.id.trim() !== '')
                  .map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                      {session.id}
                      </SelectItem>
                      ))
                      )}
                    </SelectContent>
                </Select>
              </div>

              {/* Estado de la sesión */}
              {selectedSession && sessionStatus && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(sessionStatus)}`} />
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(sessionStatus)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contenido principal */}
      <Tabs defaultValue="chats" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="chats" className="flex flex-col items-center space-y-1 p-3 md:flex-row md:space-y-0 md:space-x-2 md:p-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs md:text-sm">Chats</span>
          </TabsTrigger>
          <TabsTrigger value="send" className="flex flex-col items-center space-y-1 p-3 md:flex-row md:space-y-0 md:space-x-2 md:p-2">
            <Send className="h-4 w-4" />
            <span className="text-xs md:text-sm">Enviar</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex flex-col items-center space-y-1 p-3 md:flex-row md:space-y-0 md:space-x-2 md:p-2">
            <Smartphone className="h-4 w-4" />
            <span className="text-xs md:text-sm">Sesiones</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Lista de chats y conversaciones */}
        <TabsContent value="chats">
          <ChatList sessionId={selectedSession} />
        </TabsContent>

        {/* Tab: Enviar mensajes */}
        <TabsContent value="send">
          <div className="grid gap-6">
            <MessageSender 
              sessionId={selectedSession}
              onSessionChange={setSelectedSession}
            />
          </div>
        </TabsContent>

        {/* Tab: Gestión de sesiones */}
        <TabsContent value="sessions">
          <div className="grid gap-6">
            <SessionManager />
            
            {/* Información de la sesión seleccionada */}
            {selectedSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Información de la Sesión</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID de Sesión</label>
                      <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        {selectedSession}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estado</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(sessionStatus)}`} />
                        <span className="text-sm">{getStatusText(sessionStatus)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {sessionStatus === 'authenticated' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          ✅ WhatsApp conectado y listo para usar
                        </span>
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                        Puedes enviar mensajes y gestionar chats desde las pestañas correspondientes.
                      </p>
                    </div>
                  )}

                  {sessionStatus === 'connecting' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                          🔄 Conectando a WhatsApp...
                        </span>
                      </div>
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                        Asegúrate de haber escaneado el código QR con tu teléfono.
                      </p>
                    </div>
                  )}

                  {(sessionStatus === 'disconnected' || !sessionStatus) && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-red-800 dark:text-red-200 font-medium">
                          ❌ WhatsApp desconectado
                        </span>
                      </div>
                      <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                        La sesión no está conectada. Crea una nueva sesión o reconecta la existente.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{sessions.length}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sesiones Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {sessionStatus === 'authenticated' ? 'Activo' : 'Inactivo'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estado Actual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Listo</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Para Enviar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional para testing del scroll */}
      <Card>
        <CardHeader>
          <CardTitle>📱 Información de la Integración WhatsApp</CardTitle>
          <CardDescription>
            Tu integración está lista para usar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">✅ Funcionalidades Disponibles</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Gestión completa de sesiones</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Envío de mensajes de texto</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Envío de imágenes y videos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Envío de documentos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Envío de ubicaciones</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Encuestas y reacciones</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Gestión de chats y grupos</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">🚀 Comenzar a Usar</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h5 className="font-medium mb-1">1. Crear Sesión</h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ve a la pestaña "Sesiones" y crea una nueva sesión
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h5 className="font-medium mb-1">2. Escanear QR</h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    Escanea el código QR con tu WhatsApp
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h5 className="font-medium mb-1">3. Enviar Mensajes</h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ve a "Enviar" y comienza a enviar mensajes
                  </p>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
