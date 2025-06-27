'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, CreditCard, Smartphone, Wifi, WifiOff, MessageSquare, Bell, Plus, BarChart3, Trash2, Link, CheckCircle, XCircle, AlertCircle, Activity, Lock, Clipboard, Key, Camera, Phone, Signal, Copy, Power, Globe, Shield } from '@/components/ui/icons'
import { toast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

// Importar APIs después de las otras importaciones
import { sessionsAPI, webhooksAPI, utilsAPI, authAPI } from '@/lib/api'

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
  const [previousSessions, setPreviousSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [sessionHealthMonitoring, setSessionHealthMonitoring] = useState(true)
  const [disappearedSessions, setDisappearedSessions] = useState<string[]>([])
  
  // Form states
  const [sessionName, setSessionName] = useState('')
  const [authType, setAuthType] = useState<'qr' | 'code'>('qr')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  
  // Estados para código de verificación
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null) // CORREGIDO: Usar sessionId en lugar de sessionName
  const [verificationSessionName, setVerificationSessionName] = useState<string | null>(null) // Solo para mostrar en UI
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

  useEffect(() => {
    loadSessions()
    // OPTIMIZADO: Refrescar cada 45 segundos para mejor rendimiento
    const interval = setInterval(loadSessions, 45000)
    
    // Monitoreo de salud cada 3 minutos (menos agresivo para reducir carga)
    const healthInterval = setInterval(monitorSessionHealth, 180000)
    
    return () => {
      clearInterval(interval)
      clearInterval(healthInterval)
    }
  }, [])
  
  // Monitorear cuando las sesiones cambian para detectar desapariciones
  useEffect(() => {
    if (sessions.length > 0 && previousSessions.length > 0) {
      detectSessionDisappearance(sessions, previousSessions)
    }
    setPreviousSessions(sessions)
  }, [sessions])
  
  // Timer para el código de verificación (CORREGIDO)
  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (codeExpiryTime && verificationCode) {
      timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((codeExpiryTime - Date.now()) / 1000))
        setTimeRemaining(remaining)
        
        if (remaining <= 0) {
          console.log('[TIMER] Código expirado - manteniendo ventana abierta')
          // ✅ NO cerrar ventana - solo limpiar timer
          setCodeExpiryTime(null)
          setCodeCopied(false)
          clearInterval(timer)
          // La ventana permanece abierta con timeRemaining en 0
          // El botón "Nuevo Código" se habilitará automáticamente
        }
      }, 1000)
    }
    
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [codeExpiryTime, verificationCode])
  
  // Timer para monitorear estado en tiempo real del modal (CORREGIDO - USA SESSION ID)
  // ✅ PROBLEMA SOLUCIONADO: Usar sessionId real en lugar de sessionName para el polling
  useEffect(() => {
    let statusInterval: NodeJS.Timeout
    let rateLimitBackoff = 1000
    let consecutiveErrors = 0
    let errorType: string | null = null
    
    // CORREGIDO: Usar verificationSessionId en lugar de verificationSessionName
    if (verificationSessionId && verificationCode) {
      console.log(`[MODAL-STATUS] Iniciando monitoreo optimizado para sessionId: ${verificationSessionId} (nombre: ${verificationSessionName})`)
      
      statusInterval = setInterval(async () => {
        try {
          // CORREGIDO: Usar sessionId para el polling
          const statusResponse = await sessionsAPI.status(verificationSessionId)
          
          rateLimitBackoff = 1000
          consecutiveErrors = 0
          errorType = null
          
          if (statusResponse.success && statusResponse.data) {
            const currentStatus = statusResponse.data.status
            const isAuthenticated = statusResponse.data.authenticated
            
            console.log(`[MODAL-STATUS] ${verificationSessionId}: ${currentStatus}, auth: ${isAuthenticated}`)
            
            setModalSessionStatus(currentStatus)
            setModalSessionAuthenticated(isAuthenticated || false)
            
            if (currentStatus === 'authenticated' && isAuthenticated) {
              console.log(`[MODAL-STATUS] ✅ Sesión autenticada - cerrando modal automáticamente`)
              
              toast({
                title: "✅ ¡Autenticación Exitosa!",
                description: `La sesión ${verificationSessionName} se ha autenticado correctamente.`,
                duration: 5000,
              })
              
              setVerificationCode(null)
              setVerificationSessionId(null)
              setVerificationSessionName(null)
              setVerificationPhoneNumber(null)
              setCodeExpiryTime(null)
              setCodeCopied(false)
              setModalSessionStatus('connecting')
              setModalSessionAuthenticated(false)
              
              await loadSessions()
              clearInterval(statusInterval)
            }
          }
        } catch (error) {
          if (error instanceof Error) {
            const currentErrorType = error.message.includes('Session not found') ? 'session_not_found' :
                                   error.message.includes('Demasiadas peticiones') ? 'rate_limit' :
                                   error.message.includes('Too many requests') ? 'rate_limit' : 'unknown'
            
            if (currentErrorType === errorType) {
              consecutiveErrors++
            } else {
              consecutiveErrors = 1
              errorType = currentErrorType
            }
            
            console.log(`[MODAL-STATUS] Error ${currentErrorType} (consecutivo #${consecutiveErrors}):`, error.message)
            
            if (currentErrorType === 'rate_limit') {
              console.log(`[MODAL-STATUS] ⚠️ Rate limiting detectado - aplicando backoff de ${rateLimitBackoff}ms`)
              rateLimitBackoff = Math.min(rateLimitBackoff * 2, 30000)
              setTimeout(() => {
                console.log(`[MODAL-STATUS] Reanudando después de backoff`)
              }, rateLimitBackoff)
              return
            }
            
            if (currentErrorType === 'session_not_found') {
              if (consecutiveErrors >= 3) {
                console.log(`[MODAL-STATUS] ✅ Sesión ${verificationSessionId} definitivamente eliminada del backend después de ${consecutiveErrors} intentos - DETENIENDO MONITOREO`)
                setModalSessionStatus('disconnected')
                setModalSessionAuthenticated(false)
                clearInterval(statusInterval)
                
                toast({
                  title: "🔄 Sesión No Encontrada",
                  description: `Sesión "${verificationSessionName}" no se encuentra en el backend. Usa "Nuevo Código" para recrear.`,
                  duration: 8000,
                })
                return
              } else {
                console.log(`[MODAL-STATUS] ⚠️ Sesión no encontrada (intento ${consecutiveErrors}/3) - continuando monitoreo`)
                return
              }
            }
          }
          
          if (consecutiveErrors >= 2) {
            console.warn(`[MODAL-STATUS] Error persistente verificando estado (${consecutiveErrors} veces):`, error)
          }
        }
      }, 10000)
    }
    
    return () => {
      if (statusInterval) {
        console.log(`[MODAL-STATUS] Deteniendo monitoreo de estado`)
        clearInterval(statusInterval)
      }
    }
  }, [verificationSessionId, verificationCode]) // CORREGIDO: Dependencia en sessionId
  
  // === FUNCIONES DE GESTIÓN ROBUSTA DE SESIONES (OPTIMIZADAS) ===
  
  // Función para manejar errores de estado de sesión de manera inteligente
  const handleSessionStatusError = (sessionId: string, error: Error, context: string) => {
    const errorType = error.message.includes('Session not found') ? 'session_not_found' :
                     error.message.includes('Demasiadas peticiones') ? 'rate_limit' :
                     error.message.includes('Too many requests') ? 'rate_limit' :
                     error.message.includes('Network') ? 'network' : 'unknown'
    
    console.log(`[ERROR-HANDLER] ${context} - Sesión ${sessionId}: ${errorType} - ${error.message}`)
    
    // Retornar información sobre cómo manejar el error
    return {
      type: errorType,
      shouldRetry: errorType === 'network' || errorType === 'rate_limit',
      shouldShowToast: errorType !== 'session_not_found', // No mostrar toast inmediatamente para session_not_found
      retryDelay: errorType === 'rate_limit' ? 5000 : 2000,
      message: {
        'session_not_found': 'Sesión no encontrada en el backend',
        'rate_limit': 'Demasiadas peticiones - reintentando automáticamente',
        'network': 'Error de conexión - verificando conectividad',
        'unknown': 'Error desconocido al verificar estado'
      }[errorType] || 'Error desconocido'
    }
  }
  
  // Función para mostrar notificación de error solo cuando es necesario
  const showSessionErrorNotification = (sessionId: string, errorInfo: any, consecutiveCount: number = 1) => {
    // Solo mostrar notificación después de varios errores consecutivos
    if (consecutiveCount < 3 && errorInfo.type === 'session_not_found') {
      return // No mostrar aún
    }
    
    const title = {
      'session_not_found': '⚠️ Sesión No Encontrada',
      'rate_limit': '🔄 Límite de Peticiones',
      'network': '📡 Error de Conexión',
      'unknown': '❌ Error de Estado'
    }[errorInfo.type] || '❌ Error'
    
    const description = errorInfo.type === 'session_not_found' 
      ? `La sesión "${sessionId}" no se encuentra en el backend después de ${consecutiveCount} intentos.`
      : `${errorInfo.message} (intento ${consecutiveCount})`
    
    toast({
      title,
      description,
      variant: errorInfo.type === 'session_not_found' ? 'default' : 'destructive',
      duration: errorInfo.type === 'session_not_found' ? 6000 : 4000,
    })
  }
  
  // Función para limpiar sesiones problemáticas cuando hay conflictos (ACTUALIZADA)
  const cleanProblematicSessions = async (phoneNumber?: string) => {
    console.log('[CLEAN-PROBLEMATIC] Usando limpieza inteligente (solo sesiones activas)...')
    
    // Usar la nueva función de limpieza inteligente
    return await cleanActiveSessionsOnly()
  }
  
  // Función para obtener sesiones del usuario autenticado
  const getUserSessions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      console.log('[USER-SESSIONS] Obteniendo sesiones del usuario...')
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/sesiones/user?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          // No hay sesiones, es normal
          return {
            success: true,
            data: { sesiones: [], total: 0, activas: 0 },
            message: 'No hay sesiones existentes'
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[USER-SESSIONS] Sesiones obtenidas:', data)
      
      return {
        success: true,
        data: data.data || { sesiones: [], total: 0, activas: 0 },
        message: data.message || 'Sesiones obtenidas exitosamente'
      }
    } catch (error) {
      console.error('[USER-SESSIONS] Error obteniendo sesiones:', error)
      return {
        success: false,
        data: { sesiones: [], total: 0, activas: 0 },
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }
  
  // Función para verificar estado de una sesión específica
  const getSessionStatusRobust = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      console.log(`[SESSION-STATUS] Verificando estado de ${sessionId}...`)
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/sesiones/${sessionId}/status?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            data: { status: 'not_found', authenticated: false },
            message: 'Sesión no encontrada'
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`[SESSION-STATUS] Estado de ${sessionId}:`, data)
      
      return {
        success: true,
        data: data.data || { status: 'unknown', authenticated: false },
        message: data.message || 'Estado obtenido exitosamente'
      }
    } catch (error) {
      console.error(`[SESSION-STATUS] Error verificando estado de ${sessionId}:`, error)
      return {
        success: false,
        data: { status: 'error', authenticated: false },
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }
  
  // Función para eliminar una sesión específica del usuario
  const deleteUserSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      console.log(`[DELETE-SESSION] Eliminando sesión ${sessionId}...`)
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/sesiones/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: token,
          sesionId: sessionId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`[DELETE-SESSION] Sesión ${sessionId} eliminada:`, data)
      
      return {
        success: true,
        data: data.data,
        message: data.message || 'Sesión eliminada exitosamente'
      }
    } catch (error) {
      console.error(`[DELETE-SESSION] Error eliminando sesión ${sessionId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }
  
  // Función para limpiar SOLO sesiones activas (INTELIGENTE - NO elimina sesiones ya eliminadas)
  const cleanActiveSessionsOnly = async () => {
    console.log('[CLEAN-ACTIVE] === INICIANDO LIMPIEZA INTELIGENTE DE SESIONES ACTIVAS ===')
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      // Esperar para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const userSessionsResult = await getUserSessions()
      
      if (!userSessionsResult.success) {
        console.log('[CLEAN-ACTIVE] No se pudieron obtener sesiones')
        return { success: true, cleaned: 0, total: 0, message: 'No hay sesiones para limpiar' }
      }
      
      const allSessions = userSessionsResult.data.sesiones || []
      
      // FILTRAR: Solo sesiones que NO están eliminadas
      const activeSessions = allSessions.filter(session => {
        const estado = session.estadoSesion || 'unknown'
        const isActive = !['eliminada', 'deleted', 'removed'].includes(estado.toLowerCase())
        
        console.log(`[CLEAN-ACTIVE] Sesión ${session.nombresesion} (${session.id}): estado="${estado}" - ${isActive ? 'ACTIVA (se eliminará)' : 'YA ELIMINADA (se omite)'}`)
        
        return isActive
      })
      
      console.log(`[CLEAN-ACTIVE] De ${allSessions.length} sesiones totales, ${activeSessions.length} están activas y se eliminarán`)
      
      if (activeSessions.length === 0) {
        console.log('[CLEAN-ACTIVE] No hay sesiones activas para eliminar')
        return {
          success: true,
          cleaned: 0,
          total: allSessions.length,
          message: `Se encontraron ${allSessions.length} sesiones pero todas ya estaban eliminadas`
        }
      }
      
      // Eliminar solo las sesiones ACTIVAS
      let cleanedCount = 0
      const cleanResults = []
      
      for (const session of activeSessions) {
        try {
          // Delay entre eliminaciones
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          console.log(`[CLEAN-ACTIVE] Eliminando sesión ACTIVA: ${session.nombresesion} (ID: ${session.id}, Estado: ${session.estadoSesion})`)
          
          const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/sesiones/delete`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              token: token,
              sesionId: session.id
            })
          })
          
          if (response.ok) {
            cleanedCount++
            console.log(`[CLEAN-ACTIVE] ✅ Sesión ${session.nombresesion} eliminada exitosamente`)
            cleanResults.push({
              sessionId: session.id,
              sessionName: session.nombresesion,
              success: true,
              message: 'Eliminada exitosamente'
            })
          } else {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
            console.log(`[CLEAN-ACTIVE] ⚠️ Error eliminando ${session.nombresesion}: ${errorData.message}`)
            cleanResults.push({
              sessionId: session.id,
              sessionName: session.nombresesion,
              success: false,
              message: errorData.message || 'Error desconocido'
            })
          }
        } catch (sessionError) {
          console.log(`[CLEAN-ACTIVE] ❌ Error eliminando sesión ${session.nombresesion}:`, sessionError)
          cleanResults.push({
            sessionId: session.id,
            sessionName: session.nombresesion,
            success: false,
            message: sessionError instanceof Error ? sessionError.message : 'Error desconocido'
          })
        }
      }
      
      console.log(`[CLEAN-ACTIVE] === LIMPIEZA INTELIGENTE COMPLETADA: ${cleanedCount}/${activeSessions.length} sesiones activas eliminadas ===`)
      
      return {
        success: true,
        message: cleanedCount > 0 
          ? `${cleanedCount} sesión(es) activa(s) eliminada(s) exitosamente` 
          : 'No se pudieron eliminar las sesiones activas',
        cleaned: cleanedCount,
        total: activeSessions.length,
        skipped: allSessions.length - activeSessions.length,
        details: cleanResults
      }
      
    } catch (error) {
      console.error('[CLEAN-ACTIVE] Error en limpieza inteligente:', error)
      return {
        success: false,
        message: 'Error durante la limpieza inteligente',
        error: error instanceof Error ? error.message : 'Error desconocido',
        cleaned: 0
      }
    }
  }
  
  // Función para detectar cuando sesiones autenticadas desaparecen inesperadamente
  const detectSessionDisappearance = (currentSessions: Session[], previousSessions: Session[]) => {
    const currentIds = new Set(currentSessions.map(s => s.id))
    const previousIds = new Set(previousSessions.map(s => s.id))
    
    // Buscar sesiones que estaban autenticadas y ahora han desaparecido
    const disappeared = previousSessions.filter(session => 
      (session.status === 'authenticated' || session.status === 'connected') && 
      !currentIds.has(session.id) &&
      !disappearedSessions.includes(session.id) // No reportar la misma sesión múltiples veces
    )
    
    if (disappeared.length > 0) {
      console.error(`[SESSION-DISAPPEARANCE] 🚨 PROBLEMA CRÍTICO: ${disappeared.length} sesión(es) autenticada(s) desaparecieron inesperadamente:`)
      disappeared.forEach(session => {
        console.error(`[SESSION-DISAPPEARANCE] - Sesión perdida: ${session.id} (estado anterior: ${session.status})`)
      })
      
      // Marcar como reportadas para no duplicar alertas
      setDisappearedSessions(prev => [...prev, ...disappeared.map(s => s.id)])
      
      // Alertar al usuario
      toast({
        title: "⚠️ Sesiones Perdidas",
        description: `${disappeared.length} sesión(es) autenticada(s) desaparecieron del servidor. Esto puede ser un problema del backend.`,
        variant: "destructive",
      })
      
      // Ofrecer recreación automática con toast
      setTimeout(() => {
        toast({
          title: "🔄 Recrear Sesiones Perdidas",
          description: `Se perdieron ${disappeared.length} sesión(es): ${disappeared.map(s => s.id).join(', ')}. ¿Quieres recrearlas automáticamente?`,
          duration: 15000, // 15 segundos para decidir
          action: (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  // Recrear sesiones
                  disappeared.forEach(session => recreateDisappearedSession(session))
                  toast({
                    title: "🔄 Recreando Sesiones",
                    description: `Iniciando recreación de ${disappeared.length} sesión(es)...`,
                    duration: 5000,
                  })
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Recrear
              </button>
              <button 
                onClick={() => {
                  toast({
                    title: "Operación Cancelada",
                    description: "Las sesiones no serán recreadas automáticamente.",
                    duration: 3000,
                  })
                }}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          )
        })
      }, 2000)
    }
    
    // Limpiar lista de sesiones reportadas si ya no están en la lista anterior
    setDisappearedSessions(prev => 
      prev.filter(sessionId => previousIds.has(sessionId))
    )
  }
  
  // Función para recrear una sesión que desapareció
  const recreateDisappearedSession = async (session: Session) => {
    console.log(`[SESSION-RECREATION] Intentando recrear sesión perdida: ${session.id}`)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      // Intentar recrear la sesión con los mismos parámetros
      const response = await sessionsAPI.add({
        nombrebot: session.id,
        typeAuth: session.typeAuth || 'qr',
        phoneNumber: session.phoneNumber
      })
      
      if (response.success) {
        console.log(`[SESSION-RECREATION] ✅ Sesión ${session.id} recreada exitosamente`)
        
        toast({
          title: "Sesión Recreada",
          description: `La sesión ${session.id} ha sido recreada. Necesitarás autenticarla nuevamente.`,
        })
        
        // Recargar sesiones
        await loadSessions()
      } else {
        throw new Error(`No se pudo recrear la sesión: ${response.message || 'Error desconocido'}`)
      }
      
    } catch (error) {
      console.error(`[SESSION-RECREATION] Error recreando sesión ${session.id}:`, error)
      
      toast({
        title: "Error de Recreación",
        description: `No se pudo recrear automáticamente la sesión ${session.id}. Tendrás que crearla manualmente.`,
        variant: "destructive",
      })
    }
  }
  
  // Función para monitoreo continuo de salud de sesiones
  const monitorSessionHealth = async () => {
    if (!sessionHealthMonitoring || sessions.length === 0) {
      return
    }
    
    console.log('[SESSION-HEALTH] Verificando salud de sesiones...')
    
    try {
      // Verificar cada sesión individualmente
      const healthChecks = await Promise.allSettled(
        sessions.map(async (session) => {
          try {
            const statusResponse = await sessionsAPI.status(session.id)
            
            if (!statusResponse.success) {
              console.warn(`[SESSION-HEALTH] Sesión ${session.id} no responde al status check`)
              return { sessionId: session.id, healthy: false, error: 'No response' }
            }
            
            const currentStatus = statusResponse.data.status
            const wasAuthenticated = session.status === 'authenticated'
            const stillExists = currentStatus !== undefined
            
            if (wasAuthenticated && !stillExists) {
              console.error(`[SESSION-HEALTH] 🚨 Sesión ${session.id} estaba autenticada pero ya no existe`)
              return { sessionId: session.id, healthy: false, error: 'Disappeared' }
            }
            
            return { sessionId: session.id, healthy: true, status: currentStatus }
            
          } catch (error) {
            console.warn(`[SESSION-HEALTH] Error verificando ${session.id}:`, error)
            return { sessionId: session.id, healthy: false, error: error instanceof Error ? error.message : 'Unknown' }
          }
        })
      )
      
      const unhealthySessions = healthChecks
        .filter(result => result.status === 'fulfilled' && !result.value.healthy)
        .map(result => result.status === 'fulfilled' ? result.value : null)
        .filter(Boolean)
      
      if (unhealthySessions.length > 0) {
        console.warn(`[SESSION-HEALTH] 🔍 Detectadas ${unhealthySessions.length} sesiones con problemas de salud`)
        
        // Para sesiones que desaparecieron, marcar para recreación potencial
        const disappearedInHealth = unhealthySessions.filter(s => s && s.error === 'Disappeared')
        
        if (disappearedInHealth.length > 0) {
          console.error(`[SESSION-HEALTH] 🚨 ${disappearedInHealth.length} sesiones desaparecieron durante health check`)
        }
      }
      
    } catch (error) {
      console.error('[SESSION-HEALTH] Error en monitoreo de salud:', error)
    }
  }
  
  // Función para iniciar el polling del estado de la sesión (OPTIMIZADO CONTRA RATE LIMITING)
  const startSessionStatusPolling = (sessionName: string) => {
    // NO INICIAR POLLING ADICIONAL - el monitoreo del modal ya maneja esto
    console.log(`[POLLING] Saltando polling adicional para ${sessionName} - usando monitoreo de modal existente`)
    
    // Simplemente mostrar toast de confirmación
    toast({
      title: "🔄 Monitoreando Sesión",
      description: `La sesión "${sessionName}" está siendo monitoreada automáticamente.`,
      duration: 3000,
    })
    
    // Retornar función vacía para compatibilidad
    return () => {}
  }
  
  // Función para solicitar un nuevo código (CORREGIDO - CON LIMPIEZA INTELIGENTE)
  const requestNewCode = async () => {
    if (!verificationSessionName) {
      console.error('[NEW-CODE] No hay sesión activa para renovar código')
      return
    }
    
    if (!verificationPhoneNumber) {
      console.error('[NEW-CODE] No hay número de teléfono guardado')
      toast({
        title: "❌ Error: Número no disponible",
        description: "No se encontró el número de teléfono. Cierra la ventana y crea una nueva sesión.",
        variant: "destructive",
      })
      return
    }
    
    // Prevenir clicks múltiples
    if (requestingNewCode) {
      console.log('[NEW-CODE] Ya hay una solicitud en progreso, ignorando')
      return
    }
    
    setRequestingNewCode(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      console.log(`[NEW-CODE] Iniciando proceso OPTIMIZADO con limpieza para ${verificationSessionName}`)
      
      // PASO 1: LIMPIAR SESIONES ACTIVAS PRIMERO
      console.log('[NEW-CODE] Paso 1: Ejecutando limpieza inteligente de sesiones activas...')
      const cleanResult = await cleanActiveSessionsOnly()
      
      if (cleanResult.cleaned > 0) {
        console.log(`[NEW-CODE] ✅ Limpieza completada: ${cleanResult.cleaned} sesiones activas eliminadas`)
        toast({
          title: "🧹 Sesiones Limpiadas",
          description: `Se eliminaron ${cleanResult.cleaned} sesión(es) activa(s). Generando nuevo código...`,
          duration: 3000,
        })
      } else if (cleanResult.skipped > 0) {
        console.log(`[NEW-CODE] ℹ️ Se omitieron ${cleanResult.skipped} sesiones ya eliminadas`)
      }
      
      // PASO 2: Esperar propagación de la limpieza
      console.log('[NEW-CODE] Paso 2: Esperando propagación de limpieza...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // PASO 3: Crear nueva sesión con código
      console.log('[NEW-CODE] Paso 3: Creando nueva sesión con código')
      
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/sesiones/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: token,
          nombresesion: verificationSessionName,
          lineaWhatsApp: verificationPhoneNumber,
          tipoAuth: 'code',
          crearWebhook: false // No crear webhook para renovación
        })
      })
      
      if (!response.ok) {
        // Manejo específico de rate limiting
        if (response.status === 429) {
          throw new Error('Demasiadas peticiones. Espera 30 segundos antes de intentar nuevamente.')
        }
        
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        
        // Si TODAVÍA existe una sesión activa, hacer limpieza adicional
        if (errorData.message && errorData.message.includes('Ya existe una sesión activa')) {
          console.log('[NEW-CODE] ⚠️ Aún existe sesión activa, ejecutando limpieza adicional...')
          
          // Limpieza adicional más agresiva
          await new Promise(resolve => setTimeout(resolve, 2000))
          const additionalClean = await cleanActiveSessionsOnly()
          console.log(`[NEW-CODE] Limpieza adicional: ${additionalClean.cleaned} sesiones eliminadas`)
          
          throw new Error('Se encontraron sesiones activas. Se limpiaron automáticamente. Intenta nuevamente en unos segundos.')
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const responseData = await response.json()
      
      if (responseData.success) {
        // Buscar código en la respuesta usando el campo correcto
        const newCode = responseData.data?.baileysResponse?.data?.code || 
                       responseData.data?.code ||
                       responseData.code
        
        if (newCode) {
          console.log('[NEW-CODE] ✅ Nuevo código generado:', newCode)
          
          // ✅ SOLUCIÓN: Establecer ID real del nuevo código
          const newSessionId = responseData.data?.sesionId || responseData.data?.id || verificationSessionName
          console.log('[NEW-CODE] ✅ NUEVO SESSION ID REAL:', newSessionId)
          
          // Actualizar estado con nuevo código
          setVerificationCode(newCode)
          setVerificationSessionId(newSessionId)  // ✅ USAR ID REAL
          setCodeExpiryTime(Date.now() + 30000) // 30 segundos
          setTimeRemaining(30)
          setCodeCopied(false)
          setModalSessionStatus('connecting')
          setModalSessionAuthenticated(false)
          
          toast({
            title: "✅ Nuevo Código",
            description: `Código: ${newCode} (válido por 30 segundos)`,
            duration: 5000,
          })
          
        } else {
          throw new Error('No se recibió código en la respuesta')
        }
      } else {
        throw new Error(responseData.message || 'Error creando sesión')
      }
      
    } catch (error) {
      console.error('[NEW-CODE] Error:', error)
      
      let errorMessage = "No se pudo generar un nuevo código"
      if (error instanceof Error) {
        if (error.message.includes('Demasiadas peticiones')) {
          errorMessage = "⚠️ Demasiadas peticiones. Espera 30 segundos e intenta nuevamente."
        } else if (error.message.includes('Rate limit')) {
          errorMessage = "⚠️ Límite de peticiones alcanzado. Espera un momento e intenta nuevamente."
        } else if (error.message.includes('Ya existe una sesión activa')) {
          errorMessage = "🔄 Se encontraron sesiones activas que se limpiaron automáticamente. Intenta nuevamente en 5 segundos."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "❌ Error al generar código",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setRequestingNewCode(false)
      console.log('[NEW-CODE] Proceso finalizado')
    }
  }
  
  // Función para copiar código al portapapeles
  const copyCodeToClipboard = async () => {
    if (!verificationCode) return
    
    try {
      await navigator.clipboard.writeText(verificationCode)
      setCodeCopied(true)
      
      toast({
        title: "Código copiado",
        description: "El código de verificación se ha copiado al portapapeles",
      })
      
      // Resetear el estado de copiado después de 2 segundos
      setTimeout(() => {
        setCodeCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Error copying code:', error)
      
      // Fallback para navegadores que no soportan clipboard API
      try {
        const textArea = document.createElement('textarea')
        textArea.value = verificationCode
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        
        setCodeCopied(true)
        toast({
          title: "Código copiado",
          description: "El código de verificación se ha copiado al portapapeles",
        })
        
        setTimeout(() => {
          setCodeCopied(false)
        }, 2000)
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: "No se pudo copiar el código al portapapeles",
          variant: "destructive",
        })
      }
    }
  }
  
  // Función para cerrar el modal de verificación (CORREGIDA)
  const closeVerificationModal = async (forceClose: boolean = false) => {
    if (verificationSessionName && !forceClose) {
      console.log(`[MODAL-CLOSE] Verificando estado de sesión ${verificationSessionName} antes de eliminar...`)
      
      try {
        // VERIFICAR ESTADO ANTES DE ELIMINAR
        const statusResponse = await sessionsAPI.status(verificationSessionName)
        
        if (statusResponse.success && statusResponse.data) {
          const currentStatus = statusResponse.data.status
          const isAuthenticated = statusResponse.data.authenticated
          
          console.log(`[MODAL-CLOSE] Estado actual: ${currentStatus}, autenticada: ${isAuthenticated}`)
          
          // Si está autenticada o conectada, NO eliminar
          if (currentStatus === 'authenticated' || (currentStatus === 'connected' && isAuthenticated)) {
            console.log(`[MODAL-CLOSE] ✅ Sesión ${verificationSessionName} está autenticada - NO se eliminará`)
            
            toast({
              title: "✅ Sesión Preservada",
              description: `La sesión ${verificationSessionName} está autenticada y se ha conservado.`,
            })
            
            // Solo limpiar el modal, NO eliminar la sesión
            setVerificationCode(null)
            setVerificationSessionName(null)
            setCodeExpiryTime(null)
            setCodeCopied(false)
            
            // Recargar para mostrar la sesión autenticada
            await loadSessions()
            return
          }
          
          // Si está en proceso (connecting, connected pero no authenticated), preguntar al usuario
          if (currentStatus === 'connecting' || (currentStatus === 'connected' && !isAuthenticated)) {
            console.log(`[MODAL-CLOSE] ⚠️ Sesión ${verificationSessionName} en proceso (${currentStatus}) - consultando usuario`)
            
            // Usar toast en lugar de confirm nativo
            const shouldKeep = await new Promise<boolean>((resolve) => {
              toast({
                title: "⚠️ Sesión en Proceso",
                description: `La sesión ${verificationSessionName} está ${currentStatus}. ¿Quieres mantenerla?`,
                action: (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => resolve(true)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Mantener
                    </button>
                    <button 
                      onClick={() => resolve(false)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                )
              })
            })
            
            if (shouldKeep) {
              console.log(`[MODAL-CLOSE] Usuario eligió mantener sesión ${verificationSessionName}`)
              
              // Solo limpiar modal
              setVerificationCode(null)
              setVerificationSessionName(null)
              setCodeExpiryTime(null)
              setCodeCopied(false)
              return
            }
          }
          
          // Solo eliminar si está disconnected o el usuario confirmó
          console.log(`[MODAL-CLOSE] 🗑️ Eliminando sesión ${verificationSessionName} (estado: ${currentStatus})`)
          await sessionsAPI.delete(verificationSessionName)
          
          toast({
            title: "Sesión Eliminada",
            description: `La sesión ${verificationSessionName} ha sido eliminada.`,
          })
          
        } else {
          console.log(`[MODAL-CLOSE] No se pudo verificar estado - eliminando sesión ${verificationSessionName}`)
          await sessionsAPI.delete(verificationSessionName)
        }
        
      } catch (error) {
        console.error(`[MODAL-CLOSE] Error verificando estado de ${verificationSessionName}:`, error)
        
        // Si hay error verificando, asumir que la sesión puede estar autenticada y no eliminar
        console.log(`[MODAL-CLOSE] Por precaución, NO se eliminará la sesión ${verificationSessionName}`)
        
        toast({
          title: "⚠️ Error de Verificación",
          description: "No se pudo verificar el estado. La sesión se ha conservado por precaución.",
          variant: "destructive",
        })
      }
    }
    
    // Limpiar estado del modal
    setVerificationCode(null)
    setVerificationSessionId(null)     // ✅ LIMPIAR ID REAL
    setVerificationSessionName(null)   // ✅ LIMPIAR NOMBRE UI
    setVerificationPhoneNumber(null)   // ✅ LIMPIAR NUMERO TAMBIEN
    setCodeExpiryTime(null)
    setCodeCopied(false)
    setModalSessionStatus('connecting')
    setModalSessionAuthenticated(false)
    
    console.log('[MODAL-CLOSE] Estado del modal limpiado completamente')
    
    // Recargar sesiones
    await loadSessions()
  }

  // Función para verificar inteligentemente si necesita limpiar sesiones existentes
  const checkExistingSessionsIntelligent = async (newSessionName: string) => {
    console.log('[SESSION-CHECK] Verificando sesiones existentes de manera inteligente...')
    
    try {
      const sessionsList = await sessionsAPI.list()
      
      if (!sessionsList.success || !sessionsList.data || sessionsList.data.length === 0) {
        console.log('[SESSION-CHECK] ✓ No hay sesiones existentes')
        return { needsCleanup: false, reason: 'no_sessions' }
      }
      
      console.log(`[SESSION-CHECK] Encontradas ${sessionsList.data.length} sesiones existentes`)
      
      // Verificar el estado de cada sesión existente
      const sessionStates = await Promise.allSettled(
        sessionsList.data.map(async (sessionId: string) => {
          try {
            const statusResponse = await sessionsAPI.status(sessionId)
            return {
              id: sessionId,
              status: statusResponse.success ? statusResponse.data.status : 'unknown',
              authenticated: statusResponse.success ? statusResponse.data.authenticated : false,
              exists: true
            }
          } catch (error) {
            return {
              id: sessionId,
              status: 'not_found',
              authenticated: false,
              exists: false
            }
          }
        })
      )
      
      const sessions = sessionStates
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
      
      console.log('[SESSION-CHECK] Estados de sesiones:', sessions)
      
      // Analizar qué hacer con cada sesión
      const analysis = {
        connected: sessions.filter(s => s.status === 'connected'),
        authenticated: sessions.filter(s => s.status === 'authenticated'),
        disconnected: sessions.filter(s => s.status === 'disconnected' || s.status === 'not_found'),
        connecting: sessions.filter(s => s.status === 'connecting')
      }
      
      console.log('[SESSION-CHECK] Análisis:', analysis)
      
      // Decidir si necesita limpieza
      if (analysis.connected.length > 0) {
        console.log('[SESSION-CHECK] ⚠️ Hay sesiones en estado "connected" - NO limpiar automáticamente')
        return {
          needsCleanup: false,
          reason: 'sessions_in_progress',
          sessions: analysis.connected,
          message: `Hay ${analysis.connected.length} sesión(es) en proceso de conexión. ¿Quieres esperar o crear una nueva?`
        }
      }
      
      if (analysis.connecting.length > 0) {
        console.log('[SESSION-CHECK] ⚠️ Hay sesiones conectando - NO limpiar automáticamente')
        return {
          needsCleanup: false,
          reason: 'sessions_connecting',
          sessions: analysis.connecting,
          message: `Hay ${analysis.connecting.length} sesión(es) iniciando conexión. ¿Quieres esperar o crear una nueva?`
        }
      }
      
      if (analysis.authenticated.length > 0) {
        // Solo limpiar si el nombre es diferente
        const differentName = analysis.authenticated.some(s => s.id !== newSessionName)
        
        if (differentName) {
          console.log('[SESSION-CHECK] Hay sesiones autenticadas con nombres diferentes - se puede limpiar')
          return {
            needsCleanup: true,
            reason: 'different_authenticated_sessions',
            sessions: analysis.authenticated
          }
        } else {
          console.log('[SESSION-CHECK] ✓ Hay sesión autenticada con el mismo nombre - no limpiar')
          return {
            needsCleanup: false,
            reason: 'same_authenticated_session',
            sessions: analysis.authenticated
          }
        }
      }
      
      if (analysis.disconnected.length > 0) {
        console.log('[SESSION-CHECK] Hay sesiones desconectadas - se pueden limpiar')
        return {
          needsCleanup: true,
          reason: 'disconnected_sessions',
          sessions: analysis.disconnected
        }
      }
      
      console.log('[SESSION-CHECK] ✓ No se requiere limpieza')
      return { needsCleanup: false, reason: 'no_cleanup_needed' }
      
    } catch (error) {
      console.error('[SESSION-CHECK] Error verificando sesiones:', error)
      return {
        needsCleanup: false,
        reason: 'error_checking',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const loadSessions = async () => {
    try {
      const previousSessionIds = sessions.map(s => s.id)
      console.log(`[SESSIONS] Cargando lista de sesiones del usuario... (anteriormente: ${previousSessionIds.length} sesiones)`)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      // CORRECCIÓN: Usar endpoint filtrado por usuario
      const response = await sessionsAPI.listForUser(token)
      
      if (response.success) {
        console.log('[SESSIONS] Respuesta exitosa:', response.data)
        
        // CORREGIDO: La respuesta viene como {sesiones: Array, total, activas, limites}
        const sessionsData = Array.isArray(response.data?.sesiones) ? response.data.sesiones : []
        
        if (sessionsData.length === 0) {
          console.log('[SESSIONS] No hay sesiones del usuario')
          setSessions([])
          return
        }
        
        console.log(`[SESSIONS] Procesando ${sessionsData.length} sesiones del usuario...`)
        
        // OPTIMIZADO: Procesar sesiones de manera más eficiente usando paralelización controlada
        const enhancedSessions = []
        const batchSize = 3 // Procesar máximo 3 sesiones en paralelo
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
        
        // Función optimizada para procesar una sesión individual
        const processSession = async (sessionData: any, index: number) => {
          try {
            const sessionId = sessionData.id || sessionData.sesionId || sessionData.nombresesion
            
            if (!sessionId) {
              console.warn('[SESSIONS] Sesión sin ID válido:', sessionData)
              return null
            }
            
            console.log(`[SESSIONS] Procesando sesión ${index + 1}/${sessionsData.length}: ${sessionId}`)
            
            // Crear objeto de sesión basado en datos del backend
            const baseSession: SessionData = {
              id: sessionId,
              status: sessionData.estadoSesion || sessionData.estado || 'disconnected',
              authenticated: sessionData.estadoSesion === 'authenticated' || sessionData.estado === 'authenticated',
              phoneNumber: sessionData.lineaWhatsApp || sessionData.phoneNumber,
              createdAt: sessionData.fechaCreacion || sessionData.createdAt,
              updatedAt: sessionData.fechaActualizacion || sessionData.updatedAt
            }
            
            // Optimización: Solo verificar estado en tiempo real para sesiones importantes
            const needsStatusCheck = ['connecting', 'connected', 'authenticated'].includes(baseSession.status)
            
            if (needsStatusCheck) {
              try {
                const statusResponse = await sessionsAPI.status(sessionId)
                if (statusResponse.success) {
                  baseSession.status = statusResponse.data.status
                  if (statusResponse.data.authenticated !== undefined) {
                    baseSession.authenticated = statusResponse.data.authenticated
                  }
                }
              } catch (statusError) {
                // Usar estado de base de datos en caso de error
                if (statusError instanceof Error && statusError.message.includes('429')) {
                  console.log(`[SESSIONS] Rate limit detectado para ${sessionId} - usando estado de DB`)
                }
              }
            }
            
            // Webhook stats son opcionales y no críticos para la carga inicial
            const enhancedSession = {
              ...baseSession,
              webhookStats: null, // Se cargará después si es necesario
              lastActivity: sessionData.fechaActualizacion || new Date().toISOString(),
              messageCount: Math.floor(Math.random() * 1000), // Placeholder
              chatCount: Math.floor(Math.random() * 50) // Placeholder
            }
            
            return enhancedSession
            
          } catch (error) {
            console.warn(`[SESSIONS] Error procesando sesión ${sessionData?.id || 'unknown'}:`, error)
            return null
          }
        }
        
        // Procesar sesiones en lotes para balance entre velocidad y rate limiting
        for (let i = 0; i < sessionsData.length; i += batchSize) {
          const batch = sessionsData.slice(i, i + batchSize)
          
          // Procesar lote en paralelo
          const batchPromises = batch.map((sessionData, batchIndex) => 
            processSession(sessionData, i + batchIndex)
          )
          
          const batchResults = await Promise.allSettled(batchPromises)
          
          // Agregar resultados exitosos
          batchResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
              enhancedSessions.push(result.value)
            }
          })
          
          // Solo delay entre lotes, no entre sesiones individuales
          if (i + batchSize < sessionsData.length) {
            await delay(200) // Reducido a 200ms entre lotes
          }
        }
        
        // Las sesiones ya están filtradas en el procesamiento
        const validSessions = enhancedSessions
        
        console.log(`[SESSIONS] Sesiones procesadas exitosamente: ${validSessions.length}`)
        
        // Comparar con sesiones anteriores para detectar cambios
        const currentSessionIds = validSessions.map(s => s.id)
        const newSessions = currentSessionIds.filter(id => !previousSessionIds.includes(id))
        const removedSessions = previousSessionIds.filter(id => !currentSessionIds.includes(id))
        
        if (newSessions.length > 0) {
          console.log(`[SESSIONS] ✅ ${newSessions.length} nueva(s) sesión(es): ${newSessions.join(', ')}`)
        }
        
        if (removedSessions.length > 0) {
          console.warn(`[SESSIONS] ⚠️ ${removedSessions.length} sesión(es) eliminada(s): ${removedSessions.join(', ')}`)
          
          // Si hay sesiones autenticadas que desaparecieron, es un problema
          const previousAuthenticatedSessions = sessions.filter(s => 
            (s.status === 'authenticated' || s.status === 'connected') &&
            removedSessions.includes(s.id)
          )
          
          if (previousAuthenticatedSessions.length > 0) {
            console.error(`[SESSIONS] 🚨 CRÍTICO: ${previousAuthenticatedSessions.length} sesiones autenticadas desaparecieron:`, 
              previousAuthenticatedSessions.map(s => `${s.id} (${s.status})`).join(', '))
          }
        }
        
        if (newSessions.length === 0 && removedSessions.length === 0 && validSessions.length > 0) {
          console.log(`[SESSIONS] 🔄 Lista actualizada, ${validSessions.length} sesiones mantienen su estado`)
        }
        
        setSessions(validSessions)
      } else {
        console.warn('[SESSIONS] Respuesta no exitosa:', response)
        setSessions([])
      }
    } catch (error) {
      console.error('[SESSIONS] Error loading sessions:', error)
      
      // Manejar diferentes tipos de errores
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('[SESSIONS] No se encontraron sesiones (404) - esto es normal si no hay sesiones creadas')
          setSessions([])
        } else if (error.message.includes('fetch')) {
          toast({
            title: "Error de Conexión",
            description: "No se pudo conectar con el servidor. Verifica que la API esté disponible.",
            variant: "destructive",
          })
          setSessions([])
        } else {
          toast({
            title: "Error",
            description: `Error cargando sesiones: ${error.message}`,
            variant: "destructive",
          })
          setSessions([])
        }
      } else {
        toast({
          title: "Error",
          description: "Error desconocido cargando sesiones",
          variant: "destructive",
        })
        setSessions([])
      }
    } finally {
      setLoading(false)
    }
  }

  const createSession = async () => {
    // Verificar si la membresía está expirada
    if (user?.membershipExpired) {
      toast({
        title: "🔒 Funcionalidad Restringida",
        description: "Tu membresía ha expirado. Actualiza tu plan para crear nuevas sesiones.",
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

    if (!sessionName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la sesión es requerido",
        variant: "destructive",
      })
      return
    }

    if (authType === 'code' && !phoneNumber.trim()) {
      toast({
        title: "Error", 
        description: "El número de teléfono es requerido para autenticación por código",
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
      
      console.log('=== INICIANDO CREACIÓN DE SESIÓN ROBUSTA ===')
      console.log('Parámetros:', {
        sessionName,
        authType,
        phoneNumber: authType === 'code' ? phoneNumber : 'N/A'
      })
      
      // === NUEVA LÓGICA SIMPLIFICADA Y CORRECTA ===
      // PASO 1: Limpiar SOLO sesiones activas (plan gratuito permite solo 1 sesión)
      console.log('1. Ejecutando limpieza inteligente de sesiones activas...')
      const cleanResult = await cleanActiveSessionsOnly()
      
      if (cleanResult.cleaned > 0) {
        console.log(`✅ Limpieza completada: ${cleanResult.cleaned}/${cleanResult.total} sesiones eliminadas`)
        toast({
          title: "🧹 Sesiones Limpiadas",
          description: `Se eliminaron ${cleanResult.cleaned} sesión(es) existente(s). Creando nueva sesión...`,
          duration: 3000,
        })
        
        // Esperar para que la limpieza se propague en el backend
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else if (cleanResult.total > 0) {
        console.log(`⚠️ Se encontraron ${cleanResult.total} sesiones pero no se pudieron eliminar todas`)
        toast({
          title: "⚠️ Limpieza Parcial",
          description: `Se encontraron sesiones existentes. Algunos conflictos pueden persistir.`,
          duration: 5000,
        })
      } else {
        console.log('✅ No había sesiones existentes')
      }
      
      // PASO 2: Intentar crear sesión (con reintentos robusto)
      let sessionCreated = false
      let maxRetries = 3
      let currentRetry = 0
      
      while (!sessionCreated && currentRetry < maxRetries) {
        currentRetry++
        console.log(`\n--- INTENTO ${currentRetry}/${maxRetries} ---`)
        
        try {
          console.log('2. Intentando crear sesión...')
          const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/sesiones/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              token: token,
              nombresesion: sessionName,
              lineaWhatsApp: authType === 'code' ? phoneNumber : undefined,
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
            console.log('✅ Sesión creada exitosamente. Respuesta completa del backend:')
            console.log('responseData completo:', JSON.stringify(responseData, null, 2))
            console.log('authType enviado:', authType)
            console.log('tipoAuth en body:', JSON.stringify({
              token: token,
              nombresesion: sessionName,
              lineaWhatsApp: authType === 'code' ? phoneNumber : undefined,
              tipoAuth: authType,
              crearWebhook: true
            }, null, 2))
            
            sessionCreated = true
            
            // Verificar TODOS los posibles campos donde puede venir el código
            const possibleCodeFields = [
              responseData.data?.code,
              responseData.data?.codigoVerificacion,
              responseData.data?.codigo,
              responseData.data?.baileysResponse?.data?.code,  // ✅ CAMPO CORRECTO SEGÚN LOGS
              responseData.code,
              responseData.codigo,
              responseData.codigoVerificacion
            ]
            
            console.log('Verificando campos posibles para código:')
            possibleCodeFields.forEach((field, index) => {
              const fieldNames = ['data.code', 'data.codigoVerificacion', 'data.codigo', 'data.baileysResponse.data.code', 'code', 'codigo', 'codigoVerificacion']
              console.log(`- ${fieldNames[index]}:`, field)
            })
            
            const verificationCode = possibleCodeFields.find(field => field && field.length > 0)
            
            // Si encontramos un código Y el authType es 'code', mostrar modal
            if (verificationCode && authType === 'code') {
              console.log('✅ CóDIGO ENCONTRADO:', verificationCode)
              console.log('✅ authType confirmado como code - MOSTRANDO MODAL')
              
              // ✅ SOLUCIÓN: Establecer tanto el ID real como el nombre
              const realSessionId = responseData.data?.sesionId || responseData.data?.id || sessionName
              console.log('✅ SESSION ID REAL:', realSessionId)
              
              setVerificationCode(verificationCode)
              setVerificationSessionId(realSessionId)  // ✅ USAR ID REAL PARA MONITOREO
              setVerificationSessionName(sessionName)  // ✅ USAR NOMBRE SOLO PARA UI
              setVerificationPhoneNumber(phoneNumber)
              setCodeExpiryTime(Date.now() + 30000)
              setTimeRemaining(30)
              
              console.log('[MODAL] Estado del modal establecido:')
              console.log('- verificationCode:', verificationCode)
              console.log('- verificationSessionId (ID REAL):', realSessionId)
              console.log('- verificationSessionName (NOMBRE UI):', sessionName)
              console.log('- verificationPhoneNumber:', phoneNumber)
              
              toast({
                title: "🔑 Código de Verificación",
                description: `Código: ${verificationCode} - Modal debería aparecer ahora`,
                duration: 10000,
              })
              
              // Limpiar formulario
              setSessionName('')
              setPhoneNumber('')
              setWebhookUrl('')
              setShowCreateForm(false)
              
              // Verificar modal después de render
              setTimeout(() => {
                console.log('[MODAL-CHECK] Verificando si modal es visible:')
                const modalElement = document.querySelector('[key="verification-modal-overlay"]')
                console.log('Modal DOM element found:', !!modalElement)
                console.log('verificationCode en estado:', verificationCode)
              }, 500)
              
              // Iniciar polling del estado
              // No iniciar polling adicional - el monitoreo del modal lo maneja
              console.log('[CREATE-SESSION] Modal configurado correctamente, usando monitoreo optimizado')
            } 
            // Si NO hay código o authType no es 'code' - autenticación por QR
            else {
              console.log('✅ Autenticación por QR o no se encontró código')
              console.log('- verificationCode encontrado:', !!verificationCode)
              console.log('- authType:', authType)
              
              // Crear webhook si se proporcionó URL
              if (webhookUrl.trim()) {
                try {
                  console.log('Creando webhook para la sesión...')
                  await sessionsAPI.createWebhook(sessionName, sessionName, webhookUrl)
                  toast({
                    title: "Éxito",
                    description: "Sesión y webhook creados exitosamente",
                  })
                } catch (webhookError) {
                  console.warn('Error creando webhook:', webhookError)
                  toast({
                    title: "Advertencia",
                    description: "Sesión creada pero falló la creación del webhook",
                    variant: "destructive",
                  })
                }
              } else {
                toast({
                  title: "Éxito",
                  description: "Sesión creada exitosamente",
                })
              }

              // Limpiar formulario
              setSessionName('')
              setPhoneNumber('')
              setWebhookUrl('')
              setShowCreateForm(false)
            }
            
            // Recargar sesiones inmediatamente
            console.log('Recargando lista de sesiones...')
            loadSessions()
            
            // ACTUALIZAR NOMBREBOT DEL USUARIO DESPUÉS DE CREAR SESIÓN
            console.log('[CREATE-SESSION] Actualizando nombrebot del usuario...')
            try {
              const { user } = useAuthStore.getState()
              if (user) {
                useAuthStore.setState({
                  user: {
                    ...user,
                    nombrebot: sessionName // Usar el nombre de la nueva sesión
                  }
                })
                console.log('[CREATE-SESSION] ✅ Nombrebot del usuario actualizado a:', sessionName)
              }
            } catch (updateError) {
              console.warn('[CREATE-SESSION] Error actualizando nombrebot:', updateError)
              // No es crítico, continuar normalmente
            }
            
            break // Salir del bucle de reintentos
            
          } else {
            throw new Error(`La respuesta del servidor no fue exitosa: ${JSON.stringify(responseData)}`)
          }
          
        } catch (createError: any) {
          console.error(`Error en intento ${currentRetry}:`, createError)
          
          // Si es el error específico de "Ya existe una sesión activa", ejecutar limpieza inteligente
          if (createError.message?.includes('Ya existe una sesión activa') || 
              createError.message?.includes('already exists') ||
              createError.message?.includes('Ya tiene un nombre de usuario asignado')) {
            console.log('3. Error de sesión existente detectado, ejecutando limpieza inteligente adicional...')
            
            try {
              // Ejecutar limpieza inteligente (solo sesiones activas)
              const additionalClean = await cleanActiveSessionsOnly()
              console.log(`✓ Limpieza inteligente adicional: ${additionalClean.cleaned} sesiones activas eliminadas`)
              
              // Esperar más tiempo para propagación
              await new Promise(resolve => setTimeout(resolve, 3000))
              
            } catch (cleanError) {
              console.error('Error en limpieza adicional:', cleanError)
              // Continuar de todas formas
            }
          } else {
            // Si es otro tipo de error y es el último intento, fallar
            if (currentRetry >= maxRetries) {
              throw createError
            }
            
            // Para otros errores, esperar un poco antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      if (!sessionCreated) {
        throw new Error(`No se pudo crear la sesión después de ${maxRetries} intentos`)
      }
      
      console.log('=== PROCESO DE CREACIÓN ROBUSTA COMPLETADO EXITOSAMENTE ===')
      
    } catch (error: any) {
      console.error('=== ERROR EN CREACIÓN DE SESIÓN ===', error)
      
      let errorMessage = "No se pudo crear la sesión"
      if (error instanceof Error) {
        if (error.message.includes('Ya existe una sesión activa')) {
          errorMessage = "⚠️ Error: Aún existe una sesión activa con esa línea de WhatsApp. El sistema intentó limpiar automáticamente. Inténtalo de nuevo en unos segundos."
        } else if (error.message.includes('Ya tiene un nombre de usuario asignado')) {
          errorMessage = "Error: Usuario ya tiene un bot registrado. El sistema intentó limpiar automáticamente. Inténtalo de nuevo."
        } else if (error.message.includes('Session already exists')) {
          errorMessage = "Error: Ya existe una sesión con ese nombre. Intenta con otro nombre."
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
        action: (
        <Button 
        size="sm" 
        onClick={async () => {
        toast({
          title: "🧹 Iniciando Limpieza",
        description: "Eliminando sesiones problemáticas, espera...",
        duration: 3000,
        })
        
        const result = await cleanProblematicSessions(authType === 'code' ? phoneNumber : undefined)
        
          if (result.success && result.cleaned > 0) {
            toast({
                title: "✅ Limpieza Completada",
              description: `${result.cleaned} sesión(es) eliminada(s). Puedes crear la sesión nuevamente.`,
                duration: 5000,
                })
                    
                    setTimeout(() => {
                      loadSessions()
                    }, 2000)
                  } else {
                    toast({
                      title: "⚠️ Limpieza Parcial",
                      description: result.message || "Algunas sesiones pueden persistir.",
                      variant: "destructive",
                    })
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                🧹 Limpiar y Reintentar
              </Button>
            )
      })
    } finally {
      setCreating(false)
      console.log('=== FINALIZANDO PROCESO DE CREACIÓN ROBUSTA ===')
    }
  }

  const deleteSession = async (sessionId: string) => {
    // Verificar si la membresía está expirada
    if (user?.membershipExpired) {
      toast({
        title: "🔒 Funcionalidad Restringida",
        description: "No puedes eliminar sesiones con membresía expirada. Actualiza tu plan.",
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

    // Usar toast personalizado con dismiss automático
    let toastDismiss: (() => void) | undefined
    
    const confirmDelete = await new Promise<boolean>((resolve) => {
      const { dismiss } = toast({
        title: "⚠️ Confirmar Eliminación",
        description: `¿Estás seguro de que deseas eliminar la sesión "${sessionId}"? Esta acción no se puede deshacer.`,
        action: (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                dismiss() // Cerrar toast inmediatamente
                resolve(false)
              }}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                dismiss() // Cerrar toast inmediatamente
                resolve(true)
              }}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        ),
        duration: 10000, // 10 segundos para decidir
      })
      toastDismiss = dismiss
    })
    
    if (!confirmDelete) {
      toast({
        title: "Operación Cancelada",
        description: "La sesión no ha sido eliminada.",
        duration: 3000,
      })
      return
    }

    try {
      console.log(`[DELETE-SESSION] Iniciando eliminación de sesión: ${sessionId}`)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      // ELIMINAR SESIÓN CON DEBUG ULTRA-DETALLADO
      console.log('[DELETE-SESSION] Eliminando sesión...')
      console.log(`[DELETE-SESSION-DEBUG] SessionId a eliminar: ${sessionId}`)
      console.log(`[DELETE-SESSION-DEBUG] Token disponible: ${!!token}`)
      console.log(`[DELETE-SESSION-DEBUG] Token preview: ${token ? token.substring(0, 20) + '...' : 'N/A'}`)
      
      try {
        console.log('[DELETE-SESSION-DEBUG] === INICIANDO LLAMADA A sessionsAPI.delete ===')
        
        // Capturar la petición completa antes de enviarla
        const requestData = {
          token: token,
          sesionId: sessionId
        }
        console.log('[DELETE-SESSION-DEBUG] Request data que se enviará:', JSON.stringify(requestData, null, 2))
        
        // Llamar al endpoint y capturar respuesta completa
        const deleteResponse = await sessionsAPI.delete(sessionId)
        
        console.log('[DELETE-SESSION-DEBUG] === RESPUESTA COMPLETA DEL ENDPOINT ===')
        console.log('[DELETE-SESSION-DEBUG] Response type:', typeof deleteResponse)
        console.log('[DELETE-SESSION-DEBUG] Response keys:', deleteResponse ? Object.keys(deleteResponse) : 'N/A')
        console.log('[DELETE-SESSION-DEBUG] Response completa:', JSON.stringify(deleteResponse, null, 2))
        
        // Verificar estructura de respuesta
        if (deleteResponse) {
          console.log('[DELETE-SESSION-DEBUG] deleteResponse.success:', deleteResponse.success)
          console.log('[DELETE-SESSION-DEBUG] deleteResponse.data:', deleteResponse.data)
          console.log('[DELETE-SESSION-DEBUG] deleteResponse.message:', deleteResponse.message)
        }
        
        // Verificar si realmente se eliminó
        if (deleteResponse.success) {
          console.log('[DELETE-SESSION-DEBUG] ✅ Endpoint reporta SUCCESS')
        } else {
          console.log('[DELETE-SESSION-DEBUG] ⚠️ Endpoint reporta FAILURE')
          console.log('[DELETE-SESSION-DEBUG] Error del endpoint:', deleteResponse.message || 'Sin mensaje de error')
        }
        
        console.log('[DELETE-SESSION] ✅ Sesión eliminada exitosamente (según endpoint)')
        
        // PASO 2: ELIMINAR PERMANENTEMENTE DE LA BASE DE DATOS
        console.log('[DELETE-SESSION-DEBUG] === INICIANDO ELIMINACIÓN PERMANENTE (BULK) ===')
        console.log('[DELETE-SESSION-DEBUG] Llamando a sessionsAPI.bulkDelete con permanent: true')
        
        try {
          const bulkDeleteResponse = await sessionsAPI.bulkDelete([sessionId], true)
          
          console.log('[DELETE-SESSION-DEBUG] === RESPUESTA BULK DELETE ===')
          console.log('[DELETE-SESSION-DEBUG] Bulk response type:', typeof bulkDeleteResponse)
          console.log('[DELETE-SESSION-DEBUG] Bulk response keys:', bulkDeleteResponse ? Object.keys(bulkDeleteResponse) : 'N/A')
          console.log('[DELETE-SESSION-DEBUG] Bulk response completa:', JSON.stringify(bulkDeleteResponse, null, 2))
          
          if (bulkDeleteResponse.success) {
            console.log('[DELETE-SESSION-DEBUG] ✅ Eliminación permanente exitosa')
            console.log('[DELETE-SESSION-DEBUG] Sesiones eliminadas:', bulkDeleteResponse.data?.success || [])
            console.log('[DELETE-SESSION-DEBUG] Errores:', bulkDeleteResponse.data?.errors || [])
          } else {
            console.log('[DELETE-SESSION-DEBUG] ⚠️ Error en eliminación permanente:', bulkDeleteResponse.message)
          }
          
        } catch (bulkError) {
          console.error('[DELETE-SESSION-DEBUG] === ERROR EN BULK DELETE ===')
          console.error('[DELETE-SESSION-DEBUG] Bulk error:', bulkError)
          // No lanzar error - continuar con el flujo aunque falle el bulk delete
          console.warn('[DELETE-SESSION] ⚠️ Error en eliminación permanente, pero continuando...')
        }
        
        // 3. ACTUALIZAR NOMBREBOT DEL USUARIO DESPUÉS DE ELIMINAR SESIÓN
        console.log('[DELETE-SESSION] Paso 3: Actualizando nombrebot del usuario...')
        try {
          // Verificar si quedan más sesiones
          const remainingSessions = await sessionsAPI.list()
          
          if (!remainingSessions.success || !remainingSessions.data || remainingSessions.data.length === 0) {
            // No quedan sesiones, limpiar nombrebot del usuario
            console.log('[DELETE-SESSION] No quedan sesiones - limpiando nombrebot del usuario')
            const { user } = useAuthStore.getState()
            
            if (user) {
              useAuthStore.setState({
                user: {
                  ...user,
                  nombrebot: user.email // Usar email como fallback
                }
              })
              console.log('[DELETE-SESSION] ✅ Nombrebot del usuario limpiado')
            }
          } else {
            // Quedan sesiones, usar la primera como nombrebot
            const firstSession = remainingSessions.data[0]
            console.log(`[DELETE-SESSION] Quedan ${remainingSessions.data.length} sesiones - usando primera como nombrebot: ${firstSession}`)
            
            const { user } = useAuthStore.getState()
            if (user && firstSession !== user.nombrebot) {
              useAuthStore.setState({
                user: {
                  ...user,
                  nombrebot: firstSession
                }
              })
              console.log('[DELETE-SESSION] ✅ Nombrebot del usuario actualizado a:', firstSession)
            }
          }
        } catch (updateError) {
          console.warn('[DELETE-SESSION] Error actualizando nombrebot:', updateError)
          // No es crítico, continuar normalmente
        }
        
        // Mostrar mensaje de éxito
        toast({
          title: "✅ Éxito",
          description: `La sesión "${sessionId}" ha sido eliminada exitosamente.`,
        })
        
        // Recargar sesiones para actualizar la lista
        loadSessions()
        
      } catch (sessionError) {
        console.error('[DELETE-SESSION] Error eliminando sesión:', sessionError)
        
        // Manejar errores específicos de eliminación de sesión
        if (sessionError instanceof Error) {
          if (sessionError.message.includes('Session not found') || sessionError.message.includes('not found')) {
            // Si la sesión no se encuentra, removerla de la lista local
            setSessions(prev => prev.filter(s => s.id !== sessionId))
            
            toast({
              title: "✅ Sesión Eliminada",
              description: "La sesión ya no existía en el servidor y se ha removido de la lista.",
            })
          } else {
            throw sessionError // Re-lanzar el error para que sea manejado por el catch principal
          }
        } else {
          throw sessionError
        }
      }
      
      console.log('[DELETE-SESSION] ✅ Proceso de eliminación completado')
      
    } catch (error) {
      console.error('[DELETE-SESSION] Error crítico en eliminación:', error)
      
      // Manejar errores críticos que no fueron manejados anteriormente
      if (error instanceof Error) {
        toast({
          title: "❌ Error", 
          description: `No se pudo completar la eliminación: ${error.message}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "❌ Error", 
          description: "No se pudo eliminar la sesión por un error desconocido.",
          variant: "destructive",
        })
      }
    }
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authenticated':
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'disconnected':
      case 'disconnecting':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authenticated':
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      case 'disconnected':
      case 'disconnecting':
        return <WifiOff className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const createWebhookForSession = async (sessionId: string) => {
    // Verificar si la membresía está expirada
    if (user?.membershipExpired) {
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

    const url = prompt('Ingresa la URL del webhook:')
    if (!url) return

    try {
      const response = await sessionsAPI.createWebhook(sessionId, sessionId, url)
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Webhook creado exitosamente",
        })
        loadSessions()
      }
    } catch (error) {
      console.error('Error creating webhook:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el webhook",
        variant: "destructive",
      })
    }
  }

  // ===== NUEVAS FUNCIONES PARA OPERACIONES EN LOTE =====
  
  // Función para toggle de selección de una sesión
  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId)
      } else {
        return [...prev, sessionId]
      }
    })
  }
  
  // Función para seleccionar/deseleccionar todas las sesiones
  const toggleSelectAll = () => {
    if (selectAllMode) {
      setSelectedSessions([])
      setSelectAllMode(false)
    } else {
      setSelectedSessions(sessions.map(s => s.id))
      setSelectAllMode(true)
    }
  }
  
  // Función para eliminar sesiones en lote
  const bulkDeleteSessions = async () => {
    // Verificar si la membresía está expirada
    if (user?.membershipExpired) {
      toast({
        title: "🔒 Funcionalidad Restringida",
        description: "No puedes eliminar sesiones con membresía expirada. Actualiza tu plan.",
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
    
    if (selectedSessions.length === 0) {
      toast({
        title: "No hay sesiones seleccionadas",
        description: "Selecciona al menos una sesión para eliminar.",
        variant: "destructive",
      })
      return
    }
    
    // Confirmación con dismiss automático
    const confirmBulkDelete = await new Promise<boolean>((resolve) => {
      const { dismiss } = toast({
        title: "⚠️ Confirmar Eliminación en Lote",
        description: `¿Estás seguro de que deseas eliminar ${selectedSessions.length} sesión(es) seleccionada(s)? Esta acción no se puede deshacer.`,
        action: (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                dismiss()
                resolve(false)
              }}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                dismiss()
                resolve(true)
              }}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Eliminar {selectedSessions.length} Sesiones
            </button>
          </div>
        ),
        duration: 15000, // 15 segundos para decidir
      })
    })
    
    if (!confirmBulkDelete) {
      toast({
        title: "Operación Cancelada",
        description: "No se eliminaron las sesiones seleccionadas.",
        duration: 3000,
      })
      return
    }
    
    setBulkDeleting(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      console.log(`[BULK-DELETE] Iniciando eliminación en lote de ${selectedSessions.length} sesiones:`, selectedSessions)
      
      // PASO 1: Usar el endpoint bulkDelete directamente
      console.log('[BULK-DELETE] Paso 1: Eliminando sesiones usando bulkDelete...')
      
      const bulkDeleteResponse = await sessionsAPI.bulkDelete(selectedSessions, true)
      
      console.log('[BULK-DELETE] Respuesta bulk delete:', bulkDeleteResponse)
      
      if (bulkDeleteResponse.success) {
        const deletedSessions = bulkDeleteResponse.data?.success || []
        const failedSessions = bulkDeleteResponse.data?.errors || []
        
        console.log(`[BULK-DELETE] ✅ ${deletedSessions.length} sesiones eliminadas exitosamente`)
        console.log(`[BULK-DELETE] ⚠️ ${failedSessions.length} sesiones fallaron`)
        
        // Mostrar resultado
        if (deletedSessions.length > 0) {
          toast({
            title: "✅ Eliminación en Lote Completada",
            description: `${deletedSessions.length} sesión(es) eliminada(s) exitosamente.` + 
                        (failedSessions.length > 0 ? ` ${failedSessions.length} fallaron.` : ''),
            duration: 6000,
          })
        }
        
        if (failedSessions.length > 0) {
          console.warn('[BULK-DELETE] Sesiones que fallaron:', failedSessions)
          
          // Mostrar detalles de errores si hay algunos
          setTimeout(() => {
            toast({
              title: "⚠️ Algunas Sesiones No Se Pudieron Eliminar",
              description: `${failedSessions.length} sesión(es) tuvieron errores. Revisa la consola para más detalles.`,
              variant: "destructive",
              duration: 8000,
            })
          }, 2000)
        }
        
        // Limpiar selección
        setSelectedSessions([])
        setSelectAllMode(false)
        
        // Recargar sesiones
        await loadSessions()
        
      } else {
        throw new Error(bulkDeleteResponse.message || 'Error en eliminación en lote')
      }
      
    } catch (error) {
      console.error('[BULK-DELETE] Error crítico:', error)
      
      if (error instanceof Error) {
        toast({
          title: "❌ Error en Eliminación en Lote",
          description: `No se pudieron eliminar las sesiones: ${error.message}`,
          variant: "destructive",
          duration: 8000,
        })
      } else {
        toast({
          title: "❌ Error Desconocido",
          description: "Ocurrió un error inesperado durante la eliminación en lote.",
          variant: "destructive",
        })
      }
    } finally {
      setBulkDeleting(false)
    }
  }
  
  // Función para limpiar sesiones inactivas
  const cleanupInactiveSessions = async () => {
    // Verificar si la membresía está expirada
    if (user?.membershipExpired) {
      toast({
        title: "🔒 Funcionalidad Restringida",
        description: "No puedes limpiar sesiones con membresía expirada. Actualiza tu plan.",
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
    
    // Confirmación para limpieza de inactivas
    const confirmCleanup = await new Promise<boolean>((resolve) => {
      const { dismiss } = toast({
        title: "🧹 Confirmar Limpieza de Sesiones Inactivas",
        description: "¿Estás seguro de que deseas eliminar TODAS las sesiones inactivas? Esta acción eliminará automáticamente las sesiones desconectadas o con problemas.",
        action: (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                dismiss()
                resolve(false)
              }}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                dismiss()
                resolve(true)
              }}
              className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
            >
              🧹 Limpiar Inactivas
            </button>
          </div>
        ),
        duration: 12000, // 12 segundos para decidir
      })
    })
    
    if (!confirmCleanup) {
      toast({
        title: "Operación Cancelada",
        description: "No se ejecutó la limpieza de sesiones inactivas.",
        duration: 3000,
      })
      return
    }
    
    setCleaningInactive(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      console.log('[CLEANUP-INACTIVE] Iniciando limpieza de sesiones inactivas...')
      
      // Llamar al endpoint de limpieza de inactivas
      const response = await fetch(`${defaultSettings.api.baseUrl}/api/v2/sesiones/cleanup/inactive`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: token
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const responseData = await response.json()
      
      console.log('[CLEANUP-INACTIVE] Respuesta del endpoint:', responseData)
      
      if (responseData.success) {
        const cleanedCount = responseData.data?.cleaned || responseData.cleaned || 0
        const details = responseData.data?.details || responseData.details || []
        
        console.log(`[CLEANUP-INACTIVE] ✅ ${cleanedCount} sesiones inactivas eliminadas`)
        
        toast({
          title: "🧹 Limpieza Completada",
          description: cleanedCount > 0 
            ? `Se eliminaron ${cleanedCount} sesión(es) inactiva(s) exitosamente.`
            : "No se encontraron sesiones inactivas para eliminar.",
          duration: 6000,
        })
        
        // Mostrar detalles si están disponibles
        if (details.length > 0) {
          console.log('[CLEANUP-INACTIVE] Detalles de limpieza:', details)
        }
        
        // Recargar sesiones
        await loadSessions()
        
      } else {
        throw new Error(responseData.message || 'El endpoint reportó error')
      }
      
    } catch (error) {
      console.error('[CLEANUP-INACTIVE] Error:', error)
      
      if (error instanceof Error) {
        toast({
          title: "❌ Error en Limpieza",
          description: `No se pudo completar la limpieza de sesiones inactivas: ${error.message}`,
          variant: "destructive",
          duration: 8000,
        })
      } else {
        toast({
          title: "❌ Error Desconocido",
          description: "Ocurrió un error inesperado durante la limpieza de sesiones inactivas.",
          variant: "destructive",
        })
      }
    } finally {
      setCleaningInactive(false)
    }
  }
  
  // Limpiar selección cuando las sesiones cambian
  useEffect(() => {
    // Filtrar selecciones que ya no existen
    const existingSessionIds = sessions.map(s => s.id)
    const validSelections = selectedSessions.filter(id => existingSessionIds.includes(id))
    
    if (validSelections.length !== selectedSessions.length) {
      setSelectedSessions(validSelections)
    }
    
    // Actualizar el estado de selectAll
    setSelectAllMode(sessions.length > 0 && validSelections.length === sessions.length)
  }, [sessions, selectedSessions])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando sesiones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card key="stats-total-sessions">
          <CardContent className="flex items-center p-6">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-sm text-gray-600">Total Sesiones</p>
            </div>
          </CardContent>
        </Card>
        
        <Card key="stats-connected-sessions">
          <CardContent className="flex items-center p-6">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <Wifi className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">
                {sessions.filter(s => s.status === 'authenticated' || s.status === 'connected').length}
              </p>
              <p className="text-sm text-gray-600">Conectadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card key="stats-messages-total">
          <CardContent className="flex items-center p-6">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">
                {sessions.reduce((acc, s) => acc + (s.messageCount || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Mensajes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card key="stats-webhooks-active">
          <CardContent className="flex items-center p-6">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
              <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold">
                {sessions.filter(s => s.webhookStats?.webhookActive).length}
              </p>
              <p className="text-sm text-gray-600">Webhooks Activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {user?.membershipExpired ? (
            <Button 
              onClick={() => router.push('/dashboard/upgrade')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Lock className="h-4 w-4 mr-2" />
              Actualizar Plan
            </Button>
          ) : (
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sesión
            </Button>
          )}
          <Button variant="outline" onClick={loadSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button 
            variant={sessionHealthMonitoring ? "default" : "outline"}
            onClick={() => setSessionHealthMonitoring(!sessionHealthMonitoring)}
            className={sessionHealthMonitoring ? "bg-green-600 hover:bg-green-700" : ""}
            disabled={user?.membershipExpired}
          >
            <Activity className="h-4 w-4 mr-2" />
            {sessionHealthMonitoring ? "Monitoreo ON" : "Monitoreo OFF"}
          </Button>
          
          {/* Nuevos botones para operaciones en lote */}
          {sessions.length > 0 && !user?.membershipExpired && (
            <>
              <Button 
                variant="outline"
                onClick={toggleSelectAll}
                className={selectAllMode ? "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 hover:text-blue-900" : "hover:bg-gray-50 hover:text-gray-700"}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {selectAllMode ? "Deseleccionar Todo" : "Seleccionar Todo"}
              </Button>
              
              {selectedSessions.length > 0 && (
                <Button 
                  onClick={bulkDeleteSessions}
                  disabled={bulkDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {bulkDeleting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {bulkDeleting ? 'Eliminando...' : `Eliminar ${selectedSessions.length} Seleccionadas`}
                </Button>
              )}
              
              <Button 
                onClick={cleanupInactiveSessions}
                disabled={cleaningInactive}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-100 hover:text-orange-800 hover:border-orange-400"
              >
                {cleaningInactive ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {cleaningInactive ? 'Limpiando...' : '🧹 Limpiar Inactivas'}
              </Button>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Contador de sesiones seleccionadas */}
          {selectedSessions.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedSessions.length} seleccionada(s)
              </span>
            </div>
          )}
          
          {/* Indicator de sesiones perdidas */}
          {disappearedSessions.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {disappearedSessions.length} sesión(es) perdida(s)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && !user?.membershipExpired && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Sesión</CardTitle>
            <CardDescription>
              Configura una nueva sesión de WhatsApp con opciones avanzadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authType} onValueChange={(value) => setAuthType(value as 'qr' | 'code')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Código QR
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Vincular con número de teléfono
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="qr" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="session-name">Nombre de la Sesión</Label>
                  <Input
                    id="session-name"
                    placeholder="Mi Bot de WhatsApp"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL del Webhook (Opcional)</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://mi-servidor.com/webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Se creará automáticamente un webhook para recibir eventos de WhatsApp
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                <div className="bg-blue-200 dark:bg-blue-800 p-2 rounded-full">
                  <Camera className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-200">
                Autenticación por QR
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Escanea el código QR que aparecerá con tu WhatsApp para conectar la sesión.
                </p>
                </div>
                </div>
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="session-name-code">Nombre de la Sesión</Label>
                  <Input
                    id="session-name-code"
                    placeholder="Mi Bot de WhatsApp"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Número de Teléfono</Label>
                  <Input
                    id="phone-number"
                    placeholder="+57 300 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Incluye el código de país (ej: +57 para Colombia)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhook-url-code">URL del Webhook (Opcional)</Label>
                  <Input
                    id="webhook-url-code"
                    placeholder="https://mi-servidor.com/webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                <div className="bg-green-200 dark:bg-green-800 p-2 rounded-full">
                  <Key className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <div>
                <h4 className="font-medium text-green-900 dark:text-green-200">
                Autenticación por Código
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Recibirás una notificación en la que debes introducir el código de 6 dígitos.
                </p>
                </div>
                </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={createSession} 
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {creating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {creating ? 'Creando...' : 'Crear Sesión'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de membresía expirada */}
      {user?.membershipExpired && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-500 text-white rounded-full flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-amber-800 dark:text-amber-200 text-lg">
                  Membresía Expirada - Funcionalidades Restringidas
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300 mt-1">
                  Tu período de prueba gratuita ha terminado. Las sesiones existentes se muestran en modo solo lectura.
                </CardDescription>
              </div>
              <Button 
              onClick={() => router.push('/dashboard/upgrade')}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              >
              <CreditCard className="h-4 w-4 mr-2" />
              Actualizar Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">❌ Restricciones Activas:
                </h4>
                <ul className="space-y-1 text-amber-700 dark:text-amber-300">
                  <li>• No puedes crear nuevas sesiones</li>
                  <li>• No puedes eliminar sesiones existentes</li>
                  <li>• Sin acceso a webhooks</li>
                  <li>• Monitoreo de salud deshabilitado</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">✅ Aún disponible:
                </h4>
                <ul className="space-y-1 text-amber-700 dark:text-amber-300">
                  <li>• Ver sesiones existentes</li>
                  <li>• Actualizar estado de sesiones</li>
                  <li>• Acceso a configuración de cuenta</li>
                  <li>• Actualización de plan</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de diagnóstico si hay problemas */}
      {disappearedSessions.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center">
        <AlertCircle className="h-4 w-4" />
        </div>
              <div>
                <CardTitle className="text-red-800 dark:text-red-200">
                  Problema Detectado: Sesiones Perdidas
                </CardTitle>
                <CardDescription className="text-red-600 dark:text-red-400">
                  El sistema detectó que {disappearedSessions.length} sesión(es) autenticada(s) desaparecieron del backend
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Sesiones Perdidas:</h4>
                <div className="flex flex-wrap gap-2">
                  {disappearedSessions.map(sessionId => (
                    <Badge key={sessionId} variant="destructive" className="text-xs">
                      {sessionId}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  <strong>Causa probable:</strong> El backend de Baileys está eliminando sesiones automáticamente debido a timeouts o configuración.
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Solución:</strong> Este sistema ahora detecta y puede recrear automáticamente las sesiones perdidas.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={() => {
                    // Limpiar lista de sesiones perdidas
                    setDisappearedSessions([])
                    toast({
                      title: "Lista Limpiada",
                      description: "Se ha limpiado la lista de sesiones perdidas.",
                    })
                  }}
                  variant="outline"
                >
                  Limpiar Lista
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    // Generar reporte de diagnóstico
                    const report = `REPORTE DE DIAGNÓSTICO - SESIONES WHATSAPP\n\n` +
                      `Fecha: ${new Date().toLocaleString()}\n` +
                      `Sesiones Activas: ${sessions.length}\n` +
                      `Sesiones Perdidas: ${disappearedSessions.length}\n` +
                      `Lista de Perdidas: ${disappearedSessions.join(', ')}\n` +
                      `Monitoreo Activo: ${sessionHealthMonitoring ? 'Sí' : 'No'}\n\n` +
                      `ESTADOS ACTUALES:\n` +
                      sessions.map(s => `- ${s.id}: ${s.status}${s.authenticated ? ' (autenticada)' : ''}`).join('\n')
                    
                    // Copiar al portapapeles
                    navigator.clipboard.writeText(report).then(() => {
                      toast({
                        title: "Reporte Copiado",
                        description: "El reporte de diagnóstico se ha copiado al portapapeles.",
                      })
                    })
                  }}
                  variant="outline"
                >
                  Generar Reporte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Lista de sesiones */}
      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <Card key="empty-sessions-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                <Smartphone className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No hay sesiones
              </h3>
              <p className="text-gray-500 text-center mb-4">
                Crea tu primera sesión de WhatsApp para comenzar a enviar mensajes
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Sesión
              </Button>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={`session-card-${session.id}`} className={`hover:shadow-lg transition-shadow ${
              selectedSessions.includes(session.id) ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Checkbox para selección múltiple */}
                    {!user?.membershipExpired && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(session.id)}
                          onChange={() => toggleSessionSelection(session.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    )}
                    
                    <div className="relative">
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                        <Smartphone className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div 
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(session.status)}`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{session.id}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getStatusIcon(session.status)}
                          {session.status}
                        </Badge>
                        {session.phoneNumber && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {session.phoneNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      key={`${session.id}-refresh-btn`}
                      variant="outline"
                      size="sm"
                      onClick={() => refreshSession(session.id)}
                      disabled={refreshing === session.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshing === session.id ? 'animate-spin' : ''}`} />
                    </Button>
                    
                    {!session.webhookStats?.webhookActive && (
                      <Button
                        key={`${session.id}-webhook-btn`}
                        variant="outline"
                        size="sm"
                        onClick={() => createWebhookForSession(session.id)}
                        disabled={user?.membershipExpired}
                        title={user?.membershipExpired ? "Funcionalidad restringida - Actualiza tu plan" : "Crear webhook"}
                      >
                        {user?.membershipExpired ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Link className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    <Button
                      key={`${session.id}-delete-btn`}
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                      className={user?.membershipExpired ? "opacity-50 cursor-not-allowed" : "text-red-600 hover:text-red-700"}
                      disabled={user?.membershipExpired}
                      title={user?.membershipExpired ? "Funcionalidad restringida - Actualiza tu plan" : "Eliminar sesión"}
                    >
                      {user?.membershipExpired ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div key={`${session.id}-stat-chats`} className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{session.chatCount || 0}</p>
                    <p className="text-sm text-gray-600">Chats</p>
                  </div>
                  <div key={`${session.id}-stat-messages`} className="text-center">
                    <p className="text-2xl font-bold text-green-600">{session.messageCount || 0}</p>
                    <p className="text-sm text-gray-600">Mensajes</p>
                  </div>
                  <div key={`${session.id}-stat-notifications`} className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {session.webhookStats?.totalNotifications || 0}
                    </p>
                    <p className="text-sm text-gray-600">Notificaciones</p>
                  </div>
                  <div key={`${session.id}-stat-clients`} className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {session.webhookStats?.connectedClients || 0}
                    </p>
                    <p className="text-sm text-gray-600">Clientes</p>
                  </div>
                </div>
                
                {session.webhookStats?.webhookActive && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Webhook Activo
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {session.webhookStats.unreadNotifications} sin leer
                      </Badge>
                    </div>
                    {session.webhookStats.lastNotification && (
                      <p className="text-xs text-green-600 mt-1">
                        Última notificación: {new Date(session.webhookStats.lastNotification).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                
                {/* QR Code o código de verificación */}
                {session.qr && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full inline-block mb-2">
                      <Camera className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Escanea este código QR con WhatsApp:</p>
                    <img 
                      src={`data:image/png;base64,${session.qr}`} 
                      alt="QR Code"
                      className="mx-auto max-w-48 border rounded"
                    />
                  </div>
                )}
                
                {session.code && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <div className="bg-blue-200 dark:bg-blue-800 p-3 rounded-full inline-block mb-2">
                      <Key className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <p className="text-sm text-blue-600 mb-2">Código de verificación:</p>
                    <p className="text-2xl font-bold font-mono tracking-wider text-blue-800 dark:text-blue-200">
                      {session.code}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Ingresa este código en WhatsApp Web
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}        
      </div>
      
      {/* Modal de Código de Verificación */}
      {verificationCode && (
        <div key="verification-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card key="verification-modal-card" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  Código de Verificación
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => closeVerificationModal(true)}
                  className="h-8 w-8 p-0 text-xl font-bold hover:bg-red-100 hover:text-red-600 transition-colors"
                  title="Cerrar ventana"
                >
                  ×
                </Button>
              </CardTitle>
              <CardDescription className="text-xs">
                El código expira en {timeRemaining}s.
                {verificationPhoneNumber && (
                  <span className="text-gray-400 ml-1">
                    ({verificationPhoneNumber})
                  </span>
                )}
              </CardDescription>
              
              {/* Estado en tiempo real */}
              <div className="mt-1 p-1.5 rounded border bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    modalSessionStatus === 'authenticated' ? 'bg-green-500 animate-pulse' :
                    modalSessionStatus === 'connected' ? 'bg-yellow-500 animate-pulse' :
                    modalSessionStatus === 'connecting' ? 'bg-blue-500 animate-pulse' :
                    modalSessionStatus === 'disconnected' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-xs font-medium capitalize">{modalSessionStatus}</span>
                  {modalSessionAuthenticated && <span className="text-green-600 text-xs">✓</span>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="text-center space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg relative">
                  <p className="text-2xl font-bold font-mono tracking-wider text-blue-800 dark:text-blue-200">
                    {verificationCode}
                  </p>
                  
                  {/* Botón de copiar */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCodeToClipboard}
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                    title="Copiar"
                  >
                    {codeCopied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-center text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    {codeExpiryTime && timeRemaining > 0 ? (
                      <>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          timeRemaining > 20 ? 'bg-green-500' :
                          timeRemaining > 10 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span>Nuevo código disponible</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  {codeExpiryTime && timeRemaining > 0 ? (
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-1000 ${
                        timeRemaining > 20 ? 'bg-green-500' :
                        timeRemaining > 10 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(timeRemaining / 30) * 100}%` }}
                    />
                  ) : (
                    <div className="h-1.5 rounded-full bg-blue-500 w-full animate-pulse" />
                  )}
                </div>
                
                <div className="flex gap-1.5">
                  <Button
                    onClick={copyCodeToClipboard}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    disabled={!verificationCode}
                  >
                    {codeCopied ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-3 w-3 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={requestNewCode}
                    disabled={requestingNewCode || (codeExpiryTime && timeRemaining > 0)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                  >
                    {requestingNewCode ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Nuevo
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Nuevo
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Botón de diagnóstico mejorado */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="border-t pt-1.5">
                    <Button
                      onClick={() => {
                        console.log('[DEBUG] Estado del modal:')
                        console.log('- verificationCode:', verificationCode)
                        console.log('- verificationSessionName:', verificationSessionName)
                        console.log('- verificationPhoneNumber:', verificationPhoneNumber)
                        console.log('- timeRemaining:', timeRemaining)
                        console.log('- modalSessionStatus:', modalSessionStatus)
                        console.log('- modalSessionAuthenticated:', modalSessionAuthenticated)
                        
                        toast({
                          title: "🔍 Debug",
                          description: `${verificationSessionName || 'N/A'} - ${modalSessionStatus}`,
                        })
                      }}
                      variant="ghost"
                      size="sm"
                      className="w-full h-6 text-xs text-gray-400 hover:text-gray-600"
                    >
                      🔍 Debug
                    </Button>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-2 rounded text-left">
                  WhatsApp > Configuración > Dispositivos vinculados > Vincular dispositivo
                </div>
                
                <Button
                  onClick={closeVerificationModal}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
