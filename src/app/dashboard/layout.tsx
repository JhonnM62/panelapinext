'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, Home, MessageSquare, Settings, User, BarChart3, Webhook, LogOut, Bell, CreditCard, Users, Zap, AlertTriangle, Smartphone, TrendingUp, Code, Layers } from '@/components/ui/icons'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

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
    { name: 'Plantillas', href: '/dashboard/templates', icon: Layers },
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
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Baileys API</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400" type="button">
            ✕
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.name} href={item.href} onClick={onClose}>
                <div className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`}>
                  <Icon className={`h-5 w-5 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  <span className="font-medium">{item.name}</span>
                  {active && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              </Link>
            )
          })}
          
          {/* Separador para acción adicional */}
          {user?.membershipExpired && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
              <Link href="/dashboard/plans" onClick={onClose}>
                <div className="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                  <CreditCard className="h-4 w-4" />
                  <span>Actualizar Plan</span>
                </div>
              </Link>
            </>
          )}
        </nav>
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Informacion del Plan - Arriba del contenedor de usuario */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Plan Actual</span>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  user?.tipoplan === 'vitalicio' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  user?.tipoplan === '1año' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  user?.tipoplan === '6meses' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {user?.tipoplan === '14dias' ? 'Gratuito' : 
                   user?.tipoplan === '6meses' ? 'Basico' : 
                   user?.tipoplan === '1año' ? 'Estandar' : 
                   user?.tipoplan === 'vitalicio' ? 'Premium' : 
                   'Basico'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Expira:</span>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(user?.fechaFin || '').split(',')[0]}
                  </div>
                  <div className={`text-xs font-medium ${
                    user?.membershipExpired 
                      ? 'text-red-600 dark:text-red-400' 
                      : (() => {
                          const daysLeft = Math.ceil((new Date(user?.fechaFin || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          return daysLeft <= 7 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-green-600 dark:text-green-400'
                        })()
                  }`}>
                    {user?.membershipExpired 
                      ? 'Expirado' 
                      : (() => {
                          const daysLeft = Math.ceil((new Date(user?.fechaFin || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          return daysLeft <= 0 
                            ? 'Expirado'
                            : daysLeft <= 7 
                              ? `${daysLeft} dias restantes`
                              : daysLeft <= 30
                                ? `${daysLeft} dias restantes`
                                : `${daysLeft} dias restantes`
                        })()
                    }
                  </div>
                </div>
              </div>
              
              {user?.membershipExpired && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">Membresia expirada</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">Actualiza tu plan para continuar</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Contenedor de usuario */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user ? getInitials(user.email) : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.nombrebot || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'email@example.com'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    router.push('/dashboard/settings')
                  }}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Configuracion"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Cerrar sesion"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isLoading, checkAuth, logout } = useAuthStore()

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Redirigir a login si no hay usuario autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  // Función para obtener las iniciales del email
  const getInitials = (email: string) => {
    if (!email) return 'U'
    const parts = email.split('@')[0]
    return parts.slice(0, 2).toUpperCase()
  }

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  // Si no hay usuario, no mostrar nada (se está redirigiendo)
  if (!user) {
    return null
  }

  // Si la membresía expiró y estamos en una página que no es plans/upgrade/dashboard, mostrar interfaz limitada
  if (user.membershipExpired && 
      !pathname.includes('/plans') && 
      !pathname.includes('/upgrade') &&
      !pathname.includes('/dashboard') &&
      !pathname.includes('/settings')) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Membresía Expirada</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tu período de prueba ha terminado. Actualiza tu plan para continuar usando todas las funciones.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => router.push('/dashboard/plans')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Actualizar Plan
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
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
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      <SidebarComponent isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200" type="button">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard Baileys</h1>
            <div className="flex items-center gap-3">
              {user?.membershipExpired && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Membresia expirada</span>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* Banner de membresía expirada */}
        {user.membershipExpired && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white px-4 py-3 text-center text-sm shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Tu membresía ha expirado. Funcionalidad limitada activa.</span>
              <Button 
                size="sm" 
                variant="outline" 
                className="ml-2 h-7 text-xs border-white/40 bg-white/10 text-white hover:bg-white/25 hover:border-white/60 hover:text-white transition-all duration-200 font-medium backdrop-blur-sm"
                onClick={() => router.push('/dashboard/plans')}
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Actualizar Plan
              </Button>
            </div>
          </div>
        )}
        
        <main 
          className="flex-1 overflow-y-auto p-6 mobile-scroll scrollbar-hide" 
          style={{ 
            height: user.membershipExpired ? 'calc(100vh - 8rem)' : 'calc(100vh - 4rem)', 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
