'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  RefreshCw, 
  Plus, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  QrCode
} from 'lucide-react'
import { baileysAPI } from '@/lib/api'

// Tipo para respuestas de API
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface Session {
  id: string;
  status?: 'authenticated' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected';
  lastUpdate?: Date;
}

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const { toast } = useToast()

  // Cargar sesiones al montar el componente
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await baileysAPI.listSessions()
      
      if (response.success && Array.isArray(response.data)) {
        const sessionList = response.data.map((id: string) => ({ id }))
        setSessions(sessionList)
        
        // Obtener estado de cada sesión
        await Promise.all(
          sessionList.map(async (session) => {
            try {
              const statusResponse = await baileysAPI.getSessionStatus(session.id)
              if (statusResponse.success) {
                setSessions(prev => 
                  prev.map(s => 
                    s.id === session.id 
                      ? { ...s, status: statusResponse.data.status, lastUpdate: new Date() }
                      : s
                  )
                )
              }
            } catch (error) {
              console.error(`Error getting status for session ${session.id}:`, error)
            }
          })
        )
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las sesiones',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createSession = async () => {
    try {
      setCreating(true)
      const sessionId = `session_${Date.now()}`
      
      const response = await baileysAPI.createSession({
        id: sessionId,
        typeAuth: 'qr'
      })

      if (response.success) {
        toast({
          title: 'Sesión creada',
          description: 'Escanea el código QR para conectar WhatsApp',
        })
        
        // Agregar nueva sesión y mostrar QR
        const newSession: Session = {
          id: sessionId,
          status: 'connecting',
          lastUpdate: new Date()
        }
        setSessions(prev => [...prev, newSession])
        
        if (response.data && typeof response.data === 'object' && 'qr' in response.data) {
          const data = response.data as { qr?: string }
          if (data.qr) {
            showQRModal(data.qr, sessionId)
          }
        }
      }
    } catch (error) {
      console.error('Error creating session:', error)
      toast({
        title: 'Error',
        description: 'No se pudo crear la sesión',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await baileysAPI.deleteSession(sessionId)
      
      if (response.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        toast({
          title: 'Sesión eliminada',
          description: 'La sesión ha sido eliminada correctamente',
        })
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la sesión',
        variant: 'destructive'
      })
    }
  }

  const showQRModal = (qrCode: string, sessionId: string) => {
    // Crear modal para mostrar QR
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4 dark:text-white">Escanear código QR</h3>
        <div class="flex justify-center mb-4">
          <img src="${qrCode}" alt="QR Code" class="max-w-full border rounded" />
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Abre WhatsApp en tu teléfono y escanea este código QR para conectar la sesión "${sessionId}"
        </p>
        <button id="close-qr-modal" class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
          Cerrar
        </button>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Cerrar modal
    const closeBtn = modal.querySelector('#close-qr-modal')
    closeBtn?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    // Cerrar con ESC
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal)
        document.removeEventListener('keydown', handleEsc)
      }
    }
    document.addEventListener('keydown', handleEsc)
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'authenticated': return 'bg-green-500'
      case 'connected': return 'bg-blue-500'
      case 'connecting': return 'bg-yellow-500'
      case 'disconnecting': return 'bg-orange-500'
      case 'disconnected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'authenticated': return <CheckCircle className="h-4 w-4" />
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'connecting': return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'disconnecting': return <AlertCircle className="h-4 w-4" />
      case 'disconnected': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Gestión de Sesiones WhatsApp</span>
            </CardTitle>
            <CardDescription>
              Administra tus conexiones de WhatsApp
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSessions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              onClick={createSession}
              disabled={creating}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sesión
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay sesiones activas</p>
            <p className="text-sm">Crea una nueva sesión para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded-full ${getStatusColor(session.status)}`}>
                    <div className="text-white">
                      {getStatusIcon(session.status)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">{session.id}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {session.status || 'Desconocido'}
                      </Badge>
                      {session.lastUpdate && (
                        <span className="text-xs text-gray-500">
                          {session.lastUpdate.toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSession(session.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
