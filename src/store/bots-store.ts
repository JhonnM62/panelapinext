import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BotCreado {
  _id: string;
  nombreBot: string;
  descripcion?: string;
  sesionId: string;
  numeroWhatsapp: string;
  estadoBot: "activo" | "inactivo" | "configurando";
  planUsuario: string;
  fechaCreacion: string;
  ultimaActividad: string;
}

export interface SesionDisponible {
  sesionId: string;
  numeroWhatsapp: string;
  estado: string;
  disponible: boolean;
}

interface BotsStore {
  // Estado
  bots: BotCreado[];
  sesionesDisponibles: SesionDisponible[];
  botSeleccionado: BotCreado | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  setBots: (bots: BotCreado[]) => void;
  setSesionesDisponibles: (sesiones: SesionDisponible[]) => void;
  setBotSeleccionado: (bot: BotCreado | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Métodos API
  loadBots: (token: string) => Promise<void>;
  loadSesionesDisponibles: (token: string) => Promise<void>;
  createBot: (
    token: string,
    data: { nombreBot: string; descripcion?: string; sesionId: string }
  ) => Promise<boolean>;
  deleteBot: (token: string, botId: string) => Promise<boolean>;
  updateBot: (
    token: string,
    botId: string,
    data: { nombreBot?: string; estadoBot?: string }
  ) => Promise<boolean>;

  // Utilidades
  getBotById: (botId: string) => BotCreado | undefined;
  getBotsBySesion: (sesionId: string) => BotCreado[];
  getLimitesPlan: (plan: string) => number;
  canCreateBot: (plan: string) => boolean;
}

const LIMITES_PLAN = {
  "14dias": 1,
  "6meses": 3,
  "1año": 5,
  vitalicio: 10,
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend.autosystemprojects.site";

export const useBotsStore = create<BotsStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      bots: [],
      sesionesDisponibles: [],
      botSeleccionado: null,
      isLoading: false,
      error: null,

      // Acciones básicas
      setBots: (bots) => set({ bots }),
      setSesionesDisponibles: (sesiones) =>
        set({ sesionesDisponibles: sesiones }),
      setBotSeleccionado: (bot) => set({ botSeleccionado: bot }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Métodos API
      loadBots: async (token: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_URL}/api/v2/bots/user`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();
          if (data.success) {
            set({ bots: data.data || [], isLoading: false });
          } else {
            set({
              error: data.message || "Error cargando bots",
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error cargando bots:", error);
          set({
            error: error instanceof Error ? error.message : "Error desconocido",
            isLoading: false,
          });
        }
      },

      loadSesionesDisponibles: async (token: string) => {
        try {
          const response = await fetch(
            `${API_URL}/api/v2/bots/sessions-available`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();
          if (data.success) {
            set({ sesionesDisponibles: data.data || [] });
          }
        } catch (error) {
          console.error("Error cargando sesiones disponibles:", error);
        }
      },

      createBot: async (token: string, botData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_URL}/api/v2/bots/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              token,
              ...botData,
            }),
          });

          const data = await response.json();
          if (data.success) {
            // Recargar bots y sesiones disponibles
            await get().loadBots(token);
            await get().loadSesionesDisponibles(token);
            set({ isLoading: false });
            return true;
          } else {
            set({
              error: data.message || "Error creando bot",
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error("Error creando bot:", error);
          set({
            error: error instanceof Error ? error.message : "Error desconocido",
            isLoading: false,
          });
          return false;
        }
      },

      deleteBot: async (token: string, botId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${API_URL}/api/v2/bots/delete/${botId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();
          if (data.success) {
            console.log("🗑️ Bot eliminado completamente:", data);
            // Recargar bots y sesiones disponibles
            await get().loadBots(token);
            await get().loadSesionesDisponibles(token);
            set({ isLoading: false });
            return true;
          } else {
            set({
              error: data.message || "Error eliminando bot",
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error("Error eliminando bot:", error);
          set({
            error: error instanceof Error ? error.message : "Error desconocido",
            isLoading: false,
          });
          return false;
        }
      },

      updateBot: async (token: string, botId: string, updateData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${API_URL}/api/v2/bots/update/${botId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(updateData),
            }
          );

          const data = await response.json();
          if (data.success) {
            console.log("🔄 Bot actualizado:", data);
            // Recargar bots
            await get().loadBots(token);
            set({ isLoading: false });
            return true;
          } else {
            set({
              error: data.message || "Error actualizando bot",
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error("Error actualizando bot:", error);
          set({
            error: error instanceof Error ? error.message : "Error desconocido",
            isLoading: false,
          });
          return false;
        }
      },

      // Utilidades
      getBotById: (botId: string) => {
        const { bots } = get();
        return bots.find((bot) => bot._id === botId);
      },

      getBotsBySesion: (sesionId: string) => {
        const { bots } = get();
        return bots.filter((bot) => bot.sesionId === sesionId);
      },

      getLimitesPlan: (plan: string) => {
        return LIMITES_PLAN[plan as keyof typeof LIMITES_PLAN] || 1;
      },

      canCreateBot: (plan: string) => {
        const { bots } = get();
        const limite = get().getLimitesPlan(plan);
        return bots.length < limite;
      },
    }),
    {
      name: "bots-store",
      partialize: (state) => ({
        bots: state.bots,
        botSeleccionado: state.botSeleccionado,
      }),
    }
  )
);

export default useBotsStore;
