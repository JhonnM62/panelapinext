import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, Phone, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface SesionDisponible {
  sesionId: string;
  numeroWhatsapp: string;
  estado: string;
  disponible: boolean;
}

export default function ChatBotForm() {
  const { user } = useAuthStore();
  const { suscripcion, resourceLimits, canCreateResource } = usePlanLimits();
  
  const [sesionesDisponibles, setSesionesDisponibles] = useState<SesionDisponible[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nombreBot: '',
    descripcion: '',
    sesionId: ''
  });

  useEffect(() => {
    loadSesionesDisponibles();
  }, []);

  const loadSesionesDisponibles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/bots/sessions-available', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // 🔧 VALIDACIÓN: Filtrar sesiones con datos válidos
        const sesionesValidas = (data.data || [])
          .filter((sesion: any) => 
            sesion && 
            typeof sesion.sesionId === 'string' && 
            sesion.sesionId.trim() !== '' &&
            sesion.sesionId !== 'undefined' &&
            sesion.sesionId !== 'null'
          )
          .map((sesion: any) => ({
            sesionId: sesion.sesionId.trim(),
            numeroWhatsapp: sesion.numeroWhatsapp || 'Sin número',
            estado: sesion.estado || 'desconocido',
            disponible: Boolean(sesion.disponible)
          }));
          
        console.log('🔍 [CHATBOT FORM] Sesiones válidas cargadas:', sesionesValidas);
        setSesionesDisponibles(sesionesValidas);
      } else {
        console.warn('⚠️ [CHATBOT FORM] Error en respuesta:', data.message);
        setSesionesDisponibles([]);
      }
    } catch (error) {
      console.error('🚨 [CHATBOT FORM] Error cargando sesiones:', error);
      setSesionesDisponibles([]);
    }
  };

  const canCreateBot = () => {
    if (!resourceLimits) return false;
    return canCreateResource('botsIA');
  };

  const handleCreateBot = async () => {
    if (!formData.nombreBot || !formData.sesionId) {
      toast({
        title: "Error de validación",
        description: "Nombre del bot y sesión son requeridos",
        variant: "destructive",
      });
      return;
    }

    // 🔧 VALIDACIÓN ADICIONAL: Verificar que sesionId sea válido
    if (formData.sesionId.trim() === '' || formData.sesionId === 'no-sessions') {
      toast({
        title: "Error de validación",
        description: "Debes seleccionar una sesión válida",
        variant: "destructive",
      });
      return;
    }

    if (!canCreateBot()) {
      const limit = resourceLimits?.botsIA.limit || 0;
      toast({
        title: "Límite alcanzado",
        description: `Tu plan permite máximo ${limit} ChatBots con IA`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/bots/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "¡Bot creado!",
          description: "ChatBot con IA creado exitosamente",
        });
        
        // Limpiar formulario
        setFormData({ nombreBot: '', descripcion: '', sesionId: '' });
        
        // Recargar sesiones disponibles
        loadSesionesDisponibles();
      } else {
        toast({
          title: "Error al crear bot",
          description: data.message || 'Error creando bot',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creando bot:', error);
      toast({
        title: "Error",
        description: "Error creando bot",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nombreBot: '', descripcion: '', sesionId: '' });
  };

  if (!canCreateBot()) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-amber-900 dark:text-amber-100 mb-2">
            Límite de ChatBots Alcanzado
          </h3>
          <p className="text-amber-800 dark:text-amber-200 mb-4">
            Has alcanzado el límite de {resourceLimits?.botsIA.limit || 0} ChatBots con IA en tu plan actual.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
            Actualizar Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información del plan */}
      {resourceLimits && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    ChatBots con IA Disponibles
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {resourceLimits.botsIA.remaining} de {resourceLimits.botsIA.limit} disponibles
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-blue-300">
                {suscripcion?.plan.nombre || 'Plan Básico'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario crear bot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            Crear Nuevo ChatBot con IA
          </CardTitle>
          <CardDescription>
            Configura un nuevo chatbot inteligente para una de tus sesiones de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreBot">Nombre del ChatBot *</Label>
            <Input
              id="nombreBot"
              placeholder="Ej: Bot Ventas IA, Asistente Cliente, etc."
              value={formData.nombreBot}
              onChange={(e) => setFormData(prev => ({ ...prev, nombreBot: e.target.value }))}
              className="transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Input
              id="descripcion"
              placeholder="Ej: Bot inteligente para atención al cliente 24/7"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sesionId">Sesión de WhatsApp *</Label>
            <Select 
              value={formData.sesionId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, sesionId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una sesión disponible" />
              </SelectTrigger>
              <SelectContent>
                {sesionesDisponibles
                  .filter(s => s.disponible && s.sesionId && s.sesionId.trim() !== '')
                  .map((sesion) => (
                    <SelectItem key={sesion.sesionId} value={sesion.sesionId}>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">{sesion.numeroWhatsapp || 'Sin número'}</span>
                        <span className="text-sm text-muted-foreground">({sesion.sesionId})</span>
                      </div>
                    </SelectItem>
                  ))}
                {sesionesDisponibles.filter(s => s.disponible && s.sesionId && s.sesionId.trim() !== '').length === 0 && (
                  <SelectItem value="no-sessions" disabled>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="w-4 h-4" />
                      No hay sesiones disponibles
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Solo se muestran sesiones activas y sin ChatBot asignado
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleCreateBot} 
              disabled={isLoading || !formData.nombreBot || !formData.sesionId}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Crear ChatBot
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetForm} disabled={isLoading}>
              Limpiar
            </Button>
          </div>

          {/* Información adicional */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">💡 ¿Qué incluye tu ChatBot IA?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Respuestas inteligentes automatizadas 24/7</li>
              <li>• Procesamiento de lenguaje natural avanzado</li>
              <li>• Configuración personalizable de personalidad</li>
              <li>• Integración completa con WhatsApp</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
