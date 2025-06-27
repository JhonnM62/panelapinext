// Tipos adicionales para la integración de WhatsApp
declare global {
  interface Window {
    fs: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<Uint8Array | string>
    }
  }
}

// Tipos para eventos de la API
export interface WhatsAppEvent {
  event: 'message' | 'qr' | 'connection' | 'ack' | 'group' | 'call'
  data: any
  sessionId: string
  timestamp: number
}

// Tipos para configuración de webhook
export interface WebhookConfig {
  url: string
  events: string[]
  active: boolean
}

// Tipos para estadísticas
export interface SessionStats {
  sessionId: string
  totalMessages: number
  totalChats: number
  lastActivity: Date
  status: 'active' | 'inactive' | 'disconnected'
}

// Tipos para configuración avanzada
export interface AdvancedConfig {
  autoReconnect: boolean
  maxReconnectAttempts: number
  messageRetries: number
  webhookRetries: number
  rateLimitPerMinute: number
}

// Exportar todo
export * from '@/lib/api'
export * from '@/hooks/useWhatsApp'
export * from '@/components/whatsapp'
