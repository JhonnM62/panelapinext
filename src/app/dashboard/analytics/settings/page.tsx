'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Bell, 
  BarChart3, 
  Zap, 
  AlertTriangle, 
  Save,
  RefreshCw,
  Clock,
  Database,
  Smartphone,
  Activity
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface AnalyticsSettings {
  // Configuración de actualización
  autoRefresh: boolean
  refreshInterval: number // en segundos
  realTimeUpdates: boolean
  
  // Configuración de alertas
  enableAlerts: boolean
  memoryThreshold: number // porcentaje
  errorRateThreshold: number // errores por minuto
  responseTimeThreshold: number // milisegundos
  sessionDisconnectAlert: boolean
  
  // Configuración de notificaciones
  emailNotifications: boolean
  webhookNotifications: boolean
  notificationWebhookUrl: string
  
  // Configuración de métricas
  retentionDays: number
  detailedLogging: boolean
  performanceTracking: boolean
  
  // Configuración de visualización
  theme: 'light' | 'dark' | 'auto'
  chartAnimations: boolean
  compactView: boolean
  showPredictions: boolean
}

const defaultSettings: AnalyticsSettings = {
  autoRefresh: true,
  refreshInterval: 30,
  realTimeUpdates: true,
  enableAlerts: true,
  memoryThreshold: 80,
  errorRateThreshold: 10,
  responseTimeThreshold: 2000,
  sessionDisconnectAlert: true,
  emailNotifications: false,
  webhookNotifications: false,
  notificationWebhookUrl: '',
  retentionDays: 30,
  detailedLogging: true,
  performanceTracking: true,
  theme: 'auto',
  chartAnimations: true,
  compactView: false,
  showPredictions: true
}

