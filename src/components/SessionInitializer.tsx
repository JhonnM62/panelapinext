'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'

interface SessionInitializerProps {
  children: React.ReactNode
}

export function SessionInitializer({ children }: SessionInitializerProps) {
  const { user, checkAuth, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    const initializeSession = () => {
      console.log('🔧 [SessionInitializer] Inicializando sesión...')
      
      // Verificar si estamos en una página que requiere autenticación
      const protectedRoutes = ['/dashboard', '/admin', '/gemini']
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
      
      if (!isProtectedRoute) {
        console.log('🔧 [SessionInitializer] Ruta pública, no se requiere verificación')
        return
      }

      // Verificar si hay token en localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.log('🔧 [SessionInitializer] No hay token, redirigiendo a login')
        router.push('/auth/login')
        return
      }

      // Verificar si es una recarga dura
      const isHardRefresh = detectHardRefresh()
      if (isHardRefresh) {
        console.log('🔄 [SessionInitializer] Recarga dura detectada, cerrando sesión')
        logout('hard_refresh')
        router.push('/auth/login')
        return
      }

      // Verificar timeout de inactividad
      const isInactive = checkInactivityTimeout()
      if (isInactive) {
        console.log('🔒 [SessionInitializer] Sesión expirada por inactividad')
        logout('inactivity')
        router.push('/auth/login')
        return
      }

      // Si llegamos aquí, verificar autenticación normalmente
      console.log('✅ [SessionInitializer] Verificando autenticación...')
      checkAuth()
      
      // Actualizar última actividad
      updateLastActivity()
    }

    // Ejecutar inicialización
    initializeSession()

    // Configurar listener para cambios de visibilidad
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // La página se volvió visible, verificar sesión
        console.log('👁️ [SessionInitializer] Página visible, verificando sesión')
        
        const isInactive = checkInactivityTimeout()
        if (isInactive) {
          console.log('🔒 [SessionInitializer] Sesión expirada durante inactividad')
          logout('inactivity')
          router.push('/auth/login')
        } else {
          updateLastActivity()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname, router, checkAuth, logout])

  // Función para detectar recarga dura
  const detectHardRefresh = (): boolean => {
    if (typeof window === 'undefined') return false

    try {
      // Verificar si sessionStorage está vacío (indicativo de recarga dura)
      const sessionStorageEmpty = sessionStorage.length === 0
      
      // Verificar flag específico de recarga dura
      const hardRefreshFlag = sessionStorage.getItem('hard_refresh_flag')
      
      // Verificar tipo de navegación
      if (window.performance) {
        const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation && navigation.type === 'reload') {
          // Es una recarga, verificar si es dura
          if (sessionStorageEmpty || hardRefreshFlag === 'true') {
            return true
          }
        }
      }
      
      return false
    } catch (error) {
      console.error('[SessionInitializer] Error detectando recarga dura:', error)
      return false
    }
  }

  // Función para verificar timeout de inactividad
  const checkInactivityTimeout = (): boolean => {
    const lastActivity = localStorage.getItem('session_last_activity')
    if (!lastActivity) {
      // No hay registro de actividad, asumir que es válido
      return false
    }

    const lastActivityTime = parseInt(lastActivity)
    const now = Date.now()
    const inactivityTimeoutMs = 12 * 60 * 60 * 1000 // 12 horas
    const timeSinceLastActivity = now - lastActivityTime

    return timeSinceLastActivity > inactivityTimeoutMs
  }

  // Función para actualizar última actividad
  const updateLastActivity = () => {
    const now = Date.now()
    localStorage.setItem('session_last_activity', now.toString())
  }

  return <>{children}</>
}