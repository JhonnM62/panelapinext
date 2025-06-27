'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Users, 
  Smartphone, 
  MessageSquare, 
  Crown, 
  Activity,
  TrendingUp,
  AlertCircle,
  Settings,
  BarChart3
} from 'lucide-react'

// Mock data - En una implementación real esto vendría de la API
const mockStats = {
  totalUsers: 145,
  activeUsers: 89,
  totalSessions: 234,
  activeSessions: 67,
  messagesSent: 15420,
  renewalsThisMonth: 23,
  expiringUsers: 12
}

const mockRecentUsers = [
  {
    id: '1',
    nombrebot: 'Bot Ventas',
    email: 'ventas@empresa.com',
    fechaFin: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'active'
  },
  {
    id: '2',
    nombrebot: 'Bot Soporte',
    email: 'soporte@empresa.com',
    fechaFin: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'expiring'
  },
  {
    id: '3',
    nombrebot: 'Bot Marketing',
    email: 'marketing@empresa.com',
    fechaFin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'expired'
  }
]

export default function AdminPage() {
  const [stats, setStats] = useState(mockStats)
  const [recentUsers, setRecentUsers] = useState(mockRecentUsers)
  const [isLoading, setIsLoading] = useState(false)

  const getStatusBadge = (status: string, days?: number) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activo</Badge>
      case 'expiring':
        return <Badge variant="warning">Por Expirar</Badge>
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>
      default:
        return <Badge variant="secondary">Desconocido</Badge>
    }
  }

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Gestiona usuarios, membresías y configuraciones del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/admin/users">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Gestionar Usuarios
            </Button>
          </Link>
          <Link href="/admin/memberships">
            <Button>
              <Crown className="h-4 w-4 mr-2" />
              Membresías
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Usuarios Totales
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {stats.activeUsers} activos
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
              Sesiones Activas
            </CardTitle>
            <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {stats.activeSessions}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              de {stats.totalSessions} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Mensajes Enviados
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {stats.messagesSent.toLocaleString()}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Por Expirar
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {stats.expiringUsers}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Próximos 7 días
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Usuarios Recientes
            </CardTitle>
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                Ver Todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => {
                  const daysRemaining = getDaysRemaining(user.fechaFin)
                  const status = daysRemaining <= 0 ? 'expired' : 
                               daysRemaining <= 7 ? 'expiring' : 'active'
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {user.nombrebot.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.nombrebot}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {daysRemaining <= 0 ? 'Expirado' : `${daysRemaining} días`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Estadísticas del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Renovaciones</span>
                </div>
                <span className="font-bold text-green-600">+{stats.renewalsThisMonth}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Nuevos Usuarios</span>
                </div>
                <span className="font-bold text-blue-600">+34</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Promedio Mensajes/Usuario</span>
                </div>
                <span className="font-bold text-purple-600">173</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Tasa de Actividad</span>
                </div>
                <span className="font-bold text-orange-600">78%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="h-6 w-6" />
                <span>Gestionar Usuarios</span>
              </Button>
            </Link>
            
            <Link href="/admin/memberships">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Crown className="h-6 w-6" />
                <span>Membresías</span>
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span>Reportes</span>
            </Button>
            
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
              <Settings className="h-6 w-6" />
              <span>Configuración</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
