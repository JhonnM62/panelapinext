export interface PlanLimits {
  sesiones: number
  botsIA: number
  webhooks: number
  mensajesEnviados: number
}

export interface PlanUsage {
  sesiones: number
  botsIA: number
  webhooks: number
  mensajesEnviados: number
  ultimaActualizacionUso: string
}

export interface Plan {
  _id?: string
  id?: string
  nombre: string
  descripcion?: string
  precio?: number
  duracion?: number // en días
  tipo: 'gratuito' | 'mensual' | 'semestral' | 'anual' | 'vitalicio'
  limites: PlanLimits
  caracteristicas?: string[]
  activo?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Suscripcion {
  _id?: string
  suscripcionId?: string
  usuarioId?: string
  planId?: string
  plan: Plan
  fechas: {
    inicio: string
    fin: string
    ultimoPago?: string
    proximoPago?: string
  }
  estado: 'activa' | 'expirada' | 'cancelada' | 'pausada'
  usoActual: PlanUsage
  limites?: PlanLimits // Opcional porque puede estar en plan.limites
  diasRestantes: number
  estaActiva: boolean
  renovacionAutomatica: {
    activa: boolean
    fechaProximaRenovacion?: string
  }
  transaccionId?: string
  metodoPago?: string
  createdAt?: string
  updatedAt?: string
}

export interface LimitValidation {
  valid: boolean
  current: number
  limit: number
  remaining: number
  percentage: number
  message?: string
}

export interface ResourceLimits {
  sesiones: LimitValidation
  botsIA: LimitValidation
  webhooks: LimitValidation
  canCreateMore: {
    sesiones: boolean
    botsIA: boolean
    webhooks: boolean
  }
}

export interface WebhookConfig {
  _id: string
  userId: string
  sessionId: string
  webhookId: string
  webhookUrl: string
  clientWebhookUrl?: string
  events: string[]
  active: boolean
  createdAt: string
  updatedAt?: string
  deliverySettings?: {
    retryAttempts: number
    retryDelay: number
    timeout: number
  }
}

export interface ChatBotConfig {
  _id: string
  userId: string
  sessionId: string
  botId: string
  name: string
  description?: string
  geminiConfig: {
    apiKey: string
    model: string
    systemPrompt: string
    temperature: number
    maxTokens: number
  }
  triggers: string[]
  active: boolean
  responseSettings: {
    autoReply: boolean
    replyDelay: number
    businessHours?: {
      enabled: boolean
      start: string
      end: string
      days: number[]
    }
  }
  stats: {
    totalInteractions: number
    lastInteraction?: string
  }
  createdAt: string
  updatedAt?: string
}

export type ResourceType = 'sesiones' | 'botsIA' | 'webhooks' | 'chatbots'

export interface CreateResourceParams {
  type: ResourceType
  sessionId?: string
  config?: Partial<WebhookConfig | ChatBotConfig>
}
