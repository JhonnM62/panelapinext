// Interfaces TypeScript para el admin panel

export interface User {
  _id: string;
  email: string;
  rol: string;
  tipoplan: string;
  numerodesesiones: number;
  fechaCreacion: string;
  ultimoAcceso?: string;
  activo: boolean;
  membresiaVencimiento?: string;
  estadisticas?: {
    sesionesCreadas: number;
    mensajesEnviados: number;
    ultimaActividad?: string;
  };
  suscripcion?: {
    plan: string;
    estado: string;
    fechaFin: string;
  } | null;
}

export interface Session {
  _id: string;
  sessionId: string;
  userId: string;
  userEmail: string;
  estado: string;
  fechaCreacion: string;
  ultimaActividad?: string;
  configuracion?: Record<string, any>;
  estadisticas?: Record<string, any>;
}

export interface Plan {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  caracteristicas: string[];
  duracion: number;
  tipo: string;
  popular: boolean;
  destacado: boolean;
  activo: boolean;
}

export interface Webhook {
  _id: string;
  nombre: string;
  url: string;
  metodo: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  eventos: string[];
  activo: boolean;
  userId: string;
  configuracion?: {
    timeout: number;
    reintentos: number;
    autenticacion?: {
      tipo: "none" | "bearer" | "basic" | "api_key";
      token?: string;
      usuario?: string;
      password?: string;
      apiKey?: string;
      headerName?: string;
    };
  };
  estadisticas?: {
    totalEnvios: number;
    exitosos: number;
    fallidos: number;
    ultimoEnvio?: string;
    ultimoExito?: string;
    ultimoError?: {
      fecha: string;
      mensaje: string;
      codigo?: number;
    };
  };
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Interface corregida para Chatbot con campos opcionales
export interface Chatbot {
  _id: string;
  nombreBot: string;
  descripcion?: string;
  tipoBot: "plantilla" | "ia" | "hibrido";
  userId: string;
  userEmail?: string;
  sesionId?: string;
  sesionName?: string;
  activo: boolean;
  fechaCreacion: string;
  ultimaActividad?: string;
  version?: string;
  tags?: string[];

  // Estadísticas con campos opcionales para evitar errores
  estadisticas?: {
    conversacionesIniciadas?: number;
    mensajesEnviados?: number;
    mensajesRecibidos?: number;
    mensajesProcesados?: number; // Calculado: mensajesEnviados + mensajesRecibidos
    respuestasEnviadas?: number;
    flujos_completados?: number;
    tasaRespuesta?: number;
    tiempoPromedioRespuesta?: number;
    errores?: number;
    ultimaActividad?: string;
  };

  configuracion?: {
    server?: string;
    apikey?: string | null;
    promt?: string;
    pais?: string;
    idioma?: string;
    temperature?: number;
    numerodemensajes?: number;
    delay_seconds?: number;
    autoActivar?: boolean;
    respuestaRapida?: boolean;
  };
}

export interface SystemStats {
  usuarios: {
    total: number;
    activos: number;
    inactivos: number;
  };
  sesiones: {
    total: number;
    activas: number;
    inactivas: number;
  };
  planes: {
    total: number;
    suscripcionesActivas: number;
  };
  chatbots: {
    total: number;
  };
  webhooks: {
    total: number;
    activos: number;
    inactivos: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
  error?: string;
}

// Tipos para formularios
export interface CreateUserData {
  email: string;
  password: string;
  rol: string;
  tipoplan: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  rol?: string;
  tipoplan?: string;
  activo?: boolean;
  numerodesesiones?: number;
}

export interface CreateChatbotData {
  nombreBot: string;
  descripcion?: string;
  tipoBot: "plantilla" | "ia" | "hibrido";
  userId: string;
  configIA?: {
    apikey?: string;
    server?: string;
    promt?: string;
    pais?: string;
    idioma?: string;
    temperature?: number;
    numerodemensajes?: number;
    delay_seconds?: number;
    activo?: boolean;
  };
  tags?: string[];
}

export interface UpdateChatbotData extends Partial<CreateChatbotData> {}

// Funciones helper para manejar estadísticas de manera segura
export const getStatValue = (
  estadisticas: Chatbot["estadisticas"] | undefined,
  key: keyof NonNullable<Chatbot["estadisticas"]>,
  defaultValue: number = 0
): number => {
  const value = estadisticas?.[key];
  return typeof value === "number" ? value : defaultValue;
};

export const formatStatValue = (
  estadisticas: Chatbot["estadisticas"] | undefined,
  key: keyof NonNullable<Chatbot["estadisticas"]>,
  defaultValue: number = 0
): string => {
  return getStatValue(estadisticas, key, defaultValue).toLocaleString();
};

// Constantes
export const BOT_TYPES = ["plantilla", "ia", "hibrido"] as const;
export type BotType = (typeof BOT_TYPES)[number];

export const COUNTRIES = [
  "colombia",
  "mexico",
  "argentina",
  "chile",
  "peru",
  "españa",
  "usa",
] as const;
export type Country = (typeof COUNTRIES)[number];

export const LANGUAGES = ["es", "en", "pt"] as const;
export type Language = (typeof LANGUAGES)[number];
