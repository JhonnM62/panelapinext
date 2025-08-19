import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, MessageSquare, AlertCircle } from 'lucide-react';
import type { GeminiFormData } from '../hooks/useGeminiForm';

interface BasicConfigFormProps {
  formData: GeminiFormData;
  availableSessions: Array<{ sesionId: string; nombresesion: string; numeroWhatsapp: string }>;
  onFieldChange: <K extends keyof GeminiFormData>(field: K, value: GeminiFormData[K]) => void;
}

export default function BasicConfigForm({ 
  formData, 
  availableSessions, 
  onFieldChange 
}: BasicConfigFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-600" />
          Configuración Básica del Bot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nombre del Bot */}
        <div className="space-y-2">
          <Label htmlFor="userbot">Nombre del Bot *</Label>
          <Input
            id="userbot"
            placeholder="Ej: Mi Asistente IA"
            value={formData.userbot}
            onChange={(e) => onFieldChange('userbot', e.target.value)}
            className="transition-all duration-200"
          />
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="apikey">API Key de Gemini *</Label>
          <Input
            id="apikey"
            type="password"
            placeholder="Ingresa tu API Key de Google Gemini"
            value={formData.apikey}
            onChange={(e) => onFieldChange('apikey', e.target.value)}
            className="transition-all duration-200"
          />
          <p className="text-xs text-muted-foreground">
            Obtén tu API Key gratuita en{' '}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        {/* Sesión de WhatsApp */}
        <div className="space-y-2">
          <Label htmlFor="sesionId">Sesión de WhatsApp *</Label>
          <Select 
            value={formData.sesionId} 
            onValueChange={(value) => onFieldChange('sesionId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una sesión activa" />
            </SelectTrigger>
            <SelectContent>
              {availableSessions.map((session) => (
                <SelectItem key={session.sesionId} value={session.sesionId}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{session.nombresesion}</span>
                    <span className="text-sm text-muted-foreground">
                      ({session.numeroWhatsapp})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableSessions.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay sesiones disponibles. 
                <a href="/dashboard/sessions" className="text-blue-500 hover:underline ml-1">
                  Crea una sesión primero
                </a>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Número de teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Número de WhatsApp (Opcional)</Label>
          <Input
            id="phoneNumber"
            placeholder="Ej: +573001234567"
            value={formData.phoneNumber}
            onChange={(e) => onFieldChange('phoneNumber', e.target.value)}
            className="transition-all duration-200"
          />
          <p className="text-xs text-muted-foreground">
            Se detectará automáticamente desde la sesión si no se especifica
          </p>
        </div>

        {/* Prompt del Bot */}
        <div className="space-y-2">
          <Label htmlFor="promt" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Personalidad del Bot *
          </Label>
          <Textarea
            id="promt"
            placeholder="Ej: Eres un asistente inteligente y amigable para WhatsApp. Responde de manera clara, útil y concisa."
            value={formData.promt}
            onChange={(e) => onFieldChange('promt', e.target.value)}
            rows={4}
            className="transition-all duration-200"
          />
          <p className="text-xs text-muted-foreground">
            Define cómo se comportará tu bot IA con los usuarios
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
