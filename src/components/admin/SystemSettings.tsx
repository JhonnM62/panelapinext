'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { 
  Settings,
  Save,
  RefreshCw,
  Globe,
  Shield,
  Bell,
  Zap,
  Database,
  Activity,
  Server,
  Lock,
  Wifi,
  Clock,
  AlertTriangle,
  Info,
  Download,
  Upload
} from 'lucide-react'

interface SystemSettingsProps {
  token: string
  baseUrl: string
}

export default function SystemSettings({ token, baseUrl }: SystemSettingsProps) {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    // API Settings
    api: {
      baseUrl: baseUrl,
      timeout: 30000,
      retryAttempts: 3,
      rateLimitEnabled: true,
      rateLimitRequests: 100,
      rateLimitWindow: 60,
      corsEnabled: true
    },
    // Session Settings
    sessions: {
      maxSessions: 10,
      sessionTimeout: 300,
      autoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      qrRefreshInterval: 30,
      cleanupInactiveSessions: true,
      inactivityThreshold: 1800
    },
    // Webhook Settings
    webhooks: {
      enabled: true,
      retryEnabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      timeoutDuration: 10000,
      verifySSL: true,
      batchingEnabled: false,
      batchSize: 10
    },
    // Notification Settings
    notifications: {
      enabled: true,
      emailNotifications: false,
      discordWebhook: '',
      slackWebhook: '',
      errorRateThreshold: 5,
      responseTimeThreshold: 5000
    },
    // Security Settings
    security: {
      requireHttps: false,
      tokenExpiration: 86400,
      maxLoginAttempts: 5,
      lockoutDuration: 900,
      enableAuditLog: true,
      twoFactorAuth: false
    },
    // Performance Settings
    performance: {
      enableCaching: true,
      cacheExpiration: 3600,
      enableCompression: true,
      maxConcurrentRequests: 50,
      messageQueueSize: 1000,
      healthCheckInterval: 30
    }
  })

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Simular guardado - en producción esto llamaría a la API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Configuración guardada",
        description: "Los cambios han sido aplicados exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setSettings({
      api: {
        baseUrl: baseUrl,
        timeout: 30000,
        retryAttempts: 3,
        rateLimitEnabled: true,
        rateLimitRequests: 100,
        rateLimitWindow: 60,
        corsEnabled: true
      },
      sessions: {
        maxSessions: 10,
        sessionTimeout: 300,
        autoReconnect: true,
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        qrRefreshInterval: 30,
        cleanupInactiveSessions: true,
        inactivityThreshold: 1800
      },
      webhooks: {
        enabled: true,
        retryEnabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        timeoutDuration: 10000,
        verifySSL: true,
        batchingEnabled: false,
        batchSize: 10
      },
      notifications: {
        enabled: true,
        emailNotifications: false,
        discordWebhook: '',
        slackWebhook: '',
        errorRateThreshold: 5,
        responseTimeThreshold: 5000
      },
      security: {
        requireHttps: false,
        tokenExpiration: 86400,
        maxLoginAttempts: 5,
        lockoutDuration: 900,
        enableAuditLog: true,
        twoFactorAuth: false
      },
      performance: {
        enableCaching: true,
        cacheExpiration: 3600,
        enableCompression: true,
        maxConcurrentRequests: 50,
        messageQueueSize: 1000,
        healthCheckInterval: 30
      }
    })
    
    toast({
      title: "Configuración restaurada",
      description: "Se han restaurado los valores por defecto",
    })
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `system-settings-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast({
      title: "Configuración exportada",
      description: "El archivo de configuración ha sido descargado",
    })
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string)
        setSettings(importedSettings)
        toast({
          title: "Configuración importada",
          description: "Los ajustes han sido cargados exitosamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo importar el archivo de configuración",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuración del Sistema
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configuraciones avanzadas para optimizar el rendimiento y seguridad del sistema
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Label htmlFor="import-settings" className="cursor-pointer">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Input
              id="import-settings"
              type="file"
              accept=".json"
              className="hidden"
              onChange={importSettings}
            />
          </Label>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configuración de API
          </CardTitle>
          <CardDescription>
            Ajustes relacionados con la API de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">URL Base de la API</Label>
              <Input
                id="baseUrl"
                value={settings.api.baseUrl}
                onChange={(e) => setSettings({
                  ...settings,
                  api: { ...settings.api, baseUrl: e.target.value }
                })}
                placeholder="http://100.42.185.2:8015"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={settings.api.timeout}
                onChange={(e) => setSettings({
                  ...settings,
                  api: { ...settings.api, timeout: parseInt(e.target.value) }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retryAttempts">Intentos de Reintento</Label>
              <Input
                id="retryAttempts"
                type="number"
                value={settings.api.retryAttempts}
                onChange={(e) => setSettings({
                  ...settings,
                  api: { ...settings.api, retryAttempts: parseInt(e.target.value) }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Rate Limiting</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.api.rateLimitEnabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    api: { ...settings.api, rateLimitEnabled: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Gestión de Sesiones
          </CardTitle>
          <CardDescription>
            Configuraciones para el manejo de sesiones de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Máximo de Sesiones: {settings.sessions.maxSessions}</Label>
              <Slider
                value={[settings.sessions.maxSessions]}
                onValueChange={(value) => setSettings({
                  ...settings,
                  sessions: { ...settings.sessions, maxSessions: value[0] }
                })}
                max={50}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Timeout de Sesión (segundos): {settings.sessions.sessionTimeout}</Label>
              <Slider
                value={[settings.sessions.sessionTimeout]}
                onValueChange={(value) => setSettings({
                  ...settings,
                  sessions: { ...settings.sessions, sessionTimeout: value[0] }
                })}
                max={600}
                step={10}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Auto-reconexión</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.sessions.autoReconnect}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    sessions: { ...settings.sessions, autoReconnect: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Limpiar Sesiones Inactivas</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.sessions.cleanupInactiveSessions}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    sessions: { ...settings.sessions, cleanupInactiveSessions: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuración de Seguridad
          </CardTitle>
          <CardDescription>
            Ajustes de seguridad y autenticación del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Requerir HTTPS</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.security.requireHttps}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: { ...settings.security, requireHttps: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Autenticación de Dos Factores</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: { ...settings.security, twoFactorAuth: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Expiración de Token (segundos)</Label>
              <Input
                type="number"
                value={settings.security.tokenExpiration}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, tokenExpiration: parseInt(e.target.value) }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Máx. Intentos de Login</Label>
              <Input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Log de Auditoría</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.security.enableAuditLog}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: { ...settings.security, enableAuditLog: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Duración de Bloqueo (segundos)</Label>
              <Input
                type="number"
                value={settings.security.lockoutDuration}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, lockoutDuration: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Optimización de Rendimiento
          </CardTitle>
          <CardDescription>
            Configuraciones para optimizar el rendimiento del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Cache Habilitado</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.performance.enableCaching}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    performance: { ...settings.performance, enableCaching: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Compresión Habilitada</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.performance.enableCompression}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    performance: { ...settings.performance, enableCompression: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Expiración de Cache (segundos)</Label>
              <Input
                type="number"
                value={settings.performance.cacheExpiration}
                onChange={(e) => setSettings({
                  ...settings,
                  performance: { ...settings.performance, cacheExpiration: parseInt(e.target.value) }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Máx. Requests Concurrentes</Label>
              <Input
                type="number"
                value={settings.performance.maxConcurrentRequests}
                onChange={(e) => setSettings({
                  ...settings,
                  performance: { ...settings.performance, maxConcurrentRequests: parseInt(e.target.value) }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tamaño de Cola de Mensajes</Label>
              <Input
                type="number"
                value={settings.performance.messageQueueSize}
                onChange={(e) => setSettings({
                  ...settings,
                  performance: { ...settings.performance, messageQueueSize: parseInt(e.target.value) }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Intervalo Health Check (segundos)</Label>
              <Input
                type="number"
                value={settings.performance.healthCheckInterval}
                onChange={(e) => setSettings({
                  ...settings,
                  performance: { ...settings.performance, healthCheckInterval: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Sistema de Notificaciones
          </CardTitle>
          <CardDescription>
            Configuraciones para alertas y notificaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Notificaciones Habilitadas</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, enabled: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Notificaciones por Email</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailNotifications: checked }
                  })}
                />
                <span className="text-sm">Habilitado</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Discord Webhook URL</Label>
              <Input
                value={settings.notifications.discordWebhook}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, discordWebhook: e.target.value }
                })}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Slack Webhook URL</Label>
              <Input
                value={settings.notifications.slackWebhook}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, slackWebhook: e.target.value }
                })}
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Umbrales de Alerta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tasa de Error (%): {settings.notifications.errorRateThreshold}</Label>
                <Slider
                  value={[settings.notifications.errorRateThreshold]}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, errorRateThreshold: value[0] }
                  })}
                  max={100}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tiempo de Respuesta (ms): {settings.notifications.responseTimeThreshold}</Label>
                <Slider
                  value={[settings.notifications.responseTimeThreshold]}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, responseTimeThreshold: value[0] }
                  })}
                  max={10000}
                  step={100}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                Información del Sistema
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• API Backend: {baseUrl}</p>
                <p>• Versión del Sistema: 2.3.0</p>
                <p>• Última Actualización: {new Date().toLocaleDateString()}</p>
                <p>• Estado: Operativo</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Notice */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Advertencia
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Los cambios en estas configuraciones pueden afectar el rendimiento y la estabilidad del sistema.
                Se recomienda hacer respaldo de la configuración antes de realizar cambios importantes.
                Algunos cambios pueden requerir reiniciar el servidor para aplicarse completamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}