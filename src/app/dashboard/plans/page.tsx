'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  CreditCard, 
  Crown, 
  Clock, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Bot,
  Webhook,
  MessageSquare,
  TrendingUp,
  Shield
} from 'lucide-react'
import { planesApi, Suscripcion } from '@/lib/plans'
import { toast } from '@/components/ui/use-toast'

export default function PlansPage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null)
  const [dashboardInfo, setDashboardInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const cargarDatos = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        
        // Cargar suscripción actual y datos del dashboard
        const [suscripcionData, dashboardData] = await Promise.all([
          planesApi.obtenerSuscripcionActual(),
          planesApi.obtenerInfoDashboard()
        ])
        
        setSuscripcion(suscripcionData)
        setDashboardInfo(dashboardData)
        
      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar información de la suscripción')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [user])

  const handleUpgrade = () => {
    router.push('/dashboard/upgrade')
  }

  const handleCancelSubscription = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción?')) {
      return
    }
    
    try {
      const resultado = await planesApi.cancelarSuscripcion('usuario', 'Cancelación desde dashboard')
      
      if (resultado.success) {
        toast.success('Suscripción cancelada exitosamente')
        // Recargar datos
        setSuscripcion(null)
        setDashboardInfo(null)
      } else {
        toast.error(resultado.error || 'Error al cancelar suscripción')
      }
    } catch (error) {
      console.error('Error cancelando suscripción:', error)
      toast.error('Error al cancelar suscripción')
    }
  }

  const handleLogout = () => {
    useAuthStore.getState().logout()
    router.push('/auth/login')
  }

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'activa':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Activa</Badge>
      case 'expirada':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Expirada</Badge>
      case 'cancelada':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>
      case 'pausada':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Pausada</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  const getUsageColor = (current: number, limit: number) => {
    const percentage = (current / limit) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Cargando información de tu plan...</p>
          </div>
        </div>
      </div>
    )
  }

  // Sin suscripción activa
  if (!suscripcion || !suscripcion.estaActiva) {
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
                    {suscripcion?.estado === 'expirada' ? 'Suscripción Expirada' : 'Sin Suscripción Activa'}
                  </CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-300">
                    {suscripcion?.estado === 'expirada' 
                      ? 'Tu suscripción ha terminado. Renueva tu plan para continuar usando el servicio.'
                      : 'Necesitas una suscripción activa para acceder a todas las funcionalidades.'
                    }
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
                  {suscripcion ? getStatusBadge(suscripcion.estado) : (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <XCircle className="h-3 w-3" />
                      Sin suscripción
                    </Badge>
                  )}
                </div>
                {suscripcion && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                      <p className="font-medium">{suscripcion.plan.nombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Fecha de Expiración</p>
                      <p className="font-medium text-red-600">
                        {new Date(suscripcion.fechas.fin).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Beneficios de actualizar */}
          <Card>
            <CardHeader>
              <CardTitle>¿Por qué tener una suscripción activa?</CardTitle>
              <CardDescription>
                Desbloquea todas las funcionalidades para impulsar tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600">✅ Lo que obtienes:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Múltiples sesiones de WhatsApp</li>
                    <li>• Bots con IA automatizados</li>
                    <li>• Webhooks para integración</li>
                    <li>• Envío masivo de mensajes</li>
                    <li>• Soporte técnico prioritario</li>
                    <li>• Dashboard avanzado y analytics</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">❌ Restricciones actuales:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• No puedes crear nuevas sesiones</li>
                    <li>• No puedes crear bots con IA</li>
                    <li>• No puedes configurar webhooks</li>
                    <li>• Funciones premium deshabilitadas</li>
                    <li>• Soporte limitado</li>
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
        </div>
      </div>
    )
  }

  // Con suscripción activa
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header con información de la suscripción */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <CardTitle className="text-green-800 dark:text-green-200">
                    Suscripción Activa - {suscripcion.plan.nombre}
                  </CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-300">
                    {suscripcion.diasRestantes > 0 
                      ? `${suscripcion.diasRestantes} días restantes`
                      : 'Expira hoy'
                    }
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(suscripcion.estado)}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Resumen de uso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sesiones */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Sesiones
                </CardTitle>
                <Badge variant="outline">
                  {suscripcion.usoActual.sesiones}/{suscripcion.plan.limites.sesiones}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress 
                  value={(suscripcion.usoActual.sesiones / suscripcion.plan.limites.sesiones) * 100} 
                  className="h-2"
                />
                <p className={`text-sm font-medium ${
                  getUsageColor(suscripcion.usoActual.sesiones, suscripcion.plan.limites.sesiones)
                }`}>
                  {suscripcion.plan.limites.sesiones - suscripcion.usoActual.sesiones} disponibles
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bots IA */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  Bots IA
                </CardTitle>
                <Badge variant="outline">
                  {suscripcion.usoActual.botsIA}/{suscripcion.plan.limites.botsIA}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress 
                  value={(suscripcion.usoActual.botsIA / suscripcion.plan.limites.botsIA) * 100} 
                  className="h-2"
                />
                <p className={`text-sm font-medium ${
                  getUsageColor(suscripcion.usoActual.botsIA, suscripcion.plan.limites.botsIA)
                }`}>
                  {suscripcion.plan.limites.botsIA - suscripcion.usoActual.botsIA} disponibles
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-green-600" />
                  Webhooks
                </CardTitle>
                <Badge variant="outline">
                  {suscripcion.usoActual.webhooks}/{suscripcion.plan.limites.webhooks}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress 
                  value={(suscripcion.usoActual.webhooks / suscripcion.plan.limites.webhooks) * 100} 
                  className="h-2"
                />
                <p className={`text-sm font-medium ${
                  getUsageColor(suscripcion.usoActual.webhooks, suscripcion.plan.limites.webhooks)
                }`}>
                  {suscripcion.plan.limites.webhooks - suscripcion.usoActual.webhooks} disponibles
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información detallada */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detalles de la suscripción */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Detalles de la Suscripción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Fecha de inicio</p>
                  <p className="font-medium">{new Date(suscripcion.fechas.inicio).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Fecha de vencimiento</p>
                  <p className="font-medium">{new Date(suscripcion.fechas.fin).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Renovación automática</p>
                  <p className="font-medium">
                    {suscripcion.renovacionAutomatica.activa ? '✅ Activa' : '❌ Inactiva'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Tipo de plan</p>
                  <p className="font-medium capitalize">{suscripcion.plan.tipo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas de uso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Estadísticas de Uso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Mensajes enviados</span>
                  </div>
                  <span className="font-semibold">{suscripcion.usoActual.mensajesEnviados.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Sesiones creadas</span>
                  </div>
                  <span className="font-semibold">{suscripcion.usoActual.sesiones}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Bots configurados</span>
                  </div>
                  <span className="font-semibold">{suscripcion.usoActual.botsIA}</span>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Última actualización: {new Date(suscripcion.usoActual.ultimaActualizacionUso).toLocaleDateString('es-ES')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Gestión de Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Actualizar Plan
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard/settings/advanced')}
              >
                <Crown className="h-4 w-4 mr-2" />
                Configuración Avanzada
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleCancelSubscription}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Suscripción
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
