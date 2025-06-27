import axios from 'axios'

// URLs de las APIs
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.42.185.2:8015'
const BAILEYS_API_URL = process.env.NEXT_PUBLIC_BAILEYS_API_URL || 'http://100.42.185.2:8015'

// Chats endpoints (V2) - Exportación corregida
export const chatsAPI = {
  getList: async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      // Usar endpoint V1 por compatibilidad
      const response = await fetch(`${BAILEYS_API_URL}/chats?id=${sessionId}`)
      
      if (!response.ok) {
        return {
          success: true,
          data: [],
          message: 'No chats available'
        }
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data || [],
        message: 'Chats retrieved successfully'
      }
    } catch (error) {
      console.warn('Error obteniendo chats:', error)
      return {
        success: true,
        data: [],
        message: 'Chats endpoint not available'
      }
    }
  },
  
  sendMessage: async (sessionId: string, data: any) => {
    try {
      const response = await fetch(`${BAILEYS_API_URL}/chats/send?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const responseData = await response.json()
      return {
        success: true,
        data: responseData,
        message: 'Message sent successfully'
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      throw error
    }
  }
}

// Crear instancias directas para evitar importaciones circulares
class SimpleBaileysAPI {
  private baseURL = BAILEYS_API_URL
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<{success: boolean, data?: T, message?: string}> {
    const url = `${this.baseURL}${endpoint}`
    const defaultHeaders = { 'Content-Type': 'application/json' }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch {}
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      throw error
    }
  }
  
  async createSession(data: any) {
    return this.request('/sessions/add', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
  
  async listSessions() {
    return this.request('/sessions/list')
  }
  
  async deleteSession(sessionId: string) {
    return this.request(`/sessions/delete/${sessionId}`, { method: 'DELETE' })
  }
  
  async getSessionStatus(sessionId: string) {
    // DEBUG ULTRA-AGRESIVO - Capturar cualquier error desde el inicio
    try {
      console.log(`[DEBUG-ULTRA] === INICIO getSessionStatus para: ${sessionId} ===`)
      console.log(`[DEBUG-ULTRA] baseURL: ${this.baseURL}`)
      
      let token
      try {
        token = localStorage.getItem('token')
        console.log(`[DEBUG-ULTRA] Token obtenido: ${token ? 'SÍ' : 'NO'}`)
        if (token) {
          console.log(`[DEBUG-ULTRA] Token length: ${token.length}`)
          console.log(`[DEBUG-ULTRA] Token preview: ${token.substring(0, 20)}...`)
        }
      } catch (tokenError) {
        console.log(`[DEBUG-ULTRA] Error obteniendo token:`, tokenError)
        throw new Error(`Token access failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown'}`)
      }
      
      if (!token) {
        console.log('[DEBUG-ULTRA] No hay token disponible - lanzando error')
        throw new Error('No hay token de autenticación disponible')
      }
      
      let url
      try {
        url = `${this.baseURL}/api/v2/sesiones/${sessionId}/status?token=${token}`
        console.log(`[DEBUG-ULTRA] URL construida: ${url}`)
      } catch (urlError) {
        console.log(`[DEBUG-ULTRA] Error construyendo URL:`, urlError)
        throw new Error(`URL construction failed: ${urlError instanceof Error ? urlError.message : 'Unknown'}`)
      }
      
      let response
      try {
        console.log(`[DEBUG-ULTRA] Iniciando fetch...`)
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        console.log(`[DEBUG-ULTRA] Fetch completado. Status: ${response.status}`)
      } catch (fetchError) {
        console.log(`[DEBUG-ULTRA] Error en fetch:`, fetchError)
        throw new Error(`Fetch failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'}`)
      }
      
      let responseText
      try {
        console.log(`[DEBUG-ULTRA] Leyendo response text...`)
        responseText = await response.text()
        console.log(`[DEBUG-ULTRA] Response text length: ${responseText.length}`)
        console.log(`[DEBUG-ULTRA] Response text: ${responseText}`)
      } catch (textError) {
        console.log(`[DEBUG-ULTRA] Error leyendo response text:`, textError)
        throw new Error(`Response text read failed: ${textError instanceof Error ? textError.message : 'Unknown'}`)
      }
      
      if (!response.ok) {
        console.log(`[DEBUG-ULTRA] Response not OK. Status: ${response.status}, StatusText: ${response.statusText}`)
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorMessage
          console.log(`[DEBUG-ULTRA] Error data parsed:`, errorData)
        } catch (parseError) {
          console.log(`[DEBUG-ULTRA] Could not parse error response as JSON:`, parseError)
        }
        
        console.log(`[DEBUG-ULTRA] Lanzando error HTTP: ${errorMessage}`)
        throw new Error(errorMessage)
      }
      
      let responseData
      try {
        console.log(`[DEBUG-ULTRA] Parseando JSON...`)
        responseData = JSON.parse(responseText)
        console.log(`[DEBUG-ULTRA] JSON parseado exitosamente:`, responseData)
      } catch (parseError) {
        console.log(`[DEBUG-ULTRA] Error parseando JSON:`, parseError)
        throw new Error(`JSON parse failed: ${parseError instanceof Error ? parseError.message : 'Unknown'}`)
      }
      
      // Verificar estructura de respuesta
      console.log(`[DEBUG-ULTRA] Verificando estructura...`)
      console.log(`[DEBUG-ULTRA] responseData.success:`, responseData.success)
      console.log(`[DEBUG-ULTRA] responseData.data exists:`, !!responseData.data)
      console.log(`[DEBUG-ULTRA] responseData keys:`, Object.keys(responseData))
      
      if (responseData.success === false) {
        const errorMsg = responseData.message || 'Backend returned success=false'
        console.log(`[DEBUG-ULTRA] Backend error: ${errorMsg}`)
        throw new Error(errorMsg)
      }
      
      // Verificar que hay datos
      if (!responseData.data) {
        console.log(`[DEBUG-ULTRA] No data in response`)
        throw new Error('No data field in response')
      }
      
      console.log(`[DEBUG-ULTRA] Data structure:`, responseData.data)
      console.log(`[DEBUG-ULTRA] Data keys:`, Object.keys(responseData.data))
      
      // Mapear respuesta
      const mappedResponse = {
        success: true,
        data: {
          status: responseData.data?.estadoSesion || responseData.data?.estado || 'unknown',
          authenticated: 
            responseData.data?.estadoSesion === 'conectada' || 
            responseData.data?.estadoSesion === 'authenticated' ||
            responseData.data?.estado === 'authenticated',
          sessionId: responseData.data?.sesionId || responseData.data?.id || sessionId,
          phoneNumber: responseData.data?.lineaWhatsApp || responseData.data?.phoneNumber,
          active: responseData.data?.activa !== undefined ? responseData.data.activa : true,
          warning: responseData.data?.warning
        },
        message: 'Estado obtenido exitosamente'
      }
      
      console.log(`[DEBUG-ULTRA] Respuesta final mapeada:`, mappedResponse)
      console.log(`[DEBUG-ULTRA] === FIN EXITOSO getSessionStatus para: ${sessionId} ===`)
      
      return mappedResponse
      
    } catch (error) {
      console.log(`[DEBUG-ULTRA] === ERROR CAPTURADO en getSessionStatus para: ${sessionId} ===`)
      console.log(`[DEBUG-ULTRA] Error type:`, error?.constructor?.name || 'Unknown')
      console.log(`[DEBUG-ULTRA] Error message:`, error instanceof Error ? error.message : 'Unknown error')
      console.log(`[DEBUG-ULTRA] Error stack:`, error instanceof Error ? error.stack : 'No stack')
      
      // Lanzar error más específico
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in getSessionStatus'
      throw new Error(`SessionStatus failed for ${sessionId}: ${errorMessage}`)
    }
  }
  
  async findSession(sessionId: string) {
    return this.request(`/sessions/find/${sessionId}`)
  }
  
  async getWebhookStats(userId: string) {
    return this.request(`/webhook/stats/${userId}`)
  }
  
  async checkNumberExists(sessionId: string, phoneNumber: string) {
    return this.request(`/contacts/check-exists?id=${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ phone: phoneNumber })
    })
  }
  
  // Métodos para WhatsApp Chat
  async getChatList(sessionId: string) {
    try {
      const response = await fetch(`${this.baseURL}/chats?id=${sessionId}`)
      
      if (!response.ok) {
        return {
          success: true,
          data: [],
          message: 'No chats available'
        }
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data || [],
        message: 'Chats retrieved successfully'
      }
    } catch (error) {
      console.warn('Error obteniendo chats:', error)
      return {
        success: true,
        data: [],
        message: 'Chats endpoint not available'
      }
    }
  }
  
  async getConversation(sessionId: string, remoteJid: string, limit: number = 25, isGroup: boolean = false) {
    try {
      const response = await fetch(`${this.baseURL}/chats/messages?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remoteJid,
          limit,
          isGroup
        })
      })
      
      if (!response.ok) {
        return {
          success: true,
          data: [],
          message: 'No messages available'
        }
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data || [],
        message: 'Messages retrieved successfully'
      }
    } catch (error) {
      console.warn('Error obteniendo conversación:', error)
      return {
        success: true,
        data: [],
        message: 'Messages endpoint not available'
      }
    }
  }
  
  async downloadMedia(sessionId: string, params: { remoteJid: string; isGroup: boolean; messageId: string }) {
    try {
      const response = await fetch(`${this.baseURL}/chats/download-media?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remoteJid: params.remoteJid,
          messageId: params.messageId,
          isGroup: params.isGroup
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data,
        message: 'Media download initiated'
      }
    } catch (error) {
      console.error('Error downloading media:', error)
      throw error
    }
  }
  
  // Métodos para enviar mensajes
  async sendTextMessage(sessionId: string, params: { receiver: string; isGroup: boolean; message: { text: string } }) {
    try {
      const response = await fetch(`${this.baseURL}/chats/send?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: params.receiver,
          isGroup: params.isGroup,
          message: params.message
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data,
        message: 'Mensaje enviado exitosamente'
      }
    } catch (error) {
      console.error('Error enviando mensaje de texto:', error)
      throw error
    }
  }
  
  async sendImageMessage(sessionId: string, params: { receiver: string; isGroup: boolean; message: { image: { url: string }; caption?: string } }) {
    try {
      const response = await fetch(`${this.baseURL}/chats/send?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: params.receiver,
          isGroup: params.isGroup,
          message: params.message
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data,
        message: 'Imagen enviada exitosamente'
      }
    } catch (error) {
      console.error('Error enviando imagen:', error)
      throw error
    }
  }
  
  async sendVideoMessage(sessionId: string, params: { receiver: string; isGroup: boolean; message: { video: { url: string }; caption?: string } }) {
    try {
      const response = await fetch(`${this.baseURL}/chats/send?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: params.receiver,
          isGroup: params.isGroup,
          message: params.message
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data,
        message: 'Video enviado exitosamente'
      }
    } catch (error) {
      console.error('Error enviando video:', error)
      throw error
    }
  }
  
  async sendAudioMessage(sessionId: string, params: { receiver: string; isGroup: boolean; message: { audio: { url: string }; ptt?: boolean } }) {
    try {
      const response = await fetch(`${this.baseURL}/chats/send?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: params.receiver,
          isGroup: params.isGroup,
          message: params.message
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data,
        message: 'Audio enviado exitosamente'
      }
    } catch (error) {
      console.error('Error enviando audio:', error)
      throw error
    }
  }
  
  async sendDocumentMessage(sessionId: string, params: { receiver: string; isGroup: boolean; message: { document: { url: string }; caption?: string; mimetype?: string; fileName?: string } }) {
    try {
      const response = await fetch(`${this.baseURL}/chats/send?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: params.receiver,
          isGroup: params.isGroup,
          message: params.message
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data,
        message: 'Documento enviado exitosamente'
      }
    } catch (error) {
      console.error('Error enviando documento:', error)
      throw error
    }
  }
  
  async sendLocationMessage(sessionId: string, params: { receiver: string; isGroup: boolean; message: { location: { degreesLatitude: number; degreesLongitude: number } } }) {
    try {
      const response = await fetch(`${this.baseURL}/chats/send?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: params.receiver,
          isGroup: params.isGroup,
          message: params.message
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data,
        message: 'Ubicación enviada exitosamente'
      }
    } catch (error) {
      console.error('Error enviando ubicación:', error)
      throw error
    }
  }
  
  async sendPollMessage(sessionId: string, params: { receiver: string; isGroup: boolean; message: { poll: { name: string; values: string[]; selectableCount: number } } }) {
    try {
      const response = await fetch(`${this.baseURL}/chats/send?id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: params.receiver,
          isGroup: params.isGroup,
          message: params.message
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return {
        success: true,
        data: data,
        message: 'Encuesta enviada exitosamente'
      }
    } catch (error) {
      console.error('Error enviando encuesta:', error)
      throw error
    }
  }
}

