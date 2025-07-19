'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { utilsAPI } from '@/lib/api'
import { useSessionsStore } from '@/store/sessions'

export interface HealthStatus {
  api: 'healthy' | 'degraded' | 'down'
  database: 'healthy' | 'degraded' | 'down' | 'unknown'
  sessions: 'healthy' | 'degraded' | 'down'
  authentication: 'healthy' | 'degraded' | 'down'
  overall: 'healthy' | 'degraded' | 'down'
}

export interface HealthMetrics {
  totalSessions: number
  activeSessions: number
  connectedSessions: number
  authenticatedSessions: number
  lastCheck: string
  uptime?: string
  responseTime?: number
  checksPerformed: number
  lastError?: string
}

export interface HealthCheck {
  timestamp: string
  status: HealthStatus
  metrics: HealthMetrics
  duration: number
}

interface UseHealthMonitorOptions {
  autoRefresh?: boolean
  refreshInterval?: number // en milisegundos
  onStatusChange?: (status: HealthStatus) => void
  onError?: (error: Error) => void
}

export function useHealthMonitor(options: UseHealthMonitorOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 segundos por defecto
    onStatusChange,
    onError
  } = options

  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    api: 'down',
    database: 'unknown',
    sessions: 'down',
    authentication: 'down',
    overall: 'down'
  })

  const [metrics, setMetrics] = useState<HealthMetrics>({
    totalSessions: 0,
    activeSessions: 0,
    connectedSessions: 0,
    authenticatedSessions: 0,
    lastCheck: new Date().toISOString(),
    checksPerformed: 0
  })

  const [isChecking, setIsChecking] = useState(false)
  const [history, setHistory] = useState<HealthCheck[]>([])
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { sessions } = useSessionsStore()

  // Verificar salud de la API
  const checkApiHealth = async (): Promise<{ 
    status: 'healthy' | 'degraded' | 'down'
    responseTime?: number 
    error?: string 
  }> => {
    try {
      const startTime = Date.now()
      const response = await utilsAPI.getHealth()
      const responseTime = Date.now() - startTime
      
      if (!response.success) {
        return {
          status: 'degraded',
          responseTime,
          error: 'API responded but reported issues'
        }
      }
      
      // Considerar degradado si la respuesta es muy lenta
      const status = responseTime > 5000 ? 'degraded' : 'healthy'
      
      return { status, responseTime }
    } catch (error) {
      return { 
        status: 'down', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Verificar autenticación
  const checkAuthenticationHealth = async (): Promise<{
    status: 'healthy' | 'degraded' | 'down'
    error?: string
  }> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        return { status: 'down', error: 'No authentication token found' }
      }
      
      // Verificar que el token sea válido
      const userStr = localStorage.getItem('auth-storage')
      if (!userStr) {
        return { status: 'degraded', error: 'Token exists but no user data found' }
      }
      
      const authData = JSON.parse(userStr)
      if (!authData.state?.user) {
        return { status: 'degraded', error: 'User data corrupted or incomplete' }
      }
      
      // Verificar expiración del token (si está disponible)
      const user = authData.state.user
      if (user.fechaFin && new Date(user.fechaFin) < new Date()) {
        return { status: 'degraded', error: 'User membership expired' }
      }
      
      return { status: 'healthy' }
    } catch (error) {
      return { 
        status: 'down', 
        error: error instanceof Error ? error.message : 'Authentication check failed' 
      }
    }
  }

  // Verificar salud de sesiones
  const checkSessionsHealth = (): {
    status: 'healthy' | 'degraded' | 'down'
    metrics: {
      total: number
      active: number
      connected: number
      authenticated: number
    }
    error?: string
  } => {
    try {
      const total = sessions.length
      const active = sessions.filter(s => s.status !== 'disconnected').length
      const connected = sessions.filter(s => 
        s.status === 'connected' || s.status === 'authenticated'
      ).length
      const authenticated = sessions.filter(s => s.status === 'authenticated').length
      
      const metrics = { total, active, connected, authenticated }
      
      if (total === 0) {
        return { status: 'down', metrics, error: 'No sessions available' }
      }
      
      // Calcular salud basada en porcentajes
      const connectedRatio = connected / total
      const authenticatedRatio = authenticated / total
      
      if (authenticatedRatio >= 0.8) {
        return { status: 'healthy', metrics }
      } else if (connectedRatio >= 0.5 || authenticatedRatio >= 0.3) {
        return { status: 'degraded', metrics, error: 'Some sessions not fully operational' }
      } else {
        return { status: 'down', metrics, error: 'Most sessions are disconnected' }
      }
    } catch (error) {
      return {
        status: 'down',
        metrics: { total: 0, active: 0, connected: 0, authenticated: 0 },
        error: error instanceof Error ? error.message : 'Session check failed'
      }
    }
  }

  // Calcular estado general del sistema
  const calculateOverallHealth = (status: Omit<HealthStatus, 'overall'>): 'healthy' | 'degraded' | 'down' => {
    const statuses = [status.api, status.authentication, status.sessions]
    
    // Si algún servicio crítico está down, el sistema está down
    if (status.api === 'down' || status.authentication === 'down') {
      return 'down'
    }
    
    // Si hay algún servicio down o más de uno degradado
    if (statuses.includes('down') || statuses.filter(s => s === 'degraded').length > 1) {
      return 'down'
    }
    
    // Si hay algún servicio degradado
    if (statuses.includes('degraded')) {
      return 'degraded'
    }
    
    return 'healthy'
  }

  // Realizar verificación completa de salud
  const performHealthCheck = useCallback(async (): Promise<HealthCheck> => {
    const startTime = Date.now()
    setIsChecking(true)
    
    try {
      // Ejecutar todas las verificaciones en paralelo
      const [apiHealth, authHealth, sessionsHealth] = await Promise.all([
        checkApiHealth(),
        checkAuthenticationHealth(),
        Promise.resolve(checkSessionsHealth()) // Esta es síncrona
      ])
      
      // Compilar estado de salud
      const newStatus: HealthStatus = {
        api: apiHealth.status,
        database: 'unknown', // Podría mejorarse con verificaciones reales de DB
        sessions: sessionsHealth.status,
        authentication: authHealth.status,
        overall: 'healthy' // Se calculará después
      }
      
      // Calcular estado general
      newStatus.overall = calculateOverallHealth(newStatus)
      
      // Compilar métricas
      const newMetrics: HealthMetrics = {
        totalSessions: sessionsHealth.metrics.total,
        activeSessions: sessionsHealth.metrics.active,
        connectedSessions: sessionsHealth.metrics.connected,
        authenticatedSessions: sessionsHealth.metrics.authenticated,
        lastCheck: new Date().toISOString(),
        responseTime: apiHealth.responseTime,
        checksPerformed: metrics.checksPerformed + 1,
        lastError: [apiHealth.error, authHealth.error, sessionsHealth.error]
          .filter(Boolean)
          .join('; ') || undefined
      }
      
      // Crear registro de verificación
      const healthCheck: HealthCheck = {
        timestamp: new Date().toISOString(),
        status: newStatus,
        metrics: newMetrics,
        duration: Date.now() - startTime
      }
      
      // Actualizar estado
      setHealthStatus(newStatus)
      setMetrics(newMetrics)
      
      // Actualizar historial (mantener solo los últimos 50 registros)
      setHistory(prev => [healthCheck, ...prev].slice(0, 50))
      
      // Callbacks
      if (onStatusChange) {
        onStatusChange(newStatus)
      }
      
      return healthCheck
      
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error during health check')
      
      if (onError) {
        onError(errorObj)
      }
      
      const failedStatus: HealthStatus = {
        api: 'down',
        database: 'unknown',
        sessions: 'down',
        authentication: 'down',
        overall: 'down'
      }
      
      const failedMetrics: HealthMetrics = {
        ...metrics,
        lastCheck: new Date().toISOString(),
        checksPerformed: metrics.checksPerformed + 1,
        lastError: errorObj.message
      }
      
      setHealthStatus(failedStatus)
      setMetrics(failedMetrics)
      
      const failedCheck: HealthCheck = {
        timestamp: new Date().toISOString(),
        status: failedStatus,
        metrics: failedMetrics,
        duration: Date.now() - startTime
      }
      
      setHistory(prev => [failedCheck, ...prev].slice(0, 50))
      
      throw errorObj
    } finally {
      setIsChecking(false)
    }
  }, [sessions, metrics.checksPerformed, onStatusChange, onError])

  // Configurar auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      // Realizar verificación inicial
      performHealthCheck()
      
      // Configurar intervalo
      intervalRef.current = setInterval(performHealthCheck, refreshInterval)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      // Si auto-refresh está deshabilitado, realizar solo verificación inicial
      performHealthCheck()
    }
  }, [autoRefresh, refreshInterval, performHealthCheck])

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Métodos de utilidad
  const getStatusSummary = useCallback(() => {
    const total = Object.values(healthStatus).length - 1 // Excluir 'overall'
    const healthy = Object.entries(healthStatus)
      .filter(([key, value]) => key !== 'overall' && value === 'healthy').length
    const degraded = Object.entries(healthStatus)
      .filter(([key, value]) => key !== 'overall' && value === 'degraded').length
    const down = Object.entries(healthStatus)
      .filter(([key, value]) => key !== 'overall' && value === 'down').length
    
    return { total, healthy, degraded, down }
  }, [healthStatus])

  const getHealthTrend = useCallback(() => {
    if (history.length < 2) return 'stable'
    
    const recent = history.slice(0, 5)
    const healthyCount = recent.filter(h => h.status.overall === 'healthy').length
    const degradedCount = recent.filter(h => h.status.overall === 'degraded').length
    const downCount = recent.filter(h => h.status.overall === 'down').length
    
    if (healthyCount > degradedCount + downCount) return 'improving'
    if (downCount > healthyCount + degradedCount) return 'degrading'
    return 'stable'
  }, [history])

  return {
    // Estado actual
    healthStatus,
    metrics,
    isChecking,
    history,
    
    // Métodos
    performHealthCheck,
    
    // Utilidades
    getStatusSummary,
    getHealthTrend,
    
    // Estado derivado
    isHealthy: healthStatus.overall === 'healthy',
    isDegraded: healthStatus.overall === 'degraded',
    isDown: healthStatus.overall === 'down',
    hasRecentError: !!metrics.lastError,
    averageResponseTime: history.length > 0 
      ? history.reduce((sum, h) => sum + (h.metrics.responseTime || 0), 0) / history.length 
      : undefined
  }
}
