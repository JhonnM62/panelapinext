'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Send, 
  Calendar, 
  Clock, 
  Mail, 
  Download,
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface ReportSchedule {
  id: string
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  metrics: string[]
  format: 'pdf' | 'excel' | 'json'
  active: boolean
  lastRun?: string
  nextRun?: string
  template: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  sections: string[]
  customizable: boolean
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'basic',
    name: 'Reporte Básico',
    description: 'Métricas principales del sistema',
    sections: ['overview', 'sessions', 'messages'],
    customizable: false
  },
  {
    id: 'detailed',
    name: 'Reporte Detallado',
    description: 'Análisis completo con gráficos',
    sections: ['overview', 'sessions', 'messages', 'webhooks', 'performance', 'trends'],
    customizable: true
  },
  {
    id: 'executive',
    name: 'Reporte Ejecutivo',
    description: 'Resumen para directivos',
    sections: ['kpis', 'summary', 'recommendations'],
    customizable: false
  },
  {
    id: 'technical',
    name: 'Reporte Técnico',
    description: 'Métricas de rendimiento y errores',
    sections: ['performance', 'errors', 'system_health', 'logs'],
    customizable: true
  }
]

const availableMetrics = [
  { id: 'sessions_total', name: 'Total de Sesiones', category: 'Sesiones' },
  { id: 'sessions_active', name: 'Sesiones Activas', category: 'Sesiones' },
  { id: 'messages_sent', name: 'Mensajes Enviados', category: 'Mensajes' },
  { id: 'messages_received', name: 'Mensajes Recibidos', category: 'Mensajes' },
  { id: 'webhooks_delivered', name: 'Webhooks Entregados', category: 'Webhooks' },
  { id: 'response_time_avg', name: 'Tiempo Respuesta Promedio', category: 'Rendimiento' },
  { id: 'error_rate', name: 'Tasa de Errores', category: 'Errores' },
  { id: 'uptime', name: 'Tiempo de Actividad', category: 'Sistema' },
  { id: 'memory_usage', name: 'Uso de Memoria', category: 'Sistema' },
  { id: 'cpu_usage', name: 'Uso de CPU', category: 'Sistema' }
]

