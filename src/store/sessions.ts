import { create } from 'zustand'
import { Session, SessionCreateRequest, SessionEnhanced, CreateSessionEnhancedRequest } from '@/types'
import { sessionsAPI, authAPI } from '@/lib/api'
import { enhancedBaileysAPI } from '@/lib/gemini-api' // NUEVO: API Enhanced
import { canCreateSession, getSessionsLimitMessage } from '@/lib/plans'

interface SessionsState {
  sessions: Session[]
  selectedSession: Session | null
  isLoading: boolean
  error: string | null
  autoRefreshInterval: NodeJS.Timeout | null
  lastFullUpdate: number
  
  // Actions
  fetchSessions: () => Promise<void>
  createSession: (data: SessionCreateRequest) => Promise<Session>
  createSessionEnhanced: (data: CreateSessionEnhancedRequest) => Promise<Session> // NUEVO
  deleteSession: (nombreBot: string) => Promise<void>
  getSessionStatus: (id: string) => Promise<void>
  setSelectedSession: (session: Session | null) => void
  clearError: () => void
  startAutoRefresh: () => void
  stopAutoRefresh: () => void
}

export const useSessionsStore = create<SessionsState>((set, get) => ({
  sessions: [],
  selectedSession: null,
  isLoading: false,
  error: null,
  autoRefreshInterval: null,
  lastFullUpdate: 0,

  fetchSessions: async () => {
    try {
      set({ isLoading: true, error: null })
      
      // **MEJORA: Intentar usar API Enhanced primero**
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('auth-storage')
      
      if (token && userStr) {
        try {
          // Intentar obtener sesiones del usuario desde la API Enhanced
          // Por ahora usar la API regular hasta que se implemente getUserSessionsEnhanced
          // const response = await enhancedBaileysAPI.getUserSessionsEnhanced(token)
          
          // if (response.success && response.data) {
          //   console.log('🔧 [Sessions] Usando API Enhanced para sesiones')
          //   
          //   // Convertir sesiones enhanced a formato legacy para compatibilidad
          //   const enhancedSessions = response.data.sesiones || []
          //   const compatibleSessions: Session[] = enhancedSessions.map(sesion => ({
          //     id: sesion.nombresesion,
          //     status: mapEstadoToStatus(sesion.estadoSesion),
          //     qr: sesion.codigoQR,
          //     phoneNumber: sesion.lineaWhatsApp,
          //     createdAt: sesion.fechaCreacion,
          //     userId: sesion.userId
          //   }))
          //   
          //   console.log('🔧 [Sessions] Sesiones Enhanced obtenidas:', compatibleSessions.length)
          //   set({ sessions: compatibleSessions, isLoading: false })
          //   return
          // }
        } catch (enhancedError) {
          console.log('🔧 [Sessions] API Enhanced no disponible, usando API legacy')
        }
      }
      
      // **FALLBACK: Usar API legacy pero con endpoint de usuario**
      // Reutilizar token ya declarado arriba
      let response
      
      if (token) {
        // Usar endpoint V2 específico del usuario
        response = await sessionsAPI.listForUser(token)
      } else {
        // Fallback a endpoint V1 básico
        response = await sessionsAPI.list()
      }
      
      console.log('🔧 [Sessions] Respuesta de API:', {
        success: response.success,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'N/A',
        hasUserSessions: !!(response.data && response.data.sesiones),
        userSessionsLength: response.data?.sesiones?.length || 0
      })
      
      // Si es respuesta V2 (sesiones del usuario), mapear directamente
      if (token && response.data && response.data.sesiones && Array.isArray(response.data.sesiones)) {
        const userSessions = response.data.sesiones
        const compatibleSessions: Session[] = userSessions.map((sesion: any) => {
          // 🔧 CORRECCIÓN: Mapear correctamente los estados
          let mappedStatus = 'disconnected'
          if (sesion.estadoSesion === 'conectada') {
            mappedStatus = 'authenticated'
          } else if (sesion.estadoSesion === 'conectando') {
            mappedStatus = 'connecting'
          } else if (sesion.estadoSesion === 'desconectada' || sesion.estadoSesion === 'eliminada') {
            mappedStatus = 'disconnected'
          } else {
            // Usar función de mapeo para otros estados
            mappedStatus = mapEstadoToStatus(sesion.estadoSesion || 'disconnected')
          }
          
          return {
            id: sesion.id || sesion.nombresesion,
            status: mappedStatus,
            qr: sesion.qr || sesion.codigoQR,
            phoneNumber: sesion.lineaWhatsApp || sesion.phoneNumber,
            createdAt: sesion.fechaCreacion || sesion.createdAt || new Date().toISOString(),
            userId: sesion.userId
          }
        })
        
        console.log('🔧 [Sessions] Sesiones V2 mapeadas:', compatibleSessions.length)
        console.log('🔧 [Sessions] Detalles de mapeo:', compatibleSessions.map(s => `${s.id}: ${s.status}`).join(', '))
        set({ sessions: compatibleSessions, isLoading: false })
        return
      }
      
      // Fallback a lógica V1
      const sessionIds = response?.data?.data || response?.data || []
      
      // Solo procesar si tenemos IDs de sesiones (modo V1)
      if (Array.isArray(sessionIds) && sessionIds.length > 0) {
        // Obtener sesiones actuales del estado local
        const currentLocalSessions = get().sessions
        
        // Obtener el estado de cada sesión del servidor
        const serverSessions: Session[] = []
        for (const id of sessionIds) {
          try {
            const statusResponse = await sessionsAPI.status(id)
            serverSessions.push({
              id,
              status: statusResponse?.data?.status || 'disconnected',
              createdAt: new Date().toISOString()
            })
          } catch (error) {
            serverSessions.push({
              id,
              status: 'disconnected',
              createdAt: new Date().toISOString()
            })
          }
        }
        
        // PRESERVAR sesiones locales que no están en el servidor (recién creadas)
        const localOnlyIDs = new Set(sessionIds)
        const sessionsToPreserve = currentLocalSessions.filter(localSession => {
          // Preservar si la sesión local no está en el servidor Y fue creada recientemente (últimos 2 minutos)
          const isRecent = localSession.createdAt ? new Date().getTime() - new Date(localSession.createdAt).getTime() < 120000 : false // 2 minutos
          const notInServer = !localOnlyIDs.has(localSession.id)
          
          if (notInServer && isRecent) {
            console.log(`Preservando sesión recién creada: ${localSession.id}`)
            return true
          }
          return false
        })
        
        // Combinar sesiones del servidor con sesiones locales preservadas
        const finalSessions = [...serverSessions, ...sessionsToPreserve]
        
        console.log('Sesiones finales después de fetch:', finalSessions.map(s => `${s.id}(${s.status})`).join(', '))
        
        set({ sessions: finalSessions, isLoading: false })
      } else {
        console.log('🔧 [Sessions] No hay sesiones V1, manteniendo estado actual')
        set({ isLoading: false })
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Error al obtener sesiones',
        isLoading: false 
      })
    }
  },

  createSession: async (data: SessionCreateRequest) => {
    try {
      set({ isLoading: true, error: null })
      
      // === PASO 0: DETENER AUTO-REFRESH PARA EVITAR INTERFERENCIAS ===
      const { stopAutoRefresh } = get()
      stopAutoRefresh()
      
      // Verificar límites de sesiones según el plan del usuario
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const userStr = localStorage.getItem('auth-storage')
          if (userStr) {
            const authData = JSON.parse(userStr)
            const user = authData.state?.user
            
            if (user && !canCreateSession(user, get().sessions.length)) {
              const limitMessage = getSessionsLimitMessage(user, get().sessions.length)
              set({ 
                error: limitMessage,
                isLoading: false 
              })
              throw new Error(limitMessage)
            }
          }
        } catch (parseError) {
          // Si no se puede parsear, continuar con la creación
          console.warn('Could not parse user data for session validation')
        }
      }
      
      console.log('Iniciando proceso de creación de sesión con datos:', data)
      
      // === PASO 1: CAPTURAR SESIONES ACTUALES ANTES DE LIMPIAR ===
      const currentSessions = get().sessions
      console.log('Sesiones actuales antes de limpiar:', currentSessions.map(s => s.id))
      
      // === PASO 2: LIMPIEZA PREVIA (SOLO SESIONES NO AUTENTICADAS) ===
      // 🔧 CORRECCIÓN: No eliminar sesiones autenticadas/conectadas
      const sessionsToClean = currentSessions.filter(session => 
        session.status !== 'authenticated' && session.status !== 'connected'
      )
      
      if (sessionsToClean.length > 0) {
        console.log(`🔧 Limpiando ${sessionsToClean.length} sesiones no autenticadas:`, 
          sessionsToClean.map(s => `${s.id}(${s.status})`).join(', '))
        await cleanupSpecificSessions(sessionsToClean, token)
      } else {
        console.log('🔧 No hay sesiones para limpiar - todas están autenticadas')
      }
      
      // === PASO 3: CREAR NUEVA SESIÓN ===
      console.log('Creando nueva sesión...')
      const response = await sessionsAPI.add({
        nombrebot: data.nombrebot,
        typeAuth: 'qr', // Usar QR para mostrar código
        phoneNumber: data.phoneNumber
      })
      
      console.log('Respuesta del servidor:', response.data)
      
      // === PASO 4: CONFIGURAR SESIÓN EN EL ESTADO ===
      const newSession: Session = {
        id: data.nombrebot,
        status: 'connecting',
        qr: response.data?.qrcode || response.data?.data?.qr, // QR de la respuesta
        code: response.data?.data?.code, // Código de verificación
        phoneNumber: data.phoneNumber,
        createdAt: new Date().toISOString()
      }
      
      // Limpiar estado y agregar SOLO la nueva sesión
      set(() => ({
        sessions: [newSession],
        selectedSession: newSession,
        isLoading: false
      }))
      
      console.log('Nueva sesión configurada en el estado:', newSession.id)
      
      // === PASO 5: REACTIVAR AUTO-REFRESH DESPUÉS DE 30 SEGUNDOS ===
      setTimeout(() => {
        console.log('Reactivando auto-refresh después de crear sesión')
        get().startAutoRefresh()
      }, 30000) // 30 segundos para que la sesión se registre en el servidor
      
      // === PASO 6: MONITOREO DE ESTADO ===
      setTimeout(() => {
        startSessionStatusMonitoring(data.nombrebot)
      }, 2000)
      
      return newSession
      
    } catch (error: any) {
      console.error('Error completo en createSession:', error)
      console.error('Respuesta del error:', error.response)
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Error al crear sesión'
      
      set({ 
        error: errorMessage,
        isLoading: false 
      })
      throw error
    }
  },

  deleteSession: async (nombreBot: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const token = localStorage.getItem('token')
      
      // Ejecutar ambas operaciones de limpieza de forma segura
      await cleanupSessionAndUser(nombreBot, token)
      
      set((state) => ({
        sessions: state.sessions.filter(s => s.id !== nombreBot),
        selectedSession: state.selectedSession?.id === nombreBot ? null : state.selectedSession,
        isLoading: false
      }))
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Error al eliminar sesión',
        isLoading: false 
      })
      throw error
    }
  },

  getSessionStatus: async (id: string) => {
    try {
      const response = await sessionsAPI.status(id)
      const status = response?.data?.status
      
      set((state) => ({
        sessions: state.sessions.map(s => 
          s.id === id ? { ...s, status } : s
        ),
        selectedSession: state.selectedSession?.id === id 
          ? { ...state.selectedSession, status }
          : state.selectedSession
      }))
    } catch (error: any) {
      console.error('Error getting session status:', error)
    }
  },

  setSelectedSession: (session: Session | null) => {
    set({ selectedSession: session })
  },

  clearError: () => set({ error: null }),

  startAutoRefresh: () => {
    const { autoRefreshInterval, stopAutoRefresh } = get()
    
    // Si ya hay un intervalo activo, detenerlo primero
    if (autoRefreshInterval) {
      stopAutoRefresh()
    }
    
    // Actualizar sesiones cada 10 segundos (aumentado para dar tiempo a nuevas sesiones)
    const interval = setInterval(async () => {
      const { sessions } = get()
      
      // Solo actualizar si hay sesiones
      if (sessions.length > 0) {
        try {
          // Actualizar solo sesiones que no estén en estado final
          const sessionsToUpdate = sessions.filter(session => 
            session.status === 'connecting' || session.status === 'disconnecting'
          )
          
          // Si hay sesiones en estado de transición, actualizarlas individualmente
          if (sessionsToUpdate.length > 0) {
            for (const session of sessionsToUpdate) {
              await get().getSessionStatus(session.id)
            }
          }
          
          // Hacer fetch completo solo cada 60 segundos para evitar sobrescribir sesiones recientes
          const now = Date.now()
          const lastFullUpdate = get().lastFullUpdate || 0
          
          if (now - lastFullUpdate > 60000) { // 60 segundos en lugar de 30
            console.log('Ejecutando fetch completo de sesiones...')
            await get().fetchSessions()
            set({ lastFullUpdate: now })
          }
        } catch (error) {
          console.error('Error en auto-refresh:', error)
        }
      }
    }, 10000) // 10 segundos en lugar de 5
    
    set({ autoRefreshInterval: interval })
  },

  stopAutoRefresh: () => {
    const { autoRefreshInterval } = get()
    
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval)
      set({ autoRefreshInterval: null })
    }
  },

  // **NUEVA FUNCIÓN: Crear sesión con API Enhanced**
  createSessionEnhanced: async (data: CreateSessionEnhancedRequest) => {
    try {
      set({ isLoading: true, error: null })
      
      console.log('🔧 [Sessions] Iniciando creación Enhanced:', data)
      
      // Verificar límites usando numerodesesiones
      const userStr = localStorage.getItem('auth-storage')
      if (userStr) {
        try {
          const authData = JSON.parse(userStr)
          const user = authData.state?.user
          
          if (user && !canCreateSession(user, get().sessions.length)) {
            const limitMessage = getSessionsLimitMessage(user, get().sessions.length)
            set({ error: limitMessage, isLoading: false })
            throw new Error(limitMessage)
          }
        } catch (parseError) {
          console.warn('Could not parse user data for session validation')
        }
      }
      
      // Crear sesión usando API regular por ahora
      // TODO: Implementar createSessionEnhanced en enhancedBaileysAPI
      const response = await sessionsAPI.add({
        nombrebot: data.nombresesion,
        typeAuth: data.tipoAuth || 'qr',
        phoneNumber: data.lineaWhatsApp
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Error al crear sesión Enhanced')
      }
      
      console.log('🔧 [Sessions] Respuesta:', response?.data || 'No data')
      
      // Convertir respuesta a formato compatible
      const newSession: Session = {
        id: data.nombresesion,
        status: 'connecting',
        qr: response.data?.qrcode || response.data?.data?.qr,
        phoneNumber: data.lineaWhatsApp,
        createdAt: new Date().toISOString(),
        userId: data.token
      }
      
      // Actualizar estado
      set((state) => ({
        sessions: [...state.sessions, newSession],
        selectedSession: newSession,
        isLoading: false
      }))
      
      console.log('🔧 [Sessions] Sesión Enhanced creada exitosamente:', newSession.id)
      
      return newSession
      
    } catch (error: any) {
      console.error('🔧 [Sessions] Error en createSessionEnhanced:', error)
      set({ 
        error: error.message || 'Error al crear sesión Enhanced',
        isLoading: false 
      })
      throw error
    }
  },
}))

