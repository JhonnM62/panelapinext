'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  Crown, 
  Zap, 
  X, 
  ArrowRight,
  Sparkles,
  Gift,
  Calendar,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface PaymentSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  planName: string
  amount: number
  transactionId: string
  isUpgrade: boolean
  onRedirect: () => void
  userEmail?: string
  planData?: {
    _id: string
    tipo: string
    nombre: string
    duracion: {
      cantidad: number
      unidad: string
    }
  }
  orderID?: string
  paymentInfo?: any
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  planName,
  amount,
  transactionId,
  isUpgrade,
  onRedirect,
  userEmail,
  planData,
  orderID,
  paymentInfo
}: PaymentSuccessModalProps) {
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [userUpdateComplete, setUserUpdateComplete] = useState(false)
  const [showRedirectMessage, setShowRedirectMessage] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (isOpen) {
      setUserUpdateComplete(false)
      setIsUpdatingUser(false)
      setShowRedirectMessage(false)
      setCountdown(10)
      
      // Ejecutar actualización de datos automáticamente cuando se abre el modal
      console.log('🚀 Modal abierto, iniciando actualización de datos automáticamente...')
      updateUserData()
    }
  }, [isOpen])

  // Timer de 10 segundos para cerrar automáticamente el modal
  useEffect(() => {
    if (isOpen && userUpdateComplete) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            onRedirect()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isOpen, userUpdateComplete, onRedirect])

  useEffect(() => {
    if (userUpdateComplete && !showRedirectMessage) {
      const timer = setTimeout(() => {
        setShowRedirectMessage(true)
        setTimeout(() => {
          onRedirect()
        }, 3000)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [userUpdateComplete, showRedirectMessage, onRedirect])

  const handleClose = () => {
    setShowRedirectMessage(true)
    setTimeout(() => {
      onRedirect()
    }, 5000) // Mostrar mensaje por 5 segundos antes de redirigir
  }

  const updateUserData = async () => {
    try {
      setIsUpdatingUser(true)
      
      console.log('🔄 Actualizando datos del usuario después del pago...', {
        planData,
        transactionId,
        amount,
        orderID
      })
      
      // Si tenemos planData, enviar petición para actualizar datos del usuario
      if (planData && planData._id) {
        try {
          const updateResponse = await authAPI.updateUserAfterPayment({
            planId: planData._id,
            transactionId: transactionId,
            amount: amount,
            orderID: orderID,
            paymentInfo: paymentInfo
          })
          
          if (updateResponse.success) {
            console.log('✅ Datos del usuario actualizados en el backend')
          } else {
            console.warn('⚠️ Respuesta del backend:', updateResponse.message)
          }
        } catch (updateError) {
          console.error('❌ Error actualizando datos en el backend:', updateError)
          // Continuar con el refresh aunque falle la actualización
        }
      }
      
      // Esperar un momento para que el backend termine de procesar
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Refrescar información del usuario para actualizar el dashboard automáticamente
      try {
        await useAuthStore.getState().refreshUserInfo()
        console.log('✅ Información del usuario refrescada correctamente')
      } catch (refreshError) {
        console.error('⚠️ Error refrescando información del usuario:', refreshError)
      }
      
      setUserUpdateComplete(true)
    } catch (error) {
      console.error('❌ Error en updateUserData:', error)
      // No bloquear la UI por este error
      setUserUpdateComplete(true)
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const getPlanIcon = () => {
    if (planName.toLowerCase().includes('premium') || planName.toLowerCase().includes('pro')) {
      return <Crown className="w-8 h-8 text-yellow-500" />
    }
    if (planName.toLowerCase().includes('starter') || planName.toLowerCase().includes('básico')) {
      return <Zap className="w-8 h-8 text-blue-500" />
    }
    return <Gift className="w-8 h-8 text-green-500" />
  }

  const getSuccessMessage = () => {
    if (isUpgrade) {
      return '¡Actualización Exitosa!'
    }
    return '¡Pago Procesado Exitosamente!'
  }

  const getDescription = () => {
    if (isUpgrade) {
      return `Tu plan ha sido actualizado a ${planName}. Ahora tienes acceso a todas las funciones premium.`
    }
    return `Tu suscripción a ${planName} ha sido activada exitosamente. ¡Disfruta de todas las funciones!`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="bg-white/20 rounded-full p-3"
                >
                  <CheckCircle className="w-8 h-8" />
                </motion.div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2"
              >
                {getSuccessMessage()}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-green-100 text-sm"
              >
                {getDescription()}
              </motion.p>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full" />
          </div>

          {/* Contenido principal */}
          <div className="p-6 space-y-6">
            {/* Detalles del plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                {getPlanIcon()}
                <div>
                  <h3 className="font-semibold text-gray-900">{planName}</h3>
                  <p className="text-sm text-gray-600">Plan seleccionado</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Monto</p>
                      <p className="font-semibold">${amount.toFixed(2)} {paymentInfo?.currency || 'USD'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Estado</p>
                      <p className="text-xs text-green-600 font-semibold">{paymentInfo?.status || 'COMPLETED'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Información de PayPal */}
                <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-medium text-blue-900">Detalles de PayPal</h4>
                  <div className="space-y-1">
                    <div>
                      <p className="text-xs text-blue-700">ID Transacción:</p>
                      <p className="font-mono text-xs text-blue-900 break-all">{transactionId}</p>
                    </div>
                    {orderID && (
                      <div>
                        <p className="text-xs text-blue-700">ID Orden:</p>
                        <p className="font-mono text-xs text-blue-900">{orderID}</p>
                      </div>
                    )}
                    {paymentInfo?.payerEmail && (
                      <div>
                        <p className="text-xs text-blue-700">Email del pagador:</p>
                        <p className="text-xs text-blue-900">{paymentInfo.payerEmail}</p>
                      </div>
                    )}
                    {paymentInfo?.createTime && (
                      <div>
                        <p className="text-xs text-blue-700">Fecha de pago:</p>
                        <p className="text-xs text-blue-900">{new Date(paymentInfo.createTime).toLocaleString('es-ES')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Estado de actualización */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Actualizando datos del usuario</span>
                {isUpdatingUser ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-blue-600">Procesando...</span>
                  </div>
                ) : userUpdateComplete ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Completado</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                )}
              </div>
              
              {userUpdateComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 text-green-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">¡Todo listo!</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Tu cuenta ha sido actualizada con el nuevo plan.
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Mensaje de redirección con countdown */}
            {userUpdateComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                  <ArrowRight className="w-4 h-4" />
                  <span className="font-medium">Redirigiendo al dashboard...</span>
                </div>
                <p className="text-xs text-blue-600">
                  Serás redirigido automáticamente en <span className="font-bold text-blue-800">{countdown}</span> segundos.
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  O haz clic en el botón para ir ahora.
                </p>
              </motion.div>
            )}

            {/* Botón de acción */}
            {userUpdateComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={onRedirect}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <span>Ir al Dashboard Ahora ({countdown}s)</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}