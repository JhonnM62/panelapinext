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
import { Session } from '@/types'
import { RefreshCw, CheckCircle, AlertCircle, RotateCcw, Zap } from 'lucide-react'
import { sessionsAPI } from '@/lib/api'
import { toast } from '@/components/ui/use-toast'

interface QRCodeDisplayProps {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRCodeDisplay({ session, open, onOpenChange }: QRCodeDisplayProps) {
  const { getSessionStatus } = useSessionsStore()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [canRegenerate, setCanRegenerate] = useState(false)
  const [qrAge, setQrAge] = useState(0)
  const [qrImageLoaded, setQrImageLoaded] = useState(false)
  const [qrImageError, setQrImageError] = useState(false)

  useEffect(() => {
    if (open && session) {
      // Poll for status updates every 3 seconds
      const interval = setInterval(async () => {
        if (session.status !== 'authenticated') {
          await getSessionStatus(session.id)
        }
      }, 3000)

      // Verificar capacidad de regeneración QR
      checkRegenerationCapability()

      return () => clearInterval(interval)
    }
  }, [open, session, getSessionStatus])

  // Auto-cerrar modal cuando se autentica
  useEffect(() => {
    if (session?.status === 'authenticated' && open) {
      console.log(`[QR-MODAL] Sesión ${session.id} autenticada - cerrando modal automáticamente`)
      // Mostrar toast de éxito
      toast({
        title: "✅ Conexión Exitosa",
        description: `Tu sesión ${session.id} está conectada y lista para usar.`,
        duration: 3000,
      })
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onOpenChange(false)
      }, 2000)
    }
  }, [session?.status, open, onOpenChange, session?.id])

  // Verificar si la sesión puede regenerar QR
  const checkRegenerationCapability = async () => {
    if (!session) return
    
    try {
      const result = await sessionsAPI.canRegenerateQR(session.id)
      if (result.success) {
        setCanRegenerate(result.data.canRegenerate)
        console.log(`[QR-MODAL] Sesión ${session.id} ${result.data.canRegenerate ? 'PUEDE' : 'NO PUEDE'} regenerar QR: ${result.data.reason}`)
      }
    } catch (error) {
      console.warn(`[QR-MODAL] Error verificando capacidad de regeneración:`, error)
      setCanRegenerate(false)
    }
  }

  // Resetear estados de imagen cuando cambia el QR
  useEffect(() => {
    if (session?.qr) {
      setQrImageLoaded(false)
      setQrImageError(false)
      
      const interval = setInterval(() => {
        setQrAge(prev => prev + 1)
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setQrImageLoaded(false)
      setQrImageError(false)
      setQrAge(0)
    }
  }, [session?.qr])

  // Manejar carga exitosa de imagen QR
  const handleQrImageLoad = () => {
    console.log(`[QR-MODAL] Imagen QR cargada exitosamente para: ${session?.id}`)
    setQrImageLoaded(true)
    setQrImageError(false)
  }

  // Manejar error de carga de imagen QR
  const handleQrImageError = () => {
    console.warn(`[QR-MODAL] Error cargando imagen QR para: ${session?.id}`)
    setQrImageLoaded(false)
    setQrImageError(true)
  }

  const handleRefresh = async () => {
    if (!session) return
    
    setIsRefreshing(true)
    await getSessionStatus(session.id)
    setIsRefreshing(false)
  }

  // Función para regenerar QR
  const handleRegenerateQR = async () => {
    if (!session || isRegenerating) return
    
    console.log(`[QR-MODAL] Iniciando regeneración de QR para: ${session.id}`)
    
    setIsRegenerating(true)
    
    try {
      // Verificar primero si se puede regenerar
      const capabilityCheck = await sessionsAPI.canRegenerateQR(session.id)
      
      if (!capabilityCheck.success || !capabilityCheck.data.canRegenerate) {
        const reason = capabilityCheck.data?.reason || 'No se puede regenerar QR'
        console.warn(`[QR-MODAL] No se puede regenerar QR: ${reason}`)
        
        toast({
          title: "❌ No se puede regenerar QR",
          description: reason === 'Session is already authenticated' 
            ? 'La sesión ya está autenticada. No necesita un nuevo QR.'
            : reason === 'QR regeneration already in progress'
            ? 'Ya hay una regeneración en progreso. Espera un momento.'
            : `No se puede regenerar QR: ${reason}`,
          variant: "destructive",
          duration: 5000,
        })
        
        return
      }
      
      // Iniciar regeneración
      const result = await sessionsAPI.regenerateQR(session.id)
      
      if (result.success) {
        console.log(`[QR-MODAL] Regeneración iniciada exitosamente para: ${session.id}`)
        
        toast({
          title: "🔄 Regenerando QR",
          description: "Se está generando un nuevo código QR. Aparecerá en breve.",
          duration: 3000,
        })
        
        // Resetear edad del QR
        setQrAge(0)
        
        // Esperar un momento y verificar el estado
        setTimeout(async () => {
          try {
            await getSessionStatus(session.id)
            
            // Intentar obtener el nuevo QR
            setTimeout(async () => {
              try {
                const qrResult = await sessionsAPI.getCurrentQR(session.id)
                if (qrResult.success) {
                  console.log(`[QR-MODAL] Nuevo QR obtenido exitosamente`)
                  toast({
                    title: "✅ Nuevo QR Generado",
                    description: "El nuevo código QR está listo para escanear.",
                    duration: 3000,
                  })
                }
              } catch (qrError) {
                console.warn(`[QR-MODAL] No se pudo obtener el nuevo QR inmediatamente:`, qrError)
              }
            }, 2000)
            
          } catch (statusError) {
            console.warn(`[QR-MODAL] Error actualizando estado después de regeneración:`, statusError)
          }
        }, 1000)
        
      } else {
        throw new Error(result.message || 'No se pudo iniciar la regeneración de QR')
      }
      
    } catch (error) {
      console.error(`[QR-MODAL] Error regenerando QR:`, error)
      
      let errorMessage = "No se pudo regenerar el código QR"
      if (error instanceof Error) {
        if (error.message.includes('Session not found')) {
          errorMessage = "La sesión no se encuentra en el servidor."
        } else if (error.message.includes('already authenticated')) {
          errorMessage = "La sesión ya está autenticada. No necesita un nuevo QR."
        } else if (error.message.includes('already in progress')) {
          errorMessage = "Ya hay una regeneración en progreso. Espera un momento."
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      toast({
        title: "❌ Error de Regeneración",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      })
      
    } finally {
      setIsRegenerating(false)
      
      // Verificar nuevamente la capacidad de regeneración
      setTimeout(() => {
        checkRegenerationCapability()
      }, 2000)
    }
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Conectar WhatsApp
            {session.status === 'authenticated' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </DialogTitle>
          <DialogDescription>
            {session.status === 'authenticated' 
              ? '¡Sesión conectada exitosamente!'
              : 'Escanea el código QR con WhatsApp para conectar tu sesión'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {session.status === 'authenticated' ? (
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
          ) : session.qr ? (
            <>
              <div className="relative">
                <img 
                  src={session.qr} 
                  alt="QR Code" 
                  className="w-64 h-64 border rounded-lg"
                />
                {isRefreshing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <LoadingSpinner className="text-white" />
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

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isRegenerating}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                  
                  {canRegenerate && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={handleRegenerateQR}
                      disabled={isRefreshing || isRegenerating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isRegenerating ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                          Regenerando...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Nuevo QR
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Estado: {session.status}
                  </div>
                  
                  {qrAge > 0 && (
                    <div className="text-xs text-muted-foreground">
                      QR generado hace {Math.floor(qrAge / 60)}m {qrAge % 60}s
                      {qrAge > 120 && (
                        <span className="text-orange-500 ml-1">
                          ⚠️ Considera regenerar
                        </span>
                      )}
                    </div>
                  )}
                  
                  {!canRegenerate && session.status !== 'authenticated' && (
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      📝 La regeneración estará disponible cuando sea necesaria
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <LoadingSpinner size={32} />
              <div>
                <h3 className="text-lg font-semibold">Generando código QR...</h3>
                <p className="text-sm text-muted-foreground">
                  Espera un momento mientras preparamos tu sesión.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
