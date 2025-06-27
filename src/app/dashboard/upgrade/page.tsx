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
  RefreshCw
} from 'lucide-react'

interface PricingPlan {
  id: string
  name: string
  price: number
  originalPrice?: number
  discount?: number
  duration: number
  maxSessions: number
  features: string[]
  popular?: boolean
  isActive: boolean
}

declare global {
  interface Window {
    paypal: any
  }
}

function UpgradePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, renewMembership } = useAuthStore()
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)

  const plans: PricingPlan[] = [
    {
      id: 'monthly',
      name: 'Plan Mensual',
      price: 7,
      duration: 30,
      maxSessions: 1,
      features: [
        '1 sesión de WhatsApp',
        'Mensajes ilimitados',
        'Automatización básica',
        'Soporte 24/7',
        'Analytics básicos'
      ],
      isActive: true
    },
    {
      id: 'semiannual',
      name: 'Plan 6 Meses',
      price: 37.8,
      originalPrice: 42,
      discount: 10,
      duration: 180,
      maxSessions: 1,
      features: [
        '1 sesión de WhatsApp',
        'Mensajes ilimitados',
        'Automatización avanzada',
        'Soporte prioritario 24/7',
        'Analytics completos',
        'Plantillas personalizadas',
        '10% de descuento'
      ],
      popular: true,
      isActive: true
    },
    {
      id: 'annual',
      name: 'Plan Anual',
      price: 67.2,
      originalPrice: 84,
      discount: 20,
      duration: 365,
      maxSessions: 1,
      features: [
        '1 sesión de WhatsApp',
        'Mensajes ilimitados',
        'Automatización completa',
        'Soporte VIP 24/7',
        'Analytics avanzados',
        'Plantillas premium',
        'API personalizada',
        '20% de descuento'
      ],
      isActive: true
    },
    {
      id: 'lifetime',
      name: 'Plan Vitalicio',
      price: 100,
      duration: 36500,
      maxSessions: 15,
      features: [
        'Hasta 15 sesiones de WhatsApp',
        'Mensajes ilimitados',
        'Todas las funciones premium',
        'Soporte VIP de por vida',
        'Analytics profesionales',
        'API completa',
        'Actualizaciones gratuitas',
        'Garantía de 1 año',
        'Acceso vitalicio'
      ],
      isActive: true
    }
  ]

  useEffect(() => {
    const planFromUrl = searchParams.get('plan')
    if (planFromUrl && plans.find(p => p.id === planFromUrl)) {
      setSelectedPlan(planFromUrl)
    } else {
      setSelectedPlan('semiannual')
    }
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

    const plan = plans.find(p => p.id === selectedPlan)
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
              value: plan.price.toString()
            },
            description: `${plan.name} - WhatsApp Pro`
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
            amount: plan.price
          })
          
        } catch (error) {
          console.error('Error processing payment:', error)
          toast({
            title: 'Error en el pago',
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
          title: 'Error de PayPal',
          description: 'Hubo un problema con PayPal. Intenta de nuevo.',
          variant: 'destructive'
        })
      },
      onCancel: () => {
        toast({
          title: 'Pago cancelado',
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
  }) => {
    try {
      const plan = plans.find(p => p.id === paymentData.planId)
      if (!plan) throw new Error('Plan no encontrado')

      await renewMembership(plan.duration)
      
      toast({
        title: '¡Pago exitoso!',
        description: `Tu plan ${plan.name} ha sido activado correctamente`,
      })
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
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

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'monthly': return <Zap className="h-6 w-6" />
      case 'semiannual': return <Star className="h-6 w-6" />
      case 'annual': return <Crown className="h-6 w-6" />
      case 'lifetime': return <Infinity className="h-6 w-6" />
      default: return <Zap className="h-6 w-6" />
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const currentPlan = plans.find(p => p.id === selectedPlan)

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

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Selecciona tu plan
                </h2>
                <div className="grid gap-4">
                  {plans.map((plan) => (
                    <Card 
                      key={plan.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedPlan === plan.id
                          ? 'ring-2 ring-blue-500 shadow-lg'
                          : 'hover:shadow-md'
                      } ${
                        plan.id === 'lifetime'
                          ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                          : ''
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              plan.id === 'lifetime'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : plan.popular
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                              {getPlanIcon(plan.id)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {plan.name}
                                </h3>
                                {plan.popular && (
                                  <Badge className="bg-blue-500 text-white text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {plan.maxSessions === 1 ? '1 sesión' : `${plan.maxSessions} sesiones`} · 
                                {plan.id === 'lifetime' ? 'Acceso vitalicio' : `${plan.duration} días`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {plan.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(plan.originalPrice)}
                                </span>
                              )}
                              <span className={`text-lg font-bold ${
                                plan.id === 'lifetime'
                                  ? 'text-purple-600 dark:text-purple-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {formatPrice(plan.price)}
                              </span>
                            </div>
                            {plan.discount && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {plan.discount}% OFF
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

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
                      <span className="font-medium">{currentPlan.name}</span>
                      <span className="font-semibold">{formatPrice(currentPlan.price)}</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{currentPlan.maxSessions === 1 ? '1 sesión' : `${currentPlan.maxSessions} sesiones`} de WhatsApp</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>
                          {currentPlan.id === 'lifetime' 
                            ? 'Acceso de por vida' 
                            : `Acceso por ${currentPlan.duration} días`
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Todas las funciones premium</span>
                      </div>
                      {currentPlan.id === 'lifetime' && (
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <span>Garantía de 1 año</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center py-2 border-t font-semibold text-lg">
                      <span>Total:</span>
                      <span className={currentPlan.id === 'lifetime' ? 'text-purple-600 dark:text-purple-400' : ''}>
                        {formatPrice(currentPlan.price)}
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
                        tendrás acceso a todas las funciones premium.
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
                  ) : paypalLoaded ? (
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
