import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Brain, Settings, Zap, AlertCircle } from 'lucide-react';
import { useGeminiForm } from './hooks/useGeminiForm';
import BasicConfigForm from './forms/BasicConfigForm';
import AdvancedConfigForm from './forms/AdvancedConfigForm';
import IAConfigForm from './forms/IAConfigForm';
import ActionsForm from './forms/ActionsForm';
import AutoProcessor from './AutoProcessor';
import AutomationToggle from './AutomationToggle';

interface GeminiConfigProps {
  userToken: string;
  onConfigSaved?: () => void;
}

export default function GeminiConfig({
  userToken,
  onConfigSaved,
}: GeminiConfigProps) {
  const {
    // Estado del formulario
    formData,
    isLoading,
    isTesting,
    testMessage,
    availableSessions,
    
    // Acciones del formulario
    updateField,
    setTestMessage,
    
    // Acciones principales
    handleSave,
    handleTest,
    handleDelete,
    loadAvailableSessions,
    
    // Estados derivados
    hasValidConfig,
    isReadyToSave,
    canTest
  } = useGeminiForm(userToken, onConfigSaved);

  // Cargar sesiones disponibles al montar el componente
  useEffect(() => {
    loadAvailableSessions();
  }, [loadAvailableSessions]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Configuración Avanzada de IA
              <Zap className="h-6 w-6 text-yellow-500" />
            </h1>
            <p className="text-muted-foreground">
              Configura tu ChatBot con inteligencia artificial para WhatsApp
            </p>
          </div>
        </div>
        
        {hasValidConfig && (
          <Badge variant="default" className="hidden sm:flex">
            <Brain className="w-4 h-4 mr-1" />
            Configurado
          </Badge>
        )}
      </div>

      {/* Información importante */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>¡Nuevo!</strong> Esta configuración avanzada reemplaza al formulario básico. 
          Los bots creados aquí aparecerán automáticamente en tu lista de bots.
        </AlertDescription>
      </Alert>

      {/* Componentes de procesamiento automático */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AutoProcessor />
        <AutomationToggle />
      </div>

      {/* Formularios de configuración */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Básico</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Avanzado</span>
          </TabsTrigger>
          <TabsTrigger value="ia" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">IA</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <span className="hidden sm:inline">Acciones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <BasicConfigForm
            formData={formData}
            availableSessions={availableSessions}
            onFieldChange={updateField}
          />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <AdvancedConfigForm
            formData={formData}
            onFieldChange={updateField}
          />
        </TabsContent>

        <TabsContent value="ia" className="space-y-4">
          <IAConfigForm
            formData={formData}
            onFieldChange={updateField}
          />
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <ActionsForm
            formData={formData}
            isLoading={isLoading}
            isTesting={isTesting}
            testMessage={testMessage}
            isReadyToSave={isReadyToSave}
            canTest={canTest}
            hasValidConfig={hasValidConfig}
            onFieldChange={updateField}
            onTestMessageChange={setTestMessage}
            onSave={handleSave}
            onTest={handleTest}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
