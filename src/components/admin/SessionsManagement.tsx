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
  Smartphone, 
  Search, 
  RefreshCw, 
  Eye,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Wifi,
  WifiOff,
  Activity,
  CheckCircle,
  XCircle,
  Webhook
} from 'lucide-react'

interface Session {
  _id: string
  nombresesion: string
  lineaWhatsApp: string
  userId: string
  userEmail: string
  estadoSesion: string
  webhookCreado: boolean
  webhookUrl?: string
  webhookActivo: boolean
  fechaCreacion: string
  fechaUltimaConexion?: string
  activa: boolean
  tipoAuth: string
  estadisticas: {
    mensajesEnviados: number
    mensajesRecibidos: number
    tiempoConectado: number
  }
}

interface SessionsManagementProps {
  token: string
  baseUrl: string
}

export default function SessionsManagement({ token, baseUrl }: SessionsManagementProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSessions(data.data)
        }
      } else {
        throw new Error('Error loading sessions')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las sesiones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const restartSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/v2/sesiones/${sessionId}/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Sesión reiniciada exitosamente"
        })
        loadSessions()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reiniciar la sesión",
        variant: "destructive"
      })
    }
  }

  const deleteSession = async () => {
    if (!selectedSession) return
    
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/sessions/${selectedSession._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Sesión eliminada exitosamente"
        })
        setIsDeleteDialogOpen(false)
        loadSessions()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la sesión",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'conectado':
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'conectando':
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800'
      case 'desconectado':
      case 'disconnected':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredSessions = sessions.filter(session => 
    session.nombresesion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lineaWhatsApp?.includes(searchQuery)
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Cargando sesiones...</p>
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
                  <Smartphone className="h-5 w-5" />
                  Gestión de Sesiones
                </CardTitle>
                <CardDescription>
                  Administra todas las sesiones de WhatsApp del sistema
                </CardDescription>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar sesiones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={loadSessions} variant="outline">
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
                    <p className="text-sm font-medium text-muted-foreground">Total Sesiones</p>
                    <p className="text-2xl font-bold">{sessions.length}</p>
                  </div>
                  <Smartphone className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conectadas</p>
                    <p className="text-2xl font-bold">
                      {sessions.filter(s => s.estadoSesion === 'conectado' || s.estadoSesion === 'connected').length}
                    </p>
                  </div>
                  <Wifi className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Con Webhook</p>
                    <p className="text-2xl font-bold">{sessions.filter(s => s.webhookCreado).length}</p>
                  </div>
                  <Webhook className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Errores</p>
                    <p className="text-2xl font-bold">{sessions.filter(s => s.estadoSesion === 'error').length}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de sesiones */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Sesión</TableHead>
                    <TableHead className="min-w-[150px]">Usuario</TableHead>
                    <TableHead className="min-w-[120px]">Línea WhatsApp</TableHead>
                    <TableHead className="min-w-[100px]">Estado</TableHead>
                    <TableHead className="min-w-[100px]">Webhook</TableHead>
                    <TableHead className="min-w-[120px]">Última Conexión</TableHead>
                    <TableHead className="min-w-[150px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{session.nombresesion}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.fechaCreacion).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{session.userEmail || 'Sin usuario'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {session.lineaWhatsApp || 'No configurado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getStatusColor(session.estadoSesion)}`}>
                          {session.estadoSesion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {session.webhookCreado ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-xs">
                            {session.webhookCreado ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.fechaUltimaConexion 
                          ? new Date(session.fechaUltimaConexion).toLocaleDateString()
                          : 'Nunca'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedSession(session)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => restartSession(session._id)}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedSession(session)
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
        </CardContent>
      </Card>

      {/* Dialog de vista detallada */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Sesión</DialogTitle>
            <DialogDescription>
              Información completa de la sesión seleccionada
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-sm">{selectedSession.nombresesion}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge className={`text-xs ${getStatusColor(selectedSession.estadoSesion)}`}>
                    {selectedSession.estadoSesion}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                  <p className="text-sm">{selectedSession.userEmail || 'Sin usuario'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Línea WhatsApp</p>
                  <p className="text-sm">{selectedSession.lineaWhatsApp || 'No configurado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo Auth</p>
                  <p className="text-sm">{selectedSession.tipoAuth}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Webhook</p>
                  <p className="text-sm">
                    {selectedSession.webhookCreado ? 'Configurado' : 'No configurado'}
                  </p>
                </div>
                {selectedSession.webhookUrl && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">URL Webhook</p>
                    <p className="text-sm break-all">{selectedSession.webhookUrl}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creada</p>
                  <p className="text-sm">
                    {new Date(selectedSession.fechaCreacion).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Conexión</p>
                  <p className="text-sm">
                    {selectedSession.fechaUltimaConexion 
                      ? new Date(selectedSession.fechaUltimaConexion).toLocaleString()
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Estadísticas</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Mensajes Enviados</p>
                    <p className="text-lg font-semibold">{selectedSession.estadisticas.mensajesEnviados}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mensajes Recibidos</p>
                    <p className="text-lg font-semibold">{selectedSession.estadisticas.mensajesRecibidos}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tiempo Conectado</p>
                    <p className="text-lg font-semibold">{selectedSession.estadisticas.tiempoConectado}h</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar la sesión {selectedSession?.nombresesion}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteSession}>
              Eliminar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}