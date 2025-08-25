/**
 * Utilidades para normalizar y mapear tipos de recursos
 * Resuelve la inconsistencia entre 'chatbots' y 'botsIA'
 */

// Tipo normalizado sin 'chatbots' para evitar duplicidad
export type NormalizedResourceType = 'sesiones' | 'botsIA' | 'webhooks'

// Tipo legacy que incluye 'chatbots' para compatibilidad hacia atrás
export type LegacyResourceType = NormalizedResourceType | 'chatbots'

/**
 * Normaliza el tipo de recurso convirtiendo 'chatbots' a 'botsIA'
 * @param type - Tipo de recurso que puede incluir 'chatbots'
 * @returns Tipo de recurso normalizado
 */
export function normalizeResourceType(type: LegacyResourceType): NormalizedResourceType {
  // Mapear 'chatbots' a 'botsIA' para mantener consistencia
  if (type === 'chatbots') {
    return 'botsIA'
  }
  return type as NormalizedResourceType
}

/**
 * Verifica si un tipo es válido
 * @param type - Tipo a verificar
 * @returns true si el tipo es válido
 */
export function isValidResourceType(type: string): type is NormalizedResourceType {
  return ['sesiones', 'botsIA', 'webhooks'].includes(normalizeResourceType(type as LegacyResourceType))
}

/**
 * Obtiene el nombre display para un tipo de recurso
 * @param type - Tipo de recurso
 * @returns Nombre legible para mostrar en UI
 */
export function getResourceDisplayName(type: LegacyResourceType): string {
  const normalized = normalizeResourceType(type)
  
  const displayNames: Record<NormalizedResourceType, string> = {
    sesiones: 'Sesiones',
    botsIA: 'Bots IA',
    webhooks: 'Webhooks'
  }
  
  return displayNames[normalized]
}

/**
 * Obtiene el icono para un tipo de recurso
 * @param type - Tipo de recurso
 * @returns Nombre del icono de Lucide
 */
export function getResourceIcon(type: LegacyResourceType): string {
  const normalized = normalizeResourceType(type)
  
  const icons: Record<NormalizedResourceType, string> = {
    sesiones: 'MessageSquare',
    botsIA: 'Bot',
    webhooks: 'Webhook'
  }
  
  return icons[normalized]
}

/**
 * Obtiene el color del tipo de recurso para badges
 * @param type - Tipo de recurso
 * @returns Clase de color de Tailwind
 */
export function getResourceColor(type: LegacyResourceType): string {
  const normalized = normalizeResourceType(type)
  
  const colors: Record<NormalizedResourceType, string> = {
    sesiones: 'blue',
    botsIA: 'purple',
    webhooks: 'green'
  }
  
  return colors[normalized]
}
