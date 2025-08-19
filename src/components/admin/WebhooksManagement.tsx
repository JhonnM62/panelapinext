'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { 
  Webhook,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Link,
  Activity,
  Settings,
  Copy,
  ExternalLink
} from 'lucide-react'

interface WebhookData {
  _id: string
  sessionId: string
  sessionName: string
  lineaWhatsApp: string
  url: string
  userId: string
  userEmail: string
  activo: boolean
  fechaCreacion: string
}

interface WebhooksManagementProps {
  token: string
  baseUrl: string
}

export default function WebhooksManagement({ token, baseUrl }: WebhooksManagementProps) {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/webhooks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setWebhooks(data.data)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los webhooks",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateWebhook = async () => {
    if (!selectedWebhook) return
    
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/webhooks/${selectedWebhook.sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: webhookUrl,
          activo: selectedWebhook.activo
        })
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Webhook actualizado exitosamente"
        })
        setIsEditDialogOpen(false)
        loadWebhooks()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el webhook",
        variant: "destructive"
      })
    }
  }

  const toggleWebhook = async (sessionId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/webhooks/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activo: !currentStatus
        })
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Webhook ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`
        })
        loadWebhooks()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del webhook",
        variant: "destructive"
      })
    }
  }

  const deleteWebhook = async () => {
    if (!selectedWebhook) return
    
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/webhooks/${selectedWebhook.sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Webhook eliminado exitosamente"
        })
        setIsDeleteDialogOpen(false)
        loadWebhooks()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el webhook",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "URL copiada al portapapeles"
    })
  }

  const filteredWebhooks = webhooks.filter(webhook => 
    webhook.sessionName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webhook.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webhook.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webhook.lineaWhatsApp?.includes(searchQuery)
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Cargando webhooks...</p>
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
                  <Webhook className="h-5 w-5" />
                  Gestión de Webhooks
                </CardTitle>
                <CardDescription>
                  Administra todos los webhooks configurados en el sistema
                </CardDescription>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar webhooks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={loadWebhooks} variant="outline">
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
                    <p className="text-sm font-medium text-muted-foreground">Total Webhooks</p>
                    <p className="text-2xl font-bold">{webhooks.length}</p>
                  </div>
                  <Webhook className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Activos</p>
                    <p className="text-2xl font-bold">{webhooks.filter(w => w.activo).length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inactivos</p>
                    <p className="text-2xl font-bold">{webhooks.filter(w => !w.activo).length}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Usuarios Únicos</p>
                    <p className="text-2xl font-bold">
                      {new Set(webhooks.map(w => w.userId)).size}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de webhooks */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Sesión</TableHead>
                    <TableHead className="min-w-[150px]">Usuario</TableHead>
                    <TableHead className="min-w-[120px]">WhatsApp</TableHead>
                    <TableHead className="min-w-[250px]">URL Webhook</TableHead>
                    <TableHead className="min-w-[80px]">Estado</TableHead>
                    <TableHead className="min-w-[120px]">Creado</TableHead>
                    <TableHead className="min-w-[150px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWebhooks.map((webhook) => (
                    <TableRow key={webhook._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{webhook.sessionName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{webhook.userEmail || 'Sin usuario'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {webhook.lineaWhatsApp || 'No configurado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <p className="text-sm truncate max-w-[200px]" title={webhook.url}>
                            {webhook.url}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(webhook.url)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(webhook.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={webhook.activo ? "default" : "secondary"}
                          className={webhook.activo ? "bg-green-100 text-green-800" : ""}
                        >
                          {webhook.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(webhook.fechaCreacion).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedWebhook(webhook)
                              setWebhookUrl(webhook.url)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={webhook.activo ? "outline" : "default"}
                            className="h-8 w-8 p-0"
                            onClick={() => toggleWebhook(webhook.sessionId, webhook.activo)}
                          >
                            {webhook.activo ? (
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
                              setSelectedWebhook(webhook)
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
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Link className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Acerca de los Webhooks
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Los webhooks permiten recibir notificaciones en tiempo real cuando ocurren eventos en WhatsApp.
                  Cada webhook está asociado a una sesión específica y envía datos a la URL configurada.
                  Asegúrese de que las URLs sean accesibles públicamente y puedan manejar solicitudes POST.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Webhook</DialogTitle>
            <DialogDescription>
              Modifique la configuración del webhook para la sesión {selectedWebhook?.sessionName}
            </DialogDescription>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL del Webhook</Label>
                <Input
                  id="url"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://ejemplo.com/webhook"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedWebhook.activo}
                  onCheckedChange={(checked) => setSelectedWebhook({ ...selectedWebhook, activo: checked })}
                />
                <Label>Webhook Activo</Label>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sesión</p>
                  <p className="text-sm">{selectedWebhook.sessionName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                  <p className="text-sm">{selectedWebhook.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Línea WhatsApp</p>
                  <p className="text-sm">{selectedWebhook.lineaWhatsApp || 'No configurado'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Creado</p>
                  <p className="text-sm">{new Date(selectedWebhook.fechaCreacion).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateWebhook}>
              Guardar Cambios
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
              ¿Está seguro que desea eliminar el webhook de la sesión {selectedWebhook?.sessionName}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteWebhook}>
              Eliminar Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}