'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGeminiConfig, useDirectIA } from '@/hooks/useGeminiConfig';
import { GeminiConfigData, ProcessIAResponse } from '@/lib/gemini-api';
import { Loader2, Save, TestTube, Trash2, RefreshCw, MessageSquare, Zap } from 'lucide-react';

interface GeminiConfigManagerProps {
  onConfigSaved?: (config: GeminiConfigData) => void;
  onConfigDeleted?: () => void;
}

const DEFAULT_CONFIG: Omit<GeminiConfigData, 'id' | 'fechaCreacion' | 'ultimaActualizacion'> = {
  userbot: '',
  apikey: '',
  server: 'http://100.42.185.2:8015',
  promt: 'Eres un asistente virtual útil y amigable. Responde de manera clara y concisa.',
  pais: 'colombia',
  idioma: 'es',
  numerodemensajes: 8,
  delay_seconds: 8,
  temperature: 0.0,
  topP: 0.9,
  maxOutputTokens: 512,
  pause_timeout_minutes: 30,
  ai_model: 'gemini-2.5-flash',
  thinking_budget: -1,
  activo: true
};

const COUNTRIES = [
  { value: 'colombia', label: 'Colombia' },
  { value: 'mexico', label: 'México' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'peru', label: 'Perú' },
  { value: 'españa', label: 'España' },
  { value: 'usa', label: 'Estados Unidos' }
];

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' }
];

const AI_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Rápido)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Avanzado)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Estable)' }
];

