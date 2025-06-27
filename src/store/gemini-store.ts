import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEnhancedBaileysAPI, type GeminiConfigData, type ProcessIARequest, type ProcessIAResponse } from '@/lib/enhanced-baileys-api';

export interface GeminiConfig {
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
  deleteConfig: (token: string) => Promise<void>;
  testConfig: (testMessage?: string) => Promise<ProcessIAResponse>;
  processMessage: (token: string, body: string, number: string) => Promise<ProcessIAResponse>;
  resetConfig: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultGeminiConfig: Partial<GeminiConfig> = {
  server: 'http://100.42.185.2:8015',
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
          isConfigured: !!(newConfig.userbot && newConfig.apikey && newConfig.promt),
          error: null,
        }));
      },

      updateField: (field, value) => {
        set((state) => ({
          config: state.config 
            ? { ...state.config, [field]: value }
            : { ...state.defaultConfig, [field]: value } as GeminiConfig,
          isConfigured: field === 'userbot' || field === 'apikey' || field === 'promt' 
            ? !!(value && state.config?.userbot && state.config?.apikey && state.config?.promt)
            : state.isConfigured,
          error: null,
        }));
      },

      loadConfig: async (token: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const api = useEnhancedBaileysAPI();
          const response = await api.getGeminiConfig(token);
          
          if (response.success) {
            const configData = response.data;
            set({
              config: {
                ...defaultGeminiConfig,
                ...configData,
                // No mostrar la API key real por seguridad
                apikey: configData.apikey === '***HIDDEN***' ? '' : configData.apikey,
              } as GeminiConfig,
              isConfigured: !!(configData.userbot && configData.apikey !== '***HIDDEN***' && configData.promt),
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
          const api = useEnhancedBaileysAPI();
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

      deleteConfig: async (token: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const api = useEnhancedBaileysAPI();
          const response = await api.deleteGeminiConfig({
            token,
            configId: '', // No se usa en el backend actual
          });
          
          if (response.success) {
            set({
              config: null,
              isConfigured: false,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: response.message || 'Error eliminando configuración',
            });
          }
        } catch (error) {
          console.error('Error deleting Gemini config:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      },

      testConfig: async (testMessage = 'Hola, este es un mensaje de prueba para verificar la configuración de Gemini') => {
        const { config } = get();
        if (!config) {
          const error = { success: false, error: 'No hay configuración para probar' };
          set({ lastTest: error });
          return error;
        }

        set({ isLoading: true, error: null });
        
        try {
          const api = useEnhancedBaileysAPI();
          const testData: ProcessIARequest = {
            body: testMessage,
            number: '123456789', // Número de prueba
            userbot: config.userbot,
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
            thinking_budget: config.thinking_budget,
          };

          const result = await api.processIADirect(testData);
          
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
          const api = useEnhancedBaileysAPI();
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
        set({
          config: { ...defaultGeminiConfig } as GeminiConfig,
          isConfigured: false,
          error: null,
          lastTest: null,
        });
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
      // Solo persistir algunos campos por seguridad
      partialize: (state) => ({
        config: state.config ? {
          ...state.config,
          apikey: '', // No persistir la API key por seguridad
        } : null,
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
    hasValidConfig: store.config && store.config.userbot && store.config.apikey && store.config.promt,
    isReadyToUse: store.isConfigured && !store.isLoading && !store.error,
  };
};

export default useGeminiStore;