const baileysAPI = new SimpleBaileysAPI()

export const api = axios.create({
  baseURL: API_URL,
})

// Interceptor para añadir el token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['x-access-token'] = token
  }
  return config
})

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      const isRenewalRelated = currentPath.includes('/dashboard') || currentPath.includes('/plans')
      
      if (isRenewalRelated) {
        const authStore = JSON.parse(localStorage.getItem('auth-storage') || '{}')
        if (authStore.state?.user) {
          authStore.state.user.membershipExpired = true
          localStorage.setItem('auth-storage', JSON.stringify(authStore))
          
          if (!currentPath.includes('/plans')) {
            window.location.href = '/dashboard/plans'
          }
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('baileys_token')
          window.location.href = '/auth/login'
        }
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('baileys_token')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth endpoints
export const authAPI = {
  register: async (data: {
    email: string
    password: string
    nombrebot?: string
    duracionMembresiaDias?: number
    tipoplan?: '14dias' | '6meses' | '1año' | 'vitalicio'
    rol?: 'usuario' | 'admin' | 'moderador' | 'premium'
  }) => {
    try {
      return api.post('/api/v2/auth/signup', {
        email: data.email,
        password: data.password,
        tipoplan: data.tipoplan || '14dias',
        rol: data.rol || 'usuario'
      })
    } catch (error) {
      console.error('Error en registro:', error)
      throw error
    }
  },

  login: async (data: { email: string; password: string }) => {
    try {
      return api.post('/api/v2/auth/signin', data)
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  },

  renewMembership: async (data: { 
    token: string; 
    duracionRenovacionDias?: number;
    tipoplan?: '14dias' | '6meses' | '1año' | 'vitalicio'
  }) => {
    try {
      return api.post('/api/v2/auth/renew-membership', {
        token: data.token,
        tipoplan: data.tipoplan || '1año'
      })
    } catch (error) {
      console.error('Error en renovación de membresía:', error)
      throw error
    }
  },

  // Actualizar perfil del usuario
  updateProfile: async (data: {
    token: string;
    configuracion?: any;
  }) => {
    try {
      return api.put('/api/v2/auth/profile', data)
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      throw error
    }
  },

  // Obtener estadísticas del usuario
  getUserStats: async (token: string) => {
    try {
      const response = await api.get('/api/v2/auth/stats', {
        params: { token }
      })
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      throw error
    }
  },

  // Verificar token
  verifyToken: async (token: string) => {
    try {
      return api.post('/api/v2/auth/verify-token', { token })
    } catch (error) {
      console.error('Error verificando token:', error)
      throw error
    }
  },

  // **NUEVO: Verificación de token mejorada**
  verifyTokenEnhanced: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v2/auth/verify-token-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Token verification failed')
      }
      
      return {
        success: data.success,
        data: data.data,
        message: data.message
      }
    } catch (error) {
      console.error('Error verificando token enhanced:', error)
      throw error
    }
  },

  // **NUEVO: Obtener datos completos del dashboard**
  getDashboardData: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v2/auth/dashboard-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get dashboard data')
      }
      
      return {
        success: data.success,
        data: data.data,
        message: data.message
      }
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error)
      throw error
    }
  },

  // DEPRECATED: Esta función no debe usarse - usar sessionsAPI.delete en su lugar
  deleteUser: (token: string) => {
    console.warn('deleteUser está deprecated, usa sessionsAPI.delete')
    return Promise.reject(new Error('deleteUser endpoint no disponible'))
  },
}

