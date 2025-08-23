# 🔧 Fix: Error de Build en CI/CD - Configuración Deprecated

## ❌ Error Encontrado
```
Error: Page config in /app/src/app/api/upload/route.ts is deprecated. 
Replace `export const config=…` with the following:
```

## 🎯 Causa del Problema
El archivo `/src/app/api/upload/route.ts` estaba usando la sintaxis antigua de configuración de API routes de Next.js:

```typescript
// ❌ SINTAXIS ANTIGUA (Pages Router)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}
```

## ✅ Solución Aplicada

### 1. Eliminación de Configuración Deprecated
Se removió la configuración `export const config` que no es compatible con Next.js 14 App Router.

### 2. Agregado de Configuración Correcta
Se agregó la configuración correcta para Next.js 14 App Router:

```typescript
// ✅ SINTAXIS NUEVA (App Router)
export const runtime = 'nodejs'  // Use Node.js runtime
export const maxDuration = 60    // Tiempo máximo de ejecución en segundos
```

## 📁 Archivos Modificados
- `C:\APIS_v2.3\appboots\src\app\api\upload\route.ts`

## 🔍 Verificación
Se verificó que no existen otros archivos con la misma configuración deprecated usando búsqueda en todo el proyecto.

## 📝 Notas Importantes

### Manejo de Archivos Grandes en Next.js 14
- El límite de tamaño de archivo se maneja internamente en el código (50MB)
- La configuración `runtime = 'nodejs'` permite usar APIs de Node.js
- `maxDuration` establece el tiempo máximo de procesamiento

### Diferencias entre Pages Router y App Router

| Aspecto | Pages Router (Antiguo) | App Router (Nuevo) |
|---------|------------------------|-------------------|
| Configuración API | `export const config` | Configuración de segmentos |
| Body Parser | `config.api.bodyParser` | Manejado automáticamente |
| Runtime | Implícito | `export const runtime` |
| Timeouts | En vercel.json | `export const maxDuration` |

## 🚀 Próximos Pasos
1. Hacer commit de los cambios
2. Push a GitHub para activar el pipeline nuevamente
3. Verificar que el build se complete exitosamente

## 📅 Fecha de Corrección
22 de Agosto, 2025