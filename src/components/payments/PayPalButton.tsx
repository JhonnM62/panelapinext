'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Plan, getPlanPriceDetails } from '@/lib/plans'

interface PayPalButtonProps {
  plan: Plan
  isUpgrade?: boolean
  onPaymentSuccess: (paymentData: {
    paymentId: string
    planId: string
    amount: number
    transactionId: string
    payerEmail: string
  }) => Promise<void>
  onError?: (error: any) => void
  disabled?: boolean
  className?: string
}

declare global {
  interface Window {
    paypal: any
  }
}

export default function PayPalButton({
  plan,
  isUpgrade = false,
  onPaymentSuccess,
  onError,
  disabled = false,
  className = ''
}: PayPalButtonProps) {
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderCreationInProgress, setOrderCreationInProgress] = useState(false)
  const [paypalInstance, setPaypalInstance] = useState<any>(null)

  // Limpiar PayPal cuando el componente se desmonte o el plan cambie
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [plan.id])

  // Inicializar PayPal cuando esté disponible
  useEffect(() => {
    if (window.paypal && !disabled && !isInitialized) {
      initializePayPal()
    }
  }, [plan.id, disabled, isInitialized])

  const cleanup = () => {
    if (paypalInstance) {
      try {
        if (typeof paypalInstance.close === 'function') {
          paypalInstance.close()
        }
      } catch (error) {
        console.warn('⚠️ [PAYPAL] Error limpiando instancia:', error)
      }
      setPaypalInstance(null)
    }
    
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }
    
    setIsInitialized(false)
    setIsProcessing(false)
    setOrderCreationInProgress(false)
  }

  const initializePayPal = async () => {
    if (!window.paypal || !containerRef.current || isInitialized) {
      return
    }

    try {
      cleanup()
      
      const priceDetails = getPlanPriceDetails(plan)
      const finalPrice = priceDetails.finalPrice

      console.log('💰 [PAYPAL] Inicializando para plan:', {
        planId: plan.id,
        planNombre: plan.nombre,
        precioBase: plan.precioConDescuento,
        comisionPayPal: priceDetails.commission.totalCommission,
        precioFinal: finalPrice
      })

      const buttons = window.paypal.Buttons({
        createOrder: async (data: any, actions: any) => {
          // Prevenir múltiples creaciones de órdenes
          if (orderCreationInProgress) {
            console.log('⚠️ [PAYPAL] Creación de orden ya en progreso, ignorando...')
            return Promise.reject(new Error('Order creation already in progress'))
          }
          
          setOrderCreationInProgress(true)
          console.log('📋 [PAYPAL] Creando orden...', {
            planId: plan.id,
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
                custom_id: plan.id,
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
            if (isProcessing) {
              console.log('⚠️ [PAYPAL] Pago ya siendo procesado, ignorando...')
              return
            }
            
            setIsProcessing(true)
            console.log('✅ [PAYPAL] Pago aprobado, capturando orden...', {
              orderId: data.orderID
            })
            
            const details = await actions.order.capture()
            
            console.log('🎉 [PAYPAL] Orden capturada exitosamente:', {
              transactionId: details.id,
              status: details.status,
              amount: details.purchase_units[0].amount.value,
              payer: details.payer?.email_address
            })
            
            if (details.status !== 'COMPLETED') {
              throw new Error(`Estado de pago inesperado: ${details.status}`)
            }
            
            await onPaymentSuccess({
              paymentId: details.id,
              planId: plan.id,
              amount: parseFloat(details.purchase_units[0].amount.value),
              transactionId: details.id,
              payerEmail: details.payer?.email_address || ''
            })
            
          } catch (error) {
            console.error('❌ [PAYPAL] Error en onApprove:', error)
            setIsProcessing(false)
            
            if (onError) {
              onError(error)
            } else {
              handlePayPalError(error)
            }
          }
        },
        
        onError: (error: any) => {
          console.error('❌ [PAYPAL] Error general:', error)
          setIsProcessing(false)
          setOrderCreationInProgress(false)
          
          if (onError) {
            onError(error)
          } else {
            handlePayPalError(error)
          }
        },
        
        onCancel: (data: any) => {
          console.log('🗑️ [PAYPAL] Pago cancelado por el usuario:', data)
          setIsProcessing(false)
          setOrderCreationInProgress(false)
          
          toast({
            title: 'Pago Cancelado',
            description: 'Puedes continuar cuando estés listo para completar tu pago.',
            variant: 'default'
          })
        }
      })
      
      setPaypalInstance(buttons)
      await buttons.render(containerRef.current)
      setIsInitialized(true)
      
      console.log('✅ [PAYPAL] Botones renderizados correctamente para plan:', plan.id)
      
    } catch (error) {
      console.error('❌ [PAYPAL] Error inicializando PayPal:', error)
      cleanup()
      
      toast({
        title: 'Error',
        description: 'Error inicializando el sistema de pagos. Recarga la página.',
        variant: 'destructive'
      })
    }
  }

  const handlePayPalError = (error: any) => {
    let title = 'Error en el pago'
    let description = 'Ocurrió un error durante el pago. Intenta nuevamente.'
    let variant: 'default' | 'destructive' = 'destructive'

    if (error.name === 'INSTRUMENT_DECLINED') {
      title = 'Pago rechazado'
      description = 'Tu método de pago fue rechazado. Intenta con otra tarjeta.'
    } else if (error.name === 'PAYER_CANNOT_PAY') {
      title = 'No se puede procesar el pago'
      description = 'No se puede procesar el pago con esta cuenta. Contacta a PayPal.'
    } else if (error.message?.includes('popup_closed')) {
      title = 'Pago cancelado'
      description = 'La ventana de pago fue cerrada. Intenta nuevamente.'
      variant = 'default'
    } else if (error.message?.includes('timeout')) {
      title = 'Tiempo agotado'
      description = 'El pago tardó demasiado. Intenta nuevamente.'
    } else if (error.message?.includes('network')) {
      title = 'Error de conexión'
      description = 'Problema de conexión. Verifica tu internet e intenta nuevamente.'
    }

    toast({ title, description, variant })
  }

  return (
    <div className={`paypal-button-wrapper ${className}`}>
      <div 
        ref={containerRef}
        id="paypal-button-container"
        className="min-h-[45px]"
      />
      {(isProcessing || orderCreationInProgress) && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-md">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">
              {orderCreationInProgress ? 'Creando orden...' : 'Procesando pago...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}