// 🔧 CORRECCIÓN: Mejor manejo de mensajes WebSocket
// Líneas ~1100-1150 del archivo webhooks.tsx

// REEMPLAZAR la función setupWebSocketHandlers con esta versión mejorada:

const setupWebSocketHandlers = (ws: WebSocket) => {
  if (!ws || !user?.nombrebot) return;
  
  console.log('[WS SINGLETON] ⚙️ Configurando handlers para WebSocket');
  
  // Autenticar
  const sessionUserId = selectedSessionId ? 
    sessions.find(s => s.id === selectedSessionId)?.nombresesion || user.nombrebot :
    user.nombrebot;
    
  console.log(`[WS SINGLETON] 🔑 Autenticando con userId: ${sessionUserId}`);
  
  ws.send(JSON.stringify({
    type: "authenticate",
    userId: sessionUserId,
  }));
  
  // 🔧 MEJORADO: Handler de mensajes con mejor manejo de errores
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[WS SINGLETON] 📨 Mensaje recibido:', data.type || data);
      
      switch (data.type) {
        case 'authenticated':
          console.log('[WS SINGLETON] ✅ Autenticado exitosamente');
          if (data.stats) setWebhookStats(data.stats);
          break;
          
        case 'notification':
          console.log('[WS SINGLETON] 🔔 Nueva notificación:', data);
          if (data.data) {
            const formattedNotification = {
              id: data.data.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sessionId: data.data.sessionId || "",
              eventType: data.data.eventType || "UNKNOWN",
              eventData: data.data.data || data.data.eventData || {},
              timestamp: data.data.timestamp || new Date().toISOString(),
              read: data.data.read || false,
              source: "whatsapp",
            };
            handleNewNotification(formattedNotification);
          }
          break;
          
        case 'stats_update':
          console.log('[WS SINGLETON] 📊 Actualización de stats:', data);
          if (data.data) {
            setWebhookStats(prev => ({
              ...prev,
              ...data.data
            }));
          }
          break;
          
        case 'error':
          // 🔧 CORREGIDO: Solo es un mensaje informativo, no un error crítico
          console.log('[WS SINGLETON] ℹ️ Mensaje de estado del servidor:', data.message || data.error || 'Sin detalles');
          // No mostrar como error, es información del servidor
          break;
          
        case 'ping':
        case 'pong':
        case 'heartbeat':
          // Ignorar mensajes de keep-alive silenciosamente
          console.log('[WS SINGLETON] 💓 Keep-alive recibido');
          break;
          
        default:
          // 🔧 MEJORADO: Log informativo en lugar de error
          console.log('[WS SINGLETON] 📋 Mensaje no manejado (tipo:', data.type || 'undefined', ')');
          console.log('[WS SINGLETON] 📋 Contenido del mensaje:', data);
          
          // Si es un evento de WhatsApp válido, procesarlo
          if (data.type && typeof data.type === "string" && data.type.includes("_")) {
            const eventNotification = {
              id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              sessionId: sessionUserId,
              eventType: data.type,
              eventData: data.data || data,
              timestamp: new Date().toISOString(),
              read: false,
              source: "whatsapp",
            };
            console.log('[WS SINGLETON] 🎯 Procesando como evento de WhatsApp:', eventNotification);
            handleNewNotification(eventNotification);
          }
          break;
      }
    } catch (error) {
      console.error('[WS SINGLETON] ❌ Error parsing WebSocket message:', error);
      console.error('[WS SINGLETON] ❌ Raw message:', event.data);
    }
  };
  
  // 🔧 MEJORADO: Handler de errores más específico
  ws.onerror = (error) => {
    console.error('[WS SINGLETON] ❌ WebSocket error:', error);
    // No reconectar automáticamente en errores, dejar que el singleton maneje
  };
  
  // 🔧 NUEVO: Handler de cierre con información detallada
  ws.onclose = (event) => {
    console.log('[WS SINGLETON] 🔴 WebSocket cerrado:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    setWsConnected(false);
    setWs(null);
  };
};
