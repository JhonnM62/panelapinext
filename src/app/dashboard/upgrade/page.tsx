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
  CheckCircle2,
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
import { 
  planesApi, 
  Plan, 
  getPlanPriceDetails, 
  shouldShowPayPalFees,
  PriceWithPayPalFees 
} from '@/lib/plans'
import { toast } from '@/components/ui/use-toast'
import SubscriptionGuard from '@/components/plans/SubscriptionGuard'
import { PaymentSuccessModal } from '@/components/ui/payment-success-modal'

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
  // 🆕 Estado para manejar upgrade vs nueva suscripción
  const [suscripcionActual, setSuscripcionActual] = useState<any>(null)
  const [isUpgrade, setIsUpgrade] = useState(false)
  // 🔧 Estados para prevenir múltiples inicializaciones
  const [paypalInitialized, setPaypalInitialized] = useState(false)
  const [currentInitializingPlan, setCurrentInitializingPlan] = useState<string | null>(null)
  const [paypalInstance, setPaypalInstance] = useState<any>(null)
  const [paypalScriptLoaded, setPaypalScriptLoaded] = useState(false)
  const [orderCreationInProgress, setOrderCreationInProgress] = useState(false)
  // 🎉 Estados para el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState<{
    planName: string
    amount: number
    transactionId: string
    isUpgrade: boolean
    planData?: {
      tipo: string
      duracion: {
        cantidad: number
        unidad: string
      }
    }
  } | null>(null)

  // 🔄 Función helper para resetear PayPal
  const resetPayPal = (reason: string) => {
    console.log(`🔄 [PAYPAL-RESET] ${reason}`, {
      paypalInitialized,
      currentInitializingPlan,
      selectedPlan,
      isProcessingPayment,
      hasPaypalInstance: !!paypalInstance
    })
    
    // Limpiar instancia de PayPal si existe
    if (paypalInstance) {
      try {
        // Intentar cerrar/limpiar la instancia
        if (typeof paypalInstance.close === 'function') {
          paypalInstance.close()
        }
        console.log('🧨 [PAYPAL-RESET] Instancia de PayPal limpiada')
      } catch (error) {
        console.warn('⚠️ [PAYPAL-RESET] Error limpiando instancia PayPal:', error)
      }
      setPaypalInstance(null)
    }
    
    // Solo intentar limpiar el container si existe en el DOM
    const container = document.getElementById('paypal-button-container')
    if (container) {
      const hadContent = container.innerHTML.trim().length > 0
      container.innerHTML = ''
      console.log(`🧩 [PAYPAL-RESET] Container limpiado (tenía contenido: ${hadContent})`)
    }
    // No mostrar warning si el container no existe, es normal en algunos estados
    
    setPaypalInitialized(false)
    setCurrentInitializingPlan(null)
    setIsProcessingPayment(false)
    setOrderCreationInProgress(false)
    
    console.log('✅ [PAYPAL-RESET] Estados reseteados exitosamente')
  }

  // Cargar planes desde la API
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        
        // Cargar planes disponibles
        const planesData = await planesApi.obtenerPlanes()
        // Filtrar solo planes no gratuitos para la página de upgrade
        const planesPagos = planesData.filter(plan => !plan.esGratuito)
        setPlanes(planesPagos)
        
        // 🔍 Verificar si el usuario tiene una suscripción activa
        const suscripcionData = await planesApi.obtenerSuscripcionActual()
        if (suscripcionData) {
          setSuscripcionActual(suscripcionData)
          setIsUpgrade(true)
          console.log('🔍 [UPGRADE] Usuario tiene suscripción activa:', {
            planActual: suscripcionData.plan.nombre,
            diasRestantes: suscripcionData.diasRestantes,
            esUpgrade: true
          })
        } else {
          setIsUpgrade(false)
          console.log('🆕 [NEW] Usuario sin suscripción activa, nueva suscripción')
        }
        
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
        console.error('Error cargando datos:', error)
        toast({
          title: 'Error',
          description: 'Error al cargar los datos de suscripción',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [searchParams])

  useEffect(() => {
    // Verificar si el script ya existe
    const existingScript = document.querySelector(`script[src*="paypal.com/sdk"]`)
    
    if (existingScript) {
      console.log('📦 [PAYPAL] Script ya existe, reutilizando...')
      setPaypalLoaded(true)
      setPaypalScriptLoaded(true)
      return
    }
    
    if (!window.paypal && !paypalScriptLoaded) {
      console.log('📦 [PAYPAL] Cargando SDK de PayPal...')
      const script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`
      script.async = true
      script.dataset.paypalScript = 'true'
      
      script.onload = () => {
        console.log('✅ [PAYPAL] SDK cargado exitosamente')
        setPaypalLoaded(true)
        setPaypalScriptLoaded(true)
      }
      
      script.onerror = () => {
        console.error('❌ [PAYPAL] Error cargando SDK')
        toast({
          title: 'Error',
          description: 'No se pudo cargar PayPal. Por favor, recarga la página.',
          variant: 'destructive'
        })
        setPaypalScriptLoaded(false)
      }
      
      document.body.appendChild(script)
    } else if (window.paypal) {
      console.log('✅ [PAYPAL] SDK ya disponible en window')
      setPaypalLoaded(true)
      setPaypalScriptLoaded(true)
    }
  }, [])

  // 🧹 Efecto de limpieza para PayPal
  useEffect(() => {
    return () => {
      resetPayPal('Componente desmontado')
    }
  }, [])

  useEffect(() => {
    // 🛡️ Controlar inicialización de PayPal con mejor lógica
    if (!paypalLoaded || !selectedPlan) {
      console.log('📄 [PAYPAL] Esperando...', { paypalLoaded, selectedPlan })
      return
    }

    // 🧩 Limpiar PayPal si el plan cambió
    if (currentInitializingPlan && currentInitializingPlan !== selectedPlan) {
      console.log('🔄 [PAYPAL] Plan cambió, limpiando...', {
        anterior: currentInitializingPlan,
        nuevo: selectedPlan
      })
      resetPayPal(`Plan cambiado de ${currentInitializingPlan} a ${selectedPlan}`)
    }

    // ⚙️ Inicializar solo si no está ya inicializado para este plan
    if (!paypalInitialized || currentInitializingPlan !== selectedPlan) {
      console.log('🚀 [PAYPAL] Inicializando para plan:', selectedPlan)
      initializePayPal()
    } else {
      console.log('✅ [PAYPAL] Ya inicializado para este plan, saltando')
    }
  }, [paypalLoaded, selectedPlan])

  const initializePayPal = async () => {
    if (!window.paypal || !selectedPlan) {
      console.log('⏳ [PAYPAL] Esperando SDK o plan...', { hasPayPal: !!window.paypal, selectedPlan })
      return
    }

    const plan = planes.find(p => p.id === selectedPlan)
    if (!plan) {
      console.error('❌ [PAYPAL] Plan no encontrado:', selectedPlan)
      return
    }

    // 🛡️ Prevenir múltiples inicializaciones del mismo plan
    if (paypalInitialized && currentInitializingPlan === selectedPlan && paypalInstance) {
      console.log('🛡️ [PAYPAL] Ya inicializado para este plan, saltando...')
      return
    }

    const container = document.getElementById('paypal-button-container')
    if (!container) {
      console.error('❌ [PAYPAL] Container no encontrado')
      return
    }

    // 🧹 Limpiar cualquier instancia previa
    if (paypalInstance) {
      console.log('🧹 [PAYPAL] Limpiando instancia previa...')
      try {
        if (typeof paypalInstance.close === 'function') {
          await paypalInstance.close()
        }
      } catch (e) {
        console.warn('⚠️ [PAYPAL] Error cerrando instancia:', e)
      }
      setPaypalInstance(null)
    }
    
    // 🧹 Limpiar completamente el container
    container.innerHTML = ''
    
    // 🔄 Marcar como inicializando
    setCurrentInitializingPlan(selectedPlan)
    setPaypalInitialized(false)

    // 🏦 Calcular precio con comisión de PayPal
    const priceDetails = getPlanPriceDetails(plan)
    const finalPrice = priceDetails.finalPrice

    console.log('💰 [PAYPAL] Iniciando PayPal para plan:', {
      planId: selectedPlan,
      planNombre: plan.nombre,
      precioBase: plan.precioConDescuento,
      comisionPayPal: priceDetails.commission.totalCommission,
      precioFinal: finalPrice,
      esGratuito: plan.esGratuito
    })

    // Suprimir warnings específicos de PayPal
    const originalWarn = console.warn
    console.warn = (...args) => {
      const message = args.join(' ')
      if (message.includes('global_session_not_found')) {
        // Suprimir este warning específico de PayPal
        return
      }
      originalWarn.apply(console, args)
    }

    try {

      const buttons = window.paypal.Buttons({
        createOrder: async (data: any, actions: any) => {
          // Prevenir múltiples creaciones de órdenes
          if (orderCreationInProgress) {
            console.log('⚠️ [PAYPAL] Creación de orden ya en progreso, ignorando...')
            return Promise.reject(new Error('Order creation already in progress'))
          }
          
          setOrderCreationInProgress(true)
          console.log('📋 [PAYPAL] Creando orden...', {
            planId: selectedPlan,
            planNombre: plan.nombre,
            amount: finalPrice
          })
          
          try {
            const order = await actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              amount: {
                currency_code: 'USD',
                value: finalPrice.toString(),
                breakdown: {
                  item_total: {
                    currency_code: 'USD',
                    value: plan.precioConDescuento.toFixed(2)
                  },
                  handling: {
                    currency_code: 'USD',
                    value: priceDetails.commission.totalCommission.toFixed(2)
                  }
                }
              },
              description: `${plan.nombre} - WhatsApp Pro API`,
              custom_id: selectedPlan,
              soft_descriptor: 'WHATSAPP_API'
            }],
            application_context: {
              brand_name: 'WhatsApp Pro API',
              landing_page: 'NO_PREFERENCE',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'PAY_NOW'
            }
          })
          
          console.log('✅ [PAYPAL] Orden creada exitosamente:', order)
          return order
        } catch (error) {
          console.error('❌ [PAYPAL] Error creando orden:', error)
          throw error
        } finally {
          setOrderCreationInProgress(false)
        }
        },
        onApprove: async (data: any, actions: any) => {
          try {
            // Prevenir múltiples procesamientos
            if (isProcessingPayment) {
              console.log('⚠️ [PAYPAL] Pago ya siendo procesado, ignorando...')
              return
            }
            
            setIsProcessingPayment(true)
            console.log('✅ [PAYPAL] Pago aprobado, iniciando captura...', {
              orderId: data.orderID,
              paymentId: data.paymentID,
              payerID: data.payerID
            })
            
            // Verificar que tenemos los datos necesarios
            if (!data.orderID) {
              throw new Error('OrderID no encontrado en los datos de aprobación')
            }
            
            // Capturar la orden desde el servidor (mejores prácticas de PayPal)
            console.log('🔄 [PAYPAL] Ejecutando captura de orden desde servidor...')
            
            const captureResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/paypal/capture-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user?.token}`
              },
              body: JSON.stringify({
                orderID: data.orderID,
                planId: selectedPlan,
                amount: finalPrice
              })
            })
            
            const captureData = await captureResponse.json()
            
            console.log('🎉 [PAYPAL] Respuesta de captura del servidor:', {
              success: captureData.success,
              status: captureResponse.status,
              data: captureData.data
            })
            
            if (!captureResponse.ok || !captureData.success) {
              console.error('❌ [PAYPAL] Error en captura desde servidor:', captureData)
              throw new Error(captureData.message || 'Error capturando orden desde servidor')
            }
            
            // Usar los datos de la captura del servidor
            const details = {
              id: captureData.data.transactionId,
              status: captureData.data.status,
              payer: {
                email_address: captureData.data.payerEmail
              },
              purchase_units: [{
                amount: {
                  value: captureData.data.amount,
                  currency_code: captureData.data.currency
                }
              }]
            }
            
            console.log('✅ [PAYPAL] Orden capturada exitosamente desde servidor:', {
              transactionId: details.id,
              status: details.status,
              amount: details.purchase_units[0].amount.value,
              payer: details.payer?.email_address
            })
            
            // Verificar que el pago fue completado
            if (details.status !== 'COMPLETED') {
              console.error('❌ [PAYPAL] Estado de pago inesperado:', details.status)
              throw new Error(`Estado de pago inesperado: ${details.status}`)
            }
            
            console.log('🚀 [PAYPAL] Iniciando procesamiento de pago exitoso...')
            
            // Procesar el pago exitoso
            await handlePaymentSuccess({
              paymentId: details.id,
              planId: selectedPlan,
              amount: finalPrice,
              transactionId: details.id,
              payerEmail: details.payer?.email_address || user?.email || ''
            })
            
            console.log('✅ [PAYPAL] Procesamiento de pago completado exitosamente')
            
          } catch (error) {
            // Mensaje de error más específico
            let errorMessage = 'Hubo un problema procesando tu pago.'
            let shouldShowToast = true
            let shouldResetPayPal = true
            let shouldLogAsError = true
            
            if (error instanceof Error) {
              if (error.message.includes('Window closed before response')) {
                // Usuario cerró la ventana de PayPal - mostrar mensaje de ayuda
                console.log('ℹ️ [PAYPAL] Usuario cerró la ventana de PayPal')
                
                // Mostrar mensaje educativo sobre completar el pago
                toast({
                  title: '⚠️ Pago Interrumpido',
                  description: 'Parece que cerraste la ventana de PayPal antes de completar el pago. Para que tu suscripción se active correctamente, es importante completar todo el proceso. ¿Quieres intentar de nuevo?',
                  variant: 'default',
                  duration: 10000
                })
                
                shouldShowToast = false // Ya mostramos el toast personalizado
                shouldResetPayPal = false // No resetear, el usuario puede intentar de nuevo
                shouldLogAsError = false // No registrar como error
              } else if (error.message.includes('INSTRUMENT_DECLINED')) {
                errorMessage = 'Tu método de pago fue rechazado. Por favor, intenta con otro método.'
              } else if (error.message.includes('PAYER_CANNOT_PAY')) {
                errorMessage = 'No se pudo procesar el pago. Verifica tu cuenta de PayPal.'
              } else if (error.message.includes('PAYMENT_ALREADY_DONE')) {
                errorMessage = 'Este pago ya fue procesado anteriormente.'
              }
            }
            
            // Solo registrar como error si es necesario
            if (shouldLogAsError) {
              console.error('❌ [PAYPAL] Error procesando pago:', error)
            }
            
            if (shouldShowToast) {
              toast({
                title: 'Error en el pago',
                description: errorMessage,
                variant: 'destructive'
              })
            }
            
            // Solo resetear PayPal si es necesario
            if (shouldResetPayPal) {
              resetPayPal('Error procesando pago')
            }
          } finally {
            setIsProcessingPayment(false)
          }
        },
        onError: (err: any) => {
          console.error('❌ [PAYPAL] Error en PayPal:', err)
          
          // 📝 Manejar diferentes tipos de errores
          let errorMessage = 'Hubo un problema con PayPal. Inténtalo de nuevo.'
          let errorTitle = 'Error de Pago'
          
          if (err.message) {
            if (err.message.includes('Window closed')) {
              errorMessage = 'Ventana de pago cerrada. Puedes intentar de nuevo cuando estés listo.'
              errorTitle = 'Pago Cancelado'
            } else if (err.message.includes('timeout')) {
              errorMessage = 'Tiempo de espera agotado. Verifica tu conexión e inténtalo de nuevo.'
            } else if (err.message.includes('network')) {
              errorMessage = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.'
            }
          }
          
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: errorTitle === 'Pago Cancelado' ? 'default' : 'destructive'
          })
          
          // 🔄 Resetear estado para permitir nuevo intento
          setIsProcessingPayment(false)
        },
        onCancel: (data: any) => {
          console.log('🗑️ [PAYPAL] Pago cancelado por el usuario:', data)
          
          // Mostrar mensaje más informativo sobre la cancelación
          toast({
            title: 'Pago Cancelado',
            description: '💡 Tip: Para completar tu pago, mantén la ventana de PayPal abierta hasta ver la confirmación. Puedes intentar de nuevo cuando estés listo.',
            variant: 'default',
            duration: 8000
          })
          setIsProcessingPayment(false)
        }
      })
      
      // Guardar referencia a la instancia
      setPaypalInstance(buttons)
      
      // Renderizar los botones
      await buttons.render('#paypal-button-container')
      
      // ✅ Marcar como inicializado exitosamente
      setPaypalInitialized(true)
      console.log('✅ [PAYPAL] Botones renderizados correctamente para plan:', selectedPlan)
      
    } catch (error) {
      console.error('❌ [PAYPAL] Error general inicializando PayPal:', error)
      
      // 🔄 Resetear estados
      resetPayPal('Error general inicializando PayPal')
      
      toast({
        title: 'Error',
        description: 'Error inicializando el sistema de pagos. Recarga la página.',
        variant: 'destructive'
      })
    } finally {
      // Restaurar console.warn original
      console.warn = originalWarn
    }
  }

  const handlePaymentSuccess = async (paymentData: {
    paymentId: string
    planId: string
    amount: number
    transactionId: string
    payerEmail: string
  }) => {
    try {
      console.log('🎯 [PAYMENT-SUCCESS] Iniciando handlePaymentSuccess con datos:', paymentData)
      
      const plan = planes.find(p => p.id === paymentData.planId)
      if (!plan) {
        console.error('❌ [PAYMENT-SUCCESS] Plan no encontrado:', paymentData.planId)
        throw new Error('Plan no encontrado')
      }
      
      console.log('✅ [PAYMENT-SUCCESS] Plan encontrado:', {
        planId: plan.id,
        planNombre: plan.nombre,
        precio: plan.precioConDescuento
      })

      // 🏦 Calcular detalles de comisión PayPal para enviar al backend
      const priceDetails = getPlanPriceDetails(plan)
      
      console.log('🏦 [PAYMENT-SUCCESS] Enviando datos de suscripción:', {
        planId: paymentData.planId,
        transactionId: paymentData.transactionId,
        montoTotal: paymentData.amount,
        comisionPayPal: priceDetails.commission,
        esUpgrade: isUpgrade,
        planActual: suscripcionActual?.plan?.nombre,
        usuario: user?.email
      })

      // Preparar datos de pago completos
      const paymentInfo = {
        planId: paymentData.planId,
        metodoPago: 'paypal',
        transaccionId: paymentData.transactionId,
        montoTotal: paymentData.amount,
        comisionPayPal: priceDetails.commission
      }
      
      console.log('📤 [PAYMENT] Enviando información al backend:', {
        ...paymentInfo,
        esUpgrade: isUpgrade,
        usuario: user?.email
      })
      
      let resultado
      
      // 🔄 Decidir qué endpoint usar según si es upgrade o nueva suscripción
      if (isUpgrade && suscripcionActual) {
        // Usar endpoint de cambio de plan
        console.log('🔄 [PAYMENT] Ejecutando cambio de plan...')
        console.log('📤 [PAYMENT] Llamando planesApi.cambiarPlan con:', {
          planId: paymentData.planId,
          metodoPago: 'paypal',
          transactionId: paymentData.transactionId,
          amount: paymentData.amount,
          commission: priceDetails.commission
        })
        
        resultado = await planesApi.cambiarPlan(
          paymentData.planId,
          'paypal',
          paymentData.transactionId,
          paymentData.amount,
          priceDetails.commission
        )
        
        console.log('📥 [PAYMENT] Respuesta de cambiarPlan:', resultado)
      } else {
        // Usar endpoint de nueva suscripción
        console.log('🆕 [PAYMENT] Creando nueva suscripción...')
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('❌ [PAYMENT] Token no encontrado')
          throw new Error('No autenticado')
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://100.42.185.2:8015'
        const endpoint = `${apiUrl}/planes/suscribirse`
        
        console.log('📤 [PAYMENT] Enviando request a:', endpoint)
        console.log('📤 [PAYMENT] Payload:', paymentInfo)
        console.log('📤 [PAYMENT] Headers:', {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer [TOKEN_PRESENTE]'
        })

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(paymentInfo)
        })
        
        console.log('📥 [PAYMENT] Response status:', response.status)
        console.log('📥 [PAYMENT] Response headers:', Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          console.error('❌ [PAYMENT] Response no OK:', {
            status: response.status,
            statusText: response.statusText
          })
          throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('📥 [PAYMENT] Response data:', data)
        
        resultado = {
          success: data.success,
          data: data.data,
          error: data.message || data.error
        }
      }
      
      console.log('📥 [PAYMENT] Respuesta del backend:', resultado)
      
      if (resultado.success) {
        const mensajeExito = isUpgrade 
          ? `Tu plan ha sido actualizado a ${plan.nombre} exitosamente`
          : `Tu plan ${plan.nombre} ha sido activado correctamente`
          
        console.log('✅ [PAYMENT] Suscripción actualizada exitosamente')
        
        // Mostrar notificación de éxito
        toast({
          title: isUpgrade ? '¡Plan actualizado!' : '¡Pago exitoso!',
          description: mensajeExito,
          duration: 5000
        })
        
        // Recargar datos del usuario para reflejar el nuevo plan
        try {
          console.log('🔄 [PAYMENT] Recargando datos del usuario...')
          const nuevaSuscripcion = await planesApi.obtenerSuscripcionActual()
          if (nuevaSuscripcion) {
            setSuscripcionActual(nuevaSuscripcion)
            console.log('✅ [PAYMENT] Datos del usuario actualizados:', {
              planNuevo: nuevaSuscripcion.plan.nombre,
              diasRestantes: nuevaSuscripcion.diasRestantes,
              fechaVencimiento: nuevaSuscripcion.fechas.fin
            })
          }
        } catch (reloadError) {
          console.error('⚠️ [PAYMENT] Error recargando datos del usuario:', reloadError)
        }
        
        // Mostrar modal de confirmación moderna
        setSuccessModalData({
          planName: plan.nombre,
          amount: paymentData.amount,
          transactionId: paymentData.transactionId,
          isUpgrade: isUpgrade,
          planData: {
            tipo: plan.tipo,
            duracion: plan.duracion
          }
        })
        setShowSuccessModal(true)
        
        // Limpiar estados de PayPal
        resetPayPal('Pago exitoso - limpiando')
      } else {
        throw new Error(resultado.error || 'Error activando el plan')
      }
      
    } catch (error) {
      console.error('❌ [PAYMENT] Error actualizando suscripción:', error)
      
      // Mensaje más detallado según el error
      let errorMessage = 'El pago fue exitoso pero hubo un problema activando tu plan.'
      if (error instanceof Error) {
        if (error.message.includes('autenticado')) {
          errorMessage = 'Sesión expirada. Por favor, vuelve a iniciar sesión.'
        } else if (error.message.includes('suscripción activa')) {
          errorMessage = 'Ya tienes una suscripción activa. Contacta soporte si necesitas ayuda.'
        }
      }
      
      toast({
        title: 'Error activando plan',
        description: `${errorMessage} Tu pago ID: ${paymentData.transactionId}. Guarda este número y contacta soporte.`,
        variant: 'destructive',
        duration: 10000
      })
      
      // Resetear PayPal para permitir reintentos si es necesario
      resetPayPal('Error activando plan')
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-6">
              <div className="relative">
                <AlertTriangle className="h-16 w-16 mx-auto text-orange-500" />
                <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/20 rounded-full animate-pulse opacity-25"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Acceso requerido
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Por favor, inicia sesión para acceder a los planes
                </p>
              </div>
              <Button onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-700">
                Iniciar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-6">
              <div className="relative">
                <RefreshCw className="h-16 w-16 animate-spin mx-auto text-blue-600" />
                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full animate-ping opacity-25"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-900 dark:text-white">
                  Preparando tu experiencia
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Cargando planes y verificando tu suscripción...
                </p>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
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
        {isUpgrade ? 'Cambiar Plan' : 'Actualizar Plan'}
        </h1>
        <div></div>
        </div>

          {/* Información del plan actual si es upgrade - Mejorado */}
          {isUpgrade && suscripcionActual && (
            <div className="mb-6">
              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Plan actual: <span className="font-bold">{suscripcionActual.plan.nombre}</span>
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-300 flex items-center space-x-2">
                          <span>{suscripcionActual.diasRestantes} días restantes</span>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                            {suscripcionActual.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                        Actualizando plan
                      </div>
                      <div className="text-xs text-blue-500 dark:text-blue-400">
                        Cambio instantáneo
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Lista de planes */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  {isUpgrade ? 'Selecciona tu nuevo plan' : 'Selecciona tu plan'}
                </h2>
                <div className="grid gap-4">
                  {planes
                    .filter(plan => {
                      // Filtrar el plan actual si es upgrade
                      if (isUpgrade && suscripcionActual) {
                        return plan.id !== suscripcionActual.plan.id
                      }
                      return true
                    })
                    .map((plan) => (
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
                      onClick={() => {
                        console.log('💳 [PLAN-SELECTION] Cambiando plan:', {
                          anterior: selectedPlan,
                          nuevo: plan.id,
                          planNombre: plan.nombre
                        })
                        
                        // 🧩 Resetear PayPal si cambia el plan
                        if (selectedPlan !== plan.id) {
                          resetPayPal(`Usuario seleccionó nuevo plan: ${plan.nombre}`)
                        }
                        
                        setSelectedPlan(plan.id)
                      }}
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
              
              {/* Resumen del pedido - Solo Móvil (aparece después de planes) */}
              {currentPlan && (
                <div className="lg:hidden">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5" />
                        <span>Resumen del pedido</span>
                      </CardTitle>
                      {/* Mostrar tipo de operación en el header - Mejorado */}
                      {isUpgrade && suscripcionActual && (
                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg p-3 mt-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                              <span className="font-medium">Cambio de plan:</span>
                            </div>
                            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                              {suscripcionActual.plan.nombre} → {currentPlan.nombre}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const priceDetails = getPlanPriceDetails(currentPlan)
                        const showPayPalFees = shouldShowPayPalFees(currentPlan)
                        
                        return (
                          <>
                            {/* Precio base del plan */}
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="font-medium">{currentPlan.nombre}</span>
                              <span className="font-semibold">{formatPrice(currentPlan.precioConDescuento)}</span>
                            </div>
                            
                            {/* Descuento si aplica */}
                            {currentPlan.descuento.porcentaje > 0 && (
                              <div className="flex justify-between items-center text-sm text-green-600">
                                <span>Descuento ({currentPlan.descuento.porcentaje}%)</span>
                                <span>-{formatPrice(currentPlan.precio.valor - currentPlan.precioConDescuento)}</span>
                              </div>
                            )}
                            
                            {/* Comisión de PayPal para planes de pago - Mejorado */}
                            {showPayPalFees && (
                              <div className="space-y-2 border-t pt-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center space-x-1">
                                  <CreditCard className="h-3 w-3" />
                                  <span>Comisiones de procesamiento PayPal</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                  <span>Comisión ({priceDetails.commission.percentage}%)</span>
                                  <span>+{formatPrice(priceDetails.commission.percentageAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                  <span>Tarifa fija</span>
                                  <span>+{formatPrice(priceDetails.commission.fixedFee)}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                      
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

                      {(() => {
                        const priceDetails = getPlanPriceDetails(currentPlan)
                        const showPayPalFees = shouldShowPayPalFees(currentPlan)
                        const finalPrice = showPayPalFees ? priceDetails.finalPrice : currentPlan.precioConDescuento
                        
                        return (
                          <div className="flex justify-between items-center py-2 border-t font-semibold text-lg">
                            <span>Total a pagar:</span>
                            <span className={
                              currentPlan.tipo === 'vitalicio' 
                                ? 'text-purple-600 dark:text-purple-400' 
                                : isPlanPopular(currentPlan)
                                ? 'text-blue-600 dark:text-blue-400'
                                : ''
                            }>
                              {formatPrice(finalPrice)}
                            </span>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Aviso movido DESPUÉS de los planes */}
              {currentPlan && (
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Información principal */}
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                            {isUpgrade 
                              ? 'Cambio de plan instantáneo'
                              : 'Activación inmediata'
                            }
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                            {isUpgrade 
                              ? `Tu plan ${suscripcionActual?.plan?.nombre || 'actual'} se cancelará automáticamente y comenzarás a usar ${currentPlan?.nombre} inmediatamente con todos sus beneficios.`
                              : 'Una vez confirmado el pago, tendrás acceso inmediato a todas las funciones premium de tu plan seleccionado.'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {/* Información de comisiones solo si aplica */}
                      {shouldShowPayPalFees(currentPlan) && (
                        <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                          <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                            <CreditCard className="h-3 w-3" />
                            <span>
                              Las comisiones de PayPal (5.4% + $0.30 USD) se incluyen en el precio final para cubrir costos de procesamiento.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card de Pago seguro movida DEBAJO del aviso */}
              {selectedPlan && (
                <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>Pago seguro</span>
                    </CardTitle>
                    <CardDescription>
                      Procesado por PayPal con encriptación SSL
                    </CardDescription>
                    <div className="flex items-center justify-end space-x-1 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Seguro</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isProcessingPayment ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                          <div className="relative">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full animate-ping opacity-25"></div>
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                              Procesando tu pago
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Por favor, no cierres esta ventana
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : paypalLoaded && selectedPlan ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                          <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            🔒 Transacción protegida por PayPal
                          </div>
                        </div>
                        {/* Instrucciones de Pago */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                💡 Instrucciones de Pago
                              </h4>
                              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                <li>• Haz clic en el botón de PayPal para iniciar el pago</li>
                                <li>• <strong>Mantén la ventana abierta</strong> durante todo el proceso</li>
                                <li>• Espera la confirmación antes de cerrar cualquier ventana</li>
                                <li>• El proceso toma entre 30-60 segundos</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {!paypalInitialized && currentInitializingPlan === selectedPlan ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="flex items-center space-x-2 text-sm text-blue-600">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Preparando botón de pago...</span>
                            </div>
                          </div>
                        ) : null}
                        <div id="paypal-button-container"></div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center space-y-3">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Preparando método de pago...
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Panel de checkout */}
            <div className="hidden lg:block space-y-6">
              {currentPlan && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Resumen del pedido</span>
                    </CardTitle>
                    {/* Mostrar tipo de operación en el header - Mejorado */}
                    {isUpgrade && suscripcionActual && (
                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg p-3 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            <span className="font-medium">Cambio de plan:</span>
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {suscripcionActual.plan.nombre} → {currentPlan.nombre}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const priceDetails = getPlanPriceDetails(currentPlan)
                      const showPayPalFees = shouldShowPayPalFees(currentPlan)
                      
                      return (
                        <>
                          {/* Precio base del plan */}
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="font-medium">{currentPlan.nombre}</span>
                            <span className="font-semibold">{formatPrice(currentPlan.precioConDescuento)}</span>
                          </div>
                          
                          {/* Descuento si aplica */}
                          {currentPlan.descuento.porcentaje > 0 && (
                            <div className="flex justify-between items-center text-sm text-green-600">
                              <span>Descuento ({currentPlan.descuento.porcentaje}%)</span>
                              <span>-{formatPrice(currentPlan.precio.valor - currentPlan.precioConDescuento)}</span>
                            </div>
                          )}
                          
                          {/* Comisión de PayPal para planes de pago - Mejorado */}
                          {showPayPalFees && (
                            <div className="space-y-2 border-t pt-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center space-x-1">
                                <CreditCard className="h-3 w-3" />
                                <span>Comisiones de procesamiento PayPal</span>
                              </div>
                              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                <span>Comisión ({priceDetails.commission.percentage}%)</span>
                                <span>+{formatPrice(priceDetails.commission.percentageAmount)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                <span>Tarifa fija</span>
                                <span>+{formatPrice(priceDetails.commission.fixedFee)}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                    
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

                    {(() => {
                      const priceDetails = getPlanPriceDetails(currentPlan)
                      const showPayPalFees = shouldShowPayPalFees(currentPlan)
                      const finalPrice = showPayPalFees ? priceDetails.finalPrice : currentPlan.precioConDescuento
                      
                      return (
                        <div className="flex justify-between items-center py-2 border-t font-semibold text-lg">
                          <span>Total a pagar:</span>
                          <span className={
                            currentPlan.tipo === 'vitalicio' 
                              ? 'text-purple-600 dark:text-purple-400' 
                              : isPlanPopular(currentPlan)
                              ? 'text-blue-600 dark:text-blue-400'
                              : ''
                          }>
                            {formatPrice(finalPrice)}
                          </span>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Badge de seguridad */}
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>SSL 256-bit</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>PCI Compliant</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CreditCard className="h-3 w-3 text-blue-500" />
                  <span>PayPal Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmación de pago exitoso */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        planName={successModalData?.planName || ''}
        amount={successModalData?.amount || 0}
        transactionId={successModalData?.transactionId || ''}
        isUpgrade={successModalData?.isUpgrade || false}
        onRedirect={() => {
          setShowSuccessModal(false)
          router.push('/dashboard/plans')
        }}
        userEmail={user?.email}
        planData={successModalData?.planData}
      />
    </div>
  )
}

export default function UpgradePage() {
  return (
    <SubscriptionGuard allowUpgrade={true} redirectTo="/dashboard/plans">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      }>
        <UpgradePageContent />
      </Suspense>
    </SubscriptionGuard>
  )
}
