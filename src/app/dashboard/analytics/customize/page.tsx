'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Users, 
  MessageSquare, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Settings,
  Grid3X3,
  LayoutGrid,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

interface WidgetConfig {
  id: string
  title: string
  type: 'metric' | 'chart' | 'list' | 'status'
  size: 'small' | 'medium' | 'large'
  position: { x: number; y: number }
  visible: boolean
  refreshInterval?: number
  dataSource: string
  config?: Record<string, any>
}

interface DashboardLayout {
  id: string
  name: string
  widgets: WidgetConfig[]
  isDefault: boolean
}

const availableWidgets = [
  {
    id: 'sessions-overview',
    title: 'Resumen de Sesiones',
    type: 'metric' as const,
    description: 'Total y estado de sesiones activas',
    icon: Users,
    defaultSize: 'medium' as const,
    dataSource: 'sessions'
  },
  {
    id: 'messages-chart',
    title: 'Gráfico de Mensajes',
    type: 'chart' as const,
    description: 'Tendencia de mensajes por hora',
    icon: MessageSquare,
    defaultSize: 'large' as const,
    dataSource: 'messages'
  },
  {
    id: 'system-health',
    title: 'Estado del Sistema',
    type: 'status' as const,
    description: 'Memoria, CPU y estado general',
    icon: Activity,
    defaultSize: 'medium' as const,
    dataSource: 'system'
  },
  {
    id: 'webhooks-status',
    title: 'Estado de Webhooks',
    type: 'metric' as const,
    description: 'Webhooks activos y notificaciones',
    icon: Zap,
    defaultSize: 'small' as const,
    dataSource: 'webhooks'
  },
  {
    id: 'recent-activity',
    title: 'Actividad Reciente',
    type: 'list' as const,
    description: 'Últimos eventos del sistema',
    icon: Clock,
    defaultSize: 'large' as const,
    dataSource: 'activity'
  },
  {
    id: 'response-time',
    title: 'Tiempo de Respuesta',
    type: 'chart' as const,
    description: 'Latencia promedio de la API',
    icon: TrendingUp,
    defaultSize: 'medium' as const,
    dataSource: 'performance'
  },
  {
    id: 'error-rate',
    title: 'Tasa de Errores',
    type: 'metric' as const,
    description: 'Errores por minuto y tipos',
    icon: AlertTriangle,
    defaultSize: 'small' as const,
    dataSource: 'errors'
  },
  {
    id: 'uptime-status',
    title: 'Tiempo de Actividad',
    type: 'status' as const,
    description: 'Uptime y disponibilidad',
    icon: CheckCircle,
    defaultSize: 'small' as const,
    dataSource: 'uptime'
  }
]

const defaultLayouts: DashboardLayout[] = [
  {
    id: 'default',
    name: 'Vista por Defecto',
    isDefault: true,
    widgets: [
      {
        id: 'sessions-overview',
        title: 'Resumen de Sesiones',
        type: 'metric',
        size: 'medium',
        position: { x: 0, y: 0 },
        visible: true,
        dataSource: 'sessions'
      },
      {
        id: 'messages-chart',
        title: 'Gráfico de Mensajes',
        type: 'chart',
        size: 'large',
        position: { x: 1, y: 0 },
        visible: true,
        dataSource: 'messages'
      },
      {
        id: 'system-health',
        title: 'Estado del Sistema',
        type: 'status',
        size: 'medium',
        position: { x: 0, y: 1 },
        visible: true,
        dataSource: 'system'
      }
    ]
  },
  {
    id: 'executive',
    name: 'Vista Ejecutiva',
    isDefault: false,
    widgets: [
      {
        id: 'sessions-overview',
        title: 'Sesiones Totales',
        type: 'metric',
        size: 'large',
        position: { x: 0, y: 0 },
        visible: true,
        dataSource: 'sessions'
      },
      {
        id: 'uptime-status',
        title: 'Disponibilidad',
        type: 'status',
        size: 'medium',
        position: { x: 1, y: 0 },
        visible: true,
        dataSource: 'uptime'
      }
    ]
  },
  {
    id: 'technical',
    name: 'Vista Técnica',
    isDefault: false,
    widgets: [
      {
        id: 'response-time',
        title: 'Latencia',
        type: 'chart',
        size: 'large',
        position: { x: 0, y: 0 },
        visible: true,
        dataSource: 'performance'
      },
      {
        id: 'error-rate',
        title: 'Errores',
        type: 'metric',
        size: 'medium',
        position: { x: 1, y: 0 },
        visible: true,
        dataSource: 'errors'
      },
      {
        id: 'system-health',
        title: 'Recursos',
        type: 'status',
        size: 'medium',
        position: { x: 0, y: 1 },
        visible: true,
        dataSource: 'system'
      }
    ]
  }
]