export default function ReportsPage() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    recipients: [''],
    metrics: [] as string[],
    format: 'pdf' as 'pdf' | 'excel' | 'json',
    template: 'detailed',
    active: true
  })

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      // Cargar configuraciones desde localStorage o API
      const savedSchedules = localStorage.getItem('report-schedules')
      if (savedSchedules) {
        setSchedules(JSON.parse(savedSchedules))
      } else {
        // Datos de ejemplo
        setSchedules([
          {
            id: '1',
            name: 'Reporte Semanal',
            description: 'Resumen semanal de actividad',
            frequency: 'weekly',
            recipients: ['admin@empresa.com'],
            metrics: ['sessions_total', 'messages_sent', 'webhooks_delivered'],
            format: 'pdf',
            active: true,
            lastRun: new Date(Date.now() - 86400000 * 2).toISOString(),
            nextRun: new Date(Date.now() + 86400000 * 5).toISOString(),
            template: 'detailed'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes programados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSchedules = (newSchedules: ReportSchedule[]) => {
    localStorage.setItem('report-schedules', JSON.stringify(newSchedules))
    setSchedules(newSchedules)
  }

  const createSchedule = () => {
    const newSchedule: ReportSchedule = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      frequency: formData.frequency,
      recipients: formData.recipients.filter(email => email.trim() !== ''),
      metrics: formData.metrics,
      format: formData.format,
      active: formData.active,
      template: formData.template,
      nextRun: calculateNextRun(formData.frequency)
    }

    const updatedSchedules = [...schedules, newSchedule]
    saveSchedules(updatedSchedules)
    
    resetForm()
    setShowCreateForm(false)
    
    toast({
      title: "Reporte creado",
      description: "El reporte ha sido programado exitosamente",
    })
  }

  const updateSchedule = () => {
    if (!editingSchedule) return

    const updatedSchedule: ReportSchedule = {
      ...editingSchedule,
      name: formData.name,
      description: formData.description,
      frequency: formData.frequency,
      recipients: formData.recipients.filter(email => email.trim() !== ''),
      metrics: formData.metrics,
      format: formData.format,
      active: formData.active,
      template: formData.template,
      nextRun: calculateNextRun(formData.frequency)
    }

    const updatedSchedules = schedules.map(schedule => 
      schedule.id === editingSchedule.id ? updatedSchedule : schedule
    )
    
    saveSchedules(updatedSchedules)
    setEditingSchedule(null)
    resetForm()
    
    toast({
      title: "Reporte actualizado",
      description: "Los cambios han sido guardados exitosamente",
    })
  }

  const deleteSchedule = (id: string) => {
    const updatedSchedules = schedules.filter(schedule => schedule.id !== id)
    saveSchedules(updatedSchedules)
    
    toast({
      title: "Reporte eliminado",
      description: "El reporte programado ha sido eliminado",
    })
  }

  const toggleSchedule = (id: string) => {
    const updatedSchedules = schedules.map(schedule => 
      schedule.id === id ? { ...schedule, active: !schedule.active } : schedule
    )
    saveSchedules(updatedSchedules)
  }

  const generateReport = async (schedule: ReportSchedule) => {
    try {
      toast({
        title: "Generando reporte...",
        description: "El reporte se está generando, por favor espera",
      })

      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Marcar como ejecutado
      const updatedSchedules = schedules.map(s => 
        s.id === schedule.id 
          ? { ...s, lastRun: new Date().toISOString(), nextRun: calculateNextRun(s.frequency) }
          : s
      )
      saveSchedules(updatedSchedules)

      // Simular descarga
      const reportData = {
        id: schedule.id,
        name: schedule.name,
        generated_at: new Date().toISOString(),
        format: schedule.format,
        metrics: schedule.metrics,
        data: {
          // Datos simulados del reporte
          summary: {
            totalSessions: 45,
            activeMessages: 1234,
            webhooksDelivered: 567
          }
        }
      }

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: schedule.format === 'json' ? 'application/json' : 'application/octet-stream' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${schedule.name}_${new Date().toISOString().split('T')[0]}.${schedule.format}`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Reporte generado",
        description: "El reporte ha sido generado y descargado exitosamente",
      })
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      })
    }
  }

  const calculateNextRun = (frequency: string) => {
    const now = new Date()
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 86400000).toISOString()
      case 'weekly':
        return new Date(now.getTime() + 86400000 * 7).toISOString()
      case 'monthly':
        return new Date(now.getTime() + 86400000 * 30).toISOString()
      default:
        return new Date(now.getTime() + 86400000 * 7).toISOString()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      frequency: 'weekly',
      recipients: [''],
      metrics: [],
      format: 'pdf',
      template: 'detailed',
      active: true
    })
  }

  const editSchedule = (schedule: ReportSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      name: schedule.name,
      description: schedule.description,
      frequency: schedule.frequency,
      recipients: schedule.recipients.length > 0 ? schedule.recipients : [''],
      metrics: schedule.metrics,
      format: schedule.format,
      template: schedule.template,
      active: schedule.active
    })
    setShowCreateForm(true)
  }

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }))
  }

  const updateRecipient = (index: number, email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? email : r)
    }))
  }

  const removeRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }))
  }

  const toggleMetric = (metricId: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter(m => m !== metricId)
        : [...prev.metrics, metricId]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando reportes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Reportes Automáticos
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Configura y programa reportes automáticos de analytics
          </p>
        </div>
        
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Reporte
        </Button>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Secciones incluidas:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.sections.map((section) => (
                      <Badge key={section} variant="outline" className="text-xs">
                        {section.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {template.customizable ? 'Personalizable' : 'Fijo'}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, template: template.id }))
                      setShowCreateForm(true)
                    }}
                  >
                    Usar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Reportes Programados
          </CardTitle>
          <CardDescription>
            Gestiona tus reportes automáticos programados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay reportes programados</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCreateForm(true)}
              >
                Crear primer reporte
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{schedule.name}</h3>
                      <Badge 
                        variant={schedule.active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {schedule.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {schedule.frequency === 'daily' ? 'Diario' : 
                         schedule.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {schedule.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {schedule.recipients.length} destinatarios
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {schedule.metrics.length} métricas
                      </span>
                      {schedule.lastRun && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Último: {new Date(schedule.lastRun).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => generateReport(schedule)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Generar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => editSchedule(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => toggleSchedule(schedule.id)}
                    >
                      {schedule.active ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSchedule ? 'Editar Reporte' : 'Crear Nuevo Reporte'}
            </CardTitle>
            <CardDescription>
              Configura los detalles del reporte automático
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del reporte</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Reporte Semanal de WhatsApp"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frecuencia</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                    setFormData(prev => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el propósito de este reporte..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template">Plantilla</Label>
                <Select 
                  value={formData.template} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, template: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="format">Formato</Label>
                <Select 
                  value={formData.format} 
                  onValueChange={(value: 'pdf' | 'excel' | 'json') => 
                    setFormData(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <Label>Destinatarios</Label>
              {formData.recipients.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    placeholder="email@ejemplo.com"
                    className="flex-1"
                  />
                  {formData.recipients.length > 1 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => removeRecipient(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={addRecipient}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar destinatario
              </Button>
            </div>

            {/* Metrics Selection */}
            <div className="space-y-3">
              <Label>Métricas a incluir</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(
                  availableMetrics.reduce((acc, metric) => {
                    if (!acc[metric.category]) acc[metric.category] = []
                    acc[metric.category].push(metric)
                    return acc
                  }, {} as Record<string, typeof availableMetrics>)
                ).map(([category, metrics]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm">{category}</h4>
                    {metrics.map((metric) => (
                      <div key={metric.id} className="flex items-center space-x-2">
                        <Switch
                          id={metric.id}
                          checked={formData.metrics.includes(metric.id)}
                          onCheckedChange={() => toggleMetric(metric.id)}
                        />
                        <Label htmlFor={metric.id} className="text-sm">
                          {metric.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="active">Activar inmediatamente</Label>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingSchedule(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={editingSchedule ? updateSchedule : createSchedule}>
                  {editingSchedule ? 'Actualizar' : 'Crear'} Reporte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}