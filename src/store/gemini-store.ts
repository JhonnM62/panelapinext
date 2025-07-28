import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGeminiAPI, type GeminiConfigData, type ProcessIARequest, type ProcessIAResponse } from '@/lib/gemini-api';
import { useServerConfigStore } from './server-config-store';

export interface GeminiConfig {
  botId?: string; // ID del bot asociado (nuevo)
  sesionId: string; // ID de la sesión de WhatsApp (requerido)
  phoneNumber?: string; // Número de teléfono (opcional - se extrae del webhook)
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
}

export interface GeminiStore {
  // Estado
  config: GeminiConfig | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  lastTest: ProcessIAResponse | null;
  
  // Configuración predeterminada
  defaultConfig: Partial<GeminiConfig>;
  
  // Acciones
  setConfig: (config: Partial<GeminiConfig>) => void;
  updateField: (field: keyof GeminiConfig, value: any) => void;
  loadConfig: (token: string) => Promise<void>;
  saveConfig: (token: string) => Promise<void>;
  deleteConfig: (token: string, options?: { botId?: string; sesionId?: string }) => Promise<void>;
  testConfig: (testMessage?: string, token?: string) => Promise<ProcessIAResponse>;
  processMessage: (token: string, body: string, number: string) => Promise<ProcessIAResponse>;
  resetConfig: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultGeminiConfig: Partial<GeminiConfig> = {
  server: 'http://100.42.185.2:8015', // 🔧 VALOR POR DEFECTO: Se actualiza dinámicamente desde configuración del usuario
  pais: 'colombia',
  idioma: 'es',
  numerodemensajes: 8,
  delay_seconds: 8,
  temperature: 0.0,
  topP: 0.9,
  maxOutputTokens: 512,
  pause_timeout_minutes: 30,
  ai_model: 'gemini-2.5-flash',
  thinking_budget: -1,
  activo: true,
};

export const useGeminiStore = create<GeminiStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      config: null,
      isLoading: false,
      error: null,
      isConfigured: false,
      lastTest: null,
      defaultConfig: defaultGeminiConfig,