export default function AnalyticsSettingsPage() {
  const [settings, setSettings] = useState<AnalyticsSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Cargar configuración desde localStorage o API
      const savedSettings = localStorage.getItem('analytics-settings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Guardar configuración en localStorage y/o API
      localStorage.setItem('analytics-settings', JSON.stringify(settings))
      
      // Aquí podrías también enviar la configuración a tu API
      // await api.post('/analytics/settings', settings)
      
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han aplicado correctamente",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    toast({
      title: "Configuración restablecida",
      description: "Se han restaurado los valores por defecto",
    })
  }

  const testAlert = () => {
    toast({
      title: "🚨 Alerta de prueba",
      description: "Esta es una alerta de prueba del sistema de analytics",
    })
  }

  const updateSetting = <K extends keyof AnalyticsSettings>(
    key: K, 
    value: AnalyticsSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando configuración...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Configuración de Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Personaliza las métricas, alertas y visualizaciones del sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={testAlert}>
            <Bell className="h-4 w-4 mr-2" />
            Probar Alerta
          </Button>
          
          <Button variant="outline" onClick={resetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restablecer
          </Button>
          
          <Button onClick={saveSettings} disabled={saving}>
            <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="display">Visualización</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuración de Actualización */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Actualización de Datos
                </CardTitle>
                <CardDescription>
                  Configura la frecuencia de actualización de métricas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-refresh">Actualización automática</Label>
                  <Switch
                    id="auto-refresh"
                    checked={settings.autoRefresh}
                    onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Intervalo (segundos)</Label>
                  <Select
                    value={settings.refreshInterval.toString()}
                    onValueChange={(value) => updateSetting('refreshInterval', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 segundos</SelectItem>
                      <SelectItem value="30">30 segundos</SelectItem>
                      <SelectItem value="60">1 minuto</SelectItem>
                      <SelectItem value="300">5 minutos</SelectItem>
                      <SelectItem value="600">10 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="realtime">Actualizaciones en tiempo real</Label>
                  <Switch
                    id="realtime"
                    checked={settings.realTimeUpdates}
                    onCheckedChange={(checked) => updateSetting('realTimeUpdates', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Retención */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Retención de Datos
                </CardTitle>
                <CardDescription>
                  Configura cuánto tiempo mantener los datos históricos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="retention">Días de retención</Label>
                  <Select
                    value={settings.retentionDays.toString()}
                    onValueChange={(value) => updateSetting('retentionDays', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="90">90 días</SelectItem>
                      <SelectItem value="365">1 año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="detailed-logging">Logging detallado</Label>
                  <Switch
                    id="detailed-logging"
                    checked={settings.detailedLogging}
                    onCheckedChange={(checked) => updateSetting('detailedLogging', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="performance-tracking">Tracking de rendimiento</Label>
                  <Switch
                    id="performance-tracking"
                    checked={settings.performanceTracking}
                    onCheckedChange={(checked) => updateSetting('performanceTracking', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Configuración de Alertas
              </CardTitle>
              <CardDescription>
                Define umbrales para alertas automáticas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-alerts">Habilitar alertas</Label>
                <Switch
                  id="enable-alerts"
                  checked={settings.enableAlerts}
                  onCheckedChange={(checked) => updateSetting('enableAlerts', checked)}
                />
              </div>

              {settings.enableAlerts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="memory-threshold">Umbral de memoria (%)</Label>
                      <Input
                        id="memory-threshold"
                        type="number"
                        min="0"
                        max="100"
                        value={settings.memoryThreshold}
                        onChange={(e) => updateSetting('memoryThreshold', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Alerta cuando el uso de memoria supere este porcentaje
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="error-rate">Umbral de errores (por minuto)</Label>
                      <Input
                        id="error-rate"
                        type="number"
                        min="0"
                        value={settings.errorRateThreshold}
                        onChange={(e) => updateSetting('errorRateThreshold', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Alerta cuando se supere este número de errores por minuto
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="response-time">Umbral tiempo respuesta (ms)</Label>
                      <Input
                        id="response-time"
                        type="number"
                        min="0"
                        value={settings.responseTimeThreshold}
                        onChange={(e) => updateSetting('responseTimeThreshold', parseInt(e.target.value))}
                      />
                      <p className="text-sm text-muted-foreground">
                        Alerta cuando el tiempo de respuesta supere este valor
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="session-disconnect">Alertas de desconexión</Label>
                      <Switch
                        id="session-disconnect"
                        checked={settings.sessionDisconnectAlert}
                        onCheckedChange={(checked) => updateSetting('sessionDisconnectAlert', checked)}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Preview de alertas */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-3">Vista previa de alertas activas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Badge variant="secondary" className="justify-start">
                    <Activity className="h-3 w-3 mr-2" />
                    Memoria > {settings.memoryThreshold}%
                  </Badge>
                  <Badge variant="secondary" className="justify-start">
                    <AlertTriangle className="h-3 w-3 mr-2" />
                    Errores > {settings.errorRateThreshold}/min
                  </Badge>
                  <Badge variant="secondary" className="justify-start">
                    <Clock className="h-3 w-3 mr-2" />
                    Respuesta > {settings.responseTimeThreshold}ms
                  </Badge>
                  {settings.sessionDisconnectAlert && (
                    <Badge variant="secondary" className="justify-start">
                      <Smartphone className="h-3 w-3 mr-2" />
                      Desconexión de sesiones
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Configuración de Notificaciones
              </CardTitle>
              <CardDescription>
                Configura cómo y dónde recibir notificaciones de alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Notificaciones por email</Label>
                    <Switch
                      id="email-notifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="webhook-notifications">Notificaciones por webhook</Label>
                    <Switch
                      id="webhook-notifications"
                      checked={settings.webhookNotifications}
                      onCheckedChange={(checked) => updateSetting('webhookNotifications', checked)}
                    />
                  </div>
                </div>
                
                {settings.webhookNotifications && (
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">URL del webhook</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      placeholder="https://tu-servidor.com/webhook"
                      value={settings.notificationWebhookUrl}
                      onChange={(e) => updateSetting('notificationWebhookUrl', e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Las alertas se enviarán como POST a esta URL
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Configuración de Rendimiento
              </CardTitle>
              <CardDescription>
                Optimiza el rendimiento del dashboard de analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Modo de rendimiento</Label>
                <Select
                  value={settings.compactView ? 'compact' : 'full'}
                  onValueChange={(value) => updateSetting('compactView', value === 'compact')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Completo (todos los gráficos)</SelectItem>
                    <SelectItem value="compact">Compacto (gráficos esenciales)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="chart-animations">Animaciones de gráficos</Label>
                <Switch
                  id="chart-animations"
                  checked={settings.chartAnimations}
                  onCheckedChange={(checked) => updateSetting('chartAnimations', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="predictions">Mostrar predicciones</Label>
                <Switch
                  id="predictions"
                  checked={settings.showPredictions}
                  onCheckedChange={(checked) => updateSetting('showPredictions', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Configuración de Visualización
              </CardTitle>
              <CardDescription>
                Personaliza la apariencia y el tema del dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: 'light' | 'dark' | 'auto') => updateSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}