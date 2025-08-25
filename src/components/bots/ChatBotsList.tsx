import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Trash2, Settings, Zap, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAuthStore } from '@/store/auth';
import { usePlanLimits } from '@/hooks/usePlanLimits';

interface BotCreado {
  id: string;
  _id?: string; // Mantener por compatibilidad
  nombreBot: string;
  descripcion?: string;
  sesionId: string;
  numeroWhatsapp: string;
  estadoBot: 'activo' | 'inactivo' | 'configurando';
  fechaCreacion: string;
  tipoBot?: string;
  configIA?: any;
}

export default function ChatBotsList() {
  const { user } = useAuthStore();
  const { suscripcion, resourceLimits, refreshData } = usePlanLimits();
  
  const [bots, setBots] = useState<BotCreado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🎯 Confirmación elegante
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    loadBots();
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
        console.log('🤖 [CHATBOTS LIST] Datos recibidos:', data.data);
        setBots(data.data || []);
      } else {
        console.error('🤖 [CHATBOTS LIST] Error en respuesta:', data.message);
        toast({
          title: "Error",
          description: data.message || 'Error cargando ChatBots',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('🤖 [CHATBOTS LIST] Error cargando bots:', error);
      toast({
        title: "Error",
        description: "Error cargando ChatBots",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBot = (botId: string, nombreBot: string) => {
    showConfirmation({
      title: 'Eliminar ChatBot',
      description: `¿Estás seguro de que deseas eliminar el ChatBot "${nombreBot}"? Esta acción no se puede deshacer y se perderá toda su configuración de IA.`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
      icon: (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
      ),
      onConfirm: async () => {
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
            toast({
              title: "ChatBot eliminado",
              description: "ChatBot eliminado exitosamente",
            });
            loadBots();
            refreshData(); // Refrescar límites
          } else {
            toast({
              title: "Error",
              description: data.message || 'Error eliminando ChatBot',
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error eliminando bot:', error);
          toast({
            title: "Error",
            description: "Error eliminando ChatBot",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
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
        toast({
          title: `ChatBot ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`,
          description: `El ChatBot ha sido ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`,
        });
        loadBots();
      } else {
        toast({
          title: "Error",
          description: data.message || 'Error actualizando ChatBot',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error actualizando bot:', error);
      toast({
        title: "Error",
        description: "Error actualizando ChatBot",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total ChatBots</p>
                <p className="text-2xl font-bold text-purple-600">{bots.length}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ChatBots Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {bots.filter(bot => bot.estadoBot === 'activo').length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Límite Plan</p>
                <p className="text-2xl font-bold text-blue-600">
                  {resourceLimits ? `${resourceLimits.botsIA.current}/${resourceLimits.botsIA.limit}` : '—'}
                </p>
              </div>
              <div className="flex items-center">
                {suscripcion && (
                  <Badge variant="outline">{suscripcion.plan.nombre}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de ChatBots */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Mis ChatBots con IA
        </h3>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Cargando ChatBots...</p>
            </CardContent>
          </Card>
        ) : bots.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2 flex items-center gap-2 justify-center">
                <Zap className="h-5 w-5 text-yellow-500" />
                No tienes ChatBots creados
              </h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer ChatBot con IA para automatizar respuestas inteligentes en WhatsApp.
                Tu asistente virtual responderá 24/7 de manera natural y efectiva.
              </p>
              <p className="text-sm text-muted-foreground">
                Ve a la pestaña "Crear ChatBot" para empezar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bots.map((bot) => (
              <Card key={bot.id || bot._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Bot className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{bot.nombreBot}</h3>
                        <p className="text-sm text-muted-foreground">
                          📱 {bot.numeroWhatsapp} • 🔗 {bot.sesionId}
                        </p>
                        {bot.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1">{bot.descripcion}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {bot.tipoBot && (
                            <Badge variant="outline" className="text-xs">
                              {bot.tipoBot === 'ia' ? '🤖 IA' : bot.tipoBot}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Creado: {formatDate(bot.fechaCreacion)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={bot.estadoBot === 'activo' ? 'default' : 'secondary'}
                        className={bot.estadoBot === 'activo' ? 'bg-green-600' : ''}
                      >
                        {bot.estadoBot === 'activo' ? '🟢 Activo' : '⚪ Inactivo'}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const botId = bot.id || bot._id;
                          if (botId) {
                            toggleBotStatus(botId, bot.estadoBot === 'activo' ? 'inactivo' : 'activo');
                          }
                        }}
                        disabled={isLoading || !(bot.id || bot._id)}
                      >
                        {bot.estadoBot === 'activo' ? 'Desactivar' : 'Activar'}
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isLoading}
                        onClick={() => {
                          toast({
                            title: "Configuración avanzada",
                            description: "Esta función estará disponible próximamente",
                          });
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const botId = bot.id || bot._id;
                          if (botId) {
                            handleDeleteBot(botId, bot.nombreBot);
                          }
                        }}
                        disabled={isLoading || !(bot.id || bot._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* 🎯 Modal de confirmación elegante */}
      <ConfirmationDialog />
    </div>
  );
}
