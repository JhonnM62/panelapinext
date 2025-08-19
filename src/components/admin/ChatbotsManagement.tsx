'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { 
  Bot,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Play,
  Pause,
  MessageSquare,
  Activity,
  Zap,
  Brain,
  Settings,
  Eye
} from 'lucide-react'

interface Chatbot {
  _id: string
  nombreBot: string
  descripcion: string
  tipoBot: string
  userId: string
  userEmail: string
  sesionId: string
  sesionName: string
  activo: boolean
  fechaCreacion: string
  configuracion: any
  estadisticas: {
    mensajesProcesados: number
    respuestasEnviadas: number
    errores: number
  }
}

interface ChatbotsManagementProps {
  token: string
  baseUrl: string
}

export default function ChatbotsManagement({ token, baseUrl }: ChatbotsManagementProps) {
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    loadChatbots()
  }, [])

  const loadChatbots = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/chatbots`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setChatbots(data.data)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los chatbots",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleChatbot = async (botId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/chatbots/${botId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activo: !currentStatus })
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Chatbot ${!currentStatus ? 'activado' : 'pausado'} exitosamente`
        })
        loadChatbots()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del chatbot",
        variant: "destructive"
      })
    }
  }

  const deleteChatbot = async () => {
    if (!selectedBot) return
    
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/chatbots/${selectedBot._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Chatbot eliminado exitosamente"
        })
        setIsDeleteDialogOpen(false)
        loadChatbots()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el chatbot",
        variant: "destructive"
      })
    }
  }

  const getBotTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'ia': return <Brain className="h-4 w-4" />
      case 'automatico': return <Zap className="h-4 w-4" />
      case 'respuesta': return <MessageSquare className="h-4 w-4" />
      default: return <Bot className="h-4 w-4" />
    }
  }

  const getBotTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'ia': return 'bg-purple-100 text-purple-800'
      case 'automatico': return 'bg-blue-100 text-blue-800'
      case 'respuesta': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredChatbots = chatbots.filter(bot => 
    bot.nombreBot?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Cargando chatbots...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Gestión de Chatbots con IA
                </CardTitle>
                <CardDescription>
                  Administra todos los chatbots configurados en el sistema
                </CardDescription>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar chatbots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={loadChatbots} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Chatbots</p>
                    <p className="text-2xl font-bold">{chatbots.length}</p>
                  </div>
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Activos</p>
                    <p className="text-2xl font-bold">{chatbots.filter(b => b.activo).length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Con IA</p>
                    <p className="text-2xl font-bold">{chatbots.filter(b => b.tipoBot === 'ia').length}</p>
                  </div>
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mensajes Total</p>
                    <p className="text-2xl font-bold">
                      {chatbots.reduce((sum, bot) => sum + bot.estadisticas.mensajesProcesados, 0).toLocaleString()}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de chatbots */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nombre Bot</TableHead>
                    <TableHead className="min-w-[150px]">Usuario</TableHead>
                    <TableHead className="min-w-[120px]">Sesión</TableHead>
                    <TableHead className="min-w-[100px]">Tipo</TableHead>
                    <TableHead className="min-w-[80px]">Estado</TableHead>
                    <TableHead className="min-w-[120px]">Mensajes</TableHead>
                    <TableHead className="min-w-[120px]">Creado</TableHead>
                    <TableHead className="min-w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChatbots.map((bot) => (
                    <TableRow key={bot._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{bot.nombreBot}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {bot.descripcion}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{bot.userEmail || 'Sin usuario'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {bot.sesionName || 'No asignada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getBotTypeColor(bot.tipoBot)}`}>
                          <span className="flex items-center gap-1">
                            {getBotTypeIcon(bot.tipoBot)}
                            {bot.tipoBot}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={bot.activo ? "default" : "secondary"}
                          className={`text-xs ${bot.activo ? "bg-green-100 text-green-800" : ""}`}
                        >
                          {bot.activo ? 'Activo' : 'Pausado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{bot.estadisticas.mensajesProcesados.toLocaleString()}</p>
                          {bot.estadisticas.errores > 0 && (
                            <p className="text-xs text-red-600">
                              {bot.estadisticas.errores} errores
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(bot.fechaCreacion).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedBot(bot)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={bot.activo ? "outline" : "default"}
                            className="h-8 w-8 p-0"
                            onClick={() => toggleChatbot(bot._id, bot.activo)}
                          >
                            {bot.activo ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedBot(bot)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Info card */}
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                  Acerca de los Chatbots con IA
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Los chatbots permiten automatizar respuestas en WhatsApp usando inteligencia artificial.
                  Pueden configurarse con diferentes personalidades y responder automáticamente a los mensajes.
                  Los bots con IA utilizan modelos de lenguaje avanzados para generar respuestas contextuales.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de vista detallada */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Chatbot</DialogTitle>
            <DialogDescription>
              Información completa del chatbot {selectedBot?.nombreBot}
            </DialogDescription>
          </DialogHeader>
          {selectedBot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-sm">{selectedBot.nombreBot}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <Badge className={`text-xs ${getBotTypeColor(selectedBot.tipoBot)}`}>
                    <span className="flex items-center gap-1">
                      {getBotTypeIcon(selectedBot.tipoBot)}
                      {selectedBot.tipoBot}
                    </span>
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant={selectedBot.activo ? "default" : "secondary"}>
                    {selectedBot.activo ? 'Activo' : 'Pausado'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                  <p className="text-sm">{selectedBot.userEmail || 'Sin usuario'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sesión</p>
                  <p className="text-sm">{selectedBot.sesionName || 'No asignada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creado</p>
                  <p className="text-sm">{new Date(selectedBot.fechaCreacion).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                <p className="text-sm">{selectedBot.descripcion}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Estadísticas</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Mensajes Procesados</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {selectedBot.estadisticas.mensajesProcesados.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Respuestas Enviadas</p>
                    <p className="text-xl font-semibold text-green-600">
                      {selectedBot.estadisticas.respuestasEnviadas.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Errores</p>
                    <p className="text-xl font-semibold text-red-600">
                      {selectedBot.estadisticas.errores}
                    </p>
                  </div>
                </div>
              </div>

              {selectedBot.configuracion && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Configuración</p>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedBot.configuracion, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar el chatbot {selectedBot?.nombreBot}?
              Esta acción no se puede deshacer y se perderán todas las configuraciones.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteChatbot}>
              Eliminar Chatbot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}