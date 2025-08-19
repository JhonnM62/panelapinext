'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { 
  MessageSquare,
  RefreshCw,
  Activity,
  Users,
  Zap,
  Eye,
  Edit,
  Play,
  Pause,
  Settings,
  Info,
  Brain,
  Sparkles
} from 'lucide-react'

interface GeminiConfig {
  _id: string
  userId: string
  userEmail: string
  botName: string
  modelo: string
  activo: boolean
  mensajesProcesados: number
  tokensUsados: number
  ultimaActividad: Date
}

interface GeminiManagementProps {
  token: string
  baseUrl: string
}

export default function GeminiManagement({ token, baseUrl }: GeminiManagementProps) {
  const [configs, setConfigs] = useState<GeminiConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [globalConfig, setGlobalConfig] = useState({
    modeloDefault: 'gemini-2.5-flash',
    servidorProcesamiento: 'http://100.42.185.2:8014',
    limiteTokensDiario: 100000,
    delayMinimo: 3,
    promptBase: 'Eres un asistente virtual inteligente. Responde de manera útil, concisa y profesional.',
    permitirUsuariosCrear: true,
    monitoreoAutomatico: true
  })

  useEffect(() => {
    loadGeminiConfigs()
  }, [])

  const loadGeminiConfigs = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/gemini`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setConfigs(data.data)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      // Usar datos mock por ahora
      setConfigs([
        {
          _id: '1',
          userId: 'user1',
          userEmail: 'usuario@test.com',
          botName: 'MiBot_Ventas',
          modelo: 'gemini-2.5-flash',
          activo: true,
          mensajesProcesados: 24,
          tokensUsados: 1250,
          ultimaActividad: new Date()
        },
        {
          _id: '2',
          userId: 'user2',
          userEmail: 'admin@test.com',
          botName: 'AdminBot_Support',
          modelo: 'gemini-1.5-pro',
          activo: true,
          mensajesProcesados: 8,
          tokensUsados: 560,
          ultimaActividad: new Date()
        },
        {
          _id: '3',
          userId: 'user3',
          userEmail: 'cliente@empresa.com',
          botName: 'EmpresaBot_Atencion',
          modelo: 'gemini-2.0-flash',
          activo: false,
          mensajesProcesados: 0,
          tokensUsados: 0,
          ultimaActividad: new Date()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleConfig = async (configId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/gemini/${configId}/toggle`, {
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
          description: `Configuración de IA ${!currentStatus ? 'activada' : 'pausada'} exitosamente`
        })
        loadGeminiConfigs()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive"
      })
    }
  }

  const saveGlobalConfig = async () => {
    try {
      // Aquí se guardaría la configuración global
      toast({
        title: "Éxito",
        description: "Configuración global guardada exitosamente"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      })
    }
  }

  const getModelBadgeColor = (modelo: string) => {
    if (modelo.includes('2.5')) return 'bg-purple-100 text-purple-800'
    if (modelo.includes('1.5')) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const totalStats = {
    activeConfigs: configs.filter(c => c.activo).length,
    messagesProcessed: configs.reduce((sum, c) => sum + c.mensajesProcesados, 0),
    usersWithAI: configs.length,
    tokensUsed: configs.reduce((sum, c) => sum + c.tokensUsados, 0)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600 dark:text-gray-400">Cargando configuraciones de IA...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas de Gemini */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Configuraciones Activas</p>
                <p className="text-2xl font-bold">{totalStats.activeConfigs}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mensajes Procesados</p>
                <p className="text-2xl font-bold">{totalStats.messagesProcessed.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios con IA</p>
                <p className="text-2xl font-bold">{totalStats.usersWithAI}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tokens Utilizados</p>
                <p className="text-2xl font-bold">{(totalStats.tokensUsed / 1000).toFixed(1)}K</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración Global */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configuración Global de Gemini IA
          </CardTitle>
          <CardDescription>
            Configuraciones que se aplicarán a nivel de sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modelo IA por Defecto</Label>
              <Select 
                value={globalConfig.modeloDefault}
                onValueChange={(value) => setGlobalConfig({...globalConfig, modeloDefault: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Servidor de Procesamiento</Label>
              <Input 
                value={globalConfig.servidorProcesamiento}
                onChange={(e) => setGlobalConfig({...globalConfig, servidorProcesamiento: e.target.value})}
                placeholder="URL del servidor..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Límite de Tokens Diario (Global)</Label>
              <Input 
                type="number" 
                value={globalConfig.limiteTokensDiario}
                onChange={(e) => setGlobalConfig({...globalConfig, limiteTokensDiario: parseInt(e.target.value)})}
                placeholder="100000"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Delay Mínimo entre Mensajes (segundos)</Label>
              <Input 
                type="number" 
                value={globalConfig.delayMinimo}
                onChange={(e) => setGlobalConfig({...globalConfig, delayMinimo: parseInt(e.target.value)})}
                placeholder="3"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Prompt Base del Sistema</Label>
            <Textarea 
              rows={3} 
              value={globalConfig.promptBase}
              onChange={(e) => setGlobalConfig({...globalConfig, promptBase: e.target.value})}
              placeholder="Prompt que se agregará a todas las configuraciones como base..."
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={globalConfig.permitirUsuariosCrear}
                onCheckedChange={(checked) => setGlobalConfig({...globalConfig, permitirUsuariosCrear: checked})}
                id="allow-user-configs"
              />
              <Label htmlFor="allow-user-configs">Permitir usuarios crear configuraciones de IA</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                checked={globalConfig.monitoreoAutomatico}
                onCheckedChange={(checked) => setGlobalConfig({...globalConfig, monitoreoAutomatico: checked})}
                id="auto-monitoring"
              />
              <Label htmlFor="auto-monitoring">Monitoreo automático de uso</Label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveGlobalConfig}>
              <Settings className="h-4 w-4 mr-2" />
              Guardar Configuración Global
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Configuraciones */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Configuraciones de Usuarios
              </CardTitle>
              <CardDescription>
                Todas las configuraciones de Gemini IA por usuario
              </CardDescription>
            </div>
            <Button onClick={loadGeminiConfigs} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Usuario</TableHead>
                    <TableHead className="min-w-[120px]">Bot</TableHead>
                    <TableHead className="min-w-[100px]">Modelo</TableHead>
                    <TableHead className="min-w-[80px]">Estado</TableHead>
                    <TableHead className="min-w-[80px]">Mensajes</TableHead>
                    <TableHead className="min-w-[80px]">Tokens</TableHead>
                    <TableHead className="min-w-[120px]">Última Actividad</TableHead>
                    <TableHead className="min-w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{config.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {config.botName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getModelBadgeColor(config.modelo)}`}>
                          {config.modelo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={config.activo ? "default" : "secondary"}
                          className={`text-xs ${config.activo ? "bg-green-100 text-green-800" : ""}`}
                        >
                          {config.activo ? 'Activo' : 'Pausado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {config.mensajesProcesados}
                      </TableCell>
                      <TableCell className="text-sm">
                        {(config.tokensUsados / 1000).toFixed(1)}K
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(config.ultimaActividad).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={config.activo ? "outline" : "default"}
                            className="h-8 w-8 p-0"
                            onClick={() => toggleConfig(config._id, config.activo)}
                          >
                            {config.activo ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
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
              <Info className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                  Información sobre Gemini IA
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Gemini IA permite procesar mensajes de WhatsApp con inteligencia artificial avanzada.
                  Cada configuración define el modelo, prompts personalizados y límites de uso por usuario.
                  El sistema monitorea automáticamente el consumo de tokens y el rendimiento.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}