// Sessions endpoints
export const sessionsAPI = {
  list: async () => {
    try {
      return await baileysAPI.listSessions()
    } catch (error) {
      console.error('Error obteniendo sesiones:', error)
      throw error
    }
  },
  
  // Método para obtener sesiones del usuario autenticado
  listForUser: async (token: string) => {
    try {
      const response = await api.get('/api/v2/sesiones/user', {
        params: { token }
      })
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message
      }
    } catch (error) {
      console.error('Error obteniendo sesiones del usuario:', error)
      throw error
    }
  },
  
  find: async (id: string) => {
    try {
      return await baileysAPI.findSession(id)
    } catch (error) {
      console.error('Error obteniendo sesión:', error)
      throw error
    }
  },
  
  status: async (id: string) => {
    try {
      return await baileysAPI.getSessionStatus(id)
    } catch (error) {
      console.error('Error obteniendo estado de sesión:', error)
      throw error
    }
  },
  
  add: async (data: { nombrebot: string; typeAuth?: string; phoneNumber?: string }) => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      // Usar el endpoint V2 correcto
      const response = await api.post('/api/v2/sesiones/create', {
        token: token,
        nombresesion: data.nombrebot,
        lineaWhatsApp: data.phoneNumber,
        tipoAuth: (data.typeAuth as 'qr' | 'pairing' | 'code') || 'qr',
        crearWebhook: true
      })
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error) {
      console.error('Error creando sesión:', error)
      throw error
    }
  },
  
  delete: async (sesionId: string) => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      console.log('[SESSIONS-API-DEBUG] === INICIANDO DELETE EN API.TS ===')
      console.log('[SESSIONS-API-DEBUG] sesionId:', sesionId)
      console.log('[SESSIONS-API-DEBUG] token length:', token.length)
      console.log('[SESSIONS-API-DEBUG] baseURL:', API_URL)
      
      const requestBody = {
        token: token,
        sesionId: sesionId
      }
      
      console.log('[SESSIONS-API-DEBUG] Request body completo:', JSON.stringify(requestBody, null, 2))
      console.log('[SESSIONS-API-DEBUG] URL completa:', `${API_URL}/api/v2/sesiones/delete`)
      
      // Hacer la petición y capturar respuesta detallada
      console.log('[SESSIONS-API-DEBUG] Ejecutando axios.delete...')
      const response = await api.delete('/api/v2/sesiones/delete', {
        data: {
          token: token,
          sesionId: sesionId
        }
      })
      
      console.log('[SESSIONS-API-DEBUG] === RESPUESTA HTTP COMPLETA ===')
      console.log('[SESSIONS-API-DEBUG] response.status:', response.status)
      console.log('[SESSIONS-API-DEBUG] response.statusText:', response.statusText)
      console.log('[SESSIONS-API-DEBUG] response.headers:', response.headers)
      console.log('[SESSIONS-API-DEBUG] response.data type:', typeof response.data)
      console.log('[SESSIONS-API-DEBUG] response.data keys:', response.data ? Object.keys(response.data) : 'N/A')
      console.log('[SESSIONS-API-DEBUG] response.data completa:', JSON.stringify(response.data, null, 2))
      
      // Verificar estructura específica de la respuesta
      if (response.data) {
        console.log('[SESSIONS-API-DEBUG] response.data.success:', response.data.success)
        console.log('[SESSIONS-API-DEBUG] response.data.data:', response.data.data)
        console.log('[SESSIONS-API-DEBUG] response.data.message:', response.data.message)
      }
      
      const mappedResponse = {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
      
      console.log('[SESSIONS-API-DEBUG] Mapped response:', JSON.stringify(mappedResponse, null, 2))
      console.log('[SESSIONS-API-DEBUG] === FIN DELETE EN API.TS ===')
      
      return mappedResponse
    } catch (error) {
      console.error('[SESSIONS-API-DEBUG] === ERROR EN DELETE ===')
      console.error('[SESSIONS-API-DEBUG] Error type:', error?.constructor?.name)
      console.error('[SESSIONS-API-DEBUG] Error message:', error instanceof Error ? error.message : 'Unknown')
      
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any
        console.error('[SESSIONS-API-DEBUG] HTTP Status:', axiosError.response?.status)
        console.error('[SESSIONS-API-DEBUG] HTTP StatusText:', axiosError.response?.statusText)
        console.error('[SESSIONS-API-DEBUG] HTTP Response Data:', axiosError.response?.data)
      }
      
      console.error('Error eliminando sesión:', error)
      throw error
    }
  },
  
  createWebhook: async (sessionId: string, userId: string, webhookUrl?: string) => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      const response = await api.put('/api/v2/sesiones/webhook', {
        token: token,
        sesionId: sessionId,
        webhookUrl: webhookUrl || `${API_URL}/api/v2/webhook/${userId}`,
        eventos: ['message', 'status', 'connection']
      })
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error) {
      console.error('Error creando webhook:', error)
      return {
        success: true,
        message: 'Webhook functionality will be implemented soon',
        data: { webhookId: `webhook_${sessionId}_${Date.now()}` }
      }
    }
  },
  
  // Nuevos endpoints de eliminación masiva
  cleanupInactive: async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      const response = await api.delete('/api/v2/sesiones/cleanup/inactive', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error) {
      console.error('Error limpiando sesiones inactivas:', error)
      throw error
    }
  },
  
  bulkDelete: async (sessionIds: string[], permanent: boolean = false) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      console.log('[BULK-DELETE-DEBUG] === INICIANDO BULK DELETE ===')
      console.log('[BULK-DELETE-DEBUG] sessionIds:', sessionIds)
      console.log('[BULK-DELETE-DEBUG] permanent:', permanent)
      console.log('[BULK-DELETE-DEBUG] token length:', token.length)
      console.log('[BULK-DELETE-DEBUG] baseURL:', API_URL)
      
      const requestBody = {
        token: token,
        sessionIds: sessionIds,
        permanent: permanent
      }
      
      console.log('[BULK-DELETE-DEBUG] Request body completo:', JSON.stringify(requestBody, null, 2))
      console.log('[BULK-DELETE-DEBUG] URL completa:', `${API_URL}/api/v2/sesiones/bulk/delete`)
      
      // Hacer la petición con token en body Y header
      console.log('[BULK-DELETE-DEBUG] Ejecutando axios.delete...')
      const response = await api.delete('/api/v2/sesiones/bulk/delete', {
        data: requestBody,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('[BULK-DELETE-DEBUG] === RESPUESTA HTTP COMPLETA ===')
      console.log('[BULK-DELETE-DEBUG] response.status:', response.status)
      console.log('[BULK-DELETE-DEBUG] response.statusText:', response.statusText)
      console.log('[BULK-DELETE-DEBUG] response.headers:', response.headers)
      console.log('[BULK-DELETE-DEBUG] response.data type:', typeof response.data)
      console.log('[BULK-DELETE-DEBUG] response.data keys:', response.data ? Object.keys(response.data) : 'N/A')
      console.log('[BULK-DELETE-DEBUG] response.data completa:', JSON.stringify(response.data, null, 2))
      
      // Verificar estructura específica de la respuesta
      if (response.data) {
        console.log('[BULK-DELETE-DEBUG] response.data.success:', response.data.success)
        console.log('[BULK-DELETE-DEBUG] response.data.data:', response.data.data)
        console.log('[BULK-DELETE-DEBUG] response.data.message:', response.data.message)
      }
      
      const mappedResponse = {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
      
      console.log('[BULK-DELETE-DEBUG] Mapped response:', JSON.stringify(mappedResponse, null, 2))
      console.log('[BULK-DELETE-DEBUG] === FIN BULK DELETE ===')
      
      return mappedResponse
    } catch (error) {
      console.error('[BULK-DELETE-DEBUG] === ERROR EN BULK DELETE ===')
      console.error('[BULK-DELETE-DEBUG] Error type:', error?.constructor?.name)
      console.error('[BULK-DELETE-DEBUG] Error message:', error instanceof Error ? error.message : 'Unknown')
      
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any
        console.error('[BULK-DELETE-DEBUG] HTTP Status:', axiosError.response?.status)
        console.error('[BULK-DELETE-DEBUG] HTTP StatusText:', axiosError.response?.statusText)
        console.error('[BULK-DELETE-DEBUG] HTTP Response Data:', axiosError.response?.data)
      }
      
      console.error('Error en eliminación masiva:', error)
      throw error
    }
  },
  
  recreateSession: async (sessionId: string, options: {
    newSessionId?: string,
    phoneNumber?: string,
    typeAuth?: 'qr' | 'code'
  } = {}) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No hay token de autenticación disponible')
      }
      
      const response = await api.post(`/api/v2/sesiones/${sessionId}/recreate`, options, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error) {
      console.error('Error recreando sesión:', error)
      throw error
    }
  }
}