// === FUNCIONES AUXILIARES ===

/**
 * Mapea estados Enhanced a estados legacy para compatibilidad
 * 🔧 CORRECCIÓN: 'autenticada' y 'conectada' manejan diferentes niveles de conexión
 */
function mapEstadoToStatus(estadoSesion: string): 'connecting' | 'connected' | 'authenticated' | 'disconnected' | 'disconnecting' {
  switch (estadoSesion) {
    case 'creada':
    case 'conectando':
      return 'connecting'
    case 'autenticada':
      // 🔧 NUEVO: Estado autenticada mapea a authenticated
      return 'authenticated'
    case 'conectada':
      // 🔧 CORRECCIÓN: Estado conectada mapea a connected (completamente operativo)
      return 'connected'
    case 'desconectada':
    case 'error':
    case 'eliminada':
      return 'disconnected'
    default:
      return 'disconnected'
  }
}

/**
 * Mapea estados legacy a estados Enhanced
 * 🔧 CORRECCIÓN: Mapeo bidireccional correcto con nuevo estado autenticada
 */
function mapStatusToEstado(status: string): 'creada' | 'conectando' | 'autenticada' | 'conectada' | 'desconectada' | 'error' | 'eliminada' {
  switch (status) {
    case 'connecting':
      return 'conectando'
    case 'authenticated':
      // 🔧 NUEVO: authenticated mapea a autenticada
      return 'autenticada'
    case 'connected':
      // 🔧 CORRECCIÓN: connected mapea a conectada (completamente operativo)
      return 'conectada'
    case 'disconnecting':
      return 'desconectada'
    case 'disconnected':
      return 'desconectada'
    default:
      return 'desconectada'
  }
}

