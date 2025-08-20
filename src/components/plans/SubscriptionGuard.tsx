'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  AlertTriangle, 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { planesApi, Suscripcion } from '@/lib/plans'

interface SubscriptionGuardProps {
  children: React.ReactNode
  allowUpgrade?: boolean // Si permite actualizar plan existente
  redirectTo?: string // Ruta a la que redirigir si hay suscripción activa
}

export function SubscriptionGuard({ 
  children, 
  allowUpgrade = false, 
  redirectTo = '/dashboard/plans' 
}: SubscriptionGuardProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null)
  const [showUpgradeOption, setShowUpgradeOption] = useState(false)

  useEffect(() => {
    verificarSuscripcion()
  }, [])

  const verificarSuscripcion = async () => {
    try {
      setLoading(true)
      const suscripcionActual = await planesApi.obtenerSuscripcionActual()
      
      if (suscripcionActual) {
        setSuscripcion(suscripcionActual)
        
        // Si permite upgrade, mostrar opción; si no, redirigir
        if (allowUpgrade) {
          setShowUpgradeOption(true)
        } else {
          toast({
            title: 'Ya tienes una suscripción activa',
            description: `Actualmente tienes el plan ${suscripcionActual.plan.nombre}`,
            variant: 'default'
          })
          router.push(redirectTo)
          return
        }
      }
    } catch (error) {
      console.error('Error verificando suscripción:', error)
      // Si hay error, permitir continuar (podría ser usuario sin suscripción)
    } finally {
      setLoading(false)
    }
  }

  const handleContinueUpgrade = () => {
    setShowUpgradeOption(false)
  }

  const handleGoToDashboard = () => {
    router.push(redirectTo)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (estado: string, estaActiva: boolean) => {
    if (estaActiva && estado === 'activa') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Activa</Badge>
    }
    if (estado === 'expirada') {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Expirada</Badge>
    }
    if (estado === 'cancelada') {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelada</Badge>
    }
    if (estado === 'pausada') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pausada</Badge>
    }
    return <Badge variant="secondary">{estado}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Verificando tu suscripción...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si hay suscripción activa y permite upgrade, mostrar opciones
  if (showUpgradeOption && suscripcion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Actualizar Plan
              </h1>
              <div></div>
            </div>

            {/* Suscripción actual */}
            <Card className="mb-6 border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Suscripción Actual</span>
                    </CardTitle>
                    <CardDescription>
                      Tienes una suscripción activa
                    </CardDescription>
                  </div>
                  {getStatusBadge(suscripcion.estado, suscripcion.estaActiva)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Plan actual
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {suscripcion.plan.nombre}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Días restantes
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      {suscripcion.diasRestantes} días
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Fecha de inicio
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(suscripcion.fechas.inicio)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Fecha de vencimiento
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(suscripcion.fechas.fin)}
                    </div>
                  </div>
                </div>

                {/* Límites del plan actual */}
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Límites de tu plan actual
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="font-bold text-blue-600">{suscripcion.plan.limites.sesiones}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Sesiones</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="font-bold text-purple-600">{suscripcion.plan.limites.botsIA}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Bots IA</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="font-bold text-green-600">{suscripcion.plan.limites.webhooks}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Webhooks</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opciones */}
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
                  <AlertTriangle className="h-5 w-5" />
                  <span>¿Deseas cambiar tu plan?</span>
                </CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">
                  Puedes actualizar a un plan superior o cambiar tu suscripción actual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button 
                    onClick={handleContinueUpgrade}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Sí, cambiar plan
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleGoToDashboard}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Mantener plan actual
                  </Button>
                </div>
                
                <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 p-3 rounded-lg">
                  <strong>Nota:</strong> Al cambiar de plan, el tiempo restante de tu plan actual 
                  se prorrateará y se aplicará como descuento a tu nuevo plan.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Si no hay suscripción activa o no se permite upgrade, mostrar children
  return <>{children}</>
}

export default SubscriptionGuard
