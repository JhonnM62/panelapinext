'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useSessionsStore } from '@/store/sessions'
import { useToast } from '@/components/ui/use-toast'
import { Session } from '@/types'
import { RefreshCw, CheckCircle, AlertCircle, Clock, Copy } from 'lucide-react'

interface VerificationCodeDisplayProps {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerificationCodeDisplay({ session, open, onOpenChange }: VerificationCodeDisplayProps) {
  const { getSessionStatus, deleteSession, createSession } = useSessionsStore()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [codeExpired, setCodeExpired] = useState(false)
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)

  useEffect(() => {
    if (open && session?.code) {
      // Resetear el contador y estado cuando se abre el diálogo
      setTimeLeft(30)
      setCodeExpired(false)
      setShowSuccessScreen(false)

      // Contador de 30 segundos
      const countdown = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCodeExpired(true)
            clearInterval(countdown)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(countdown)
    }
  }, [open, session?.code, onOpenChange])

  useEffect(() => {
    if (open && session && !codeExpired) {
      // Poll para actualizaciones de estado cada 5 segundos (menos frecuente)
      const interval = setInterval(async () => {
        if (session.status !== 'connected' && session.status !== 'authenticated') {
          await getSessionStatus(session.id)
        } else {
          // Si ya está conectado, mostrará éxito al final del contador
          clearInterval(interval)
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [open, session, getSessionStatus, codeExpired])

  // Manejar qué hacer cuando el código expire
  useEffect(() => {
    if (codeExpired && session) {
      if (session.status === 'connected' || session.status === 'authenticated') {
        setShowSuccessScreen(true)
      } else {
        // Si no está conectada, cerrar el diálogo después de 2 segundos
        const timer = setTimeout(() => {
          onOpenChange(false)
        }, 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [codeExpired, session?.status, onOpenChange])

  const handleRefresh = async () => {
    if (!session) return
    
    try {
      setIsRefreshing(true)
      
      // Eliminar la sesión actual (incluye deleteUser y deleteSession)
      await deleteSession(session.id)
      
      // Crear una nueva sesión para obtener un nuevo código
      await createSession({
        nombrebot: session.id,
        phoneNumber: session.phoneNumber || ''
      })

      toast({
        title: 'Sesión actualizada',
        description: 'Se ha generado un nuevo código de verificación',
      })

      // Resetear el estado
      setTimeLeft(30)
      setCodeExpired(false)
      setShowSuccessScreen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la sesión',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRequestNewCode = async () => {
    if (!session) return

    try {
      setIsRefreshing(true)
      
      // Eliminar la sesión actual (incluye deleteUser y deleteSession)
      await deleteSession(session.id)
      
      // Crear una nueva sesión para obtener un nuevo código
      await createSession({
        nombrebot: session.id,
        phoneNumber: session.phoneNumber || ''
      })

      toast({
        title: 'Nuevo código solicitado',
        description: 'Se ha generado un nuevo código de verificación',
      })

      // Resetear el estado
      setTimeLeft(30)
      setCodeExpired(false)
      setShowSuccessScreen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo generar un nuevo código',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCopyCode = () => {
    if (session?.code) {
      navigator.clipboard.writeText(session.code)
      toast({
        title: 'Código copiado',
        description: 'El código ha sido copiado al portapapeles',
      })
    }
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Código de Verificación
            {showSuccessScreen && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            {showSuccessScreen
              ? '¡Sesión conectada exitosamente!'
              : 'Ingresa este código en tu dispositivo WhatsApp'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6">
          {showSuccessScreen ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                  ¡Conexión Exitosa!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tu sesión <strong>{session.id}</strong> está conectada y lista para usar.
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)}>
                Continuar
              </Button>
            </div>
          ) : session.code ? (
            <>
              {/* Código de verificación */}
              {!showSuccessScreen && (
                <div className="text-center space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <p className="text-sm text-muted-foreground mb-2">Código de verificación:</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-mono font-bold tracking-wider">
                        {session.code}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyCode}
                        className="h-8 w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Contador de tiempo */}
                  <div className={`flex items-center justify-center gap-2 ${
                    codeExpired ? 'text-red-500' : timeLeft <= 10 ? 'text-orange-500' : 'text-muted-foreground'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {codeExpired ? 'Código expirado' : `${timeLeft}s restantes`}
                    </span>
                  </div>
                </div>
              )}

              {/* Instrucciones */}
              {!showSuccessScreen && (
                <div className="text-center space-y-2 text-sm text-muted-foreground">
                  <p>1. Abre WhatsApp en tu teléfono</p>
                  <p>2. Ve a Configuración → Dispositivos Vinculados</p>
                  <p>3. Toca "Vincular un dispositivo"</p>
                  <p>4. Selecciona "Usar número de teléfono"</p>
                  <p>5. Ingresa el código mostrado arriba</p>
                </div>
              )}

              {/* Botones de acción */}
              {!showSuccessScreen && (
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                  
                  {/* Botón para mostrar éxito si ya está conectado */}
                  {(session.status === 'connected' || session.status === 'authenticated') && !codeExpired && (
                    <Button 
                      size="sm"
                      onClick={() => setShowSuccessScreen(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      ¡Ya me Conecté!
                    </Button>
                  )}
                  
                  {codeExpired && (
                    <Button 
                      size="sm"
                      onClick={handleRequestNewCode}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <>
                          <LoadingSpinner className="mr-2" size={16} />
                          Generando...
                        </>
                      ) : (
                        'Nuevo Código'
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Estado de la sesión */}
              {!showSuccessScreen && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Estado: {session.status}
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <LoadingSpinner size={32} />
              <div>
                <h3 className="text-lg font-semibold">Generando código...</h3>
                <p className="text-sm text-muted-foreground">
                  Espera un momento mientras preparamos tu código de verificación.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