export const GeminiConfigManager: React.FC<GeminiConfigManagerProps> = ({
  onConfigSaved,
  onConfigDeleted
}) => {
  const { config, isLoading, error, saveConfig, updateConfig, deleteConfig, testConfig, refresh } = useGeminiConfig();
  const { isProcessing, processIADirect } = useDirectIA();
  
  const [formData, setFormData] = useState<Omit<GeminiConfigData, 'id' | 'fechaCreacion' | 'ultimaActualizacion'>>(DEFAULT_CONFIG);
  const [testMessage, setTestMessage] = useState('Hola, ¿cómo estás?');
  const [testResult, setTestResult] = useState<ProcessIAResponse | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

  // Cargar configuración existente cuando se obtiene del servidor
  useEffect(() => {
    if (config) {
      setFormData({
        userbot: config.userbot,
        apikey: config.apikey,
        server: config.server,
        promt: config.promt,
        pais: config.pais,
        idioma: config.idioma,
        numerodemensajes: config.numerodemensajes,
        delay_seconds: config.delay_seconds,
        temperature: config.temperature,
        topP: config.topP,
        maxOutputTokens: config.maxOutputTokens,
        pause_timeout_minutes: config.pause_timeout_minutes,
        ai_model: config.ai_model,
        thinking_budget: config.thinking_budget,
        activo: config.activo
      });
    }
  }, [config]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      let success = false;
      
      if (config?.botId) {
        // Actualizar configuración existente
        success = await updateConfig(config.botId, formData);
      } else {
        // Crear nueva configuración
        success = await saveConfig(formData);
      }
      
      if (success && onConfigSaved) {
        onConfigSaved(config!);
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleDelete = async () => {
    if (!config?.botId) return;
    
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar esta configuración?');
    if (!confirmed) return;
    
    const success = await deleteConfig(config.botId);
    if (success && onConfigDeleted) {
      onConfigDeleted();
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const testConfigData: GeminiConfigData = {
        ...formData,
        botId: config?.botId || 'test'
      };
      
      const result = await processIADirect({
        body: testMessage,
        number: '123456789',
        config: testConfigData
      });
      
      setTestResult(result);
      setActiveTab('test');
    } catch (error) {
      console.error('Error testing config:', error);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Cargando configuración...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuración de Gemini IA</h2>
          <p className="text-muted-foreground">
            Configura tu asistente de inteligencia artificial
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {config && (
            <Badge variant={config.activo ? 'default' : 'secondary'}>
              {config.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="advanced">Avanzado</TabsTrigger>
          <TabsTrigger value="test">Pruebas</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Básica</CardTitle>
              <CardDescription>
                Configuración principal para tu asistente IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userbot">Nombre del Bot</Label>
                  <Input
                    id="userbot"
                    value={formData.userbot}
                    onChange={(e) => handleInputChange('userbot', e.target.value)}
                    placeholder="mi-bot-ia"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apikey">API Key de Gemini</Label>
                  <Input
                    id="apikey"
                    type="password"
                    value={formData.apikey}
                    onChange={(e) => handleInputChange('apikey', e.target.value)}
                    placeholder="AIzaSy..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promt">Prompt del Sistema</Label>
                <Textarea
                  id="promt"
                  value={formData.promt}
                  onChange={(e) => handleInputChange('promt', e.target.value)}
                  placeholder="Eres un asistente virtual..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Select value={formData.pais} onValueChange={(value) => handleInputChange('pais', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="idioma">Idioma</Label>
                  <Select value={formData.idioma} onValueChange={(value) => handleInputChange('idioma', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ai_model">Modelo de IA</Label>
                  <Select value={formData.ai_model} onValueChange={(value) => handleInputChange('ai_model', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => handleInputChange('activo', checked)}
                />
                <Label htmlFor="activo">Configuración activa</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                Parámetros técnicos para personalizar el comportamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature ({formData.temperature})</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="topP">Top P ({formData.topP})</Label>
                  <Input
                    id="topP"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.topP}
                    onChange={(e) => handleInputChange('topP', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxOutputTokens">Máximo Tokens de Respuesta</Label>
                  <Input
                    id="maxOutputTokens"
                    type="number"
                    min="1"
                    max="8192"
                    value={formData.maxOutputTokens}
                    onChange={(e) => handleInputChange('maxOutputTokens', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="numerodemensajes">Número de Mensajes de Contexto</Label>
                  <Input
                    id="numerodemensajes"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numerodemensajes}
                    onChange={(e) => handleInputChange('numerodemensajes', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delay_seconds">Delay entre Respuestas (segundos)</Label>
                  <Input
                    id="delay_seconds"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.delay_seconds}
                    onChange={(e) => handleInputChange('delay_seconds', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pause_timeout_minutes">Timeout de Pausa (minutos)</Label>
                  <Input
                    id="pause_timeout_minutes"
                    type="number"
                    min="0"
                    max="1440"
                    value={formData.pause_timeout_minutes}
                    onChange={(e) => handleInputChange('pause_timeout_minutes', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="server">Servidor de WhatsApp</Label>
                <Input
                  id="server"
                  value={formData.server}
                  onChange={(e) => handleInputChange('server', e.target.value)}
                  placeholder="http://100.42.185.2:8015"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Probar Configuración</CardTitle>
              <CardDescription>
                Envía un mensaje de prueba para verificar que la configuración funciona
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testMessage">Mensaje de Prueba</Label>
                <Textarea
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Escribe un mensaje para probar..."
                  rows={3}
                />
              </div>
              
              <Button
                onClick={handleTest}
                disabled={isTesting || !formData.apikey || !testMessage.trim()}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Probando...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Probar Configuración
                  </>
                )}
              </Button>

              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Resultado de la Prueba
                      <Badge 
                        className="ml-2" 
                        variant={testResult.success ? 'default' : 'destructive'}
                      >
                        {testResult.success ? 'Éxito' : 'Error'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResult.success ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Respuesta:</Label>
                          <div className="mt-1 p-3 bg-muted rounded-md">
                            {testResult.response}
                          </div>
                        </div>
                        
                        {testResult.thinking && (
                          <div>
                            <Label className="text-sm font-medium">Proceso de Pensamiento:</Label>
                            <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                              {testResult.thinking}
                            </div>
                          </div>
                        )}
                        
                        {testResult.usage && (
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Tokens usados: {testResult.usage.total_tokens}</span>
                            <span>Prompt: {testResult.usage.prompt_tokens}</span>
                            <span>Respuesta: {testResult.usage.completion_tokens}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-destructive">
                        <Label className="text-sm font-medium">Error:</Label>
                        <div className="mt-1 p-3 bg-destructive/10 rounded-md">
                          {testResult.error}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between pt-6">
        <div className="flex gap-2">
          {config?.botId && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
        
        <Button
          onClick={handleSave}
          disabled={isLoading || !formData.apikey || !formData.userbot}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {config?.botId ? 'Actualizar' : 'Guardar'} Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GeminiConfigManager;