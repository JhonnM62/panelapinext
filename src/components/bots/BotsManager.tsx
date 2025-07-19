import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Settings, Plus, Bot, Phone } from 'lucide-react';
import { toast } from 'sonner';

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

export default function BotsManager() {
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v2/bots/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setBots(data.data || []);
      }
    } catch (error) {
      console.error('Error cargando bots:', error);
      toast.error('Error cargando bots');
    } finally {
      setIsLoading(false);
    }
  };

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
          
        console.log('🔍 [BOTS] Sesiones válidas cargadas:', sesionesValidas);
        setSesionesDisponibles(sesionesValidas);
      } else {
        console.warn('⚠️ [BOTS] Error en respuesta:', data.message);
        setSesionesDisponibles([]);
      }
    } catch (error) {
      console.error('🚨 [BOTS] Error cargando sesiones:', error);
      setSesionesDisponibles([]);
    }
  };

  const loadPlanUsuario = () => {
    // Obtener plan del localStorage o contexto de auth
    const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const plan = authData.state?.user?.tipoplan || '14dias';
    setPlanUsuario(plan);
  };

  const canCreateBot = () => {
    const limite = LIMITES_PLAN[planUsuario];
    return bots.length < limite;
  };

  const handleCreateBot = async () => {
    if (!formData.nombreBot || !formData.sesionId) {
      toast.error('Nombre del bot y sesión son requeridos');
      return;
    }

    // 🔧 VALIDACIÓN ADICIONAL: Verificar que sesionId sea válido
    if (formData.sesionId.trim() === '' || formData.sesionId === 'no-sessions') {
      toast.error('Debes seleccionar una sesión válida');
      return;
    }

    if (!canCreateBot()) {
      toast.error(`Límite alcanzado. Tu plan ${planUsuario} permite máximo ${LIMITES_PLAN[planUsuario]} bots`);
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
        toast.success('Bot creado exitosamente');
        setFormData({ nombreBot: '', descripcion: '', sesionId: '' });
        setShowCreateForm(false);
        loadBots();
        loadSesionesDisponibles();
      } else {
        toast.error(data.message || 'Error creando bot');
      }
    } catch (error) {
      console.error('Error creando bot:', error);
      toast.error('Error creando bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('¿Estás seguro de eliminar este bot? Se perderá toda su configuración.')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v2/bots/delete/${botId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Bot eliminado exitosamente');
        loadBots();
        loadSesionesDisponibles();
      } else {
        toast.error(data.message || 'Error eliminando bot');
      }
    } catch (error) {
      console.error('Error eliminando bot:', error);
      toast.error('Error eliminando bot');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBotStatus = async (botId: string, nuevoEstado: 'activo' | 'inactivo') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v2/bots/update/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token,
          estadoBot: nuevoEstado
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Bot ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`);
        loadBots();
      } else {
        toast.error(data.message || 'Error actualizando bot');
      }
    } catch (error) {
      console.error('Error actualizando bot:', error);
      toast.error('Error actualizando bot');
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
        {bots.map((bot) => (
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
                    onClick={() => handleDeleteBot(bot._id)}
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
