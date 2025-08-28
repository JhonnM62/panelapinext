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
  const { user, token } = useAuthStore();
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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

  const loadSuscripcion = useCallback(async (isRetry = false) => {
    if (!user || !token) {
      setLoading(false);
      setSuscripcion(null);
      setError(null);
      setRetryCount(0);
      return;
    }

    try {
      setLoading(true);
      console.log("📊 [PLAN LIMITS] 🔄 Iniciando carga, loading establecido a true");
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }

      // Verificar que el token esté en localStorage
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        console.warn('Token no encontrado en localStorage, esperando sincronización...');
        setLoading(false);
        return;
      }

      const data = await planesApi.obtenerSuscripcionActual();
      setSuscripcion(data);
      setRetryCount(0); // Reset retry count on success
      setLoading(false); // Marcar como completado en caso exitoso
      console.log("📊 [PLAN LIMITS] ✅ Carga completada, loading establecido a false");
      
      if (!data) {
        setError("No se pudo cargar la información del plan");
      }
    } catch (err: any) {
      console.error(`Error cargando suscripción (intento ${retryCount + 1}):`, err);
      
      const currentRetryCount = retryCount + 1;
      setRetryCount(currentRetryCount);
      
      // Auto-retry hasta 3 veces con delay exponencial
      if (currentRetryCount < 3 && !err.message?.includes('autenticado')) {
        const delay = Math.pow(2, currentRetryCount) * 1000; // 2s, 4s, 8s
        console.log(`Reintentando en ${delay/1000}s...`);
        
        setTimeout(() => {
          loadSuscripcion(true);
        }, delay);
        
        setError(`Error al cargar suscripción. Reintentando... (${currentRetryCount}/3)`);
      } else {
        // Error final después de todos los reintentos
        let errorMessage = "Error al cargar información del plan";
        
        if (err.message?.includes('autenticado')) {
          errorMessage = "Sesión expirada. Por favor, inicia sesión nuevamente.";
        } else if (err.message?.includes('Network')) {
          errorMessage = "Error de conexión. Verifica tu conexión a internet.";
        } else if (err.message?.includes('500')) {
          errorMessage = "Error del servidor. Intenta nuevamente más tarde.";
        }
        
        setError(errorMessage);
        setSuscripcion(null);
      }
    } finally {
      // Solo setear loading a false si no vamos a reintentar
      if (retryCount >= 2 || error?.includes('autenticado')) {
        setLoading(false);
      }
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
    setRetryCount(0);
    loadSuscripcion();
  }, [loadSuscripcion]);

  const retryLoadSuscripcion = useCallback(() => {
    setRetryCount(0);
    setError(null);
    loadSuscripcion();
  }, [loadSuscripcion]);

  useEffect(() => {
    if (user && token) {
      // Pequeño delay para asegurar que localStorage esté sincronizado
      const timeoutId = setTimeout(() => {
        loadSuscripcion();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, token]); // Depende de user y token para asegurar sincronización

  // 🔍 DEBUG: Log del estado actual del hook
  console.log("📊 [PLAN LIMITS] Estado actual del hook:", {
    loading,
    hasSuscripcion: !!suscripcion,
    hasResourceLimits: !!getResourceLimits(),
    error
  });

  return {
    suscripcion,
    loading,
    error,
    retryCount,
    resourceLimits: getResourceLimits(),
    canCreateResource,
    checkLimits,
    getResourceUsage,
    validateResourceCreation,
    createResource,
    incrementResourceUsage,
    decrementResourceUsage,
    refreshData,
    retryLoadSuscripcion,
  };
};
