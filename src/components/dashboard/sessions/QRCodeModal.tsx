import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCw } from '@/components/ui/icons'
import { QRCodeData } from './types'
import { StatusIndicator } from './StatusIndicator'

interface QRCodeModalProps {
  isOpen: boolean;
  qrData: QRCodeData | null;
  modalSessionStatus: string;
  modalSessionAuthenticated: boolean;
  isPollingActive: boolean;
  onRegenerateQR: () => void;
  onClose: () => void;
}

export function QRCodeModal({ 
  isOpen, 
  qrData, 
  modalSessionStatus, 
  modalSessionAuthenticated,
  isPollingActive,
  onRegenerateQR, 
  onClose 
}: QRCodeModalProps) {
  if (!isOpen || !qrData) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md h-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Código QR de WhatsApp
          </CardTitle>
          <CardDescription>
            Escanea este código QR con WhatsApp para conectar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center max-h-[400px] overflow-hidden">
            {qrData.qrCode === 'polling' ? (
              <div className="flex flex-col items-center justify-center p-8">
                <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-muted-foreground">Generando código QR...</p>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-lg inline-block">
                <img 
                  src={qrData.qrCode} 
                  alt="Código QR de WhatsApp" 
                  className="w-36 h-36 mx-auto"
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              Estado: <span className="inline-flex items-center">
                <StatusIndicator session={{ status: modalSessionStatus, authenticated: modalSessionAuthenticated } as any} />
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border text-sm">
            <h4 className="font-semibold text-sm mb-2 text-gray-800">Instrucciones:</h4>
            <ol className="text-sm space-y-1 text-gray-700">
              <li>1. Abre WhatsApp en tu teléfono</li>
              <li>2. Ve a Configuración → Dispositivos vinculados</li>
              <li>3. Toca "Vincular un dispositivo"</li>
              <li>4. Escanea este código QR</li>
            </ol>
          </div>
        </CardContent>
        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cerrar
          </Button>
          <Button
            onClick={onRegenerateQR}
            disabled={isPollingActive}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPollingActive ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Regenerar QR
          </Button>
        </div>
      </Card>
    </div>
  )
}
