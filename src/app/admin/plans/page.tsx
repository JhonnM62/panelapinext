'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Crown,
  Zap,
  Star,
  Infinity,
  Save,
  X
} from 'lucide-react'
import { PricingPlan } from '@/types'

export default function PlansAdminPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Initial plans data
  const initialPlans: PricingPlan[] = [
    {
      id: 'basic',
      name: 'Prueba Gratuita',
      price: 0,
      duration: 1,
      maxSessions: 1,
      features: [
        '1 día de acceso',
        '1 sesión de WhatsApp',
        'Mensajes básicos',
        'Soporte por email'
      ],
      isActive: true
    },
    {
      id: 'monthly',
      name: 'Plan Mensual',
      price: 7,
      duration: 30,
      maxSessions: 1,
      features: [
        '1 sesión de WhatsApp',
        'Mensajes ilimitados',
        'Automatización básica',
        'Soporte 24/7',
        'Analytics básicos'
      ],
      popular: false,
      isActive: true
    },
    {
      id: 'semiannual',
      name: 'Plan 6 Meses',
      price: 37.8,
      originalPrice: 42,
      discount: 10,
      duration: 180,
      maxSessions: 1,
      features: [
        '1 sesión de WhatsApp',
        'Mensajes ilimitados',
        'Automatización avanzada',
        'Soporte prioritario 24/7',
        'Analytics completos',
        'Plantillas personalizadas',
        '10% de descuento'
      ],
      popular: true,
      isActive: true
    },
    {
      id: 'annual',
      name: 'Plan Anual',
      price: 67.2,
      originalPrice: 84,
      discount: 20,
      duration: 365,
      maxSessions: 1,
      features: [
        '1 sesión de WhatsApp',
        'Mensajes ilimitados',
        'Automatización completa',
        'Soporte VIP 24/7',
        'Analytics avanzados',
        'Plantillas premium',
        'API personalizada',
        '20% de descuento'
      ],
      isActive: true
    },
    {
      id: 'lifetime',
      name: 'Plan Vitalicio',
      price: 100,
      duration: 36500,
      maxSessions: 15,
      features: [
        'Hasta 15 sesiones de WhatsApp',
        'Mensajes ilimitados',
        'Todas las funciones premium',
        'Soporte VIP de por vida',
        'Analytics profesionales',
        'API completa',
        'Actualizaciones gratuitas',
        'Garantía de 1 año',
        'Acceso vitalicio'
      ],
      isActive: true
    }
  ]

  useEffect(() => {
    // Simular carga de planes desde API
    setTimeout(() => {
      setPlans(initialPlans)
      setIsLoading(false)
    }, 1000)
  }, [])

  const handleEditPlan = (plan: PricingPlan) => {
    setEditingPlan({ ...plan })
    setIsDialogOpen(true)
  }

  const handleCreatePlan = () => {
    setEditingPlan({
      id: 'custom',
      name: '',
      price: 0,
      duration: 30,
      maxSessions: 1,
      features: [''],
      isActive: true
    })
    setIsDialogOpen(true)
  }

  const handleSavePlan = async () => {
    if (!editingPlan) return

    setIsSaving(true)
    
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (editingPlan.id === 'custom' || !plans.find(p => p.id === editingPlan.id)) {
        // Crear nuevo plan
        const newId = `custom_${Date.now()}`
        const newPlan = { ...editingPlan, id: newId }
        setPlans(prev => [...prev, newPlan])
        toast({
          title: 'Plan creado',
          description: 'El nuevo plan ha sido creado exitosamente',
        })
      } else {
        // Actualizar plan existente
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? editingPlan : p))
        toast({
          title: 'Plan actualizado',
          description: 'El plan ha sido actualizado exitosamente',
        })
      }
      
      setIsDialogOpen(false)
      setEditingPlan(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el plan',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este plan?')) {
      try {
        // Simular llamada a API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setPlans(prev => prev.filter(p => p.id !== planId))
        toast({
          title: 'Plan eliminado',
          description: 'El plan ha sido eliminado exitosamente',
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el plan',
          variant: 'destructive',
        })
      }
    }
  }

  const handleToggleActive = async (planId: string) => {
    try {
      setPlans(prev => prev.map(p => 
        p.id === planId ? { ...p, isActive: !p.isActive } : p
      ))
      
      toast({
        title: 'Estado actualizado',
        description: 'El estado del plan ha sido actualizado',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      })
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic': return <Zap className="h-5 w-5" />
      case 'monthly': return <Zap className="h-5 w-5" />
      case 'semiannual': return <Star className="h-5 w-5" />
      case 'annual': return <Crown className="h-5 w-5" />
      case 'lifetime': return <Infinity className="h-5 w-5" />
      default: return <DollarSign className="h-5 w-5" />
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const updateEditingPlan = (field: keyof PricingPlan, value: any) => {
    if (!editingPlan) return
    setEditingPlan({ ...editingPlan, [field]: value })
  }

  const addFeature = () => {
    if (!editingPlan) return
    setEditingPlan({ 
      ...editingPlan, 
      features: [...editingPlan.features, '']
    })
  }

  const updateFeature = (index: number, value: string) => {
    if (!editingPlan) return
    const newFeatures = [...editingPlan.features]
    newFeatures[index] = value
    setEditingPlan({ ...editingPlan, features: newFeatures })
  }

  const removeFeature = (index: number) => {
    if (!editingPlan) return
    const newFeatures = editingPlan.features.filter((_, i) => i !== index)
    setEditingPlan({ ...editingPlan, features: newFeatures })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gestión de Planes
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Configura y administra los planes de suscripción
          </p>
        </div>
        <Button onClick={handleCreatePlan}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${!plan.isActive ? 'opacity-60' : ''} ${
              plan.popular ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-blue-500">Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="mx-auto p-2 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mb-2">
                {getPlanIcon(plan.id)}
              </div>
              <CardTitle className="flex items-center justify-center space-x-2">
                <span>{plan.name}</span>
                {!plan.isActive && <Badge variant="secondary">Inactivo</Badge>}
              </CardTitle>
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  {plan.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(plan.originalPrice)}
                    </span>
                  )}
                  <span className="text-2xl font-bold">
                    {formatPrice(plan.price)}
                  </span>
                </div>
                {plan.discount && (
                  <Badge variant="secondary" className="text-xs">
                    {plan.discount}% OFF
                  </Badge>
                )}
                <CardDescription>
                  {plan.duration === 36500 ? 'Vitalicio' : `${plan.duration} días`} · 
                  {plan.maxSessions} sesión{plan.maxSessions > 1 ? 'es' : ''}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Características:</h4>
                <ul className="text-xs space-y-1">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-400">
                      • {feature}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-gray-500 text-xs">
                      +{plan.features.length - 3} más...
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={plan.isActive}
                    onCheckedChange={() => handleToggleActive(plan.id)}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {plan.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  {!['basic', 'monthly', 'semiannual', 'annual', 'lifetime'].includes(plan.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id === 'custom' || !plans.find(p => p.id === editingPlan?.id) 
                ? 'Crear Nuevo Plan' 
                : 'Editar Plan'
              }
            </DialogTitle>
            <DialogDescription>
              Configura los detalles del plan de suscripción
            </DialogDescription>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Plan</Label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => updateEditingPlan('name', e.target.value)}
                    placeholder="Ej: Plan Premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio (USD)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPlan.price}
                    onChange={(e) => updateEditingPlan('price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio Original (Opcional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPlan.originalPrice || ''}
                    onChange={(e) => updateEditingPlan('originalPrice', parseFloat(e.target.value) || undefined)}
                    placeholder="Para mostrar descuento"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingPlan.discount || ''}
                    onChange={(e) => updateEditingPlan('discount', parseInt(e.target.value) || undefined)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duración (días)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingPlan.duration}
                    onChange={(e) => updateEditingPlan('duration', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máximo de Sesiones</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingPlan.maxSessions}
                    onChange={(e) => updateEditingPlan('maxSessions', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Características</Label>
                  <Button type="button" size="sm" onClick={addFeature}>
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Característica del plan"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingPlan.popular || false}
                    onCheckedChange={(checked) => updateEditingPlan('popular', checked)}
                  />
                  <Label>Plan Popular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingPlan.isActive}
                    onCheckedChange={(checked) => updateEditingPlan('isActive', checked)}
                  />
                  <Label>Plan Activo</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSavePlan} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner className="mr-2" size={16} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}