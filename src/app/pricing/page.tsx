'use client'

import { useState } from 'react'
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
  Shield
} from 'lucide-react'
import { PricingPlan } from '@/types'

export default function PricingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const plans: PricingPlan[] = [
    {
      id: 'basic',
      name: 'Prueba Gratuita',
      price: 0,
      duration: 14,
      maxSessions: 1,
      features: [
        '14 días de acceso completo',
        '1 sesión de WhatsApp',
        'Envío de mensajes básicos',
        'Soporte por email',
        'Panel de control básico'
      ],
      isActive: true,
      highlight: 'Ideal para probar',
      icon: Smartphone
    },
    {
      id: 'monthly',
      name: 'Plan Mensual',
      price: 7,
      duration: 30,
      maxSessions: 1,
      features: [
        '1 sesión de WhatsApp activa',
        'Mensajes ilimitados',
        'Automatización básica',
        'Soporte 24/7 por chat',
        'Analytics básicos',
        'Respuestas automáticas',
        'Gestión de contactos'
      ],
      popular: false,
      isActive: true,
      highlight: 'Para emprendedores',
      icon: Zap
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
        '1 sesión de WhatsApp premium',
        'Mensajes ilimitados',
        'Automatización avanzada',
        'Soporte prioritario 24/7',
        'Analytics completos',
        'Plantillas personalizadas',
        'Webhooks integrados',
        'API completa',
        '10% de descuento'
      ],
      popular: true,
      isActive: true,
      highlight: 'Más popular',
      icon: Star
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
        '1 sesión de WhatsApp premium',
        'Mensajes completamente ilimitados',
        'Automatización completa',
        'Soporte VIP 24/7',
        'Analytics avanzados',
        'Plantillas premium ilimitadas',
        'API personalizada',
        'Webhooks en tiempo real',
        'Integraciones CRM',
        '20% de descuento'
      ],
      popular: false,
      isActive: true,
      highlight: 'Ahorro máximo',
      icon: Crown
    },
    {
      id: 'lifetime',
      name: 'Plan Vitalicio',
      price: 100,
      duration: 36500,
      maxSessions: 15,
      features: [
        'Hasta 15 sesiones simultáneas',
        'Mensajes verdaderamente ilimitados',
        'Todas las funciones premium',
        'Soporte VIP de por vida',
        'Analytics profesionales',
        'API completa sin restricciones',
        'Webhooks avanzados',
        'Actualizaciones gratuitas de por vida',
        'Garantía de 1 año',
        'Acceso vitalicio garantizado',
        'Prioridad en nuevas funciones'
      ],
      popular: false,
      isActive: true,
      highlight: 'Mejor valor',
      icon: Infinity
    }
  ]

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

  const handleSelectPlan = (planId: string) => {
    if (planId === 'basic') {
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

  const getPlanIcon = (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    const IconComponent = plan?.icon || Smartphone
    return <IconComponent className="h-6 w-6" />
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

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-inner">
                <button
                  className={`px-8 py-3 rounded-lg transition-all font-medium ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-gray-700 shadow-lg text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Mensual
                </button>
                <button
                  className={`px-8 py-3 rounded-lg transition-all font-medium ${
                    billingCycle === 'annual'
                      ? 'bg-white dark:bg-gray-700 shadow-lg text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setBillingCycle('annual')}
                >
                  Anual <span className="text-green-600 dark:text-green-400 text-sm ml-1">(Ahorra 20%)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto auto-rows-fr">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl group flex flex-col h-full ${
                  plan.popular 
                    ? 'ring-2 ring-blue-500 shadow-xl scale-105 bg-gradient-to-b from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20' 
                    : 'hover:scale-105 hover:shadow-xl'
                } ${
                  plan.id === 'lifetime'
                    ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-purple-900/30 border-purple-200 dark:border-purple-700'
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 text-xs font-semibold shadow-lg rounded-full whitespace-nowrap">
                      {plan.highlight}
                    </div>
                  </div>
                )}
                
                {/* Lifetime Badge */}
                {plan.id === 'lifetime' && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1.5 text-xs font-semibold shadow-lg rounded-full whitespace-nowrap">
                      {plan.highlight}
                    </div>
                  </div>
                )}

                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/20 to-transparent dark:from-blue-900/10" />

                <CardHeader className="text-center pb-4 pt-6">
                  {/* Icon */}
                  <div className={`mx-auto p-4 rounded-2xl mb-6 mt-8 transition-all group-hover:scale-110 ${
                    plan.id === 'lifetime' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  } w-fit`}>
                    {getPlanIcon(plan.id)}
                  </div>
                  
                  <CardTitle className="text-xl font-bold mb-2">{plan.name}</CardTitle>
                  
                  {/* Price Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      {plan.originalPrice && (
                        <span className="text-base text-gray-500 line-through">
                          {formatPrice(plan.originalPrice)}
                        </span>
                      )}
                      <span className={`text-4xl font-bold ${
                        plan.id === 'lifetime' 
                          ? 'text-purple-600 dark:text-purple-400'
                          : plan.popular
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {formatPrice(plan.price)}
                      </span>
                    </div>
                    
                    {plan.discount && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {plan.discount}% OFF
                      </Badge>
                    )}
                    
                    <CardDescription className="text-sm font-medium">
                      {plan.id === 'basic' 
                        ? '14 días de prueba completa'
                        : plan.id === 'lifetime'
                        ? 'Pago único - Acceso vitalicio'
                        : `${plan.duration} días de acceso completo`
                      }
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-6 flex flex-col h-full">
                  {/* Sessions info */}
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className={`text-2xl font-bold ${
                      plan.id === 'lifetime' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {plan.maxSessions === 1 ? '1 Sesión' : `${plan.maxSessions} Sesiones`}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      WhatsApp Simultáneas
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 text-sm flex-grow">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full h-11 text-sm font-semibold transition-all duration-300 mt-auto ${
                      plan.id === 'lifetime'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                        : plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                        : 'hover:shadow-lg'
                    }`}
                    variant={plan.popular || plan.id === 'lifetime' ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.id === 'basic' ? 'Comenzar Gratis' : 'Seleccionar Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
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

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Preguntas Frecuentes
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Respuestas a las dudas más comunes sobre nuestros planes
              </p>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  question: "¿Puedo cambiar de plan en cualquier momento?",
                  answer: "Sí, puedes actualizar o cambiar tu plan en cualquier momento desde tu panel de control. Los cambios se aplican inmediatamente y solo pagas la diferencia proporcional."
                },
                {
                  question: "¿Qué incluye la garantía del plan vitalicio?",
                  answer: "El plan vitalicio incluye una garantía de funcionamiento por 1 año completo. Si no estás completamente satisfecho durante este período, te devolvemos tu dinero sin preguntas."
                },
                {
                  question: "¿Los pagos son seguros y qué métodos aceptan?",
                  answer: "Sí, todos los pagos se procesan de forma segura a través de PayPal con encriptación SSL de nivel bancario. Aceptamos tarjetas de crédito, débito y PayPal."
                },
                {
                  question: "¿Hay límites en el envío de mensajes?",
                  answer: "Los planes de pago ofrecen mensajería ilimitada. Solo el plan gratuito tiene limitaciones básicas para pruebas. No hay restricciones ocultas en los planes premium."
                },
                {
                  question: "¿Puedo usar múltiples números de WhatsApp?",
                  answer: "Sí, cada sesión corresponde a un número de WhatsApp diferente. El plan vitalicio permite hasta 15 sesiones simultáneas, mientras que otros planes incluyen 1 sesión."
                },
                {
                  question: "¿Qué soporte técnico está incluido?",
                  answer: "Todos los planes incluyen soporte técnico. Los planes premium tienen soporte prioritario 24/7, mientras que el plan básico incluye soporte por email con respuesta en 24 horas."
                }
              ].map((faq, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-left">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
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
