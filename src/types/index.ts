export interface User {
  // CAMPOS MEJORADOS - Compatibilidad con Enhanced API V2
  id?: string // NUEVO: ID del usuario en respuestas enhanced
  _id: string // Mantener para compatibilidad
  
  // NUEVO SISTEMA: numerodesesiones reemplaza nombrebot
  numerodesesiones: number // Número de sesiones permitidas según plan
  nombrebot?: string // DEPRECATED: Mantener para compatibilidad hacia atrás
  
  // Campos básicos de usuario
  email: string
  rol: 'usuario' | 'admin' | 'moderador' | 'premium' // NUEVO: Sistema de roles
  tipoplan: '14dias' | '6meses' | '1año' | 'vitalicio' // NUEVO: Tipos de plan
  
  // Campos de membresía
  duracionMembresiaDias: number
  fechaInicio: string
  fechaFin: string
  ultimoAcceso?: string // NUEVO
  
  // Token y estado
  token: string
  activo?: boolean // NUEVO
  membershipExpired?: boolean
  
  // NUEVOS: Configuración y estadísticas
  configuracion?: {
    idioma: string
    timezone: string
    notificaciones: {
      email: boolean
      webhook: boolean
      sms: boolean
    }
  }
  
  estadisticas?: {
    sesionesCreadas: number
    mensajesEnviados: number
    botsCreados: number
    ultimaActividad: string
  }
  
  // Campos legacy para compatibilidad
  role?: 'user' | 'admin'
  plan?: 'basic' | 'monthly' | 'semiannual' | 'annual' | 'lifetime'
  maxSessions?: number
  isActive?: boolean
}

export interface Session {
  id: string
  status: 'connecting' | 'connected' | 'authenticated' | 'disconnected' | 'disconnecting'
  qr?: string
  code?: string // Código de verificación de 6 caracteres
  phoneNumber?: string
  createdAt?: string
  userId?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  // CAMPOS MEJORADOS
  tipoplan?: '14dias' | '6meses' | '1año' | 'vitalicio'
  rol?: 'usuario' | 'admin' | 'moderador' | 'premium'
  
  // Campos legacy para compatibilidad
  nombrebot?: string // DEPRECATED
  duracionMembresiaDias?: number // DEPRECATED - usar tipoplan
}

export interface LoginResponse {
  token: string
}

export interface SessionCreateRequest {
  nombrebot: string
  phoneNumber: string
}

export interface Chat {
  id: string
  name?: string
  unreadCount: number
  lastMessage?: string
  lastMessageTime?: string
  isGroup: boolean
}

export interface Message {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
    participant?: string
  }
  message: any
  messageTimestamp: string
  status?: string
}

export interface SendMessageRequest {
  receiver: string
  isGroup: boolean
  message: {
    text?: string
    image?: { url: string }
    video?: { url: string }
    audio?: { url: string }
    document?: { url: string }
    sticker?: { url: string }
    location?: { degreesLatitude: number; degreesLongitude: number }
    contacts?: any
    poll?: { name: string; values: string[]; selectableCount?: number }
    react?: { text: string; key: any }
  }
  caption?: string
  mimetype?: string
  fileName?: string
  ptt?: boolean
  gifPlayback?: boolean
}

export interface UserStats {
  totalSessions: number
  activeSessions: number
  messagesSent: number
  daysRemaining: number
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  activeSessions: number
}

export interface PricingPlan {
  id: 'basic' | 'monthly' | 'semiannual' | 'annual' | 'lifetime'
  name: string
  price: number
  originalPrice?: number
  discount?: number
  duration: number // días
  maxSessions: number
  features: string[]
  popular?: boolean
  isActive: boolean
  highlight?: string
  icon?: any // Lucide React Icon Component
}

export interface PaymentRequest {
  planId: string
  userEmail: string
  amount: number
  currency: string
}

export interface PaymentResponse {
  success: boolean
  paymentId: string
  token?: string
  message: string
}

// === TIPOS ENHANCED V2 ===

// Sesión mejorada con webhook y estadísticas
export interface SessionEnhanced {
  id: string
  nombresesion: string // NUEVO: Formato de nombre de sesión
  lineaWhatsApp: string // NUEVO: Línea de WhatsApp asociada
  userId: string // NUEVO: Referencia al usuario propietario
  
  // Estado de la sesión
  estadoSesion: 'creada' | 'conectando' | 'autenticada' | 'conectada' | 'desconectada' | 'error' | 'eliminada'
  tipoAuth: 'qr' | 'code'
  codigoQR?: string
  ultimoQR?: string
  
  // Webhook
  webhook: {
    creado: boolean
    url?: string
    activo: boolean
    estado: 'pendiente' | 'activo' | 'error' | 'desactivado'
    eventos?: string[]
  }
  
  // Estadísticas
  estadisticas: {
    mensajesEnviados: number
    mensajesRecibidos: number
    ultimoMensaje?: string
    tiempoConexion: number
    erroresConexion: number
  }
  
  // Fechas
  fechaCreacion: string
  fechaUltimaConexion?: string
  fechaUltimaDesconexion?: string
  ultimaActividad: string
  activa: boolean
  
  // Compatibilidad con Session original
  status?: 'connecting' | 'connected' | 'authenticated' | 'disconnected' | 'disconnecting'
  qr?: string
  code?: string
  phoneNumber?: string
  createdAt?: string
}

