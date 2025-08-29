'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { 
  User, 
  Crown, 
  Calendar, 
  Mail,
  Shield,
  CreditCard,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  Bell,
  Smartphone,
  Key,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { formatDate, getDaysRemaining } from '@/lib/utils'
import { useRouter } from 'next/navigation'

// Componente para gestionar API Keys
function APIKeyManager() {
  const [showToken, setShowToken] = useState(false)
  const { toast } = useToast()
  const { user } = useAuthStore()
  
  // Obtener el token real del usuario autenticado
  const userToken = user?.token || ''
  
  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(userToken)
      toast({
        title: 'Token copiado',
        description: 'El token de autenticación ha sido copiado al portapapeles',
      })
    } catch (error) {
      toast({
        title: 'Error al copiar',
        description: 'No se pudo copiar el token al portapapeles',
        variant: 'destructive'
      })
    }
  }

  const toggleTokenVisibility = () => {
    setShowToken(!showToken)
  }

  return (
    <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
      <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
        <code 
          className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md font-mono text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 flex-1 sm:flex-initial sm:max-w-48 lg:max-w-64 truncate"
          aria-label={showToken ? 'Token de autenticación visible' : 'Token de autenticación oculto'}
        >
          {showToken ? userToken : '•'.repeat(Math.min(userToken.length, 24))}
        </code>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTokenVisibility}
          className="h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
          title={showToken ? 'Ocultar token' : 'Mostrar token'}
        >
          {showToken ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToken}
          className="h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Copiar token al portapapeles"
          title="Copiar token"
          disabled={!userToken}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </Button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, isLoading } = useAuthStore()
  const { toast } = useToast()
  const router = useRouter()
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    sessionAlerts: true,
    webhookEvents: true,
    systemUpdates: false
  })

  if (!user) return null

  const daysRemaining = getDaysRemaining(user.fechaFin)
  const isExpired = daysRemaining <= 0
  const isExpiringSoon = daysRemaining <= 7

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Configuración
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Gestiona tu cuenta y configuraciones
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className={`grid w-full ${user.rol === 'admin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Cuenta
          </TabsTrigger>
          <TabsTrigger value="membership">
            <Crown className="h-4 w-4 mr-2" />
            Membresía
          </TabsTrigger>
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          {user.rol === 'admin' && (
            <TabsTrigger value="admin">
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información de la Cuenta
              </CardTitle>
              <CardDescription>
                Información básica de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Bot</Label>
                  <Input value={user.nombrebot} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Registro</Label>
                  <Input value={formatDate(user.fechaInicio)} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Estado de la Cuenta</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={isExpired ? 'destructive' : 'success'}>
                      {isExpired ? 'Expirada' : 'Activa'}
                    </Badge>
                    {user.role === 'admin' && (
                      <Badge variant="outline">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership" className="space-y-6">
          {/* Membership Status */}
          <Card className={`${
            isExpired ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
            isExpiringSoon ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
            'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${
                isExpired ? 'text-red-800 dark:text-red-200' :
                isExpiringSoon ? 'text-yellow-800 dark:text-yellow-200' :
                'text-green-800 dark:text-green-200'
              }`}>
                {isExpired ? (
                  <AlertCircle className="h-5 w-5 mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Estado de la Membresía
              </CardTitle>
              <CardDescription className={
                isExpired ? 'text-red-700 dark:text-red-300' :
                isExpiringSoon ? 'text-yellow-700 dark:text-yellow-300' :
                'text-green-700 dark:text-green-300'
              }>
                {isExpired 
                  ? 'Tu membresía ha expirado'
                  : isExpiringSoon 
                    ? `Tu membresía expira en ${daysRemaining} días`
                    : `Tu membresía está activa por ${daysRemaining} días más`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Fecha de Inicio</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(user.fechaInicio).split(',')[0]}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Fecha de Expiración</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(user.fechaFin).split(',')[0]}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Días Restantes</Label>
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-muted-foreground" />
                    <span className={`text-sm font-bold ${
                      isExpired ? 'text-red-600' :
                      isExpiringSoon ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {daysRemaining} días
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Actualizar Plan
              </CardTitle>
              <CardDescription>
                Mejora tu plan para acceder a más funciones y extender tu membresía
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">$7</div>
                  <div className="text-sm text-gray-600">Plan Mensual</div>
                  <div className="text-xs text-gray-500 mt-1">1 sesión</div>
                </div>
                <div className="text-center p-4 border rounded-lg border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                  <div className="text-2xl font-bold text-purple-600 mb-2">$100</div>
                  <div className="text-sm text-gray-600">Plan Vitalicio</div>
                  <div className="text-xs text-gray-500 mt-1">15 sesiones</div>
                  <Badge className="mt-2 bg-purple-100 text-purple-700 text-xs">
                    Más Popular
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">20%</div>
                  <div className="text-sm text-gray-600">Descuento</div>
                  <div className="text-xs text-gray-500 mt-1">Plan anual</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  ¿Por qué actualizar?
                </h4>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <p>• Más sesiones de WhatsApp (hasta 15 en plan vitalicio)</p>
                  <p>• Funciones premium y automatización avanzada</p>
                  <p>• Soporte prioritario 24/7</p>
                  <p>• Descuentos por pago anual o semestral</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Link href="/pricing" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Ver Todos los Planes
                  </Button>
                </Link>
                <Link href="/dashboard/upgrade" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Crown className="h-4 w-4 mr-2" />
                    Actualizar Ahora
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Configuraciones generales de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificaciones</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones sobre el estado de las sesiones
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Bell className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center">
                          <Bell className="h-5 w-5 mr-2" />
                          Configurar Notificaciones
                        </DialogTitle>
                        <DialogDescription>
                          Personaliza qué notificaciones deseas recibir y cómo recibirlas.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                Notificaciones por Email
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Recibir alertas importantes por correo electrónico
                              </p>
                            </div>
                            <Switch 
                              checked={notificationSettings.emailNotifications}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({...prev, emailNotifications: checked}))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium flex items-center">
                                <Smartphone className="h-4 w-4 mr-2" />
                                Notificaciones Push
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Notificaciones en tiempo real en el navegador
                              </p>
                            </div>
                            <Switch 
                              checked={notificationSettings.pushNotifications}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({...prev, pushNotifications: checked}))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">Alertas de Sesión</Label>
                              <p className="text-xs text-muted-foreground">
                                Notificar cuando las sesiones se conecten/desconecten
                              </p>
                            </div>
                            <Switch 
                              checked={notificationSettings.sessionAlerts}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({...prev, sessionAlerts: checked}))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">Eventos de Webhook</Label>
                              <p className="text-xs text-muted-foreground">
                                Notificar sobre actividad de webhooks
                              </p>
                            </div>
                            <Switch 
                              checked={notificationSettings.webhookEvents}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({...prev, webhookEvents: checked}))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">Actualizaciones del Sistema</Label>
                              <p className="text-xs text-muted-foreground">
                                Notificar sobre nuevas funciones y mantenimiento
                              </p>
                            </div>
                            <Switch 
                              checked={notificationSettings.systemUpdates}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({...prev, systemUpdates: checked}))
                              }
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <DialogTrigger asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogTrigger>
                          <Button onClick={() => {
                            toast({
                              title: "Configuración guardada",
                              description: "Tus preferencias de notificación han sido actualizadas."
                            })
                          }}>
                            Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Webhooks</Label>
                    <p className="text-sm text-muted-foreground">
                      Configurar webhooks para recibir eventos
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/dashboard/webhooks')}
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">API Keys</Label>
                    <p className="text-sm text-muted-foreground">
                      Gestionar claves de API para integración
                    </p>
                  </div>
                  <APIKeyManager />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
              <CardDescription>
                Acciones irreversibles - procede con precaución
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Eliminar Cuenta</Label>
                  <p className="text-sm text-muted-foreground">
                    Eliminar permanentemente tu cuenta y todos los datos
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Eliminar Cuenta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        {user.rol === 'admin' && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Panel de Administración
                </CardTitle>
                <CardDescription>
                  Configuraciones y herramientas exclusivas para administradores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                        <SettingsIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Configuraciones Avanzadas</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Panel administrativo completo</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                      Accede al panel administrativo para gestionar usuarios, sesiones, planes y configuraciones del sistema.
                    </p>
                    <Link href="/dashboard/settings/advanced">
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <Crown className="h-4 w-4 mr-2" />
                        Acceder al Panel
                      </Button>
                    </Link>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gestión de Usuarios</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Administrar cuentas de usuario</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                      Gestiona roles, planes, estados de membresias y permisos de los usuarios del sistema.
                    </p>
                    <Link href="/dashboard/settings/advanced?tab=users">
                      <Button variant="outline" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Gestionar Usuarios
                      </Button>
                    </Link>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                        <SettingsIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Configuración del Sistema</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Configuraciones globales</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                      Configura parámetros globales del sistema, APIs, seguridad y rendimiento.
                    </p>
                    <Link href="/dashboard/settings/advanced?tab=system">
                      <Button variant="outline" className="w-full">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Configurar Sistema
                      </Button>
                    </Link>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gemini IA</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Administración de IA</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                      Gestiona todas las configuraciones de Gemini IA y monitorea el uso del sistema.
                    </p>
                    <Link href="/dashboard/settings/advanced?tab=gemini">
                      <Button variant="outline" className="w-full">
                        <Crown className="h-4 w-4 mr-2" />
                        Administrar IA
                      </Button>
                    </Link>
                  </Card>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Acceso Administrativo</h4>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Estas funciones están disponibles solo para administradores. Los cambios realizados aquí afectan a todo el sistema y todos los usuarios.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
