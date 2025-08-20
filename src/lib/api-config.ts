/**
 * Configuración de endpoints para el frontend
 * Compatible con Next.js y TypeScript
 */

const API_CONFIG = {
  // Construir la URL base correctamente
  BASE_URL: (() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    // Si la URL ya incluye /api/v2, no la agregamos de nuevo
    return baseUrl.includes("/api/v2") ? baseUrl : `${baseUrl}/api/v2`;
  })(),

  // Endpoints de administración (requieren token admin)
  ADMIN: {
    // Usuarios
    USERS: "/admin/users",
    USER_BY_ID: (id: string) => `/admin/users/${id}`,

    // Sesiones
    SESSIONS: "/admin/sessions",
    SESSION_BY_ID: (id: string) => `/admin/sessions/${id}`,

    // Planes (admin)
    PLANS: "/admin/plans",
    PLAN_BY_ID: (id: string) => `/admin/plans/${id}`,

    // Webhooks
    WEBHOOKS: "/admin/webhooks",
    WEBHOOK_BY_ID: (id: string) => `/admin/webhooks/${id}`,

    // Chatbots
    CHATBOTS: "/admin/chatbots",
    CHATBOT_BY_ID: (id: string) => `/admin/chatbots/${id}`,

    // Estadísticas
    STATS: "/admin/stats",
  },

  // Endpoints públicos
  PUBLIC: {
    // Planes públicos (sin autenticación)
    PLANS: "/plans",
    PLAN_BY_ID: (id: string) => `/plans/${id}`,
    USER_SUBSCRIPTION: "/plans/user/subscription",
  },

  // Headers por defecto
  HEADERS: {
    "Content-Type": "application/json",
  },

  // Helper para headers con autenticación
  getAuthHeaders: (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }),
};

// Log para debug (solo en desarrollo)
if (process.env.NODE_ENV === "development") {
  console.log("🔧 API Config - BASE_URL:", API_CONFIG.BASE_URL);
}

export default API_CONFIG;

// Tipos para las respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
  error?: string;
}

// Funciones helper para hacer requests
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  // Log para debug (solo en desarrollo)
  if (process.env.NODE_ENV === "development") {
    console.log("🌐 API Request URL:", url);
  }

  const defaultOptions: RequestInit = {
    headers: API_CONFIG.HEADERS,
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

export const apiRequestAuth = async <T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...API_CONFIG.getAuthHeaders(token),
      ...options.headers,
    },
  });
};

// API específica para administración
export const adminAPI = {
  // Chatbots
  getChatbots: (token: string) =>
    apiRequestAuth<any[]>(API_CONFIG.ADMIN.CHATBOTS, token),

  getChatbotById: (id: string, token: string) =>
    apiRequestAuth<any>(API_CONFIG.ADMIN.CHATBOT_BY_ID(id), token),

  createChatbot: (chatbotData: any, token: string) =>
    apiRequestAuth<any>(API_CONFIG.ADMIN.CHATBOTS, token, {
      method: "POST",
      body: JSON.stringify(chatbotData),
    }),

  updateChatbot: (id: string, chatbotData: any, token: string) =>
    apiRequestAuth<any>(API_CONFIG.ADMIN.CHATBOT_BY_ID(id), token, {
      method: "PUT",
      body: JSON.stringify(chatbotData),
    }),

  deleteChatbot: (id: string, token: string) =>
    apiRequestAuth<any>(API_CONFIG.ADMIN.CHATBOT_BY_ID(id), token, {
      method: "DELETE",
    }),

  // Usuarios
  getUsers: (token: string) =>
    apiRequestAuth<any[]>(API_CONFIG.ADMIN.USERS, token),

  // Sesiones
  getSessions: (token: string) =>
    apiRequestAuth<any[]>(API_CONFIG.ADMIN.SESSIONS, token),

  // Planes
  getPlans: (token: string) =>
    apiRequestAuth<any[]>(API_CONFIG.ADMIN.PLANS, token),

  // Webhooks
  getWebhooks: (token: string) =>
    apiRequestAuth<any[]>(API_CONFIG.ADMIN.WEBHOOKS, token),

  // Estadísticas
  getStats: (token: string) =>
    apiRequestAuth<any>(API_CONFIG.ADMIN.STATS, token),
};

// API pública
export const publicAPI = {
  getPlans: () => apiRequest<any[]>(API_CONFIG.PUBLIC.PLANS),
  getPlanById: (id: string) =>
    apiRequest<any>(API_CONFIG.PUBLIC.PLAN_BY_ID(id)),
};
