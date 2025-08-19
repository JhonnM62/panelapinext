'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Crown, 
  Zap, 
  Smartphone,
  ArrowLeft,
  Star,
  Infinity,
  Phone,
  MessageSquare,
  Users,
  BarChart3,
  Shield,
  Clock,
  RefreshCw
} from 'lucide-react'
import { planesApi, Plan } from '@/lib/plans'
import { toast } from '@/components/ui/use-toast'

export default function PricingPage() {
  const router = useRouter()
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        setLoading(true)
        const planesData = await planesApi.obtenerPlanes()
        setPlanes(planesData)
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
  }, [])

  const handleSelectPlan = async (planId: string) => {
    const plan = planes.find(p => p.id === planId)
    
    if (plan?.esGratuito) {
      router.push('/auth/register')
    } else {
      router.push(`/dashboard/upgrade?plan=${planId}`)
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
      case 'prueba_gratuita':
        return <Smartphone className="h-6 w-6" />
      case 'mensual':
        return <Zap className="h-6 w-6" />
      case 'semestral':
        return <Star className="h-6 w-6" />
      case 'anual':
        return <Crown className="h-6 w-6" />
      case 'vitalicio':
        return <Infinity className="h-6 w-6" />
      default:
        return <Smartphone className="h-6 w-6" />
    }
  }

  const getPlanColor = (tipo: string, isPopular: boolean = false) => {
    if (isPopular) {
      return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
    }
    
    switch (tipo) {
      case 'vitalicio':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
      case 'anual':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
    }
  }

  const isPlanPopular = (plan: Plan) => {
    return plan.tipo === 'semestral' || plan.categoria === 'estandar'
  }

  const features = [
    { icon: MessageSquare, title: 'Mensajería masiva', description: 'Envía miles de mensajes personalizados' },
    { icon: Zap, title: 'Respuestas automáticas', description: 'Automatiza tus conversaciones' },
    { icon: Phone, title: 'Programación de mensajes', description: 'Programa mensajes para envío futuro' },
    { icon: Users, title: 'Gestión de contactos', description: 'Organiza y segmenta tus contactos' },
    { icon: BarChart3, title: 'Analytics en tiempo real', description: 'Métricas detalladas de rendimiento' },
    { icon: Shield, title: 'Integración con CRM', description: 'Conecta con tus sistemas existentes' },
    { icon: Star, title: 'Plantillas personalizadas', description: 'Crea plantillas reutilizables' },
    { icon: Crown, title: 'Soporte multiidioma', description: 'Soporte en múltiples idiomas' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Cargando planes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Volver al inicio</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WhatsApp Pro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="font-medium">Iniciar Sesión</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold mb-8 text-gray-900 dark:text-white leading-tight">
              Planes que Crecen con tu Negocio
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              Elige el plan perfecto para automatizar WhatsApp y hacer crecer tu negocio.
              <span className="text-blue-600 dark:text-blue-400 font-semibold"> Todos los planes incluyen garantía de satisfacción.</span>
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">10M+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Mensajes enviados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">50K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Usuarios activos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">99.9%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Uptime garantizado</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Soporte técnico</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto auto-rows-fr">
            {planes.map((plan) => {
              const isPopular = isPlanPopular(plan)
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl group flex flex-col h-full ${
                    isPopular 
                      ? 'ring-2 ring-blue-500 shadow-xl scale-105 bg-gradient-to-b from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20' 
                      : 'hover:scale-105 hover:shadow-xl'
                  } ${
                    plan.tipo === 'vitalicio'
                      ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-purple-900/30 border-purple-200 dark:border-purple-700'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 text-xs font-semibold shadow-lg rounded-full whitespace-nowrap">
                        Más Popular
                      </div>
                    </div>
                  )}
                  
                  {/* Lifetime Badge */}
                  {plan.tipo === 'vitalicio' && (
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1.5 text-xs font-semibold shadow-lg rounded-full whitespace-nowrap">
                        Mejor Valor
                      </div>
                    </div>
                  )}

                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/20 to-transparent dark:from-blue-900/10" />

                  <CardHeader className="text-center pb-4 pt-6">
                    {/* Icon */}
                    <div className={`mx-auto p-4 rounded-2xl mb-6 mt-8 transition-all group-hover:scale-110 ${
                      getPlanColor(plan.tipo, isPopular)
                    } w-fit`}>
                      {getPlanIcon(plan.tipo)}
                    </div>
                    
                    <CardTitle className="text-xl font-bold mb-2">{plan.nombre}</CardTitle>
                    
                    {/* Price Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2">
                        {plan.descuento.porcentaje > 0 && (
                          <span className="text-base text-gray-500 line-through">
                            {formatPrice(plan.precio.valor)}
                          </span>
                        )}
                        <span className={`text-4xl font-bold ${
                          plan.tipo === 'vitalicio' 
                            ? 'text-purple-600 dark:text-purple-400'
                            : isPopular
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {formatPrice(plan.precioConDescuento)}
                        </span>
                      </div>
                      
                      {plan.descuento.porcentaje > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {plan.descuento.porcentaje}% OFF
                        </Badge>
                      )}
                      
                      <CardDescription className="text-sm font-medium">
                        {plan.esGratuito 
                          ? `${plan.duracion.cantidad} días de prueba completa`
                          : plan.esVitalicio
                          ? 'Pago único - Acceso vitalicio'
                          : `${plan.duracion.cantidad} ${plan.duracion.unidad} de acceso completo`
                        }
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 px-6 pb-6 flex flex-col h-full">
                    {/* Resource limits info */}
                    <div className="grid grid-cols-3 gap-2 text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div>
                        <div className={`text-lg font-bold ${
                          plan.tipo === 'vitalicio' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {plan.limites.sesiones}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Sesiones</div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${
                          plan.tipo === 'vitalicio' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {plan.limites.botsIA}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Bots IA</div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${
                          plan.tipo === 'vitalicio' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {plan.limites.webhooks}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Webhooks</div>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 text-sm flex-grow">
                      {plan.caracteristicas.slice(0, 6).map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{feature.nombre}</span>
                        </li>
                      ))}
                      {plan.caracteristicas.length > 6 && (
                        <li className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                          +{plan.caracteristicas.length - 6} características más
                        </li>
                      )}
                    </ul>

                    {/* CTA Button */}
                    <Button 
                      className={`w-full h-11 text-sm font-semibold transition-all duration-300 mt-auto ${
                        plan.tipo === 'vitalicio'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                          : isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                          : 'hover:shadow-lg'
                      }`}
                      variant={isPopular || plan.tipo === 'vitalicio' ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.esGratuito ? 'Comenzar Gratis' : 'Seleccionar Plan'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Todo lo que Necesitas para Automatizar WhatsApp
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Funcionalidades profesionales diseñadas para hacer crecer tu negocio de manera inteligente y eficiente.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group p-6 rounded-2xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 hover:shadow-lg">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">
              ¿Listo para Automatizar tu WhatsApp?
            </h2>
            <p className="text-xl lg:text-2xl mb-10 opacity-90 leading-relaxed">
              Únete a miles de empresas que ya están utilizando nuestra plataforma para 
              hacer crecer sus negocios. Comienza tu prueba gratuita hoy mismo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
                >
                  Comenzar Prueba Gratuita
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 text-lg"
                >
                  Ver Demo en Vivo
                </Button>
              </Link>
            </div>
            <p className="text-sm opacity-75 mt-6">
              No se requiere tarjeta de crédito • Configuración en 2 minutos • Soporte 24/7
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
