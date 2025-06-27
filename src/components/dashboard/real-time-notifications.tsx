'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Zap,
  Clock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface Notification {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'system' | 'session' | 'webhook' | 'message' | 'security'
  actionable?: boolean
  actions?: {
    label: string
    action: () => void
  }[]
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'error',
    title: 'Sesión Desconectada',
    message: 'La sesión "Bot Principal" se ha desconectado inesperadamente',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    read: false,
    priority: 'high',
    category: 'session',
    actionable: true,
    actions: [
      { label: 'Reconectar', action: () => console.log('Reconnecting...') },
      { label: 'Ver Detalles', action: () => console.log('View details...') }
    ]
  },
  {
    id: '2',
    type: 'warning',
    title: 'Uso de Memoria Alto',
    message: 'El uso de memoria ha superado el 85%. Se recomienda reiniciar el sistema.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    read: false,
    priority: 'medium',
    category: 'system',
    actionable: true,
    actions: [
      { label: 'Limpiar Cache', action: () => console.log('Clearing cache...') }
    ]
  },
  {
    id: '3',
    type: 'success',
    title: 'Backup Completado',
    message: 'El backup automático se ha completado exitosamente',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    read: true,
    priority: 'low',
    category: 'system'
  },
  {
    id: '4',
    type: 'info',
    title: 'Nueva Actualización',
    message: 'Hay una nueva versión disponible (v2.4.0)',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    read: false,
    priority: 'medium',
    category: 'system',
    actionable: true,
    actions: [
      { label: 'Ver Changelog', action: () => console.log('View changelog...') },
      { label: 'Instalar', action: () => console.log('Installing...') }
    ]
  }
]

interface RealTimeNotificationsProps {
  className?: string
  compact?: boolean
}

export function RealTimeNotifications({ className = '', compact = false }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showRead, setShowRead] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length
  const visibleNotifications = showRead ? notifications : notifications.filter(n => !n.read)

  // Simular notificaciones en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Generar notificación aleatoria cada 30 segundos
      if (Math.random() < 0.3) {
        addRandomNotification()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const addRandomNotification = () => {
    const randomNotifications = [
      {
        type: 'info' as const,
        title: 'Mensaje Enviado',
        message: 'Se ha enviado un mensaje a +57300123456',
        category: 'message' as const,
        priority: 'low' as const
      },
      {
        type: 'warning' as const,
        title: 'Webhook Timeout',
        message: 'El webhook tardó más de 5 segundos en responder',
        category: 'webhook' as const,
        priority: 'medium' as const
      },
      {
        type: 'success' as const,
        title: 'Sesión Conectada',
        message: 'Nueva sesión WhatsApp conectada exitosamente',
        category: 'session' as const,
        priority: 'low' as const
      }
    ]

    const randomNotif = randomNotifications[Math.floor(Math.random() * randomNotifications.length)]
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...randomNotif
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Mantener solo 50 notificaciones

    // Reproducir sonido si está habilitado
    if (soundEnabled && (newNotification.priority === 'high' || newNotification.priority === 'critical')) {
      // En una app real, aquí reproducirías un sonido
      console.log('🔔 Sound notification')
    }

    // Mostrar toast para notificaciones importantes
    if (newNotification.priority === 'high' || newNotification.priority === 'critical') {
      toast({
        title: newNotification.title,
        description: newNotification.message,
        variant: newNotification.type === 'error' ? 'destructive' : 'default'
      })
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      case 'high':
        return 'bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
      case 'medium':
        return 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
      case 'low':
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Hace un momento'
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`
    return date.toLocaleDateString()
  }

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {isOpen && (
          <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Notificaciones</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                {visibleNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No hay notificaciones
                  </div>
                ) : (
                  <div className="space-y-1">
                    {visibleNotifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-l-4 ${
                          notification.read ? 'opacity-60' : ''
                        } ${getPriorityColor(notification.priority)} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-2">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium">{notification.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {visibleNotifications.length > 0 && (
                <div className="p-3 border-t">
                  <Button variant="outline" size="sm" onClick={markAllAsRead} className="w-full">
                    Marcar todas como leídas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notificaciones en Tiempo Real</CardTitle>
            {unreadCount > 0 && (
              <Badge>{unreadCount} nuevas</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRead(!showRead)}
            >
              {showRead ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Marcar todas
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={clearAll}>
              Limpiar
            </Button>
          </div>
        </div>
        <CardDescription>
          Alertas y eventos del sistema en tiempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visibleNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    notification.read ? 'opacity-60' : ''
                  } ${getPriorityColor(notification.priority)} transition-opacity`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {notification.category}
                        </Badge>
                        <Badge 
                          variant={notification.priority === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {notification.actionable && notification.actions && (
                            <div className="flex gap-1">
                              {notification.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={action.action}
                                  className="text-xs h-6 px-2"
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                          
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default RealTimeNotifications