/**
 * Limpia sesiones específicas (NO AUTENTICADAS) para evitar eliminar sesiones activas
 * 🔧 CORRECCIÓN: Solo limpiar sesiones que NO están autenticadas
 */
async function cleanupSpecificSessions(sessionsToClean: Session[], token: string | null): Promise<void> {
  try {
    console.log('🛠️ Iniciando limpieza de sesiones específicas (solo no autenticadas)...')
    
    if (sessionsToClean.length > 0) {
      console.log(`🛠️ Encontradas ${sessionsToClean.length} sesiones para eliminar:`, 
        sessionsToClean.map(s => `${s.id}(${s.status})`).join(', '))
      
      // 🔧 VALIDACIÓN: Verificar que NO hay sesiones autenticadas en la lista
      const authenticatedSessions = sessionsToClean.filter(s => 
        s.status === 'authenticated' || s.status === 'connected'
      )
      
      if (authenticatedSessions.length > 0) {
        console.warn('⚠️ ADVERTENCIA: Se intentó eliminar sesiones autenticadas:', 
          authenticatedSessions.map(s => `${s.id}(${s.status})`).join(', '))
        console.warn('⚠️ Estas sesiones se excluirán de la limpieza para preservar conexiones activas')
        
        // Filtrar sesiones autenticadas de la lista
        const filteredSessions = sessionsToClean.filter(s => 
          s.status !== 'authenticated' && s.status !== 'connected'
        )
        
        if (filteredSessions.length === 0) {
          console.log('✅ No hay sesiones no autenticadas para limpiar')
          return
        }
        
        // Actualizar lista a solo sesiones no autenticadas
        sessionsToClean = filteredSessions
        console.log(`🛠️ Lista filtrada: ${sessionsToClean.length} sesiones no autenticadas a eliminar`)
      }
      
      // === PASO 1: NO ELIMINAR USUARIO SI HAY SESIONES AUTENTICADAS ===
      // 🔧 CORRECCIÓN: Solo eliminar usuario si no hay sesiones autenticadas activas
      const allCurrentSessions = useSessionsStore.getState().sessions
      const hasAuthenticatedSessions = allCurrentSessions.some(s => 
        s.status === 'authenticated' || s.status === 'connected'
      )
      
      if (token && !hasAuthenticatedSessions) {
        try {
          console.log('🛠️ Eliminando usuario de la base de datos (no hay sesiones autenticadas)...')
          await authAPI.deleteUser(token)
          console.log('✅ Usuario eliminado exitosamente de la base de datos')
        } catch (error: any) {
          console.warn('⚠️ Advertencia al eliminar usuario:', error.response?.data?.message || error.message)
          // No lanzar error, continuar con el proceso
        }
      } else if (hasAuthenticatedSessions) {
        console.log('🔒 Usuario preservado - hay sesiones autenticadas activas')
      } else {
        console.warn('⚠️ No hay token disponible para eliminar usuario')
      }
      
      // === PASO 2: ELIMINAR CADA SESIÓN NO AUTENTICADA ===
      const deletionResults = await Promise.allSettled(
        sessionsToClean.map(async (session) => {
          try {
            console.log(`🛠️ Eliminando sesión no autenticada: ${session.id} (${session.status})`)
            await sessionsAPI.delete(session.id)
            console.log(`✅ Sesión ${session.id} eliminada exitosamente`)
            return { success: true, sessionId: session.id }
          } catch (error: any) {
            console.warn(`⚠️ Error eliminando sesión ${session.id}:`, error.response?.data?.message || error.message)
            return { success: false, sessionId: session.id, error: error.message }
          }
        })
      )
      
      // Reportar resultados
      const successful = deletionResults.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length
      
      console.log(`✅ Limpieza completada: ${successful}/${sessionsToClean.length} sesiones no autenticadas eliminadas`)
      
    } else {
      console.log('✅ No hay sesiones no autenticadas para limpiar')
    }
    
    // Esperar un momento para que las operaciones se completen
    await new Promise(resolve => setTimeout(resolve, 500))
    
  } catch (error: any) {
    console.error('❌ Error durante la limpieza de sesiones:', error)
    // No lanzar error para permitir que continúe la creación de sesión
  }
}

