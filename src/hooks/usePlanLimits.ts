import { useState, useEffect, useCallback } from "react";
import { planesApi } from "@/lib/plans";
import { useAuthStore } from "@/store/auth";
import {
  ResourceLimits,
  LimitValidation,
  ResourceType,
  CreateResourceParams,
  Suscripcion,
} from "@/types/plans";

export const usePlanLimits = () => {
  const { user } = useAuthStore();
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateLimitValidation = useCallback(
    (current: number, limit: number): LimitValidation => {
      const remaining = Math.max(0, limit - current);
      const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;

      return {
        valid: current <= limit,
        current,
        limit,
        remaining,
        percentage,
        message:
          current >= limit
            ? "Límite alcanzado"
            : percentage >= 90
            ? "Cerca del límite"
            : percentage >= 70
            ? "Uso moderado"
            : "Disponible",
      };
    },
    []
  );

  const getResourceLimits = useCallback((): ResourceLimits | null => {
    if (!suscripcion) return null;

    // Validar que existan las propiedades necesarias
    if (!suscripcion.usoActual) {
      console.warn("usoActual no encontrado en suscripción");
      return null;
    }

    // Los límites están en suscripcion.plan.limites según la interfaz de planesApi
    const limites = suscripcion.plan?.limites;

    if (!limites) {
      console.warn("limites no encontrado en plan", suscripcion.plan);
      return null;
    }

    // 🔍 DEBUG: Mostrar límites del plan actual
    console.log("📊 [PLAN LIMITS] Plan actual:", suscripcion.plan?.nombre);
    console.log("📊 [PLAN LIMITS] Límites del plan:", limites);
    console.log("📊 [PLAN LIMITS] Uso actual:", suscripcion.usoActual);

    const { usoActual } = suscripcion;

    // Validar que existan las propiedades específicas con valores por defecto
    const sesionesUsadas = usoActual.sesiones ?? 0;
    const botsUsados = usoActual.botsIA ?? 0;
    const webhooksUsados = usoActual.webhooks ?? 0;

    const sesionesLimite = limites.sesiones ?? 0;
    const botsLimite = limites.botsIA ?? 0;
    const webhooksLimite = limites.webhooks ?? 0;

    const sesiones = calculateLimitValidation(sesionesUsadas, sesionesLimite);
    const botsIA = calculateLimitValidation(botsUsados, botsLimite);
    const webhooks = calculateLimitValidation(webhooksUsados, webhooksLimite);

    return {
      sesiones,
      botsIA,
      webhooks,
      canCreateMore: {
        sesiones: sesiones.remaining > 0,
        botsIA: botsIA.remaining > 0,
        webhooks: webhooks.remaining > 0,
      },
    };
  }, [suscripcion, calculateLimitValidation]);

  const loadSuscripcion = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const data = await planesApi.obtenerSuscripcionActual();
      setSuscripcion(data);
    } catch (err: any) {
      console.error("Error cargando suscripción:", err);
      setError(err.message || "Error al cargar información del plan");
      setSuscripcion(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const canCreateResource = useCallback(
    (type: ResourceType): boolean => {
      const limits = getResourceLimits();
      if (!limits) return false;

      return limits.canCreateMore[type];
    },
    [getResourceLimits]
  );

  const getResourceUsage = useCallback(
    (type: ResourceType): LimitValidation | null => {
      const limits = getResourceLimits();
      if (!limits) return null;

      return limits[type];
    },
    [getResourceLimits]
  );

  const incrementResourceUsage = useCallback(
    async (type: ResourceType) => {
      if (!suscripcion) return false;

      try {
        // Optimistically update the UI
        setSuscripcion((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            usoActual: {
              ...prev.usoActual,
              [type]: prev.usoActual[type] + 1,
              ultimaActualizacionUso: new Date().toISOString(),
            },
          };
        });

        // Call API to update usage
        await planesApi.actualizarUso(type, "incrementar", 1);
        return true;
      } catch (error) {
        console.error("Error incrementando uso:", error);
        // Revert optimistic update
        await loadSuscripcion();
        return false;
      }
    },
    [suscripcion, loadSuscripcion]
  );

  const decrementResourceUsage = useCallback(
    async (type: ResourceType) => {
      if (!suscripcion) return false;

      try {
        // Optimistically update the UI
        setSuscripcion((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            usoActual: {
              ...prev.usoActual,
              [type]: Math.max(0, prev.usoActual[type] - 1),
              ultimaActualizacionUso: new Date().toISOString(),
            },
          };
        });

        // Call API to update usage
        await planesApi.actualizarUso(type, "decrementar", 1);
        return true;
      } catch (error) {
        console.error("Error decrementando uso:", error);
        // Revert optimistic update
        await loadSuscripcion();
        return false;
      }
    },
    [suscripcion, loadSuscripcion]
  );

  const validateResourceCreation = useCallback(
    (
      type: ResourceType
    ): {
      canCreate: boolean;
      reason?: string;
    } => {
      if (!user) {
        return { canCreate: false, reason: "Usuario no autenticado" };
      }

      if (!suscripcion) {
        return { canCreate: false, reason: "No hay suscripción activa" };
      }

      if (!suscripcion.estaActiva) {
        return { canCreate: false, reason: "Suscripción expirada o inactiva" };
      }

      const limits = getResourceLimits();
      if (!limits) {
        return {
          canCreate: false,
          reason: "No se pudieron obtener los límites",
        };
      }

      const resourceLimit = limits[type];
      if (!resourceLimit.valid || resourceLimit.remaining <= 0) {
        return {
          canCreate: false,
          reason: `Límite alcanzado (${resourceLimit.current}/${resourceLimit.limit})`,
        };
      }

      return { canCreate: true };
    },
    [user, suscripcion, getResourceLimits]
  );

  const createResource = useCallback(
    async (
      params: CreateResourceParams
    ): Promise<{
      success: boolean;
      data?: any;
      error?: string;
    }> => {
      const validation = validateResourceCreation(params.type);

      if (!validation.canCreate) {
        return {
          success: false,
          error: validation.reason || "No se puede crear el recurso",
        };
      }

      try {
        let result: any;

        switch (params.type) {
          case "webhooks":
            // Create webhook through existing API
            result = await fetch(
              "https://backend.autosystemprojects.site/webhook/create",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user?.nombrebot,
                  sessionId: params.sessionId,
                  ...params.config,
                }),
              }
            ).then((res) => res.json());
            break;

          case "botsIA":
            // Create chatbot through API
            result = await fetch(
              "https://backend.autosystemprojects.site/chatbot/create",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: user?.nombrebot,
                  sessionId: params.sessionId,
                  ...params.config,
                }),
              }
            ).then((res) => res.json());
            break;

          default:
            throw new Error(`Tipo de recurso no soportado: ${params.type}`);
        }

        if (result.success) {
          // Increment usage count
          await incrementResourceUsage(params.type);

          return {
            success: true,
            data: result.data,
          };
        } else {
          return {
            success: false,
            error: result.message || "Error creando recurso",
          };
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Error inesperado",
        };
      }
    },
    [user, validateResourceCreation, incrementResourceUsage]
  );

  const checkLimits = useCallback(
    (type: ResourceType | "chatbots"): boolean => {
      if (type === "chatbots") {
        // Convertir 'chatbots' a 'botsIA' para compatibilidad
        return canCreateResource("botsIA");
      }
      return canCreateResource(type as ResourceType);
    },
    [canCreateResource]
  );

  const refreshData = useCallback(() => {
    loadSuscripcion();
  }, [loadSuscripcion]);

  useEffect(() => {
    loadSuscripcion();
  }, [loadSuscripcion]);

  return {
    suscripcion,
    loading,
    error,
    resourceLimits: getResourceLimits(),
    canCreateResource,
    checkLimits,
    getResourceUsage,
    validateResourceCreation,
    createResource,
    incrementResourceUsage,
    decrementResourceUsage,
    refreshData,
  };
};
