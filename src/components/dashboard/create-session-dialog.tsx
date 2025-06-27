'use client'

import { useState } from 'react'
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
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react'

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
  | 'monitoring' 
  | 'success' 
  | 'error'

export function CreateSessionDialog({ open, onOpenChange, onSessionCreated }: CreateSessionDialogProps) {
  const [currentStep, setCurrentStep] = useState<CreationStep>('form')
  const [creationProgress, setCreationProgress] = useState<string[]>([])
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const { toast } = useToast()
  const { createSession, sessions } = useSessionsStore()

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
      addProgress('Código de verificación generado')
      
      setCurrentStep('monitoring')
      addProgress('Iniciando monitoreo de estado...')
      
      // Simular un breve período de monitoreo antes de mostrar éxito
      setTimeout(() => {
        setCurrentStep('success')
        addProgress('Proceso completado exitosamente')
        
        toast({
          title: 'Sesión creada exitosamente',
          description: 'Tu código de verificación está listo para usar',
        })

        // Limpiar formulario
        reset({
          nombrebot: '',
          phoneNumber: ''
        })
        
        // Mostrar el código inmediatamente con la sesión devuelta
        if (onSessionCreated && newSession) {
          onSessionCreated(newSession)
        }
        
        // Cerrar diálogo después de un momento
        setTimeout(() => {
          onOpenChange(false)
          setCurrentStep('form')
          setCreationProgress([])
        }, 2000)
        
      }, 2000)
      
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
      reset({
        nombrebot: '',
        phoneNumber: ''
      })
      setCurrentStep('form')
      setCreationProgress([])
      setErrorDetails(null)
      onOpenChange(false)
    }
  }

  const handleRetry = () => {
    setCurrentStep('form')
    setCreationProgress([])
    setErrorDetails(null)
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
            {currentStep === 'success' && 'Sesión Creada'}
            {currentStep === 'error' && 'Error en Creación'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'form' && 'Crea una nueva sesión de WhatsApp para enviar y recibir mensajes.'}
            {(currentStep === 'cleaning' || currentStep === 'creating' || currentStep === 'monitoring') && 'Por favor espera mientras se configura tu sesión...'}
            {currentStep === 'success' && 'Tu sesión de WhatsApp ha sido configurada correctamente.'}
            {currentStep === 'error' && 'Ocurrió un problema durante la creación de la sesión.'}
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  )
}
