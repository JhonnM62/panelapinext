// Gemini API Client - Funcionalidades de IA con Google Gemini
import { toSafeError, getErrorMessage, logError } from './error-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.42.185.2:8015'

// Tipos e interfaces
export interface GeminiConfigData {
  botId?: string; // ID del bot asociado (nuevo)
  nombreBot?: string; // Nombre del bot
  sesionId?: string; // ID de la sesión de WhatsApp
  estado?: string; // Estado del bot (activo, pausado, eliminado)
  userbot: string;
  apikey: string;
  server: string;
  promt: string;
  pais: string;
  idioma: string;
  numerodemensajes: number;
  delay_seconds: number;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  pause_timeout_minutes: number;
  ai_model: string;
  thinking_budget: number;
  activo: boolean;
  fechaCreacion?: string;
  ultimaActualizacion?: string;
}

export interface ProcessIARequest {
  body: string;
  number: string;
  userbot: string;
  apikey: string;
  server: string;
  promt: string;
  pais: string;
  idioma: string;
  numerodemensajes: number;
  delay_seconds: number;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  pause_timeout_minutes: number;
  ai_model: string;
  thinking_budget: number;
  token?: string; // Token de autenticación opcional para uso directo
}

export interface ProcessIAResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  response?: string;
  thinking?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// Clase Enhanced Baileys API
class EnhancedBaileysAPI {
  private baseURL = API_URL;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = { 'Content-Type': 'application/json' };
    
