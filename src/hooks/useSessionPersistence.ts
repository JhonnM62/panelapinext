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
  const checkAuthRef = useRef(checkAuth)
  const onSessionExpiredRef = useRef(onSessionExpired)
  const onHardRefreshDetectedRef = useRef(onHardRefreshDetected)
  
  // Actualizar las referencias cuando las funciones cambien
  useEffect(() => {
    checkAuthRef.current = checkAuth
    onSessionExpiredRef.current = onSessionExpired
    onHardRefreshDetectedRef.current = onHardRefreshDetected
  }, [checkAuth, onSessionExpired, onHardRefreshDetected])
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
      return true
    }

    return false
  }, [user, inactivityTimeoutHours, updateLastActivity])

  // Detectar recarga dura (Ctrl+F5)
  const detectHardRefresh = useCallback(() => {
    if (!enableHardRefreshDetection) return false

    // Solo verificar el flag específico de recarga dura
    // No usar sessionStorage.length === 0 porque puede ser falso positivo en desarrollo
    if (typeof window !== 'undefined') {
      const hardRefreshFlag = sessionStorage.getItem(SESSION_KEYS.HARD_REFRESH_FLAG)
      
      if (hardRefreshFlag === 'true') {
        return true
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
        onSessionExpiredRef.current?.()
      logout()
      router.push('/auth/login')
      }
    }, timeoutMs)
  }, [updateLastActivity, inactivityTimeoutHours, checkInactivityTimeout, logout, router])

  // Detectar teclas de recarga dura
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl+F5 o Ctrl+Shift+R
    if ((event.ctrlKey && event.key === 'F5') || 
        (event.ctrlKey && event.shiftKey && event.key === 'R')) {
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
      onHardRefreshDetectedRef.current?.()
      logout()
      router.push('/auth/login')
      return
    }

    // Verificar timeout de inactividad
    if (checkInactivityTimeout()) {
      onSessionExpiredRef.current?.()
      logout()
      router.push('/auth/login')
      return
    }
    
    // Actualizar actividad
    updateLastActivity()
    
    // Verificar autenticación usando la referencia para evitar dependencias
    checkAuthRef.current()
    
    // Configurar timer de inactividad inicial
    const timeoutMs = inactivityTimeoutHours * 60 * 60 * 1000
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    inactivityTimerRef.current = setTimeout(() => {
      if (checkInactivityTimeout()) {
        onSessionExpiredRef.current?.()
        logout()
        router.push('/auth/login')
      }
    }, timeoutMs)

    // Limpiar flags de recarga dura
    sessionStorage.removeItem(SESSION_KEYS.HARD_REFRESH_FLAG)
  }, [detectHardRefresh, checkInactivityTimeout, logout, router, updateLastActivity, inactivityTimeoutHours]) // Removido handleUserActivity para evitar bucle infinito

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