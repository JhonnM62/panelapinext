'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { planesApi, Plan as PlanAPI } from '@/lib/plans'
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  RefreshCw,
  CheckCircle,
  Star,
  Crown,
  Zap,
  Smartphone,
  Infinity,
  DollarSign,
  Calendar,
  Info
} from 'lucide-react'

interface PlansManagementProps {
  token: string
  baseUrl: string
}

export default function PlansManagement({ token, baseUrl }: PlansManagementProps) {
  const [plans, setPlans] = useState<PlanAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<PlanAPI | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'mensual',
    categoria: 'personal',
    precio: 10,
    moneda: 'USD',
    duracionCantidad: 1,
    duracionUnidad: 'meses',
    descuentoPorcentaje: 0,
    limitesSesiones: 2,
    limitesBotsIA: 1,
    limitesWebhooks: 1,
    activo: true,
    esPopular: false,
    orden: 1
  })

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    setLoading(true)
    try {
      const planesData = await planesApi.obtenerPlanes()
      setPlans(planesData)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async () => {
    try {
      // Aquí harías la llamada a la API para crear el plan
      const response = await fetch(`${baseUrl}/api/v2/admin/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          categoria: formData.categoria,
          precio: {
            valor: formData.precio,
            moneda: formData.moneda
          },
          duracion: {
            cantidad: formData.duracionCantidad,
            unidad: formData.duracionUnidad
          },
          descuento: {
            porcentaje: formData.descuentoPorcentaje,
            activo: formData.descuentoPorcentaje > 0
          },
          limites: {
            sesiones: formData.limitesSesiones,
            botsIA: formData.limitesBotsIA,
            webhooks: formData.limitesWebhooks
          },
          activo: formData.activo,
          esPopular: formData.esPopular,
          orden: formData.orden
        })
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Plan creado exitosamente"
        })
        setIsCreateDialogOpen(false)
        loadPlans()
        resetForm()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el plan",
        variant: "destructive"
      })
    }
  }

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return
    
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedPlan)
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Plan actualizado exitosamente"
        })
        setIsEditDialogOpen(false)
        loadPlans()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan",
        variant: "destructive"
      })
    }
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return
    
    try {
      const response = await fetch(`${baseUrl}/api/v2/admin/plans/${selectedPlan.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Plan eliminado exitosamente"
        })
        setIsDeleteDialogOpen(false)
        loadPlans()
      } else {
        const error = await response.json()
        throw new Error(error.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el plan",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'mensual',
      categoria: 'personal',
      precio: 10,
      moneda: 'USD',
      duracionCantidad: 1,
      duracionUnidad: 'meses',
      descuentoPorcentaje: 0,
      limitesSesiones: 2,
      limitesBotsIA: 1,
      limitesWebhooks: 1,
      activo: true,
      esPopular: false,
      orden: 1
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getPlanIcon = (tipo: string) => {
    switch (tipo) {
      case 'prueba_gratuita': return <Smartphone className="h-5 w-5" />
      case 'mensual': return <Zap className="h-5 w-5" />
      case 'semestral': return <Star className="h-5 w-5" />
      case 'anual': return <Crown className="h-5 w-5" />
      case 'vitalicio': return <Infinity className="h-5 w-5" />
      default: return <CreditCard className="h-5 w-5" />
    }
  }

  const getPlanColor = (tipo: string) => {
    switch (tipo) {
      case 'vitalicio': return 'from-purple-500 to-pink-500'
      case 'anual': return 'from-yellow-500 to-orange-500'
      case 'semestral': return 'from-blue-500 to-purple-500'
      case 'mensual': return 'from-green-500 to-blue-500'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Cargando planes...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gestión de Planes de Suscripción
              </CardTitle>
              <CardDescription>
                Administra todos los planes disponibles en el sistema
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={loadPlans} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
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
                    <p className="text-sm font-medium text-muted-foreground">Total Planes</p>
                    <p className="text-2xl font-bold">{plans.length}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Planes Gratuitos</p>
                    <p className="text-2xl font-bold">{plans.filter(p => p.esGratuito).length}</p>
                  </div>
                  <Smartphone className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Planes Premium</p>
                    <p className="text-2xl font-bold">{plans.filter(p => !p.esGratuito).length}</p>
                  </div>
                  <Crown className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plan Vitalicio</p>
                    <p className="text-2xl font-bold">{plans.filter(p => p.esVitalicio).length}</p>
                  </div>
                  <Star className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grid de planes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`border-2 h-full transition-all duration-200 hover:shadow-lg ${
                  plan.tipo === 'vitalicio' 
                    ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
                    : plan.tipo === 'semestral'
                    ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
                    : 'border-gray-200'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getPlanColor(plan.tipo)} text-white`}>
                      {getPlanIcon(plan.tipo)}
                    </div>
                    <div className="flex gap-1">
                      {plan.esGratuito && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Gratis
                        </Badge>
                      )}
                      {plan.esPopular && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <CardTitle className="text-base">{plan.nombre}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">{plan.descripcion}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Precio */}
                    <div className="text-center py-2">
                      {plan.descuento.porcentaje > 0 && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatPrice(plan.precio.valor)}
                        </p>
                      )}
                      <p className={`text-2xl font-bold ${
                        plan.tipo === 'vitalicio' ? 'text-purple-600' : 'text-gray-900 dark:text-white'
                      }`}>
                        {formatPrice(plan.precioConDescuento)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {plan.esVitalicio 
                          ? 'Pago único' 
                          : `${plan.duracion.cantidad} ${plan.duracion.unidad}`
                        }
                      </p>
                      {plan.descuento.porcentaje > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1 bg-green-100 text-green-800">
                          {plan.descuento.porcentaje}% OFF
                        </Badge>
                      )}
                    </div>
                    
                    {/* Límites */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{plan.limites.sesiones}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Sesiones</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-purple-600">{plan.limites.botsIA}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Bots IA</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">{plan.limites.webhooks}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Webhooks</div>
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedPlan(plan)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedPlan(plan)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-10 p-0"
                        onClick={() => {
                          setSelectedPlan(plan)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Información sobre Planes
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Los planes definen los límites y características disponibles para cada tipo de suscripción.
                  Los cambios en los planes afectarán a los nuevos usuarios que se registren con ese plan.
                  Los usuarios existentes mantendrán sus configuraciones actuales hasta que renueven su suscripción.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de creación */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Plan</DialogTitle>
            <DialogDescription>
              Complete los datos para crear un nuevo plan de suscripción
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Plan</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Plan Premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Plan</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prueba_gratuita">Prueba Gratuita</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="vitalicio">Vitalicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del plan..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio</Label>
                <Input
                  id="precio"
                  type="number"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descuento">Descuento (%)</Label>
                <Input
                  id="descuento"
                  type="number"
                  value={formData.descuentoPorcentaje}
                  onChange={(e) => setFormData({ ...formData, descuentoPorcentaje: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sesiones">Límite Sesiones</Label>
                <Input
                  id="sesiones"
                  type="number"
                  value={formData.limitesSesiones}
                  onChange={(e) => setFormData({ ...formData, limitesSesiones: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bots">Límite Bots IA</Label>
                <Input
                  id="bots"
                  type="number"
                  value={formData.limitesBotsIA}
                  onChange={(e) => setFormData({ ...formData, limitesBotsIA: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhooks">Límite Webhooks</Label>
                <Input
                  id="webhooks"
                  type="number"
                  value={formData.limitesWebhooks}
                  onChange={(e) => setFormData({ ...formData, limitesWebhooks: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
                <Label>Plan Activo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.esPopular}
                  onCheckedChange={(checked) => setFormData({ ...formData, esPopular: checked })}
                />
                <Label>Marcar como Popular</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              resetForm()
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePlan}>
              Crear Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de vista detallada */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Plan</DialogTitle>
            <DialogDescription>
              Información completa del plan {selectedPlan?.nombre}
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="text-sm">{selectedPlan.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                  <Badge>{selectedPlan.tipo}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                  <p className="text-sm">{selectedPlan.categoria}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant={selectedPlan.activo ? "default" : "secondary"}>
                    {selectedPlan.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                <p className="text-sm">{selectedPlan.descripcion}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Precio Base</p>
                  <p className="text-lg font-semibold">{formatPrice(selectedPlan.precio.valor)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Precio con Descuento</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatPrice(selectedPlan.precioConDescuento)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Límites</p>
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedPlan.limites.sesiones}</div>
                    <div className="text-sm text-gray-600">Sesiones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedPlan.limites.botsIA}</div>
                    <div className="text-sm text-gray-600">Bots IA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedPlan.limites.webhooks}</div>
                    <div className="text-sm text-gray-600">Webhooks</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Características</p>
                <div className="space-y-1">
                  {selectedPlan.caracteristicas.map((car, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{car.nombre}</span>
                    </div>
                  ))}
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

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plan</DialogTitle>
            <DialogDescription>
              Modifique los datos del plan seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Plan</Label>
                  <Input
                    value={selectedPlan.nombre}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={selectedPlan.tipo}
                    onValueChange={(value) => setSelectedPlan({ ...selectedPlan, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prueba_gratuita">Prueba Gratuita</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="vitalicio">Vitalicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={selectedPlan.descripcion}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, descripcion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    value={selectedPlan.precio.valor}
                    onChange={(e) => setSelectedPlan({ 
                      ...selectedPlan, 
                      precio: { ...selectedPlan.precio, valor: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    value={selectedPlan.descuento.porcentaje}
                    onChange={(e) => setSelectedPlan({ 
                      ...selectedPlan, 
                      descuento: { ...selectedPlan.descuento, porcentaje: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Límite Sesiones</Label>
                  <Input
                    type="number"
                    value={selectedPlan.limites.sesiones}
                    onChange={(e) => setSelectedPlan({ 
                      ...selectedPlan, 
                      limites: { ...selectedPlan.limites, sesiones: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Límite Bots IA</Label>
                  <Input
                    type="number"
                    value={selectedPlan.limites.botsIA}
                    onChange={(e) => setSelectedPlan({ 
                      ...selectedPlan, 
                      limites: { ...selectedPlan.limites, botsIA: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Límite Webhooks</Label>
                  <Input
                    type="number"
                    value={selectedPlan.limites.webhooks}
                    onChange={(e) => setSelectedPlan({ 
                      ...selectedPlan, 
                      limites: { ...selectedPlan.limites, webhooks: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedPlan.activo}
                    onCheckedChange={(checked) => setSelectedPlan({ ...selectedPlan, activo: checked })}
                  />
                  <Label>Plan Activo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedPlan.esPopular}
                    onCheckedChange={(checked) => setSelectedPlan({ ...selectedPlan, esPopular: checked })}
                  />
                  <Label>Marcar como Popular</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePlan}>
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
              ¿Está seguro que desea eliminar el plan {selectedPlan?.nombre}?
              Esta acción no se puede deshacer y podría afectar a usuarios con suscripciones activas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan}>
              Eliminar Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}