/**
 * Limpia una sesión específica y usuario asociado
 */
async function cleanupSessionAndUser(sessionId: string, token: string | null): Promise<void> {
  const errors: string[] = []
  
  try {
    // === PASO 1: ELIMINAR USUARIO DE LA BASE DE DATOS ===
    if (token) {
      try {
        console.log('Eliminando usuario de la base de datos...')
        await authAPI.deleteUser(token)
        console.log('Usuario eliminado exitosamente')
      } catch (error: any) {
        const errorMsg = `Error eliminando usuario: ${error.response?.data?.message || error.message}`
        console.warn(errorMsg)
        errors.push(errorMsg)
      }
    }
    
    // === PASO 2: ELIMINAR SESIÓN ===
    try {
      console.log(`Eliminando sesión: ${sessionId}`)
      await sessionsAPI.delete(sessionId)
      console.log('Sesión eliminada exitosamente')
    } catch (error: any) {
      const errorMsg = `Error eliminando sesión: ${error.response?.data?.message || error.message}`
      console.error(errorMsg)
      errors.push(errorMsg)
      throw error // Este error sí debe propagarse
    }
    
    // Si hubo errores menores, reportarlos pero no fallar
    if (errors.length > 0) {
      console.warn('Se completó la eliminación con algunas advertencias:', errors)
    }
    
  } catch (error: any) {
    console.error('Error crítico durante la limpieza:', error)
    throw error
  }
}

