'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'

interface SessionInitializerProps {
  children: React.ReactNode
}

export function SessionInitializer({ children }: SessionInitializerProps) {
  const { user, checkAuth, logout, initializeAuth } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    let isInitialized = false

    const initializeSession = () => {
      if (isInitialized) return // Evitar múltiples inicializaciones
      
      // Inicializar autenticación desde cookies si es necesario
      initializeAuth()
      
      // Verificar si estamos en una página que requiere autenticación
      const protectedRoutes = ['/dashboard', '/admin', '/gemini']
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
      
      if (!isProtectedRoute) {
        isInitialized = true
        return
      }

      // Si ya hay un usuario autenticado en el store, no hacer nada
      if (user) {
        updateLastActivity()
        isInitialized = true
        return
      }

      // Verificar si hay token en localStorage
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/auth/login')
        isInitialized = true
        return
      }

      // Verificar timeout de inactividad
      const isInactive = checkInactivityTimeout()
      if (isInactive) {
        logout('inactivity')
        router.push('/auth/login')
        isInitialized = true
        return
      }

      // Si llegamos aquí, verificar autenticación normalmente
      checkAuth()
      updateLastActivity()
      isInitialized = true
    }

    // Configurar listener para cambios de visibilidad
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        const isInactive = checkInactivityTimeout()
        if (isInactive) {
          logout('inactivity')
          router.push('/auth/login')
        } else {
          updateLastActivity()
        }
      }
    }

    // Ejecutar inicialización
    initializeSession()
    
    // Agregar listener de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname, router, user, checkAuth, logout, initializeAuth])

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