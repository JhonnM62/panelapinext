# Mejoras en la Gestión de Sesiones Web

## Resumen

Se han implementado mejoras significativas en la gestión de sesiones para mejorar la experiencia del usuario en todos los dispositivos, manteniendo la seguridad adecuada.

## Características Implementadas

### 1. Persistencia de Sesión en Recargas Normales (F5)

- **Funcionalidad**: La sesión se mantiene activa durante recargas normales (F5 o botón de refresh)
- **Implementación**: 
  - Uso de `localStorage` para persistir tokens de autenticación
  - Verificación automática de validez del token al cargar la página
  - Restauración automática del estado de usuario

### 2. Detección de Recarga Dura (Ctrl+F5)

- **Funcionalidad**: Fuerza el cierre de sesión cuando se detecta una recarga dura
- **Implementación**:
  - Detección de combinaciones de teclas `Ctrl+F5` y `Ctrl+Shift+R`
  - Verificación del estado de `sessionStorage` (vacío en recargas duras)
  - Uso de Performance Navigation API para detectar tipo de recarga
  - Limpieza completa de datos de sesión

### 3. Timeout de Inactividad (12 horas)

- **Funcionalidad**: Cierre automático de sesión después de 12 horas de inactividad
- **Implementación**:
  - Seguimiento de actividad del usuario (mouse, teclado, scroll, touch)
  - Almacenamiento de timestamp de última actividad en `localStorage`
  - Timer automático que verifica inactividad
  - Cierre de sesión automático al superar el límite

### 4. Middleware de Autenticación Mejorado

- **Funcionalidad**: Verificación robusta de tokens en el servidor
- **Implementación**:
  - Decodificación y validación de JWT
  - Verificación de expiración de tokens
  - Limpieza automática de cookies inválidas
  - Redirección automática a login cuando sea necesario

## Archivos Modificados/Creados

### Nuevos Archivos

1. **`src/hooks/useSessionPersistence.ts`**
   - Hook personalizado para gestión de persistencia de sesión
   - Manejo de eventos de actividad del usuario
   - Detección de recargas duras
   - Gestión de timeouts de inactividad

2. **`src/components/SessionInitializer.tsx`**
   - Componente de inicialización de sesión
   - Verificación automática al cargar la aplicación
   - Manejo de cambios de visibilidad de página

### Archivos Modificados

1. **`src/store/auth.ts`**
   - Función `logout` mejorada con razones de cierre
   - Limpieza específica según tipo de logout
   - Mejor logging para debugging

2. **`src/middleware.ts`**
   - Verificación robusta de tokens JWT
   - Múltiples fuentes de token (cookies, headers)
   - Limpieza automática de cookies inválidas

3. **`src/app/layout.tsx`**
   - Integración del `SessionInitializer`
   - Inicialización automática de gestión de sesión

4. **`src/app/dashboard/layout.tsx`**
   - Integración del hook `useSessionPersistence`
   - Callbacks personalizados para eventos de sesión

## Flujo de Funcionamiento

### Al Cargar la Aplicación

1. `SessionInitializer` verifica si es una ruta protegida
2. Busca token en `localStorage`
3. Detecta si es una recarga dura
4. Verifica timeout de inactividad
5. Valida el token JWT
6. Restaura o cierra la sesión según corresponda

### Durante el Uso

1. `useSessionPersistence` monitorea actividad del usuario
2. Actualiza timestamp de última actividad
3. Configura timer de inactividad
4. Detecta combinaciones de teclas para recarga dura

### Al Recargar (F5)

1. Se mantiene el token en `localStorage`
2. Se verifica validez del token
3. Se restaura la sesión automáticamente
4. Se actualiza la actividad del usuario

### Al Recargar Duro (Ctrl+F5)

1. Se detecta la recarga dura
2. Se limpia `sessionStorage` y `localStorage`
3. Se fuerza el cierre de sesión
4. Se redirige a login

### Por Inactividad

1. Timer detecta 12 horas sin actividad
2. Se cierra la sesión automáticamente
3. Se limpia toda la información de sesión
4. Se redirige a login

## Configuración

### Parámetros Configurables

- **Timeout de inactividad**: 12 horas (configurable en `useSessionPersistence`)
- **Eventos de actividad**: mousedown, mousemove, keypress, scroll, touchstart, click
- **Detección de recarga dura**: habilitada por defecto

### Variables de Entorno

No se requieren variables de entorno adicionales. La configuración se maneja a través de parámetros en los hooks y componentes.

## Seguridad

### Medidas Implementadas

1. **Validación de JWT**: Verificación de firma y expiración
2. **Limpieza de datos**: Eliminación completa de información sensible al cerrar sesión
3. **Detección de manipulación**: Verificación de integridad de sessionStorage
4. **Timeout automático**: Prevención de sesiones abandonadas

### Consideraciones

- Los tokens se almacenan en `localStorage` (persistente)
- La actividad se rastrea sin almacenar datos sensibles
- La detección de recarga dura previene bypass de seguridad
- El middleware valida tokens en cada request a rutas protegidas

## Testing

### Casos de Prueba

1. **Recarga Normal (F5)**:
   - Verificar que la sesión se mantiene
   - Confirmar que no se solicita login nuevamente

2. **Recarga Dura (Ctrl+F5)**:
   - Verificar que se cierra la sesión
   - Confirmar redirección a login

3. **Inactividad**:
   - Simular 12+ horas de inactividad
   - Verificar cierre automático de sesión

4. **Actividad Normal**:
   - Verificar que la actividad extiende la sesión
   - Confirmar que el timer se reinicia

## Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge (versiones modernas)
- **Dispositivos**: Desktop, tablet, móvil
- **APIs utilizadas**: 
  - Performance Navigation API
  - Web Storage API (localStorage, sessionStorage)
  - Visibility API

## Logs y Debugging

Todos los componentes incluyen logging detallado con prefijos identificables:

- `🔧 [Auth]`: Store de autenticación
- `🔒 [SessionPersistence]`: Hook de persistencia
- `🔄 [SessionInitializer]`: Inicializador de sesión
- `[Middleware]`: Middleware de autenticación

Los logs incluyen información sobre:
- Detección de recargas duras
- Timeouts de inactividad
- Validación de tokens
- Cambios de estado de sesión