    try {
      const mergedHeaders: any = { ...defaultHeaders, ...options.headers };
      const hasAuthHeader = !!(mergedHeaders['Authorization'] || mergedHeaders['x-access-token']);
      
      console.log('🔧 [GEMINI API] Making request:', {
        url,
        method: options.method || 'GET',
        headers: mergedHeaders,
        bodyLength: options.body ? options.body.toString().length : 0,
        hasAuthHeader
      });
      
      const response = await fetch(url, {
        ...options,
        headers: mergedHeaders
      });
      
      console.log('🔧 [GEMINI API] Response status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        let errorDetails = null;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = errorData;
          console.error('🔧 [GEMINI API] Error response:', errorData);
        } catch (parseError) {
          console.error('🔧 [GEMINI API] Could not parse error response:', parseError);
        }
        
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).details = errorDetails;
        throw error;
      }
      
      const data = await response.json();
      console.log('🔧 [GEMINI API] Success response:', {
        success: data.success,
        message: data.message,
        hasData: !!data.data
      });
      return data;
    } catch (error) {
      const safeError = toSafeError(error);
      console.error('🔧 [GEMINI API] Request failed:', {
        endpoint,
        error: safeError.message,
        status: safeError.status
      });
      throw safeError;
    }
  }

  // Gestión de configuración Gemini
  async getGeminiConfig(token: string): Promise<{ success: boolean; data?: GeminiConfigData; message?: string }> {
    try {
      console.log('🔧 [GEMINI API] Obteniendo configuración con token:', token ? 'TOKEN_PRESENTE' : 'NO_TOKEN');
      
      const response = await this.request<any>(`/api/v2/gemini/config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-access-token': token // 🔧 SOLUCIÓN: Añadir header alternativo
        }
      });
      
      console.log('🔧 [GEMINI API] Configuración obtenida exitosamente');
      
      return {
        success: true,
        data: response.data,
        message: response.message || 'Configuración obtenida exitosamente'
      };
    } catch (error) {
      logError('GEMINI API - getGeminiConfig', error);
      return {
        success: false,
        message: getErrorMessage(error)
      };
    }
  }

  async saveGeminiConfig(params: { token: string; config: Partial<GeminiConfigData> }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      console.log('🔧 [GEMINI API] Guardando configuración con token:', params.token ? 'TOKEN_PRESENTE' : 'NO_TOKEN');
      console.log('🔧 [GEMINI API] Endpoint:', `/api/v2/gemini/config/save`);
      console.log('🔧 [GEMINI API] Config data:', Object.keys(params.config));
      
      const response = await this.request<any>(`/api/v2/gemini/config/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${params.token}`,
          'x-access-token': params.token // 🔧 SOLUCIÓN: Añadir header alternativo que usa el backend
        },
        body: JSON.stringify({
          token: params.token, // 🔧 MANTENER también en body para compatibilidad
          ...params.config
        })
      });
      
      console.log('🔧 [GEMINI API] Respuesta exitosa:', response);
      
      return {
        success: true,
        data: response.data,
        message: response.message || 'Configuración guardada exitosamente'
      };
    } catch (error) {
      logError('GEMINI API - saveGeminiConfig', error, {
        hasToken: !!params.token,
        configKeys: Object.keys(params.config)
      });
      return {
        success: false,
        message: getErrorMessage(error)
      };
    }
  }

  async deleteGeminiConfig(params: { token: string; botId?: string; sesionId?: string }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      console.log('🔧 [GEMINI API] Eliminando configuración con token:', params.token ? 'TOKEN_PRESENTE' : 'NO_TOKEN');
      console.log('🔧 [GEMINI API] Parámetros de eliminación:', {
        botId: params.botId,
        sesionId: params.sesionId
      });
      
      const response = await this.request<any>(`/api/v2/gemini/config/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${params.token}`,
          'x-access-token': params.token // 🔧 SOLUCIÓN: Añadir header alternativo
        },
        body: JSON.stringify({
          token: params.token,
          botId: params.botId,
          sesionId: params.sesionId
        })
      });
      
      console.log('🔧 [GEMINI API] Configuración eliminada exitosamente:', response.data);
      
      return {
        success: true,
        data: response.data,
        message: response.message || 'Configuración eliminada exitosamente'
      };
    } catch (error) {
      logError('GEMINI API - deleteGeminiConfig', error, {
        botId: params.botId,
        sesionId: params.sesionId
      });
      return {
        success: false,
        message: getErrorMessage(error)
      };
    }
  }

  // Procesamiento de IA - Usar endpoint CORRECTO del proyecto
  async processIADirect(data: ProcessIARequest): Promise<ProcessIAResponse> {
    try {
      console.log('🔧 [GEMINI API] Iniciando procesamiento IA con token:', !!data.token);
      
      // 🔧 SOLUCIÓN: Agregar token JWT a los headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (data.token) {
        headers['Authorization'] = `Bearer ${data.token}`;
        headers['x-access-token'] = data.token;
        console.log('🔧 [GEMINI API] Token agregado a headers para autenticación');
      } else {
        console.warn('🔧 [GEMINI API] ⚠️ No se proporcionó token - la petición fallará');
      }
      
      const response = await this.request<any>(`/api/v2/gemini/process`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          body: data.body,
          number: data.number,
          // Enviar botId si está disponible
          botId: (data as any).botId || undefined
        })
      });
      
      return {
        success: true,
        data: response.data,
        message: response.message,
        response: response.data?.response,
        thinking: response.data?.thinking,
        usage: response.data?.usage
      };
    } catch (error) {
      logError('GEMINI API - processIADirect', error);
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  async processWithIA(params: { token: string; body: string; number: string; configId?: string }): Promise<ProcessIAResponse> {
    try {
      // Este método requiere configuración previa guardada en BD
      const response = await this.request<any>(`/wa/process`, {
        method: 'POST',
        body: JSON.stringify({
          lineaWA: params.number,
          mensaje_reciente: params.body,
          token: params.token,
          configId: params.configId // Añadir configId para usar configuración específica
        })
      });
      
      return {
        success: true,
        data: response.data,
        message: response.message,
        response: response.response,
        thinking: response.thinking,
        usage: response.usage
      };
    } catch (error) {
      logError('GEMINI API - processWithIA', error);
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  // Métodos adicionales para WhatsApp avanzado
  async sendBulkMessages(params: {
    token: string;
    sessionId: string;
    messages: Array<{
      to: string;
      message: string;
      delay?: number;
    }>;
  }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await this.request<any>(`/api/v2/whatsapp/bulk-send`, {
        method: 'POST',
        body: JSON.stringify(params)
      });
      
      return {
        success: true,
        data: response.data,
        message: response.message || 'Mensajes masivos enviados exitosamente'
      };
    } catch (error) {
      logError('GEMINI API - sendBulkMessages', error);
      return {
        success: false,
        message: getErrorMessage(error)
      };
    }
  }

  async getAdvancedStats(token: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await this.request<any>(`/api/v2/stats/advanced`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      return {
        success: true,
        data: response.data,
        message: response.message || 'Estadísticas avanzadas obtenidas exitosamente'
      };
    } catch (error) {
      logError('GEMINI API - getAdvancedStats', error);
      return {
        success: false,
        message: getErrorMessage(error)
      };
    }
  }
}

// Instancia singleton
const enhancedBaileysAPI = new EnhancedBaileysAPI();

// Hook personalizado para usar la API
export const useGeminiAPI = () => {
  return enhancedBaileysAPI;
};

// Mantener compatibilidad con nombre anterior
export const useEnhancedBaileysAPI = useGeminiAPI;

// Exportar tipos e instancia
export default enhancedBaileysAPI;
export { enhancedBaileysAPI };
