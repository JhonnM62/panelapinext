// 🔧 NUEVA FUNCIÓN: Limpiar webhooks órfanos automáticamente

const cleanupOrphanedWebhooks = async () => {
  if (!user?.nombrebot) return;
  
  try {
    console.log('🧹 [WEBHOOK CLEANUP] Iniciando limpieza de webhooks órfanos...');
    
    const userId = user.nombrebot;
    const availableSessionIds = sessions.map(s => s.id);
    
    console.log('🧹 [WEBHOOK CLEANUP] Sesiones disponibles:', availableSessionIds);
    
    // Verificar si hay webhook órfano
    const statsResponse = await fetch(
      `http://100.42.185.2:8015/webhook/stats/${userId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      }
    );
    
    if (statsResponse.ok) {
      const statsResult = await statsResponse.json();
      
      if (statsResult.success && statsResult.data && statsResult.data.configExists) {
        const webhookSessionId = statsResult.data.sessionId;
        
        // Verificar si la sesión del webhook existe
        if (!availableSessionIds.includes(webhookSessionId)) {
          console.log('🧹 [WEBHOOK CLEANUP] ⚠️ Webhook órfano detectado:', {
            webhookSessionId,
            availableSessions: availableSessionIds,
            webhookId: statsResult.data.webhookId
          });
          
          // Marcar para limpieza manual (no auto-eliminar por seguridad)
          toast({
            title: "⚠️ Webhook Órfano Detectado",
            description: `Webhook configurado para sesión ${webhookSessionId} que ya no existe. Ve a configuración para limpiarlo.`,
            variant: "destructive",
            duration: 8000
          });
          
          // Actualizar stats para reflejar el problema
          setWebhookStats(prev => prev ? {
            ...prev,
            webhookActive: false, // Marcar como inactivo
            orphaned: true // Flag especial
          } : null);
          
          console.log('🧹 [WEBHOOK CLEANUP] Usuario notificado sobre webhook órfano');
        } else {
          console.log('🧹 [WEBHOOK CLEANUP] ✅ Webhook válido, sesión existe');
        }
      } else {
        console.log('🧹 [WEBHOOK CLEANUP] No hay webhooks configurados');
      }
    }
  } catch (error) {
    console.warn('🧹 [WEBHOOK CLEANUP] Error en limpieza:', error);
  }
};

// Agregar esta función al useEffect de carga inicial:
useEffect(() => {
  if (!user) return;
  
  const loadDataAndCleanup = async () => {
    await loadInitialData();
    // Ejecutar limpieza después de cargar datos
    setTimeout(cleanupOrphanedWebhooks, 2000);
  };
  
  loadDataAndCleanup();
  
  // ... resto del useEffect
}, [user]);
