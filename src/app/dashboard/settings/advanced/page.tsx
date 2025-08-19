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
  RefreshCw
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/auth'
import UsersManagement from '@/components/admin/UsersManagement'
import SessionsManagement from '@/components/admin/SessionsManagement'
import PlansManagement from '@/components/admin/PlansManagement'
import WebhooksManagement from '@/components/admin/WebhooksManagement'
import ChatbotsManagement from '@/components/admin/ChatbotsManagement'
import GeminiManagement from '@/components/admin/GeminiManagement'
import SystemSettings from '@/components/admin/SystemSettings'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.42.185.2:8015'

export default function AdvancedSettingsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(false)
  
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
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', value)
      window.history.pushState({}, '', url)
    }
  }

  if (!user || user.rol !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
              Panel de Administración
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
              Gestiona usuarios, sesiones, planes y configuraciones del sistema
            </p>
          </div>
        </div>

        {/* Admin Warning */}
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Panel Administrativo:</strong> Los cambios realizados aquí afectan a todos los usuarios del sistema.
                Proceda con precaución.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1">
              <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Usuarios</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Sesiones</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Planes</span>
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Webhook className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Webhooks</span>
              </TabsTrigger>
              <TabsTrigger value="chatbots" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Chatbots</span>
              </TabsTrigger>
              <TabsTrigger value="gemini" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Gemini IA</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Sistema</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <UsersManagement token={user.token || ''} baseUrl={BASE_URL} />
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6 mt-6">
            <SessionsManagement token={user.token || ''} baseUrl={BASE_URL} />
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6 mt-6">
            <PlansManagement token={user.token || ''} baseUrl={BASE_URL} />
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6 mt-6">
            <WebhooksManagement token={user.token || ''} baseUrl={BASE_URL} />
          </TabsContent>

          {/* Chatbots Tab */}
          <TabsContent value="chatbots" className="space-y-6 mt-6">
            <ChatbotsManagement token={user.token || ''} baseUrl={BASE_URL} />
          </TabsContent>

          {/* Gemini IA Tab */}
          <TabsContent value="gemini" className="space-y-6 mt-6">
            <GeminiManagement token={user.token || ''} baseUrl={BASE_URL} />
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6 mt-6">
            <SystemSettings token={user.token || ''} baseUrl={BASE_URL} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
