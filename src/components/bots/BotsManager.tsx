import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Settings, Plus, Bot, AlertTriangle, Crown, Zap, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useAuthStore } from '@/store/auth';
import LimitsCard from '@/components/plans/LimitsCard';
import { GeminiConfigRefactored } from '@/components/gemini';

interface BotCreado {
  _id: string;
  nombreBot: string;
  descripcion?: string;
  sesionId: string;
  numeroWhatsapp: string;
  estadoBot: 'activo' | 'inactivo' | 'configurando';
  fechaCreacion: string;
  tipoBot?: string;
  configIA?: any;
}

export default function BotsManager() {
  const { user } = useAuthStore();
  const { suscripcion, resourceLimits, canCreateResource, refreshData, loading: limitsLoading } = usePlanLimits();
  
  const [bots, setBots] = useState<BotCreado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bots'); // 🆕 Estado para controlar tabs
  
  // 🎯 Confirmación elegante en lugar de confirm() del navegador
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  useEffect(() => {
    loadBots();
  }, []);

  // 🔄 Refrescar datos cuando cambie la suscripción
  useEffect(() => {
    if (suscripcion) {
      loadBots();
    }
  }, [suscripcion]);

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
        console.log('🤖 [BOTS] Datos recibidos:', data.data);
        setBots(data.data || []);
      } else {
        console.error('🤖 [BOTS] Error en respuesta:', data.message);
        toast.error(data.message || 'Error cargando bots');
      }
    } catch (error) {
      console.error('🤖 [BOTS] Error cargando bots:', error);
      toast.error('Error cargando bots');
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 **NUEVA LÓGICA**: Usar sistema de límites dinámico
  const canCreateBot = () => {
    if (!resourceLimits) return false;
    return canCreateResource('botsIA');
  };

  // Memorizar información de límites para evitar re-renders
  const limitsInfo = useMemo(() => {
    if (!resourceLimits || !suscripcion) return null;
    return {
      current: resourceLimits.botsIA.current,
      limit: resourceLimits.botsIA.limit,
      remaining: resourceLimits.botsIA.remaining,
      planName: suscripcion.plan.nombre
    };
  }, [resourceLimits, suscripcion]);

  // 🆕 Función para abrir configuración avanzada
  const handleOpenAdvancedConfig = () => {
    setActiveTab('config');
  };

  // 🆕 Función para volver a la lista de bots
  const handleBackToBots = () => {
    setActiveTab('bots');
    loadBots(); // Recargar bots por si se creó uno nuevo
    refreshData(); // Refrescar datos de límites
  };

  // 🆕 Callback cuando se guarda configuración
  const handleConfigSaved = () => {
    toast.success('¡Bot configurado exitosamente!');
    handleBackToBots();
  };

  const handleDeleteBot = (botId: string, nombreBot: string) => {
    showConfirmation({
      title: 'Eliminar Bot',
      description: `¿Estás seguro de que deseas eliminar el bot "${nombreBot}"? Esta acción no se puede deshacer y se perderá toda su configuración.`,
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
            toast.success('Bot eliminado exitosamente');
            loadBots();
            refreshData();
          } else {
            toast.error(data.message || 'Error eliminando bot');
          }
        } catch (error) {
          console.error('Error eliminando bot:', error);
          toast.error('Error eliminando bot');
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
      {/* 📊 Mostrar límites si hay suscripción activa */}
      {suscripcion && resourceLimits && (
        <LimitsCard 
          suscripcion={suscripcion} 
          resourceLimits={resourceLimits} 
          showActions={false}
          title="Resumen de tu Plan"
          className="mb-6"
        />
      )}

      {/* 🆕 Interfaz con Tabs - SIN REDIRECCIÓN */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bots" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Mis ChatBots
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Configuración Avanzada
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Lista de Bots */}
        <TabsContent value="bots" className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Mis ChatBots con IA
                  <Zap className="h-5 w-5 text-yellow-500" />
                </h2>
                <p className="text-muted-foreground">
                  {limitsInfo 
                    ? `${limitsInfo.current} de ${limitsInfo.limit} bots creados (Plan ${limitsInfo.planName})`
                    : `${bots.length} bots creados`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 🆕 BOTÓN SIN REDIRECCIÓN */}
              <Button 
                onClick={handleOpenAdvancedConfig} 
                disabled={isLoading || limitsLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Ir a Configuración Avanzada de IA
              </Button>
              {!canCreateBot() && (
                <div className="text-right ml-2">
                  <Badge variant="outline">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Límite: {limitsInfo && `${limitsInfo.current}/${limitsInfo.limit}`}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Información sobre configuración avanzada */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    Configuración Avanzada de IA disponible
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Usa la configuración avanzada para crear chatbots con todas las opciones de IA, webhooks y automatización.
                  </p>
                </div>
                <Button variant="outline" onClick={handleOpenAdvancedConfig}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>

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
                        {bot.tipoBot && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {bot.tipoBot === 'ia' ? 'IA' : bot.tipoBot}
                          </Badge>
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

                      {/* 🆕 BOTÓN SIN REDIRECCIÓN */}
                      <Button variant="outline" size="sm" onClick={handleOpenAdvancedConfig}>
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
                <h3 className="font-semibold mb-2 flex items-center gap-2 justify-center">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  ¡Crea tu primer ChatBot con IA!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Automatiza respuestas inteligentes en WhatsApp con tecnología de IA avanzada.
                  Responde a tus clientes 24/7 de manera natural y efectiva.
                </p>
                {/* 🆕 BOTÓN SIN REDIRECCIÓN */}
                <Button onClick={handleOpenAdvancedConfig}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Mi Primer Bot
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Cargando chatbots...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: Configuración Avanzada */}
        <TabsContent value="config" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={handleBackToBots}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Mis Bots
            </Button>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold">Configuración Avanzada de IA</h2>
            </div>
          </div>

          {/* 🆕 Integración del componente refactorizado - SIN REDIRECCIÓN */}
          {user && (
            <GeminiConfigRefactored 
              userToken={user.token || localStorage.getItem('token') || ''} 
              onConfigSaved={handleConfigSaved}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* 🎯 Modal de confirmación elegante */}
      <ConfirmationDialog />
    </div>
  );
}
