'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Users, 
  Smartphone, 
  CreditCard, 
  MessageSquare, 
  Settings,
  Webhook,
  Bot,
  Crown,
  RefreshCw,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

// Importar componentes de administración
import UsersManagement from '@/components/admin/UsersManagement'
import SessionsManagement from '@/components/admin/SessionsManagement'
import PlansManagement from '@/components/admin/PlansManagement'
import WebhooksManagement from '@/components/admin/WebhooksManagement'
import ChatbotsManagement from '@/components/admin/ChatbotsManagement'
import GeminiManagement from '@/components/admin/GeminiManagement'
import SystemSettings from '@/components/admin/SystemSettings'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.42.185.2:8015'

// 🎨 TABS CONFIGURATION - Organizado y responsive
const adminTabs = [
  {
    id: 'users',
    label: 'Usuarios',
    icon: Users,
    color: 'blue',
    description: 'Gestionar usuarios del sistema'
  },
  {
    id: 'sessions',
    label: 'Sesiones',
    icon: Smartphone,
    color: 'green',
    description: 'Administrar sesiones WhatsApp'
  },
  {
    id: 'plans',
    label: 'Planes',
    icon: CreditCard,
    color: 'purple',
    description: 'Configurar planes y precios'
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: Webhook,
    color: 'orange',
    description: 'Gestionar webhooks del sistema'
  },
  {
    id: 'chatbots',
    label: 'Chatbots',
    icon: Bot,
    color: 'indigo',
    description: 'Administrar bots con IA'
  },
  {
    id: 'gemini',
    label: 'Gemini IA',
    icon: MessageSquare,
    color: 'pink',
    description: 'Configuración de IA Gemini'
  },
  {
    id: 'system',
    label: 'Sistema',
    icon: Settings,
    color: 'gray',
    description: 'Configuraciones del sistema'
  }
]

// 🎨 MOBILE TAB SELECTOR COMPONENT
function MobileTabSelector({ 
  activeTab, 
  onTabChange, 
  isOpen, 
  onToggle 
}: { 
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen: boolean
  onToggle: () => void
}) {
  const currentTab = adminTabs.find(tab => tab.id === activeTab)
  
  return (
    <div className="md:hidden mb-6">
      {/* 📱 Current Tab Display */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3">
          {currentTab && (
            <>
              <div className={`p-2 rounded-lg bg-${currentTab.color}-100 dark:bg-${currentTab.color}-900/30`}>
                <currentTab.icon className={`h-5 w-5 text-${currentTab.color}-600 dark:text-${currentTab.color}-400`} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{currentTab.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{currentTab.description}</div>
              </div>
            </>
          )}
        </div>
        <Menu className="h-5 w-5 text-gray-400" />
      </button>
      
      {/* 📱 Dropdown Menu */}
      {isOpen && (
        <div className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id)
                onToggle()
              }}
              className={cn(
                "w-full flex items-center space-x-3 p-4 text-left transition-colors",
                "hover:bg-gray-50 dark:hover:bg-gray-700",
                activeTab === tab.id 
                  ? `bg-${tab.color}-50 dark:bg-${tab.color}-900/20 border-l-4 border-${tab.color}-500`
                  : ""
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                activeTab === tab.id
                  ? `bg-${tab.color}-500 text-white`
                  : `bg-${tab.color}-100 dark:bg-${tab.color}-900/30 text-${tab.color}-600 dark:text-${tab.color}-400`
              )}>
                <tab.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium",
                  activeTab === tab.id 
                    ? `text-${tab.color}-900 dark:text-${tab.color}-100`
                    : "text-gray-900 dark:text-gray-100"
                )}>
                  {tab.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {tab.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdvancedSettingsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    // Verificar si es admin
    if (user && user.rol !== 'admin') {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden acceder a esta sección",
        variant: "destructive",
      })
      router.push('/dashboard')
      return
    } else if (!user) {
      router.push('/login')
    }
    
    // Obtener tab desde URL si existe
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get('tab')
      if (tabParam) {
        setActiveTab(tabParam)
      }
    }
  }, [user, router])

  // Actualizar URL cuando cambia el tab
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setMobileMenuOpen(false) // Close mobile menu when tab changes
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', value)
      window.history.pushState({}, '', url)
    }
  }

  if (!user || user.rol !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Verificando permisos...</h3>
            <p className="text-gray-600 dark:text-gray-400">Cargando panel de administración</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 🎯 HEADER - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <Crown className="h-8 w-8 lg:h-10 lg:w-10 text-yellow-500" />
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg max-w-2xl">
            Gestiona usuarios, sesiones, planes y configuraciones del sistema. 
            <span className="hidden sm:inline"> Ten cuidado, los cambios afectan a todos los usuarios.</span>
          </p>
        </div>
        
        {/* 📊 Quick Stats - Mobile responsive */}
        <div className="flex gap-2 sm:gap-3">
          <div className="text-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">Admin</div>
            <div className="text-xs text-blue-600/80 dark:text-blue-400/80">Nivel</div>
          </div>
          <div className="text-center px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">Activo</div>
            <div className="text-xs text-green-600/80 dark:text-green-400/80">Estado</div>
          </div>
        </div>
      </div>

      {/* 🚨 ADMIN WARNING - Enhanced */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 dark:border-red-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <div className="flex-shrink-0">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100 text-lg">Panel Administrativo</h3>
              <p className="text-sm sm:text-base text-red-800 dark:text-red-200 mt-1">
                Los cambios realizados aquí afectan a todos los usuarios del sistema. 
                Proceda con precaución y asegúrese de entender el impacto de cada acción.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📱 MOBILE TAB SELECTOR */}
      <MobileTabSelector
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={mobileMenuOpen}
        onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* 🎨 MAIN CONTENT TABS - Desktop + Mobile Responsive */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        
        {/* 💻 DESKTOP TABS LIST */}
        <div className="hidden md:block overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {adminTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className={cn(
                  "flex-1 flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                  "data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700",
                  "hover:bg-white/50 dark:hover:bg-gray-700/50",
                  "min-w-max whitespace-nowrap"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 📄 TAB CONTENT - All responsive */}
        <div className="mt-6">
          <TabsContent value="users" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <UsersManagement token={user.token || ''} baseUrl={BASE_URL} />
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <SessionsManagement token={user.token || ''} baseUrl={BASE_URL} />
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <PlansManagement token={user.token || ''} baseUrl={BASE_URL} />
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <WebhooksManagement token={user.token || ''} baseUrl={BASE_URL} />
            </div>
          </TabsContent>

          <TabsContent value="chatbots" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <ChatbotsManagement token={user.token || ''} baseUrl={BASE_URL} />
            </div>
          </TabsContent>

          <TabsContent value="gemini" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <GeminiManagement token={user.token || ''} baseUrl={BASE_URL} />
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <SystemSettings token={user.token || ''} baseUrl={BASE_URL} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}