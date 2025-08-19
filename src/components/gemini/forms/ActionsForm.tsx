import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  TestTube, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Zap,
  MessageSquare
} from 'lucide-react';
import type { GeminiFormData } from '../hooks/useGeminiForm';

interface ActionsFormProps {
  formData: GeminiFormData;
  isLoading: boolean;
  isTesting: boolean;
  testMessage: string;
  isReadyToSave: boolean;
  canTest: boolean;
  hasValidConfig: boolean;
  onFieldChange: <K extends keyof GeminiFormData>(field: K, value: GeminiFormData[K]) => void;
  onTestMessageChange: (message: string) => void;
  onSave: () => Promise<void>;
  onTest: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function ActionsForm({
  formData,
  isLoading,
  isTesting,
  testMessage,
  isReadyToSave,
  canTest,
  hasValidConfig,
  onFieldChange,
  onTestMessageChange,
  onSave,
  onTest,
  onDelete
}: ActionsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-green-600" />
          Estado y Acciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado del Bot */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="activo" className="text-sm font-medium">
              Estado del Bot
            </Label>
            <p className="text-xs text-muted-foreground">
              {formData.activo 
                ? "El bot responderá automáticamente a los mensajes"
                : "El bot está pausado y no responderá automáticamente"
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => onFieldChange('activo', checked)}
            />
            <Badge variant={formData.activo ? "default" : "secondary"}>
              {formData.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>

        {/* Estado de Configuración */}
        <div className="flex items-center gap-2">
          {hasValidConfig ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-400">
                Configuración válida y lista para usar
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-orange-700 dark:text-orange-400">
                Completa la configuración para activar el bot
              </span>
            </>
          )}
        </div>

        <Separator />

        {/* Sección de Pruebas */}
        <div className="space-y-4">
          <Label htmlFor="testMessage" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Probar Bot IA
          </Label>
          <div className="flex gap-2">
            <Input
              id="testMessage"
              placeholder="Escribe un mensaje para probar..."
              value={testMessage}
              onChange={(e) => onTestMessageChange(e.target.value)}
              className="flex-1"
              disabled={isTesting}
            />
            <Button
              onClick={onTest}
              disabled={!canTest}
              variant="outline"
              className="shrink-0"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Probando...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Probar
                </>
              )}
            </Button>
          </div>
          {!canTest && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Completa la configuración básica para poder probar el bot
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Botones de Acción Principal */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onSave}
            disabled={!isReadyToSave || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </>
            )}
          </Button>

          {hasValidConfig && (
            <Button
              onClick={onDelete}
              variant="destructive"
              disabled={isLoading}
              className="sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>

        {/* Ayuda */}
        {!isReadyToSave && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Campos requeridos:</strong> Nombre del bot, API Key, Sesión de WhatsApp y Personalidad del bot.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
