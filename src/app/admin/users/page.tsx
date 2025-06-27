'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Users, 
  Search, 
  MoreVertical, 
  Crown, 
  Mail, 
  Calendar,
  RefreshCw,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield
} from 'lucide-react'
import { formatDate, getDaysRemaining } from '@/lib/utils'
import Link from 'next/link'

// Mock data - En una implementación real esto vendría de la API
const mockUsers = [
  {
    _id: '1',
    nombrebot: 'Bot Ventas Premium',
    email: 'ventas@empresa.com',
    duracionMembresiaDias: 30,
    fechaInicio: '2024-01-15T00:00:00Z',
    fechaFin: '2024-12-15T00:00:00Z',
    token: 'token123',
    role: 'user',
    sessionsCount: 3,
    lastActive: '2024-01-20T10:30:00Z'
  },
  {
    _id: '2',
    nombrebot: 'Bot Soporte',
    email: 'admin@sistema.com',
    duracionMembresiaDias: 365,
    fechaInicio: '2023-06-01T00:00:00Z',
    fechaFin: '2025-06-01T00:00:00Z',
    token: 'token456',
    role: 'admin',
    sessionsCount: 5,
    lastActive: '2024-01-21T14:15:00Z'
  },
  {
    _id: '3',
    nombrebot: 'Bot Marketing',
    email: 'marketing@empresa.com',
    duracionMembresiaDias: 14,
    fechaInicio: '2024-01-10T00:00:00Z',
    fechaFin: '2024-01-12T00:00:00Z',
    token: 'token789',
    role: 'user',
    sessionsCount: 1,
    lastActive: '2024-01-11T09:20:00Z'
  }
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState(mockUsers)
  const [filteredUsers, setFilteredUsers] = useState(mockUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    filterUsers()
  }, [searchTerm, statusFilter, users])

  const filterUsers = () => {
    let filtered = users

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.nombrebot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        const daysRemaining = getDaysRemaining(user.fechaFin)
        switch (statusFilter) {
          case 'active':
            return daysRemaining > 7
          case 'expiring':
            return daysRemaining <= 7 && daysRemaining > 0
          case 'expired':
            return daysRemaining <= 0
          case 'admin':
            return user.role === 'admin'
          default:
            return true
        }
      })
    }

    setFilteredUsers(filtered)
  }

  const getStatusBadge = (user: any) => {
    if (user.role === 'admin') {
      return <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    }

    const daysRemaining = getDaysRemaining(user.fechaFin)
    
    if (daysRemaining <= 0) {
      return <Badge variant="destructive">Expirado</Badge>
    } else if (daysRemaining <= 7) {
      return <Badge variant="warning">Por Expirar</Badge>
    } else {
      return <Badge variant="success">Activo</Badge>
    }
  }

  const handleRenewUser = async (userId: string, days: number) => {
    try {
      // Aquí iría la llamada a la API para renovar la membresía
      setIsLoading(true)
      
      // Simulación de API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUsers(prev => prev.map(user => {
        if (user._id === userId) {
          const currentEnd = new Date(user.fechaFin)
          const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000)
          return {
            ...user,
            fechaFin: newEnd.toISOString(),
            duracionMembresiaDias: user.duracionMembresiaDias + days
          }
        }
        return user
      }))
      
      toast({
        title: 'Membresía renovada',
        description: `La membresía ha sido extendida por ${days} días`,
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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return
    }

    try {
      setIsLoading(true)
      
      // Simulación de API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUsers(prev => prev.filter(user => user._id !== userId))
      
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Administra todos los usuarios del sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/admin">
            <Button variant="outline">
              Volver al Panel
            </Button>
          </Link>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="expiring">Por expirar</option>
                <option value="expired">Expirados</option>
                <option value="admin">Administradores</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => getDaysRemaining(u.fechaFin) > 7).length}
                </p>
              </div>
              <Badge variant="success" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                ✓
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Expirar</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => {
                    const days = getDaysRemaining(u.fechaFin)
                    return days <= 7 && days > 0
                  }).length}
                </p>
              </div>
              <Badge variant="warning" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                ⚠
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expirados</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => getDaysRemaining(u.fechaFin) <= 0).length}
                </p>
              </div>
              <Badge variant="destructive" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                ✕
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Usuarios ({filteredUsers.length})</span>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Membresía</TableHead>
                    <TableHead>Sesiones</TableHead>
                    <TableHead>Última Actividad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const daysRemaining = getDaysRemaining(user.fechaFin)
                    return (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-foreground">
                                {user.nombrebot.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.nombrebot}</p>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {daysRemaining <= 0 ? 'Expirado' : `${daysRemaining} días`}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Hasta {formatDate(user.fechaFin).split(',')[0]}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user.sessionsCount || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(user.lastActive || user.fechaInicio)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Usuario
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRenewUser(user._id, 30)}>
                                <Crown className="mr-2 h-4 w-4" />
                                Renovar 30 días
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRenewUser(user._id, 90)}>
                                <Crown className="mr-2 h-4 w-4" />
                                Renovar 90 días
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar Usuario
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
