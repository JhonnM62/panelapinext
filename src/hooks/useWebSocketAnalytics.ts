'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { baileysAPI } from '@/lib/api'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UseWebSocketAnalyticsProps {
  enabled?: boolean
  userId?: string
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
}

interface AnalyticsStats {
  sessionsCount: number
  activeConnections: number
  messagesPerSecond: number
  webhooksPerSecond: number
  memoryUsage: number
  cpuUsage: number
  errors: any[]
  notifications: any[]
}

export function useWebSocketAnalytics({
  enabled = true,
  userId,
  onMessage,
  onError,
  onConnect,
  onDisconnect
}: UseWebSocketAnalyticsProps = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [stats, setStats] = useState<AnalyticsStats>({
    sessionsCount: 0,
    activeConnections: 0,
    messagesPerSecond: 0,
    webhooksPerSecond: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    errors: [],
    notifications: []
  })
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!enabled || !userId) return

    try {
      // Usar el método del baileysAPI para crear la conexión WebSocket
      const ws = baileysAPI.createWebSocketConnection(userId)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ WebSocket Analytics conectado')
        setIsConnected(true)
        setReconnectAttempts(0)
        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          // Procesar diferentes tipos de mensajes
          switch (message.type) {
            case 'stats_update':
              setStats(prevStats => ({
                ...prevStats,
                ...message.data
              }))
              break
              
            case 'notification':
              setStats(prevStats => ({
                ...prevStats,
                notifications: [message.data, ...prevStats.notifications.slice(0, 49)] // Mantener últimas 50
              }))
              break
              
            case 'error':
              setStats(prevStats => ({
                ...prevStats,
                errors: [message.data, ...prevStats.errors.slice(0, 19)] // Mantener últimos 20
              }))
              break
              
            case 'session_update':
              // Actualizar contador de sesiones
              setStats(prevStats => ({
                ...prevStats,
                sessionsCount: message.data.total || prevStats.sessionsCount,
                activeConnections: message.data.active || prevStats.activeConnections
              }))
              break
          }

          onMessage?.(message)
        } catch (error) {
          console.error('Error procesando mensaje WebSocket:', error)
        }
      }

      ws.onclose = () => {
        console.log('❌ WebSocket Analytics desconectado')
        setIsConnected(false)
        onDisconnect?.()
        
        // Intentar reconectar si está habilitado
        if (enabled && reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          console.log(`🔄 Reintentando conexión WebSocket en ${delay}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Error WebSocket Analytics:', error)
        onError?.(new Error('WebSocket connection error'))
      }

    } catch (error) {
      console.error('Error creando conexión WebSocket:', error)
      onError?.(error as Error)
    }
  }, [enabled, userId, onMessage, onError, onConnect, onDisconnect, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [isConnected])

  // Solicitar estadísticas periódicamente
  useEffect(() => {
    if (isConnected) {
      statsIntervalRef.current = setInterval(() => {
        sendMessage({
          type: 'request_stats',
          timestamp: new Date().toISOString()
        })
      }, 5000) // Cada 5 segundos

      return () => {
        if (statsIntervalRef.current) {
          clearInterval(statsIntervalRef.current)
        }
      }
    }
  }, [isConnected, sendMessage])

  // Conectar automáticamente cuando se habilita
  useEffect(() => {
    if (enabled && userId) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, userId, connect, disconnect])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    stats,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage
  }
}

// Hook para escuchar eventos específicos de WhatsApp
export function useWhatsAppEvents() {
  const [events, setEvents] = useState<any[]>([])
  const [lastEvent, setLastEvent] = useState<any>(null)

  useEffect(() => {
    const handleBaileysNotification = (event: CustomEvent) => {
      const eventData = {
        ...event.detail,
        timestamp: new Date().toISOString(),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      setLastEvent(eventData)
      setEvents(prev => [eventData, ...prev.slice(0, 99)]) // Mantener últimos 100 eventos
    }

    const handleBaileysNotifications = (event: CustomEvent) => {
      const notifications = event.detail.map((notification: any) => ({
        ...notification,
        timestamp: new Date().toISOString(),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
      
      setEvents(prev => [...notifications, ...prev].slice(0, 99))
    }

    // Escuchar eventos personalizados del WebSocket de Baileys
    window.addEventListener('baileys-notification', handleBaileysNotification as EventListener)
    window.addEventListener('baileys-notifications', handleBaileysNotifications as EventListener)

    return () => {
      window.removeEventListener('baileys-notification', handleBaileysNotification as EventListener)
      window.removeEventListener('baileys-notifications', handleBaileysNotifications as EventListener)
    }
  }, [])

  const clearEvents = useCallback(() => {
    setEvents([])
    setLastEvent(null)
  }, [])

  return {
    events,
    lastEvent,
    clearEvents,
    eventsCount: events.length
  }
}

// Hook para métricas de rendimiento
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    pageLoadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    jsHeapSize: 0,
    renderTime: 0
  })

  useEffect(() => {
    // Medir tiempo de carga de la página
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (perfData) {
      setMetrics(prev => ({
        ...prev,
        pageLoadTime: perfData.loadEventEnd - perfData.loadEventStart,
        renderTime: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart
      }))
    }

    // Medir uso de memoria (si está disponible)
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      setMetrics(prev => ({
        ...prev,
        jsHeapSize: memInfo.usedJSHeapSize,
        memoryUsage: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100
      }))
    }

    // Actualizar métricas cada 10 segundos
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          jsHeapSize: memInfo.usedJSHeapSize,
          memoryUsage: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100
        }))
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const measureApiCall = useCallback(async (apiCall: () => Promise<any>) => {
    const start = performance.now()
    try {
      const result = await apiCall()
      const end = performance.now()
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: end - start
      }))
      return result
    } catch (error) {
      const end = performance.now()
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: end - start
      }))
      throw error
    }
  }, [])

  return {
    metrics,
    measureApiCall
  }
}