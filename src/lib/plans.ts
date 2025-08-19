import { User } from '@/types'

// 🎯 **NUEVA API DE PLANES DE SUSCRIPCIÓN**
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.42.185.2:8015'

// Interfaces para el nuevo sistema de planes
export interface Plan {
  id: string
  nombre: string
  descripcion: string
  tipo: 'prueba_gratuita' | 'mensual' | 'semestral' | 'anual' | 'vitalicio'
  precio: {
    valor: number
    moneda: string
  }
  precioConDescuento: number
  duracion: {
    cantidad: number
    unidad: 'dias' | 'meses' | 'anos' | 'vitalicio'
  }
  limites: {
    sesiones: number
    botsIA: number
    webhooks: number
    mensajesDiarios: number
    almacenamientoMB: number
  }
  descuento: {
    porcentaje: number
    descripcion: string
  }
  caracteristicas: Array<{
    nombre: string
    incluido: boolean
    descripcion: string
  }>
  categoria: string
  tags: string[]
  esGratuito: boolean
  esVitalicio: boolean
}

export interface Suscripcion {
  suscripcionId: string
  plan: {
    id: string
    nombre: string
    tipo: string
    limites: {
      sesiones: number
      botsIA: number
      webhooks: number
      mensajesDiarios: number
      almacenamientoMB: number
    }
  }
  estado: 'activa' | 'pausada' | 'cancelada' | 'expirada' | 'pendiente_pago'
  fechas: {
    inicio: string
    fin: string
    ultimoPago: string | null
    proximoPago: string | null
    cancelacion: string | null
  }
  usoActual: {
    sesiones: number
    botsIA: number
    webhooks: number
    mensajesEnviados: number
    ultimaActualizacionUso: string
  }
  diasRestantes: number
  estaActiva: boolean
  renovacionAutomatica: {
    activa: boolean
    intentos: number
    ultimoIntento: string | null
  }
}

export interface VerificacionLimites {
  permitido: boolean
  usoActual: number
  limite: number
  plan: string
  razon?: string
}