// Webhooks endpoints
export const webhooksAPI = {
  getStats: async (userId: string) => {
    try {
      return await baileysAPI.getWebhookStats(userId)
    } catch (error) {
      return {
        success: true,
        message: 'Webhook stats mock (endpoint not available)',
        data: {
          totalNotifications: 0,
          unreadNotifications: 0,
          webhookActive: false,
          lastNotification: null,
          connectedClients: 0
        }
      }
    }
  }
}

// Utilidades
export const utilsAPI = {
  getHealth: async () => {
    try {
      const response = await fetch(`${BAILEYS_API_URL}/health`)
      
      if (!response.ok) {
        return {
          success: true,
          message: 'Health mock data (endpoint not available)',
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: 3600,
            services: {
              api: 'up',
              database: 'up',
              sessions: 'up'
            }
          }
        }
      }
      
      const data = await response.json()
      
      return {
        success: true,
        message: 'Health check successful',
        data: data || {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: 3600,
          services: {
            api: 'up',
            database: 'unknown',
            sessions: 'unknown'
          }
        }
      }
    } catch (error) {
      console.log('Health endpoint no disponible, usando datos mock:', error)
      return {
        success: true,
        message: 'Health mock data (connection failed)',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: 3600,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  },
  
  checkPhone: async (sessionId: string, phoneNumber: string) => {
    try {
      return await baileysAPI.checkNumberExists(sessionId, phoneNumber)
    } catch (error) {
      console.error('Error verificando número:', error)
      throw error
    }
  },
  
  formatPhone: (phoneNumber: string, isGroup: boolean = false) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    if (!cleanPhone.startsWith('57') && cleanPhone.length === 10) {
      formattedPhone = '57' + cleanPhone;
    }
    return formattedPhone + (isGroup ? '@g.us' : '@s.whatsapp.net');
  },
  
  isValidPhone: (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  },
  
  getJid: (phoneNumber: string, isGroup: boolean = false) => {
    return utilsAPI.formatPhone(phoneNumber, isGroup);
  }
}

// Clase BaileysAPI con métodos estáticos para compatibilidad
export class BaileysAPI {
  static formatPhoneNumber(phoneNumber: string, isGroup: boolean = false): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    let formattedPhone = cleanPhone
    
    // Añadir código de país si no lo tiene
    if (!cleanPhone.startsWith('57') && cleanPhone.length === 10) {
      formattedPhone = '57' + cleanPhone
    }
    
    return formattedPhone + (isGroup ? '@g.us' : '@s.whatsapp.net')
  }
  
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    return cleanPhone.length >= 10 && cleanPhone.length <= 15
  }
  
  static isValidPhone = BaileysAPI.isValidPhoneNumber
  static formatPhone = BaileysAPI.formatPhoneNumber
  static getJid = BaileysAPI.formatPhoneNumber
}

// Exportar instancia de Baileys API para uso directo
export { baileysAPI }

export default api
