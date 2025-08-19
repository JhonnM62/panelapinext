import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Brain, BarChart3, Cpu, Zap } from 'lucide-react';
import type { GeminiFormData } from '../hooks/useGeminiForm';

interface IAConfigFormProps {
  formData: GeminiFormData;
  onFieldChange: <K extends keyof GeminiFormData>(field: K, value: GeminiFormData[K]) => void;
}

const aiModels = [
  { 
    value: "gemini-2.5-flash", 
    label: "Gemini 2.5 Flash", 
    badge: "Recomendado",
    description: "Último modelo, más rápido y eficiente"
  },
  { 
    value: "gemini-2.0-flash", 
    label: "Gemini 2.0 Flash",
    description: "Buena velocidad y calidad"
  },
  { 
    value: "gemini-1.5-pro", 
    label: "Gemini 1.5 Pro",
    description: "Mayor precisión para tareas complejas"
  },
  { 
    value: "gemini-1.5-flash", 
    label: "Gemini 1.5 Flash",
    description: "Versión rápida del modelo 1.5"
  },
];

export default function IAConfigForm({ 
  formData, 
  onFieldChange 
}: IAConfigFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Configuración de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modelo de IA */}
        <div className="space-y-2">
          <Label htmlFor="ai_model" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Modelo de IA
          </Label>
          <Select 
            value={formData.ai_model} 
            onValueChange={(value) => onFieldChange('ai_model', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aiModels.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.label}</span>
                        {model.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {model.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {model.description}
                      </p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Parámetros de Generación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Creatividad (Temperature): {formData.temperature}
            </Label>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[formData.temperature]}
              onValueChange={(value) => onFieldChange('temperature', value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              0 = Más conservador, 2 = Más creativo
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topP">
              Top P: {formData.topP}
            </Label>
            <Slider
              id="topP"
              min={0.1}
              max={1}
              step={0.1}
              value={[formData.topP]}
              onValueChange={(value) => onFieldChange('topP', value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Control de diversidad en las respuestas
            </p>
          </div>
        </div>

        {/* Límites de Tokens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxOutputTokens" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Tokens Máximos: {formData.maxOutputTokens}
            </Label>
            <Slider
              id="maxOutputTokens"
              min={128}
              max={2048}
              step={64}
              value={[formData.maxOutputTokens]}
              onValueChange={(value) => onFieldChange('maxOutputTokens', value[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Longitud máxima de las respuestas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thinking_budget">
              Presupuesto de Pensamiento: {formData.thinking_budget === -1 ? 'Ilimitado' : formData.thinking_budget}
            </Label>
            <Select 
              value={formData.thinking_budget.toString()} 
              onValueChange={(value) => onFieldChange('thinking_budget', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">Ilimitado</SelectItem>
                <SelectItem value="1000">1,000 tokens</SelectItem>
                <SelectItem value="5000">5,000 tokens</SelectItem>
                <SelectItem value="10000">10,000 tokens</SelectItem>
                <SelectItem value="20000">20,000 tokens</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Límite de tokens para procesamiento interno
            </p>
          </div>
        </div>

        {/* Información del modelo seleccionado */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">
            Modelo seleccionado: {aiModels.find(m => m.value === formData.ai_model)?.label}
          </h4>
          <p className="text-xs text-muted-foreground">
            {aiModels.find(m => m.value === formData.ai_model)?.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
