'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, Home, MessageSquare, Settings, User, BarChart3, Webhook, LogOut, Bell, CreditCard, Users, Zap, AlertTriangle, Smartphone, TrendingUp, Code, Layers } from '@/components/ui/icons'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuthStore } from '@/store/auth'
import { useSessionPersistence } from '@/hooks/useSessionPersistence'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

// 🎨 SIDEBAR COMPONENT MEJORADO - 100% RESPONSIVE
function SidebarComponent({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  // Función para obtener las iniciales del email
  const getInitials = (email: string) => {
    if (!email) return 'U'
    const parts = email.split('@')[0]
    return parts.slice(0, 2).toUpperCase()
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Sesiones WhatsApp', href: '/dashboard/sessions', icon: MessageSquare },
    { name: 'WhatsApp', href: '/dashboard/whatsapp', icon: Smartphone },
    { name: 'Mensajes', href: '/dashboard/chats', icon: MessageSquare },
    { name: 'Chatbots', href: '/dashboard/templates', icon: Layers },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
    { name: 'Analíticas', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Performance', href: '/dashboard/performance', icon: TrendingUp },
    { name: 'Planes', href: '/dashboard/plans', icon: CreditCard },
    { name: 'Developer', href: '/dashboard/developer', icon: Code },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ]

  // Función para verificar si la ruta está activa
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Filtrar navegación según el usuario
  const filteredNavigation = user?.membershipExpired 
    ? navigation.filter(item => ['Dashboard', 'Sesiones WhatsApp', 'Planes', 'Configuración'].includes(item.name))
    : navigation

  return (
    <>
      {/* 📱 Mobile Overlay - Mejorado */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}
      
      {/* 🎨 SIDEBAR CONTAINER - RESPONSIVE PERFECTO */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700",
        "transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
        "shadow-xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* 🏷️ HEADER - Responsive */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Baileys API</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">v2.3</span>
            </div>
          </div>
          {/* 📱 Close button - Mobile only */}
          <button 
            onClick={onClose} 
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Cerrar menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 🧭 NAVIGATION - Totalmente responsive */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.name} href={item.href} onClick={onClose}>
                <div className={cn(
                  "group flex items-center space-x-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200",
                  "hover:scale-[1.02] transform",
                  active 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  )} />
                  <span className="font-medium flex-1">{item.name}</span>
                  {active && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </div>
              </Link>
            )
          })}
          
          {/* 🚨 Separador para membresía expirada */}
          {user?.membershipExpired && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-6" />
              <Link href="/dashboard/plans" onClick={onClose}>
                <div className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-amber-500/25">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-semibold">Actualizar Plan</span>
                </div>
              </Link>
            </>
          )}
        </nav>
        
        {/* 📊 PLAN INFO - Responsive */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Plan Actual</span>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  user?.tipoplan === 'vitalicio' ? 'bg-purple-500 text-white' :
                  user?.tipoplan === '1año' ? 'bg-green-500 text-white' :
                  user?.tipoplan === '6meses' ? 'bg-blue-500 text-white' :
                  'bg-gray-400 text-white'
                )}>
                  {user?.tipoplan === '14dias' ? 'Gratuito' : 
                   user?.tipoplan === '6meses' ? 'Básico' : 
                   user?.tipoplan === '1año' ? 'Estándar' : 
                   user?.tipoplan === 'vitalicio' ? 'Premium' : 
                   'Básico'}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Expira:</span>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    {formatDate(user?.fechaFin || '').split(',')[0]}
                  </div>
                  <div className={cn(
                    "text-xs font-semibold",
                    user?.membershipExpired 
                      ? 'text-red-500' 
                      : (() => {
                          const daysLeft = Math.ceil((new Date(user?.fechaFin || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          return daysLeft <= 7 ? 'text-amber-500' : 'text-green-500'
                        })()
                  )}>
                    {user?.membershipExpired 
                      ? 'EXPIRADO' 
                      : `${Math.ceil((new Date(user?.fechaFin || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días`}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 👤 USER INFO - Responsive */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                {getInitials(user?.email || '')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user?.email?.split('@')[0] || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.rol || 'user'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// 🚀 DASHBOARD LAYOUT COMPONENT - SUPER RESPONSIVE
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Configurar persistencia de sesión con callbacks personalizados
  useSessionPersistence({
    inactivityTimeoutHours: 12,
    enableHardRefreshDetection: true,
    onSessionExpired: () => {
      console.log('🔒 [Dashboard] Sesión expirada por inactividad')
      // El logout ya se maneja en el hook
    },
    onHardRefreshDetected: () => {
      console.log('🔄 [Dashboard] Recarga dura detectada')
      // El logout ya se maneja en el hook
    }
  })

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/auth/login')
      } else {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [user, router])

  // Función para obtener las iniciales del email
  const getInitials = (email: string) => {
    if (!email) return 'U'
    const parts = email.split('@')[0]
    return parts.slice(0, 2).toUpperCase()
  }

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12 text-blue-600 mb-4" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, no mostrar nada (se está redirigiendo)
  if (!user) {
    return null
  }

  // Si la membresía expiró y estamos en una página restringida
  if (user.membershipExpired && 
      !pathname.includes('/plans') && 
      !pathname.includes('/upgrade') &&
      !pathname.includes('/dashboard') &&
      !pathname.includes('/settings')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-2xl border-0">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Membresía Expirada</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Tu período de prueba ha terminado. Actualiza tu plan para continuar usando todas las funciones.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={() => router.push('/dashboard/plans')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold shadow-lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Actualizar Plan
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1 h-12 text-lg font-medium"
              >
                Ver Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <SidebarComponent isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      {/* 📱 MAIN CONTENT AREA - SUPER RESPONSIVE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 🎯 TOP BAR - Mobile Optimized */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <button 
              onClick={() => setMenuOpen(true)} 
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Page title - responsive */}
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
              Dashboard Baileys
            </h1>
            
            {/* Right section */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Membership warning - responsive */}
              {user?.membershipExpired && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs lg:text-sm font-medium text-amber-700 dark:text-amber-300">
                    Membresía expirada
                  </span>
                </div>
              )}
              
              {/* Theme toggle */}
              <ThemeToggle />
              
              {/* Mobile user menu */}
              <div className="lg:hidden flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  {getInitials(user?.email || '')}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* 🚨 MEMBERSHIP BANNER - Mobile optimized */}
        {user.membershipExpired && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white px-4 py-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base">Tu membresía ha expirado. Funcionalidad limitada activa.</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs border-white/40 bg-white/10 text-white hover:bg-white/25 hover:border-white/60 hover:text-white transition-all duration-200 font-medium backdrop-blur-sm"
                onClick={() => router.push('/dashboard/plans')}
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Actualizar Plan
              </Button>
            </div>
          </div>
        )}
        
        {/* 🎨 MAIN CONTENT - Perfect responsive */}
        <main 
          className={cn(
            "flex-1 bg-gray-50 dark:bg-gray-900",
            "p-4 sm:p-6 lg:p-8",
            "min-h-0" // Permite que el contenido se ajuste naturalmente
          )}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}