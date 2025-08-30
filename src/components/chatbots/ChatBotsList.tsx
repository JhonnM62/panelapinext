'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Bot, 
  Settings, 
  PlayCircle, 
  Pause, 
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Webhook,
  Brain,
  Plus,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Zap,
  Globe
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { botsAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import ChatBotForm from './ChatBotForm'

interface BotCreado {
  id: string
  _id?: string // Mantener por compatibilidad
  nombreBot: string
  descripcion?: string
  sesionId: string
  numeroWhatsapp?: string
  estadoBot: 'activo' | 'inactivo' | 'configurando'
  fechaCreacion: string
  configIA?: {
    userbot: string
    apikey: string
    server: string
    promt: string
    pais: string
    idioma: string
    numerodemensajes: number
    delay_seconds: number
    temperature: number
    topP: number
    maxOutputTokens: number
    pause_timeout_minutes: number
    ai_model: string
    thinking_budget: number
    activo: boolean
  }
  tipoBot: string
  estadisticas?: {
    mensajesEnviados: number
    mensajesRecibidos: number
    conversacionesIniciadas: number
    ultimaActividad?: string
  }
}

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  botName: string
  isDeleting: boolean
}

// Componente para confirmación de eliminación elegante
function DeleteConfirmationDialog({ isOpen, onClose, onConfirm, botName, isDeleting }: DeleteConfirmationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <DialogTitle>Eliminar ChatBot</DialogTitle>
              <DialogDescription className="mt-1">
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar el bot <span className="font-semibold text-foreground">"{botName}"</span>?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Se perderá toda su configuración, estadísticas y conversaciones asociadas.
          </p>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Bot
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ChatBotsList() {
  const { user } = useAuthStore()
  // Inicializar con arrays vacíos para evitar errores
  const [bots, setBots] = useState<BotCreado[]>([])
  const [filteredBots, setFilteredBots] = useState<BotCreado[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true) // Iniciamos en true para el primer load
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<BotCreado | null>(null)
  const [deletingBot, setDeletingBot] = useState<{ bot: BotCreado | null, isDeleting: boolean }>({ bot: null, isDeleting: false })

  // Cargar bots al montar el componente
  useEffect(() => {
    if (user?.id) {
      loadBots()
    } else {
      // Si no hay usuario, asegurarse de que no quede en loading
      setIsLoading(false)
      setBots([])
    }
  }, [user])

  // Cargar bots desde el backend
  const loadBots = async () => {
    setIsLoading(true)
    // Resetear a array vacío antes de cargar
    setBots([])
    setFilteredBots([])
    
    try {
      const result = await botsAPI.listUserBots()
      console.log('Resultado de la API:', result) // Debug
      
      if (result && result.success) {
        // Manejar diferentes estructuras posibles de respuesta
        let botsData = []
        
        if (Array.isArray(result.data)) {
          botsData = result.data
        } else if (result.data && typeof result.data === 'object') {
          // Si data es un objeto, intentar extraer un array de él
          if (Array.isArray(result.data.bots)) {
            botsData = result.data.bots
          } else if (Array.isArray(result.data.data)) {
            botsData = result.data.data
          }
        }
        
        // 🔧 MAPEAR estadoBot basado en configIA.activo
        botsData = botsData.map((bot: BotCreado) => {
          const isActivo = bot.configIA?.activo === true
          console.log(`🔧 [BOTS LIST] Bot ${bot.nombreBot}: configIA.activo=${bot.configIA?.activo}, isActivo=${isActivo}`)
          return {
            ...bot,
            estadoBot: isActivo ? 'activo' : 'inactivo'
          }
        })
        
        console.log('Bots procesados:', botsData) // Debug
        setBots(botsData)
        // Sincronizar con localStorage
        localStorage.setItem('userBots', JSON.stringify(botsData))
      } else {
        console.log('No se encontraron bots o respuesta no exitosa')
        setBots([])
      }
    } catch (error) {
      console.error('Error cargando bots:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los bots',
        variant: 'destructive'
      })
      // Intentar cargar desde localStorage como fallback
      const cachedBots = localStorage.getItem('userBots')
      if (cachedBots) {
        try {
          const parsedBots = JSON.parse(cachedBots)
          // Asegurarse de que el cache también es un array
          setBots(Array.isArray(parsedBots) ? parsedBots : [])
        } catch (e) {
          console.error('Error parseando cache:', e)
          setBots([])
        }
      } else {
        setBots([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar bots
  useEffect(() => {
    // Asegurarse de que bots es un array antes de filtrar
    const botsArray = Array.isArray(bots) ? bots : []
    
    if (searchQuery) {
      const filtered = botsArray.filter(bot => 
        bot.nombreBot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bot.sesionId.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredBots(filtered)
    } else {
      setFilteredBots(botsArray)
    }
  }, [bots, searchQuery])

  const getStatusIcon = (bot: BotCreado) => {
    // 🔧 Determinar estado basado en configIA.activo
    const isActivo = bot.configIA?.activo === true
    const estadoBot = isActivo ? "activo" : "inactivo"
    
    switch (estadoBot) {
      case 'activo':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'inactivo':
        return <Clock className="h-4 w-4 text-yellow-600" />       
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />   
    }
  }

  const getStatusBadge = (bot: BotCreado) => {
    // 🔧 Determinar estado basado en configIA.activo
    const isActivo = bot.configIA?.activo === true
    const estadoBot = isActivo ? "activo" : "inactivo"
    
    const variants: { [key: string]: "default" | "outline" | "secondary" | "destructive" } = {
      activo: "default",
      inactivo: "secondary",
      configurando: "outline"
    }
    
    const labels: { [key: string]: string } = {
      activo: "Activo",
      inactivo: "Inactivo",
      configurando: "Configurando"
    }

    return (
      <Badge variant={variants[estadoBot] || "outline"}>
        {labels[estadoBot] || estadoBot}
      </Badge>
    )
  }

  const formatTimeAgo = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca'
    
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`
    if (diff < 2592000000) return `Hace ${Math.floor(diff / 86400000)} días`
    return date.toLocaleDateString('es-ES')
  }

  // 🔧 CORRECCIÓN: Función mejorada para manejar configIA.activo
  const toggleBotStatus = async (botId: string, statusUpdate: any) => {
    try {
      let updateData: any = {}
      
      // Si recibe un objeto con los nuevos valores, usarlo directamente
      if (typeof statusUpdate === 'object') {
        updateData = statusUpdate
      } else {
        // Compatibilidad con la versión antigua (string)
        const newStatus = statusUpdate === 'activo' ? 'inactivo' : 'activo'
        updateData = {
          estadoBot: newStatus,
          'configIA.activo': newStatus === 'activo'
        }
      }
      
      const result = await botsAPI.update(botId, updateData)
      
      if (result.success) {
        const isActivated = updateData['configIA.activo'] || updateData.estadoBot === 'activo'
        toast({
          title: `Bot ${isActivated ? 'activado' : 'desactivado'}`,
          description: result.message || `Bot ${isActivated ? 'activado' : 'pausado'} exitosamente`,
        })
        loadBots() // Recargar lista
      }
    } catch (error) {
      console.error('Error cambiando estado del bot:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado del bot',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteClick = (bot: BotCreado) => {
    setDeletingBot({ bot, isDeleting: false })
  }

  const confirmDelete = async () => {
    if (!deletingBot.bot) return

    setDeletingBot(prev => ({ ...prev, isDeleting: true }))
    
    try {
      const botId = deletingBot.bot.id || deletingBot.bot._id;
      if (!botId) {
        throw new Error('ID del bot no encontrado');
      }
      const result = await botsAPI.delete(botId)
      if (result.success) {
        toast({
          title: 'Bot eliminado',
          description: 'El bot ha sido eliminado exitosamente.',
        })
        loadBots() // Recargar lista
        setDeletingBot({ bot: null, isDeleting: false })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el bot',
        variant: 'destructive'
      })
      setDeletingBot(prev => ({ ...prev, isDeleting: false }))
    }
  }

  const handleConfigSaved = () => {
    setIsCreateDialogOpen(false)
    setEditingBot(null)
    loadBots() // Recargar lista
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Cargando ChatBots...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6" style={{
        paddingTop: '5px',
        paddingLeft: '5px',
        paddingRight: '5px'
    }}>
      {/* Header con botón de crear */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold">Mis ChatBots IA</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Gestiona tus asistentes virtuales con inteligencia artificial</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBots}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            Crear ChatBot
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card className="w-full">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total ChatBots</p>
                <p className="text-lg sm:text-2xl font-bold">{Array.isArray(bots) ? bots.length : 0}</p>
              </div>
              <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Activos</p>
                <p className="text-lg sm:text-2xl font-bold">{Array.isArray(bots) ? bots.filter(b => b.configIA?.activo === true).length : 0}</p>
              </div>
              <PlayCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Mensajes Enviados</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {Array.isArray(bots) ? bots.reduce((sum, bot) => sum + (bot.estadisticas?.mensajesEnviados || 0), 0) : 0}
                </p>
              </div>
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Conversaciones</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {Array.isArray(bots) ? bots.reduce((sum, bot) => sum + (bot.estadisticas?.conversacionesIniciadas || 0), 0) : 0}
                </p>
              </div>
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <Card className="w-full">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-2xl">Buscar ChatBots</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, descripción o sesión..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de ChatBots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {Array.isArray(filteredBots) && filteredBots.map((bot) => (
          <Card key={bot.id || bot._id} className="hover:shadow-lg transition-shadow w-full">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    {getStatusIcon(bot)}
                    <span className="truncate">{bot.nombreBot}</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {bot.descripcion || 'Sin descripción'}
                  </CardDescription>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(bot)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sesión WhatsApp</p>
                    <p className="font-medium truncate">{bot.sesionId || 'Sin sesión'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Modelo IA</p>
                    <p className="font-medium">{bot.configIA?.ai_model || 'No configurado'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">País / Idioma</p>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <p className="font-medium">
                        {bot.configIA?.pais || 'Colombia'} / {bot.configIA?.idioma || 'ES'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última actividad</p>
                    <p className="font-medium">{formatTimeAgo(bot.estadisticas?.ultimaActividad)}</p>
                  </div>
                </div>

                {bot.estadisticas && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Webhook className="h-3 w-3" />
                      {bot.estadisticas.mensajesEnviados} enviados
                    </span>
                    <span>•</span>
                    <span>{bot.estadisticas.mensajesRecibidos} recibidos</span>
                    <span>•</span>
                    <span>{bot.estadisticas.conversacionesIniciadas} chats</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {/* 🔧 CORRECCIÓN: Botón Activar/Pausar basado en configIA.activo */}
                  <Button
                    size="sm"
                    variant={bot.configIA?.activo === true ? 'outline' : 'default'}
                    onClick={() => {
                      const currentState = bot.configIA?.activo === true
                      const newActiveState = !currentState
                      console.log(`🎯 [BOTÓN] Bot ${bot.nombreBot}: Estado actual=${currentState}, Nuevo estado=${newActiveState}`)
                      // Enviar tanto configIA.activo como estadoBot para compatibilidad
                      const botId = bot.id || bot._id
                      if (botId) {
                        toggleBotStatus(botId, {
                          'configIA.activo': newActiveState,
                          estadoBot: newActiveState ? 'activo' : 'inactivo'
                        })
                      }
                    }}
                    className="flex-1"
                  >
                    {bot.configIA?.activo === true ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Activar
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingBot(bot)
                      setIsCreateDialogOpen(true)
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(bot)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!Array.isArray(filteredBots) || filteredBots.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No se encontraron ChatBots
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Crea tu primer ChatBot con IA para comenzar'}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear ChatBot
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog para crear/editar bot */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBot ? 'Editar ChatBot' : 'Crear Nuevo ChatBot'}
            </DialogTitle>
            <DialogDescription>
              {editingBot 
                ? 'Modifica la configuración de tu asistente virtual' 
                : 'Configura tu nuevo asistente virtual con inteligencia artificial'}
            </DialogDescription>
          </DialogHeader>
          <ChatBotForm 
            onConfigSaved={handleConfigSaved}
            editingBot={editingBot}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <DeleteConfirmationDialog
        isOpen={!!deletingBot.bot}
        onClose={() => setDeletingBot({ bot: null, isDeleting: false })}
        onConfirm={confirmDelete}
        botName={deletingBot.bot?.nombreBot || ''}
        isDeleting={deletingBot.isDeleting}
      />
    </div>
  )
}