// Bot con IA y plantillas
export interface BotEnhanced {
  id: string
  nombreBot: string
  descripcion?: string
  tipoBot: 'plantilla' | 'ia' | 'hibrido'
  estado: 'borrador' | 'activo' | 'pausado' | 'eliminado'
  version: string
  tags: string[]
  
  // Referencias
  userId: string
  sesionId?: string
  
  // Configuración de IA
  configIA?: {
    userbot: string
    apikey: string
    server: string
    promt: string
    pais: string
    idioma: string
    numerodemensajes: number
    delay_seconds: number
    temperature: number
    topP: number
    maxOutputTokens: number
    pause_timeout_minutes: number
    ai_model: string
    thinking_budget: number
  }
  
  // Configuración de plantillas
  plantilla?: {
    mensajeBienvenida: {
      tipo: string
      contenido: string
      activo: boolean
    }
    mensajeDespedida: {
      tipo: string
      contenido: string
      activo: boolean
    }
    respuestasAutomaticas: Array<{
      palabrasclave: string[]
      respuesta: {
        tipo: string
        contenido: string
      }
      activo: boolean
    }>
    horarios: {
      activo: boolean
      zonaHoraria: string
      mensajeFueraHorario: string
    }
  }
  
  // Estadísticas
  estadisticas: {
    conversacionesIniciadas: number
    mensajesEnviados: number
    mensajesRecibidos: number
    flujos_completados: number
    ultimaActividad?: string
    tasaRespuesta: number
    tiempoPromedioRespuesta: number
  }
  
  fechaCreacion: string
  ultimaActualizacion: string
}

// Mensaje entrante/saliente con análisis IA
export interface MessageEnhanced {
  id: string
  messageId: string
  sesionId: string
  userId: string
  botId?: string
  
  // Dirección y remitente
  direccion: 'entrante' | 'saliente'
  remitente: {
    numero: string
    nombre?: string
    esContacto: boolean
    esGrupo: boolean
    jid: string
  }
  
  // Contenido
  tipoMensaje: 'texto' | 'imagen' | 'audio' | 'video' | 'documento' | 'ubicacion' | 'contacto' | 'sticker' | 'reaccion' | 'sistema'
  contenido: {
    texto?: string
    archivo?: {
      url: string
      tipo: string
      tamaño: number
      nombre: string
      duracion?: number
      transcripcion?: string
    }
    ubicacion?: {
      latitud: number
      longitud: number
      direccion?: string
    }
    metadata?: any
  }
  
  // Estado y procesamiento
  estado: 'recibido' | 'procesado' | 'respondido' | 'error' | 'ignorado'
  respuestaAutomatica?: {
    generada: boolean
    tipoRespuesta: string
    contenidoRespuesta: string
    tiempoRespuesta: number
    exito: boolean
  }
  
  // Análisis de IA
  analisisIA?: {
    sentimiento: {
      tipo: 'positivo' | 'negativo' | 'neutral'
      confianza: number
    }
    intencion: string
    palabrasClave: string[]
    idioma: string
    spam: boolean
    urgencia: 'baja' | 'media' | 'alta'
  }
  
  // Metadatos
  etiquetas: string[]
  notas: Array<{
    usuario: string
    fecha: string
    nota: string
    tipo: 'info' | 'importante' | 'seguimiento' | 'resuelto'
  }>
  
  fechaCreacion: string
  ultimaActualizacion: string
}

// Configuración de Gemini IA
export interface GeminiConfig {
  id?: string
  userId: string
  userbot: string
  apikey: string
  server: string
  promt: string
  pais: string
  idioma: string
  numerodemensajes: number
  delay_seconds: number
  temperature: number
  topP: number
  maxOutputTokens: number
  pause_timeout_minutes: number
  ai_model: string
  thinking_budget: number
  activo: boolean
  fechaCreacion?: string
  ultimaActualizacion?: string
}

// Respuesta de procesamiento de IA
export interface IAProcessResponse {
  success: boolean
  response?: string
  error?: string
  thinking?: string
  usage?: {
    promptTokens: number
    responseTokens: number
    totalTokens: number
  }
  timestamp?: string
}

// Respuesta API mejorada
export interface ApiResponseEnhanced<T = any> {
  success: boolean
  message: string
  data: T
  timestamp?: string
}

// Respuesta paginada
export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    paginacion: {
      paginaActual: number
      totalPaginas: number
      totalItems: number
      itemsPorPagina: number
    }
  }
  message?: string
  timestamp?: string
}

// Request para renovación de membresía enhanced
export interface RenewMembershipEnhancedRequest {
  token: string
  tipoplan: '14dias' | '6meses' | '1año' | 'vitalicio'
}

// Request para creación de sesiones mejoradas
export interface CreateSessionEnhancedRequest {
  token: string
  nombresesion: string
  lineaWhatsApp: string
  tipoAuth?: 'qr' | 'code'
  crearWebhook?: boolean
  eventosWebhook?: string[]
}

// Request para creación de bots
export interface CreateBotRequest {
  token: string
  nombreBot: string
  descripcion?: string
  tipoBot: 'plantilla' | 'ia' | 'hibrido'
  sesionId?: string
  configIA?: Partial<GeminiConfig>
  plantilla?: any
  tags?: string[]
}
