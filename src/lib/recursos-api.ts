import { planesApi } from "./plans";

// 🔧 **API PARA GESTIÓN DE RECURSOS CON LÍMITES**
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend.autosystemprojects.site";

// Interfaces para recursos
export interface Session {
  id: string;
  name: string;
  status: "authenticated" | "connecting" | "disconnected";
  qr?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface BotIA {
  id: string;
  nombre: string;
  descripcion: string;
  sesionId: string;
  tipoBot: "ia";
  configIA: {
    activo: boolean;
    userbot: string;
    apikey: string;
    promt: string;
    ai_model: string;
  };
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: string;
  userId: string;
  sessionId: string;
  events: string[];
  webhookUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// 🔧 **FUNCIONES PARA SESIONES**
export const sesionesApi = {
  // Obtener todas las sesiones del usuario
  async obtenerSesiones(): Promise<Session[]> {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch(
        `${API_BASE_URL}/api/v2/sesiones/user?token=${token}`
      );
      if (!response.ok) throw new Error("Error al obtener sesiones");

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error("Error obteniendo sesiones:", error);
      return [];
    }
  },

  // Crear nueva sesión
  async crearSesion(
    nombre: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Verificar límites primero
      const verificacion = await planesApi.verificarLimites("sesion");
      if (!verificacion.permitido) {
        return {
          success: false,
          error: `Has alcanzado el límite de sesiones (${verificacion.usoActual}/${verificacion.limite}) para tu plan ${verificacion.plan}`,
        };
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch(`${API_BASE_URL}/sessions/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: nombre,
          token: token,
        }),
      });

      const data = await response.json();
      return {
        success: data.success || response.ok,
        data: data.data,
        error: data.success ? undefined : data.message,
      };
    } catch (error) {
      console.error("Error creando sesión:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },

  // Eliminar sesión
  async eliminarSesion(
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/sessions/delete/${sessionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      return {
        success: data.success || response.ok,
        error: data.success ? undefined : data.message,
      };
    } catch (error) {
      console.error("Error eliminando sesión:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },
};

// 🔧 **FUNCIONES PARA BOTS IA**
export const botsIAApi = {
  // Obtener todos los bots IA del usuario
  async obtenerBots(): Promise<BotIA[]> {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado");

      // Obtener la configuración de Gemini que contiene los bots IA
      const response = await fetch(`${API_BASE_URL}/api/v2/gemini/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No hay bots configurados
        }
        throw new Error("Error al obtener bots IA");
      }

      const data = await response.json();

      // Convertir el formato de respuesta a array de bots
      if (data.success && data.data) {
        return [
          {
            id: data.data.botId,
            nombre: data.data.nombreBot,
            descripcion: data.data.descripcion || "Bot IA configurado",
            sesionId: data.data.sesionId,
            tipoBot: "ia" as const,
            configIA: {
              activo: data.data.activo,
              userbot: data.data.userbot,
              apikey: data.data.apikey ? "Configurado" : "No configurado",
              promt: data.data.promt,
              ai_model: data.data.ai_model,
            },
            estado: data.data.activo ? "activo" : "pausado",
            createdAt: data.data.fechaCreacion,
            updatedAt: data.data.ultimaActualizacion,
          },
        ];
      }

      return [];
    } catch (error) {
      console.error("Error obteniendo bots IA:", error);
      return [];
    }
  },

  // Crear/configurar nuevo bot IA
  async crearBot(config: {
    sesionId: string;
    userbot: string;
    apikey: string;
    promt: string;
    ai_model?: string;
    activo?: boolean;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Verificar límites primero
      const verificacion = await planesApi.verificarLimites("botIA");
      if (!verificacion.permitido) {
        return {
          success: false,
          error: `Has alcanzado el límite de bots IA (${verificacion.usoActual}/${verificacion.limite}) para tu plan ${verificacion.plan}`,
        };
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch(
        `${API_BASE_URL}/api/v2/gemini/config/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sesionId: config.sesionId,
            userbot: config.userbot,
            apikey: config.apikey,
            promt: config.promt,
            ai_model: config.ai_model || "gemini-2.5-flash",
            activo: config.activo !== undefined ? config.activo : true,
          }),
        }
      );

      const data = await response.json();
      return {
        success: data.success,
        data: data.data,
        error: data.success ? undefined : data.message,
      };
    } catch (error) {
      console.error("Error creando bot IA:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },

  // Actualizar configuración de bot IA
  async actualizarBot(config: {
    sesionId?: string;
    userbot?: string;
    apikey?: string;
    promt?: string;
    ai_model?: string;
    activo?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch(
        `${API_BASE_URL}/api/v2/gemini/config/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(config),
        }
      );

      const data = await response.json();
      return {
        success: data.success,
        error: data.success ? undefined : data.message,
      };
    } catch (error) {
      console.error("Error actualizando bot IA:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },

  // Eliminar bot IA
  async eliminarBot(
    botId?: string,
    sesionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch(
        `${API_BASE_URL}/api/v2/gemini/config/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ botId, sesionId }),
        }
      );

      const data = await response.json();
      return {
        success: data.success,
        error: data.success ? undefined : data.message,
      };
    } catch (error) {
      console.error("Error eliminando bot IA:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },
};

// 🔧 **FUNCIONES PARA WEBHOOKS**
export const webhooksApi = {
  // Obtener todos los webhooks del usuario
  async obtenerWebhooks(): Promise<Webhook[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/webhook/list`);
      if (!response.ok) throw new Error("Error al obtener webhooks");

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error("Error obteniendo webhooks:", error);
      return [];
    }
  },

  // Crear nuevo webhook
  async crearWebhook(config: {
    userId: string;
    sessionId: string;
    events?: string[];
    webhookUrl?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Verificar límites primero
      const verificacion = await planesApi.verificarLimites("webhook");
      if (!verificacion.permitido) {
        return {
          success: false,
          error: `Has alcanzado el límite de webhooks (${verificacion.usoActual}/${verificacion.limite}) para tu plan ${verificacion.plan}`,
        };
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch(`${API_BASE_URL}/webhook/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: config.userId,
          sessionId: config.sessionId,
          events: config.events || ["ALL"],
          webhookUrl: config.webhookUrl || null,
        }),
      });

      const data = await response.json();
      return {
        success: data.success,
        data: data.data,
        error: data.success ? undefined : data.message,
      };
    } catch (error) {
      console.error("Error creando webhook:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },

  // Actualizar webhook
  async actualizarWebhook(
    webhookId: string,
    config: {
      events?: string[];
      webhookUrl?: string;
      active?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch(
        `${API_BASE_URL}/webhook/${webhookId}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(config),
        }
      );

      const data = await response.json();
      return {
        success: data.success,
        error: data.success ? undefined : data.message,
      };
    } catch (error) {
      console.error("Error actualizando webhook:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },

  // Eliminar webhook
  async eliminarWebhook(
    webhookId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No autenticado");

      const response = await fetch(
        `${API_BASE_URL}/webhook/${webhookId}/delete`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: data.success,
        error: data.success ? undefined : data.message,
      };
    } catch (error) {
      console.error("Error eliminando webhook:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  },
};

export default {
  sesionesApi,
  botsIAApi,
  webhooksApi,
};