      // Acciones
      setConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.defaultConfig, ...newConfig } as GeminiConfig,
          isConfigured: !!(newConfig.userbot && newConfig.apikey && newConfig.promt && newConfig.sesionId),
          error: null,
        }));
      },

      updateField: (field, value) => {
        set((state) => {
          const updatedConfig = state.config 
            ? { ...state.config, [field]: value }
            : { ...state.defaultConfig, [field]: value } as GeminiConfig;
          
          // 🔧 VALIDACIÓN actualizada - phoneNumber ya NO es requerido
          const isConfigured = !!(updatedConfig.userbot && 
                                   updatedConfig.apikey && 
                                   updatedConfig.promt &&
                                   updatedConfig.sesionId);
          
          console.log('🤖 [STORE] updateField:', {
            field,
            value,
            isConfigured,
            autoSave: field === 'activo'
          });
          
          return {
            config: updatedConfig,
            isConfigured,
            error: null,
          };
        });
        
        // 🎯 AUTO-GUARDADO: Si cambia 'activo', guardar automáticamente
        if (field === 'activo') {
          const currentConfig = get().config;
          if (currentConfig?.userbot && currentConfig?.apikey) {
            // Obtener token de useAuthStore o localStorage
            const token = localStorage.getItem('auth-token') || 
                         localStorage.getItem('token') || 
                         '';
            if (token) {
              console.log('🤖 [STORE] Auto-guardando configuración activo:', value);
              setTimeout(() => {
                get().saveConfig(token).catch(error => {
                  console.error('🤖 [STORE] Error auto-guardando:', error);
                });
              }, 100); // Pequeño delay para asegurar estado actualizado
            } else {
              console.warn('🤖 [STORE] No se encontró token para auto-guardado');
            }
          }
        }
      },

      loadConfig: async (token: string) => {
        // Validar token antes de hacer la petición
        if (!token || token.trim() === '') {
          set({ 
            config: null, 
            isConfigured: false, 
            isLoading: false, 
            error: 'Token de autenticación no disponible' 
          });
          return;
        }

        // 🔧 SINCRONIZAR con configuración de servidor antes de cargar
        const serverConfigStore = useServerConfigStore.getState();
        if (serverConfigStore.config?.server) {
          // Actualizar el servidor por defecto si está configurado
          defaultGeminiConfig.server = serverConfigStore.config.server;
        }

        set({ isLoading: true, error: null });
        
        try {
          const api = useGeminiAPI();
          const response = await api.getGeminiConfig(token);
          
          if (response.success) {
            const configData = response.data;
            console.log('🤖 [STORE] Configuración cargada:', {
              hasApikey: !!configData.apikey,
              apikeyPreview: configData.apikey,
              apikey_full: configData.apikey_full
            });
            
            set({
              config: {
                ...defaultGeminiConfig,
                ...configData,
                // 🔧 API key completa sin restricciones de seguridad
                apikey: configData.apikey || '',
              } as GeminiConfig,
              isConfigured: !!(configData.userbot && configData.apikey && configData.promt && configData.sesionId),
              isLoading: false,
              error: null,
            });
          } else {
            set({
              config: null,
              isConfigured: false,
              isLoading: false,
              error: response.message || 'Error cargando configuración',
            });
          }
        } catch (error) {
          console.error('Error loading Gemini config:', error);
          set({
            config: null,
            isConfigured: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      },

      saveConfig: async (token: string) => {
        const { config } = get();
        if (!config) return;

        set({ isLoading: true, error: null });
        
        try {
          const api = useGeminiAPI();
          const response = await api.saveGeminiConfig({
            token,
            config: {
              ...config,
              fechaCreacion: undefined,
              ultimaActualizacion: undefined,
            },
          });
          
          if (response.success) {
            set({
              isConfigured: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: response.message || 'Error guardando configuración',
            });
          }
        } catch (error) {
          console.error('Error saving Gemini config:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      },

      deleteConfig: async (token: string, options?: { botId?: string; sesionId?: string }) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🗑️ [STORE] Iniciando eliminación de bot:', {
            hasToken: !!token,
            botId: options?.botId,
            sesionId: options?.sesionId
          });
          
          const api = useGeminiAPI();
          const response = await api.deleteGeminiConfig({
            token,
            botId: options?.botId,
            sesionId: options?.sesionId || get().config?.sesionId
          });
          
          if (response.success) {
            console.log('🗑️ [STORE] Bot eliminado exitosamente, limpiando estado...');
            
            // 🔧 LIMPIAR COMPLETAMENTE el estado y localStorage
            set({
              config: null,
              isConfigured: false,
              isLoading: false,
              error: null,
              lastTest: null
            });
            
            // 🔧 LIMPIAR localStorage completamente
            try {
              localStorage.removeItem('gemini-config');
              localStorage.removeItem('gemini-store');
              localStorage.removeItem('gemini-automation');
              localStorage.removeItem('bot-config');
              console.log('🗑️ [STORE] localStorage limpiado completamente');
            } catch (storageError) {
              console.warn('🗑️ [STORE] Error limpiando localStorage:', storageError);
            }
            
            console.log('🗑️ [STORE] Eliminación completada exitosamente');
          } else {
            console.error('🗑️ [STORE] Error en respuesta de eliminación:', response.message);
            set({
              isLoading: false,
              error: response.message || 'Error eliminando configuración',
            });
          }
        } catch (error) {
          console.error('🗑️ [STORE] Error eliminando configuración Gemini:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      },

      testConfig: async (testMessage = 'Hola, este es un mensaje de prueba para verificar la configuración de Gemini', token?: string) => {
        const { config } = get();
        if (!config) {
          const error = { success: false, error: 'No hay configuración para probar' };
          set({ lastTest: error });
          return error;
        }

        set({ isLoading: true, error: null });
        
        try {
          const api = useGeminiAPI();
          
          // 🔧 USAR token proporcionado o fallback a localStorage
          const authToken = token || localStorage.getItem('token');
          console.log('🤖 [TEST] Token para autenticación:', {
            fromParam: !!token,
            fromLocalStorage: !!localStorage.getItem('token'),
            hasToken: !!authToken,
            tokenLength: authToken ? authToken.length : 0,
            tokenPreview: authToken ? authToken.substring(0, 20) + '...' : 'NO_TOKEN'
          });
          
          if (!authToken || authToken.trim() === '') {
            throw new Error('No se encontró token de autenticación. Por favor inicia sesión nuevamente.');
          }
          
          // 🔧 USAR endpoint correcto con datos simplificados
          const result = await api.processIADirect({
            body: testMessage,
            number: config.phoneNumber || '123456789',
            token: authToken,
            botId: config.botId, // ID del bot si está disponible
            // Campos requeridos por compatibilidad
            userbot: config.sesionId || config.userbot, // 🔧 CORREGIDO: Usar sesionId como userbot
            apikey: config.apikey,
            server: config.server,
            promt: config.promt,
            pais: config.pais,
            idioma: config.idioma,
            numerodemensajes: config.numerodemensajes,
            delay_seconds: config.delay_seconds,
            temperature: config.temperature,
            topP: config.topP,
            maxOutputTokens: config.maxOutputTokens,
            pause_timeout_minutes: config.pause_timeout_minutes,
            ai_model: config.ai_model,
            thinking_budget: config.thinking_budget
          });
          
          set({
            lastTest: result,
            isLoading: false,
            error: result.success ? null : result.error || 'Error en la prueba',
          });
          
          return result;
        } catch (error) {
          console.error('Error testing Gemini config:', error);
          const errorResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          };
          set({
            lastTest: errorResult,
            isLoading: false,
            error: errorResult.error,
          });
          return errorResult;
        }
      },

      processMessage: async (token: string, body: string, number: string) => {
        const { config } = get();
        if (!config) {
          return { success: false, error: 'No hay configuración de Gemini' };
        }

        set({ isLoading: true, error: null });
        
        try {
          const api = useGeminiAPI();
          const result = await api.processWithIA({
            token,
            body,
            number,
          });
          
          set({
            isLoading: false,
            error: result.success ? null : result.error || 'Error procesando mensaje',
          });
          
          return result;
        } catch (error) {
          console.error('Error processing message with IA:', error);
          const errorResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          };
          set({
            isLoading: false,
            error: errorResult.error,
          });
          return errorResult;
        }
      },

      resetConfig: () => {
        console.log('🔄 [STORE] Reiniciando configuración a valores por defecto...');
        
        // Limpiar localStorage
        try {
          localStorage.removeItem('gemini-config');
          localStorage.removeItem('gemini-store');
          localStorage.removeItem('gemini-automation');
          localStorage.removeItem('bot-config');
          console.log('🔄 [STORE] localStorage limpiado durante reset');
        } catch (storageError) {
          console.warn('🔄 [STORE] Error limpiando localStorage durante reset:', storageError);
        }
        
        set({
          config: null,
          isConfigured: false,
          error: null,
          lastTest: null,
          isLoading: false
        });
        
        console.log('🔄 [STORE] Configuración reiniciada completamente');
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'gemini-config',
      // Solo persistir algunos campos
      partialize: (state) => ({
        config: state.config,
        isConfigured: state.isConfigured,
      }),
    }
  )
);

// Hook personalizado para usar el store
export const useGeminiConfig = () => {
  const store = useGeminiStore();
  
  return {
    ...store,
    // Métodos de conveniencia
    hasValidConfig: store.config && store.config.userbot && store.config.apikey && store.config.promt && store.config.sesionId,
    isReadyToUse: store.isConfigured && !store.isLoading && !store.error,
  };
};

export default useGeminiStore;
