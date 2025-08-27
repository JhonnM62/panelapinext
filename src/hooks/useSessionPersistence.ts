import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

interface SessionPersistenceConfig {
  inactivityTimeoutHours?: number
  enableHardRefreshDetection?: boolean
  onSessionExpired?: () => void
  onHardRefreshDetected?: () => void
}

const SESSION_KEYS = {
  LAST_ACTIVITY: 'session_last_activity',
  SESSION_ID: 'session_id',
  HARD_REFRESH_FLAG: 'hard_refresh_flag',
  NAVIGATION_TYPE: 'navigation_type'
} as const

export function useSessionPersistence(config: SessionPersistenceConfig = {}) {
  const {
    inactivityTimeoutHours = 12,
    enableHardRefreshDetection = true,
    onSessionExpired,
    onHardRefreshDetected
  } = config

  const { user, logout, checkAuth } = useAuthStore()
  const router = useRouter()
  const lastActivityRef = useRef<number>(Date.now())
  const sessionIdRef = useRef<string>(generateSessionId())
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Generar ID único de sesión
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Actualizar última actividad
  const updateLastActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, now.toString())
  }, [])

  // Verificar si la sesión ha expirado por inactividad
  const checkInactivityTimeout = useCallback(() => {
    if (!user) return false

    const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY)
    if (!lastActivity) {
      updateLastActivity()
      return false
    }

    const lastActivityTime = parseInt(lastActivity)
    const now = Date.now()
    const inactivityTimeoutMs = inactivityTimeoutHours * 60 * 60 * 1000
    const timeSinceLastActivity = now - lastActivityTime

    if (timeSinceLastActivity > inactivityTimeoutMs) {
      console.log('🔒 [SessionPersistence] Sesión expirada por inactividad')
      return true
    }

    return false
  }, [user, inactivityTimeoutHours, updateLastActivity])

  // Detectar recarga dura (Ctrl+F5)
  const detectHardRefresh = useCallback(() => {
    if (!enableHardRefreshDetection) return false

    // Verificar si es una recarga dura usando performance.navigation
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        // Tipo 1 = reload, pero necesitamos distinguir entre F5 y Ctrl+F5
        const isReload = navigation.type === 'reload'
        
        if (isReload) {
          // Verificar si sessionStorage está vacío (indicativo de recarga dura)
          const sessionStorageEmpty = sessionStorage.length === 0
          
          // Verificar si hay un flag específico de recarga dura
          const hardRefreshFlag = sessionStorage.getItem(SESSION_KEYS.HARD_REFRESH_FLAG)
          
          if (sessionStorageEmpty || hardRefreshFlag === 'true') {
            console.log('🔄 [SessionPersistence] Recarga dura detectada')
            return true
          }
        }
      }
    }

    return false
  }, [enableHardRefreshDetection])

  // Manejar eventos de actividad del usuario
  const handleUserActivity = useCallback(() => {
    updateLastActivity()
    
    // Reiniciar timer de inactividad
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    
    // Configurar nuevo timer
    const timeoutMs = inactivityTimeoutHours * 60 * 60 * 1000
    inactivityTimerRef.current = setTimeout(() => {
      if (checkInactivityTimeout()) {
        console.log('🔒 [SessionPersistence] Cerrando sesión por inactividad')
        onSessionExpired?.()
        logout()
        router.push('/auth/login')
      }
    }, timeoutMs)
  }, [updateLastActivity, inactivityTimeoutHours, checkInactivityTimeout, onSessionExpired, logout, router])

  // Detectar teclas de recarga dura
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl+F5 o Ctrl+Shift+R
    if ((event.ctrlKey && event.key === 'F5') || 
        (event.ctrlKey && event.shiftKey && event.key === 'R')) {
      console.log('🔄 [SessionPersistence] Recarga dura iniciada por teclado')
      sessionStorage.setItem(SESSION_KEYS.HARD_REFRESH_FLAG, 'true')
    }
  }, [])

  // Manejar beforeunload para detectar recargas
  const handleBeforeUnload = useCallback(() => {
    // Guardar el ID de sesión actual en sessionStorage para recargas normales
    sessionStorage.setItem(SESSION_KEYS.SESSION_ID, sessionIdRef.current)
    
    // Marcar el tipo de navegación
    sessionStorage.setItem(SESSION_KEYS.NAVIGATION_TYPE, 'beforeunload')
  }, [])

  // Inicializar persistencia de sesión
  const initializeSessionPersistence = useCallback(() => {
    if (typeof window === 'undefined') return

    // Verificar si es una recarga dura
    if (detectHardRefresh()) {
      console.log('🔄 [SessionPersistence] Forzando cierre de sesión por recarga dura')
      onHardRefreshDetected?.()
      logout()
      router.push('/auth/login')
      return
    }

    // Verificar timeout de inactividad
    if (checkInactivityTimeout()) {
      console.log('🔒 [SessionPersistence] Forzando cierre de sesión por inactividad')
      onSessionExpired?.()
      logout()
      router.push('/auth/login')
      return
    }

    // Si llegamos aquí, la sesión es válida
    console.log('✅ [SessionPersistence] Sesión válida, manteniendo autenticación')
    
    // Actualizar actividad
    updateLastActivity()
    
    // Verificar autenticación
    checkAuth()
    
    // Configurar timer de inactividad
    handleUserActivity()

    // Limpiar flags de recarga dura
    sessionStorage.removeItem(SESSION_KEYS.HARD_REFRESH_FLAG)
  }, [detectHardRefresh, checkInactivityTimeout, onHardRefreshDetected, onSessionExpired, logout, router, updateLastActivity, checkAuth, handleUserActivity])

  // Configurar event listeners
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return

    // Eventos de actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Eventos de teclado para detectar recargas duras
    document.addEventListener('keydown', handleKeyDown)

    // Evento beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [user, handleUserActivity, handleKeyDown, handleBeforeUnload])

  // Inicializar al montar el componente
  useEffect(() => {
    if (user) {
      initializeSessionPersistence()
    }
  }, [user, initializeSessionPersistence])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [])

  return {
    updateLastActivity,
    checkInactivityTimeout,
    detectHardRefresh,
    sessionId: sessionIdRef.current
  }
}