export default function DashboardCustomizerPage() {
  const [layouts, setLayouts] = useState<DashboardLayout[]>(defaultLayouts)
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>(defaultLayouts[0])
  const [editMode, setEditMode] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    loadLayouts()
  }, [])

  const loadLayouts = () => {
    const saved = localStorage.getItem('dashboard-layouts')
    if (saved) {
      try {
        const parsedLayouts = JSON.parse(saved)
        setLayouts(parsedLayouts)
        const defaultLayout = parsedLayouts.find((l: DashboardLayout) => l.isDefault) || parsedLayouts[0]
        setCurrentLayout(defaultLayout)
      } catch (error) {
        console.error('Error loading layouts:', error)
      }
    }
  }

  const saveLayouts = (newLayouts: DashboardLayout[]) => {
    localStorage.setItem('dashboard-layouts', JSON.stringify(newLayouts))
    setLayouts(newLayouts)
  }

  const updateCurrentLayout = (updatedLayout: DashboardLayout) => {
    const updatedLayouts = layouts.map(layout => 
      layout.id === updatedLayout.id ? updatedLayout : layout
    )
    saveLayouts(updatedLayouts)
    setCurrentLayout(updatedLayout)
  }

  const toggleWidget = (widgetId: string) => {
    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.map(widget =>
        widget.id === widgetId 
          ? { ...widget, visible: !widget.visible }
          : widget
      )
    }
    updateCurrentLayout(updatedLayout)
  }

  const addWidget = (widgetTemplate: typeof availableWidgets[0]) => {
    const newWidget: WidgetConfig = {
      id: `${widgetTemplate.id}-${Date.now()}`,
      title: widgetTemplate.title,
      type: widgetTemplate.type,
      size: widgetTemplate.defaultSize,
      position: { x: 0, y: currentLayout.widgets.length },
      visible: true,
      dataSource: widgetTemplate.dataSource
    }

    const updatedLayout = {
      ...currentLayout,
      widgets: [...currentLayout.widgets, newWidget]
    }
    updateCurrentLayout(updatedLayout)
  }

  const removeWidget = (widgetId: string) => {
    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.filter(widget => widget.id !== widgetId)
    }
    updateCurrentLayout(updatedLayout)
  }

  const changeWidgetSize = (widgetId: string, newSize: 'small' | 'medium' | 'large') => {
    const updatedLayout = {
      ...currentLayout,
      widgets: currentLayout.widgets.map(widget =>
        widget.id === widgetId 
          ? { ...widget, size: newSize }
          : widget
      )
    }
    updateCurrentLayout(updatedLayout)
  }

  const switchLayout = (layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId)
    if (layout) {
      setCurrentLayout(layout)
    }
  }

  const createNewLayout = () => {
    const newLayout: DashboardLayout = {
      id: `layout-${Date.now()}`,
      name: `Layout Personalizado ${layouts.length + 1}`,
      isDefault: false,
      widgets: []
    }
    
    const updatedLayouts = [...layouts, newLayout]
    saveLayouts(updatedLayouts)
    setCurrentLayout(newLayout)
  }

  const duplicateLayout = () => {
    const duplicated: DashboardLayout = {
      ...currentLayout,
      id: `layout-${Date.now()}`,
      name: `${currentLayout.name} (Copia)`,
      isDefault: false
    }
    
    const updatedLayouts = [...layouts, duplicated]
    saveLayouts(updatedLayouts)
    setCurrentLayout(duplicated)
  }

  const setAsDefault = () => {
    const updatedLayouts = layouts.map(layout => ({
      ...layout,
      isDefault: layout.id === currentLayout.id
    }))
    saveLayouts(updatedLayouts)
  }

  const getWidgetIcon = (widget: WidgetConfig) => {
    const template = availableWidgets.find(w => w.id.includes(widget.id.split('-')[0]))
    return template?.icon || BarChart3
  }

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return 'Pequeño'
      case 'medium': return 'Mediano'
      case 'large': return 'Grande'
      default: return 'Mediano'
    }
  }

  const getGridCols = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1'
      case 'medium': return 'col-span-2'
      case 'large': return 'col-span-3'
      default: return 'col-span-2'
    }
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Personalizar Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Configura tu dashboard con widgets personalizados
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant={previewMode ? 'default' : 'outline'} 
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? 'Salir Vista Previa' : 'Vista Previa'}
          </Button>
          
          <Button 
            variant={editMode ? 'default' : 'outline'} 
            onClick={() => setEditMode(!editMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {editMode ? 'Finalizar Edición' : 'Modo Edición'}
          </Button>
        </div>
      </div>

      {!previewMode && (
        <>
          {/* Layout Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LayoutGrid className="h-5 w-5 mr-2" />
                Layouts Disponibles
              </CardTitle>
              <CardDescription>
                Selecciona un layout predefinido o crea uno personalizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Select value={currentLayout.id} onValueChange={switchLayout}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {layouts.map((layout) => (
                      <SelectItem key={layout.id} value={layout.id}>
                        {layout.name} {layout.isDefault && '(Por defecto)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={createNewLayout}>
                  Nuevo Layout
                </Button>
                
                <Button variant="outline" onClick={duplicateLayout}>
                  Duplicar Actual
                </Button>
                
                {!currentLayout.isDefault && (
                  <Button variant="outline" onClick={setAsDefault}>
                    Establecer por Defecto
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                Layout actual: <strong>{currentLayout.name}</strong> • 
                {currentLayout.widgets.filter(w => w.visible).length} widgets visibles • 
                {currentLayout.isDefault && '✓ Layout por defecto'}
              </div>
            </CardContent>
          </Card>

          {/* Available Widgets */}
          {editMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Grid3X3 className="h-5 w-5 mr-2" />
                  Widgets Disponibles
                </CardTitle>
                <CardDescription>
                  Arrastra o haz clic para agregar widgets a tu dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {availableWidgets.map((widget) => {
                    const Icon = widget.icon
                    const isAdded = currentLayout.widgets.some(w => 
                      w.id.includes(widget.id) && w.visible
                    )
                    
                    return (
                      <Card 
                        key={widget.id} 
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          isAdded ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => !isAdded && addWidget(widget)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <h3 className="font-medium text-sm">{widget.title}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            {widget.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {getSizeLabel(widget.defaultSize)}
                            </Badge>
                            {isAdded && (
                              <Badge variant="default" className="text-xs">
                                Agregado
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Widgets Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configuración de Widgets
              </CardTitle>
              <CardDescription>
                Gestiona los widgets en tu layout actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentLayout.widgets.length === 0 ? (
                <div className="text-center py-8">
                  <Grid3X3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay widgets en este layout</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setEditMode(true)}
                  >
                    Agregar Widget
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentLayout.widgets.map((widget) => {
                    const Icon = getWidgetIcon(widget)
                    
                    return (
                      <div key={widget.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-medium">{widget.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Tipo: {widget.type} • Tamaño: {getSizeLabel(widget.size)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={widget.visible}
                              onCheckedChange={() => toggleWidget(widget.id)}
                            />
                            <Label className="text-sm">Visible</Label>
                          </div>
                          
                          <Select 
                            value={widget.size} 
                            onValueChange={(size: 'small' | 'medium' | 'large') => 
                              changeWidgetSize(widget.id, size)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Pequeño</SelectItem>
                              <SelectItem value="medium">Mediano</SelectItem>
                              <SelectItem value="large">Grande</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeWidget(widget.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dashboard Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Vista Previa del Dashboard
          </CardTitle>
          <CardDescription>
            Así se verá tu dashboard personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentLayout.widgets
              .filter(widget => widget.visible)
              .map((widget) => {
                const Icon = getWidgetIcon(widget)
                
                return (
                  <Card 
                    key={widget.id} 
                    className={`${getGridCols(widget.size)} hover:shadow-lg transition-shadow`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Icon className="h-5 w-5 mr-2" />
                        {widget.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Simulación de contenido basado en el tipo */}
                        {widget.type === 'metric' && (
                          <div className="text-center">
                            <div className="text-3xl font-bold text-primary">
                              {Math.floor(Math.random() * 100)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Métrica simulada
                            </div>
                          </div>
                        )}
                        
                        {widget.type === 'chart' && (
                          <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded flex items-center justify-center">
                            <BarChart3 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        
                        {widget.type === 'status' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Estado</span>
                              <Badge variant="default">Activo</Badge>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className="bg-green-600 h-2 rounded-full w-3/4"></div>
                            </div>
                          </div>
                        )}
                        
                        {widget.type === 'list' && (
                          <div className="space-y-2">
                            {[1, 2, 3].map((item) => (
                              <div key={item} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span>Elemento de lista {item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
          
          {currentLayout.widgets.filter(w => w.visible).length === 0 && (
            <div className="text-center py-12">
              <LayoutGrid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Dashboard Vacío
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No hay widgets visibles en este layout
              </p>
              <Button onClick={() => setEditMode(true)}>
                Agregar Widgets
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}