# Script de Corrección de Configuración

## Problema Identificado

Hay una discrepancia en la configuración de puertos:
- Backend (Baileys API): configurado para puerto 8001 (según .env)  
- Frontend (Next.js): configurado para puerto 8015 (según .env)

## Soluciones Posibles

### Opción 1: Cambiar el backend al puerto 8015

Modificar `C:\APIS_v2.3\baileys-api\.env`:
```env
PORT=8015
```

### Opción 2: Cambiar el frontend al puerto 8001

Modificar `C:\appboots\.env`:
```env
NEXT_PUBLIC_API_URL=http://100.42.185.2:8001
```

### Opción 3: Verificar el puerto actual del servidor

Si el servidor ya está corriendo en 8015, mantener la configuración actual del frontend.

## Verificación

Para verificar en qué puerto está corriendo el servidor:

1. Acceder a `http://100.42.185.2:8015/health`
2. Si responde, el servidor está en 8015
3. Si no responde, probar `http://100.42.185.2:8001/health`

## Acción Recomendada

**Mantener el puerto 8015** ya que:
1. Es el que está configurado en el frontend
2. Parece ser el puerto en producción
3. Minimiza cambios en el sistema existente

**Pasos a seguir**:
1. Cambiar PORT=8015 en el .env del backend
2. Reiniciar el servidor de Baileys API
3. Verificar conectividad con el health endpoint

## Verificación Post-Cambio

Después de hacer los cambios, verificar:
- [ ] `http://100.42.185.2:8015/health` responde correctamente
- [ ] El frontend puede cargar sesiones sin errores
- [ ] La creación de sesiones funciona correctamente
- [ ] Los logs muestran la conexión correcta
