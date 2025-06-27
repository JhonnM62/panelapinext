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
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface QRCodeDisplayProps {
  session: Session | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRCodeDisplay({ session, open, onOpenChange }: QRCodeDisplayProps) {
  const { getSessionStatus } = useSessionsStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (open && session) {
      // Poll for status updates every 3 seconds
      const interval = setInterval(async () => {
        if (session.status !== 'authenticated') {
          await getSessionStatus(session.id)
        }
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [open, session, getSessionStatus])

  const handleRefresh = async () => {
    if (!session) return
    
    setIsRefreshing(true)
    await getSessionStatus(session.id)
    setIsRefreshing(false)
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

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Estado: {session.status}
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
