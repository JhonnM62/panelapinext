import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Settings, Plus, Bot, Phone, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';

interface BotCreado {
  _id: string;
  nombreBot: string;
  descripcion?: string;
  sesionId: string;
  numeroWhatsapp: string;
  estadoBot: 'activo' | 'inactivo' | 'configurando';
  fechaCreacion: string;
}

interface SesionDisponible {
  sesionId: string;
  numeroWhatsapp: string;
  estado: string;
  disponible: boolean;
}

interface PlanLimites {
  '14dias': number;
  '6meses': number;
  '1año': number;
  'vitalicio': number;
}

const LIMITES_PLAN: PlanLimites = {
  '14dias': 1,
  '6meses': 3,
  '1año': 5,
  'vitalicio': 10
};

export default function ChatBotManager() {
  const { user, token } = useAuthStore();
  const [bots, setBots] = useState<BotCreado[]>([]);
  const [sesionesDisponibles, setSesionesDisponibles] = useState<SesionDisponible[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [planUsuario, setPlanUsuario] = useState<keyof PlanLimites>('14dias');
  
  // Form state
  const [formData, setFormData] = useState({
    nombreBot: '',
    descripcion: '',
    sesionId: ''
  });

  useEffect(() => {
    loadBots();
    loadSesionesDisponibles();
    loadPlanUsuario();
  }, []);

  const loadBots = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://100.42.185.2:8015/api/v2/bots/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Asegurar que data es un array
        const botsArray = Array.isArray(data.data) ? data.data : [];
        setBots(botsArray);
      } else {
        setBots([]);
      }
    } catch (error) {
      console.error('Error cargando bots:', error);
      toast({
        title: "Error",
        description: "Error cargando bots",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSesionesDisponibles = async () => {
    try {
      const response = await fetch('http://100.42.185.2:8015/api/v2/bots/sessions-available', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        // Filtrar sesiones con datos válidos
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
          
        console.log('Sesiones válidas cargadas:', sesionesValidas);
        setSesionesDisponibles(sesionesValidas);
      } else {
        console.warn('Error en respuesta:', data.message);
        setSesionesDisponibles([]);
      }
    } catch (error) {
      console.error('Error cargando sesiones:', error);
      setSesionesDisponibles([]);
    }
  };

  const loadPlanUsuario = () => {
    // Obtener plan del usuario
    const plan = user?.tipoplan || '14dias';
    setPlanUsuario(plan);
  };

  const canCreateBot = () => {
    const limite = LIMITES_PLAN[planUsuario];
    return bots.length < limite;
  };

  const handleCreateBot = async () => {
    if (!formData.nombreBot || !formData.sesionId) {
      toast({
        title: "Error",
        description: "Nombre del bot y sesión son requeridos",
        variant: "destructive"
      });
      return;
    }

    // Validación adicional: Verificar que sesionId sea válido
    if (formData.sesionId.trim() === '' || formData.sesionId === 'no-sessions') {
      toast({
        title: "Error",
        description: "Debes seleccionar una sesión válida",
        variant: "destructive"
      });
      return;
    }

    if (!canCreateBot()) {
      toast({
        title: "Error",
        description: `Límite alcanzado. Tu plan ${planUsuario} permite máximo ${LIMITES_PLAN[planUsuario]} bots`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://100.42.185.2:8015/api/v2/bots/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Éxito",
          description: "Bot creado exitosamente"
        });
        setFormData({ nombreBot: '', descripcion: '', sesionId: '' });
        setShowCreateForm(false);
        loadBots();
        loadSesionesDisponibles();
      } else {
        toast({
          title: "Error",
          description: data.message || 'Error creando bot',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creando bot:', error);
      toast({
        title: "Error",
        description: "Error creando bot",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBot = async (botId: string, nombreBot: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el bot "${nombreBot}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`http://100.42.185.2:8015/api/v2/bots/delete/${botId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Éxito",
          description: "Bot eliminado exitosamente"
        });
        loadBots();
        loadSesionesDisponibles();
      } else {
        toast({
          title: "Error",
          description: data.message || 'Error eliminando bot',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error eliminando bot:', error);
      toast({
        title: "Error",
        description: "Error eliminando bot",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBotStatus = async (botId: string, nuevoEstado: 'activo' | 'inactivo') => {
    try {
      const response = await fetch(`http://100.42.185.2:8015/api/v2/bots/update/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estadoBot: nuevoEstado
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Éxito",
          description: `Bot ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`
        });
        loadBots();
      } else {
        toast({
          title: "Error",
          description: data.message || 'Error actualizando bot',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error actualizando bot:', error);
      toast({
        title: "Error",
        description: "Error actualizando bot",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con límites */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mis Bots</h2>
          <p className="text-muted-foreground">
            {bots.length} de {LIMITES_PLAN[planUsuario]} bots creados (Plan {planUsuario})
          </p>
        </div>
        
        {canCreateBot() && (
          <Button onClick={() => setShowCreateForm(true)} disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Bot
          </Button>
        )}
      </div>

      {/* Formulario crear bot */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Bot</CardTitle>
            <CardDescription>
              Configura un nuevo chatbot con IA para una de tus sesiones de WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombreBot">Nombre del Bot</Label>
              <Input
                id="nombreBot"
                placeholder="Ej: Bot Ventas"
                value={formData.nombreBot}
                onChange={(e) => setFormData(prev => ({ ...prev, nombreBot: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción (opcional)</Label>
              <Input
                id="descripcion"
                placeholder="Ej: Bot para atención al cliente"
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="sesionId">Sesión de WhatsApp</Label>
              <Select value={formData.sesionId} onValueChange={(value) => setFormData(prev => ({ ...prev, sesionId: value }))}>
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
                          {sesion.numeroWhatsapp || 'Sin número'} ({sesion.sesionId})
                        </div>
                      </SelectItem>
                    ))}
                  {sesionesDisponibles.filter(s => s.disponible && s.sesionId && s.sesionId.trim() !== '').length === 0 && (
                    <SelectItem value="no-sessions" disabled>
                      No hay sesiones disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateBot} disabled={isLoading}>
                Crear Bot
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de bots */}
      <div className="grid gap-4">
        {Array.isArray(bots) && bots.map((bot) => (
          <Card key={bot._id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold">{bot.nombreBot}</h3>
                    <p className="text-sm text-muted-foreground">
                      {bot.numeroWhatsapp} • {bot.sesionId}
                    </p>
                    {bot.descripcion && (
                      <p className="text-sm text-muted-foreground mt-1">{bot.descripcion}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={bot.estadoBot === 'activo' ? 'default' : 'secondary'}>
                    {bot.estadoBot}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleBotStatus(bot._id, bot.estadoBot === 'activo' ? 'inactivo' : 'activo')}
                  >
                    {bot.estadoBot === 'activo' ? 'Desactivar' : 'Activar'}
                  </Button>

                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBot(bot._id, bot.nombreBot)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bots.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No tienes bots creados</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer bot con IA para automatizar respuestas en WhatsApp
            </p>
            {canCreateBot() && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Mi Primer Bot
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}