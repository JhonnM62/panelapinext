import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Key, Copy, RefreshCw } from '@/components/ui/icons'
import { VerificationData } from './types'
import { StatusIndicator } from './StatusIndicator'

interface VerificationCodeModalProps {
  isOpen: boolean;
  verificationData: VerificationData;
  modalSessionStatus: string;
  modalSessionAuthenticated: boolean;
  onCopyCode: () => void;
  onRequestNewCode: () => void;
  onClose: () => void;
}

export function VerificationCodeModal({ 
  isOpen, 
  verificationData, 
  modalSessionStatus, 
  modalSessionAuthenticated,
  onCopyCode, 
  onRequestNewCode, 
  onClose 
}: VerificationCodeModalProps) {
  if (!isOpen || !verificationData.code) return null

  const isPolling = verificationData.code === 'polling'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Código de Verificación
          </CardTitle>
          <CardDescription>
            {isPolling ? 'Generando código de verificación...' : 'Ingresa este código en WhatsApp para verificar tu número'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {isPolling ? (
              <div className="flex flex-col items-center justify-center p-8">
                <RefreshCw className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-500 mb-4 flex-shrink-0" />
                <p className="text-muted-foreground">Generando código...</p>
              </div>
            ) : (
              <>
                <div className="text-4xl font-mono bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl mb-4 shadow-lg border-2 border-blue-200">
                  {verificationData.code}
                </div>
                <Button
                  onClick={onCopyCode}
                  variant="outline"
                  className="w-full mb-4"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  {verificationData.copied ? 'Copiado!' : 'Copiar código'}
                </Button>
              </>
            )}
          </div>
          
          {!isPolling && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tiempo restante:</span>
                <span className={`text-sm font-mono ${verificationData.timeRemaining <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {verificationData.timeRemaining}s
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    verificationData.timeRemaining <= 10 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(verificationData.timeRemaining / 30) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estado:</span>
              <div className="flex items-center">
                <StatusIndicator session={{ status: modalSessionStatus, authenticated: modalSessionAuthenticated } as any} />
              </div>
            </div>
          </div>
        </CardContent>
        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isPolling}
          >
            {isPolling ? 'Generando...' : 'Cerrar'}
          </Button>
          {!isPolling && (
            <Button
              onClick={onRequestNewCode}
              disabled={verificationData.requesting || verificationData.timeRemaining > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {verificationData.requesting ? (
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2 flex-shrink-0" />
              ) : (
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              )}
              Nuevo Código
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