/**
 * Inicia el monitoreo del estado de una sesión
 */
function startSessionStatusMonitoring(sessionId: string): void {
  console.log(`Iniciando monitoreo de estado para sesión: ${sessionId}`)
  
  const checkStatus = async () => {
    try {
      // Verificar que la sesión aún existe en el estado antes de hacer polling
      const currentState = useSessionsStore.getState()
      const sessionExists = currentState.sessions.some(s => s.id === sessionId)
      
      if (!sessionExists) {
        console.log(`Sesión ${sessionId} ya no existe en el estado, deteniendo monitoreo`)
        return
      }
      
      const statusResponse = await sessionsAPI.status(sessionId)
      const status = statusResponse?.data?.status
      
      console.log(`Estado de sesión ${sessionId}:`, status)
      
      // Actualizar estado en el store SOLO si la sesión aún existe
      useSessionsStore.setState((state) => {
        const sessionStillExists = state.sessions.some(s => s.id === sessionId)
        if (!sessionStillExists) {
          console.log(`Sesión ${sessionId} fue eliminada durante el monitoreo`)
          return state // No cambiar nada
        }
        
        return {
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { ...s, status } : s
          ),
          selectedSession: state.selectedSession?.id === sessionId 
            ? { ...state.selectedSession, status }
            : state.selectedSession
        }
      })
      
      // Continuar polling si no está conectado o autenticado
      if (status === 'connecting') {
        setTimeout(checkStatus, 3000)
      } else if (status === 'authenticated') {
        console.log(`Sesión ${sessionId} autenticada exitosamente`)
      } else if (status === 'disconnected') {
        console.log(`Sesión ${sessionId} desconectada`)
      }
      
    } catch (error) {
      console.error('Error checking session status:', error)
      // Verificar si la sesión aún existe antes de reintentar
      const currentState = useSessionsStore.getState()
      const sessionExists = currentState.sessions.some(s => s.id === sessionId)
      
      if (sessionExists) {
        // Reintentar en caso de error solo si la sesión aún existe
        setTimeout(checkStatus, 5000)
      } else {
        console.log(`Sesión ${sessionId} ya no existe, deteniendo reintentos`)
      }
    }
  }
  
  // Iniciar polling después de 2 segundos
  setTimeout(checkStatus, 2000)
}
