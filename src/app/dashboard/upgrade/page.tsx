'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/store/auth'
import { 
  CheckCircle, 
  Crown, 
  Zap, 
  Shield, 
  CreditCard,
  ArrowLeft,
  Star,
  Infinity,
  AlertTriangle,
  RefreshCw,
  Users,
  Bot,
  Webhook,
  Smartphone
} from 'lucide-react'
import { planesApi, Plan } from '@/lib/plans'
import { toast } from '@/components/ui/use-toast'

declare global {
  interface Window {
    paypal: any
  }
}

function UpgradePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  
  const [planes, setPlanes] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  // Cargar planes desde la API
  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        setLoading(true)
        const planesData = await planesApi.obtenerPlanes()
        // Filtrar solo planes no gratuitos para la página de upgrade
        const planesPagos = planesData.filter(plan => !plan.esGratuito)
        setPlanes(planesPagos)
        
        // Seleccionar plan por defecto desde URL o el semestral como más popular
        const planFromUrl = searchParams.get('plan')
        if (planFromUrl && planesPagos.find(p => p.id === planFromUrl)) {
          setSelectedPlan(planFromUrl)
        } else {
          // Buscar el plan semestral como predeterminado
          const planSemestral = planesPagos.find(p => p.tipo === 'semestral')
          setSelectedPlan(planSemestral?.id || planesPagos[0]?.id || null)
        }
      } catch (error) {
        console.error('Error cargando planes:', error)
        toast({
          title: 'Error',
          description: 'Error al cargar los planes de suscripción',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    cargarPlanes()
  }, [searchParams])

  useEffect(() => {
    if (!window.paypal) {
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`
      script.onload = () => setPaypalLoaded(true)
      script.onerror = () => {
        toast({
          title: 'Error',
          description: 'No se pudo cargar PayPal',
          variant: 'destructive'
        })
      }
      document.body.appendChild(script)
    } else {
      setPaypalLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (paypalLoaded && selectedPlan) {
      initializePayPal()
    }
  }, [paypalLoaded, selectedPlan])

  const initializePayPal = () => {
    if (!window.paypal || !selectedPlan) return

    const plan = planes.find(p => p.id === selectedPlan)
    if (!plan) return

    const container = document.getElementById('paypal-button-container')
    if (container) {
      container.innerHTML = ''
    }

    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: plan.precioConDescuento.toString()
            },
            description: `${plan.nombre} - WhatsApp Pro API`
          }]
        })
      },
      onApprove: async (data: any, actions: any) => {
        try {
          setIsProcessingPayment(true)
          const details = await actions.order.capture()
          
          await handlePaymentSuccess({
            paymentId: details.id,
            planId: selectedPlan,
            amount: plan.precioConDescuento,
            transactionId: details.id
          })
          
        } catch (error) {
          console.error('Error processing payment:', error)
          toast({
            title: 'Error',
            description: 'Hubo un problema procesando tu pago',
            variant: 'destructive'
          })
        } finally {
          setIsProcessingPayment(false)
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err)
        toast({
          title: 'Error',
          description: 'Hubo un problema con PayPal. Intenta de nuevo.',
          variant: 'destructive'
        })
      },
      onCancel: () => {
        toast({
          title: 'Cancelado',
          description: 'El pago fue cancelado',
          variant: 'destructive'
        })
      }
    }).render('#paypal-button-container')
  }

  const handlePaymentSuccess = async (paymentData: {
    paymentId: string
    planId: string
    amount: number
    transactionId: string
  }) => {
    try {
      const plan = planes.find(p => p.id === paymentData.planId)
      if (!plan) throw new Error('Plan no encontrado')

      // Suscribirse al plan usando la API
      const resultado = await planesApi.suscribirse(
        paymentData.planId, 
        'paypal', 
        paymentData.transactionId
      )
      
      if (resultado.success) {
        toast({
          title: '¡Pago exitoso!',
          description: `Tu plan ${plan.nombre} ha sido activado correctamente`
        })
        
        setTimeout(() => {
          router.push('/dashboard/plans')
        }, 2000)
      } else {
        throw new Error(resultado.error || 'Error activando el plan')
      }
      
    } catch (error) {
      console.error('Error updating membership:', error)
      toast({
        title: 'Error',
        description: 'El pago fue exitoso pero hubo un problema activando tu plan. Contacta soporte.',
        variant: 'destructive'
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getPlanIcon = (tipo: string) => {
    switch (tipo) {
      case 'mensual': return <Zap className="h-6 w-6" />
      case 'semestral': return <Star className="h-6 w-6" />
      case 'anual': return <Crown className="h-6 w-6" />
      case 'vitalicio': return <Infinity className="h-6 w-6" />
      default: return <Smartphone className="h-6 w-6" />
    }
  }

  const isPlanPopular = (plan: Plan) => {
    return plan.tipo === 'semestral' || plan.categoria === 'estandar'
  }

  const getPlanBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'vitalicio':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      case 'anual':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      case 'semestral':
        return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg text-gray-600 dark:text-gray-400">Cargando planes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentPlan = planes.find(p => p.id === selectedPlan)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
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

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Lista de planes */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Selecciona tu plan
                </h2>
                <div className="grid gap-4">
                  {planes.map((plan) => (
                    <Card 
                      key={plan.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedPlan === plan.id
                          ? 'ring-2 ring-blue-500 shadow-lg'
                          : 'hover:shadow-md'
                      } ${
                        plan.tipo === 'vitalicio'
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                          : isPlanPopular(plan)
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
                          : ''
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${getPlanBadgeColor(plan.tipo)}`}>
                              {getPlanIcon(plan.tipo)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                  {plan.nombre}
                                </h3>
                                {isPlanPopular(plan) && (
                                  <Badge className="bg-blue-500 text-white text-xs">
                                    Más Popular
                                  </Badge>
                                )}
                                {plan.tipo === 'vitalicio' && (
                                  <Badge className="bg-purple-500 text-white text-xs">
                                    Mejor Valor
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {plan.descripcion}
                              </p>
                              
                              {/* Límites del plan */}
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>{plan.limites.sesiones} sesión{plan.limites.sesiones > 1 ? 'es' : ''}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Bot className="h-4 w-4" />
                                  <span>{plan.limites.botsIA} bot{plan.limites.botsIA > 1 ? 's' : ''} IA</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Webhook className="h-4 w-4" />
                                  <span>{plan.limites.webhooks} webhook{plan.limites.webhooks > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {plan.descuento.porcentaje > 0 && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(plan.precio.valor)}
                                </span>
                              )}
                              <span className={`text-xl font-bold ${
                                plan.tipo === 'vitalicio'
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : isPlanPopular(plan)
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {formatPrice(plan.precioConDescuento)}
                              </span>
                            </div>
                            {plan.descuento.porcentaje > 0 && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-green-100 text-green-800">
                                {plan.descuento.porcentaje}% OFF
                              </Badge>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {plan.esVitalicio 
                                ? 'Pago único' 
                                : `Por ${plan.duracion.cantidad} ${plan.duracion.unidad}`
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel de checkout */}
            <div className="space-y-6">
              {currentPlan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Resumen del pedido</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">{currentPlan.nombre}</span>
                      <span className="font-semibold">{formatPrice(currentPlan.precioConDescuento)}</span>
                    </div>
                    
                    {currentPlan.descuento.porcentaje > 0 && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>Descuento ({currentPlan.descuento.porcentaje}%)</span>
                        <span>-{formatPrice(currentPlan.precio.valor - currentPlan.precioConDescuento)}</span>
                      </div>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <h4 className="font-medium text-gray-900 dark:text-white">Lo que incluye:</h4>
                      
                      {/* Límites incluidos */}
                      <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-center">
                          <div className="font-bold text-blue-600">{currentPlan.limites.sesiones}</div>
                          <div className="text-xs">Sesiones</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-purple-600">{currentPlan.limites.botsIA}</div>
                          <div className="text-xs">Bots IA</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">{currentPlan.limites.webhooks}</div>
                          <div className="text-xs">Webhooks</div>
                        </div>
                      </div>
                      
                      {/* Características principales */}
                      {currentPlan.caracteristicas.slice(0, 5).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{feature.nombre}</span>
                        </div>
                      ))}
                      
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>
                          {currentPlan.esVitalicio 
                            ? 'Acceso vitalicio' 
                            : `Acceso por ${currentPlan.duracion.cantidad} ${currentPlan.duracion.unidad}`
                          }
                        </span>
                      </div>
                      
                      {currentPlan.tipo === 'vitalicio' && (
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span>Garantía de por vida</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center py-2 border-t font-semibold text-lg">
                      <span>Total:</span>
                      <span className={
                        currentPlan.tipo === 'vitalicio' 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : isPlanPopular(currentPlan)
                          ? 'text-blue-600 dark:text-blue-400'
                          : ''
                      }>
                        {formatPrice(currentPlan.precioConDescuento)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                        Plan actual: {user.plan || 'Básico'}
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Al actualizar tu plan, el nuevo período comenzará inmediatamente y 
                        tendrás acceso a todas las funciones premium según los límites del plan seleccionado.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Método de pago</CardTitle>
                  <CardDescription>
                    Pago seguro procesado por PayPal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isProcessingPayment ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mb-4 mx-auto" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Procesando tu pago...
                        </p>
                      </div>
                    </div>
                  ) : paypalLoaded && selectedPlan ? (
                    <div id="paypal-button-container"></div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Cargando PayPal...
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="h-4 w-4" />
                <span>Pago 100% seguro con encriptación SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    }>
      <UpgradePageContent />
    </Suspense>
  )
}
