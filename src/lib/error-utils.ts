/**
 * Utilidades robustas para manejo de errores en TypeScript
 * Soluciona problemas de tipo 'unknown' en catch blocks
 */

// Tipo para errores con propiedades adicionales
export interface ExtendedError extends Error {
  status?: number;
  details?: any;
  code?: string;
  statusCode?: number;
  response?: any;
}

/**
 * Convierte un error unknown a un objeto Error seguro
 * @param error - Error de tipo unknown
 * @returns ExtendedError con propiedades seguras
 */
export function toSafeError(error: unknown): ExtendedError {
  // Si ya es un Error, preservar todas sus propiedades
  if (error instanceof Error) {
    const extError = error as ExtendedError;
    return extError;
  }
  
  // Si es un objeto con mensaje
  if (typeof error === 'object' && error !== null) {
    const obj = error as any;
    const safeError: ExtendedError = new Error(
      obj.message || obj.error || 'Error desconocido'
    );
    
    // Copiar propiedades relevantes de manera segura
    if ('status' in obj) safeError.status = obj.status;
    if ('statusCode' in obj) safeError.statusCode = obj.statusCode;
    if ('code' in obj) safeError.code = obj.code;
    if ('details' in obj) safeError.details = obj.details;
    if ('response' in obj) safeError.response = obj.response;
    
    return safeError;
  }
  
  // Si es un string
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  // Para cualquier otro caso
  return new Error(String(error || 'Error desconocido'));
}

/**
 * Obtiene el mensaje de error de manera segura
 * @param error - Error de tipo unknown
 * @returns string con el mensaje de error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error !== null) {
    const obj = error as any;
    if (obj.message) return String(obj.message);
    if (obj.error) return String(obj.error);
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Error desconocido';
}

/**
 * Obtiene el código de estado HTTP de un error
 * @param error - Error de tipo unknown
 * @returns número de status o undefined
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    const obj = error as any;
    return obj.status || obj.statusCode || undefined;
  }
  return undefined;
}

/**
 * Obtiene detalles adicionales del error
 * @param error - Error de tipo unknown
 * @returns objeto con detalles o undefined
 */
export function getErrorDetails(error: unknown): any {
  if (typeof error === 'object' && error !== null) {
    const obj = error as any;
    return obj.details || obj.response || undefined;
  }
  return undefined;
}

/**
 * Loguea un error de manera segura con contexto
 * @param context - Contexto donde ocurrió el error
 * @param error - Error de tipo unknown
 * @param additionalInfo - Información adicional opcional
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, any>
): void {
  const safeError = toSafeError(error);
  
  console.error(`[${context}] Error:`, {
    message: safeError.message,
    status: safeError.status || safeError.statusCode,
    code: safeError.code,
    details: safeError.details,
    stack: process.env.NODE_ENV === 'development' ? safeError.stack : undefined,
    ...additionalInfo
  });
}

/**
 * Crea un objeto de respuesta de error estándar
 * @param error - Error de tipo unknown
 * @param defaultMessage - Mensaje por defecto si no se puede obtener uno
 * @returns Objeto con estructura estándar de error
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'Ha ocurrido un error'
): {
  success: boolean;
  error: string;
  message: string;
  status?: number;
  details?: any;
} {
  const safeError = toSafeError(error);
  
  return {
    success: false,
    error: safeError.message || defaultMessage,
    message: safeError.message || defaultMessage,
    status: safeError.status || safeError.statusCode,
    details: process.env.NODE_ENV === 'development' ? safeError.details : undefined
  };
}

/**
 * Type guard para verificar si un objeto tiene una propiedad específica
 * @param obj - Objeto a verificar
 * @param prop - Nombre de la propiedad
 * @returns boolean indicando si la propiedad existe
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return prop in obj;
}

/**
 * Maneja errores en funciones async de manera segura
 * @param fn - Función async a ejecutar
 * @param context - Contexto para logging
 * @returns Resultado o error manejado
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    logError(context, error);
    return {
      success: false,
      error: getErrorMessage(error)
    };
  }
}
