import { User } from '@/types'

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
