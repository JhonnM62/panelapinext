'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Activity } from 'lucide-react'
import { useHealthMonitor } from '@/hooks/useHealthMonitor'

export function HealthMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const {
    healthStatus,
    metrics,
    isChecking,
    performHealthCheck,
    getStatusSummary,
    getHealthTrend,
    isHealthy,
    isDegraded,
    isDown
  } = useHealthMonitor({
    autoRefresh,
    refreshInterval: 30000, // 30 segundos
    onStatusChange: (status) => {
      console.log('Health status changed:', status)
    },
    onError: (error) => {
      console.error('Health check error:', error)
    }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'down':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const statusSummary = getStatusSummary()
  const healthTrend = getHealthTrend()

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Estado del Sistema</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(healthStatus.overall)}>
                {getStatusIcon(healthStatus.overall)}
                <span className="ml-1 capitalize">{healthStatus.overall}</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={performHealthCheck}
                disabled={isChecking}
              >
                {isChecking ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isChecking ? 'Verificando...' : 'Actualizar'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Última verificación: {new Date(metrics.lastCheck).toLocaleString()}
            {metrics.responseTime && (
              <span className="ml-2">• Tiempo de respuesta: {metrics.responseTime}ms</span>
            )}
            <span className="ml-2">• Tendencia: {healthTrend}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">API Server</CardTitle>
              {getStatusIcon(healthStatus.api)}
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(healthStatus.api)}>
              {healthStatus.api}
            </Badge>
            {metrics.responseTime && (
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.responseTime}ms response
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Autenticación</CardTitle>
              {getStatusIcon(healthStatus.authentication)}
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(healthStatus.authentication)}>
              {healthStatus.authentication}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Token status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Sesiones</CardTitle>
              {getStatusIcon(healthStatus.sessions)}
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(healthStatus.sessions)}>
              {healthStatus.sessions}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.authenticatedSessions}/{metrics.totalSessions} autenticadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
              {getStatusIcon(healthStatus.database)}
            </div>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(healthStatus.database)}>
              {healthStatus.database}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              User data storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas del Sistema</CardTitle>
          <CardDescription>
            Estadísticas actuales de sesiones y rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalSessions}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Sesiones
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.activeSessions}
              </div>
              <div className="text-sm text-muted-foreground">
                Sesiones Activas
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.authenticatedSessions}
              </div>
              <div className="text-sm text-muted-foreground">
                Autenticadas
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.responseTime || '--'}ms
              </div>
              <div className="text-sm text-muted-foreground">
                Latencia API
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Resumen de Servicios</h4>
            <div className="flex space-x-4 text-sm">
              <span className="flex items-center">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                {statusSummary.healthy} saludables
              </span>
              <span className="flex items-center">
                <AlertCircle className="h-3 w-3 text-yellow-500 mr-1" />
                {statusSummary.degraded} degradados
              </span>
              <span className="flex items-center">
                <XCircle className="h-3 w-3 text-red-500 mr-1" />
                {statusSummary.down} caídos
              </span>
            </div>
          </div>

          {/* Error Display */}
          {metrics.lastError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-1">Último Error</h4>
              <p className="text-sm text-red-700">{metrics.lastError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-refresh Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="autoRefresh" className="text-sm">
            Actualización automática (cada 30 segundos)
          </label>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Sistema {isHealthy ? 'operativo' : 
                  isDegraded ? 'con problemas menores' : 
                  'con problemas críticos'} • {metrics.checksPerformed} verificaciones realizadas
        </div>
      </div>
    </div>
  )
}
