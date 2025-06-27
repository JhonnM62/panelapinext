import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Brain, 
  Save, 
  TestTube, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Settings,
  MessageSquare,
  Zap,
  Globe,
  Clock,
  BarChart3,
  Cpu
} from 'lucide-react';
import { useGeminiConfig } from '@/store/gemini-store';

interface GeminiConfigProps {
  userToken: string;
  onConfigSaved?: () => void;
}

const aiModels = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recomendado)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
];

const countries = [
  { value: 'colombia', label: 'Colombia' },
  { value: 'mexico', label: 'México' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
  { value: 'peru', label: 'Perú' },
  { value: 'venezuela', label: 'Venezuela' },
  { value: 'españa', label: 'España' },
];

const languages = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

export default function GeminiConfig({ userToken, onConfigSaved }: GeminiConfigProps) {
  const {
    config,
    isLoading,
    error,
    isConfigured,
    lastTest,
    loadConfig,
    saveConfig,
    deleteConfig,
    testConfig,
    updateField,
    clearError,
    hasValidConfig,
    isReadyToUse
  } = useGeminiConfig();

  const { toast } = useToast();
  const [testMessage, setTestMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  // Cargar configuración al montar el componente
  useEffect(() => {
    if (userToken) {
      loadConfig(userToken);
    }
  }, [userToken, loadConfig]);

  // Limpiar errores cuando cambie
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSave = async () => {
    if (!hasValidConfig) {
      toast({
        title: "Configuración incompleta",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveConfig(userToken);
      toast({
        title: "✅ Configuración guardada",
        description: "Tu configuración de Gemini ha sido guardada exitosamente",
      });
      onConfigSaved?.();
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const handleTest = async () => {
    if (!config) return;
    
    setIsTesting(true);
    try {
      const result = await testConfig(testMessage || undefined);
      
      if (result.success) {
        toast({
          title: "✅ Prueba exitosa",
          description: "La configuración de Gemini funciona correctamente",
        });
      } else {
        toast({
          title: "❌ Prueba fallida",
          description: result.error || "Error en la prueba",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error en la prueba",
        description: "No se pudo realizar la prueba",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConfig(userToken);
      toast({
        title: "🗑️ Configuración eliminada",
        description: "La configuración de Gemini ha sido eliminada",
      });
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la configuración",
        variant: "destructive",
      });
    }
  };

  if (isLoading && !config) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando configuración...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-6 h-6 text-purple-600" />
              <div>
                <CardTitle>Configuración de Gemini IA</CardTitle>
                <CardDescription>
                  Configura tu integración con Google Gemini para respuestas automáticas inteligentes
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConfigured ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Configurado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  No configurado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Configuración */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center space-x-1">
                <Settings className="w-4 h-4" />
                <span>Básica</span>
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>Comportamiento</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span>Avanzada</span>
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center space-x-1">
                <TestTube className="w-4 h-4" />
                <span>Pruebas</span>
              </TabsTrigger>
            </TabsList>

            {/* Configuración Básica */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userbot">
                    Nombre del Bot <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="userbot"
                    placeholder="ej: MiBot_WhatsApp"
                    value={config?.userbot || ''}
                    onChange={(e) => updateField('userbot', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apikey">
                    API Key de Gemini <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="apikey"
                    type="password"
                    placeholder="Ingresa tu API Key de Google Gemini"
                    value={config?.apikey || ''}
                    onChange={(e) => updateField('apikey', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server">Servidor</Label>
                  <Input
                    id="server"
                    placeholder="http://100.42.185.2:8015"
                    value={config?.server || ''}
                    onChange={(e) => updateField('server', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai_model">Modelo de IA</Label>
                  <Select
                    value={config?.ai_model || 'gemini-2.5-flash'}
                    onValueChange={(value) => updateField('ai_model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Select
                    value={config?.pais || 'colombia'}
                    onValueChange={(value) => updateField('pais', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idioma">Idioma</Label>
                  <Select
                    value={config?.idioma || 'es'}
                    onValueChange={(value) => updateField('idioma', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="promt">
                  Prompt del Sistema <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="promt"
                  rows={4}
                  placeholder="Describe cómo debe comportarse tu asistente de IA..."
                  value={config?.promt || ''}
                  onChange={(e) => updateField('promt', e.target.value)}
                />
              </div>
            </TabsContent>

            {/* Configuración de Comportamiento */}
            <TabsContent value="behavior" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <Label className="text-base font-medium">Mensajes</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Número de mensajes en contexto: {config?.numerodemensajes || 8}</Label>
                    <Slider
                      value={[config?.numerodemensajes || 8]}
                      onValueChange={([value]) => updateField('numerodemensajes', value)}
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500">
                      Cantidad de mensajes previos que recordará la IA
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <Label className="text-base font-medium">Tiempos</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Delay entre respuestas: {config?.delay_seconds || 8}s</Label>
                    <Slider
                      value={[config?.delay_seconds || 8]}
                      onValueChange={([value]) => updateField('delay_seconds', value)}
                      min={1}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Timeout de pausa: {config?.pause_timeout_minutes || 30} min</Label>
                    <Slider
                      value={[config?.pause_timeout_minutes || 30]}
                      onValueChange={([value]) => updateField('pause_timeout_minutes', value)}
                      min={5}
                      max={120}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Estado del Bot</Label>
                  <p className="text-sm text-gray-500">
                    Activa o desactiva las respuestas automáticas
                  </p>
                </div>
                <Switch
                  checked={config?.activo || false}
                  onCheckedChange={(checked) => updateField('activo', checked)}
                />
              </div>
            </TabsContent>

            {/* Configuración Avanzada */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <Label className="text-base font-medium">Parámetros del Modelo</Label>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Temperature: {config?.temperature || 0}</Label>
                      <Slider
                        value={[config?.temperature || 0]}
                        onValueChange={([value]) => updateField('temperature', value)}
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500">
                        Creatividad de las respuestas (0 = conservador, 1 = creativo)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Top P: {config?.topP || 0.9}</Label>
                      <Slider
                        value={[config?.topP || 0.9]}
                        onValueChange={([value]) => updateField('topP', value)}
                        min={0.1}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    <Label className="text-base font-medium">Límites</Label>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Max Output Tokens: {config?.maxOutputTokens || 512}</Label>
                      <Slider
                        value={[config?.maxOutputTokens || 512]}
                        onValueChange={([value]) => updateField('maxOutputTokens', value)}
                        min={100}
                        max={2048}
                        step={50}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Thinking Budget: {config?.thinking_budget || -1}</Label>
                      <Slider
                        value={[config?.thinking_budget || -1]}
                        onValueChange={([value]) => updateField('thinking_budget', value)}
                        min={-1}
                        max={1000}
                        step={50}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500">
                        -1 = sin límite, 0+ = límite específico
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pruebas */}
            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testMessage">Mensaje de prueba</Label>
                  <Textarea
                    id="testMessage"
                    rows={3}
                    placeholder="Escribe un mensaje para probar la configuración..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleTest}
                  disabled={!hasValidConfig || isTesting}
                  className="w-full"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Probar Configuración
                </Button>

                {lastTest && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-sm">Resultado de la prueba</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {lastTest.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            {lastTest.success ? 'Éxito' : 'Error'}
                          </span>
                        </div>
                        
                        {lastTest.response && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm">{lastTest.response}</p>
                          </div>
                        )}
                        
                        {lastTest.error && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-800">{lastTest.error}</p>
                          </div>
                        )}

                        {lastTest.usage && (
                          <div className="text-xs text-gray-500">
                            Tokens usados: {lastTest.usage.totalTokens} 
                            (prompt: {lastTest.usage.promptTokens}, respuesta: {lastTest.usage.responseTokens})
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-between">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={!isConfigured || isLoading}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar Configuración
        </Button>

        <Button
          onClick={handleSave}
          disabled={!hasValidConfig || isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
