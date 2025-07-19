'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { useSessionsStore } from '@/store/sessions'
import { Session } from '@/types'
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

const createSessionSchema = z.object({
  nombrebot: z.string()
    .min(1, 'El nombre del bot es requerido')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos')
    .max(50, 'Máximo 50 caracteres'),
  phoneNumber: z.string()
    .min(1, 'El número de teléfono es requerido')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de número inválido (ej: +573001234567)'),
})

type CreateSessionFormData = z.infer<typeof createSessionSchema>

interface CreateSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionCreated?: (session: Session) => void
}

type CreationStep = 
  | 'form' 
  | 'cleaning' 
  | 'creating' 
  | 'qr_display'
  | 'monitoring' 
  | 'success' 
  | 'error'

export function CreateSessionDialog({ open, onOpenChange, onSessionCreated }: CreateSessionDialogProps) {
  const [currentStep, setCurrentStep] = useState<CreationStep>('form')
  const [creationProgress, setCreationProgress] = useState<string[]>([])
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [qrTimer, setQrTimer] = useState(30)
  const [isPolling, setIsPolling] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { createSession, sessions, getSessionStatus } = useSessionsStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      nombrebot: '',
      phoneNumber: ''
    },
  })

  const addProgress = (message: string) => {
    setCreationProgress(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Timer y polling para QR
  useEffect(() => {
    if (currentStep === 'qr_display' && currentSession) {
      // Timer de 30 segundos
      const timer = setInterval(() => {
        setQrTimer(prev => {
          if (prev <= 1) {
            setCurrentStep('error')
            setErrorDetails('Tiempo agotado. El código QR expiró después de 30 segundos.')
            toast({
              title: 'Código QR expirado',
              description: 'El tiempo para escanear el código QR ha expirado.',
              variant: 'destructive',
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Polling para verificar estado cada 2 segundos
      const polling = setInterval(async () => {
        if (currentSession && currentSession.status !== 'authenticated') {
          try {
            await getSessionStatus(currentSession.id)
            // El estado se actualiza automáticamente en el store
            const updatedSessions = useSessionsStore.getState().sessions
            const updatedSession = updatedSessions.find(s => s.id === currentSession.id)
            
            if (updatedSession && updatedSession.status === 'authenticated') {
              clearInterval(timer)
              clearInterval(polling)
              setCurrentStep('success')
              addProgress('¡Sesión autenticada exitosamente!')
              
              toast({
                title: 'Conexión exitosa',
                description: 'Tu sesión de WhatsApp se conectó correctamente.',
              })
              
              if (onSessionCreated) {
                onSessionCreated(updatedSession)
              }
              
              setTimeout(() => {
                onOpenChange(false)
                handleClose()
              }, 2000)
            }
          } catch (error) {
            console.error('Error verificando estado:', error)
          }
        }
      }, 2000)

      setPollingInterval(polling)

      return () => {
        clearInterval(timer)
        clearInterval(polling)
      }
    }
  }, [currentStep, currentSession, getSessionStatus, onSessionCreated, onOpenChange, toast])

  // Limpiar intervalos al cerrar
  useEffect(() => {
    if (!open && pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }, [open, pollingInterval])

  const onSubmit = async (data: CreateSessionFormData) => {
    try {
      setCurrentStep('cleaning')
      setCreationProgress([])
      setErrorDetails(null)
      
      // Verificar si hay sesiones existentes
      if (sessions.length > 0) {
        addProgress(`Se encontraron ${sessions.length} sesiones existentes`)
        addProgress('Iniciando proceso de limpieza...')
      } else {
        addProgress('No hay sesiones previas para limpiar')
      }
      
      setCurrentStep('creating')
      addProgress('Creando nueva sesión de WhatsApp...')
      
      const newSession = await createSession({
        nombrebot: data.nombrebot,
        phoneNumber: data.phoneNumber,
      })

      addProgress('Sesión creada exitosamente')
      
      // Verificar si se recibió QR
      if (newSession.qr) {
        addProgress('Código QR generado')
        setCurrentSession(newSession)
        setCurrentStep('qr_display')
        setQrTimer(30) // Reiniciar timer
        addProgress('Escanea el código QR con WhatsApp')
        
        toast({
          title: 'Código QR generado',
          description: 'Escanea el código con WhatsApp para conectar tu sesión',
        })
      } else {
        // Fallback si no hay QR
        setCurrentStep('monitoring')
        addProgress('Iniciando monitoreo de estado...')
        
        setTimeout(() => {
          setCurrentStep('success')
          addProgress('Proceso completado exitosamente')
          
          toast({
            title: 'Sesión creada exitosamente',
            description: 'Tu sesión está lista para usar',
          })

          // Limpiar formulario
          reset({
            nombrebot: '',
            phoneNumber: ''
          })
          
          if (onSessionCreated && newSession) {
            onSessionCreated(newSession)
          }
          
          setTimeout(() => {
            onOpenChange(false)
            setCurrentStep('form')
            setCreationProgress([])
          }, 2000)
        }, 2000)
      }
      
    } catch (error: any) {
      console.error('Error en creación de sesión:', error)
      
      setCurrentStep('error')
      setErrorDetails(error.message || 'Error desconocido')
      addProgress(`Error: ${error.message || 'Error desconocido'}`)
      
      toast({
        title: 'Error al crear sesión',
        description: error.message || 'No se pudo crear la sesión. Intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    if (currentStep === 'form' || currentStep === 'success' || currentStep === 'error') {
      // Limpiar intervalos
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
      
      reset({
        nombrebot: '',
        phoneNumber: ''
      })
      setCurrentStep('form')
      setCreationProgress([])
      setErrorDetails(null)
      setCurrentSession(null)
      setQrTimer(30)
      setIsPolling(false)
      onOpenChange(false)
    }
  }

  const handleRetry = () => {
    // Limpiar intervalos
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    
    setCurrentStep('form')
    setCreationProgress([])
    setErrorDetails(null)
    setCurrentSession(null)
    setQrTimer(30)
    setIsPolling(false)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'form':
        return (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombrebot">Nombre del Bot</Label>
              <Input
                id="nombrebot"
                placeholder="mi-whatsapp-bot"
                {...register('nombrebot')}
                className={errors.nombrebot ? 'border-destructive' : ''}
              />
              {errors.nombrebot && (
                <p className="text-sm text-destructive">{errors.nombrebot.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Identificador único para tu bot. Solo letras, números, guiones y guiones bajos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número de Teléfono</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+573158208619"
                {...register('phoneNumber')}
                className={errors.phoneNumber ? 'border-destructive' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Incluye el código de país (ej: +57 para Colombia)
              </p>
            </div>

            {sessions.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">
                      Sesiones existentes detectadas
                    </p>
                    <p className="text-yellow-700 mt-1">
                      Se eliminarán {sessions.length} sesión(es) existente(s) antes de crear la nueva.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Crear Sesión
              </Button>
            </DialogFooter>
          </form>
        )

      case 'cleaning':
      case 'creating':
      case 'monitoring':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <LoadingSpinner className="mr-2" size={24} />
              <span className="text-lg font-medium">
                {currentStep === 'cleaning' && 'Limpiando sesiones anteriores...'}
                {currentStep === 'creating' && 'Creando nueva sesión...'}
                {currentStep === 'monitoring' && 'Configurando monitoreo...'}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2">Progreso:</h4>
              <div className="space-y-1">
                {creationProgress.map((step, index) => (
                  <p key={index} className="text-xs text-gray-600 font-mono">
                    {step}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )

      case 'qr_display':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Escanea el código QR</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tiempo restante: <span className="font-bold text-blue-600">{qrTimer}s</span>
              </p>
            </div>

            {currentSession?.qr ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img 
                    src={currentSession.qr} 
                    alt="QR Code" 
                    className="w-64 h-64 border rounded-lg"
                  />
                  {isPolling && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                      Verificando...
                    </div>
                  )}
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    1. Abre WhatsApp en tu teléfono
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2. Ve a Configuración → Dispositivos Vinculados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    3. Toca "Vincular un dispositivo" y escanea este código
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Estado: Esperando conexión...
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <LoadingSpinner size={32} />
                <p className="text-sm text-muted-foreground">
                  Generando código QR...
                </p>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2">Progreso:</h4>
              <div className="space-y-1">
                {creationProgress.slice(-3).map((step, index) => (
                  <p key={index} className="text-xs text-gray-600 font-mono">
                    {step}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-green-700">
              ¡Sesión creada exitosamente!
            </h3>
            <p className="text-sm text-gray-600">
              Tu código de verificación está listo. El diálogo se cerrará automáticamente.
            </p>
            
            <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {creationProgress.slice(-3).map((step, index) => (
                  <p key={index} className="text-xs text-gray-600 font-mono">
                    {step}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-red-700 text-center">
              Error al crear sesión
            </h3>
            
            {errorDetails && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{errorDetails}</p>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
              <h4 className="text-sm font-medium mb-2">Log de errores:</h4>
              <div className="space-y-1">
                {creationProgress.map((step, index) => (
                  <p key={index} className="text-xs text-gray-600 font-mono">
                    {step}
                  </p>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
              >
                Cerrar
              </Button>
              <Button 
                type="button" 
                onClick={handleRetry}
              >
                Intentar de nuevo
              </Button>
            </DialogFooter>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'form' && 'Crear Nueva Sesión'}
            {(currentStep === 'cleaning' || currentStep === 'creating' || currentStep === 'monitoring') && 'Creando Sesión'}
            {currentStep === 'qr_display' && 'Conectar WhatsApp'}
            {currentStep === 'success' && 'Sesión Creada'}
            {currentStep === 'error' && 'Error en Creación'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'form' && 'Crea una nueva sesión de WhatsApp para enviar y recibir mensajes.'}
            {(currentStep === 'cleaning' || currentStep === 'creating' || currentStep === 'monitoring') && 'Por favor espera mientras se configura tu sesión...'}
            {currentStep === 'qr_display' && 'Escanea el código QR con WhatsApp para completar la conexión.'}
            {currentStep === 'success' && 'Tu sesión de WhatsApp ha sido configurada correctamente.'}
            {currentStep === 'error' && 'Ocurrió un problema durante la creación de la sesión.'}
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  )
}
