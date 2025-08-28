'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter, usePathname } from 'next/navigation'

interface SessionInitializerProps {
  children: React.ReactNode
}

export function SessionInitializer({ children }: SessionInitializerProps) {
  const { initializeAuth } = useAuthStore()
  const pathname = usePathname()

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    // Solo inicializar autenticación desde cookies si es necesario
    // No hacer verificaciones adicionales aquí para evitar conflictos
    // con useSessionPersistence en el dashboard
    const protectedRoutes = ['/dashboard', '/admin', '/gemini']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    
    if (isProtectedRoute) {
      // Solo inicializar desde cookies, no verificar ni redirigir
      initializeAuth()
    }
  }, [pathname, initializeAuth])

  return <>{children}</>
}