// 🔧 **FUNCIONES DE API PARA PLANES**
export const planesApi = {
  // Obtener todos los planes disponibles
  async obtenerPlanes(): Promise<Plan[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/planes`)
      if (!response.ok) throw new Error('Error al obtener planes')
      const data = await response.json()
      return data.success ? data.data : []
    } catch (error) {
      console.error('Error obteniendo planes:', error)
      return []
    }
  },

  // Obtener plan específico por ID
  async obtenerPlan(planId: string): Promise<Plan | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/planes/${planId}`)
      if (!response.ok) throw new Error('Plan no encontrado')
      const data = await response.json()
      return data.success ? data.data : null
    } catch (error) {
      console.error('Error obteniendo plan:', error)
      return null
    }
  },

  // Suscribirse a un plan
  async suscribirse(planId: string, metodoPago: string = 'gratuito', transaccionId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No autenticado')

      const response = await fetch(`${API_BASE_URL}/planes/suscribirse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId,
          metodoPago,
          transaccionId
        })
      })

      const data = await response.json()
      return {
        success: data.success,
        data: data.data,
        error: data.success ? undefined : data.message
      }
    } catch (error) {
      console.error('Error suscribiéndose:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Obtener suscripción actual del usuario
  async obtenerSuscripcionActual(): Promise<Suscripcion | null> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No autenticado')

      const response = await fetch(`${API_BASE_URL}/planes/usuario/actual`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      return data.success && data.data ? data.data : null
    } catch (error) {
      console.error('Error obteniendo suscripción:', error)
      return null
    }
  },

  // Verificar límites para un tipo de recurso
  async verificarLimites(tipo: 'sesion' | 'botIA' | 'webhook'): Promise<VerificacionLimites> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No autenticado')

      const response = await fetch(`${API_BASE_URL}/planes/usuario/limites/${tipo}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      return data.success ? data.data : {
        permitido: false,
        usoActual: 0,
        limite: 0,
        plan: 'Desconocido',
        razon: 'Error al verificar límites'
      }
    } catch (error) {
      console.error('Error verificando límites:', error)
      return {
        permitido: false,
        usoActual: 0,
        limite: 0,
        plan: 'Desconocido',
        razon: 'Error de conexión'
      }
    }
  },

  // Obtener información completa del dashboard
  async obtenerInfoDashboard(): Promise<any> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No autenticado')

      const response = await fetch(`${API_BASE_URL}/planes/usuario/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      return data.success ? data.data : null
    } catch (error) {
      console.error('Error obteniendo info dashboard:', error)
      return null
    }
  },

  // Cancelar suscripción
  async cancelarSuscripcion(razon: string = 'usuario', descripcion: string = ''): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No autenticado')

      const response = await fetch(`${API_BASE_URL}/planes/usuario/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ razon, descripcion })
      })

      const data = await response.json()
      return {
        success: data.success,
        error: data.success ? undefined : data.message
      }
    } catch (error) {
      console.error('Error cancelando suscripción:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Actualizar uso de recursos
  async actualizarUso(tipo: 'sesiones' | 'botsIA' | 'webhooks', operacion: 'incrementar' | 'decrementar', cantidad: number = 1): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No autenticado')

      const response = await fetch(`${API_BASE_URL}/planes/usuario/uso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tipo, operacion, cantidad })
      })

      const data = await response.json()
      return {
        success: data.success,
        error: data.success ? undefined : data.message
      }
    } catch (error) {
      console.error('Error actualizando uso:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  },

  // Obtener historial de suscripciones
  async obtenerHistorialSuscripciones(): Promise<any[]> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No autenticado')

      const response = await fetch(`${API_BASE_URL}/planes/usuario/historial`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      return data.success ? data.data : []
    } catch (error) {
      console.error('Error obteniendo historial:', error)
      return []
    }
  }
}

// **MEJORA: Mapeo de planes enhanced**
export const getMaxSessionsForTipoPlan = (tipoplan?: string): number => {
  switch (tipoplan) {
    case '14dias':
      return 1
    case '6meses':
      return 2
    case '1año':
      return 3
    case 'vitalicio':
      return 4
    default:
      return 1
  }
}

// Legacy: Mantener compatibilidad con sistema anterior
export const getMaxSessionsForPlan = (plan?: string): number => {
  switch (plan) {
    case 'lifetime':
      return 15
    case 'basic':
    case 'monthly':
    case 'semiannual':
    case 'annual':
    default:
      return 1
  }
}

// **MEJORA: Función que maneja ambos sistemas**
export const canCreateSession = (user: User, currentSessionsCount: number): boolean => {
  // Priorizar sistema enhanced si está disponible
  if (user.numerodesesiones !== undefined) {
    return currentSessionsCount < user.numerodesesiones
  }
  
  // Usar tipoplan si está disponible
  if (user.tipoplan) {
    const maxSessions = getMaxSessionsForTipoPlan(user.tipoplan)
    return currentSessionsCount < maxSessions
  }
  
  // Fallback al sistema legacy
  const maxSessions = getMaxSessionsForPlan(user.plan)
  return currentSessionsCount < maxSessions
}

// **MEJORA: Mensaje de límites mejorado**
export const getSessionsLimitMessage = (user: User, currentSessionsCount: number): string => {
  let maxSessions = 1
  let planName = 'básico'
  
  // Priorizar sistema enhanced
  if (user.numerodesesiones !== undefined) {
    maxSessions = user.numerodesesiones
    planName = user.tipoplan || planName
  } else if (user.tipoplan) {
    maxSessions = getMaxSessionsForTipoPlan(user.tipoplan)
    planName = user.tipoplan
  } else {
    maxSessions = getMaxSessionsForPlan(user.plan)
    planName = user.plan || planName
  }
  
  if (currentSessionsCount >= maxSessions) {
    if (planName === 'vitalicio' || planName === 'lifetime') {
      return `Has alcanzado el límite de ${maxSessions} sesiones de tu plan ${planName}.`
    } else {
      return `Has alcanzado el límite de ${maxSessions} sesión${maxSessions > 1 ? 'es' : ''} de tu plan ${planName}. Actualiza a un plan superior para crear más sesiones.`
    }
  }
  
  const remaining = maxSessions - currentSessionsCount
  return `Puedes crear ${remaining} sesión${remaining > 1 ? 'es' : ''} más.`
}

// **MEJORA: Features para los nuevos planes**
export const getPlanFeaturesEnhanced = (tipoplan: string): string[] => {
  switch (tipoplan) {
    case '14dias':
      return [
        '14 días de acceso gratuito',
        '1 sesión de WhatsApp',
        'Mensajes básicos',
        'Plantillas simples',
        'Soporte por email'
      ]
    case '6meses':
      return [
        '6 meses de acceso',
        '2 sesiones de WhatsApp',
        'Mensajes ilimitados',
        'Bots con IA básica',
        'Plantillas avanzadas',
        'Soporte 24/7',
        'Analytics básicos'
      ]
    case '1año':
      return [
        '1 año de acceso',
        '3 sesiones de WhatsApp',
        'Mensajes ilimitados',
        'Bots con IA completa',
        'Automatización avanzada',
        'Webhooks personalizados',
        'Soporte prioritario 24/7',
        'Analytics completos',
        'Plantillas premium'
      ]
    case 'vitalicio':
      return [
        '4 sesiones de WhatsApp',
        'Mensajes ilimitados',
        'Todas las funciones premium',
        'IA de última generación',
        'Automatización completa',
        'Webhooks ilimitados',
        'API personalizada',
        'Soporte VIP de por vida',
        'Analytics profesionales',
        'Actualizaciones gratuitas',
        'Acceso vitalicio'
      ]
    default:
      return ['Funciones básicas']
  }
}

// Legacy: Features para planes antiguos
export const getPlanFeatures = (planId: string): string[] => {
  switch (planId) {
    case 'basic':
      return [
        '1 día de acceso',
        '1 sesión de WhatsApp',
        'Mensajes básicos',
        'Soporte por email'
      ]
    case 'monthly':
      return [
        '1 sesión de WhatsApp',
        'Mensajes ilimitados',
        'Automatización básica',
        'Soporte 24/7',
        'Analytics básicos'
      ]
    case 'semiannual':
      return [
        '1 sesión de WhatsApp',
        'Mensajes ilimitados',
        'Automatización avanzada',
        'Soporte prioritario 24/7',
        'Analytics completos',
        'Plantillas personalizadas',
        '10% de descuento'
      ]
    case 'annual':
      return [
        '1 sesión de WhatsApp',
        'Mensajes ilimitados',
        'Automatización completa',
        'Soporte VIP 24/7',
        'Analytics avanzados',
        'Plantillas premium',
        'API personalizada',
        '20% de descuento'
      ]
    case 'lifetime':
      return [
        'Hasta 15 sesiones de WhatsApp',
        'Mensajes ilimitados',
        'Todas las funciones premium',
        'Soporte VIP de por vida',
        'Analytics profesionales',
        'API completa',
        'Actualizaciones gratuitas',
        'Garantía de 1 año',
        'Acceso vitalicio'
      ]
    default:
      return ['Funciones básicas']
  }
}

// **MEJORA: Mapeo de días a tipo de plan**
export const daysToTipoPlan = (days: number): string => {
  if (days === 14) return '14dias'
  if (days === 180) return '6meses'
  if (days === 365) return '1año'
  if (days >= 999) return 'vitalicio'
  return '14dias' // default
}

// **MEJORA: Mapeo de tipo de plan a días**
export const tipoPlanToDays = (tipoplan: string): number => {
  switch (tipoplan) {
    case '14dias': return 14
    case '6meses': return 180
    case '1año': return 365
    case 'vitalicio': return 999999
    default: return 14
  }
}

export const calculateDiscount = (originalPrice: number, discountPercent: number): number => {
  return originalPrice - (originalPrice * discountPercent / 100)
}

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export const isPlanExpired = (user: User): boolean => {
  return new Date(user.fechaFin) < new Date()
}

export const isPlanExpiringSoon = (user: User, daysThreshold: number = 7): boolean => {
  const daysRemaining = getDaysRemaining(user.fechaFin)
  return daysRemaining <= daysThreshold && !isPlanExpired(user)
}

export const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

// **MEJORA: Verificar si el usuario tiene acceso a funciones premium**
export const hasAccess = (user: User, feature: string): boolean => {
  const tipoplan = user.tipoplan || '14dias'
  
  switch (feature) {
    case 'ia':
      return ['6meses', '1año', 'vitalicio'].includes(tipoplan)
    case 'webhooks':
      return ['1año', 'vitalicio'].includes(tipoplan)
    case 'analytics':
      return ['6meses', '1año', 'vitalicio'].includes(tipoplan)
    case 'multiple_sessions':
      return user.numerodesesiones ? user.numerodesesiones > 1 : false
    default:
      return true
  }
}
