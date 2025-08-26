import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tipos para configuración de servidores
export interface ServerConfig {
  backendUrl: string;
  pythonApiUrl: string;
  webhookUrl: string;
  customUrls: {
    enabled: boolean;
    backendCustom: string;
    pythonApiCustom: string;
    webhookCustom: string;
  };
  lastUpdated?: string;
  testResults?: {
    backend: {
      status: "healthy" | "unhealthy" | "unreachable" | "unknown";
      lastTested?: string;
      responseTime?: number;
    };
    pythonApi: {
      status: "healthy" | "unhealthy" | "unreachable" | "unknown";
      lastTested?: string;
      responseTime?: number;
    };
  };
}

export interface ServerTestResult {
  url: string;
  type: "backend" | "python" | "webhook";
  status: "healthy" | "unhealthy" | "unreachable" | "unknown";
  statusCode?: number;
  accessible: boolean;
  testEndpoint: string;
  testedAt: string;
  error?: string;
}

export interface ServerConfigStore {
  // Estado
  config: ServerConfig | null;
  isLoading: boolean;
  error: string | null;
  testResults: ServerTestResult[];
  isTestingConnection: boolean;

  // Configuración por defecto
  defaultConfig: ServerConfig;

  // Acciones
  setConfig: (config: Partial<ServerConfig>) => void;
  updateField: (field: keyof ServerConfig, value: any) => void;
  loadConfig: (token: string) => Promise<void>;
  saveConfig: (token: string) => Promise<void>;
  testConnection: (
    url: string,
    type: "backend" | "python" | "webhook",
    token: string
  ) => Promise<ServerTestResult>;
  resetConfig: (token: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // Utilidades
  getActiveBackendUrl: () => string;
  getActivePythonApiUrl: () => string;
  getActiveWebhookUrl: () => string;
}

const defaultServerConfig: ServerConfig = {
  backendUrl: "https://backend.autosystemprojects.site",
  pythonApiUrl: "http://100.42.185.2:8014",
  webhookUrl: "https://backend.autosystemprojects.site/webhook",
  customUrls: {
    enabled: false,
    backendCustom: "",
    pythonApiCustom: "",
    webhookCustom: "",
  },
  testResults: {
    backend: { status: "unknown" },
    pythonApi: { status: "unknown" },
  },
};

export const useServerConfigStore = create<ServerConfigStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      config: null,
      isLoading: false,
      error: null,
      testResults: [],
      isTestingConnection: false,
      defaultConfig: defaultServerConfig,

      // Acciones
      setConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.defaultConfig, ...newConfig } as ServerConfig,
          error: null,
        }));
      },

      updateField: (field, value) => {
        set((state) => {
          const updatedConfig = state.config
            ? { ...state.config, [field]: value }
            : ({ ...state.defaultConfig, [field]: value } as ServerConfig);

          return {
            config: updatedConfig,
            error: null,
          };
        });
      },

      loadConfig: async (token: string) => {
        if (!token || token.trim() === "") {
          set({
            config: defaultServerConfig,
            isLoading: false,
            error: "Token de autenticación no disponible",
          });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://backend.autosystemprojects.site";
          const response = await fetch(`${API_URL}/api/v2/server-config`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();

          if (result.success) {
            set({
              config: result.data.serverConfig,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              config: defaultServerConfig,
              isLoading: false,
              error:
                result.message || "Error cargando configuración de servidores",
            });
          }
        } catch (error) {
          console.error("Error loading server config:", error);
          set({
            config: defaultServerConfig,
            isLoading: false,
            error: error instanceof Error ? error.message : "Error desconocido",
          });
        }
      },

      saveConfig: async (token: string) => {
        const { config } = get();
        if (!config) return;

        set({ isLoading: true, error: null });

        try {
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://backend.autosystemprojects.site";
          const response = await fetch(`${API_URL}/api/v2/server-config`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ serverConfig: config }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();

          if (result.success) {
            set({
              config: result.data.serverConfig,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: result.message || "Error guardando configuración",
            });
          }
        } catch (error) {
          console.error("Error saving server config:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Error desconocido",
          });
        }
      },

      testConnection: async (
        url: string,
        type: "backend" | "python" | "webhook",
        token: string
      ) => {
        set({ isTestingConnection: true, error: null });

        try {
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://backend.autosystemprojects.site";
          const response = await fetch(`${API_URL}/api/v2/server-config/test`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, type }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();
          const testResult = result.data as ServerTestResult;

          set((state) => ({
            testResults: [testResult, ...state.testResults.slice(0, 9)], // Mantener últimos 10 resultados
            isTestingConnection: false,
            error: null,
          }));

          return testResult;
        } catch (error) {
          console.error("Error testing connection:", error);
          const errorResult: ServerTestResult = {
            url,
            type,
            status: "unreachable",
            accessible: false,
            testEndpoint: url,
            testedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Error desconocido",
          };

          set((state) => ({
            testResults: [errorResult, ...state.testResults.slice(0, 9)],
            isTestingConnection: false,
            error: errorResult.error,
          }));

          return errorResult;
        }
      },

      resetConfig: async (token: string) => {
        set({ isLoading: true, error: null });

        try {
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL ||
            "https://backend.autosystemprojects.site";
          const response = await fetch(
            `${API_URL}/api/v2/server-config/reset`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const result = await response.json();

          if (result.success) {
            set({
              config: result.data.serverConfig,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              isLoading: false,
              error: result.message || "Error restableciendo configuración",
            });
          }
        } catch (error) {
          console.error("Error resetting server config:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Error desconocido",
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Utilidades
      getActiveBackendUrl: () => {
        const { config } = get();
        if (!config) return defaultServerConfig.backendUrl;

        if (config.customUrls.enabled && config.customUrls.backendCustom) {
          return config.customUrls.backendCustom;
        }

        return config.backendUrl;
      },

      getActivePythonApiUrl: () => {
        const { config } = get();
        if (!config) return defaultServerConfig.pythonApiUrl;

        if (config.customUrls.enabled && config.customUrls.pythonApiCustom) {
          return config.customUrls.pythonApiCustom;
        }

        return config.pythonApiUrl;
      },

      getActiveWebhookUrl: () => {
        const { config } = get();
        if (!config) return defaultServerConfig.webhookUrl;

        if (config.customUrls.enabled && config.customUrls.webhookCustom) {
          return config.customUrls.webhookCustom;
        }

        return config.webhookUrl;
      },
    }),
    {
      name: "server-config",
      // Solo persistir configuración básica por seguridad
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);

// Hook personalizado para usar el store
export const useServerConfig = () => {
  const store = useServerConfigStore();

  return {
    ...store,
    // Métodos de conveniencia
    isConfigured: !!store.config,
    hasCustomUrls: store.config?.customUrls.enabled || false,
    isServerHealthy: (type: "backend" | "pythonApi") => {
      return store.config?.testResults?.[type]?.status === "healthy";
    },
  };
};

export default useServerConfigStore;
