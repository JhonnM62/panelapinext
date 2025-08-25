'use client';

import { useState, useEffect } from 'react';
import { useGeminiAPI, GeminiConfigData, ProcessIAResponse } from '@/lib/gemini-api';
import { useAuthStore } from '@/store/auth';

interface UseGeminiConfig {
  config: GeminiConfigData | null;
  isLoading: boolean;
  error: string | undefined;
  saveConfig: (config: Omit<GeminiConfigData, 'id' | 'fechaCreacion' | 'ultimaActualizacion'>) => Promise<boolean>;
  updateConfig: (configId: string, config: Partial<GeminiConfigData>) => Promise<boolean>;
  deleteConfig: (configId: string) => Promise<boolean>;
  testConfig: (config: GeminiConfigData, testMessage?: string) => Promise<ProcessIAResponse>;
  processMessage: (body: string, number: string, configId?: string) => Promise<ProcessIAResponse>;
  refresh: () => Promise<void>;
}

/**
 * Hook para manejar la configuración de Gemini IA
 */
export const useGeminiConfig = (): UseGeminiConfig => {
  const [config, setConfig] = useState<GeminiConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const { token } = useAuthStore();
  const geminiAPI = useGeminiAPI();

  // Cargar configuración al montar el componente
  useEffect(() => {
    if (token) {
      loadConfig();
    }
  }, [token]);

  const loadConfig = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(undefined);
    
    try {
      const response = await geminiAPI.getGeminiConfig(token);
      if (response.success && response.data) {
        setConfig(response.data);
      } else {
        setError(response.message || 'Error al cargar configuración');
        setConfig(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: Omit<GeminiConfigData, 'id' | 'fechaCreacion' | 'ultimaActualizacion'>): Promise<boolean> => {
    if (!token) {
      setError('Token de autenticación no disponible');
      return false;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const response = await geminiAPI.saveGeminiConfig({
        token,
        config: newConfig
      });

      if (response.success) {
        setConfig(response.data);
        return true;
      } else {
        setError(response.message || 'Error al guardar configuración');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar configuración');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (configId: string, updates: Partial<GeminiConfigData>): Promise<boolean> => {
    if (!token) {
      setError('Token de autenticación no disponible');
      return false;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const response = await geminiAPI.saveGeminiConfig({
        token,
        config: { ...config, ...updates }
      });

      if (response.success) {
        setConfig(response.data);
        return true;
      } else {
        setError(response.message || 'Error al actualizar configuración');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar configuración');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConfig = async (configId: string): Promise<boolean> => {
    if (!token) {
      setError('Token de autenticación no disponible');
      return false;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const response = await geminiAPI.deleteGeminiConfig({
        token,
        botId: configId
      });

      if (response.success) {
        setConfig(null);
        return true;
      } else {
        setError(response.message || 'Error al eliminar configuración');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar configuración');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testConfig = async (testConfig: GeminiConfigData, testMessage?: string): Promise<ProcessIAResponse> => {
    setError(undefined);
    
    if (!token) {
      const errorMessage = 'Token de autenticación no disponible';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
    
    try {
      const response = await geminiAPI.processIADirect({
        body: testMessage || 'Mensaje de prueba',
        number: '1234567890',
        userbot: testConfig.userbot,
        apikey: testConfig.apikey,
        server: testConfig.server,
        promt: testConfig.promt,
        pais: testConfig.pais,
        idioma: testConfig.idioma,
        numerodemensajes: testConfig.numerodemensajes,
        delay_seconds: testConfig.delay_seconds,
        temperature: testConfig.temperature,
        topP: testConfig.topP,
        maxOutputTokens: testConfig.maxOutputTokens,
        pause_timeout_minutes: testConfig.pause_timeout_minutes,
        ai_model: testConfig.ai_model,
        thinking_budget: testConfig.thinking_budget,
        token
      });
      
      if (!response.success && response.error) {
        setError(response.error);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al probar configuración';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const processMessage = async (body: string, number: string, configId?: string): Promise<ProcessIAResponse> => {
    if (!token) {
      const errorMessage = 'Token de autenticación no disponible';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }

    setError(undefined);

    try {
      if (!config) {
        const errorMessage = 'No hay configuración disponible';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      const response = await geminiAPI.processIADirect({
        body,
        number,
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
        token
      });

      if (!response.success && response.error) {
        setError(response.error);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar mensaje';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const refresh = async () => {
    await loadConfig();
  };

  return {
    config,
    isLoading,
    error,
    saveConfig,
    updateConfig,
    deleteConfig,
    testConfig,
    processMessage,
    refresh
  };
};

/**
 * Hook para usar directamente la API de IA sin autenticación
 */
export const useDirectIA = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const geminiAPI = useGeminiAPI();

  const processIADirect = async (data: {
    body: string;
    number: string;
    config: GeminiConfigData;
  }): Promise<ProcessIAResponse> => {
    setIsProcessing(true);
    setError(undefined);

    try {
      const response = await geminiAPI.processIADirect({
        body: data.body,
        number: data.number,
        userbot: data.config.userbot,
        apikey: data.config.apikey,
        server: data.config.server,
        promt: data.config.promt,
        pais: data.config.pais,
        idioma: data.config.idioma,
        numerodemensajes: data.config.numerodemensajes,
        delay_seconds: data.config.delay_seconds,
        temperature: data.config.temperature,
        topP: data.config.topP,
        maxOutputTokens: data.config.maxOutputTokens,
        pause_timeout_minutes: data.config.pause_timeout_minutes,
        ai_model: data.config.ai_model,
        thinking_budget: data.config.thinking_budget
      });

      if (!response.success && response.error) {
        setError(response.error);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar con IA';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    error,
    processIADirect
  };
};

export default useGeminiConfig;