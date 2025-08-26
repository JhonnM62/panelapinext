'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Plus } from '@/components/ui/icons'
import { SessionFormData } from './types'

interface CreateSessionModalProps {
  isOpen: boolean;
  isCreating: boolean;
  formData: SessionFormData;
  onFormDataChange: (data: Partial<SessionFormData>) => void;
  onClose: () => void;
  onCreate: () => void;
}

export function CreateSessionModal({ 
  isOpen, 
  isCreating, 
  formData, 
  onFormDataChange, 
  onClose, 
  onCreate 
}: CreateSessionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nueva Sesión de WhatsApp</CardTitle>
          <CardDescription>
            Configura una nueva sesión para conectar con WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Nombre de la sesión</Label>
            <Input
              id="sessionName"
              value={formData.sessionName}
              onChange={(e) => onFormDataChange({ sessionName: e.target.value })}
              placeholder="Ej: MiBot-2024"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tipo de autenticación</Label>
            <Tabs 
              value={formData.authType} 
              onValueChange={(value) => onFormDataChange({ authType: value as 'qr' | 'code' })}
            >
              <TabsList className="grid w-full grid-cols-2 gap-1">
                <TabsTrigger value="qr" className="text-xs sm:text-sm px-2 sm:px-3 truncate">
                  <span className="hidden sm:inline">Código QR</span>
                  <span className="sm:hidden">QR</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs sm:text-sm px-2 sm:px-3 truncate">
                  <span className="hidden sm:inline">Código de emparejamiento</span>
                  <span className="sm:hidden">Código</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Número de teléfono {formData.authType === 'code' && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => onFormDataChange({ phoneNumber: e.target.value })}
              placeholder="+57 300 123 4567"
            />
            {formData.authType === 'qr' && (
              <p className="text-xs text-muted-foreground">
                Opcional para QR. Usado para asociar el número.
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL del Webhook (opcional)</Label>
            <Input
              id="webhookUrl"
              value={formData.webhookUrl}
              onChange={(e) => onFormDataChange({ webhookUrl: e.target.value })}
              placeholder="https://mi-servidor.com/webhook"
            />
          </div>
        </CardContent>
        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            onClick={onCreate}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreating ? (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2 flex-shrink-0" />
            ) : (
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            )}
            Crear Sesión
          </Button>
        </div>
      </Card>
    </div>
  )
}
