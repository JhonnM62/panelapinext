'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CreditCard, Crown, Clock, RefreshCw } from 'lucide-react'

export default function PlansPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleUpgrade = () => {
    router.push('/dashboard/upgrade')
  }

  const handleLogout = () => {
    useAuthStore.getState().logout()
    router.push('/auth/login')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header de alerta */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div>
                <CardTitle className="text-amber-800 dark:text-amber-200">
                  Membresía Expirada
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  Tu período de prueba gratuita ha terminado. Actualiza tu plan para continuar usando el servicio.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Información del usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-blue-600" />
              Estado de tu Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bot</p>
                <p className="font-medium">{user.nombrebot}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Plan Actual</p>
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <Clock className="h-3 w-3" />
                  Prueba Gratuita (Expirada)
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fecha de Expiración</p>
                <p className="font-medium text-red-600">
                  {new Date(user.fechaFin).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Beneficios de actualizar */}
        <Card>
          <CardHeader>
            <CardTitle>¿Por qué actualizar tu plan?</CardTitle>
            <CardDescription>
              Desbloquea todas las funcionalidades para impulsar tu negocio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✅ Lo que obtienes:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Sesiones ilimitadas de WhatsApp</li>
                  <li>• Envío masivo de mensajes</li>
                  <li>• Webhooks para integración</li>
                  <li>• Soporte técnico prioritario</li>
                  <li>• Dashboard avanzado y analytics</li>
                  <li>• API completa para desarrolladores</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">❌ Restricciones actuales:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• No puedes crear nuevas sesiones</li>
                  <li>• Sesiones existentes desconectadas</li>
                  <li>• Sin acceso a funciones premium</li>
                  <li>• Soporte limitado</li>
                  <li>• Dashboard en modo restringido</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleUpgrade}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Ver Planes y Precios
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            size="lg"
          >
            Cerrar Sesión
          </Button>
        </div>

        {/* Nota legal */}
        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <CardContent className="pt-6">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Al actualizar tu plan, aceptas nuestros términos de servicio. 
              Los pagos son procesados de forma segura y puedes cancelar en cualquier momento.
              <br />
              ¿Tienes preguntas? Contáctanos a soporte@tudominio.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
