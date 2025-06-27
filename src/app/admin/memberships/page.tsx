'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Crown, 
  Plus, 
  Search, 
  Settings, 
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowLeft
} from 'lucide-react'
import { formatDate, getDaysRemaining } from '@/lib/utils'

// Mock data para membresías
const mockMembershipPlans = [
  {
    id: '1',
    name: 'Plan Prueba',
    duration: 14,
    price: 0,
    features: ['1 sesión WhatsApp', 'Soporte básico'],
    isActive: true,
    usersCount: 45
  },
  {
    id: '2',
    name: 'Plan Básico',
    duration: 30,
    price: 9.99,
    features: ['3 sesiones WhatsApp', 'Soporte estándar', 'Webhooks'],
    isActive: true,
    usersCount: 23
  },
  {
    id: '3',
    name: 'Plan Pro',
    duration: 90,
    price: 24.99,
    features: ['10 sesiones WhatsApp', 'Soporte prioritario', 'Webhooks', 'API avanzada'],
    isActive: true,
    usersCount: 12
  },
  {
    id: '4',
    name: 'Plan Enterprise',
    duration: 365,
    price: 99.99,
    features: ['Sesiones ilimitadas', 'Soporte 24/7', 'Webhooks', 'API completa', 'Integraciones'],
    isActive: true,
    usersCount: 5
  }
]

const mockRecentRenewals = [
  {
    id: '1',
    userName: 'Bot Ventas',
    userEmail: 'ventas@empresa.com',
    planName: 'Plan Básico',
    renewedDays: 30,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    amount: 9.99
  },
  {
    id: '2',
    userName: 'Bot Marketing',
    userEmail: 'marketing@empresa.com',
    planName: 'Plan Pro',
    renewedDays: 90,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    amount: 24.99
  }
]

export default function AdminMembershipsPage() {
  const [plans, setPlans] = useState(mockMembershipPlans)
  const [renewals, setRenewals] = useState(mockRecentRenewals)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRenewDialog, setShowRenewDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Estado para crear nuevo plan
  const [newPlan, setNewPlan] = useState({
    name: '',
    duration: '',
    price: '',
    features: ''
  })

  // Estado para renovación masiva
  const [massRenewal, setMassRenewal] = useState({
    userEmail: '',
    days: '',
    planId: ''
  })

  const handleCreatePlan = async () => {
    try {
      setIsLoading(true)
      
      const plan = {
        id: Date.now().toString(),
        name: newPlan.name,
        duration: parseInt(newPlan.duration),
        price: parseFloat(newPlan.price),
        features: newPlan.features.split(',').map(f => f.trim()),
        isActive: true,
        usersCount: 0
      }
      
      setPlans(prev => [...prev, plan])
      setNewPlan({ name: '', duration: '', price: '', features: '' })
      setShowCreateDialog(false)
      
      toast({
        title: 'Plan creado',
        description: 'El nuevo plan de membresía ha sido creado exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el plan',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMassRenewal = async () => {
    try {
      setIsLoading(true)
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const renewal = {
        id: Date.now().toString(),
        userName: 'Usuario Renovado',
        userEmail: massRenewal.userEmail,
        planName: plans.find(p => p.id === massRenewal.planId)?.name || 'Plan Personalizado',
        renewedDays: parseInt(massRenewal.days),
        date: new Date(),
        amount: plans.find(p => p.id === massRenewal.planId)?.price || 0
      }
      
      setRenewals(prev => [renewal, ...prev])
      setMassRenewal({ userEmail: '', days: '', planId: '' })
      setShowRenewDialog(false)
      
      toast({
        title: 'Renovación exitosa',
        description: `Membresía renovada por ${massRenewal.days} días`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo renovar la membresía',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalRevenue = renewals.reduce((sum, renewal) => sum + renewal.amount, 0)
  const totalUsers = plans.reduce((sum, plan) => sum + plan.usersCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Gestión de Membresías
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Administra planes y renovaciones de membresías
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Renovar Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Renovar Membresía de Usuario</DialogTitle>
                <DialogDescription>
                  Renueva la membresía de un usuario específico
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email del Usuario</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={massRenewal.userEmail}
                    onChange={(e) => setMassRenewal(prev => ({ ...prev, userEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Días de Renovación</Label>
                  <Input
                    id="days"
                    type="number"
                    placeholder="30"
                    value={massRenewal.days}
                    onChange={(e) => setMassRenewal(prev => ({ ...prev, days: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planId">Plan (Opcional)</Label>
                  <Select 
                    value={massRenewal.planId} 
                    onValueChange={(value) => setMassRenewal(prev => ({ ...prev, planId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {plan.duration} días
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRenewDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleMassRenewal} disabled={isLoading}>
                  {isLoading ? <LoadingSpinner className="mr-2" size={16} /> : null}
                  Renovar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Plan de Membresía</DialogTitle>
                <DialogDescription>
                  Define un nuevo plan con sus características y precio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="planName">Nombre del Plan</Label>
                  <Input
                    id="planName"
                    placeholder="Plan Premium"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (días)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="30"
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="19.99"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Características (separadas por comas)</Label>
                  <Input
                    id="features"
                    placeholder="5 sesiones, Soporte 24/7, API avanzada"
                    value={newPlan.features}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, features: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePlan} disabled={isLoading}>
                  {isLoading ? <LoadingSpinner className="mr-2" size={16} /> : null}
                  Crear Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Planes Activos
            </CardTitle>
            <Crown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {plans.filter(p => p.isActive).length}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              de {plans.length} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
              Usuarios Totales
            </CardTitle>
            <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {totalUsers}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Con membresías activas
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Renovaciones
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {renewals.length}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Ingresos
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              ${totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Este mes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2" />
              Planes de Membresía
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant={plan.isActive ? 'success' : 'destructive'}>
                        {plan.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Duración</p>
                      <p className="font-medium">{plan.duration} días</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Precio</p>
                      <p className="font-medium">${plan.price}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Usuarios</p>
                      <p className="font-medium">{plan.usersCount}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-1">Características:</p>
                    <div className="flex flex-wrap gap-1">
                      {plan.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Renewals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Renovaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renewals.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  No hay renovaciones recientes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {renewals.map((renewal) => (
                  <div key={renewal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Crown className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{renewal.userName}</p>
                        <p className="text-sm text-muted-foreground">{renewal.userEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{renewal.planName}</p>
                      <p className="text-sm text-muted-foreground">
                        {renewal.renewedDays} días - ${renewal.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(renewal.date).split(',')[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
